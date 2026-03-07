import { Page } from 'playwright';
export interface ScreenshotOptions {
    fullPage?: boolean;
    quality?: number;
    type?: 'png' | 'jpeg';
    omitBackground?: boolean;
}
export declare class ScreenshotManager {
    private static instance;
    private screenshotDir;
    private currentPlatform?;
    private screenshotCounter;
    private constructor();
    static getInstance(): ScreenshotManager;
    private ensureScreenshotDirectory;
    setPlatform(platform: string): void;
    private generateFileName;
    /**
     * Take a screenshot with automatic naming and logging
     */
    takeScreenshot(page: Page, step: string, options?: ScreenshotOptions): Promise<string>;
    /**
     * Take screenshot before an action
     */
    beforeAction(page: Page, action: string): Promise<string>;
    /**
     * Take screenshot after an action
     */
    afterAction(page: Page, action: string): Promise<string>;
    /**
     * Take screenshot on error
     */
    onError(page: Page, error: Error, context?: string): Promise<string>;
    /**
     * Take screenshot of specific element
     */
    captureElement(page: Page, selector: string, step: string, options?: Omit<ScreenshotOptions, 'fullPage'>): Promise<string>;
    /**
     * Take screenshot at major form milestones
     */
    atMilestone(page: Page, milestone: string): Promise<string>;
    /**
     * Take screenshot before form submission
     */
    beforeSubmission(page: Page): Promise<string>;
    /**
     * Take screenshot after form submission
     */
    afterSubmission(page: Page): Promise<string>;
    /**
     * Take screenshot of confirmation page
     */
    confirmationPage(page: Page, confirmationId?: string): Promise<string>;
    /**
     * Create a visual diff by taking before/after screenshots
     */
    captureDiff(page: Page, action: string, operation: () => Promise<void>): Promise<{
        before: string;
        after: string;
    }>;
    /**
     * Get list of all screenshots
     */
    getScreenshotList(): string[];
    /**
     * Get screenshots for a specific platform
     */
    getScreenshotsByPlatform(platform: string): string[];
    /**
     * Clean up old screenshots (keep only the most recent N)
     */
    cleanupScreenshots(keepCount?: number): void;
    /**
     * Get screenshot directory path
     */
    getScreenshotDirectory(): string;
    /**
     * Reset screenshot counter
     */
    resetCounter(): void;
    /**
     * Print screenshot summary
     */
    printSummary(): void;
}
//# sourceMappingURL=screenshots.d.ts.map