// Enhanced Dashboard JavaScript with Complete Data Visualization
(function() {
    'use strict';

    const vscode = acquireVsCodeApi();
    let currentData = null;
    let activeFeatureCategory = 'all';

    // DOM elements
    const elements = {
        filesAnalyzed: document.getElementById('filesAnalyzed'),
        issuesFound: document.getElementById('issuesFound'),
        fixesApplied: document.getElementById('fixesApplied'),
        progress: document.getElementById('progress'),
        progressFill: document.getElementById('progressFill'),
        filesChange: document.getElementById('filesChange'),
        issuesChange: document.getElementById('issuesChange'),
        fixesChange: document.getElementById('fixesChange'),
        featuresChart: document.getElementById('featuresChart'),
        browserChart: document.getElementById('browserChart'),
        supportedFeaturesContainer: document.getElementById('supportedFeaturesContainer'),
        timelineContainer: document.getElementById('timelineContainer'),
        recommendationsContainer: document.getElementById('recommendationsContainer'),
        baselineStatsContainer: document.getElementById('baselineStatsContainer'),
        refreshBtn: document.getElementById('refreshBtn'),
        timelineBtn: document.getElementById('timelineBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        exportBtn: document.getElementById('exportBtn'),
        resetBtn: document.getElementById('resetBtn')
    };

    // Initialize event listeners
    initializeEventListeners();

    function initializeEventListeners() {
        // Main action buttons
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', () => {
                showLoading();
                vscode.postMessage({ command: 'loadSampleData' });
            });
        }

        if (elements.timelineBtn) {
            elements.timelineBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'generateTimeline' });
            });
        }

        if (elements.analyzeBtn) {
            elements.analyzeBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'analyzeRecommendations' });
            });
        }

        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'exportMetrics' });
            });
        }

        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', () => {
                if (confirm('Reset all metrics? This will clear all progress data.')) {
                    vscode.postMessage({ command: 'resetMetrics' });
                }
            });
        }

        // Feature category tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                setActiveFeatureCategory(category);
                updateSupportedFeaturesDisplay();
            });
        });
    }

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateData':
                currentData = message.data;
                updateDashboard(message.data);
                hideLoading();
                break;
            case 'featureDetails':
                showFeatureDetails(message.data);
                break;
        }
    });

    function showLoading() {
        const loadingElements = document.querySelectorAll('.chart-placeholder, .recommendations-placeholder, .timeline-placeholder, .stats-placeholder, .features-placeholder');
        loadingElements.forEach(el => {
            el.classList.add('loading');
            el.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
        });
    }

    function hideLoading() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => {
            el.classList.remove('loading');
        });
    }

    function updateDashboard(data) {
        if (!data || !data.metrics) return;

        const metrics = data.metrics;

        // Update metrics with smooth animations
        updateMetricWithAnimation(elements.filesAnalyzed, metrics.filesAnalyzed);
        updateMetricWithAnimation(elements.issuesFound, metrics.issuesFound);
        updateMetricWithAnimation(elements.fixesApplied, metrics.fixesApplied);
        updateMetricWithAnimation(elements.progress, `${metrics.modernizationProgress}%`);

        // Update metric descriptions
        if (elements.filesChange) {
            elements.filesChange.textContent = metrics.filesAnalyzed > 0 
                ? `+${metrics.filesAnalyzed} analyzed this session`
                : 'Start analysis to see data';
        }

        if (elements.issuesChange) {
            const severity = metrics.issuesFound === 0 ? 'No issues found' :
                           metrics.issuesFound > 10 ? 'High priority cleanup needed' :
                           metrics.issuesFound > 5 ? 'Medium priority items' : 'Low priority items';
            elements.issuesChange.textContent = severity;
        }

        if (elements.fixesChange) {
            if (metrics.issuesFound > 0) {
                const rate = Math.round((metrics.fixesApplied / metrics.issuesFound) * 100);
                elements.fixesChange.textContent = `${rate}% completion rate`;
            } else {
                elements.fixesChange.textContent = 'No fixes needed yet';
            }
        }

        // Animate progress bar
        if (elements.progressFill) {
            setTimeout(() => {
                elements.progressFill.style.width = `${metrics.modernizationProgress}%`;
            }, 100);
        }

        // Update all dashboard sections
        updateMostUsedFeaturesChart(data.mostUsedFeatures || []);
        updateBrowserCompatibilityChart(data.browserSupport || {});
        updateSupportedWebFeatures(data.supportedFeatures || []);
        updateModernizationTimeline(data.timeline || []);
        updateSmartRecommendations(data.recommendations || []);
        updateBaselineStatistics(data.baselineFeatures || {});
    }

    function updateMetricWithAnimation(element, value) {
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const targetValue = typeof value === 'string' ? value : parseInt(value) || 0;

        if (typeof value === 'string') {
            element.textContent = value;
            return;
        }

        // Smooth number animation
        const duration = 1500;
        const steps = 30;
        const increment = (targetValue - currentValue) / steps;
        let current = currentValue;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;
            element.textContent = Math.round(current).toLocaleString();

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = targetValue.toLocaleString();
            }
        }, duration / steps);
    }

    function updateMostUsedFeaturesChart(features) {
        if (!elements.featuresChart) return;

        if (features.length === 0) {
            elements.featuresChart.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No Legacy Patterns Detected</div>
                    <div class="empty-description">Run "Analyze File" or "Analyze Project" to identify modernization opportunities</div>
                    <button class="empty-action" onclick="analyzeProject()">Analyze Project</button>
                </div>
            `;
            return;
        }

        const maxCount = Math.max(...features.map(f => f.count));

        const chartHTML = `
            <div class="features-header">
                <span class="feature-count-badge">${features.length} patterns found</span>
                <span class="feature-total">Total occurrences: ${features.reduce((sum, f) => sum + f.count, 0)}</span>
            </div>
            <div class="features-list">
                ${features.map((feature, index) => {
                    const percentage = Math.max((feature.count / maxCount) * 100, 10);
                    const priority = feature.count > 5 ? 'high' : feature.count > 2 ? 'medium' : 'low';

                    return `
                        <div class="feature-item ${priority}" onclick="exploreFeature('${escapeHtml(feature.feature)}')" title="Click to explore modernization options">
                            <div class="feature-info">
                                <div class="feature-header">
                                    <span class="feature-name">${escapeHtml(feature.feature)}</span>
                                    <span class="feature-priority priority-${priority}">${priority} priority</span>
                                </div>
                                <div class="feature-bar-container">
                                    <div class="feature-bar" style="width: ${percentage}%;">
                                        <div class="feature-bar-fill"></div>
                                    </div>
                                    <span class="feature-count">${feature.count}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        elements.featuresChart.innerHTML = chartHTML;
    }

    function updateBrowserCompatibilityChart(browserSupport) {
        if (!elements.browserChart) return;

        if (Object.keys(browserSupport).length === 0) {
            elements.browserChart.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌐</div>
                    <div class="empty-title">Browser Data Loading</div>
                    <div class="empty-description">Comprehensive browser compatibility information will appear here</div>
                </div>
            `;
            return;
        }

        const browsers = [
            { key: 'chrome', name: 'Chrome', icon: '🌐', color: '#4285f4' },
            { key: 'firefox', name: 'Firefox', icon: '🦊', color: '#ff7139' },
            { key: 'safari', name: 'Safari', icon: '🧭', color: '#006cff' },
            { key: 'edge', name: 'Edge', icon: '🔷', color: '#0078d4' }
        ];

        const chartHTML = `
            <div class="browser-compatibility-grid">
                ${browsers.map(browser => {
                    const stats = browserSupport[browser.key] || { percentage: 0, supported: 0, total: 0 };
                    const percentage = stats.percentage || 0;
                    const status = percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'limited';

                    return `
                        <div class="browser-item ${status}">
                            <div class="browser-header">
                                <span class="browser-icon">${browser.icon}</span>
                                <span class="browser-name">${browser.name}</span>
                            </div>
                            <div class="browser-percentage" style="color: ${browser.color}">
                                ${percentage}%
                            </div>
                            <div class="browser-details">
                                ${stats.supported}/${stats.total} features
                            </div>
                            <div class="browser-progress-bar">
                                <div class="browser-progress-fill" style="width: ${percentage}%; background-color: ${browser.color}"></div>
                            </div>
                            <div class="browser-status ${status}">${status}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="compatibility-summary">
                <div class="summary-note">
                    <strong>Average Compatibility:</strong> ${Math.round(Object.values(browserSupport).reduce((sum, browser) => sum + (browser.percentage || 0), 0) / Object.keys(browserSupport).length)}%
                    across major browsers
                </div>
            </div>
        `;

        elements.browserChart.innerHTML = chartHTML;
    }

    function updateSupportedWebFeatures(supportedFeatures) {
        if (!elements.supportedFeaturesContainer) return;

        if (supportedFeatures.length === 0) {
            elements.supportedFeaturesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <div class="empty-title">Web Features Loading</div>
                    <div class="empty-description">Baseline web features and compatibility data will appear here</div>
                </div>
            `;
            return;
        }

        currentData.supportedFeatures = supportedFeatures;
        updateSupportedFeaturesDisplay();
    }

    function updateSupportedFeaturesDisplay() {
        if (!currentData || !currentData.supportedFeatures) return;

        const features = activeFeatureCategory === 'all' 
            ? currentData.supportedFeatures 
            : currentData.supportedFeatures.filter(f => f.category === activeFeatureCategory);

        const featuresHTML = `
            <div class="features-grid">
                ${features.map(feature => `
                    <div class="supported-feature-card ${feature.baseline}" onclick="exploreFeature('${feature.id}')">
                        <div class="feature-card-header">
                            <h4 class="feature-title">${feature.name}</h4>
                            <span class="baseline-badge ${feature.baseline}">${getBaselineLabel(feature.baseline)}</span>
                        </div>
                        <p class="feature-description">${feature.description}</p>
                        <div class="feature-metadata">
                            <div class="feature-category">${feature.category}</div>
                            ${feature.since ? `<div class="feature-since">Since ${feature.since}</div>` : ''}
                        </div>
                        <div class="feature-browsers">
                            ${Object.entries(feature.browsers || {}).map(([browser, version]) => 
                                `<span class="browser-version ${browser}" title="${browser} ${version}+">${version}+</span>`
                            ).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ${features.length === 0 ? `
                <div class="empty-category">
                    <div class="empty-icon">📂</div>
                    <div class="empty-title">No ${activeFeatureCategory} Features</div>
                    <div class="empty-description">Switch to a different category to explore more features</div>
                </div>
            ` : ''}
        `;

        elements.supportedFeaturesContainer.innerHTML = featuresHTML;
    }

    function updateModernizationTimeline(timeline) {
        if (!elements.timelineContainer) return;

        if (timeline.length === 0) {
            elements.timelineContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <div class="empty-title">Timeline Ready</div>
                    <div class="empty-description">Your modernization timeline will be generated based on analysis results</div>
                    <button class="empty-action" onclick="generateTimeline()">Generate Timeline</button>
                </div>
            `;
            return;
        }

        const timelineHTML = timeline.map((phase, index) => {
            const statusClass = phase.status.replace(/[^a-zA-Z0-9]/g, '');
            const statusEmoji = getPhaseEmoji(phase.status);
            const priorityColor = getPriorityColor(phase.priority);

            return `
                <div class="timeline-item ${statusClass}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3 class="timeline-phase">${statusEmoji} ${phase.phase}</h3>
                            <span class="timeline-status ${statusClass}">${phase.status}</span>
                        </div>
                        <p class="timeline-description">${phase.description}</p>
                        <div class="timeline-progress-container">
                            <div class="timeline-progress-bar">
                                <div class="timeline-progress-fill" style="width: ${phase.progress}%"></div>
                            </div>
                            <span class="timeline-progress-text">${phase.progress}%</span>
                        </div>
                        <div class="timeline-metadata">
                            <span class="timeline-duration">⏱️ ${phase.duration}</span>
                            <span class="timeline-priority" style="background-color: ${priorityColor}">
                                🎯 ${phase.priority.toUpperCase()}
                            </span>
                        </div>
                        ${phase.tasks ? `
                            <div class="timeline-tasks">
                                <h4>Key Tasks:</h4>
                                <ul>
                                    ${phase.tasks.map(task => `<li>${task}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        elements.timelineContainer.innerHTML = timelineHTML;
    }

    function updateSmartRecommendations(recommendations) {
        if (!elements.recommendationsContainer) return;

        if (recommendations.length === 0) {
            elements.recommendationsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💡</div>
                    <div class="empty-title">No Recommendations Yet</div>
                    <div class="empty-description">Analyze your code to get personalized modernization recommendations</div>
                    <button class="empty-action" onclick="analyzeProject()">Analyze Project</button>
                </div>
            `;
            return;
        }

        const recommendationsHTML = recommendations.map(rec => {
            const typeEmoji = getRecommendationEmoji(rec.type);
            const impactClass = (rec.impact || 'medium').toLowerCase();

            return `
                <div class="recommendation-item ${rec.type}">
                    <div class="recommendation-header">
                        <h3 class="recommendation-title">${typeEmoji} ${rec.title}</h3>
                        <div class="recommendation-metadata">
                            <span class="recommendation-impact ${impactClass}">
                                ${rec.impact || 'Medium'} Impact
                            </span>
                            <span class="recommendation-type">${rec.type}</span>
                        </div>
                    </div>
                    <p class="recommendation-description">${rec.description}</p>
                    ${rec.actionable ? `
                        <button class="recommendation-action" onclick="applyRecommendation('${rec.id}')">
                            ${rec.action}
                        </button>
                    ` : `
                        <div class="recommendation-info">${rec.action}</div>
                    `}
                </div>
            `;
        }).join('');

        elements.recommendationsContainer.innerHTML = recommendationsHTML;
    }

    function updateBaselineStatistics(baselineFeatures) {
        if (!elements.baselineStatsContainer) return;

        if (!baselineFeatures || Object.keys(baselineFeatures).length === 0) {
            elements.baselineStatsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">Statistics Loading</div>
                    <div class="empty-description">Comprehensive Baseline statistics will appear here</div>
                </div>
            `;
            return;
        }

        const statsHTML = `
            <div class="baseline-stats-grid">
                <div class="baseline-stat-item total-features">
                    <div class="stat-icon">🌐</div>
                    <div class="stat-content">
                        <div class="baseline-stat-number">${(baselineFeatures.total || 0).toLocaleString()}</div>
                        <div class="baseline-stat-label">Total Web Features</div>
                        <div class="stat-description">Tracked by Baseline</div>
                    </div>
                </div>

                <div class="baseline-stat-item widely-available">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="baseline-stat-number">${(baselineFeatures.widely_available || 0).toLocaleString()}</div>
                        <div class="baseline-stat-label">Widely Available</div>
                        <div class="stat-description">Safe to use everywhere</div>
                    </div>
                </div>

                <div class="baseline-stat-item newly-available">
                    <div class="stat-icon">🟡</div>
                    <div class="stat-content">
                        <div class="baseline-stat-number">${(baselineFeatures.newly_available || 0).toLocaleString()}</div>
                        <div class="baseline-stat-label">Newly Available</div>
                        <div class="stat-description">Recently supported</div>
                    </div>
                </div>

                <div class="baseline-stat-item limited-availability">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <div class="baseline-stat-number">${(baselineFeatures.limited_availability || 0).toLocaleString()}</div>
                        <div class="baseline-stat-label">Limited Support</div>
                        <div class="stat-description">Use with caution</div>
                    </div>
                </div>
            </div>

            <div class="baseline-summary">
                <div class="summary-chart">
                    <div class="summary-title">Baseline Adoption Health</div>
                    <div class="summary-percentage">${baselineFeatures.adoption_percentage || 0}%</div>
                    <div class="summary-description">of web features are widely available</div>
                    <div class="summary-progress">
                        <div class="summary-progress-fill" style="width: ${baselineFeatures.adoption_percentage || 0}%"></div>
                    </div>
                </div>
            </div>
        `;

        elements.baselineStatsContainer.innerHTML = statsHTML;
    }

    // Utility functions
    function setActiveFeatureCategory(category) {
        activeFeatureCategory = category;

        // Update tab appearance
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
    }

    function getBaselineLabel(status) {
        switch (status) {
            case 'high': return 'Widely Available';
            case 'low': return 'Newly Available';
            default: return 'Limited';
        }
    }

    function getPhaseEmoji(status) {
        switch (status) {
            case 'completed': return '✅';
            case 'in-progress': return '🔄';
            case 'ready': return '🎯';
            default: return '⏳';
        }
    }

    function getPriorityColor(priority) {
        switch (priority) {
            case 'high': return '#e74c3c';
            case 'medium': return '#f39c12';
            case 'low': return '#27ae60';
            default: return '#7f8c8d';
        }
    }

    function getRecommendationEmoji(type) {
        switch (type) {
            case 'priority': return '🔥';
            case 'warning': return '⚠️';
            case 'suggestion': return '💡';
            default: return 'ℹ️';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global functions for button clicks
    window.exploreFeature = function(featureId) {
        vscode.postMessage({ command: 'getFeatureDetails', featureId: featureId });
    };

    window.applyRecommendation = function(recommendationId) {
        vscode.postMessage({ command: 'applyRecommendation', recommendationId: recommendationId });
    };

    window.generateTimeline = function() {
        vscode.postMessage({ command: 'generateTimeline' });
    };

    window.analyzeProject = function() {
        vscode.postMessage({ command: 'analyzeRecommendations' });
    };

    // Initialize dashboard
    showLoading();
    vscode.postMessage({ command: 'loadSampleData' });

    // Auto-refresh every 60 seconds
    setInterval(() => {
        vscode.postMessage({ command: 'refresh' });
    }, 60000);
})();
