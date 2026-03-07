import { Page } from 'playwright';
export interface ATSDetectionResult {
    platform: string;
    confidence: number;
    indicators: string[];
    metadata?: any;
}
export declare class ATSDetector {
    private static readonly PLATFORM_PATTERNS;
    /**
     * Detect the ATS platform based on URL and page content
     */
    static detectPlatform(page: Page, url: string): Promise<ATSDetectionResult>;
    /**
     * Check a specific platform against all patterns
     */
    private static checkPlatform;
    /**
     * Check for platform-specific UI characteristics
     */
    private static checkPlatformCharacteristics;
    /**
     * Helper method to check if any elements exist for given selectors
     */
    private static hasElements;
    /**
     * Quick detection based only on URL (for initial routing)
     */
    static detectFromUrl(url: string): string;
    /**
     * Validate that the detected platform is correct by checking page content
     */
    static validateDetection(page: Page, detectedPlatform: string): Promise<boolean>;
    /**
     * Check if page contains any of the content markers
     */
    private static checkContentMarkers;
    /**
     * Get all supported platforms
     */
    static getSupportedPlatforms(): string[];
    /**
     * Add a new platform pattern (for extensibility)
     */
    static addPlatformPattern(platformName: string, patterns: any): void;
    /**
     * Get detection statistics
     */
    static getDetectionStats(result: ATSDetectionResult): any;
}
//# sourceMappingURL=ats-detector.d.ts.map