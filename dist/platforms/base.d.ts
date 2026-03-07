import { Page } from 'playwright';
import { UserProfile } from '../profile';
export interface ApplicationResult {
    success: boolean;
    platform: string;
    confirmationId?: string;
    confirmationNumber?: string;
    timestamp: Date;
    error?: string;
    steps: string[];
    executionTime: number;
}
export interface PlatformHandler {
    /**
     * Check if this handler can process the given URL
     */
    canHandle(url: string): boolean;
    /**
     * Get the platform name for logging and identification
     */
    getPlatformName(): string;
    /**
     * Apply the automation strategy for this platform
     */
    apply(page: Page, profile: UserProfile): Promise<ApplicationResult>;
    /**
     * Optional: Validate that the page is ready for automation
     */
    validatePage?(page: Page): Promise<boolean>;
}
export declare abstract class BasePlatformHandler implements PlatformHandler {
    protected platformName: string;
    protected steps: string[];
    protected startTime: number;
    constructor(platformName: string);
    abstract canHandle(url: string): boolean;
    abstract apply(page: Page, profile: UserProfile): Promise<ApplicationResult>;
    getPlatformName(): string;
    protected startTimer(): Promise<void>;
    protected endTimer(): Promise<number>;
    protected addStep(step: string): void;
    protected createResult(success: boolean, confirmationId?: string, error?: string): ApplicationResult;
    validatePage(page: Page): Promise<boolean>;
}
//# sourceMappingURL=base.d.ts.map