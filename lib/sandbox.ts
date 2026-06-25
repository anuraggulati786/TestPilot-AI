import { Sandbox } from "e2b";
import { detectTestRunner } from "@/lib/test-detector";
import { parseTestErrors, getFailingFilePaths } from "@/lib/error-parser";
import { analyzeErrors } from "@/lib/ai-analyzer";
import type { TestResult } from "@/types";

const E2B_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Common subdirectories to search for project config files
const COMMON_SUBDIRS = [
  "src",
  "app",
  "client",
  "server",
  "packages",
  "backend",
  "frontend",
  "web",
  "api",
];

interface RunnerDetection {
  detection: NonNullable<ReturnType<typeof detectTestRunner>>;
  workDir: string;
}

function extractRepoName(repoUrl: string): string {
  const match = repoUrl.match(/\/([^/]+?)(?:\.git)?$/);
  return match ? match[1] : "repo";
}

export async function testRepository(repoUrl: string): Promise<TestResult> {
  let sandbox: Sandbox | null = null;

  try {
    // 1. Create sandbox
    sandbox = await Sandbox.create({ timeoutMs: E2B_TIMEOUT_MS });

    // 2. Clone repo (sandbox-wide timeout handles individual commands)
    const repoName = extractRepoName(repoUrl);
    let cloneResult;
    try {
      cloneResult = await sandbox.commands.run(
        `git clone --depth 1 ${repoUrl} ${repoName}`
      );
    } catch (e) {
      return {
        success: false,
        error: `Failed to clone repository. ${e instanceof Error ? e.message : "Unknown error"}`,
      };
    }

    if (cloneResult.exitCode !== 0) {
      return {
        success: false,
        error: `Failed to clone repository: ${cloneResult.stderr || cloneResult.stdout}`,
        logs: { stdout: cloneResult.stdout, stderr: cloneResult.stderr },
      };
    }

    // 3. List root files and detect test runner
    let filesResult;
    try {
      filesResult = await sandbox.commands.run(
        `ls -1 ${repoName}/`
      );
    } catch (e) {
      return {
        success: false,
        error: `Repository was cloned but could not list its contents: ${e instanceof Error ? e.message : "Unknown error"}`,
      };
    }
    const rootFiles = filesResult.stdout
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    // Try to detect test runner at root, then fall back to subdirectories
    let runnerInfo: RunnerDetection | null = null;
    const rootDetection = detectTestRunner(rootFiles);

    if (rootDetection) {
      runnerInfo = { detection: rootDetection, workDir: repoName };
    } else {
      // Auto-discover subdirectories: check each root entry that is a directory
      const checkedDirs: string[] = [];
      for (const entry of rootFiles) {
        // Check if entry is a directory by trying to list it
        const checkResult = await sandbox.commands.run(
          `ls -1 "${repoName}/${entry}" 2>/dev/null || echo "__NOT_DIR__"`
        );
        if (checkResult.stdout.trim() === "__NOT_DIR__") continue;

        checkedDirs.push(entry);
        const subdirFiles = checkResult.stdout
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean);

        const subdirDetection = detectTestRunner(subdirFiles);
        if (subdirDetection) {
          runnerInfo = {
            detection: subdirDetection,
            workDir: `${repoName}/${entry}`,
          };
          break;
        }
      }

      if (!runnerInfo) {
        // Also check hardcoded common subdirectories as a safety net
        for (const subdir of COMMON_SUBDIRS) {
          if (checkedDirs.includes(subdir)) continue; // already checked
          const checkResult = await sandbox.commands.run(
            `ls -1 "${repoName}/${subdir}" 2>/dev/null || echo "__NOT_DIR__"`
          );
          if (checkResult.stdout.trim() === "__NOT_DIR__") continue;

          checkedDirs.push(subdir);
          const subdirFiles = checkResult.stdout
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean);

          const subdirDetection = detectTestRunner(subdirFiles);
          if (subdirDetection) {
            runnerInfo = {
              detection: subdirDetection,
              workDir: `${repoName}/${subdir}`,
            };
            break;
          }
        }
      }
    }

    if (!runnerInfo) {
      const foundFiles = rootFiles.length > 0
        ? `Files/folders found in root: ${rootFiles.join(", ")}`
        : "Root directory appears empty";
      return {
        success: false,
        error:
          `Could not detect a supported test runner. ${foundFiles}. ` +
          "Searched inside all subdirectories for config files like: package.json, requirements.txt, " +
          "Cargo.toml, go.mod, pom.xml, build.gradle, Gemfile, composer.json",
        logs: { stdout: filesResult.stdout, stderr: filesResult.stderr },
      };
    }

    const { detection, workDir } = runnerInfo;

    // 4. Install dependencies if needed
    if (detection.installCommand) {
      let installResult;
      try {
        installResult = await sandbox.commands.run(
          `cd ${workDir} && ${detection.installCommand}`
        );
      } catch (e) {
        return {
          success: false,
          error: `Install command failed to run: ${e instanceof Error ? e.message : "Unknown error"}. Try installing dependencies manually.`,
        };
      }

      if (installResult.exitCode !== 0) {
        return {
          success: false,
          error: `Install failed: ${(installResult.stderr || "").slice(0, 2000)}`,
          logs: {
            stdout: installResult.stdout,
            stderr: installResult.stderr,
          },
        };
      }
    }

    // 5. Determine the best test command to run
    let effectiveTestCommand = detection.testCommand;

    // For npm projects, check package.json for available test scripts
    if (detection.runner === "npm") {
      try {
        const pkgJsonRaw = String(
          await sandbox.files.read(`${workDir}/package.json`)
        );
        const pkgJson = JSON.parse(pkgJsonRaw);
        const scripts = pkgJson.scripts || {};
        const devDeps = { ...pkgJson.devDependencies, ...pkgJson.dependencies };

        // If "test" script is missing, try alternatives
        if (!scripts.test) {
          // Check for common test scripts
          const altScripts = ["jest", "vitest", "mocha", "ava", "tape", "test:unit", "test:all", "test:ci", "test:watch"];
          let foundAlt = false;
          for (const alt of altScripts) {
            if (scripts[alt]) {
              effectiveTestCommand = `npm run ${alt}`;
              foundAlt = true;
              break;
            }
          }

          // If no script found, try running test frameworks directly via npx
          if (!foundAlt) {
            const frameworks = ["jest", "vitest", "mocha", "ava"];
            for (const fw of frameworks) {
              if (devDeps[fw]) {
                effectiveTestCommand = `npx ${fw}`;
                foundAlt = true;
                break;
              }
            }
          }

          if (!foundAlt) {
            // No test framework detected — just run the default command (will show helpful error)
            effectiveTestCommand = detection.testCommand;
          }
        }
      } catch {
        // If we can't read/parse package.json, use the default command
        effectiveTestCommand = detection.testCommand;
      }
    }

    // 6. Run tests
    let testResult;
    let testError: unknown = null;
    let stdout = "";
    let stderr = "";
    try {
      testResult = await sandbox.commands.run(
        `cd ${workDir} && ${effectiveTestCommand}`
      );
      stdout = testResult.stdout;
      stderr = testResult.stderr;
    } catch (e) {
      testError = e;
      // E2B SDK may throw on non-zero exit — extract stdout/stderr from the error
      stdout = (e && typeof e === "object" && "stdout" in e) ? String((e as any).stdout) : "";
      stderr = (e && typeof e === "object" && "stderr" in e) ? String((e as any).stderr) : (e instanceof Error ? e.message : "Unknown error");
      // Treat as failed tests with output, not a command execution failure
    }

    // 7. Check if tests passed
    // Handle both normal return and thrown error (E2B may throw on non-zero exit)
    let exitCode: number;
    if (testResult) {
      exitCode = testResult.exitCode;
    } else if (testError && typeof testError === "object" && "exitCode" in testError) {
      exitCode = (testError as any).exitCode;
    } else {
      exitCode = 1;
    }
    if (exitCode === 0) {
      // Extract summary: "Tests: 5 passed, 5 total"
      const totalMatch = stdout.match(/Tests:\s+(\d+)\s+(?:passed|failed)/);
      const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

      return {
        success: true,
        summary: {
          total,
          passed: total,
          failed: 0,
          status: "passed",
        },
        logs: { stdout, stderr },
      };
    }

    // 8. Tests failed — parse errors
    const errors = parseTestErrors(stderr, stdout);
    const failingPaths = getFailingFilePaths(errors);

    // 9. Read failing files from sandbox
    const currentSandbox = sandbox; // local ref for type narrowing
    const fileContents = await Promise.all(
      failingPaths.map(async (filePath) => {
        try {
          const content = String(
            await currentSandbox.files.read(
              `${workDir}/${filePath}`
            )
          );
          return { path: filePath, content };
        } catch {
          return { path: filePath, content: "// File could not be read" };
        }
      })
    );

    // 10. Analyze errors with AI
    const errorLines = errors.map((e) => e.line);
    const aiResults = await analyzeErrors(
      stderr,
      stdout,
      fileContents,
      errorLines
    );

    // 11. Map AI results to TestFailure format
    const failures = aiResults.map((ai) => {
      // Parse error_origin "file.ts:12" into file and line
      const originMatch = ai.error_origin.match(/(.+):(\d+)$/);
      const file = originMatch ? originMatch[1] : "unknown";
      const line = originMatch ? parseInt(originMatch[2], 10) : 1;

      // Find matching parsed error
      const matchingError = errors.find(
        (e) => e.file === file || e.file.includes(file) || file.includes(e.file)
      );

      return {
        test: matchingError?.testName || ai.error_origin,
        file,
        line,
        error: matchingError?.message || "Test failure detected",
        explanation: ai.explanation,
        suggestedFix: ai.suggested_fix,
      };
    });

    return {
      success: false,
      summary: {
        total: failures.length || errors.length || 1,
        passed: 0,
        failed: failures.length || errors.length || 1,
        status: "failed",
      },
      failures,
      logs: { stdout, stderr },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const errorDetail = err && typeof err === "object" && "stdout" in err
      ? `${message}\nstdout: ${(err as any).stdout}\nstderr: ${(err as any).stderr}`
      : message;
    return {
      success: false,
      error: `Test execution error: ${errorDetail}`,
    };
  } finally {
    // 11. Always kill sandbox
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch {
        // Ignore kill errors
      }
    }
  }
}
