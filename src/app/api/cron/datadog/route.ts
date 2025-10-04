import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Datadog Vercel cron job status",
    status: "configured",
    timestamp: new Date().toISOString(),
    info: {
      type: "Vercel Cron Job",
      schedule: "Every 30 seconds (*/30 * * * * *)",
      endpoint: "/api/cron/datadog-logs",
      description: "Automatically triggered by Vercel's cron system",
      environment: {
        hasApiKey: !!process.env.DD_API_KEY,
        hasAppKey: !!process.env.DD_APP_KEY,
        site: process.env.DD_SITE || "datadoghq.com",
      },
    },
    note: "Vercel cron jobs run automatically based on the schedule defined in vercel.json. No manual start/stop required.",
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Vercel cron jobs are managed automatically. Use GET to check status.",
      timestamp: new Date().toISOString(),
      info: {
        type: "Vercel Cron Job",
        management: "Automatic via vercel.json configuration",
        schedule: "Every 30 seconds (*/30 * * * * *)",
        endpoint: "/api/cron/datadog-logs",
      },
    },
    { status: 400 }
  );
}
