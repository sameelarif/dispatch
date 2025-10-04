"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [cronStatus, setCronStatus] = useState<
    "unknown" | "configured" | "error"
  >("unknown");
  const [cronInfo, setCronInfo] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkCronStatus = async () => {
    try {
      const response = await fetch("/api/cron/datadog");
      const data = await response.json();
      setCronStatus(data.status);
      setCronInfo(data.info);
    } catch (error) {
      console.error("Error checking cron status:", error);
      setCronStatus("error");
    }
  };

  // Check cron status on component mount
  useEffect(() => {
    checkCronStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Dispatch
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Fill out the form below to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                placeholder="Tell us about yourself (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>

            {submitStatus === "success" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  ✅ Form submitted successfully! Check the console for logged
                  data.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  ❌ Error submitting form. Please try again.
                </p>
              </div>
            )}
          </form>

          {/* Datadog Cron Controls */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Datadog Log Monitoring
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Status:
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      cronStatus === "configured"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                        : cronStatus === "error"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {cronStatus === "configured"
                      ? "🟢 Configured"
                      : cronStatus === "error"
                      ? "🔴 Error"
                      : "⚪ Unknown"}
                  </span>
                </span>
                <button
                  onClick={checkCronStatus}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  Refresh
                </button>
              </div>

              {cronInfo && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <strong>Type:</strong> {cronInfo.type}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <strong>Schedule:</strong> {cronInfo.schedule}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <strong>Endpoint:</strong> {cronInfo.endpoint}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <strong>Environment:</strong>
                    <span
                      className={`ml-1 ${
                        cronInfo.environment?.hasApiKey
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      API Key {cronInfo.environment?.hasApiKey ? "✓" : "✗"}
                    </span>
                    <span
                      className={`ml-2 ${
                        cronInfo.environment?.hasAppKey
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      App Key {cronInfo.environment?.hasAppKey ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vercel cron job automatically monitors Datadog logs every 30
                seconds and processes new entries through AI for human-readable
                explanations. No manual management required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
