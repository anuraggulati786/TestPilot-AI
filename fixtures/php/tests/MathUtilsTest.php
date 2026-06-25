<?php

namespace Example\Tests;

use Example\MathUtils;
use PHPUnit\Framework\TestCase;

class MathUtilsTest extends TestCase
{
    // =========================
    // PASSING TESTS
    // =========================

    public function testAddPositive(): void
    {
        $this->assertEquals(5, MathUtils::add(2, 3));
    }

    public function testAddNegative(): void
    {
        $this->assertEquals(-2, MathUtils::add(-1, -1));
    }

    public function testAddZero(): void
    {
        $this->assertEquals(5, MathUtils::add(5, 0));
    }

    public function testMultiply(): void
    {
        $this->assertEquals(12, MathUtils::multiply(3, 4));
    }

    public function testMultiplyByZero(): void
    {
        $this->assertEquals(0, MathUtils::multiply(5, 0));
    }

    public function testDivide(): void
    {
        $this->assertEquals(5, MathUtils::divide(10, 2));
    }

    public function testDivideByZero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Division by zero');
        MathUtils::divide(1, 0);
    }

    public function testFibonacciZero(): void
    {
        $this->assertEquals(0, MathUtils::fibonacci(0));
    }

    public function testFibonacciOne(): void
    {
        $this->assertEquals(1, MathUtils::fibonacci(1));
    }

    public function testFibonacciTen(): void
    {
        $this->assertEquals(55, MathUtils::fibonacci(10));
    }

    public function testPalindromeTrue(): void
    {
        $this->assertTrue(MathUtils::isPalindrome('racecar'));
    }

    public function testPalindromeFalse(): void
    {
        $this->assertFalse(MathUtils::isPalindrome('hello'));
    }

    // =========================
    // INTENTIONALLY FAILING TESTS
    // =========================

    public function testFailingAddWrongSum(): void
    {
        // FAILS: add(4, 5) = 9, expected 10
        $this->assertEquals(10, MathUtils::add(4, 5));
    }

    public function testFailingMultiplyWrongProduct(): void
    {
        // FAILS: multiply(6, 7) = 42, expected 1
        $this->assertEquals(1, MathUtils::multiply(6, 7));
    }

    public function testFailingFibonacciValue(): void
    {
        // FAILS: fibonacci(6) = 8, expected 13
        $this->assertEquals(13, MathUtils::fibonacci(6));
    }
}
