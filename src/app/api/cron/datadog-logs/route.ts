import { NextResponse } from "next/server";
import { client, v2 } from "@datadog/datadog-api-client";

// Datadog API configuration
const configuration = client.createConfiguration({
  authMethods: {
    apiKeyAuth: process.env.DD_API_KEY,
    appKeyAuth: process.env.DD_APP_KEY,
  },
});

if (process.env.DD_SITE) {
  configuration.setServerVariables({
    site: process.env.DD_SITE,
  });
}

const logsApi = new v2.LogsApi(configuration);

// Store processed log IDs to avoid duplicates
const processedLogIds = new Set<string>();

async function searchNewLogs(): Promise<string[]> {
  try {
    const response = await logsApi.listLogsGet({
      filterQuery:
        'NOT "webhook" AND (status:error OR @level:error OR @severity:error OR "Error:" OR "Exception:" OR "Failed:" OR "error" OR "ERROR" OR "Exception" OR "Failed")',
      sort: "timestamp",
      pageLimit: 1000,
    });

    if (!response.data) {
      return [];
    }

    const logMessages: string[] = [];

    for (const log of response.data) {
      const logId = log.id as string;
      if (!logId || processedLogIds.has(logId)) {
        continue;
      }

      processedLogIds.add(logId);
      const message = log.attributes?.message;
      const timestamp = log.attributes?.timestamp;

      if (message && typeof message === "string") {
        let formattedDate = "";
        if (timestamp) {
          // Datadog timestamps are in milliseconds since epoch
          const date = new Date(timestamp);
          formattedDate = date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
        }
        const messageWithDate = formattedDate
          ? `[${formattedDate}] ${message}`
          : message;
        logMessages.push(messageWithDate);
      }
    }

    return logMessages;
  } catch (error) {
    console.error("Error searching logs:", error);
    return [];
  }
}

export async function GET() {
  const messages = await searchNewLogs();
  return NextResponse.json(messages);
}

export async function POST() {
  const messages = await searchNewLogs();
  return NextResponse.json(messages);
}
