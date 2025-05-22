import { datadogLogs } from "@datadog/browser-logs";

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || "",
  site: process.env.NEXT_PUBLIC_DD_HOST || "datadoghq.com",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
  service: process.env.NEXT_PUBLIC_DD_SERVICE || "avail-bridge-ui",
  env: process.env.NEXT_PUBLIC_ENVIRONMENT || "local",
});

export class Logger {
  static info(message: string, ...fields: [string, any][]) {
    const extraFields = Object.fromEntries(fields);
    datadogLogs.logger.info(message, extraFields);
    console.log(message);
  }

  static debug(message: string) {
    datadogLogs.logger.debug(message);
    console.debug(message);
  }

  static error(message: string, ...fields: [string, any][]) {
    const extraFields = Object.fromEntries(fields);

    datadogLogs.logger.error(message, extraFields);
  }
}
