import { Page } from 'playwright';
import { Logger } from '../utils/logger';

export interface ATSDetectionResult {
  platform: string;
  confidence: number;
  indicators: string[];
  metadata?: any;
}

export class ATSDetector {
  private static readonly PLATFORM_PATTERNS = {
    ACME: {
      urlPatterns: [
        /acme.*corp/i,
        /acme.*ats/i,
        /jobs\.acme/i,
        /careers\.acme/i
      ],
      domMarkers: [
        '[data-ats="acme"]',
        '.acme-ats',
        '#acme-application',
        '[data-platform="acme"]',
        '.wizard-container',
        '.step-navigation',
        '.progress-bar'
      ],
      titlePatterns: [
        /acme.*careers/i,
        /acme.*jobs/i,
        /acme.*application/i
      ],
      contentMarkers: [
        'ACME Corporation',
        'Powered by ACME ATS',
        'ACME Application System'
      ]
    },
    GLOBEX: {
      urlPatterns: [
        /globex.*corp/i,
        /globex.*ats/i,
        /jobs\.globex/i,
        /careers\.globex/i
      ],
      domMarkers: [
        '[data-ats="globex"]',
        '.globex-ats',
        '#globex-application',
        '[data-platform="globex"]',
        '.accordion-form',
        '.expandable-section',
        '.chip-selector'
      ],
      titlePatterns: [
        /globex.*careers/i,
        /globex.*jobs/i,
        /globex.*application/i
      ],
      contentMarkers: [
        'Globex Corporation',
        'Powered by Globex ATS',
        'Globex Application System'
      ]
    }
  };

  /**
   * Detect the ATS platform based on URL and page content
   */
  static async detectPlatform(page: Page, url: string): Promise<ATSDetectionResult> {
    const logger = Logger.getInstance();
    logger.info(`Starting ATS detection for URL: ${url}`, 'ATS_DETECTOR');

    const results: ATSDetectionResult[] = [];

    // Check each platform
    for (const [platformName, patterns] of Object.entries(this.PLATFORM_PATTERNS)) {
      const result = await this.checkPlatform(page, url, platformName, patterns);
      if (result.confidence > 0) {
        results.push(result);
      }
    }

    // Sort by confidence and return the best match
    results.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = results[0];
    if (bestMatch) {
      logger.success(`Detected platform: ${bestMatch.platform} (${bestMatch.confidence}% confidence)`, 'ATS_DETECTOR', {
        indicators: bestMatch.indicators
      });
    } else {
      logger.warning('No ATS platform detected', 'ATS_DETECTOR');
    }

    return bestMatch || { platform: 'unknown', confidence: 0, indicators: [] };
  }

  /**
   * Check a specific platform against all patterns
   */
  private static async checkPlatform(
    page: Page,
    url: string,
    platformName: string,
    patterns: any
  ): Promise<ATSDetectionResult> {
    const indicators: string[] = [];
    let confidence = 0;

    // Check URL patterns
    for (const pattern of patterns.urlPatterns) {
      if (pattern.test(url)) {
        indicators.push(`URL pattern: ${pattern}`);
        confidence += 30;
      }
    }

    // Check title patterns
    try {
      const title = await page.title();
      for (const pattern of patterns.titlePatterns) {
        if (pattern.test(title)) {
          indicators.push(`Title pattern: ${pattern}`);
          confidence += 20;
        }
      }
    } catch (error) {
      // Title not available, continue
    }

    // Check DOM markers
    for (const marker of patterns.domMarkers) {
      try {
        const element = page.locator(marker);
        if (await element.count() > 0) {
          indicators.push(`DOM marker: ${marker}`);
          confidence += 25;
        }
      } catch (error) {
        // Element not found, continue
      }
    }

    // Check content markers
    try {
      const pageContent = await page.content();
      for (const marker of patterns.contentMarkers) {
        if (pageContent.includes(marker)) {
          indicators.push(`Content marker: ${marker}`);
          confidence += 15;
        }
      }
    } catch (error) {
      // Content not available, continue
    }

    // Check for specific platform characteristics
    const characteristics = await this.checkPlatformCharacteristics(page, platformName);
    indicators.push(...characteristics.indicators);
    confidence += characteristics.confidence;

    return {
      platform: platformName,
      confidence: Math.min(confidence, 100),
      indicators
    };
  }

  /**
   * Check for platform-specific UI characteristics
   */
  private static async checkPlatformCharacteristics(
    page: Page,
    platformName: string
  ): Promise<{ indicators: string[]; confidence: number }> {
    const indicators: string[] = [];
    let confidence = 0;

    switch (platformName) {
      case 'ACME':
        // Check for multi-step wizard
        if (await this.hasElements(page, ['.step', '.wizard-step', '[data-step]'])) {
          indicators.push('Multi-step wizard detected');
          confidence += 20;
        }

        // Check for progress bar
        if (await this.hasElements(page, ['.progress-bar', '.progress', '[data-progress]'])) {
          indicators.push('Progress bar detected');
          confidence += 15;
        }

        // Check for next/back navigation
        if (await this.hasElements(page, ['button[type="button"]', '.next', '.back', '[data-nav]'])) {
          indicators.push('Navigation buttons detected');
          confidence += 10;
        }

        // Check for typeahead functionality
        if (await this.hasElements(page, ['.typeahead', '.autocomplete', '[data-typeahead]'])) {
          indicators.push('Typeahead functionality detected');
          confidence += 10;
        }

        break;

      case 'GLOBEX':
        // Check for accordion form
        if (await this.hasElements(page, ['.accordion', '.expandable', '[data-accordion]'])) {
          indicators.push('Accordion form detected');
          confidence += 20;
        }

        // Check for toggle switches
        if (await this.hasElements(page, ['.toggle', '.switch', '[role="switch"]'])) {
          indicators.push('Toggle switches detected');
          confidence += 15;
        }

        // Check for chip selectors
        if (await this.hasElements(page, ['.chip', '.tag', '[data-chip]'])) {
          indicators.push('Chip selectors detected');
          confidence += 10;
        }

        // Check for salary slider
        if (await this.hasElements(page, ['input[type="range"]', '.slider', '[data-slider]'])) {
          indicators.push('Salary slider detected');
          confidence += 10;
        }

        break;
    }

    return { indicators, confidence };
  }

  /**
   * Helper method to check if any elements exist for given selectors
   */
  private static async hasElements(page: Page, selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          return true;
        }
      } catch (error) {
        // Element not found, continue
      }
    }
    return false;
  }

  /**
   * Quick detection based only on URL (for initial routing)
   */
  static detectFromUrl(url: string): string {
    for (const [platformName, patterns] of Object.entries(this.PLATFORM_PATTERNS)) {
      for (const pattern of patterns.urlPatterns) {
        if (pattern.test(url)) {
          return platformName;
        }
      }
    }
    return 'unknown';
  }

  /**
   * Validate that the detected platform is correct by checking page content
   */
  static async validateDetection(page: Page, detectedPlatform: string): Promise<boolean> {
    const logger = Logger.getInstance();
    
    try {
      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check if page has form elements (basic validation)
      const hasForm = await page.locator('form').count() > 0;
      const hasInputs = await page.locator('input').count() > 0;
      
      if (!hasForm && !hasInputs) {
        logger.warning('Page does not appear to contain a form', 'ATS_DETECTOR');
        return false;
      }

      // Check for platform-specific indicators
      const patterns = this.PLATFORM_PATTERNS[detectedPlatform as keyof typeof this.PLATFORM_PATTERNS];
      if (patterns) {
        const hasMarkers = await this.hasElements(page, patterns.domMarkers);
        const hasContent = await this.checkContentMarkers(page, patterns.contentMarkers);
        
        return hasMarkers || hasContent;
      }

      return true;
    } catch (error) {
      logger.error(`Error validating detection: ${error}`, 'ATS_DETECTOR');
      return false;
    }
  }

  /**
   * Check if page contains any of the content markers
   */
  private static async checkContentMarkers(page: Page, markers: string[]): Promise<boolean> {
    try {
      const pageContent = await page.content();
      return markers.some(marker => pageContent.includes(marker));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all supported platforms
   */
  static getSupportedPlatforms(): string[] {
    return Object.keys(this.PLATFORM_PATTERNS);
  }

  /**
   * Add a new platform pattern (for extensibility)
   */
  static addPlatformPattern(platformName: string, patterns: any): void {
    this.PLATFORM_PATTERNS[platformName as keyof typeof this.PLATFORM_PATTERNS] = patterns;
    
    const logger = Logger.getInstance();
    logger.info(`Added platform pattern for: ${platformName}`, 'ATS_DETECTOR');
  }

  /**
   * Get detection statistics
   */
  static getDetectionStats(result: ATSDetectionResult): any {
    return {
      platform: result.platform,
      confidence: result.confidence,
      indicatorCount: result.indicators.length,
      indicators: result.indicators
    };
  }
}
