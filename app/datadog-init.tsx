"use client";

import { datadogRum } from "@datadog/browser-rum";


console.log("Datadog Init", process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID, process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN);

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_RUM_APPLICATION_ID || "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || "",
  site: "datadoghq.com",
  service: "avail-bridge-ui",
  env: process.env.NEXT_PUBLIC_ENVIRONMENT || "staging",
  version: "1.0.0",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: "mask-user-input",
});

export default function DatadogInit() {
  return null;
}
