"use client";

import { useState, useEffect } from "react";

interface ErrorAnalysis {
  originalError: string;
  userFriendlyMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedActions: string[];
  timestamp: string;
  errorCode?: string;
}

interface AnalysisResponse {
  success: boolean;
  message: string;
  errors: string[];
  analyses: ErrorAnalysis[];
  timestamp: string;
  suggestion?: string;
}

const severityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const severityIcons = {
  low: '✅',
  medium: '⚠️',
  high: '🚨',
  critical: '🔥',
};

export default function ErrorAnalyzer() {
  const [analyses, setAnalyses] = useState<ErrorAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const fetchErrorAnalyses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/analyze-errors', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AnalysisResponse = await response.json();
      
      if (data.success) {
        setAnalyses(data.analyses);
        setLastUpdated(data.timestamp);
        setSuggestion(data.suggestion || null);
      } else {
        setError(data.message || 'Failed to fetch error analyses');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. The analysis is taking longer than expected. Try analyzing a custom error instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };


  // Don't automatically fetch on page load since it can take a long time
  // useEffect(() => {
  //   fetchErrorAnalyses();
  // }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Error Analyzer
        </h1>
        <p className="text-gray-600">
          AI-powered error analysis using Datadog logs and Airia
        </p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mb-6">
        <button
          onClick={fetchErrorAnalyses}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Fetch Datadog Errors'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {suggestion && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{suggestion}</p>
        </div>
      )}

      {analyses.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No errors found or analyzed yet.</p>
        </div>
      )}

      <div className="space-y-6">
        {analyses.map((analysis, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {severityIcons[analysis.severity]}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColors[analysis.severity]}`}
                >
                  {analysis.severity.toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(analysis.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {analysis.userFriendlyMessage}
              </p>
            </div>

            {analysis.suggestedActions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-2">
                  Suggested Actions:
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.suggestedActions.map((action, actionIndex) => (
                    <li key={actionIndex} className="text-gray-700">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                View Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded border">
                {analysis.errorCode && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded">
                    <div className="text-xs font-semibold text-red-800 mb-1">Error Code:</div>
                    <code className="text-sm text-red-900 font-mono">{analysis.errorCode}</code>
                  </div>
                )}
                
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-800 mb-1">Original Error Message:</div>
                  <div className="p-2 bg-white border rounded">
                    <code className="text-sm text-gray-800 font-mono break-all">
                      {analysis.originalError}
                    </code>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-800 mb-1">JavaScript Variable:</div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <code className="text-xs text-blue-800 font-mono">
                      const errorMessage = `{analysis.originalError.replace(/`/g, '\\`')}`;
                    </code>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs font-semibold text-gray-800 mb-1">JSON Format:</div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <code className="text-xs text-green-800 font-mono">
                      {JSON.stringify(analysis.originalError)}
                    </code>
                  </div>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
