"use client";

import { useState, useCallback, type FormEvent } from "react";
import type { TestResult, TestFailure } from "@/types";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setResult(null);

      if (!repoUrl.trim()) {
        setError("Please enter a GitHub repository URL");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: repoUrl.trim() }),
        });
        const data: TestResult = await res.json();
        if (!res.ok) {
          setError(data.error || "Request failed");
        } else {
          setResult(data);
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [repoUrl]
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧪</span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Auto Test & Fix
              </h1>
              <p className="text-sm text-slate-400">
                Clone any GitHub repo, run its tests, and get AI-powered fix
                suggestions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* How It Works Section */}
        <section className="mb-10">
          <h2 className="mb-6 text-xl font-semibold text-white">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-brand-500/50 hover:bg-white/10"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/20 text-lg font-bold text-brand-400">
                  {i + 1}
                </div>
                <div className="mb-2 text-2xl">{step.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Input Section */}
        <section className="mb-8">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Test a Repository
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Running Tests...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Run Tests
                  </>
                )}
              </button>
            </form>

            {/* Supported runners info */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Supports:</span>
              {[
                { name: "JavaScript", icon: "🟨" },
                { name: "Python", icon: "🐍" },
                { name: "Rust", icon: "🦀" },
                { name: "Go", icon: "🔷" },
                { name: "Java", icon: "☕" },
                { name: "Ruby", icon: "💎" },
                { name: "PHP", icon: "🐘" },
              ].map((lang) => (
                <span
                  key={lang.name}
                  className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/5 px-2 py-0.5"
                >
                  {lang.icon} {lang.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">❌</span>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/20">
              <svg
                className="h-6 w-6 animate-spin text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-white">Running Tests...</h3>
            <p className="text-sm text-slate-400">
              Cloning repository → Installing dependencies → Running tests → AI
              analysis
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* Summary Banner */}
            <div
              className={`mb-6 rounded-xl border p-6 ${
                result.success
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {result.success ? "✅" : "❌"}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {result.success
                        ? "All Tests Passed!"
                        : "Tests Failed"}
                    </h2>
                    {result.summary && (
                      <p className="text-sm text-slate-400">
                        {result.summary.total} test
                        {result.summary.total !== 1 ? "s" : ""} total
                        {result.summary.passed > 0 && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-emerald-400">
                              {result.summary.passed} passed
                            </span>
                          </>
                        )}
                        {result.summary.failed > 0 && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-red-400">
                              {result.summary.failed} failed
                            </span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {result.summary && (
                  <div className="flex gap-3">
                    <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {result.summary.passed}
                      </div>
                      <div className="text-xs text-slate-500">Passed</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {result.summary.failed}
                      </div>
                      <div className="text-xs text-slate-500">Failed</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-4 py-2 text-center">
                      <div className="text-2xl font-bold text-white">
                        {result.summary.total}
                      </div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error if no failures parsed */}
            {!result.success &&
              (!result.failures || result.failures.length === 0) &&
              result.error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <h3 className="mb-2 font-semibold text-red-300">
                    Error Details
                  </h3>
                  <pre className="max-h-60 overflow-auto rounded-lg bg-black/40 p-4 text-sm text-red-200">
                    {result.error}
                  </pre>
                </div>
              )}

            {/* Test Logs */}
            {result.logs && (
              <details className="group mb-6">
                <summary className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
                  <span className="group-open:hidden">▶</span>
                  <span className="hidden group-open:inline">▼</span> View Raw
                  Test Output
                </summary>
                <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-4">
                  {result.logs.stdout && (
                    <div className="mb-4">
                      <h4 className="mb-1 text-xs font-semibold text-slate-500 uppercase">
                        stdout
                      </h4>
                      <pre className="max-h-48 overflow-auto text-sm text-slate-300">
                        {result.logs.stdout}
                      </pre>
                    </div>
                  )}
                  {result.logs.stderr && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold text-red-400 uppercase">
                        stderr
                      </h4>
                      <pre className="max-h-48 overflow-auto text-sm text-red-200">
                        {result.logs.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Failure Cards */}
            {result.failures && result.failures.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  Failure Analysis
                </h2>
                {result.failures.map((failure, i) => (
                  <FailureCard key={i} failure={failure} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        <p>Auto Test & Fix — Powered by E2B Sandbox &amp; Google Gemini AI</p>
      </footer>
    </div>
  );
}

const steps = [
  {
    icon: "🔗",
    title: "Enter Repo URL",
    description:
      "Paste any public GitHub repository URL. We support JavaScript, Python, Rust, Go, Java, Ruby, and PHP projects.",
  },
  {
    icon: "📦",
    title: "Clone & Install",
    description:
      "We clone the repo in a secure cloud sandbox and automatically install dependencies using the project's package manager.",
  },
  {
    icon: "🧪",
    title: "Run Test Suite",
    description:
      "The test suite runs with the auto-detected test runner. Results are captured and analyzed for any failures.",
  },
  {
    icon: "🤖",
    title: "AI Analysis & Fixes",
    description:
      "Google Gemini AI analyzes failures, pinpoints root causes, and suggests specific code fixes you can apply.",
  },
];

function FailureCard({
  failure,
  index,
}: {
  failure: TestFailure;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(failure.suggestedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = failure.suggestedFix;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [failure.suggestedFix]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-red-500/20 text-xs font-bold text-red-400">
            {index + 1}
          </span>
          <span className="font-medium text-white">{failure.test}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2 py-1 text-xs font-mono text-slate-300">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {failure.file}:{failure.line}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Error Message */}
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
            Error
          </h4>
          <pre className="max-h-32 overflow-auto rounded-lg bg-red-950/40 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
            {failure.error}
          </pre>
        </div>

        {/* Root Cause */}
        <div>
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
            Root Cause
          </h4>
          <div className="rounded-lg bg-blue-950/40 p-3 text-sm text-blue-200 ring-1 ring-blue-500/20">
            {failure.explanation}
          </div>
        </div>

        {/* Suggested Fix */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Suggested Fix
            </h4>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-slate-300 transition-all hover:bg-white/20 hover:text-white"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Fix
                </>
              )}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
            <code>{failure.suggestedFix}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
