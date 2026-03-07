import { PlatformHandler } from './base';
import { AcmeHandler } from './acme';
import { GlobexHandler } from './globex';
import { Logger } from '../utils/logger';

export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private handlers: PlatformHandler[] = [];
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
    this.initializeHandlers();
  }

  static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }

  /**
   * Initialize all platform handlers
   */
  private initializeHandlers(): void {
    this.handlers = [
      new AcmeHandler(),
      new GlobexHandler()
    ];

    this.logger.info(`Platform registry initialized with ${this.handlers.length} handlers`, 'PLATFORM_REGISTRY');
    
    // Log supported platforms
    const supportedPlatforms = this.handlers.map(h => h.getPlatformName());
    this.logger.info(`Supported platforms: ${supportedPlatforms.join(', ')}`, 'PLATFORM_REGISTRY');
  }

  /**
   * Get the appropriate handler for a given URL
   */
  getHandler(url: string): PlatformHandler | null {
    this.logger.debug(`Looking for handler for URL: ${url}`, 'PLATFORM_REGISTRY');

    // Check each handler to see if it can handle the URL
    for (const handler of this.handlers) {
      if (handler.canHandle(url)) {
        const platformName = handler.getPlatformName();
        this.logger.info(`Selected handler: ${platformName}`, 'PLATFORM_REGISTRY');
        return handler;
      }
    }

    this.logger.warning(`No handler found for URL: ${url}`, 'PLATFORM_REGISTRY');
    return null;
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): PlatformHandler[] {
    return [...this.handlers];
  }

  /**
   * Get handler by platform name
   */
  getHandlerByName(platformName: string): PlatformHandler | null {
    const handler = this.handlers.find(h => h.getPlatformName().toLowerCase() === platformName.toLowerCase());
    
    if (handler) {
      this.logger.debug(`Found handler by name: ${platformName}`, 'PLATFORM_REGISTRY');
    } else {
      this.logger.warning(`No handler found for platform: ${platformName}`, 'PLATFORM_REGISTRY');
    }
    
    return handler || null;
  }

  /**
   * Add a new platform handler (for extensibility)
   */
  addHandler(handler: PlatformHandler): void {
    const platformName = handler.getPlatformName();
    
    // Check if handler for this platform already exists
    const existingHandler = this.handlers.find(h => h.getPlatformName().toLowerCase() === platformName.toLowerCase());
    
    if (existingHandler) {
      this.logger.warning(`Handler for platform ${platformName} already exists, replacing`, 'PLATFORM_REGISTRY');
      this.removeHandler(platformName);
    }

    this.handlers.push(handler);
    this.logger.info(`Added handler for platform: ${platformName}`, 'PLATFORM_REGISTRY');
  }

  /**
   * Remove a platform handler
   */
  removeHandler(platformName: string): boolean {
    const initialLength = this.handlers.length;
    this.handlers = this.handlers.filter(h => h.getPlatformName().toLowerCase() !== platformName.toLowerCase());
    
    const removed = this.handlers.length < initialLength;
    
    if (removed) {
      this.logger.info(`Removed handler for platform: ${platformName}`, 'PLATFORM_REGISTRY');
    } else {
      this.logger.warning(`No handler found to remove for platform: ${platformName}`, 'PLATFORM_REGISTRY');
    }
    
    return removed;
  }

  /**
   * Get list of supported platform names
   */
  getSupportedPlatforms(): string[] {
    return this.handlers.map(h => h.getPlatformName());
  }

  /**
   * Check if a platform is supported
   */
  isPlatformSupported(platformName: string): boolean {
    return this.handlers.some(h => h.getPlatformName().toLowerCase() === platformName.toLowerCase());
  }

  /**
   * Get handler statistics
   */
  getRegistryStats(): {
    totalHandlers: number;
    supportedPlatforms: string[];
    handlerDetails: Array<{
      name: string;
      canHandleExamples: string[];
    }>;
  } {
    const handlerDetails = this.handlers.map(handler => {
      // For demo purposes, we'll show example URLs each handler can handle
      const examples = this.getExampleUrlsForHandler(handler);
      
      return {
        name: handler.getPlatformName(),
        canHandleExamples: examples
      };
    });

    return {
      totalHandlers: this.handlers.length,
      supportedPlatforms: this.getSupportedPlatforms(),
      handlerDetails
    };
  }

  /**
   * Get example URLs that a handler can process
   */
  private getExampleUrlsForHandler(handler: PlatformHandler): string[] {
    const platformName = handler.getPlatformName().toLowerCase();
    
    switch (platformName) {
      case 'acme':
        return [
          'https://jobs.acme.com/apply/123',
          'https://careers.acme.com/position/456',
          'https://acme-corp.com/jobs/789'
        ];
      
      case 'globex':
        return [
          'https://jobs.globex.com/apply/123',
          'https://careers.globex.com/position/456',
          'https://globex-corp.com/jobs/789'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Test all handlers with example URLs
   */
  testHandlers(): {
    platform: string;
    testResults: Array<{
      url: string;
      canHandle: boolean;
    }>;
  }[] {
    const results = this.handlers.map(handler => {
      const platformName = handler.getPlatformName();
      const examples = this.getExampleUrlsForHandler(handler);
      
      const testResults = examples.map(url => ({
        url,
        canHandle: handler.canHandle(url)
      }));

      return {
        platform: platformName,
        testResults
      };
    });

    this.logger.info('Handler testing completed', 'PLATFORM_REGISTRY', { results });
    
    return results;
  }

  /**
   * Reset the registry (useful for testing)
   */
  reset(): void {
    this.handlers = [];
    this.logger.info('Platform registry reset', 'PLATFORM_REGISTRY');
  }

  /**
   * Reinitialize handlers
   */
  reinitialize(): void {
    this.reset();
    this.initializeHandlers();
    this.logger.info('Platform registry reinitialized', 'PLATFORM_REGISTRY');
  }

  /**
   * Print registry information
   */
  printRegistryInfo(): void {
    console.log('\n=== PLATFORM REGISTRY ===');
    console.log(`Total handlers: ${this.handlers.length}`);
    console.log(`Supported platforms: ${this.getSupportedPlatforms().join(', ')}`);
    
    console.log('\n--- Handler Details ---');
    this.handlers.forEach(handler => {
      const examples = this.getExampleUrlsForHandler(handler);
      console.log(`\n${handler.getPlatformName()}:`);
      examples.forEach(url => {
        const canHandle = handler.canHandle(url);
        console.log(`  ${canHandle ? '✓' : '✗'} ${url}`);
      });
    });
    
    console.log('');
  }

  /**
   * Validate registry state
   */
  validateRegistry(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for duplicate platform names
    const platformNames = this.handlers.map(h => h.getPlatformName().toLowerCase());
    const duplicates = platformNames.filter((name, index) => platformNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      issues.push(`Duplicate platform names found: ${duplicates.join(', ')}`);
    }

    // Check if any handler has empty platform name
    const emptyNames = this.handlers.filter(h => !h.getPlatformName().trim());
    if (emptyNames.length > 0) {
      issues.push('Found handlers with empty platform names');
    }

    // Check if all handlers have canHandle method
    const invalidHandlers = this.handlers.filter(h => typeof h.canHandle !== 'function');
    if (invalidHandlers.length > 0) {
      issues.push('Found handlers without canHandle method');
    }

    // Check if all handlers have getPlatformName method
    const invalidNameHandlers = this.handlers.filter(h => typeof h.getPlatformName !== 'function');
    if (invalidNameHandlers.length > 0) {
      issues.push('Found handlers without getPlatformName method');
    }

    const isValid = issues.length === 0;
    
    if (!isValid) {
      this.logger.error('Registry validation failed', 'PLATFORM_REGISTRY', { issues });
    } else {
      this.logger.success('Registry validation passed', 'PLATFORM_REGISTRY');
    }

    return { isValid, issues };
  }
}
