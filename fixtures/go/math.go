package mathutil

// Add adds two integers.
func Add(a, b int) int {
	return a + b
}

// Multiply multiplies two integers.
func Multiply(a, b int) int {
	return a * b
}

// Divide divides two integers.
func Divide(a, b int) (int, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

// ErrDivisionByZero is returned when attempting to divide by zero.
var ErrDivisionByZero = &divByZeroError{}

type divByZeroError struct{}

func (e *divByZeroError) Error() string {
	return "division by zero"
}

// Fibonacci returns the nth Fibonacci number.
func Fibonacci(n int) int {
	if n < 0 {
		return -1
	}
	if n == 0 {
		return 0
	}
	if n == 1 {
		return 1
	}
	return Fibonacci(n-1) + Fibonacci(n-2)
}

// IsPalindrome checks if a string is a palindrome.
func IsPalindrome(s string) bool {
	runes := []rune(s)
	var cleaned []rune
	for _, r := range runes {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			cleaned = append(cleaned, r)
		} else if r >= 'A' && r <= 'Z' {
			cleaned = append(cleaned, r+32) // to lowercase
		}
	}
	for i, j := 0, len(cleaned)-1; i < j; i, j = i+1, j-1 {
		if cleaned[i] != cleaned[j] {
			return false
		}
	}
	return true
}
