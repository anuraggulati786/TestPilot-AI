export type TestRunner =
  | "npm"
  | "pytest"
  | "cargo"
  | "go"
  | "maven"
  | "gradle"
  | "rspec"
  | "phpunit"
  | null;

export interface DetectionResult {
  runner: Exclude<TestRunner, null>;
  installCommand: string | null;
  testCommand: string;
  detectedBy: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  status: "passed" | "failed";
}

export interface TestLogs {
  stdout: string;
  stderr: string;
}

export interface TestFailure {
  test: string;
  file: string;
  line: number;
  error: string;
  explanation: string;
  suggestedFix: string;
}

export interface TestSuiteResult {
  /** Display name for the suite (e.g. "JavaScript (src/utils)") */
  name: string;
  /** Detected runner type */
  runner: TestRunner;
  /** Working directory relative to repo root */
  workDir: string;
  /** Test summary with correct counts */
  summary: TestSummary;
  /** Individual failures with AI analysis */
  failures: TestFailure[];
  /** Raw test output */
  logs: TestLogs;
}

export interface TestResult {
  /** Whether ALL tests across ALL suites passed */
  success: boolean;
  /** Overall aggregated summary across all suites */
  summary?: TestSummary;
  /** Per-suite results */
  suites?: TestSuiteResult[];
  /** Flattened failures from all suites (for backward compat / quick access) */
  failures?: TestFailure[];
  /** Aggregated logs from all suites */
  logs?: TestLogs;
  /** Top-level error (before tests even ran) */
  error?: string;
}

export interface AIAnalysis {
  error_origin: string;
  explanation: string;
  suggested_fix: string;
}
