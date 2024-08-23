import { datadogLogs } from '@datadog/browser-logs'

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || "",
  site: process.env.NEXT_PUBLIC_DD_HOST || "datadoghq.com",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
  service: process.env.NEXT_PUBLIC_DD_BRIDGE_UI || "bridge-ui",
  env: process.env.NODE_ENV || "local"
})

export class Logger {
    static info(message: string) {
        datadogLogs.logger.info(message);
    }

    static debug(message: string) {
        datadogLogs.logger.debug(message);
    }

    static error(message: string) {
        datadogLogs.logger.error(message);
    }
}
