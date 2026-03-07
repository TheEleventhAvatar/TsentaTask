import { Browser, Page, BrowserContext } from 'playwright';
import { UserProfile } from './profile';
import { ApplicationResult } from './platforms/base';
export interface AutomatorConfig {
    headless?: boolean;
    slowMo?: number;
    viewport?: {
        width: number;
        height: number;
    };
    userAgent?: string;
    timeout?: number;
    screenshotsEnabled?: boolean;
    performanceTrackingEnabled?: boolean;
    logLevel?: 'debug' | 'info' | 'success' | 'warning' | 'error';
}
export interface AutomationSession {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    startTime: number;
    endTime?: number;
    results: ApplicationResult[];
}
export declare class ATSAutomator {
    private config;
    private registry;
    private logger;
    private performance;
    private screenshots;
    private session?;
    constructor(config?: Partial<AutomatorConfig>);
    private setupLogger;
    private getLogLevel;
    /**
     * Initialize browser and create new session
     */
    initialize(): Promise<void>;
    /**
     * Close browser session and cleanup
     */
    cleanup(): Promise<void>;
    /**
     * Automate job application for a single URL
     */
    applyToJob(url: string, profile?: UserProfile): Promise<ApplicationResult>;
    /**
     * Automate job applications for multiple URLs
     */
    applyToMultipleJobs(urls: string[], profile?: UserProfile): Promise<ApplicationResult[]>;
    /**
     * Navigate to job application page
     */
    private navigateToJob;
    /**
     * Get current session information
     */
    getSessionInfo(): Omit<AutomationSession, 'browser' | 'context' | 'page'> | null;
    /**
     * Get registry information
     */
    getRegistryInfo(): any;
    /**
     * Test platform detection
     */
    testPlatformDetection(url: string): Promise<any>;
    /**
     * Run a complete automation session with multiple URLs
     */
    runFullAutomation(urls: string[], profile?: UserProfile): Promise<{
        sessionInfo: any;
        results: ApplicationResult[];
        summary: {
            total: number;
            successful: number;
            failed: number;
            successRate: number;
            totalTime: number;
        };
    }>;
    /**
     * Configure automator settings
     */
    configure(newConfig: Partial<AutomatorConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): Required<AutomatorConfig>;
    /**
     * Validate automator setup
     */
    validateSetup(): Promise<{
        isValid: boolean;
        issues: string[];
        tests: {
            registry: boolean;
            detection: boolean;
            browser: boolean;
        };
    }>;
}
//# sourceMappingURL=automator.d.ts.map