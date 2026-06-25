"use client";

import { useState, useCallback, type FormEvent } from "react";
import type { TestResult, TestFailure, TestSuiteResult } from "@/types";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<{ checking: boolean; result: string | null; valid: boolean | null }>({
    checking: false,
    result: null,
    valid: null,
  });

  const checkApiKey = useCallback(async () => {
    setKeyStatus({ checking: true, result: null, valid: null });
    try {
      const res = await fetch("/api/verify-key");
      const data = await res.json();
      if (data.valid) {
        setKeyStatus({
          checking: false,
          result: data.message || "API key is working!",
          valid: true,
        });
      } else {
        let msg = data.error || "Unknown error";
        if (data.hint) {
          msg += `\n\n💡 ${data.hint}`;
        }
        setKeyStatus({
          checking: false,
          result: msg,
          valid: false,
        });
      }
    } catch {
      setKeyStatus({
        checking: false,
        result: "Network error: could not reach the server.",
        valid: false,
      });
    }
  }, []);

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

  const hasFailures =
    result?.failures && result.failures.length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🧪</span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                TestPilot AI
              </h1>
              <p className="text-sm text-slate-400">
                Analyze any GitHub repo's test suite with AI-powered failure
                diagnosis and fix suggestions
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

        {/* Diagnostics Section */}
        <section className="mb-8">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-slate-400 transition-colors hover:text-white">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span> Diagnostics
              </summary>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Test if your Gemini API key is working correctly before running tests.
                </p>
                <button
                  onClick={checkApiKey}
                  disabled={keyStatus.checking}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {keyStatus.checking ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Checking...
                    </>
                  ) : (
                    "Verify API Key"
                  )}
                </button>
                {keyStatus.result && (
                  <div
                    className={`rounded-lg border p-3 text-sm ${
                      keyStatus.valid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {keyStatus.result}
                  </div>
                )}
              </div>
            </details>
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
              Scanning all subdirectories → Installing dependencies → Running test suites → AI analysis
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* ===== OVERALL SUMMARY BANNER ===== */}
            <OverallSummaryBanner result={result} />

            {/* Error if no failures parsed and no suites */}
            {!result.success &&
              !hasFailures &&
              !result.suites?.length &&
              result.error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <h3 className="mb-2 font-semibold text-red-300">Error Details</h3>
                  <pre className="max-h-60 overflow-auto rounded-lg bg-black/40 p-4 text-sm text-red-200">
                    {result.error}
                  </pre>
                </div>
              )}

            {/* ===== PER-SUITE RESULTS ===== */}
            {result.suites && result.suites.length > 0 && (
              <div className="mb-8 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Test Suites ({result.suites.length})
                </h2>
                {result.suites.map((suite, i) => (
                  <SuiteCard key={i} suite={suite} index={i} />
                ))}
              </div>
            )}

            {/* ===== RAW TEST LOGS ===== */}
            {result.logs && (result.logs.stdout || result.logs.stderr) && (
              <details className="group mb-6">
                <summary className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
                  <span className="group-open:hidden">▶</span>
                  <span className="hidden group-open:inline">▼</span> View Raw Test Output
                </summary>
                <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-4">
                  {result.logs.stdout && (
                    <div className="mb-4">
                      <h4 className="mb-1 text-xs font-semibold text-slate-500 uppercase">stdout</h4>
                      <pre className="max-h-64 overflow-auto text-sm text-slate-300 whitespace-pre-wrap">
                        {result.logs.stdout}
                      </pre>
                    </div>
                  )}
                  {result.logs.stderr && (
                    <div>
                      <h4 className="mb-1 text-xs font-semibold text-red-400 uppercase">stderr</h4>
                      <pre className="max-h-64 overflow-auto text-sm text-red-200 whitespace-pre-wrap">
                        {result.logs.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        <p>TestPilot AI — Powered by E2B Sandbox &amp; Google Gemini AI</p>
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
    title: "Run All Test Suites",
    description:
      "We recursively scan all subdirectories, find every test fixture, and run each suite independently.",
  },
  {
    icon: "🤖",
    title: "AI Analysis & Fixes",
    description:
      "Google Gemini AI analyzes each failure, pinpoints root causes, and suggests specific code fixes.",
  },
];

/* ===================================================================
   Overall Summary Banner Component
   =================================================================== */
function OverallSummaryBanner({ result }: { result: TestResult }) {
  const { success, summary } = result;

  return (
    <div
      className={`mb-6 rounded-xl border p-6 ${
        success
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-red-500/30 bg-red-500/10"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{success ? "✅" : "❌"}</span>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {success ? "All Tests Passed!" : "Some Tests Failed"}
            </h2>
            {summary && (
              <p className="text-sm text-slate-400">
                {summary.total} test{summary.total !== 1 ? "s" : ""} total
                {" · "}
                <span className="text-emerald-400">
                  {summary.passed} passed
                </span>
                {summary.failed > 0 && (
                  <>
                    {" · "}
                    <span className="text-red-400">
                      {summary.failed} failed
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {summary && (
          <div className="flex gap-3">
            <CountBox value={summary.passed} label="Passed" color="emerald" />
            <CountBox value={summary.failed} label="Failed" color="red" />
            <CountBox value={summary.total} label="Total" color="white" />
          </div>
        )}
      </div>
    </div>
  );
}

function CountBox({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: "emerald" | "red" | "white";
}) {
  const textColor = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    white: "text-white",
  }[color];

  return (
    <div className="rounded-lg bg-white/5 px-4 py-2 text-center min-w-[72px]">
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ===================================================================
   Suite Card Component — shows results for one test suite
   =================================================================== */
function SuiteCard({ suite, index }: { suite: TestSuiteResult; index: number }) {
  const { summary, failures, name } = suite;
  const suiteSuccess = summary.status === "passed";

  const runnerIcons: Record<string, string> = {
    npm: "🟨",
    pytest: "🐍",
    cargo: "🦀",
    go: "🔷",
    maven: "☕",
    gradle: "☕",
    rspec: "💎",
    phpunit: "🐘",
  };

  const runnerIcon = runnerIcons[suite.runner ?? ""] ?? "🧪";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-white/20">
      {/* Suite Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
              suiteSuccess
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {suiteSuccess ? "✓" : "✗"}
          </div>
          <span className="text-sm text-slate-400 font-mono">{index + 1}.</span>
          <span className="font-semibold text-white">{runnerIcon}</span>
          <span className="font-medium text-white">{name}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-mono text-slate-400">
            {suite.runner}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{summary.total} tests</span>
          <span className="text-xs text-emerald-400">{summary.passed} ✓</span>
          {summary.failed > 0 && (
            <span className="text-xs text-red-400">{summary.failed} ✗</span>
          )}
        </div>
      </div>

      {/* Suite Counts */}
      <div className="flex gap-2 px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1">
          <span className="text-xs text-emerald-400">Passed:</span>
          <span className="text-sm font-bold text-emerald-300">{summary.passed}</span>
        </div>
        {summary.failed > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1">
            <span className="text-xs text-red-400">Failed:</span>
            <span className="text-sm font-bold text-red-300">{summary.failed}</span>
          </div>
        )}
      </div>

      {/* Failure Cards for this suite */}
      {failures && failures.length > 0 && (
        <div className="divide-y divide-white/5">
          {failures.map((failure, i) => (
            <FailureCard key={i} failure={failure} suiteIndex={index} failureIndex={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================================================================
   Failure Card Component — shows one failure with AI analysis
   =================================================================== */
function FailureCard({
  failure,
  suiteIndex,
  failureIndex,
}: {
  failure: TestFailure;
  suiteIndex: number;
  failureIndex: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(failure.suggestedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const globalIndex = `${suiteIndex + 1}.${failureIndex + 1}`;

  return (
    <div className="px-5 py-4 transition-colors hover:bg-white/[0.02]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-[10px] font-bold text-red-400">
            {globalIndex}
          </span>
          <span className="text-sm font-medium text-white">{failure.test}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2 py-0.5 text-[11px] font-mono text-slate-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {failure.file}:{failure.line}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Error */}
        <div>
          <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            Error
          </h5>
          <pre className="max-h-24 overflow-auto rounded-lg bg-red-950/40 p-2.5 text-xs text-red-200 ring-1 ring-red-500/20">
            {failure.error}
          </pre>
        </div>

        {/* Root Cause */}
        <div>
          <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
            Root Cause
          </h5>
          <div className="rounded-lg bg-blue-950/40 p-2.5 text-xs text-blue-200 ring-1 ring-blue-500/20 h-full">
            {failure.explanation}
          </div>
        </div>

        {/* Suggested Fix */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h5 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Fix
            </h5>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300 transition-all hover:bg-white/20 hover:text-white"
            >
              {copied ? (
                <>
                  <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="max-h-32 overflow-auto rounded-lg bg-slate-950 p-2.5 text-xs text-emerald-200 ring-1 ring-emerald-500/20">
            <code>{failure.suggestedFix}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
