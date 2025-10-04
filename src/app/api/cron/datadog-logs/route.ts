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

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const PHONE_NUMBER = process.env.PHONE_NUMBER;

async function sendSMS(message: string): Promise<boolean> {
  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_PHONE_NUMBER ||
    !PHONE_NUMBER
  ) {
    console.error("Missing Twilio configuration");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    if (response.ok) {
      console.log("SMS sent successfully");
      return true;
    } else {
      console.error("Failed to send SMS:", await response.text());
      return false;
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

async function createPR(
  exceptionMessage: string
): Promise<{ success: boolean; pr_number?: number[]; error?: string }> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/createPR`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exceptionMessage: exceptionMessage,
        }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error calling createPR:", error);
    return { success: false, error: "Failed to call createPR API" };
  }
}

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

  // If we found new error messages, send SMS and create PR
  if (messages.length > 0) {
    console.log(`Found ${messages.length} new error(s), processing...`);

    // Send initial SMS notification
    await sendSMS("🚨 We found an error on prod and fixing it");

    // Combine all error messages for the PR
    const combinedErrorMessage = messages.join("\n\n");

    // Create PR to fix the error
    console.log("Creating PR to fix the error...");
    const prResult = await createPR(combinedErrorMessage);

    if (
      prResult.success &&
      prResult.pr_number &&
      prResult.pr_number.length > 0
    ) {
      // Send completion SMS with PR link
      const prNumber = prResult.pr_number[0];
      const prLink = `https://github.com/sameelarif/dispatch/pull/${prNumber}`;
      await sendSMS(`✅ Fix complete! PR created: ${prLink}`);
      console.log(`PR created successfully: ${prLink}`);
    } else {
      // Send error SMS if PR creation failed
      await sendSMS(
        `❌ Error creating PR: ${prResult.error || "Unknown error"}`
      );
      console.error("Failed to create PR:", prResult.error);
    }
  }

  return NextResponse.json({
    message: `Processed ${messages.length} new error(s)`,
    errors: messages,
  });
}
