export interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: any;
}
export interface FormPerformanceMetrics {
    platform: string;
    totalDuration: number;
    steps: PerformanceMetric[];
    metadata: {
        url: string;
        timestamp: Date;
        success: boolean;
        error?: string;
    };
}
export declare class PerformanceTracker {
    private static instance;
    private metrics;
    private formMetrics;
    private currentPlatform?;
    private currentFormStartTime?;
    private constructor();
    static getInstance(): PerformanceTracker;
    setPlatform(platform: string): void;
    startTimer(name: string, metadata?: any): void;
    endTimer(name: string): number;
    getDuration(name: string): number | undefined;
    startFormTracking(url: string): void;
    endFormTracking(url: string, success: boolean, error?: string): void;
    getFormMetrics(): FormPerformanceMetrics[];
    getFormMetricsByPlatform(platform: string): FormPerformanceMetrics[];
    getAverageStepTime(stepName: string): number;
    getTotalTimeByPlatform(platform: string): number;
    getSuccessRateByPlatform(platform: string): number;
    printPerformanceReport(): void;
    exportPerformanceData(): string;
    clearMetrics(): void;
    timeOperation<T>(name: string, operation: () => Promise<T>, metadata?: any): Promise<{
        result: T;
        duration: number;
    }>;
}
//# sourceMappingURL=performance.d.ts.map