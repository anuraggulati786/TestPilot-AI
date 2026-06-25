import { Sandbox } from "e2b";
import { detectTestRunner } from "@/lib/test-detector";
import { parseTestErrors, getFailingFilePaths } from "@/lib/error-parser";
import { analyzeErrors } from "@/lib/ai-analyzer";
import type { TestResult, TestSuiteResult, TestSummary, DetectionResult, TestFailure } from "@/types";

const E2B_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (needed for multiple suites)

/** Config files that indicate a test runner, in priority order */
const CONFIG_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "Gemfile",
  "composer.json",
];

function extractRepoName(repoUrl: string): string {
  const match = repoUrl.match(/\/([^/]+?)(?:\.git)?$/);
  return match ? match[1] : "repo";
}

/**
 * Parse test summary counts from stdout/stderr using runner-specific patterns.
 * Returns { passed, failed, total } or null if it can't parse.
 */
function parseTestCounts(stdout: string, stderr: string): { passed: number; failed: number; total: number } | null {
  const combined = `${stdout}\n${stderr}`;

  // Jest / many Node runners: "Tests:       4 failed, 14 passed, 18 total"
  const jestMatch = combined.match(/Tests:\s*(?:(\d+)\s+failed,\s*)?(\d+)\s+passed,?\s*(\d+)\s+total/i);
  if (jestMatch) {
    const passed = parseInt(jestMatch[2], 10);
    const total = parseInt(jestMatch[3], 10);
    const failed = total - passed;
    return { passed, failed, total };
  }

  // Pytest: "= 14 passed, 4 failed in 0.12s ="
  const pytestMatch = combined.match(/(\d+)\s+passed,\s*(\d+)\s+failed/i);
  if (pytestMatch) {
    const passed = parseInt(pytestMatch[1], 10);
    const failed = parseInt(pytestMatch[2], 10);
    return { passed, failed, total: passed + failed };
  }

  // Pytest (all passed): "= 18 passed in 0.12s ="
  const pytestAllPassed = combined.match(/=+\s*(\d+)\s+passed\s+in\s+/i);
  if (pytestAllPassed) {
    const passed = parseInt(pytestAllPassed[1], 10);
    return { passed, failed: 0, total: passed };
  }

  // Cargo: "test result: FAILED. 15 passed; 3 failed;"
  const cargoMatch = combined.match(/test result: \w+\.\s*(\d+)\s+passed;\s*(\d+)\s+failed/i);
  if (cargoMatch) {
    const passed = parseInt(cargoMatch[1], 10);
    const failed = parseInt(cargoMatch[2], 10);
    return { passed, failed, total: passed + failed };
  }

  // Cargo (all passed): "test result: ok. 18 passed;"
  const cargoOkMatch = combined.match(/test result: ok\.\s*(\d+)\s+passed/i);
  if (cargoOkMatch) {
    const passed = parseInt(cargoOkMatch[1], 10);
    return { passed, failed: 0, total: passed };
  }

  // Maven: "Tests run: 15, Failures: 3, Errors: 0"
  const mavenMatch = combined.match(/Tests run:\s*(\d+),\s*Failures:\s*(\d+)/i);
  if (mavenMatch) {
    const total = parseInt(mavenMatch[1], 10);
    const failed = parseInt(mavenMatch[2], 10);
    const passed = total - failed;
    return { passed, failed, total };
  }

  // Gradle: similar to Maven
  const gradleMatch = combined.match(/(\d+)\s+tests?\s+completed,?\s*(\d+)\s+failed/i);
  if (gradleMatch) {
    const total = parseInt(gradleMatch[1], 10);
    const failed = parseInt(gradleMatch[2], 10);
    const passed = total - failed;
    return { passed, failed, total };
  }

  // RSpec: "13 examples, 3 failures"
  const rspecMatch = combined.match(/(\d+)\s+examples?,\s*(\d+)\s+failures?/i);
  if (rspecMatch) {
    const total = parseInt(rspecMatch[1], 10);
    const failed = parseInt(rspecMatch[2], 10);
    const passed = total - failed;
    return { passed, failed, total };
  }

  // RSpec (all passed): "18 examples, 0 failures"
  const rspecAllPassed = combined.match(/(\d+)\s+examples?,\s*0\s+failures?/i);
  if (rspecAllPassed) {
    const total = parseInt(rspecAllPassed[1], 10);
    return { passed: total, failed: 0, total };
  }

  // PHPUnit: "Tests: 15, Assertions: 15, Failures: 3."
  const phpunitMatch = combined.match(/Tests:\s*(\d+),\s*(?:Assertions:\s*\d+,?\s*)?Failures:\s*(\d+)/i);
  if (phpunitMatch) {
    const total = parseInt(phpunitMatch[1], 10);
    const failed = parseInt(phpunitMatch[2], 10);
    const passed = total - failed;
    return { passed, failed, total };
  }

  // PHPUnit (all passed): "OK (15 tests, 15 assertions)"
  const phpunitOkMatch = combined.match(/OK\s*\((\d+)\s+tests?/i);
  if (phpunitOkMatch) {
    const total = parseInt(phpunitOkMatch[1], 10);
    return { passed: total, failed: 0, total };
  }

  // Go: "ok  package  0.001s" or "FAIL  package  0.001s"
  const goOkMatch = combined.match(/^ok\s+/m);
  const goFailMatch = combined.match(/^FAIL\s+/m);

  // Count Go test results by looking for "ok" lines (each is a package)
  if (goOkMatch || goFailMatch) {
    const okLines = (combined.match(/^ok\s+/gm) || []).length;
    const failLines = (combined.match(/^FAIL\s+/gm) || []).length;
    // Go doesn't report individual test counts easily, estimate from summary
    const passed = okLines > 0 ? okLines : 0;
    const failed = failLines;
    return { passed, failed, total: passed + failed };
  }

  return null;
}

/**
 * Build a user-friendly suite name from the work directory and runner.
 */
function buildSuiteName(workDir: string, runner: string, detectedBy: string): string {
  // If at root, it's the main project
  if (!workDir.includes("/")) {
    return `${runner} (root)`;
  }
  // Extract the subdirectory path
  const dir = workDir.substring(workDir.indexOf("/") + 1);
  // Capitalize runner name
  const runnerName = runner.charAt(0).toUpperCase() + runner.slice(1);
  return `${runnerName} (${dir})`;
}

/**
 * Run a single test suite in a given work directory.
 */
async function runSingleSuite(
  sandbox: Sandbox,
  repoName: string,
  workDir: string,
  detection: DetectionResult,
  suiteIndex: number
): Promise<TestSuiteResult> {
  const { runner, installCommand, testCommand, detectedBy } = detection;
  const name = buildSuiteName(workDir, runner, detectedBy);

  // 1. Install dependencies if needed
  if (installCommand) {
    try {
      const installResult = await sandbox.commands.run(
        `cd ${workDir} && ${installCommand}`
      );
      if (installResult.exitCode !== 0) {
        return {
          name,
          runner,
          workDir,
          summary: { total: 0, passed: 0, failed: 0, status: "failed" },
          failures: [],
          logs: { stdout: installResult.stdout, stderr: installResult.stderr },
        };
      }
    } catch (e) {
      return {
        name,
        runner,
        workDir,
        summary: { total: 0, passed: 0, failed: 0, status: "failed" },
        failures: [],
        logs: { stdout: "", stderr: e instanceof Error ? e.message : "Install failed" },
      };
    }
  }

  // 2. Determine effective test command (for npm, check for scripts)
  let effectiveTestCommand = testCommand;

  if (runner === "npm") {
    try {
      const pkgJsonRaw = String(await sandbox.files.read(`${workDir}/package.json`));
      const pkgJson = JSON.parse(pkgJsonRaw);
      const scripts = pkgJson.scripts || {};
      const devDeps = { ...pkgJson.devDependencies, ...pkgJson.dependencies };

      if (!scripts.test) {
        const altScripts = ["jest", "vitest", "mocha", "ava", "tape", "test:unit", "test:all", "test:ci"];
        let foundAlt = false;
        for (const alt of altScripts) {
          if (scripts[alt]) {
            effectiveTestCommand = `npm run ${alt}`;
            foundAlt = true;
            break;
          }
        }

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
      }
    } catch {
      // Use default
    }
  }

  // 3. Run tests
  let stdout = "";
  let stderr = "";
  let exitCode = 1;

  try {
    const testResult = await sandbox.commands.run(
      `cd ${workDir} && ${effectiveTestCommand}`
    );
    stdout = testResult.stdout;
    stderr = testResult.stderr;
    exitCode = testResult.exitCode;
  } catch (e: any) {
    stdout = e?.stdout ? String(e.stdout) : "";
    stderr = e?.stderr ? String(e.stderr) : (e instanceof Error ? e.message : "Unknown error");
    exitCode = e?.exitCode ?? 1;
  }

  // 4. Parse test counts from output
  const counts = parseTestCounts(stdout, stderr);

  // 5. Determine summary
  let summary: TestSummary;
  let failures: TestFailure[] = [];

  if (exitCode === 0 && counts) {
    // All tests passed (or some failed but exit code 0? unlikely but handle)
    summary = {
      total: counts.total,
      passed: counts.passed,
      failed: counts.failed,
      status: counts.failed === 0 ? "passed" : "failed",
    };
  } else if (exitCode !== 0 || (counts && counts.failed > 0)) {
    // Tests failed — parse errors and AI analyze
    const actualTotal = counts?.total ?? 0;
    const actualPassed = counts?.passed ?? 0;
    const actualFailed = counts?.failed ?? 1;

    summary = {
      total: actualTotal || actualFailed,
      passed: actualPassed,
      failed: actualFailed,
      status: "failed",
    };

    if (actualFailed > 0) {
      // Parse errors from output
      const errors = parseTestErrors(stderr, stdout);
      const failingPaths = getFailingFilePaths(errors);

      // Read failing files
      const fileContents = await Promise.all(
        failingPaths.map(async (filePath) => {
          try {
            const content = String(await sandbox.files.read(`${workDir}/${filePath}`));
            return { path: filePath, content };
          } catch {
            return { path: filePath, content: "// File could not be read" };
          }
        })
      );

      // Analyze with AI (pass suite context)
      const errorLines = errors.map((e) => e.line);
      const aiResults = await analyzeErrors(stderr, stdout, fileContents, errorLines);

      // Map AI results to TestFailure format
      failures = aiResults.map((ai) => {
        const originMatch = ai.error_origin.match(/(.+):(\d+)$/);
        const file = originMatch ? originMatch[1] : "unknown";
        const line = originMatch ? parseInt(originMatch[2], 10) : 1;

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
    }
  } else {
    // Can't parse counts, use exit code
    summary = {
      total: exitCode === 0 ? 1 : 1,
      passed: exitCode === 0 ? 1 : 0,
      failed: exitCode === 0 ? 0 : 1,
      status: exitCode === 0 ? "passed" : "failed",
    };
  }

  return {
    name,
    runner,
    workDir,
    summary,
    failures,
    logs: { stdout, stderr },
  };
}

export async function testRepository(repoUrl: string): Promise<TestResult> {
  let sandbox: Sandbox | null = null;

  try {
    // 1. Create sandbox
    sandbox = await Sandbox.create({ timeoutMs: E2B_TIMEOUT_MS });

    // 2. Clone repo
    const repoName = extractRepoName(repoUrl);
    try {
      const cloneResult = await sandbox.commands.run(
        `git clone --depth 1 ${repoUrl} ${repoName}`
      );
      if (cloneResult.exitCode !== 0) {
        return {
          success: false,
          error: `Failed to clone repository: ${cloneResult.stderr || cloneResult.stdout}`,
          logs: { stdout: cloneResult.stdout, stderr: cloneResult.stderr },
        };
      }
    } catch (e) {
      return {
        success: false,
        error: `Failed to clone repository. ${e instanceof Error ? e.message : "Unknown error"}`,
      };
    }

    // 3. Recursively find all config files in the repo using `find`
    //    We exclude node_modules, target, .git, vendor, etc.
    let findResult;
    try {
      findResult = await sandbox.commands.run(
        `cd ${repoName} && find . -type f \\( ${CONFIG_FILES.map(f => `-name "${f}"`).join(" -o ")} \\) ` +
        `-not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/target/*" ` +
        `-not -path "*/vendor/*" -not -path "*/.gradle/*" -not -path "*/build/*" ` +
        `-not -path "*/__pycache__/*" -not -path "*/.bundle/*" ` +
        `-not -path "*/.next/*" 2>/dev/null || true`
      );
    } catch {
      return {
        success: false,
        error: "Could not scan repository contents.",
      };
    }

    const configFiles = findResult.stdout
      .split("\n")
      .map((f) => f.trim().replace(/^\.\//, ""))
      .filter(Boolean);

    if (configFiles.length === 0) {
      return {
        success: false,
        error:
          "Could not detect any supported test runner in the repository. " +
          "Searched recursively for: " + CONFIG_FILES.join(", "),
      };
    }

    // 4. Group config files by directory — for each directory, detect the runner
    const dirConfigs = new Map<string, string[]>();

    for (const configFile of configFiles) {
      const dir = configFile.includes("/")
        ? configFile.substring(0, configFile.lastIndexOf("/"))
        : ".";
      const file = configFile.includes("/")
        ? configFile.substring(configFile.lastIndexOf("/") + 1)
        : configFile;

      // Normalize root directory
      const normalizedDir = dir === "." ? repoName : `${repoName}/${dir}`;

      if (!dirConfigs.has(normalizedDir)) {
        dirConfigs.set(normalizedDir, []);
      }
      dirConfigs.get(normalizedDir)!.push(file);
    }

    // 5. Detect runner for each directory
    type DirDetection = { workDir: string; detection: DetectionResult; files: string[] };
    const detections: DirDetection[] = [];

    for (const [workDir, files] of dirConfigs.entries()) {
      const detection = detectTestRunner(files);
      if (detection) {
        detections.push({ workDir, detection, files });
      }
    }

    if (detections.length === 0) {
      return {
        success: false,
        error: "Found config files but none matched a supported test runner pattern.",
      };
    }

    // 6. Run each detected test suite
    const suiteResults: TestSuiteResult[] = [];
    for (let i = 0; i < detections.length; i++) {
      const { workDir, detection } = detections[i];
      const suite = await runSingleSuite(sandbox, repoName, workDir, detection, i);
      suiteResults.push(suite);
    }

    // 7. Aggregate results
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTotal = 0;
    const allFailures: TestFailure[] = [];
    let allStdout = "";
    let allStderr = "";
    let anyFailed = false;

    for (const suite of suiteResults) {
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
      totalTotal += suite.summary.total;
      allFailures.push(...suite.failures);
      anyFailed = anyFailed || suite.summary.status === "failed";
      allStdout += `\n===== ${suite.name} =====\n${suite.logs.stdout}`;
      allStderr += `\n===== ${suite.name} =====\n${suite.logs.stderr}`;
    }

    const overallStatus: "passed" | "failed" = anyFailed ? "failed" : "passed";

    return {
      success: !anyFailed,
      summary: {
        total: totalTotal,
        passed: totalPassed,
        failed: totalFailed,
        status: overallStatus,
      },
      suites: suiteResults,
      failures: allFailures,
      logs: {
        stdout: allStdout.trim(),
        stderr: allStderr.trim(),
      },
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
    if (sandbox) {
      try { await sandbox.kill(); } catch { /* ignore */ }
    }
  }
}
