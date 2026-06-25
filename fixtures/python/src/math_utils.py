"""
Simple math utility functions for testing.
"""


def add(a: int | float, b: int | float) -> int | float:
    """Add two numbers."""
    return a + b


def multiply(a: int | float, b: int | float) -> int | float:
    """Multiply two numbers."""
    return a * b


def divide(a: int | float, b: int | float) -> int | float:
    """Divide two numbers."""
    if b == 0:
        raise ValueError("Division by zero")
    return a / b


def fibonacci(n: int) -> int:
    """Return the nth Fibonacci number."""
    if n < 0:
        raise ValueError("Negative index not allowed")
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)


def is_palindrome(s: str) -> bool:
    """Check if a string is a palindrome."""
    cleaned = "".join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]
