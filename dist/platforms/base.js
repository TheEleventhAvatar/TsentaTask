"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlatformHandler = void 0;
class BasePlatformHandler {
    constructor(platformName) {
        this.steps = [];
        this.startTime = 0;
        this.platformName = platformName;
    }
    getPlatformName() {
        return this.platformName;
    }
    async startTimer() {
        this.startTime = Date.now();
    }
    async endTimer() {
        return Date.now() - this.startTime;
    }
    addStep(step) {
        this.steps.push(step);
    }
    createResult(success, confirmationId, error) {
        return {
            success,
            platform: this.platformName,
            confirmationId,
            timestamp: new Date(),
            error,
            steps: [...this.steps],
            executionTime: Date.now() - this.startTime
        };
    }
    async validatePage(page) {
        try {
            // Basic validation - check if page is loaded and not an error page
            const title = await page.title();
            const url = page.url();
            // Check for specific error indicators (not just any occurrence of "error")
            const bodyText = await page.locator('body').textContent();
            const hasError = bodyText?.toLowerCase().includes('404 not found') ||
                bodyText?.toLowerCase().includes('server error') ||
                bodyText?.toLowerCase().includes('page not found') ||
                url.includes('error') ||
                title.toLowerCase().includes('error');
            return !hasError && title.length > 0;
        }
        catch {
            return false;
        }
    }
}
exports.BasePlatformHandler = BasePlatformHandler;
//# sourceMappingURL=base.js.map