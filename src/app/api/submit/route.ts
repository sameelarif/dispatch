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

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Process the user data
    const userData = {
      id: Date.now().toString(),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      message: body.message?.trim() || "",
      submittedAt: new Date().toISOString(),
    };

    try {
      // Process user data with proper error handling
      const processedData = await processUserData(userData);

      // Log the processed data
      console.log("Processed form data:", processedData);

      return NextResponse.json({
        success: true,
        message: "Form submitted successfully",
        data: processedData,
      });
    } catch (processingError) {
      // Log the processing error for monitoring
      console.error("Processing error:", processingError);

      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown processing error";

      return NextResponse.json(
        { error: `Processing failed: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Process user data with proper validation and error handling
async function processUserData(userData: any) {
  // Validate user data
  if (!userData.name || userData.name.length < 2) {
    throw new Error("Name must be at least 2 characters long");
  }

  if (!userData.email || !userData.email.includes("@")) {
    throw new Error("Invalid email format");
  }

  // Simulate processing delay (like a database operation)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Return processed data
  return {
    ...userData,
    processedAt: new Date().toISOString(),
    status: "processed",
    id: userData.id || Date.now().toString(),
  };
}
