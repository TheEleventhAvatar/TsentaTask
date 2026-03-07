import { PlatformHandler } from './base';
export declare class PlatformRegistry {
    private static instance;
    private handlers;
    private logger;
    private constructor();
    static getInstance(): PlatformRegistry;
    /**
     * Initialize all platform handlers
     */
    private initializeHandlers;
    /**
     * Get the appropriate handler for a given URL
     */
    getHandler(url: string): PlatformHandler | null;
    /**
     * Get all registered handlers
     */
    getAllHandlers(): PlatformHandler[];
    /**
     * Get handler by platform name
     */
    getHandlerByName(platformName: string): PlatformHandler | null;
    /**
     * Add a new platform handler (for extensibility)
     */
    addHandler(handler: PlatformHandler): void;
    /**
     * Remove a platform handler
     */
    removeHandler(platformName: string): boolean;
    /**
     * Get list of supported platform names
     */
    getSupportedPlatforms(): string[];
    /**
     * Check if a platform is supported
     */
    isPlatformSupported(platformName: string): boolean;
    /**
     * Get handler statistics
     */
    getRegistryStats(): {
        totalHandlers: number;
        supportedPlatforms: string[];
        handlerDetails: Array<{
            name: string;
            canHandleExamples: string[];
        }>;
    };
    /**
     * Get example URLs that a handler can process
     */
    private getExampleUrlsForHandler;
    /**
     * Test all handlers with example URLs
     */
    testHandlers(): {
        platform: string;
        testResults: Array<{
            url: string;
            canHandle: boolean;
        }>;
    }[];
    /**
     * Reset the registry (useful for testing)
     */
    reset(): void;
    /**
     * Reinitialize handlers
     */
    reinitialize(): void;
    /**
     * Print registry information
     */
    printRegistryInfo(): void;
    /**
     * Validate registry state
     */
    validateRegistry(): {
        isValid: boolean;
        issues: string[];
    };
}
//# sourceMappingURL=registry.d.ts.map