"""
Tests for math utility functions.
Contains both passing and intentionally failing tests.
"""
import pytest
from src.math_utils import add, multiply, divide, fibonacci, is_palindrome


# =========================
# PASSING TESTS
# =========================

class TestAdd:
    def test_adds_positive_numbers(self):
        assert add(2, 3) == 5

    def test_adds_negative_numbers(self):
        assert add(-1, -1) == -2

    def test_adds_zero(self):
        assert add(5, 0) == 5


class TestMultiply:
    def test_multiplies_two_numbers(self):
        assert multiply(3, 4) == 12

    def test_multiplies_by_zero(self):
        assert multiply(5, 0) == 0


class TestDivide:
    def test_divides_two_numbers(self):
        assert divide(10, 2) == 5

    def test_throws_on_division_by_zero(self):
        with pytest.raises(ValueError, match="Division by zero"):
            divide(1, 0)


class TestFibonacci:
    def test_zero(self):
        assert fibonacci(0) == 0

    def test_one(self):
        assert fibonacci(1) == 1

    def test_ten(self):
        assert fibonacci(10) == 55


class TestPalindrome:
    def test_simple_palindrome(self):
        assert is_palindrome("racecar") is True

    def test_non_palindrome(self):
        assert is_palindrome("hello") is False

    def test_ignores_spaces_and_punctuation(self):
        assert is_palindrome("A man, a plan, a canal: Panama") is True


# =========================
# INTENTIONALLY FAILING TESTS
# =========================

class TestIntentionalFailures:
    def test_add_wrong_sum(self):
        """FAILS: expects 10 but add(4, 5) = 9"""
        assert add(4, 5) == 10

    def test_multiply_wrong_product(self):
        """FAILS: expects 1 but multiply(6, 7) = 42"""
        assert multiply(6, 7) == 1

    def test_fibonacci_wrong_value(self):
        """FAILS: fibonacci(6) = 8, but we expect 13"""
        assert fibonacci(6) == 13

    def test_divide_should_fail(self):
        """FAILS: expects 3 but divide(9, 3) = 3 — this actually passes...
        Let's make it fail properly:"""
        assert divide(9, 3) == 0
