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

    // Process the data (you can add more logic here)
    const processedData = {
      id: Date.now().toString(),
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      message: body.message?.trim() || "",
      submittedAt: new Date().toISOString(),
    };

    // Log the processed data
    console.log("Processed form data:", processedData);

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      data: processedData,
    });
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
