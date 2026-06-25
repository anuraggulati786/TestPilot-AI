import { NextRequest, NextResponse } from "next/server";
import { testRepository } from "@/lib/sandbox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "repoUrl is required" },
        { status: 400 }
      );
    }

    const githubRegex =
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/;
    if (!githubRegex.test(repoUrl.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid GitHub URL. Must be a valid github.com repository URL.",
        },
        { status: 400 }
      );
    }

    const result = await testRepository(repoUrl.trim());

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
