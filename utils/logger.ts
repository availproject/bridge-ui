import { datadogLogs } from '@datadog/browser-logs'

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_RUM_CLIENT_TOKEN || "",
  site: process.env.NEXT_PUBLIC_DD_HOST || "datadoghq.com",
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
})

export class Logger {
    static log(message: string) {
        datadogLogs.logger.info(message);
    }

    static debug(message: string) {
        datadogLogs.logger.debug(message);
    }

    static error(message: string) {
        datadogLogs.logger.error(message);
    }
}
