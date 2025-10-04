# Datadog Integration Setup

This application uses [Vercel's native cron jobs](https://vercel.com/docs/cron-jobs) to automatically monitor Datadog logs every 30 seconds and process them through AI to generate human-readable error messages.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Datadog Configuration
DD_API_KEY=your_datadog_api_key_here
DD_APP_KEY=your_datadog_app_key_here
DD_SITE=datadoghq.com

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Getting Datadog API Keys

1. Go to [Datadog API Keys](https://app.datadoghq.com/organization-settings/application-keys)
2. Create a new API key
3. Create a new Application key
4. Add both keys to your `.env.local` file

## Vercel Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/datadog-logs",
      "schedule": "*/30 * * * * *"
    }
  ]
}
```

## API Endpoints

### Cron Job Endpoint

- **GET** `/api/cron/datadog-logs` - Vercel cron job endpoint (automatically triggered)
- **GET** `/api/cron/datadog` - Check cron job configuration and status

### Webhook Endpoint

- **POST** `/api/webhooks/datadog` - Receives processed logs and generates AI explanations

## Usage

### Local Development

1. Set up your environment variables
2. Start the development server: `npm run dev`
3. The cron job will automatically run every 30 seconds in production
4. For local testing, you can manually trigger: `curl http://localhost:3001/api/cron/datadog-logs`

### Production Deployment

1. Deploy to Vercel: `vercel --prod`
2. Set environment variables in Vercel dashboard
3. The cron job will automatically start running every 30 seconds
4. Monitor logs in Vercel dashboard or console

## Features

- **Vercel Native**: Uses Vercel's built-in cron job system for reliability
- **Duplicate Prevention**: Tracks processed log IDs to avoid reprocessing
- **Memory Management**: Automatically cleans up old log IDs to prevent memory overflow
- **AI Processing**: Each new log is sent to the webhook for AI-generated human-readable explanations
- **Comprehensive Logging**: Detailed console output for monitoring and debugging
- **Automatic Scaling**: Vercel handles scaling and reliability

## Customization

You can customize the log search query in `src/app/api/cron/datadog-logs/route.ts` by modifying the `query` parameter in the `listLogsGet` call. For example:

```typescript
query: "status:error service:my-service"; // Only error logs from specific service
```

## Cron Expression

The current schedule `*/30 * * * * *` means:

- Every 30 seconds
- Every minute
- Every hour
- Every day
- Every month
- Every day of the week

You can modify this in `vercel.json` using [cron expression format](https://vercel.com/docs/cron-jobs#cron-expressions).
