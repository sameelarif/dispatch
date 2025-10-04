#!/bin/bash

# Debug script to test Airia API directly
# Usage: ./debug-airia.sh

echo "Testing Airia API directly..."
echo "=============================="

# Test with a simple error message
ERROR_MESSAGE='[10/04/2025, 15:12:17] Error processing form submission: Error: Intentional API route error - this is a test exception'

echo "1. Testing Airia API with curl (using your successful example format)"
echo "--------------------------------------------------------------------"

# Use the exact format from your successful example
curl --location "https://demo.api.airia.ai/v2/PipelineExecution/f712a0e4-d875-4f50-9f56-3dea2424d439" \
--header "X-API-KEY: ak-Mzc1MDY3MTE1NXwxNzU5NTg0MzA2NjMzfHRpLVFXbHlhV0U9fDF8MjI3NzMzMTAyNiAg" \
--header "Content-Type: application/json" \
--data "{
\"userInput\": \"Please analyze this error log and provide a clear, user-friendly explanation of what went wrong, its severity level, and suggested actions to resolve it. Make it easy to understand for non-technical users.

Error Log Data:
${ERROR_MESSAGE}

Please provide:
1. A clear explanation of what the error means
2. Severity level (low, medium, high, critical)
3. Suggested actions to resolve the issue
4. Any additional context that would be helpful\",
\"asyncOutput\": false
}"

echo ""
echo ""
echo "2. Testing our API endpoint"
echo "---------------------------"

# Test our API endpoint
curl -X POST "http://localhost:3000/api/analyze-errors" \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"$ERROR_MESSAGE\"}"

echo ""
echo "Debug completed!"
