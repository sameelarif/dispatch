import { NextResponse } from "next/server";
import { client, v2 } from "@datadog/datadog-api-client";

// Datadog API configuration
const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY,
    appKeyAuth: process.env.DD_APP_KEY,
  },
});

// Set the site if not using the default
if (process.env.DD_SITE) {
  configuration.setServerVariables({
    site: process.env.DD_SITE,
  });
}

const logsApi = new v2.LogsApi(configuration);

// Store processed log IDs to avoid duplicates (in production, use a database)
const processedLogIds = new Set<string>();
const MAX_STORED_IDS = 10000; // Prevent memory overflow

// Store last processed timestamp (in production, use a database)
let lastProcessedTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // Start 4 hours ago

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: string;
  service: string;
  source: string;
  tags: string[];
  attributes: Record<string, unknown>;
}

async function searchNewLogs(): Promise<void> {
  try {
    console.log(
      `[${new Date().toISOString()}] Searching for new logs since ${lastProcessedTime.toISOString()}`
    );

    // Search for logs from the last processed time
    const response = await logsApi.listLogsGet({
      filterFrom: lastProcessedTime,
      filterTo: new Date(),
      filterQuery:
        'NOT "webhook" AND (status:error OR @level:error OR @severity:error OR "Error:" OR "Exception:" OR "Failed:" OR "error" OR "ERROR" OR "Exception" OR "Failed")',
      sort: "-timestamp", // Sort by newest first
      pageLimit: 1000, // Adjust based on your needs
    });

    if (!response.data) {
      console.log("No logs data received");
      return;
    }

    const newLogs: LogEntry[] = [];
    let processedCount = 0;

    for (const log of response.data) {
      const logId = log.id as string;

      // Skip if we've already processed this log
      if (processedLogIds.has(logId)) {
        continue;
      }

      // Add to processed set
      processedLogIds.add(logId);
      processedCount++;

      // Clean up old IDs to prevent memory overflow
      if (processedLogIds.size > MAX_STORED_IDS) {
        const idsToDelete = Array.from(processedLogIds).slice(0, 1000);
        idsToDelete.forEach((id) => processedLogIds.delete(id));
      }

      // Extract log information
      const logEntry: LogEntry = {
        id: logId,
        timestamp:
          typeof log.attributes?.timestamp === "string"
            ? log.attributes.timestamp
            : new Date().toISOString(),
        message: log.attributes?.message || "No message",
        level: (log.attributes?.status as string) || "info",
        service: log.attributes?.service || "unknown",
        source: "unknown", // Source is not directly available in LogAttributes
        tags: log.attributes?.tags || [],
        attributes: (log.attributes as Record<string, unknown>) || {},
      };

      newLogs.push(logEntry);

      // Log the new log entry with full content
      console.log(
        `[NEW LOG] ${logEntry.timestamp} | ${logEntry.level.toUpperCase()} | ${
          logEntry.service
        } | ${logEntry.message}`
      );

      // Print the full log content for detailed analysis
      console.log("📄 LOG CONTENT:");
      console.log("ID:", logEntry.id);
      console.log("Message:", logEntry.message);
      console.log("Level/Status:", logEntry.level);
      console.log("Service:", logEntry.service);
      console.log("Source:", logEntry.source);
      console.log("Host:", log.attributes?.host || "N/A");
      console.log("Tags:", logEntry.tags.join(", ") || "None");
      console.log("Full Attributes:", JSON.stringify(log.attributes, null, 2));
      console.log("---");
    }

    // Update last processed time
    lastProcessedTime = new Date();

    console.log(
      `Processed ${processedCount} new logs (${newLogs.length} unique)`
    );

    // Send new logs to webhook for AI processing
    if (newLogs.length > 0) {
      await sendLogsToWebhook(newLogs);
    }
  } catch (error) {
    console.error("Error searching for new logs:", error);
  }
}

async function sendLogsToWebhook(logs: LogEntry[]): Promise<void> {
  try {
    const webhookUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    }/api/webhooks/datadog`;

    for (const log of logs) {
      // Create a webhook payload similar to Datadog's format
      const webhookPayload = {
        alert: {
          id: log.id,
          title: `Log Alert: ${log.level.toUpperCase()} in ${log.service}`,
          status: log.level === "error" ? "alert" : "info",
          severity: log.level,
          tags: log.tags,
          message: log.message,
          timestamp: log.timestamp,
        },
        event: {
          id: log.id,
          title: `Log Event: ${log.service}`,
          text: log.message,
          priority: log.level === "error" ? "high" : "normal",
          tags: log.tags,
          timestamp: log.timestamp,
        },
        monitor: {
          id: log.id,
          name: `Log Monitor: ${log.service}`,
          status: log.level === "error" ? "alert" : "ok",
          type: "log",
        },
        type: "log",
        timestamp: log.timestamp,
        rawLog: log,
        // Include full log content for AI processing
        logContent: {
          message: log.message,
          level: log.level,
          service: log.service,
          source: log.source,
          host: log.attributes?.host,
          tags: log.tags,
          fullAttributes: log.attributes,
        },
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Datadog-Cron/1.0",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        console.error(
          `Failed to send log ${log.id} to webhook: ${response.status}`
        );
      } else {
        console.log(`Successfully sent log ${log.id} to webhook`);
      }
    }
  } catch (error) {
    console.error("Error sending logs to webhook:", error);
  }
}

// Shared handler for both GET and POST requests
async function handleCronJob() {
  try {
    // Check if required environment variables are set
    if (!process.env.DD_API_KEY || !process.env.DD_APP_KEY) {
      console.error(
        "Missing required environment variables: DD_API_KEY and DD_APP_KEY"
      );
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    console.log("Datadog log search triggered - starting search");

    // Execute the log search
    await searchNewLogs();

    return NextResponse.json({
      success: true,
      message: "Datadog log search completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in Datadog log search:", error);
    return NextResponse.json(
      {
        error: "Log search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint (Vercel's default cron job trigger)
export async function GET() {
  return handleCronJob();
}

// POST endpoint (for manual testing and flexibility)
export async function POST() {
  return handleCronJob();
}
