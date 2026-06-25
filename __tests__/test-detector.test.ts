import { detectTestRunner } from "@/lib/test-detector";

describe("detectTestRunner", () => {
  it("detects npm from package.json", () => {
    const result = detectTestRunner(["package.json", "README.md"]);
    expect(result).toEqual({
      runner: "npm",
      installCommand: "npm install",
      testCommand: "npm test",
      detectedBy: "package.json",
    });
  });

  it("detects npm with pnpm lock file", () => {
    const result = detectTestRunner(["package.json", "pnpm-lock.yaml"]);
    expect(result).toEqual({
      runner: "npm",
      installCommand: "pnpm install",
      testCommand: "pnpm test",
      detectedBy: "package.json",
    });
  });

  it("detects npm with yarn lock file", () => {
    const result = detectTestRunner(["package.json", "yarn.lock"]);
    expect(result).toEqual({
      runner: "npm",
      installCommand: "yarn install",
      testCommand: "yarn test",
      detectedBy: "package.json",
    });
  });

  it("detects pytest from requirements.txt", () => {
    const result = detectTestRunner(["requirements.txt", "src/"]);
    expect(result).toEqual({
      runner: "pytest",
      installCommand: "pip install -r requirements.txt 2>/dev/null || python3 -m pip install -r requirements.txt 2>/dev/null || python -m pip install -r requirements.txt",
      testCommand: "python3 -m pytest 2>/dev/null || python -m pytest 2>/dev/null || pytest",
      detectedBy: "requirements.txt",
    });
  });

  it("detects pytest from pyproject.toml", () => {
    const result = detectTestRunner(["pyproject.toml", "src/"]);
    expect(result).toEqual({
      runner: "pytest",
      installCommand: "pip install -e . 2>/dev/null || python3 -m pip install -e . 2>/dev/null || python -m pip install -e .",
      testCommand: "python3 -m pytest 2>/dev/null || python -m pytest 2>/dev/null || pytest",
      detectedBy: "pyproject.toml",
    });
  });

  it("detects cargo from Cargo.toml", () => {
    const result = detectTestRunner(["Cargo.toml", "src/"]);
    expect(result).toEqual({
      runner: "cargo",
      installCommand: null,
      testCommand: "cargo test",
      detectedBy: "Cargo.toml",
    });
  });

  it("detects go from go.mod", () => {
    const result = detectTestRunner(["go.mod", "main.go"]);
    expect(result).toEqual({
      runner: "go",
      installCommand: "go mod download",
      testCommand: "go test ./...",
      detectedBy: "go.mod",
    });
  });

  it("detects maven from pom.xml", () => {
    const result = detectTestRunner(["pom.xml", "src/"]);
    expect(result).toEqual({
      runner: "maven",
      installCommand: null,
      testCommand: "mvn test",
      detectedBy: "pom.xml",
    });
  });

  it("detects gradle from build.gradle", () => {
    const result = detectTestRunner(["build.gradle", "src/"]);
    expect(result).toEqual({
      runner: "gradle",
      installCommand: null,
      testCommand: "gradle test",
      detectedBy: "build.gradle",
    });
  });

  it("detects rspec from Gemfile", () => {
    const result = detectTestRunner(["Gemfile", "lib/"]);
    expect(result).toEqual({
      runner: "rspec",
      installCommand: "bundle install",
      testCommand: "bundle exec rspec",
      detectedBy: "Gemfile",
    });
  });

  it("detects phpunit from composer.json", () => {
    const result = detectTestRunner(["composer.json", "src/"]);
    expect(result).toEqual({
      runner: "phpunit",
      installCommand: "composer install",
      testCommand: "phpunit",
      detectedBy: "composer.json",
    });
  });

  it("returns null for unknown project types", () => {
    const result = detectTestRunner(["Makefile", "Dockerfile", "README.md"]);
    expect(result).toBeNull();
  });

  it("returns null for empty file list", () => {
    const result = detectTestRunner([]);
    expect(result).toBeNull();
  });

  it("returns null for null/undefined", () => {
    const result = detectTestRunner(null as unknown as string[]);
    expect(result).toBeNull();
  });
});
