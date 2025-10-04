import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.ALLHANDS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ALLHANDS_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { exceptionMessage } = body;

    // Validate required fields
    if (!exceptionMessage) {
      return NextResponse.json(
        { error: "exceptionMessage is required" },
        { status: 400 }
      );
    }

    // Use the fixed repository
    const repository = "sameelarif/dispatch";

    // Prepare the message for AllHands API
    const initialUserMsg = `Fix the following exception: ${exceptionMessage}
    
    After making the fix, create a pull request to the main branch.`;

    // Call the AllHands OpenHands API
    const allhandsUrl = "https://app.all-hands.dev/api/conversations";

    const headers = {
      "x-session-api-key": apiKey,
      "Content-Type": "application/json",
    };

    const data = {
      initial_user_msg: initialUserMsg,
      repository: repository,
    };

    const response = await fetch(allhandsUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AllHands API error:", errorText);
      return NextResponse.json(
        {
          error: "Failed to create conversation with AllHands API",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const conversation = await response.json();
    const conversationId = conversation.conversation_id || conversation.id;

    // Wait 20 seconds before starting to poll
    console.log(
      `Waiting 20 seconds before polling conversation ${conversationId}...`
    );
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Poll the conversation status every 10 seconds
    let isComplete = false;
    let pollCount = 0;
    const maxPolls = 30; // Maximum 5 minutes of polling (30 * 10 seconds)

    while (!isComplete && pollCount < maxPolls) {
      try {
        const statusResponse = await fetch(
          `https://app.all-hands.dev/api/conversations/${conversationId}`,
          {
            method: "GET",
            headers: {
              "X-Session-API-Key": apiKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(
            `Poll ${pollCount + 1}: Status = ${
              statusData.status
            }, Runtime Status = ${statusData.runtime_status}, PR Number = ${
              statusData.pr_number || "undefined"
            }`
          );

          // Check if PR number is available (regardless of status)
          if (statusData.pr_number && statusData.pr_number.length > 0) {
            isComplete = true;
            console.log(
              `Conversation ${conversationId} completed with status: ${statusData.status} and PR number: ${statusData.pr_number}`
            );

            // Return the final conversation details with PR number
            return NextResponse.json({
              success: true,
              conversation: {
                id: conversationId,
                status: statusData.status,
                runtime_status: statusData.runtime_status,
                link: `https://app.all-hands.dev/conversations/${conversationId}`,
                pr_number: statusData.pr_number,
                title: statusData.title,
                selected_repository: statusData.selected_repository,
                selected_branch: statusData.selected_branch,
                last_updated_at: statusData.last_updated_at,
              },
            });
          }
        } else {
          console.error(
            `Failed to get status for conversation ${conversationId}:`,
            statusResponse.status
          );
        }
      } catch (error) {
        console.error(`Error polling conversation ${conversationId}:`, error);
      }

      pollCount++;
      if (!isComplete && pollCount < maxPolls) {
        console.log(
          `Waiting 10 seconds before next poll... (${pollCount}/${maxPolls})`
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    // If we've reached max polls without completion, return current status
    console.log(
      `Conversation ${conversationId} polling timed out after ${maxPolls} attempts`
    );
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversationId,
        status: "TIMEOUT",
        link: `https://app.all-hands.dev/conversations/${conversationId}`,
        message:
          "Conversation polling timed out. Check the link for current status.",
      },
    });
  } catch (error) {
    console.error("Error in createPR route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
