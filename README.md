# 🧪 Auto Test & Fix

**Clone any GitHub repo, run its test suite, and get AI-powered fix suggestions for failing tests.**

Auto Test & Fix is a web app that securely clones a GitHub repository into a cloud sandbox, auto-detects the test runner, executes the test suite, and uses Google Gemini AI to analyze failures and suggest fixes.

---

## How It Works

```
User enters GitHub URL
        │
        ▼
┌─────────────────────────────────┐
│  1. Secure E2B Sandbox Created  │
│  2. Repository Cloned (--depth 1)│
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  3. Detect Test Runner          │
│     ├─ package.json → npm test  │
│     ├─ Cargo.toml → cargo test  │
│     ├─ go.mod → go test ./...   │
│     └─ ... (8 runners total)    │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  4. Install Dependencies         │
│  5. Run Test Suite               │
└──────────┬──────────────────────┘
           │
      ┌────┴────┐
      ▼         ▼
   Passed?    Failed?
      │         │
      │         ▼
      │    ┌─────────────────────────┐
      │    │  6. Parse Errors         │
      │    │  7. Read Failing Files   │
      │    │  8. Gemini AI Analysis   │
      │    │  9. Suggest Fixes        │
      │    └──────────┬──────────────┘
      │               │
      └───────┬───────┘
              ▼
     ┌─────────────────┐
     │  Display Results │
     │  + Suggested Fix │
     └─────────────────┘
```

---

## Features

- ✅ **8 language support** — JavaScript, Python, Rust, Go, Java, Gradle, Ruby, PHP
- 🔒 **Secure sandbox** — Each run happens in an isolated E2B cloud sandbox, auto-killed after 5 minutes
- 🤖 **AI-powered analysis** — Google Gemini analyzes test failures and suggests specific code fixes
- 📋 **One-click copy** — Copy suggested fixes directly from the UI
- 📦 **Auto dependency install** — Detects and installs project dependencies automatically
- 🧠 **Smart error parsing** — Handles Jest, Pytest output formats

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** (App Router) | Web framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **E2B** | Secure cloud sandbox |
| **Google Gemini 2.0 Flash** | AI error analysis |
| **Jest** | Unit testing |
| **Vercel** | Deployment |

---

## Prerequisites

- **Node.js 18+**
- **E2B API Key** — [Sign up free](https://e2b.dev/dashboard) (free credits included)
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey) (generous free tier)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/auto-test-fix.git
cd auto-test-fix
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.local .env.local
```

Edit `.env.local` and add your API keys:

```env
E2B_API_KEY=e2b_your_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run tests

```bash
npm test
```

---

## API Reference

### `POST /api/test`

Analyzes a GitHub repository's test suite.

#### Request Body

```json
{
  "repoUrl": "https://github.com/user/repo"
}
```

#### Success Response (Tests Pass)

```json
{
  "success": true,
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "status": "passed"
  },
  "logs": {
    "stdout": "...",
    "stderr": ""
  }
}
```

#### Success Response (Tests Fail with AI Analysis)

```json
{
  "success": false,
  "summary": {
    "total": 3,
    "passed": 0,
    "failed": 3,
    "status": "failed"
  },
  "failures": [
    {
      "test": "should return user data",
      "file": "src/user.test.ts",
      "line": 42,
      "error": "expect(received).toBe(expected)",
      "explanation": "The function returns a string but the test expects a number...",
      "suggestedFix": "return Number(value);"
    }
  ],
  "logs": {
    "stdout": "...",
    "stderr": "..."
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Failed to clone repository: ..."
}
```

---

## Supported Languages & Test Runners

| Language | File Marker | Test Runner | Install Command |
|----------|-------------|-------------|-----------------|
| JavaScript/TypeScript | `package.json` | npm test | `npm install` |
| Python | `requirements.txt` | pytest | `pip install -r requirements.txt` |
| Python (modern) | `pyproject.toml` | pytest | `pip install -e .` |
| Rust | `Cargo.toml` | cargo test | _(none)_ |
| Go | `go.mod` | go test ./... | `go mod download` |
| Java (Maven) | `pom.xml` | mvn test | _(none)_ |
| Java (Gradle) | `build.gradle` | gradle test | _(none)_ |
| Ruby | `Gemfile` | bundle exec rspec | `bundle install` |
| PHP | `composer.json` | phpunit | `composer install` |

---

## Project Structure

```
auto-test-fix/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main UI (client component)
│   ├── globals.css         # Tailwind CSS v4 global styles
│   └── api/test/route.ts   # POST endpoint for testing
├── lib/
│   ├── sandbox.ts          # E2B sandbox orchestration
│   ├── test-detector.ts    # Auto-detect test runner
│   ├── error-parser.ts     # Parse stderr for errors
│   └── ai-analyzer.ts      # Gemini AI analysis
├── types/
│   └── index.ts            # TypeScript interfaces
├── __tests__/
│   ├── test-detector.test.ts
│   ├── error-parser.test.ts
│   └── ai-analyzer.test.ts
├── next.config.ts          # Next.js configuration
├── jest.config.ts          # Jest configuration
├── jest.setup.ts           # Jest setup
├── postcss.config.mjs      # PostCSS for Tailwind
├── tsconfig.json           # TypeScript configuration
├── .env.local              # Environment variables template
└── package.json
```

---

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/auto-test-fix.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Keep all default settings (Next.js is auto-detected)
   - Click "Deploy"

3. **Set environment variables** in Vercel dashboard:
   - `E2B_API_KEY` — Your E2B API key
   - `GEMINI_API_KEY` — Your Google Gemini API key

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT
