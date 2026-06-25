# frozen_string_literal: true

# Simple math utility module for testing.
module MathUtils
  def self.add(a, b)
    a + b
  end

  def self.multiply(a, b)
    a * b
  end

  def self.divide(a, b)
    raise ArgumentError, 'Division by zero' if b == 0

    a / b
  end

  def self.fibonacci(n)
    raise ArgumentError, 'Negative index not allowed' if n < 0
    return 0 if n == 0
    return 1 if n == 1

    fibonacci(n - 1) + fibonacci(n - 2)
  end

  def self.palindrome?(str)
    cleaned = str.downcase.gsub(/[^a-z0-9]/, '')
    cleaned == cleaned.reverse
  end
end
