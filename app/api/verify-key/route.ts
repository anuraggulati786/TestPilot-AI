import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

async function testGeminiKey(apiKey: string): Promise<{
  valid: boolean;
  message: string;
  hint?: string;
}> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(
      `Return a JSON object with one field: "status" set to "ok".`
    );
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (parsed.status === "ok") {
      return { valid: true, message: "Gemini API key is valid and working!" };
    }
    return {
      valid: true,
      message: `Gemini responded but unexpected format: ${text.substring(0, 200)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { valid: false, message, hint: getGeminiHint(message) };
  }
}

async function testOpenAIKey(
  apiKey: string,
  baseURL: string,
  model: string
): Promise<{
  valid: boolean;
  message: string;
  hint?: string;
}> {
  try {
    const openai = new OpenAI({ apiKey, baseURL });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Return ONLY valid JSON.",
        },
        {
          role: "user",
          content:
            'Return a JSON object with one field: "status" set to "ok".',
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });

    const text = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    if (parsed.status === "ok") {
      return {
        valid: true,
        message: `OpenAI-compatible key is valid! Using ${baseURL} with model ${model}`,
      };
    }
    return {
      valid: true,
      message: `Provider responded but unexpected format: ${text.substring(0, 200)}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { valid: false, message, hint: getOpenAIHint(message) };
  }
}

function getGeminiHint(errorMessage: string): string {
  if (errorMessage.includes("API_KEY_INVALID")) {
    return "Your Gemini API key is invalid. Generate a new one at https://aistudio.google.com/app/apikey";
  }
  if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("Too Many")) {
    return "Gemini free tier quota exhausted. Wait a few minutes or upgrade at https://ai.google.dev/pricing";
  }
  if (errorMessage.includes("not enabled") || errorMessage.includes("PERMISSION_DENIED")) {
    return "The Generative Language API is not enabled. Enable it at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com";
  }
  return "Unknown error. Try getting a fresh key at https://aistudio.google.com/app/apikey";
}

function getOpenAIHint(errorMessage: string): string {
  if (errorMessage.includes("Incorrect API key") || errorMessage.includes("401")) {
    return "Your API key is invalid. Check the key and base URL.";
  }
  if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("insufficient_quota")) {
    return "Quota exceeded for this provider. Check your billing/plan.";
  }
  if (errorMessage.includes("model_not_found") || errorMessage.includes("not found")) {
    return "The model name is wrong. Check what model names your provider supports.";
  }
  if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
    return "Cannot connect to the API. Check your OPENAI_BASE_URL.";
  }
  return "Unknown error. Check your API key, base URL, and model configuration.";
}

export async function GET() {
  const results: Record<string, any> = {};
  let anyValid = false;

  // Test Gemini key if available
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    results.gemini = await testGeminiKey(geminiKey);
    if (results.gemini.valid) anyValid = true;
  } else {
    results.gemini = { valid: false, message: "Not configured (no GEMINI_API_KEY in .env.local)" };
  }

  // Test OpenAI-compatible key if available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.ainative.studio/api/v1";
    const model = process.env.OPENAI_MODEL || "google-gemini-2.0-flash";
    results.openai = await testOpenAIKey(openaiKey, baseURL, model);
    if (results.openai.valid) anyValid = true;
  } else {
    results.openai = { valid: false, message: "Not configured (no OPENAI_API_KEY in .env.local)" };
  }

  // Determine which provider will be used
  const activeProvider = openaiKey ? "openai" : geminiKey ? "gemini" : "none";

  return NextResponse.json({
    valid: anyValid,
    activeProvider,
    results,
    tip: anyValid
      ? "At least one AI provider is working! Try running a test."
      : "No working AI provider found. Configure at least one API key in .env.local and restart the server.",
  });
}
