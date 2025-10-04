# Error Analyzer with Airia Integration

This project provides AI-powered error analysis using Datadog logs and Airia API to generate user-friendly error descriptions.

## Features

- **Automatic Error Fetching**: Retrieves the latest 10 errors from Datadog logs
- **AI-Powered Analysis**: Uses Airia API to convert technical errors into user-friendly explanations
- **Severity Classification**: Automatically categorizes errors as low, medium, high, or critical
- **Actionable Suggestions**: Provides suggested actions to resolve each error
- **Real-time Updates**: Refresh functionality to get the latest error analyses

## API Endpoints

### GET `/api/analyze-errors`
Fetches the latest Datadog errors and analyzes them with Airia.

**Response:**
```json
{
  "success": true,
  "message": "Analyzed 3 errors",
  "errors": ["[10/04/2025, 15:12:17] Error processing form submission..."],
  "analyses": [
    {
      "originalError": "AI analysis response",
      "userFriendlyMessage": "Clear explanation of what went wrong",
      "severity": "medium",
      "suggestedActions": ["Check system logs", "Restart service"],
      "timestamp": "2025-01-04T15:12:17.000Z"
    }
  ],
  "timestamp": "2025-01-04T15:12:17.000Z"
}
```

### POST `/api/analyze-errors`
Analyzes a custom error message with Airia.

**Request Body:**
```json
{
  "error": "Your custom error message here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Error analyzed successfully",
  "analysis": {
    "originalError": "AI analysis response",
    "userFriendlyMessage": "Clear explanation of what went wrong",
    "severity": "high",
    "suggestedActions": ["Immediate action required"],
    "timestamp": "2025-01-04T15:12:17.000Z"
  },
  "timestamp": "2025-01-04T15:12:17.000Z"
}
```

## Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
# Datadog API credentials
DD_API_KEY=your_datadog_api_key
DD_APP_KEY=your_datadog_app_key
DD_SITE=datadoghq.com  # Optional, defaults to datadoghq.com

# Airia API credentials
AIRIA_KEY=your_airia_api_key
```

## Usage

### 1. Web Interface
Visit `/errors` in your browser to see the interactive error analyzer interface.

### 2. API Testing
Use the provided test script:
```bash
chmod +x test-error-analyzer.sh
./test-error-analyzer.sh
```

### 3. Direct API Calls
```bash
# Fetch and analyze Datadog errors
curl -X GET http://localhost:3000/api/analyze-errors

# Analyze a custom error
curl -X POST http://localhost:3000/api/analyze-errors \
  -H "Content-Type: application/json" \
  -d '{"error": "Your error message here"}'
```

## Components

### ErrorAnalyzer Component
A React component that provides a user-friendly interface for viewing and analyzing errors.

**Features:**
- Real-time error fetching
- Severity-based color coding
- Expandable technical details
- Refresh functionality
- Error handling

### API Route (`/api/analyze-errors`)
Handles both GET and POST requests for error analysis.

**GET**: Fetches Datadog errors and analyzes them
**POST**: Analyzes custom error messages

## Error Severity Levels

- **Low** (✅): Minor issues that don't affect core functionality
- **Medium** (⚠️): Issues that may impact user experience
- **High** (🚨): Significant problems requiring attention
- **Critical** (🔥): Severe issues requiring immediate action

## Integration with Existing Code

This builds upon your existing Datadog webhook integration (`/api/webhooks/datadog/route.ts`) and cron job (`/api/cron/datadog-logs/route.ts`) by adding AI-powered analysis capabilities.

The system:
1. Uses the same Datadog API client configuration
2. Leverages your existing error fetching logic
3. Adds Airia integration for intelligent error analysis
4. Provides both API and UI interfaces

## Troubleshooting

### Common Issues

1. **"AIRIA_KEY environment variable is not set"**
   - Ensure `AIRIA_KEY` is set in your `.env` file

2. **"Failed to analyze error with Airia"**
   - Check your Airia API key and pipeline URL
   - Verify network connectivity to Airia API

3. **"No errors found"**
   - Check your Datadog API credentials
   - Verify the error query is returning results
   - Check if there are actually errors in the specified time range

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed console output for troubleshooting API calls and responses.

## Future Enhancements

- **Error Categorization**: Group similar errors together
- **Trend Analysis**: Track error patterns over time
- **Notification System**: Alert on critical errors
- **Custom Analysis Prompts**: Allow users to customize Airia analysis prompts
- **Error Resolution Tracking**: Mark errors as resolved and track resolution time
