import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type AccessRequestPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  useCase?: unknown;
  note?: unknown;
  source?: unknown;
};

const allowedUseCases = new Set([
  "product-team",
  "design-system",
  "agency",
  "founder",
]);

const allowedSources = new Set(["hero", "export"]);

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendAccessRequestEmail(submission: {
  name: string;
  email: string;
  company: string;
  useCase: string;
  note: string;
  source: string;
  createdAt: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ACCESS_REQUEST_TO_EMAIL;
  const from = process.env.ACCESS_REQUEST_FROM_EMAIL || "ausos <onboarding@resend.dev>";

  if (!apiKey || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: submission.email,
      subject: `ausos access request from ${submission.name}`,
      text: [
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Company: ${submission.company || "Not provided"}`,
        `Use case: ${submission.useCase}`,
        `Source: ${submission.source}`,
        `Created: ${submission.createdAt}`,
        "",
        "Note:",
        submission.note || "Not provided",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error("Email delivery failed.");
  }

  return true;
}

export async function POST(request: Request) {
  // Rate limit on the public submission form to bound spam impact on
  // Resend email quota and Redis storage.
  const ip = getClientIp(request);
  const limit = await checkRateLimit(ip, "access-request");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.resetInSeconds) },
      },
    );
  }

  let body: AccessRequestPayload;

  try {
    body = (await request.json()) as AccessRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 160).toLowerCase();
  const company = cleanString(body.company, 160);
  const note = cleanString(body.note, 1000);
  const requestedUseCase = cleanString(body.useCase, 80);
  const requestedSource = cleanString(body.source, 40);
  const useCase = allowedUseCases.has(requestedUseCase) ? requestedUseCase : "product-team";
  const source = allowedSources.has(requestedSource) ? requestedSource : "hero";

  if (!name || !isEmail(email)) {
    return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  }

  const submission = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    email,
    company,
    useCase,
    note,
    source,
    userAgent: request.headers.get("user-agent") || "",
  };

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  let stored = false;

  if (url && token) {
    const redis = new Redis({ url, token });
    await redis.lpush("ausos:access-requests", submission);
    await redis.ltrim("ausos:access-requests", 0, 999);
    stored = true;
  }

  const emailed = await sendAccessRequestEmail(submission);

  return NextResponse.json({ ok: true, stored, emailed });
}
