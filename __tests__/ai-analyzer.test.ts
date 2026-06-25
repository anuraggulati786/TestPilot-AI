import { analyzeErrors } from "@/lib/ai-analyzer";

// Mock the Google Generative AI SDK with shared references
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-key";
});

describe("analyzeErrors", () => {
  it("successfully parses a valid JSON response from Gemini", async () => {
    const mockResponse = [
      {
        error_origin: "src/index.ts:12",
        explanation: "The function is missing a null check.",
        suggested_fix: 'if (value === null) return "";',
      },
    ];

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const result = await analyzeErrors("stderr test", "stdout test", [
      { path: "src/index.ts", content: 'function foo(value) { return value; }' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      error_origin: "src/index.ts:12",
      explanation: "The function is missing a null check.",
      suggested_fix: 'if (value === null) return "";',
    });
  });

  it("extracts JSON from text with surrounding content", async () => {
    const mockResponse = [
      {
        error_origin: "src/utils.ts:5",
        explanation: "Type mismatch in the comparison.",
        suggested_fix: "Use strict equality operator.",
      },
    ];

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          `Here is my analysis:\n\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\`\nHope this helps!`,
      },
    });

    const result = await analyzeErrors("stderr", "stdout", [
      { path: "src/utils.ts", content: "const x = 1;" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].error_origin).toBe("src/utils.ts:5");
  });

  it("returns fallback error when JSON cannot be parsed", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "This is not JSON at all. I cannot analyze this.",
      },
    });

    const result = await analyzeErrors("stderr", "stdout", []);

    expect(result).toHaveLength(1);
    expect(result[0].error_origin).toBe("unknown:1");
    expect(result[0].explanation).toContain("unable to parse");
  });

  it("handles empty file contents gracefully", async () => {
    const mockResponse = [
      {
        error_origin: "src/test.ts:1",
        explanation: "No issues found in empty files.",
        suggested_fix: "N/A",
      },
    ];

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockResponse),
      },
    });

    const result = await analyzeErrors("stderr", "stdout", []);

    expect(result).toHaveLength(1);
    expect(result[0].error_origin).toBe("src/test.ts:1");
  });

  it("handles Gemini API errors gracefully", async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error("API quota exceeded")
    );

    const result = await analyzeErrors("stderr", "stdout", []);

    expect(result).toHaveLength(1);
    expect(result[0].explanation).toContain("API quota exceeded");
    expect(result[0].suggested_fix).toContain("GEMINI_API_KEY");
  });

  it("handles missing API key", async () => {
    delete process.env.GEMINI_API_KEY;

    const result = await analyzeErrors("stderr", "stdout", []);

    expect(result).toHaveLength(1);
    expect(result[0].explanation).toContain("No AI API key configured");
  });
});
