export interface AdoptionMetrics {
    filesAnalyzed: number;
    issuesFound: number;
    fixesApplied: number;
    featureUsage: Record<string, number>;
    modernizationProgress: number;
    lastAnalysis: Date;
    sessionStartTime: Date;
    analysisHistory: Array<{
        timestamp: Date;
        fileName: string;
        issuesCount: number;
        language: string;
    }>;
    fixHistory: Array<{
        timestamp: Date;
        featureId: string;
        fileName: string;
    }>;
}

export class MetricsTracker {
    private metrics: AdoptionMetrics;

    constructor() {
        this.metrics = {
            filesAnalyzed: 0,
            issuesFound: 0,
            fixesApplied: 0,
            featureUsage: {},
            modernizationProgress: 0,
            lastAnalysis: new Date(),
            sessionStartTime: new Date(),
            analysisHistory: [],
            fixHistory: []
        };
    }

    recordAnalysis(filePath: string, issuesCount: number, language: string = 'unknown'): void {
        this.metrics.filesAnalyzed++;
        this.metrics.issuesFound += issuesCount;
        this.metrics.lastAnalysis = new Date();

        // Add to history
        this.metrics.analysisHistory.push({
            timestamp: new Date(),
            fileName: filePath.split('/').pop() || filePath,
            issuesCount,
            language
        });

        this.updateModernizationProgress();
    }

    recordFix(featureId: string, fileName: string = ''): void {
        this.metrics.fixesApplied++;

        // Add to fix history
        this.metrics.fixHistory.push({
            timestamp: new Date(),
            featureId,
            fileName: fileName.split('/').pop() || fileName
        });

        this.updateModernizationProgress();
    }

    recordFeatureUsage(featureId: string, count: number = 1): void {
        if (!this.metrics.featureUsage[featureId]) {
            this.metrics.featureUsage[featureId] = 0;
        }
        this.metrics.featureUsage[featureId] += count;
    }

    private updateModernizationProgress(): void {
        if (this.metrics.issuesFound === 0) {
            this.metrics.modernizationProgress = this.metrics.filesAnalyzed > 0 ? 100 : 0;
        } else {
            this.metrics.modernizationProgress = Math.round(
                (this.metrics.fixesApplied / this.metrics.issuesFound) * 100
            );
        }

        // Cap at 100%
        this.metrics.modernizationProgress = Math.min(this.metrics.modernizationProgress, 100);
    }

    getMetrics(): AdoptionMetrics {
        return { ...this.metrics };
    }

    getMostUsedFeatures(): Array<{ feature: string; count: number }> {
        return Object.entries(this.metrics.featureUsage)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    getAnalysisHistory(): Array<{ timestamp: Date; fileName: string; issuesCount: number; language: string }> {
        return [...this.metrics.analysisHistory].reverse(); // Most recent first
    }

    getFixHistory(): Array<{ timestamp: Date; featureId: string; fileName: string }> {
        return [...this.metrics.fixHistory].reverse(); // Most recent first
    }

    getSessionStats(): {
        duration: number; // in minutes
        filesAnalyzedThisSession: number;
        issuesFoundThisSession: number;
        fixesAppliedThisSession: number;
        averageIssuesPerFile: number;
    } {
        const now = new Date();
        const duration = Math.round((now.getTime() - this.metrics.sessionStartTime.getTime()) / (1000 * 60));

        return {
            duration,
            filesAnalyzedThisSession: this.metrics.filesAnalyzed,
            issuesFoundThisSession: this.metrics.issuesFound,
            fixesAppliedThisSession: this.metrics.fixesApplied,
            averageIssuesPerFile: this.metrics.filesAnalyzed > 0 ? 
                Math.round((this.metrics.issuesFound / this.metrics.filesAnalyzed) * 10) / 10 : 0
        };
    }

    reset(): void {
        this.metrics = {
            filesAnalyzed: 0,
            issuesFound: 0,
            fixesApplied: 0,
            featureUsage: {},
            modernizationProgress: 0,
            lastAnalysis: new Date(),
            sessionStartTime: new Date(),
            analysisHistory: [],
            fixHistory: []
        };
    }

    exportMetrics(): string {
        const exportData = {
            ...this.metrics,
            sessionStats: this.getSessionStats(),
            exportTimestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Load sample data for demonstration
    loadSampleData(): void {
        // Simulate some analysis history
        const sampleFiles = ['app.js', 'components/Header.js', 'styles/main.css', 'utils/api.js', 'index.html'];
        const sampleFeatures = ['var', 'XMLHttpRequest', 'float', 'function', '<div>', '<b><i><u>', 'for-in'];

        sampleFiles.forEach((file, index) => {
            this.recordAnalysis(`src/${file}`, Math.floor(Math.random() * 5) + 1, 
                file.endsWith('.js') ? 'javascript' : 
                file.endsWith('.css') ? 'css' : 
                file.endsWith('.html') ? 'html' : 'typescript'
            );
        });

        // Record feature usage
        sampleFeatures.forEach(feature => {
            const count = Math.floor(Math.random() * 8) + 1;
            this.recordFeatureUsage(feature, count);
        });

        // Record some fixes
        this.recordFix('let-const', 'app.js');
        this.recordFix('fetch', 'api.js');
        this.recordFix('flexbox', 'main.css');
    }
}
