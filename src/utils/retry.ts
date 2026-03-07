import { Logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export class RetryOperation {
  private static readonly defaultOptions: Partial<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error) => {
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

  /**
   * Execute an operation with retry logic and exponential backoff
   */
  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    context?: string
  ): Promise<T> {
    const finalOptions = { ...this.defaultOptions, ...options } as RetryOptions;
    const logger = Logger.getInstance();
    let lastError: Error;

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
      } catch (error) {
        lastError = error as Error;
        
        if (context) {
          logger.warning(`Operation failed on attempt ${attempt}: ${lastError.message}`, context);
        }
        
        // Check if we should retry
        if (attempt === finalOptions.maxAttempts || 
            (finalOptions.shouldRetry && !finalOptions.shouldRetry(lastError))) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalOptions.baseDelay * Math.pow(finalOptions.backoffMultiplier!, attempt - 1),
          finalOptions.maxDelay!
        );
        
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
      ? `Operation failed after ${finalOptions.maxAttempts} attempts: ${lastError!.message}`
      : `Operation failed after ${finalOptions.maxAttempts} attempts: ${lastError!.message}`;
    
    logger.error(errorMessage, context);
    throw lastError!;
  }

  /**
   * Retry a click operation
   */
  static async click(
    clickFn: () => Promise<void>,
    selector: string,
    options: Partial<RetryOptions> = {}
  ): Promise<void> {
    await this.execute(clickFn, {
      ...options,
      shouldRetry: (error: Error) => {
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
  static async type(
    typeFn: () => Promise<void>,
    selector: string,
    options: Partial<RetryOptions> = {}
  ): Promise<void> {
    await this.execute(typeFn, {
      ...options,
      shouldRetry: (error: Error) => {
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
  static async waitFor(
    waitFn: () => Promise<any>,
    description: string,
    options: Partial<RetryOptions> = {}
  ): Promise<any> {
    return this.execute(waitFn, {
      ...options,
      maxAttempts: 5, // More attempts for wait operations
      baseDelay: 500,
      shouldRetry: (error: Error) => {
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
  static async navigate(
    navigateFn: () => Promise<any>,
    url: string,
    options: Partial<RetryOptions> = {}
  ): Promise<any> {
    return this.execute(navigateFn, {
      ...options,
      maxAttempts: 3,
      baseDelay: 2000,
      shouldRetry: (error: Error) => {
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
  static async upload(
    uploadFn: () => Promise<void>,
    fileName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<void> {
    await this.execute(uploadFn, {
      ...options,
      maxAttempts: 3,
      baseDelay: 1000,
      shouldRetry: (error: Error) => {
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
  static async submit(
    submitFn: () => Promise<void>,
    formName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<void> {
    await this.execute(submitFn, {
      ...options,
      maxAttempts: 3,
      baseDelay: 2000,
      shouldRetry: (error: Error) => {
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
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: Partial<RetryOptions> = {},
    context?: string
  ): T {
    return (async (...args: Parameters<T>) => {
      return this.execute(() => fn(...args), options, context);
    }) as T;
  }
}
