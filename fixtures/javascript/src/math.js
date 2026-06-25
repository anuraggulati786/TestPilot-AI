/**
 * Adds two numbers.
 */
function add(a, b) {
  return a + b;
}

/**
 * Multiplies two numbers.
 */
function multiply(a, b) {
  return a * b;
}

/**
 * Divides two numbers.
 * @param {number} a - Numerator
 * @param {number} b - Denominator
 */
function divide(a, b) {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

/**
 * Returns the nth Fibonacci number.
 * @param {number} n - Position in Fibonacci sequence
 */
function fibonacci(n) {
  if (n < 0) throw new Error("Negative index not allowed");
  if (n === 0) return 0;
  if (n === 1) return 1;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/**
 * Checks if a string is a palindrome.
 */
function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}

module.exports = { add, multiply, divide, fibonacci, isPalindrome };
