import type { DetectionResult, TestRunner } from "@/types";

const runners: {
  marker: string;
  runner: Exclude<TestRunner, null>;
  installCommand: string | null;
  testCommand: string;
}[] = [
  {
    marker: "package.json",
    runner: "npm",
    installCommand: "npm install",
    testCommand: "npm test",
  },
  {
    marker: "requirements.txt",
    runner: "pytest",
    installCommand: "pip install -r requirements.txt 2>/dev/null || python3 -m pip install -r requirements.txt 2>/dev/null || python -m pip install -r requirements.txt",
    testCommand: "python3 -m pytest 2>/dev/null || python -m pytest 2>/dev/null || pytest",
  },
  {
    marker: "pyproject.toml",
    runner: "pytest",
    installCommand: "pip install -e . 2>/dev/null || python3 -m pip install -e . 2>/dev/null || python -m pip install -e .",
    testCommand: "python3 -m pytest 2>/dev/null || python -m pytest 2>/dev/null || pytest",
  },
  {
    marker: "Cargo.toml",
    runner: "cargo",
    installCommand: null,
    testCommand: "cargo test",
  },
  {
    marker: "go.mod",
    runner: "go",
    installCommand: "go mod download",
    testCommand: "go test ./...",
  },
  {
    marker: "pom.xml",
    runner: "maven",
    installCommand: null,
    testCommand: "mvn test",
  },
  {
    marker: "build.gradle",
    runner: "gradle",
    installCommand: null,
    testCommand: "gradle test",
  },
  {
    marker: "Gemfile",
    runner: "rspec",
    installCommand: "bundle install",
    testCommand: "bundle exec rspec",
  },
  {
    marker: "composer.json",
    runner: "phpunit",
    installCommand: "composer install",
    testCommand: "phpunit",
  },
];

export function detectTestRunner(files: string[]): DetectionResult | null {
  if (!files || files.length === 0) return null;

  const fileSet = new Set(files);

  // Check in priority order
  for (const entry of runners) {
    // For npm, also check for yarn.lock or pnpm-lock.yaml
    if (entry.marker === "package.json" && fileSet.has("package.json")) {
      return {
        runner: "npm",
        installCommand: fileSet.has("pnpm-lock.yaml")
          ? "pnpm install"
          : fileSet.has("yarn.lock")
            ? "yarn install"
            : "npm install",
        testCommand: fileSet.has("pnpm-lock.yaml")
          ? "pnpm test"
          : fileSet.has("yarn.lock")
            ? "yarn test"
            : "npm test",
        detectedBy: "package.json",
      };
    }

    if (fileSet.has(entry.marker)) {
      return {
        runner: entry.runner,
        installCommand: entry.installCommand,
        testCommand: entry.testCommand,
        detectedBy: entry.marker,
      };
    }
  }

  return null;
}
