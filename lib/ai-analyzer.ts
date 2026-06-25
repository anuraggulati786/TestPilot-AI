import { GoogleGenerativeAI } from "@google/generative-ai";
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

export async function analyzeErrors(
  stderr: string,
  stdout: string,
  fileContents: FileContent[],
  errorLines: number[] = []
): Promise<AIAnalysis[]> {
  // Build the prompt content
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

  const prompt = `Here is the test output and source code for a failing project.

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

Analyze each distinct error and return a JSON array. Each item in the array must have:
- error_origin: the file path and line number where the error originates (format: "path/to/file.ts:12")
- explanation: 1-3 sentences explaining the root cause
- suggested_fix: a specific code snippet showing how to fix the issue`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

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

    // Try regex extraction of JSON array
    const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeAIAnalysis);
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback: return a generic error object
    return [
      {
        error_origin: "unknown:1",
        explanation:
          "The AI was unable to parse the test output. This could indicate an unusual error format or infrastructure issue.",
        suggested_fix:
          "Review the raw test output below and check for common issues like missing dependencies, configuration errors, or environment problems.",
      },
    ];
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    return [
      {
        error_origin: "unknown:1",
        explanation: `AI analysis encountered an error: ${message}`,
        suggested_fix:
          "Check that your GEMINI_API_KEY is valid and has sufficient quota.",
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
