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

export abstract class BasePlatformHandler implements PlatformHandler {
  protected platformName: string;
  protected steps: string[] = [];
  protected startTime: number = 0;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  abstract canHandle(url: string): boolean;
  abstract apply(page: Page, profile: UserProfile): Promise<ApplicationResult>;

  getPlatformName(): string {
    return this.platformName;
  }

  protected async startTimer(): Promise<void> {
    this.startTime = Date.now();
  }

  protected async endTimer(): Promise<number> {
    return Date.now() - this.startTime;
  }

  protected addStep(step: string): void {
    this.steps.push(step);
  }

  protected createResult(success: boolean, confirmationId?: string, error?: string): ApplicationResult {
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

  async validatePage(page: Page): Promise<boolean> {
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
    } catch {
      return false;
    }
  }
}
