import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the form data
    console.log("Form submission received:", {
      timestamp: new Date().toISOString(),
      data: body,
    });

    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Simulate a realistic business logic error
    // This could happen in a real application when processing user data
    const userData = {
      id: Date.now().toString(),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      message: body.message?.trim() || "",
      submittedAt: new Date().toISOString(),
    };

    // Simulate a database operation that could fail
    // This is a realistic error that would be caught by error monitoring
    try {
      // Simulate a database connection issue or data processing error
      const processedData = await processUserData(userData);

      // Log the processed data
      console.log("Processed form data:", processedData);

      return NextResponse.json({
        success: true,
        message: "Form submitted successfully",
        data: processedData,
      });
    } catch (processingError) {
      // This error will be caught by Datadog and trigger the SMS/PR workflow
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown processing error";
      throw new Error(`Failed to process user data: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simulate a function that could fail in a real application
async function processUserData(userData: any) {
  // Simulate a realistic business logic error
  // This could be a database operation, external API call, or data validation

  // Simulate a random failure (30% chance) to make it realistic
  if (Math.random() < 0.3) {
    throw new Error("Database connection timeout - unable to save user data");
  }

  // Simulate another type of error that could occur
  if (userData.email.includes("test@example.com")) {
    throw new Error("Invalid email domain - test@example.com is not allowed");
  }

  // Simulate a data processing error
  if (userData.name.length < 2) {
    throw new Error(
      "Name validation failed - name must be at least 2 characters"
    );
  }

  // If we get here, processing was successful
  return {
    ...userData,
    processedAt: new Date().toISOString(),
    status: "processed",
  };
}
