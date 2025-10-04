#!/usr/bin/env node

/**
 * Test script for Datadog cron job functionality
 * Run with: node test-datadog-cron.js
 */

const BASE_URL = "http://localhost:3001";

async function testCronEndpoints() {
  console.log("🧪 Testing Datadog Vercel Cron Job Endpoints\n");

  try {
    // Test GET endpoint (check status)
    console.log("1. Checking cron job configuration...");
    const statusResponse = await fetch(`${BASE_URL}/api/cron/datadog`);
    const statusData = await statusResponse.json();
    console.log("✅ Configuration:", statusData);

    // Test manual trigger of cron job endpoint (GET)
    console.log("\n2. Manually triggering cron job endpoint (GET)...");
    const triggerResponse = await fetch(`${BASE_URL}/api/cron/datadog-logs`, {
      method: "GET",
      headers: {
        "User-Agent": "vercel-cron/1.0", // Simulate Vercel cron request
      },
    });
    const triggerData = await triggerResponse.json();
    console.log("✅ GET trigger result:", triggerData);

    // Test manual trigger of cron job endpoint (POST)
    console.log("\n3. Manually triggering cron job endpoint (POST)...");
    const triggerPostResponse = await fetch(
      `${BASE_URL}/api/cron/datadog-logs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "vercel-cron/1.0",
        },
      }
    );
    const triggerPostData = await triggerPostResponse.json();
    console.log("✅ POST trigger result:", triggerPostData);

    // Test POST endpoint (should return error for Vercel cron)
    console.log("\n4. Testing POST endpoint (should return error)...");
    const postResponse = await fetch(`${BASE_URL}/api/cron/datadog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const postData = await postResponse.json();
    console.log("✅ POST result (expected error):", postData);

    // Test webhook endpoint
    console.log("\n5. Testing webhook endpoint...");
    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/datadog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Datadog-Cron/1.0",
      },
      body: JSON.stringify({
        alert: {
          id: "test-123",
          title: "Test Alert",
          status: "alert",
          severity: "error",
          message: "This is a test error message",
        },
        type: "log",
        timestamp: new Date().toISOString(),
      }),
    });
    const webhookData = await webhookResponse.json();
    console.log("✅ Webhook result:", webhookData);

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📝 Note: Vercel cron jobs run automatically in production.");
    console.log(
      "   In development, you can manually trigger the endpoint for testing."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log(
      "\n💡 Make sure the development server is running: npm run dev"
    );
  }
}

// Run the test
testCronEndpoints();
