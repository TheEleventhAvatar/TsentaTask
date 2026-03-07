export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARNING = 3,
  ERROR = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  platform?: string;
  step?: string;
  details?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private currentPlatform?: string;
  private minLogLevel: LogLevel = LogLevel.DEBUG;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setPlatform(platform: string): void {
    this.currentPlatform = platform;
  }

  setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS format
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.SUCCESS: return 'SUCCESS';
      case LogLevel.WARNING: return 'WARNING';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  private log(level: LogLevel, message: string, step?: string, details?: any): void {
    if (level < this.minLogLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      platform: this.currentPlatform,
      step,
      details
    };

    this.logs.push(entry);

    // Format console output
    const levelName = this.getLevelName(level);
    const platformStr = this.currentPlatform ? ` [${this.currentPlatform}]` : '';
    const stepStr = step ? ` - ${step}` : '';
    const logLine = `[${entry.timestamp}]${platformStr} ${levelName}${stepStr}: ${message}`;

    // Color coding for console output
    switch (level) {
      case LogLevel.SUCCESS:
        console.log(`\x1b[32m${logLine}\x1b[0m`); // Green
        break;
      case LogLevel.WARNING:
        console.log(`\x1b[33m${logLine}\x1b[0m`); // Yellow
        break;
      case LogLevel.ERROR:
        console.log(`\x1b[31m${logLine}\x1b[0m`); // Red
        break;
      case LogLevel.INFO:
        console.log(`\x1b[36m${logLine}\x1b[0m`); // Cyan
        break;
      default:
        console.log(logLine);
    }

    // Log details if provided
    if (details) {
      console.log('  Details:', details);
    }
  }

  debug(message: string, step?: string, details?: any): void {
    this.log(LogLevel.DEBUG, message, step, details);
  }

  info(message: string, step?: string, details?: any): void {
    this.log(LogLevel.INFO, message, step, details);
  }

  success(message: string, step?: string, details?: any): void {
    this.log(LogLevel.SUCCESS, message, step, details);
  }

  warning(message: string, step?: string, details?: any): void {
    this.log(LogLevel.WARNING, message, step, details);
  }

  error(message: string, step?: string, details?: any): void {
    this.log(LogLevel.ERROR, message, step, details);
  }

  step(message: string): void {
    this.info(message, 'STEP');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByPlatform(platform: string): LogEntry[] {
    return this.logs.filter(log => log.platform === platform);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  printSummary(): void {
    const summary = {
      total: this.logs.length,
      debug: this.getLogsByLevel(LogLevel.DEBUG).length,
      info: this.getLogsByLevel(LogLevel.INFO).length,
      success: this.getLogsByLevel(LogLevel.SUCCESS).length,
      warning: this.getLogsByLevel(LogLevel.WARNING).length,
      error: this.getLogsByLevel(LogLevel.ERROR).length
    };

    console.log('\n=== LOG SUMMARY ===');
    console.log(`Total logs: ${summary.total}`);
    console.log(`Debug: ${summary.debug}`);
    console.log(`Info: ${summary.info}`);
    console.log(`Success: ${summary.success}`);
    console.log(`Warning: ${summary.warning}`);
    console.log(`Error: ${summary.error}`);
    
    if (summary.error > 0) {
      console.log('\n=== ERRORS ===');
      this.getLogsByLevel(LogLevel.ERROR).forEach(log => {
        console.log(`[${log.timestamp}] [${log.platform}] ERROR: ${log.message}`);
      });
    }
  }

  // Platform-specific logging methods
  platformStep(platform: string, message: string): void {
    const originalPlatform = this.currentPlatform;
    this.setPlatform(platform);
    this.step(message);
    this.setPlatform(originalPlatform || '');
  }

  platformSuccess(platform: string, message: string, step?: string): void {
    const originalPlatform = this.currentPlatform;
    this.setPlatform(platform);
    this.success(message, step);
    this.setPlatform(originalPlatform || '');
  }

  platformError(platform: string, message: string, step?: string): void {
    const originalPlatform = this.currentPlatform;
    this.setPlatform(platform);
    this.error(message, step);
    this.setPlatform(originalPlatform || '');
  }
}
