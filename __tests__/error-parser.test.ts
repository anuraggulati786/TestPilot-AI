import { parseTestErrors, getFailingFilePaths } from "@/lib/error-parser";

describe("parseTestErrors", () => {
  it("extracts file:line from Jest stack traces", () => {
    const stderr = `FAIL src/foo.test.ts
  ● Test fails
    expect(received).toBe(expected)
    Difference: 1 vs 2
    at Object.<anonymous> (src/foo.ts:12:34)
    at Object.<anonymous> (src/bar.ts:5:10)`;
    const stdout = "  › Test fails\n";

    const errors = parseTestErrors(stderr, stdout);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors[0]).toMatchObject({
      testName: "Test fails",
      file: "src/foo.ts",
      line: 12,
    });
    expect(errors[1]).toMatchObject({
      testName: "Test fails",
      file: "src/bar.ts",
      line: 5,
    });
  });

  it("handles Pytest FAILED format", () => {
    const stderr = `FAILED tests/test_app.py::test_login`;
    const stdout = "";

    const errors = parseTestErrors(stderr, stdout);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]).toMatchObject({
      testName: "test_login",
      file: "tests/test_app.py",
      line: 1,
    });
  });

  it("extracts test names from Jest output", () => {
    const stdout = "  › should handle errors\n  › should validate input\n";
    const stderr = `FAIL test.js
  ● Test fails
    at (src/index.ts:10:20)`;

    const errors = parseTestErrors(stderr, stdout);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].testName).toBe("should handle errors");
  });

  it("returns empty array for empty stderr and stdout", () => {
    const errors = parseTestErrors("", "");
    expect(errors).toEqual([]);
  });

  it("deduplicates errors with same file:line", () => {
    const stderr = `Error 1
    at (src/file.ts:10:20)
Error 2
    at (src/file.ts:10:20)`;
    const stdout = "  › test\n";

    const errors = parseTestErrors(stderr, stdout);
    const fileLineErrors = errors.filter(
      (e) => e.file === "src/file.ts" && e.line === 10
    );
    expect(fileLineErrors.length).toBe(1);
  });

  it("handles multiple distinct errors", () => {
    const stderr = `Test 1 fail
    at (src/a.ts:1:1)
Test 2 fail
    at (src/b.ts:2:2)
Test 3 fail
    at (src/c.ts:3:3)`;
    const stdout = "  › test1\n  › test2\n  › test3\n";

    const errors = parseTestErrors(stderr, stdout);
    expect(errors.length).toBe(3);
    expect(errors[0].file).toBe("src/a.ts");
    expect(errors[1].file).toBe("src/b.ts");
    expect(errors[2].file).toBe("src/c.ts");
  });
});

describe("getFailingFilePaths", () => {
  it("returns unique file paths", () => {
    const errors = [
      { testName: "t1", file: "src/a.ts", line: 1, message: "err" },
      { testName: "t2", file: "src/a.ts", line: 2, message: "err" },
      { testName: "t3", file: "src/b.ts", line: 1, message: "err" },
    ];
    const paths = getFailingFilePaths(errors);
    expect(paths).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("returns empty array for no errors", () => {
    expect(getFailingFilePaths([])).toEqual([]);
  });
});
