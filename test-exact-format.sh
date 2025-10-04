#!/bin/bash

# Test the exact request format our code is using
echo "Testing exact request format from our code..."

ERROR_MESSAGE="[10/04/2025, 15:12:17] Error processing form submission: Error: Intentional API route error - this is a test exception"

# Use the exact format from our code
curl -s --location "https://demo.api.airia.ai/v2/PipelineExecution/f712a0e4-d875-4f50-9f56-3dea2424d439" \
--header "X-API-KEY: ak-Mzc1MDY3MTE1NXwxNzU5NTg0MzA2NjMzfHRpLVFXbHlhV0U9fDF8MjI3NzMzMTAyNiAg" \
--header "Content-Type: application/json" \
--data "{
\"userInput\": \"ERROR ANALYSIS REQUEST: Please analyze this technical error log and provide a clear, user-friendly explanation. This is NOT market data or investment advice - this is a system error that needs technical analysis.

ERROR LOG TO ANALYZE:
${ERROR_MESSAGE}

Please provide:
1. What this error means in simple terms
2. Severity level (low, medium, high, critical)
3. What actions should be taken to fix it
4. Any additional technical context

Focus on technical error analysis, not financial advice.\",
\"asyncOutput\": false
}" | jq '.'
