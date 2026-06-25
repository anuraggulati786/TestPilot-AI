import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AIAnalysis } from "@/types";

interface FileContent {
  path: string;
  content: string;
}

/**
 * Truncates file content to focus on relevant sections near error lines.
 * Prioritizes the first 15K chars, keeping content around known line numbers.
 */
function truncateFileContent(
  content: string,
  filePath: string,
  errorLines: number[]
): string {
  const MAX_CHARS = 15_000;
  if (content.length <= MAX_CHARS) return content;

  // Try to keep content around error lines
  const lines = content.split("\n");
  const relevantLineNumbers = new Set(
    errorLines.flatMap((line) => {
      const start = Math.max(0, line - 20);
      const end = Math.min(lines.length, line + 20);
      const range: number[] = [];
      for (let i = start; i < end; i++) range.push(i);
      return range;
    })
  );

  if (relevantLineNumbers.size > 0) {
    const relevantLines = lines.filter((_, i) => relevantLineNumbers.has(i));
    const truncated = relevantLines.join("\n");
    if (truncated.length <= MAX_CHARS) {
      return truncated;
    }
  }

  // Fallback: return first MAX_CHARS chars with a note
  return (
    content.slice(0, MAX_CHARS) +
    `\n\n... [truncated: file too large, showing first ${MAX_CHARS} characters]`
  );
}

function buildPrompt(
  stderr: string,
  stdout: string,
  fileContents: FileContent[],
  errorLines: number[]
): string {
  const filesSection = fileContents
    .map(
      (fc) =>
        `--- ${fc.path} ---\n${truncateFileContent(
          fc.content,
          fc.path,
          errorLines
        )}`
    )
    .join("\n\n");

  return `Here is the test output and source code for a failing project.

STDERR:
\`\`\`
${stderr.slice(0, 10_000)}
\`\`\`

STDOUT:
\`\`\`
${stdout.slice(0, 5_000)}
\`\`\`

FAILING FILES:
${filesSection}

Analyze each distinct error and return a JSON object with a single field "results" that is an array of error objects. Each error object must have:
- error_origin: the file path and line number where the error originates (format: "path/to/file.ts:12")
- explanation: 1-3 sentences explaining the root cause
- suggested_fix: a specific code snippet showing how to fix the issue`;
}

/**
 * Parse AI response text into AIAnalysis[].
 * Tries direct JSON parse, then object-with-results, then regex extraction.
 */
function parseAIResponse(responseText: string): AIAnalysis[] | null {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeAIAnalysis);
    }
    // If it's an object with a results/data property
    if (parsed.results && Array.isArray(parsed.results)) {
      return parsed.results.map(normalizeAIAnalysis);
    }
    // Single object
    if (parsed.error_origin) {
      return [normalizeAIAnalysis(parsed)];
    }
  } catch {
    // Fall through to regex extraction
  }

  // Try regex extraction of a JSON array or object (in case model wraps in markdown)
  const jsonMatch = responseText.match(/(\[[\s\S]*?\]|\{[\s\S]*?\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeAIAnalysis);
      }
      if (parsed.results && Array.isArray(parsed.results)) {
        return parsed.results.map(normalizeAIAnalysis);
      }
      if (parsed.error_origin) {
        return [normalizeAIAnalysis(parsed)];
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

/**
 * Try to analyze errors using the OpenAI-compatible API.
 * Uses env vars: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
 */
async function analyzeWithOpenAI(
  stderr: string,
  stdout: string,
  fileContents: FileContent[],
  errorLines: number[]
): Promise<AIAnalysis[]> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const baseURL =
    process.env.OPENAI_BASE_URL || "https://api.ainative.studio/api/v1";
  const model = process.env.OPENAI_MODEL || "google-gemini-2.0-flash";

  console.log(
    `[AI] Using OpenAI-compatible provider: ${baseURL}, model: ${model}`
  );

  const openai = new OpenAI({ apiKey, baseURL });
  const prompt = buildPrompt(stderr, stdout, fileContents, errorLines);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert debugging assistant. Analyze the test failures and return a JSON object with a 'results' field containing an array of error objects. Return ONLY valid JSON - no markdown, no code fences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const responseText = response.choices[0]?.message?.content || "[]";

  const parsed = parseAIResponse(responseText);
  if (parsed) {
    return parsed;
  }

  return [
    {
      error_origin: "unknown:1",
      explanation:
        "The AI returned an unexpected format. Raw response: " +
        responseText.substring(0, 300),
      suggested_fix:
        "Review the raw test output below and check for common issues like missing dependencies or configuration errors.",
    },
  ];
}

/**
 * Try to analyze errors using the Google Gemini SDK directly.
 * Uses env var: GEMINI_API_KEY
 */
async function analyzeWithGemini(
  stderr: string,
  stdout: string,
  fileContents: FileContent[],
  errorLines: number[]
): Promise<AIAnalysis[]> {
  const apiKey = process.env.GEMINI_API_KEY!;

  console.log("[AI] Using Google Gemini SDK directly");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(stderr, stdout, fileContents, errorLines);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const parsed = parseAIResponse(responseText);
  if (parsed) {
    return parsed;
  }

  return [
    {
      error_origin: "unknown:1",
      explanation:
        "The AI was unable to parse the test output. This could indicate an unusual error format or infrastructure issue.",
      suggested_fix:
        "Review the raw test output below and check for common issues like missing dependencies, configuration errors, or environment problems.",
    },
  ];
}

export async function analyzeErrors(
  stderr: string,
  stdout: string,
  fileContents: FileContent[],
  errorLines: number[] = []
): Promise<AIAnalysis[]> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // Determine which provider to use (OpenAI preferred if configured)
  const provider = openaiKey ? "openai" : geminiKey ? "gemini" : null;

  if (!provider) {
    const msg =
      "No AI API key configured. Set OPENAI_API_KEY or GEMINI_API_KEY in .env.local";
    console.error(msg);
    return [
      {
        error_origin: "unknown:1",
        explanation: msg,
        suggested_fix:
          "Add OPENAI_API_KEY or GEMINI_API_KEY to your .env.local file and restart the server.",
      },
    ];
  }

  try {
    if (provider === "openai") {
      return await analyzeWithOpenAI(stderr, stdout, fileContents, errorLines);
    } else {
      return await analyzeWithGemini(stderr, stdout, fileContents, errorLines);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    const stack = err instanceof Error ? err.stack : "";

    console.error(`=== AI API Error (provider: ${provider}) ===`);
    console.error("Message:", message);
    console.error("Stack:", stack);
    console.error("================================");

    // If Gemini fails and OpenAI key is available, try fallback
    if (provider === "gemini" && openaiKey) {
      console.log("[AI] Falling back to OpenAI-compatible provider...");
      try {
        return await analyzeWithOpenAI(stderr, stdout, fileContents, errorLines);
      } catch (fallbackErr) {
        const fbMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Fallback also failed";
        console.error("[AI] Fallback also failed:", fbMsg);
        return [
          {
            error_origin: "unknown:1",
            explanation: `Gemini failed: ${message}. OpenAI fallback also failed: ${fbMsg}`,
            suggested_fix:
              "Check your API keys are valid and have sufficient quota.",
          },
        ];
      }
    }

    // Try fallback to Gemini if OpenAI fails
    if (provider === "openai" && geminiKey) {
      console.log("[AI] Falling back to Google Gemini...");
      try {
        return await analyzeWithGemini(stderr, stdout, fileContents, errorLines);
      } catch (fbErr) {
        const fbMsg =
          fbErr instanceof Error ? fbErr.message : "Fallback also failed";
        console.error("[AI] Gemini fallback also failed:", fbMsg);
        return [
          {
            error_origin: "unknown:1",
            explanation: `OpenAI failed: ${message}. Gemini fallback also failed: ${fbMsg}`,
            suggested_fix:
              "Check your API keys are valid and have sufficient quota.",
          },
        ];
      }
    }

    return [
      {
        error_origin: "unknown:1",
        explanation: `AI analysis encountered an error: ${message}`,
        suggested_fix:
          `Check that your ${provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"} is valid and has sufficient quota. ` +
          `See the server terminal for detailed error logs. Error details: ${message}`,
      },
    ];
  }
}

function normalizeAIAnalysis(item: Record<string, unknown>): AIAnalysis {
  return {
    error_origin: String(item.error_origin || "unknown:1"),
    explanation: String(
      item.explanation || item.error_explanation || "No explanation provided"
    ),
    suggested_fix: String(
      item.suggested_fix || item.suggestedFix || item.fix || "No fix suggested"
    ),
  };
}
