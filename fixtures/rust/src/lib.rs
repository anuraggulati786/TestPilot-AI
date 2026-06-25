use std::fmt::Display;

/// Adds two numbers.
pub fn add<T: Into<i64>>(a: T, b: T) -> i64 {
    a.into() + b.into()
}

/// Multiplies two numbers.
pub fn multiply(a: i64, b: i64) -> i64 {
    a * b
}

/// Divides two numbers.
pub fn divide(a: i64, b: i64) -> i64 {
    if b == 0 {
        panic!("Division by zero");
    }
    a / b
}

/// Returns the nth Fibonacci number.
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

/// Checks if a string is a palindrome.
pub fn is_palindrome(s: &str) -> bool {
    let cleaned: String = s
        .chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(|c| c.to_lowercase())
        .collect();
    cleaned == cleaned.chars().rev().collect::<String>()
}

#[cfg(test)]
mod tests {
    use super::*;

    // =========================
    // PASSING TESTS
    // =========================

    #[test]
    fn test_add_positive() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, -1), -2);
    }

    #[test]
    fn test_add_zero() {
        assert_eq!(add(5, 0), 5);
    }

    #[test]
    fn test_multiply_basic() {
        assert_eq!(multiply(3, 4), 12);
    }

    #[test]
    fn test_multiply_by_zero() {
        assert_eq!(multiply(5, 0), 0);
    }

    #[test]
    fn test_divide_basic() {
        assert_eq!(divide(10, 2), 5);
    }

    #[test]
    #[should_panic(expected = "Division by zero")]
    fn test_divide_by_zero() {
        divide(1, 0);
    }

    #[test]
    fn test_fibonacci_zero() {
        assert_eq!(fibonacci(0), 0);
    }

    #[test]
    fn test_fibonacci_one() {
        assert_eq!(fibonacci(1), 1);
    }

    #[test]
    fn test_fibonacci_ten() {
        assert_eq!(fibonacci(10), 55);
    }

    #[test]
    fn test_palindrome_true() {
        assert!(is_palindrome("racecar"));
    }

    #[test]
    fn test_palindrome_false() {
        assert!(!is_palindrome("hello"));
    }

    #[test]
    fn test_palindrome_with_spaces() {
        assert!(is_palindrome("A man, a plan, a canal: Panama"));
    }

    // =========================
    // INTENTIONALLY FAILING TESTS
    // =========================

    #[test]
    fn failing_add_wrong_sum() {
        // FAILS: add(4, 5) = 9, expected 10
        assert_eq!(add(4, 5), 10);
    }

    #[test]
    fn failing_multiply_wrong_product() {
        // FAILS: multiply(6, 7) = 42, expected 1
        assert_eq!(multiply(6, 7), 1);
    }

    #[test]
    fn failing_fibonacci_value() {
        // FAILS: fibonacci(6) = 8, expected 13
        assert_eq!(fibonacci(6), 13);
    }
}
