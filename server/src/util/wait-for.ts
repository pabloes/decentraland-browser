export const waitFor = async (conditionFn: () => boolean, {interval = 100, timeout=301}={interval:100,timeout:301}): Promise<void> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkCondition = () => {
            // If the condition function returns true, resolve the promise
            if (conditionFn()) {
                return resolve();
            }

            // Check if the timeout has been exceeded
            if (timeout && ((Date.now() - startTime) >= timeout)) {
                return reject(new Error('Timeout exceeded for ' + timeout + ' on ' +conditionFn.name));
            }

            // Re-check the condition after the specified interval
            setTimeout(checkCondition, interval);
        };

        // Start checking the condition
        checkCondition();
    });
}
