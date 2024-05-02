type PollerCondition<T> = (result: T | undefined) => boolean;

/**
 * 
 * @param asyncFn function to poll
 * @param args args of the function to poll
 * @param delay delay in seconds
 * @param condition condition to stop polling
 */
export async function pollWithDelay<T>(
    asyncFn: (...args: any[]) => Promise<T>,
    args: any[],
    delay = 1000,
    condition: PollerCondition<T> = () => true
) {
    const delayInMs = delay * 1000;

    let result: T | undefined;
    while (condition(result)) {
        try {
            result = await asyncFn(...args);
        } catch (error) {
            // Handle errors here (optional)
            console.error("Error during polling:", error);
        }
        await new Promise(resolve => setTimeout(resolve, delayInMs));
    }
}
