export class Logger {
    static log(message: string) {
        console.log(message);
    }

    static debug(message: string) {
        if (process.env.NODE_ENV === "production") {
            return
        }

        console.debug(message);
    }

    static error(message: string) {
        // error logging/monitoring service
        console.error(message);
    }
}
