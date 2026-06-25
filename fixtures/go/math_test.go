package mathutil

import "testing"

// =========================
// PASSING TESTS
// =========================

func TestAdd(t *testing.T) {
	if Add(2, 3) != 5 {
		t.Errorf("Add(2, 3) = %d; want 5", Add(2, 3))
	}
}

func TestAddNegative(t *testing.T) {
	if Add(-1, -1) != -2 {
		t.Errorf("Add(-1, -1) = %d; want -2", Add(-1, -1))
	}
}

func TestAddZero(t *testing.T) {
	if Add(5, 0) != 5 {
		t.Errorf("Add(5, 0) = %d; want 5", Add(5, 0))
	}
}

func TestMultiply(t *testing.T) {
	if Multiply(3, 4) != 12 {
		t.Errorf("Multiply(3, 4) = %d; want 12", Multiply(3, 4))
	}
}

func TestMultiplyByZero(t *testing.T) {
	if Multiply(5, 0) != 0 {
		t.Errorf("Multiply(5, 0) = %d; want 0", Multiply(5, 0))
	}
}

func TestDivide(t *testing.T) {
	result, err := Divide(10, 2)
	if err != nil {
		t.Fatalf("Divide(10, 2) returned error: %v", err)
	}
	if result != 5 {
		t.Errorf("Divide(10, 2) = %d; want 5", result)
	}
}

func TestDivideByZero(t *testing.T) {
	_, err := Divide(1, 0)
	if err == nil {
		t.Fatal("Divide(1, 0) expected error, got nil")
	}
	if err.Error() != "division by zero" {
		t.Errorf("expected 'division by zero', got %v", err)
	}
}

func TestFibonacciZero(t *testing.T) {
	if Fibonacci(0) != 0 {
		t.Errorf("Fibonacci(0) = %d; want 0", Fibonacci(0))
	}
}

func TestFibonacciOne(t *testing.T) {
	if Fibonacci(1) != 1 {
		t.Errorf("Fibonacci(1) = %d; want 1", Fibonacci(1))
	}
}

func TestFibonacciTen(t *testing.T) {
	if Fibonacci(10) != 55 {
		t.Errorf("Fibonacci(10) = %d; want 55", Fibonacci(10))
	}
}

func TestPalindromeTrue(t *testing.T) {
	if !IsPalindrome("racecar") {
		t.Error("IsPalindrome(\"racecar\") = false; want true")
	}
}

func TestPalindromeFalse(t *testing.T) {
	if IsPalindrome("hello") {
		t.Error("IsPalindrome(\"hello\") = true; want false")
	}
}

// =========================
// INTENTIONALLY FAILING TESTS
// =========================

func TestFailingAdd(t *testing.T) {
	// FAILS: Add(4, 5) = 9, expected 10
	if Add(4, 5) != 10 {
		t.Errorf("Add(4, 5) = %d; want 10", Add(4, 5))
	}
}

func TestFailingMultiply(t *testing.T) {
	// FAILS: Multiply(6, 7) = 42, expected 1
	if Multiply(6, 7) != 1 {
		t.Errorf("Multiply(6, 7) = %d; want 1", Multiply(6, 7))
	}
}

func TestFailingFibonacci(t *testing.T) {
	// FAILS: Fibonacci(6) = 8, expected 13
	if Fibonacci(6) != 13 {
		t.Errorf("Fibonacci(6) = %d; want 13", Fibonacci(6))
	}
}
