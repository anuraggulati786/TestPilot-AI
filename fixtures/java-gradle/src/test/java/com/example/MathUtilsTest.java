package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for MathUtils with both passing and intentionally failing tests.
 */
class MathUtilsTest {

    // =========================
    // PASSING TESTS
    // =========================

    @Test
    void testAddPositive() {
        assertEquals(5, MathUtils.add(2, 3));
    }

    @Test
    void testAddNegative() {
        assertEquals(-2, MathUtils.add(-1, -1));
    }

    @Test
    void testAddZero() {
        assertEquals(5, MathUtils.add(5, 0));
    }

    @Test
    void testMultiply() {
        assertEquals(12, MathUtils.multiply(3, 4));
    }

    @Test
    void testMultiplyByZero() {
        assertEquals(0, MathUtils.multiply(5, 0));
    }

    @Test
    void testDivide() {
        assertEquals(5, MathUtils.divide(10, 2));
    }

    @Test
    void testDivideByZero() {
        assertThrows(IllegalArgumentException.class, () -> MathUtils.divide(1, 0));
    }

    @Test
    void testFibonacciZero() {
        assertEquals(0, MathUtils.fibonacci(0));
    }

    @Test
    void testFibonacciOne() {
        assertEquals(1, MathUtils.fibonacci(1));
    }

    @Test
    void testFibonacciTen() {
        assertEquals(55, MathUtils.fibonacci(10));
    }

    @Test
    void testPalindromeTrue() {
        assertTrue(MathUtils.isPalindrome("racecar"));
    }

    @Test
    void testPalindromeFalse() {
        assertFalse(MathUtils.isPalindrome("hello"));
    }

    // =========================
    // INTENTIONALLY FAILING TESTS
    // =========================

    @Test
    void failingAddWrongSum() {
        // FAILS: add(4, 5) = 9, expected 10
        assertEquals(10, MathUtils.add(4, 5));
    }

    @Test
    void failingMultiplyWrongProduct() {
        // FAILS: multiply(6, 7) = 42, expected 1
        assertEquals(1, MathUtils.multiply(6, 7));
    }

    @Test
    void failingFibonacciValue() {
        // FAILS: fibonacci(6) = 8, expected 13
        assertEquals(13, MathUtils.fibonacci(6));
    }
}
