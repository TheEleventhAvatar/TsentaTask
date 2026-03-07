"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTracker = void 0;
const logger_1 = require("./logger");
class PerformanceTracker {
    constructor() {
        this.metrics = new Map();
        this.formMetrics = [];
    }
    static getInstance() {
        if (!PerformanceTracker.instance) {
            PerformanceTracker.instance = new PerformanceTracker();
        }
        return PerformanceTracker.instance;
    }
    setPlatform(platform) {
        this.currentPlatform = platform;
    }
    startTimer(name, metadata) {
        const metric = {
            name,
            startTime: Date.now(),
            metadata
        };
        this.metrics.set(name, metric);
        const logger = logger_1.Logger.getInstance();
        logger.debug(`Started timer: ${name}`, 'PERFORMANCE', metadata);
    }
    endTimer(name) {
        const metric = this.metrics.get(name);
        if (!metric) {
            const logger = logger_1.Logger.getInstance();
            logger.warning(`Timer not found: ${name}`, 'PERFORMANCE');
            return 0;
        }
        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        const logger = logger_1.Logger.getInstance();
        logger.debug(`Ended timer: ${name} (${metric.duration}ms)`, 'PERFORMANCE');
        return metric.duration;
    }
    getDuration(name) {
        const metric = this.metrics.get(name);
        return metric?.duration;
    }
    startFormTracking(url) {
        this.currentFormStartTime = Date.now();
        const logger = logger_1.Logger.getInstance();
        logger.info(`Started form tracking for ${this.currentPlatform}`, 'PERFORMANCE', { url });
    }
    endFormTracking(url, success, error) {
        if (!this.currentFormStartTime || !this.currentPlatform) {
            return;
        }
        const totalDuration = Date.now() - this.currentFormStartTime;
        const formMetrics = {
            platform: this.currentPlatform,
            totalDuration,
            steps: Array.from(this.metrics.values()),
            metadata: {
                url,
                timestamp: new Date(),
                success,
                error
            }
        };
        this.formMetrics.push(formMetrics);
        const logger = logger_1.Logger.getInstance();
        logger.info(`Form tracking completed for ${this.currentPlatform}`, 'PERFORMANCE', {
            totalDuration,
            success,
            stepCount: formMetrics.steps.length
        });
        // Reset for next form
        this.currentFormStartTime = undefined;
        this.metrics.clear();
    }
    getFormMetrics() {
        return [...this.formMetrics];
    }
    getFormMetricsByPlatform(platform) {
        return this.formMetrics.filter(metric => metric.platform === platform);
    }
    getAverageStepTime(stepName) {
        const allSteps = this.formMetrics.flatMap(metric => metric.steps);
        const matchingSteps = allSteps.filter(step => step.name === stepName && step.duration);
        if (matchingSteps.length === 0) {
            return 0;
        }
        const total = matchingSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
        return total / matchingSteps.length;
    }
    getTotalTimeByPlatform(platform) {
        const metrics = this.getFormMetricsByPlatform(platform);
        return metrics.reduce((sum, metric) => sum + metric.totalDuration, 0);
    }
    getSuccessRateByPlatform(platform) {
        const metrics = this.getFormMetricsByPlatform(platform);
        if (metrics.length === 0) {
            return 0;
        }
        const successful = metrics.filter(metric => metric.metadata.success).length;
        return (successful / metrics.length) * 100;
    }
    printPerformanceReport() {
        const logger = logger_1.Logger.getInstance();
        console.log('\n=== PERFORMANCE REPORT ===');
        // Overall summary
        const totalForms = this.formMetrics.length;
        const successfulForms = this.formMetrics.filter(m => m.metadata.success).length;
        const totalTime = this.formMetrics.reduce((sum, m) => sum + m.totalDuration, 0);
        const avgTime = totalForms > 0 ? totalTime / totalForms : 0;
        console.log(`Total forms processed: ${totalForms}`);
        console.log(`Successful forms: ${successfulForms} (${((successfulForms / totalForms) * 100).toFixed(1)}%)`);
        console.log(`Total time: ${totalTime}ms`);
        console.log(`Average time per form: ${avgTime.toFixed(0)}ms`);
        // Platform breakdown
        const platforms = [...new Set(this.formMetrics.map(m => m.platform))];
        if (platforms.length > 1) {
            console.log('\n--- Platform Breakdown ---');
            platforms.forEach(platform => {
                const platformMetrics = this.getFormMetricsByPlatform(platform);
                const platformTime = this.getTotalTimeByPlatform(platform);
                const platformSuccess = this.getSuccessRateByPlatform(platform);
                const platformAvg = platformMetrics.length > 0 ? platformTime / platformMetrics.length : 0;
                console.log(`${platform}:`);
                console.log(`  Forms: ${platformMetrics.length}`);
                console.log(`  Success rate: ${platformSuccess.toFixed(1)}%`);
                console.log(`  Total time: ${platformTime}ms`);
                console.log(`  Average time: ${platformAvg.toFixed(0)}ms`);
            });
        }
        // Step analysis
        console.log('\n--- Step Analysis ---');
        const allSteps = this.formMetrics.flatMap(metric => metric.steps);
        const stepNames = [...new Set(allSteps.map(step => step.name))];
        stepNames.forEach(stepName => {
            const avgTime = this.getAverageStepTime(stepName);
            const stepCount = allSteps.filter(step => step.name === stepName).length;
            console.log(`${stepName}: ${avgTime.toFixed(0)}ms average (${stepCount} executions)`);
        });
        // Recent performance
        const recentForms = this.formMetrics.slice(-5);
        if (recentForms.length > 0) {
            console.log('\n--- Recent Performance ---');
            recentForms.forEach((metric, index) => {
                const status = metric.metadata.success ? '✓' : '✗';
                console.log(`${status} ${metric.platform}: ${metric.totalDuration}ms (${metric.metadata.timestamp.toLocaleTimeString()})`);
            });
        }
        console.log('');
    }
    exportPerformanceData() {
        return JSON.stringify({
            summary: {
                totalForms: this.formMetrics.length,
                successfulForms: this.formMetrics.filter(m => m.metadata.success).length,
                totalTime: this.formMetrics.reduce((sum, m) => sum + m.totalDuration, 0),
                platforms: [...new Set(this.formMetrics.map(m => m.platform))]
            },
            formMetrics: this.formMetrics,
            stepAnalysis: [...new Set(this.formMetrics.flatMap(m => m.steps).map(s => s.name))].map(stepName => ({
                step: stepName,
                averageTime: this.getAverageStepTime(stepName),
                executions: this.formMetrics.flatMap(m => m.steps).filter(s => s.name === stepName).length
            }))
        }, null, 2);
    }
    clearMetrics() {
        this.metrics.clear();
        this.formMetrics = [];
        this.currentFormStartTime = undefined;
        const logger = logger_1.Logger.getInstance();
        logger.info('Performance metrics cleared', 'PERFORMANCE');
    }
    // Helper method to time an async operation
    async timeOperation(name, operation, metadata) {
        this.startTimer(name, metadata);
        try {
            const result = await operation();
            const duration = this.endTimer(name);
            return { result, duration };
        }
        catch (error) {
            this.endTimer(name);
            throw error;
        }
    }
}
exports.PerformanceTracker = PerformanceTracker;
//# sourceMappingURL=performance.js.map