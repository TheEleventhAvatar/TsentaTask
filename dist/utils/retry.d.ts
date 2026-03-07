export interface RetryOptions {
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
}
export declare class RetryOperation {
    private static readonly defaultOptions;
    /**
     * Execute an operation with retry logic and exponential backoff
     */
    static execute<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>, context?: string): Promise<T>;
    /**
     * Retry a click operation
     */
    static click(clickFn: () => Promise<void>, selector: string, options?: Partial<RetryOptions>): Promise<void>;
    /**
     * Retry a type operation
     */
    static type(typeFn: () => Promise<void>, selector: string, options?: Partial<RetryOptions>): Promise<void>;
    /**
     * Retry a wait operation
     */
    static waitFor(waitFn: () => Promise<any>, description: string, options?: Partial<RetryOptions>): Promise<any>;
    /**
     * Retry a navigation operation
     */
    static navigate(navigateFn: () => Promise<any>, url: string, options?: Partial<RetryOptions>): Promise<any>;
    /**
     * Retry a file upload operation
     */
    static upload(uploadFn: () => Promise<void>, fileName: string, options?: Partial<RetryOptions>): Promise<void>;
    /**
     * Retry a form submission
     */
    static submit(submitFn: () => Promise<void>, formName: string, options?: Partial<RetryOptions>): Promise<void>;
    /**
     * Create a retryable wrapper for any function
     */
    static wrap<T extends (...args: any[]) => Promise<any>>(fn: T, options?: Partial<RetryOptions>, context?: string): T;
}
//# sourceMappingURL=retry.d.ts.map