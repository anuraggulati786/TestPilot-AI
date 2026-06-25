# 🧪 Test Fixtures

This directory contains minimal test fixture projects for each language supported by Auto Test & Fix. Each fixture includes both **passing** and **intentionally failing** tests so you can test the app's full functionality.

## Supported Languages

| Language | Runner | Config File | Passing | Failing | Total |
|----------|--------|-------------|---------|---------|-------|
| JavaScript/TypeScript | `npm test` (Jest) | `package.json` | 14 | 4 | 18 |
| Python | `pytest` | `requirements.txt` | 14 | 4 | 18 |
| Rust | `cargo test` | `Cargo.toml` | 15 | 3 | 18 |
| Go | `go test ./...` | `go.mod` | 12 | 3 | 15 |
| Java (Maven) | `mvn test` | `pom.xml` | 12 | 3 | 15 |
| Java (Gradle) | `gradle test` | `build.gradle` | 12 | 3 | 15 |
| Ruby | `bundle exec rspec` | `Gemfile` | 12 | 3 | 15 |
| PHP | `phpunit` | `composer.json` | 12 | 3 | 15 |

## Fixture Structure

```
fixtures/
├── javascript/     # npm + Jest
├── python/         # pip + pytest
├── rust/           # Cargo
├── go/             # Go testing
├── java-maven/     # Maven + JUnit
├── java-gradle/    # Gradle + JUnit
├── ruby/           # Bundler + RSpec
└── php/            # Composer + PHPUnit
```

## How to Test

Paste any fixture's repo URL into Auto Test & Fix, or run locally:

```bash
# JavaScript/TypeScript
cd fixtures/javascript && npm install && npm test

# Python
cd fixtures/python && pip install -r requirements.txt && python -m pytest

# Rust
cd fixtures/rust && cargo test

# Go
cd fixtures/go && go test ./...

# Java Maven
cd fixtures/java-maven && mvn test

# Java Gradle
cd fixtures/java-gradle && gradle test

# Ruby
cd fixtures/ruby && bundle install && bundle exec rspec

# PHP
cd fixtures/php && composer install && phpunit
```

## Intentionally Failing Tests

Each fixture has 3-4 intentionally broken tests that expect the wrong value. These are clearly marked with `// FAILS:` or `/** FAILS: */` comments in the test files. This lets you verify that Auto Test & Fix properly detects and analyzes failures.
