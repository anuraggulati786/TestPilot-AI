# 🤖 TestPilot AI

> **AI-powered test failure analysis for any GitHub repository — across 8 languages.**

TestPilot AI is a full-stack web application that takes any public GitHub repository URL, securely clones it into a cloud sandbox, auto-detects the test runner, executes the test suite, and leverages **Google Gemini AI** to analyze failures and suggest precise code fixes — all presented in a polished, dark-mode UI.

---

## 🚀 Demonstration and Tech Stack

| Aspect | What It Demonstrates |
|---|---|
| **Full-Stack Ownership** | End-to-end: Next.js frontend → API routes → E2B cloud sandbox → Google Gemini → response rendering |
| **System Design** | Orchestrates 4+ external services (GitHub, E2B, Gemini, npm/pip/cargo) into a cohesive pipeline |
| **Multi-Language Support** | Parses and runs tests for JavaScript, Python, Rust, Go, Java (Maven + Gradle), Ruby, and PHP |
| **Resilience & Error Handling** | Graceful fallbacks across AI providers, network timeouts, sandbox cleanup, and per-suite error isolation |
| **Developer Experience** | Auto-detects package managers (npm/pnpm/yarn), test frameworks, and install commands — zero config needed |
| **Security-Conscious** | Uses ephemeral E2B sandboxes with auto-kill, shallow clones (`--depth 1`), and no persistent storage |
| **AI Integration** | Structured JSON prompting, response parsing with regex fallbacks, and multi-provider support (Gemini + OpenAI-compatible) |

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│  ┌──────────────────────────────────────────────┐   │
│  │  Next.js App (React 19 + Tailwind CSS v4)    │   │
│  │  - Dark mode UI with glassmorphism            │   │
│  │  - Real-time loading states                   │   │
│  │  - Collapsible result sections                │   │
│  │  - One-click fix copy                         │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │ POST /api/test                     │
│                 ▼                                    │
│  ┌──────────────────────────────┐                   │
│  │  Next.js API Route           │                   │
│  │  - Validates GitHub URL      │                   │
│  │  - Delegates to sandbox lib  │                   │
│  └──────────────┬───────────────┘                   │
└─────────────────┼────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│  E2B Cloud Sandbox (ephemeral, auto-killed)          │
│                                                       │
│  1. git clone --depth 1 <repo>                        │
│  2. find config files (package.json, Cargo.toml, etc) │
│  3. Detect test runner (npm/pytest/cargo/go/maven...) │
│  4. Install dependencies                              │
│  5. Run tests                                         │
│  6. Return stdout + stderr                            │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Server-side Processing                               │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ test-detector│  │ error-parser │  │ai-analyzer │ │
│  │ (regex-based │  │ (stack trace │  │ (Gemini    │ │
│  │  runner      │  │  parsing)    │  │  prompt +  │ │
│  │  detection)  │  │              │  │  parse)    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 🧩 Tech Stack Breakdown

### Frontend

| Technology | Purpose | Why It Was Chosen |
|---|---|---|
| **Next.js 15 (App Router)** | Full-stack React framework | Server components + API routes in one project; built-in SSR/SSG |
| **React 19** | UI library | Latest with improved hooks and concurrent features |
| **TypeScript** | Type safety | Catches bugs at compile time; better DX with IDE autocomplete |
| **Tailwind CSS v4** | Styling | Utility-first, fast iteration, small bundle with JIT |

### Backend

| Technology | Purpose | Why It Was Chosen |
|---|---|---|
| **Next.js API Routes** | Serverless API endpoints | Co-located with frontend; no separate backend needed |
| **E2B Sandbox** | Secure cloud execution | Isolated environment with auto-cleanup; no Docker setup needed |
| **Google Gemini 2.5 Flash** | AI error analysis | Fast, cheap, native JSON mode — no fine-tuning needed |

### Testing

| Technology | Purpose |
|---|---|
| **Jest 29** | Unit testing for parsing and detection logic |
| **next/jest** | Seamless Next.js + Jest integration |

### DevOps

| Technology | Purpose |
|---|---|
| **Vercel** | One-click deployment with auto HTTPS |
| **GitHub** | Source control |

---

## 📁 Project Structure

```
testpilot-ai/
├── app/
│   ├── layout.tsx           # Root layout with SEO metadata
│   ├── page.tsx             # Main UI (client component)
│   ├── globals.css          # Tailwind CSS v4 with custom theme
│   └── api/
│       ├── test/route.ts    # POST /api/test — runs tests
│       └── verify-key/route.ts  # GET /api/verify-key — diagnostics
├── lib/
│   ├── sandbox.ts           # E2B orchestration (clone → detect → run → analyze)
│   ├── test-detector.ts     # Auto-detect test runner from config files
│   ├── error-parser.ts      # Parse stderr for file:line errors
│   └── ai-analyzer.ts       # Gemini API prompt + response parsing
├── types/
│   └── index.ts             # TypeScript interfaces
├── __tests__/
│   ├── test-detector.test.ts
│   ├── error-parser.test.ts
│   └── ai-analyzer.test.ts
├── next.config.ts            # E2B server external packages
├── jest.config.ts            # Jest with next/jest
├── jest.setup.ts             # Test setup
├── tsconfig.json             # TypeScript config
└── package.json
```

---

## 🔧 Key Technical Decisions

### 1. Why E2B over Docker or local execution?
- **Zero infrastructure** — no Docker daemon, no VM setup
- **Auto-cleanup** — sandboxes are killed after each run, preventing resource leaks
- **Scales to zero** — pay only when used

### 2. Why Gemini over other AI models?
- **Native JSON mode** — `responseMimeType: "application/json"` guarantees structured output
- **Generous free tier** — 60 requests/minute on the free plan
- **Fast inference** — 2.5 Flash models respond in under 2 seconds for most prompts

### 3. Why sandbox-based test execution?
- **Security** — malicious `package.json` scripts can't access the host machine
- **Isolation** — each repo runs in its own sandbox, no cross-contamination
- **Reproducibility** — clean environment every time

### 4. Multi-provider AI fallback
The `ai-analyzer.ts` supports both Gemini SDK and OpenAI-compatible APIs. If one provider fails, it automatically falls back to the other — ensuring the app works even if one service is down.

### 5. Recursive multi-suite detection
The app doesn't just look for test configs at the root — it recursively scans all subdirectories. This means monorepos and projects with multiple test suites are fully supported.

---

## 🏃 How to Use

### Prerequisites
- **Node.js 18+**
- **E2B API key** — [Get one free](https://e2b.dev)
- **Google Gemini API key** — [Get one free](https://aistudio.google.com/app/apikey)

### Quick Start

```bash
# 1. Clone & install
git clone <your-repo-url>
cd testpilot-ai
npm install

# 2. Set up API keys
echo "GEMINI_API_KEY=your_key_here" >> .env.local
echo "E2B_API_KEY=e2b_your_key_here" >> .env.local

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
#    Paste a GitHub repo URL → click "Run Tests"
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint check |

---

## 📡 API Reference

### `POST /api/test`

Analyzes a GitHub repository's test suite.

**Request:**
```json
{ "repoUrl": "https://github.com/user/repo" }
```

**Response (failure with AI analysis):**
```json
{
  "success": false,
  "summary": { "total": 5, "passed": 2, "failed": 3, "status": "failed" },
  "suites": [
    {
      "name": "Jest (root)",
      "runner": "npm",
      "summary": { "total": 5, "passed": 2, "failed": 3, "status": "failed" },
      "failures": [
        {
          "test": "should return user data",
          "file": "src/user.test.ts",
          "line": 42,
          "error": "expect(received).toBe(expected)",
          "explanation": "The function returns a string but expects a number...",
          "suggestedFix": "return Number(value);"
        }
      ]
    }
  ]
}
```

### `GET /api/verify-key`

Tests if your AI API keys are configured and working.

---

## 🧪 Supported Languages & Test Runners

| Language | Detected By | Runner |
|---|---|---|
| JavaScript / TypeScript | `package.json` | `npm test` / `pnpm test` / `yarn test` |
| Python | `requirements.txt` / `pyproject.toml` | `pytest` |
| Rust | `Cargo.toml` | `cargo test` |
| Go | `go.mod` | `go test ./...` |
| Java (Maven) | `pom.xml` | `mvn test` |
| Java (Gradle) | `build.gradle` | `gradle test` |
| Ruby | `Gemfile` | `bundle exec rspec` |
| PHP | `composer.json` | `phpunit` |

---

## ⚡ Performance Considerations

- **Shallow clones** (`--depth 1`) minimize clone time for large repos
- **10-minute sandbox timeout** handles monorepos with multiple suites
- **File content truncation** (15K chars) keeps Gemini prompts under token limits
- **Parallel suite execution** could be added as a future optimization

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub first
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-username/testpilot-ai.git
git push -u origin main
```

Then connect your GitHub repo to [Vercel](https://vercel.com) and add these environment variables:
- `GEMINI_API_KEY`
- `E2B_API_KEY`

---

## 📈 Future Improvements

- [ ] **Local rule-based fallback** — analyze common errors without any AI API call
- [ ] **WebSocket streaming** — stream test output in real-time during execution
- [ ] **Diff view** — show suggested fix as a unified diff against the original code
- [ ] **Test history** — save and compare results across runs
- [ ] **Auto-fix PR** — create a GitHub PR with the suggested fix applied
- [ ] **Parallel suite execution** — run independent suites concurrently

---

## 📄 License

MIT
