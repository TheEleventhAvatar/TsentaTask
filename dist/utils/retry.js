"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryOperation = void 0;
const logger_1 = require("./logger");
class RetryOperation {
    /**
     * Execute an operation with retry logic and exponential backoff
     */
    static async execute(operation, options = {}, context) {
        const finalOptions = { ...this.defaultOptions, ...options };
        const logger = logger_1.Logger.getInstance();
        let lastError;
        for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
            try {
                if (context) {
                    logger.debug(`Attempting operation (attempt ${attempt}/${finalOptions.maxAttempts})`, context);
                }
                const result = await operation();
                if (attempt > 1 && context) {
                    logger.success(`Operation succeeded on attempt ${attempt}`, context);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (context) {
                    logger.warning(`Operation failed on attempt ${attempt}: ${lastError.message}`, context);
                }
                // Check if we should retry
                if (attempt === finalOptions.maxAttempts ||
                    (finalOptions.shouldRetry && !finalOptions.shouldRetry(lastError))) {
                    break;
                }
                // Calculate delay with exponential backoff
                const delay = Math.min(finalOptions.baseDelay * Math.pow(finalOptions.backoffMultiplier, attempt - 1), finalOptions.maxDelay);
                // Add jitter to prevent thundering herd
                const jitter = delay * 0.1 * Math.random();
                const finalDelay = delay + jitter;
                if (context) {
                    logger.debug(`Retrying in ${Math.round(finalDelay)}ms`, context);
                }
                // Call onRetry callback if provided
                if (finalOptions.onRetry) {
                    finalOptions.onRetry(attempt, lastError);
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, finalDelay));
            }
        }
        // All attempts failed
        const errorMessage = context
            ? `Operation failed after ${finalOptions.maxAttempts} attempts: ${lastError.message}`
            : `Operation failed after ${finalOptions.maxAttempts} attempts: ${lastError.message}`;
        logger.error(errorMessage, context);
        throw lastError;
    }
    /**
     * Retry a click operation
     */
    static async click(clickFn, selector, options = {}) {
        await this.execute(clickFn, {
            ...options,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('detached') ||
                    message.includes('not visible') ||
                    message.includes('selector');
            }
        }, `Click: ${selector}`);
    }
    /**
     * Retry a type operation
     */
    static async type(typeFn, selector, options = {}) {
        await this.execute(typeFn, {
            ...options,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('detached') ||
                    message.includes('not visible') ||
                    message.includes('selector');
            }
        }, `Type: ${selector}`);
    }
    /**
     * Retry a wait operation
     */
    static async waitFor(waitFn, description, options = {}) {
        return this.execute(waitFn, {
            ...options,
            maxAttempts: 5, // More attempts for wait operations
            baseDelay: 500,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('not found') ||
                    message.includes('visible');
            }
        }, `Wait: ${description}`);
    }
    /**
     * Retry a navigation operation
     */
    static async navigate(navigateFn, url, options = {}) {
        return this.execute(navigateFn, {
            ...options,
            maxAttempts: 3,
            baseDelay: 2000,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('network') ||
                    message.includes('connection') ||
                    message.includes('navigation');
            }
        }, `Navigate: ${url}`);
    }
    /**
     * Retry a file upload operation
     */
    static async upload(uploadFn, fileName, options = {}) {
        await this.execute(uploadFn, {
            ...options,
            maxAttempts: 3,
            baseDelay: 1000,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('file') ||
                    message.includes('upload') ||
                    message.includes('not found');
            }
        }, `Upload: ${fileName}`);
    }
    /**
     * Retry a form submission
     */
    static async submit(submitFn, formName, options = {}) {
        await this.execute(submitFn, {
            ...options,
            maxAttempts: 3,
            baseDelay: 2000,
            shouldRetry: (error) => {
                const message = error.message.toLowerCase();
                return message.includes('timeout') ||
                    message.includes('validation') ||
                    message.includes('submit') ||
                    message.includes('network');
            }
        }, `Submit: ${formName}`);
    }
    /**
     * Create a retryable wrapper for any function
     */
    static wrap(fn, options = {}, context) {
        return (async (...args) => {
            return this.execute(() => fn(...args), options, context);
        });
    }
}
exports.RetryOperation = RetryOperation;
RetryOperation.defaultOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error) => {
        // Retry on network errors, timeouts, and temporary failures
        const retryableErrors = [
            'timeout',
            'network',
            'connection',
            'element not found',
            'selector',
            'visible',
            'detached'
        ];
        const message = error.message.toLowerCase();
        return retryableErrors.some(err => message.includes(err));
    }
};
//# sourceMappingURL=retry.js.map