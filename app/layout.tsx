import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Test & Fix — AI-Powered Test Failure Analyzer",
  description:
    "Clone any GitHub repo, run its test suite, and get AI-powered fix suggestions for failing tests. Supports JavaScript, Python, Rust, Go, Java, Ruby, and PHP projects.",
  openGraph: {
    title: "Auto Test & Fix",
    description:
      "Clone any GitHub repo, run tests, and get AI-powered fix suggestions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
