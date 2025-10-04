#!/bin/bash

# Test script for the error analyzer API
# Usage: ./test-error-analyzer.sh

echo "Testing Error Analyzer API..."
echo "=============================="

# Test 1: Fetch and analyze Datadog errors
echo "1. Testing GET /api/analyze-errors (fetch Datadog errors and analyze with Airia)"
echo "------------------------------------------------------------------------------"

RESPONSE=$(curl -s -X GET "http://localhost:3000/api/analyze-errors")
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Analyze a custom error
echo "2. Testing POST /api/analyze-errors (analyze custom error)"
echo "--------------------------------------------------------"

CUSTOM_ERROR='[10/04/2025, 15:12:17] Error processing form submission: Error: Intentional API route error - this is a test exception'

RESPONSE=$(curl -s -X POST "http://localhost:3000/api/analyze-errors" \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"$CUSTOM_ERROR\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Test the original datadog-logs endpoint for comparison
echo "3. Testing original /api/cron/datadog-logs endpoint (for comparison)"
echo "--------------------------------------------------------------------"

RESPONSE=$(curl -s -X GET "http://localhost:3000/api/cron/datadog-logs")
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "Test completed!"
echo "=============="
