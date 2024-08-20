"use client";

import { datadogRum } from "@datadog/browser-rum";

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID || "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || "",
  site: "datadoghq.com",
  service: "avail-bridge-ui",
  env: process.env.NEXT_PUBLIC_ENVIRONMENT || "staging",
  version: "1.0.0",
  sessionSampleRate: Number(process.env.NEXT_PUBLIC_SESSION_SAMPLE_RATE) || 100,
  sessionReplaySampleRate: Number(process.env.NEXT_PUBLIC_SESSION_REPLAY_SAMPLE_RATE) || 20,
  trackUserInteractions: process.env.NEXT_PUBLIC_TRACK_USER_INTERACTIONS === 'true',
  trackResources: process.env.NEXT_PUBLIC_TRACK_RESOURCES === 'true',
  trackLongTasks: process.env.NEXT_PUBLIC_TRACK_LONG_TASKS === 'true',
  defaultPrivacyLevel: "mask-user-input",
});

export default function DatadogInit() {
  return null;
}


// sessionSampleRate: 100,
// sessionReplaySampleRate: 20,
// trackUserInteractions: true,
// trackResources: true,
// trackLongTasks: true,