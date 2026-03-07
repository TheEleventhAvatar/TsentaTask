"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotManager = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logger_1 = require("./logger");
class ScreenshotManager {
    constructor() {
        this.screenshotCounter = 0;
        this.screenshotDir = path.join(process.cwd(), 'screenshots');
        this.ensureScreenshotDirectory();
    }
    static getInstance() {
        if (!ScreenshotManager.instance) {
            ScreenshotManager.instance = new ScreenshotManager();
        }
        return ScreenshotManager.instance;
    }
    ensureScreenshotDirectory() {
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }
    setPlatform(platform) {
        this.currentPlatform = platform;
    }
    generateFileName(step, extension = 'png') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const platform = this.currentPlatform || 'unknown';
        const counter = String(++this.screenshotCounter).padStart(3, '0');
        const sanitizedStep = step.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
        return `${timestamp}_${platform}_${counter}_${sanitizedStep}.${extension}`;
    }
    /**
     * Take a screenshot with automatic naming and logging
     */
    async takeScreenshot(page, step, options = {}) {
        try {
            const fileName = this.generateFileName(step, options.type === 'jpeg' ? 'jpg' : 'png');
            const filePath = path.join(this.screenshotDir, fileName);
            const screenshotOptions = {
                path: filePath,
                fullPage: options.fullPage ?? true,
                quality: options.quality,
                type: options.type || 'png',
                omitBackground: options.omitBackground ?? false
            };
            await page.screenshot(screenshotOptions);
            const logger = logger_1.Logger.getInstance();
            logger.success(`Screenshot captured: ${fileName}`, 'SCREENSHOT', {
                path: filePath,
                step,
                platform: this.currentPlatform
            });
            return filePath;
        }
        catch (error) {
            const logger = logger_1.Logger.getInstance();
            logger.error(`Failed to capture screenshot for step: ${step}`, 'SCREENSHOT', { error });
            throw error;
        }
    }
    /**
     * Take screenshot before an action
     */
    async beforeAction(page, action) {
        return this.takeScreenshot(page, `before_${action}`, { fullPage: true });
    }
    /**
     * Take screenshot after an action
     */
    async afterAction(page, action) {
        return this.takeScreenshot(page, `after_${action}`, { fullPage: true });
    }
    /**
     * Take screenshot on error
     */
    async onError(page, error, context) {
        const fileName = context ? `error_${context}` : 'error';
        return this.takeScreenshot(page, fileName, { fullPage: true });
    }
    /**
     * Take screenshot of specific element
     */
    async captureElement(page, selector, step, options = {}) {
        try {
            const element = page.locator(selector);
            await element.waitFor({ state: 'visible', timeout: 5000 });
            const fileName = this.generateFileName(`element_${step}`, options.type === 'jpeg' ? 'jpg' : 'png');
            const filePath = path.join(this.screenshotDir, fileName);
            await element.screenshot({
                path: filePath,
                quality: options.quality,
                type: options.type || 'png',
                omitBackground: options.omitBackground ?? false
            });
            const logger = logger_1.Logger.getInstance();
            logger.success(`Element screenshot captured: ${fileName}`, 'SCREENSHOT', {
                path: filePath,
                selector,
                step,
                platform: this.currentPlatform
            });
            return filePath;
        }
        catch (error) {
            const logger = logger_1.Logger.getInstance();
            logger.error(`Failed to capture element screenshot for ${selector}`, 'SCREENSHOT', { error });
            throw error;
        }
    }
    /**
     * Take screenshot at major form milestones
     */
    async atMilestone(page, milestone) {
        return this.takeScreenshot(page, `milestone_${milestone}`, { fullPage: true });
    }
    /**
     * Take screenshot before form submission
     */
    async beforeSubmission(page) {
        return this.takeScreenshot(page, 'before_submission', { fullPage: true });
    }
    /**
     * Take screenshot after form submission
     */
    async afterSubmission(page) {
        return this.takeScreenshot(page, 'after_submission', { fullPage: true });
    }
    /**
     * Take screenshot of confirmation page
     */
    async confirmationPage(page, confirmationId) {
        const step = confirmationId ? `confirmation_${confirmationId}` : 'confirmation_page';
        return this.takeScreenshot(page, step, { fullPage: true });
    }
    /**
     * Create a visual diff by taking before/after screenshots
     */
    async captureDiff(page, action, operation) {
        const before = await this.beforeAction(page, action);
        try {
            await operation();
            const after = await this.afterAction(page, action);
            return { before, after };
        }
        catch (error) {
            // If operation fails, still take the after screenshot
            const after = await this.afterAction(page, action);
            throw error;
        }
    }
    /**
     * Get list of all screenshots
     */
    getScreenshotList() {
        try {
            return fs.readdirSync(this.screenshotDir)
                .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
                .sort();
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Get screenshots for a specific platform
     */
    getScreenshotsByPlatform(platform) {
        return this.getScreenshotList()
            .filter(file => file.includes(`_${platform}_`));
    }
    /**
     * Clean up old screenshots (keep only the most recent N)
     */
    cleanupScreenshots(keepCount = 50) {
        try {
            const screenshots = this.getScreenshotList();
            if (screenshots.length <= keepCount) {
                return;
            }
            // Sort by filename (which includes timestamp)
            const sortedScreenshots = screenshots.sort();
            const toDelete = sortedScreenshots.slice(0, -keepCount);
            toDelete.forEach(file => {
                const filePath = path.join(this.screenshotDir, file);
                fs.unlinkSync(filePath);
            });
            const logger = logger_1.Logger.getInstance();
            logger.info(`Cleaned up ${toDelete.length} old screenshots`, 'SCREENSHOT');
        }
        catch (error) {
            const logger = logger_1.Logger.getInstance();
            logger.error('Failed to cleanup screenshots', 'SCREENSHOT', { error });
        }
    }
    /**
     * Get screenshot directory path
     */
    getScreenshotDirectory() {
        return this.screenshotDir;
    }
    /**
     * Reset screenshot counter
     */
    resetCounter() {
        this.screenshotCounter = 0;
    }
    /**
     * Print screenshot summary
     */
    printSummary() {
        const screenshots = this.getScreenshotList();
        const logger = logger_1.Logger.getInstance();
        console.log('\n=== SCREENSHOT SUMMARY ===');
        console.log(`Total screenshots: ${screenshots.length}`);
        console.log(`Screenshot directory: ${this.screenshotDir}`);
        if (this.currentPlatform) {
            const platformScreenshots = this.getScreenshotsByPlatform(this.currentPlatform);
            console.log(`Screenshots for ${this.currentPlatform}: ${platformScreenshots.length}`);
        }
        if (screenshots.length > 0) {
            console.log('\nRecent screenshots:');
            screenshots.slice(-10).reverse().forEach(file => {
                console.log(`  ${file}`);
            });
        }
        console.log('');
    }
}
exports.ScreenshotManager = ScreenshotManager;
//# sourceMappingURL=screenshots.js.map