const { add, multiply, divide, fibonacci, isPalindrome } = require("../src/math");

// =========================
// PASSING TESTS
// =========================

describe("add", () => {
  test("adds positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  test("adds negative numbers", () => {
    expect(add(-1, -1)).toBe(-2);
  });

  test("adds zero", () => {
    expect(add(5, 0)).toBe(5);
  });
});

describe("multiply", () => {
  test("multiplies two positive numbers", () => {
    expect(multiply(3, 4)).toBe(12);
  });

  test("multiplies by zero", () => {
    expect(multiply(5, 0)).toBe(0);
  });
});

describe("divide", () => {
  test("divides two numbers", () => {
    expect(divide(10, 2)).toBe(5);
  });

  test("throws on division by zero", () => {
    expect(() => divide(1, 0)).toThrow("Division by zero");
  });
});

describe("fibonacci", () => {
  test("returns 0 for position 0", () => {
    expect(fibonacci(0)).toBe(0);
  });

  test("returns 1 for position 1", () => {
    expect(fibonacci(1)).toBe(1);
  });

  test("calculates fibonacci(10) correctly", () => {
    expect(fibonacci(10)).toBe(55);
  });
});

describe("isPalindrome", () => {
  test("detects a simple palindrome", () => {
    expect(isPalindrome("racecar")).toBe(true);
  });

  test("detects a non-palindrome", () => {
    expect(isPalindrome("hello")).toBe(false);
  });

  test("ignores spaces and punctuation", () => {
    expect(isPalindrome("A man, a plan, a canal: Panama")).toBe(true);
  });
});

// =========================
// FAILING TESTS  (intentionally broken)
// =========================

describe("add — intentionally failing", () => {
  test("fails: expects wrong sum", () => {
    // BUG: Expected 10 but add(4, 5) = 9
    expect(add(4, 5)).toBe(10);
  });

  test("fails: wrong expected value for negative sum", () => {
    // BUG: Expected -5 but add(-2, -3) = -5 — wait this passes
    // Let's make it actually fail:
    expect(add(-2, 3)).toBe(0);
  });
});

describe("multiply — intentionally failing", () => {
  test("fails: expects wrong product", () => {
    // BUG: Expected 25 but multiply(5, 5) = 25 — that passes
    // Fixed:
    expect(multiply(6, 7)).toBe(1);
  });
});

describe("fibonacci — intentionally failing", () => {
  test("fails: expects wrong fibonacci value", () => {
    // BUG: fibonacci(6) = 8, but we expect 13
    expect(fibonacci(6)).toBe(13);
  });
});
