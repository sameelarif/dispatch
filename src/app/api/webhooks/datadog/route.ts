import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the incoming Datadog webhook
    console.log("Datadog webhook received:", {
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
    });

    // Process different types of Datadog webhooks
    if (body.alert) {
      console.log("Processing Datadog alert:", {
        alertId: body.alert.id,
        title: body.alert.title,
        status: body.alert.status,
        severity: body.alert.severity,
        tags: body.alert.tags,
      });
    }

    if (body.event) {
      console.log("Processing Datadog event:", {
        eventId: body.event.id,
        title: body.event.title,
        text: body.event.text,
        priority: body.event.priority,
        tags: body.event.tags,
      });
    }

    if (body.monitor) {
      console.log("Processing Datadog monitor:", {
        monitorId: body.monitor.id,
        name: body.monitor.name,
        status: body.monitor.status,
        type: body.monitor.type,
      });
    }

    // Log the webhook type and any additional data
    console.log("Datadog webhook processed successfully:", {
      webhookType: body.type || "unknown",
      hasAlert: !!body.alert,
      hasEvent: !!body.event,
      hasMonitor: !!body.monitor,
      rawData: body,
    });

    return NextResponse.json({
      success: true,
      message: "Datadog webhook processed successfully",
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
    message: "Datadog webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
