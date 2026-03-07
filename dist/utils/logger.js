"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["SUCCESS"] = 2] = "SUCCESS";
    LogLevel[LogLevel["WARNING"] = 3] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.logs = [];
        this.minLogLevel = LogLevel.DEBUG;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setPlatform(platform) {
        this.currentPlatform = platform;
    }
    setMinLogLevel(level) {
        this.minLogLevel = level;
    }
    formatTimestamp() {
        const now = new Date();
        return now.toTimeString().split(' ')[0]; // HH:MM:SS format
    }
    getLevelName(level) {
        switch (level) {
            case LogLevel.DEBUG: return 'DEBUG';
            case LogLevel.INFO: return 'INFO';
            case LogLevel.SUCCESS: return 'SUCCESS';
            case LogLevel.WARNING: return 'WARNING';
            case LogLevel.ERROR: return 'ERROR';
            default: return 'UNKNOWN';
        }
    }
    log(level, message, step, details) {
        if (level < this.minLogLevel) {
            return;
        }
        const entry = {
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
    debug(message, step, details) {
        this.log(LogLevel.DEBUG, message, step, details);
    }
    info(message, step, details) {
        this.log(LogLevel.INFO, message, step, details);
    }
    success(message, step, details) {
        this.log(LogLevel.SUCCESS, message, step, details);
    }
    warning(message, step, details) {
        this.log(LogLevel.WARNING, message, step, details);
    }
    error(message, step, details) {
        this.log(LogLevel.ERROR, message, step, details);
    }
    step(message) {
        this.info(message, 'STEP');
    }
    getLogs() {
        return [...this.logs];
    }
    getLogsByPlatform(platform) {
        return this.logs.filter(log => log.platform === platform);
    }
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    clearLogs() {
        this.logs = [];
    }
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    printSummary() {
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
    platformStep(platform, message) {
        const originalPlatform = this.currentPlatform;
        this.setPlatform(platform);
        this.step(message);
        this.setPlatform(originalPlatform || '');
    }
    platformSuccess(platform, message, step) {
        const originalPlatform = this.currentPlatform;
        this.setPlatform(platform);
        this.success(message, step);
        this.setPlatform(originalPlatform || '');
    }
    platformError(platform, message, step) {
        const originalPlatform = this.currentPlatform;
        this.setPlatform(platform);
        this.error(message, step);
        this.setPlatform(originalPlatform || '');
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map