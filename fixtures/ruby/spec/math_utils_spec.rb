# frozen_string_literal: true

require_relative '../lib/math_utils'

RSpec.describe MathUtils do
  # =========================
  # PASSING TESTS
  # =========================

  describe '.add' do
    it 'adds positive numbers' do
      expect(described_class.add(2, 3)).to eq(5)
    end

    it 'adds negative numbers' do
      expect(described_class.add(-1, -1)).to eq(-2)
    end

    it 'adds zero' do
      expect(described_class.add(5, 0)).to eq(5)
    end
  end

  describe '.multiply' do
    it 'multiplies two numbers' do
      expect(described_class.multiply(3, 4)).to eq(12)
    end

    it 'multiplies by zero' do
      expect(described_class.multiply(5, 0)).to eq(0)
    end
  end

  describe '.divide' do
    it 'divides two numbers' do
      expect(described_class.divide(10, 2)).to eq(5)
    end

    it 'raises error on division by zero' do
      expect { described_class.divide(1, 0) }.to raise_error(ArgumentError, 'Division by zero')
    end
  end

  describe '.fibonacci' do
    it 'returns 0 for position 0' do
      expect(described_class.fibonacci(0)).to eq(0)
    end

    it 'returns 1 for position 1' do
      expect(described_class.fibonacci(1)).to eq(1)
    end

    it 'calculates fibonacci(10) correctly' do
      expect(described_class.fibonacci(10)).to eq(55)
    end
  end

  describe '.palindrome?' do
    it 'detects a palindrome' do
      expect(described_class.palindrome?('racecar')).to be true
    end

    it 'detects a non-palindrome' do
      expect(described_class.palindrome?('hello')).to be false
    end
  end

  # =========================
  # INTENTIONALLY FAILING TESTS
  # =========================

  describe 'intentional failures' do
    it 'FAILS: add(4, 5) should equal 10' do
      expect(described_class.add(4, 5)).to eq(10)
    end

    it 'FAILS: multiply(6, 7) should equal 1' do
      expect(described_class.multiply(6, 7)).to eq(1)
    end

    it 'FAILS: fibonacci(6) should equal 13' do
      expect(described_class.fibonacci(6)).to eq(13)
    end
  end
end
