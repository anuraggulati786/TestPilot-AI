<?php

namespace Example;

class MathUtils
{
    public static function add(int $a, int $b): int
    {
        return $a + $b;
    }

    public static function multiply(int $a, int $b): int
    {
        return $a * $b;
    }

    public static function divide(int $a, int $b): int
    {
        if ($b === 0) {
            throw new \InvalidArgumentException("Division by zero");
        }
        return intdiv($a, $b);
    }

    public static function fibonacci(int $n): int
    {
        if ($n < 0) {
            throw new \InvalidArgumentException("Negative index not allowed");
        }
        if ($n === 0) return 0;
        if ($n === 1) return 1;
        return self::fibonacci($n - 1) + self::fibonacci($n - 2);
    }

    public static function isPalindrome(string $s): bool
    {
        $cleaned = strtolower(preg_replace('/[^a-z0-9]/', '', $s));
        return $cleaned === strrev($cleaned);
    }
}
