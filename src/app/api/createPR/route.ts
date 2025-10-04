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

    // Return the conversation details
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.conversation_id || conversation.id,
        status: conversation.status,
        link: `https://app.all-hands.dev/conversations/${
          conversation.conversation_id || conversation.id
        }`,
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
