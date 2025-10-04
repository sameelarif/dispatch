import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the incoming Datadog webhook
    console.log("Datadog webhook received:", {
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
    });

    // Generate human-readable error message using AI
    let humanReadableError = null;
    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `Convert this Datadog webhook data into a clear, human-readable error message. Focus on what the issue is, its severity, and what actions might be needed. Be concise but informative.

Datadog webhook data:
${JSON.stringify(body, null, 2)}

Provide a clear explanation of what this alert/error means in plain English.`,
      });

      humanReadableError = text;
      console.log("AI-generated human-readable error:", humanReadableError);
    } catch (aiError) {
      console.error(
        "Failed to generate human-readable error with AI:",
        aiError
      );
    }

    // Process different types of Datadog webhooks
    if (body.alert) {
      console.log("Processing Datadog alert:", {
        alertId: body.alert.id,
        title: body.alert.title,
        status: body.alert.status,
        severity: body.alert.severity,
        tags: body.alert.tags,
        humanReadableError,
      });
    }

    if (body.event) {
      console.log("Processing Datadog event:", {
        eventId: body.event.id,
        title: body.event.title,
        text: body.event.text,
        priority: body.event.priority,
        tags: body.event.tags,
        humanReadableError,
      });
    }

    if (body.monitor) {
      console.log("Processing Datadog monitor:", {
        monitorId: body.monitor.id,
        name: body.monitor.name,
        status: body.monitor.status,
        type: body.monitor.type,
        humanReadableError,
      });
    }

    // Log the webhook type and any additional data
    console.log("Datadog webhook processed successfully:", {
      webhookType: body.type || "unknown",
      hasAlert: !!body.alert,
      hasEvent: !!body.event,
      hasMonitor: !!body.monitor,
      humanReadableError,
      rawData: body,
    });

    return NextResponse.json({
      success: true,
      message: "Datadog webhook processed successfully",
      humanReadableError,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing Datadog webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process Datadog webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("challenge");

  console.log("Datadog webhook verification request:", {
    timestamp: new Date().toISOString(),
    challenge: challenge,
  });

  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({
    message: "Datadog webhook endpoint  tive",
    timestamp: new Date().toISOString(),
  });
}
