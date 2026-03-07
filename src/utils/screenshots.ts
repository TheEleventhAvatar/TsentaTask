import { Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from './logger';

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
  omitBackground?: boolean;
}

export class ScreenshotManager {
  private static instance: ScreenshotManager;
  private screenshotDir: string;
  private currentPlatform?: string;
  private screenshotCounter: number = 0;

  private constructor() {
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
    this.ensureScreenshotDirectory();
  }

  static getInstance(): ScreenshotManager {
    if (!ScreenshotManager.instance) {
      ScreenshotManager.instance = new ScreenshotManager();
    }
    return ScreenshotManager.instance;
  }

  private ensureScreenshotDirectory(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  setPlatform(platform: string): void {
    this.currentPlatform = platform;
  }

  private generateFileName(step: string, extension: string = 'png'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const platform = this.currentPlatform || 'unknown';
    const counter = String(++this.screenshotCounter).padStart(3, '0');
    const sanitizedStep = step.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    
    return `${timestamp}_${platform}_${counter}_${sanitizedStep}.${extension}`;
  }

  /**
   * Take a screenshot with automatic naming and logging
   */
  async takeScreenshot(
    page: Page,
    step: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
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
      
      const logger = Logger.getInstance();
      logger.success(`Screenshot captured: ${fileName}`, 'SCREENSHOT', {
        path: filePath,
        step,
        platform: this.currentPlatform
      });

      return filePath;
    } catch (error) {
      const logger = Logger.getInstance();
      logger.error(`Failed to capture screenshot for step: ${step}`, 'SCREENSHOT', { error });
      throw error;
    }
  }

  /**
   * Take screenshot before an action
   */
  async beforeAction(page: Page, action: string): Promise<string> {
    return this.takeScreenshot(page, `before_${action}`, { fullPage: true });
  }

  /**
   * Take screenshot after an action
   */
  async afterAction(page: Page, action: string): Promise<string> {
    return this.takeScreenshot(page, `after_${action}`, { fullPage: true });
  }

  /**
   * Take screenshot on error
   */
  async onError(page: Page, error: Error, context?: string): Promise<string> {
    const fileName = context ? `error_${context}` : 'error';
    return this.takeScreenshot(page, fileName, { fullPage: true });
  }

  /**
   * Take screenshot of specific element
   */
  async captureElement(
    page: Page,
    selector: string,
    step: string,
    options: Omit<ScreenshotOptions, 'fullPage'> = {}
  ): Promise<string> {
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
      
      const logger = Logger.getInstance();
      logger.success(`Element screenshot captured: ${fileName}`, 'SCREENSHOT', {
        path: filePath,
        selector,
        step,
        platform: this.currentPlatform
      });

      return filePath;
    } catch (error) {
      const logger = Logger.getInstance();
      logger.error(`Failed to capture element screenshot for ${selector}`, 'SCREENSHOT', { error });
      throw error;
    }
  }

  /**
   * Take screenshot at major form milestones
   */
  async atMilestone(page: Page, milestone: string): Promise<string> {
    return this.takeScreenshot(page, `milestone_${milestone}`, { fullPage: true });
  }

  /**
   * Take screenshot before form submission
   */
  async beforeSubmission(page: Page): Promise<string> {
    return this.takeScreenshot(page, 'before_submission', { fullPage: true });
  }

  /**
   * Take screenshot after form submission
   */
  async afterSubmission(page: Page): Promise<string> {
    return this.takeScreenshot(page, 'after_submission', { fullPage: true });
  }

  /**
   * Take screenshot of confirmation page
   */
  async confirmationPage(page: Page, confirmationId?: string): Promise<string> {
    const step = confirmationId ? `confirmation_${confirmationId}` : 'confirmation_page';
    return this.takeScreenshot(page, step, { fullPage: true });
  }

  /**
   * Create a visual diff by taking before/after screenshots
   */
  async captureDiff(
    page: Page,
    action: string,
    operation: () => Promise<void>
  ): Promise<{ before: string; after: string }> {
    const before = await this.beforeAction(page, action);
    
    try {
      await operation();
      const after = await this.afterAction(page, action);
      
      return { before, after };
    } catch (error) {
      // If operation fails, still take the after screenshot
      const after = await this.afterAction(page, action);
      throw error;
    }
  }

  /**
   * Get list of all screenshots
   */
  getScreenshotList(): string[] {
    try {
      return fs.readdirSync(this.screenshotDir)
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
        .sort();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get screenshots for a specific platform
   */
  getScreenshotsByPlatform(platform: string): string[] {
    return this.getScreenshotList()
      .filter(file => file.includes(`_${platform}_`));
  }

  /**
   * Clean up old screenshots (keep only the most recent N)
   */
  cleanupScreenshots(keepCount: number = 50): void {
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

      const logger = Logger.getInstance();
      logger.info(`Cleaned up ${toDelete.length} old screenshots`, 'SCREENSHOT');
    } catch (error) {
      const logger = Logger.getInstance();
      logger.error('Failed to cleanup screenshots', 'SCREENSHOT', { error });
    }
  }

  /**
   * Get screenshot directory path
   */
  getScreenshotDirectory(): string {
    return this.screenshotDir;
  }

  /**
   * Reset screenshot counter
   */
  resetCounter(): void {
    this.screenshotCounter = 0;
  }

  /**
   * Print screenshot summary
   */
  printSummary(): void {
    const screenshots = this.getScreenshotList();
    const logger = Logger.getInstance();
    
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
