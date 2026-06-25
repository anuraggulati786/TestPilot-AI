export interface ParsedError {
  testName: string;
  file: string;
  line: number;
  message: string;
}

export function parseTestErrors(
  stderr: string,
  stdout: string
): ParsedError[] {
  const combined = `${stdout}\n${stderr}`;
  const errors: ParsedError[] = [];
  const seen = new Set<string>();

  // Extract Jest test names from lines with › (e.g. "  › should handle errors")
  const jestTestLines: string[] = [];
  for (const line of combined.split("\n")) {
    if (line.includes("›")) {
      jestTestLines.push(line.trim().replace(/^›\s*/, ""));
    }
  }

  // Extract file:line from stack traces: (file.ts:12:34)
  const stackTraceRegex = /\((.+?):(\d+):\d+\)/g;
  let match: RegExpExecArray | null;

  while ((match = stackTraceRegex.exec(combined)) !== null) {
    const file = match[1];
    const line = parseInt(match[2], 10);
    const dedupKey = `${file}:${line}`;

    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      // Match by index, fall back to last known test name, then "unknown"
      const testName =
        jestTestLines[errors.length] ??
        jestTestLines[jestTestLines.length - 1] ??
        "unknown";
      errors.push({
        testName,
        file,
        line,
        message: extractErrorMessage(combined, file, line),
      });
    }
  }

  // Handle Pytest FAILED format: FAILED file::test_name
  const pytestRegex = /FAILED\s+(\S+)::(\S+)/g;
  while ((match = pytestRegex.exec(combined)) !== null) {
    const file = match[1];
    const testName = match[2];
    const dedupKey = `${file}:${testName}`;

    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      errors.push({
        testName,
        file,
        line: 1,
        message: extractErrorMessage(combined, file, 1),
      });
    }
  }

  return errors;
}

function extractErrorMessage(
  text: string,
  file: string,
  line: number
): string {
  const lines = text.split("\n");
  const errorLines: string[] = [];
  let found = false;

  for (const lineText of lines) {
    if (lineText.includes(file) || lineText.includes(`:${line}`)) {
      found = true;
    }
    if (found) {
      errorLines.push(lineText.trim());
      if (errorLines.length >= 5) break;
    }
  }

  return errorLines.join("\n") || "Unknown error";
}

export function getFailingFilePaths(errors: ParsedError[]): string[] {
  return [...new Set(errors.map((e) => e.file))];
}
