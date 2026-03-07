import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { UserProfile, candidateProfile } from './profile';
import { ApplicationResult } from './platforms/base';
import { PlatformRegistry } from './platforms/registry';
import { ATSDetector } from './services/ats-detector';
import { Logger } from './utils/logger';
import { PerformanceTracker } from './utils/performance';
import { ScreenshotManager } from './utils/screenshots';
import { RetryOperation } from './utils/retry';

export interface AutomatorConfig {
  headless?: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
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

export class ATSAutomator {
  private config: Required<AutomatorConfig>;
  private registry: PlatformRegistry;
  private logger: Logger;
  private performance: PerformanceTracker;
  private screenshots: ScreenshotManager;
  private session?: AutomationSession;

  constructor(config: Partial<AutomatorConfig> = {}) {
    this.config = {
      headless: config.headless ?? false,
      slowMo: config.slowMo ?? 100,
      viewport: config.viewport ?? { width: 1920, height: 1080 },
      userAgent: config.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: config.timeout ?? 30000,
      screenshotsEnabled: config.screenshotsEnabled ?? true,
      performanceTrackingEnabled: config.performanceTrackingEnabled ?? true,
      logLevel: config.logLevel ?? 'info'
    };

    this.registry = PlatformRegistry.getInstance();
    this.logger = Logger.getInstance();
    this.performance = PerformanceTracker.getInstance();
    this.screenshots = ScreenshotManager.getInstance();

    this.setupLogger();
  }

  private setupLogger(): void {
    this.logger.setMinLogLevel(this.getLogLevel(this.config.logLevel));
    this.logger.info('ATS Automator initialized', 'AUTOMATOR', { config: this.config });
  }

  private getLogLevel(level: string): any {
    switch (level) {
      case 'debug': return 0;
      case 'info': return 1;
      case 'success': return 2;
      case 'warning': return 3;
      case 'error': return 4;
      default: return 1;
    }
  }

  /**
   * Initialize browser and create new session
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing browser session', 'AUTOMATOR');

      const browser = await chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo
      });

      const context = await browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent
      });

      const page = await context.newPage();
      
      // Set default timeout
      page.setDefaultTimeout(this.config.timeout);

      this.session = {
        browser,
        context,
        page,
        startTime: Date.now(),
        results: []
      };

      this.logger.success('Browser session initialized', 'AUTOMATOR');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize browser: ${errorMessage}`, 'AUTOMATOR');
      throw error;
    }
  }

  /**
   * Close browser session and cleanup
   */
  async cleanup(): Promise<void> {
    if (!this.session) {
      this.logger.warning('No active session to cleanup', 'AUTOMATOR');
      return;
    }

    try {
      this.session.endTime = Date.now();
      const sessionDuration = this.session.endTime - this.session.startTime;

      this.logger.info('Cleaning up browser session', 'AUTOMATOR', { 
        duration: sessionDuration,
        resultsCount: this.session.results.length 
      });

      await this.session.page.close();
      await this.session.context.close();
      await this.session.browser.close();

      // Print final reports
      if (this.config.performanceTrackingEnabled) {
        this.performance.printPerformanceReport();
      }

      if (this.config.screenshotsEnabled) {
        this.screenshots.printSummary();
      }

      this.logger.printSummary();

      this.session = undefined;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error during cleanup: ${errorMessage}`, 'AUTOMATOR');
    }
  }

  /**
   * Automate job application for a single URL
   */
  async applyToJob(url: string, profile: UserProfile = candidateProfile): Promise<ApplicationResult> {
    if (!this.session) {
      throw new Error('Automator not initialized. Call initialize() first.');
    }

    this.logger.info(`Starting job application for: ${url}`, 'AUTOMATOR');

    try {
      // Navigate to the job application page
      await this.navigateToJob(url);

      // Detect ATS platform
      const detection = await ATSDetector.detectPlatform(this.session.page, url);
      
      if (detection.platform === 'unknown') {
        throw new Error(`Unsupported ATS platform for URL: ${url}`);
      }

      // Get appropriate handler
      const handler = this.registry.getHandler(url);
      if (!handler) {
        throw new Error(`No handler found for platform: ${detection.platform}`);
      }

      // Validate page is ready for automation
      if (handler.validatePage) {
        const isValid = await handler.validatePage(this.session.page);
        if (!isValid) {
          throw new Error('Page validation failed - page may not be ready for automation');
        }
      }

      // Apply automation
      const result = await handler.apply(this.session.page, profile);
      
      // Store result
      this.session.results.push(result);

      this.logger.success(`Application completed for ${url}`, 'AUTOMATOR', {
        platform: result.platform,
        success: result.success,
        confirmationId: result.confirmationId,
        executionTime: result.executionTime
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Take error screenshot if enabled
      if (this.config.screenshotsEnabled) {
        await this.screenshots.onError(this.session.page, error as Error, 'job_application');
      }

      const errorResult: ApplicationResult = {
        success: false,
        platform: 'unknown',
        timestamp: new Date(),
        error: errorMessage,
        steps: [],
        executionTime: 0
      };

      this.session.results.push(errorResult);
      
      this.logger.error(`Application failed for ${url}: ${errorMessage}`, 'AUTOMATOR');
      
      return errorResult;
    }
  }

  /**
   * Automate job applications for multiple URLs
   */
  async applyToMultipleJobs(urls: string[], profile: UserProfile = candidateProfile): Promise<ApplicationResult[]> {
    this.logger.info(`Starting batch applications for ${urls.length} jobs`, 'AUTOMATOR');

    const results: ApplicationResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      this.logger.info(`Processing job ${i + 1}/${urls.length}`, 'AUTOMATOR', { url });

      try {
        const result = await this.applyToJob(url, profile);
        results.push(result);

        // Add delay between applications to be more realistic
        if (i < urls.length - 1 && this.session?.page) {
          await this.session?.page?.waitForTimeout(2000 + Math.random() * 3000);
        }

      } catch (error) {
        this.logger.error(`Failed to process job ${i + 1}/${urls.length}`, 'AUTOMATOR', { url, error });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Batch applications completed: ${successCount}/${urls.length} successful`, 'AUTOMATOR');

    return results;
  }

  /**
   * Navigate to job application page
   */
  private async navigateToJob(url: string): Promise<void> {
    if (!this.session) {
      throw new Error('No active session - cannot navigate to job');
    }
    
    const session = this.session;
    await RetryOperation.navigate(async () => {
      await session.page.goto(url, { waitUntil: 'networkidle' });
    }, url);

    // Wait for page to be ready
    await session.page.waitForLoadState('domcontentloaded');
    
    if (this.config.screenshotsEnabled) {
      await this.screenshots.takeScreenshot(session.page, 'page_loaded');
    }
  }

  /**
   * Get current session information
   */
  getSessionInfo(): Omit<AutomationSession, 'browser' | 'context' | 'page'> | null {
    if (!this.session) {
      return null;
    }

    return {
      startTime: this.session.startTime,
      endTime: this.session.endTime,
      results: [...this.session.results]
    };
  }

  /**
   * Get registry information
   */
  getRegistryInfo(): any {
    return this.registry.getRegistryStats();
  }

  /**
   * Test platform detection
   */
  async testPlatformDetection(url: string): Promise<any> {
    if (!this.session) {
      throw new Error('Automator not initialized. Call initialize() first.');
    }

    await this.navigateToJob(url);
    const detection = await ATSDetector.detectPlatform(this.session.page, url);
    
    return {
      url,
      detection,
      handler: this.registry.getHandler(url)?.getPlatformName() || 'none'
    };
  }

  /**
   * Run a complete automation session with multiple URLs
   */
  async runFullAutomation(urls: string[], profile: UserProfile = candidateProfile): Promise<{
    sessionInfo: any;
    results: ApplicationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      successRate: number;
      totalTime: number;
    };
  }> {
    await this.initialize();
    
    try {
      const startTime = Date.now();
      const results = await this.applyToMultipleJobs(urls, profile);
      const endTime = Date.now();

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        successRate: (results.filter(r => r.success).length / results.length) * 100,
        totalTime: endTime - startTime
      };

      return {
        sessionInfo: this.getSessionInfo(),
        results,
        summary
      };

    } finally {
      await this.cleanup();
    }
  }

  /**
   * Configure automator settings
   */
  configure(newConfig: Partial<AutomatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupLogger();
    this.logger.info('Automator configuration updated', 'AUTOMATOR', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<AutomatorConfig> {
    return { ...this.config };
  }

  /**
   * Validate automator setup
   */
  async validateSetup(): Promise<{
    isValid: boolean;
    issues: string[];
    tests: {
      registry: boolean;
      detection: boolean;
      browser: boolean;
    };
  }> {
    const issues: string[] = [];
    const tests = {
      registry: false,
      detection: false,
      browser: false
    };

    // Test registry
    try {
      const registryValidation = this.registry.validateRegistry();
      tests.registry = registryValidation.isValid;
      if (!registryValidation.isValid) {
        issues.push(...registryValidation.issues);
      }
    } catch (error) {
      issues.push(`Registry validation error: ${error}`);
    }

    // Test ATS detector
    try {
      const supportedPlatforms = ATSDetector.getSupportedPlatforms();
      tests.detection = supportedPlatforms.length > 0;
      if (supportedPlatforms.length === 0) {
        issues.push('No supported platforms in ATS detector');
      }
    } catch (error) {
      issues.push(`ATS detector error: ${error}`);
    }

    // Test browser initialization
    try {
      await this.initialize();
      tests.browser = true;
      await this.cleanup();
    } catch (error) {
      issues.push(`Browser initialization error: ${error}`);
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      issues,
      tests
    };
  }
}

// Main execution block for assessment
async function main() {
  console.log('🚀 Starting ATS Automation Assessment...');
  
  const automator = new ATSAutomator({
    headless: false, // Show browser for assessment demo
    screenshotsEnabled: true,
    performanceTrackingEnabled: true,
    logLevel: 'info'
  });

  try {
    // Initialize browser session
    await automator.initialize();
    
    // Mock job URLs (these would be the actual form URLs when serve is running)
    const jobUrls = [
      'http://localhost:3939/acme.html',
      'http://localhost:3939/globex.html'
    ];
    
    console.log(`📋 Applying to ${jobUrls.length} jobs...`);
    
    // Apply to all jobs
    const results = await automator.applyToMultipleJobs(jobUrls);
    
    // Print results
    console.log('\n📊 Results Summary:');
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.platform}:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      if (result.confirmationId) {
        console.log(`   Confirmation ID: ${result.confirmationId}`);
      }
      if (result.confirmationNumber) {
        console.log(`   Reference Number: ${result.confirmationNumber}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log(`   Execution Time: ${result.executionTime}ms`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n🎯 Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length * 100)}%)`);
    
  } catch (error) {
    console.error('💥 Assessment failed:', error);
  } finally {
    await automator.cleanup();
  }
}

// Run main if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
