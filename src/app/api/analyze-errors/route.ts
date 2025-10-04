import { NextRequest, NextResponse } from "next/server";
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

// Airia API configuration
const AIRIA_API_KEY = "ak-Mzc1MDY3MTE1NXwxNzU5NTg0MzA2NjMzfHRpLVFXbHlhV0U9fDF8MjI3NzMzMTAyNiAg";
const AIRIA_PIPELINE_URL = "https://demo.api.airia.ai/v2/PipelineExecution/f712a0e4-d875-4f50-9f56-3dea2424d439";

interface AiriaResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

interface ErrorAnalysis {
  originalError: string;
  userFriendlyMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
  timestamp: string;
  errorCode?: string;
}

async function callAiriaAPI(errorData: string): Promise<string> {
  if (!AIRIA_API_KEY) {
    throw new Error("AIRIA_KEY environment variable is not set");
  }

  console.log("Calling Airia API with URL:", AIRIA_PIPELINE_URL);
  console.log("Using API Key:", AIRIA_API_KEY.substring(0, 10) + "...");

  try {
    const requestBody = {
      userInput: `ERROR ANALYSIS REQUEST: Please analyze this technical error log and provide a clear, user-friendly explanation. This is NOT market data or investment advice - this is a system error that needs technical analysis. ERROR LOG TO ANALYZE: ${errorData} Please provide: 1. What this error means in simple terms 2. Severity level (low, medium, high, critical) 3. What actions should be taken to fix it 4. Any additional technical context. Focus on technical error analysis, not financial advice.`,
      asyncOutput: false,
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(AIRIA_PIPELINE_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": AIRIA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airia API request failed:", response.status, response.statusText, errorText);
      throw new Error(`Airia API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Airia API response:", result);
    
    // Handle different response formats from Airia
    if (typeof result === 'string') {
      return result;
    } else if (result.result) {
      return result.result;
    } else if (result.message) {
      return result.message;
    } else if (result.data) {
      return typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
    } else if (result.$type === 'string' && result.result) {
      // Handle the specific format we saw: {"$type":"string","result":"..."}
      return result.result;
    } else {
      return JSON.stringify(result);
    }
  } catch (error) {
    console.error("Error calling Airia API:", error);
    throw error;
  }
}

async function fetchDatadogErrors(): Promise<string[]> {
  try {
    console.log("Fetching Datadog errors...");
    
    // Use the same configuration as the working /api/cron/datadog-logs endpoint
    const response = await logsApi.listLogsGet({
      filterQuery:
        'NOT "webhook" AND (status:error OR @level:error OR @severity:error OR "Error:" OR "Exception:" OR "Failed:" OR "error" OR "ERROR" OR "Exception" OR "Failed")',
      sort: "timestamp", // Use ascending sort like the working endpoint
      pageLimit: 100, // Increased limit to get more errors
    });

    console.log("Datadog API response received:", response.data?.length || 0, "logs");

    if (!response.data) {
      return [];
    }

    const logMessages: string[] = [];

    // Process logs in reverse order to get most recent first (since we're using ascending sort)
    const reversedLogs = [...response.data].reverse();

    for (const log of reversedLogs) {
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
    console.error("Error fetching Datadog logs:", error);
    // Return empty array instead of throwing to allow custom error analysis
    return [];
  }
}

function parseErrorAnalysis(airiaResponse: string, originalError?: string): ErrorAnalysis {
  // Try to extract structured information from Airia response
  const lines = airiaResponse.split('\n').filter(line => line.trim());
  
  // Default values
  const userFriendlyMessage = airiaResponse;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let suggestedActions: string[] = [];
  let errorCode: string | undefined;

  // Extract error code from original error message
  if (originalError) {
    // Look for common error code patterns
    const errorCodePatterns = [
      /Error:\s*([A-Z0-9_-]+)/i,           // Error: CODE123
      /Exception:\s*([A-Z0-9_-]+)/i,       // Exception: CODE123
      /HTTP\s+(\d{3})/,                    // HTTP 500
      /status[=:]\s*(\d{3})/i,             // status=500 or status:500
      /exit\s+code\s+(\d+)/i,              // exit code 1
      /code\s+(\d+)/i,                     // code 1
      /(\d{4,6})/,                         // 4-6 digit codes
      /([A-Z]{2,4}\d{2,4})/,              // ABC123, ABCD1234
    ];

    for (const pattern of errorCodePatterns) {
      const match = originalError.match(pattern);
      if (match) {
        errorCode = match[1] || match[0];
        break;
      }
    }
  }

  // Look for severity indicators
  const severityMatch = airiaResponse.match(/(?:severity|level):\s*(low|medium|high|critical)/i);
  if (severityMatch) {
    severity = severityMatch[1].toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
  }

  // Look for action suggestions
  const actionMatch = airiaResponse.match(/(?:actions?|suggestions?|steps?):\s*(.+)/i);
  if (actionMatch) {
    suggestedActions = actionMatch[1].split(/[,;]/).map(action => action.trim()).filter(action => action);
  }

  return {
    originalError: originalError || "No original error provided",
    userFriendlyMessage: airiaResponse,
    severity,
    suggestedActions,
    timestamp: new Date().toISOString(),
    errorCode,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get the errors from the working /api/cron/datadog-logs endpoint
    const cronResponse = await fetch('http://localhost:3000/api/cron/datadog-logs');
    const errors: string[] = await cronResponse.json();
    
    if (errors.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No Datadog errors found in the recent logs.",
        errors: [],
        analyses: [],
        suggestion: "No errors were found in the Datadog logs. This could mean your system is running smoothly!",
      });
    }

    // Send all errors together to Airia for complete context analysis
    const allErrorsText = errors.join('\n\n---\n\n'); // Join all errors with separators
    let analysis: ErrorAnalysis;
    
    try {
      const airiaResponse = await callAiriaAPI(allErrorsText);
      analysis = parseErrorAnalysis(airiaResponse, allErrorsText);
    } catch (airiaError) {
      console.error("Failed to analyze error with Airia:", airiaError);
      // Fallback analysis with error code extraction
      analysis = parseErrorAnalysis("Unable to analyze this error automatically. Please review the technical details below.", allErrorsText);
    }

    return NextResponse.json({
      success: true,
      message: `Found ${errors.length} errors, analyzed complete context with AI`,
      errors,
      analyses: [analysis],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in error analysis endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch and analyze errors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customError = body.error || body.message || "";
    
    if (!customError) {
      return NextResponse.json(
        {
          success: false,
          error: "No error message provided",
        },
        { status: 400 }
      );
    }

    // Analyze the custom error with Airia
    const airiaResponse = await callAiriaAPI(customError);
    const analysis = parseErrorAnalysis(airiaResponse, customError);

    return NextResponse.json({
      success: true,
      message: "Error analyzed successfully",
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error analyzing custom error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
