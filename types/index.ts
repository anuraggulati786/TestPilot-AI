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

export interface TestResult {
  success: boolean;
  summary?: TestSummary;
  failures?: TestFailure[];
  logs?: TestLogs;
  error?: string;
}

export interface AIAnalysis {
  error_origin: string;
  explanation: string;
  suggested_fix: string;
}
