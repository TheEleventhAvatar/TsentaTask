export declare enum LogLevel {
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
export declare class Logger {
    private static instance;
    private logs;
    private currentPlatform?;
    private minLogLevel;
    private constructor();
    static getInstance(): Logger;
    setPlatform(platform: string): void;
    setMinLogLevel(level: LogLevel): void;
    private formatTimestamp;
    private getLevelName;
    private log;
    debug(message: string, step?: string, details?: any): void;
    info(message: string, step?: string, details?: any): void;
    success(message: string, step?: string, details?: any): void;
    warning(message: string, step?: string, details?: any): void;
    error(message: string, step?: string, details?: any): void;
    step(message: string): void;
    getLogs(): LogEntry[];
    getLogsByPlatform(platform: string): LogEntry[];
    getLogsByLevel(level: LogLevel): LogEntry[];
    clearLogs(): void;
    exportLogs(): string;
    printSummary(): void;
    platformStep(platform: string, message: string): void;
    platformSuccess(platform: string, message: string, step?: string): void;
    platformError(platform: string, message: string, step?: string): void;
}
//# sourceMappingURL=logger.d.ts.map