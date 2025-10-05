import * as vscode from 'vscode';

export interface BaselineFeatureInfo {
    id: string;
    name: string;
    description: string;
    group: string;
    status: {
        baseline: 'high' | 'low' | false | undefined;
        baseline_high_date?: string;
        baseline_low_date?: string;
        support: Record<string, string | boolean | undefined>;
    };
    spec?: string;
    caniuse?: string;
    compat_features: string[];
    browserDetails?: BrowserSupportDetails;
    category: string;
}

export interface BrowserSupportDetails {
    chrome: { version: string; status: 'supported' | 'partial' | 'unsupported'; since?: string };
    firefox: { version: string; status: 'supported' | 'partial' | 'unsupported'; since?: string };
    safari: { version: string; status: 'supported' | 'partial' | 'unsupported'; since?: string };
    edge: { version: string; status: 'supported' | 'partial' | 'unsupported'; since?: string };
}

export interface ModernAlternative {
    feature: string;
    replacement: string;
    description: string;
    example: string;
    baselineStatus: 'high' | 'low' | false;
    browserSupport: Record<string, string | boolean | undefined>;
    migrationGuide?: string;
    benefits?: string[];
    caveats?: string[];
}

export interface AnalysisResult {
    fileName: string;
    language: string;
    issuesFound: number;
    patterns: Array<{
        pattern: string;
        count: number;
        locations: Array<{ line: number; column: number; suggestion: string }>;
    }>;
    recommendations: ModernAlternative[];
    baselineScore: number;
}

export class BaselineService {
    private featuresMap: Map<string, BaselineFeatureInfo>;
    private modernAlternatives: Map<string, ModernAlternative[]>;
    private sampleFeatures: BaselineFeatureInfo[];

    constructor() {
        this.featuresMap = new Map();
        this.modernAlternatives = new Map();
        this.sampleFeatures = [];
        this.initializeFeatures();
        this.initializeModernAlternatives();
    }

    private initializeFeatures() {
        // Initialize with comprehensive sample features representing real Baseline data
        this.sampleFeatures = [
            {
                id: 'flexbox',
                name: 'CSS Flexbox',
                description: 'A layout method for arranging items in rows or columns with flexible sizing',
                group: 'css-layout',
                category: 'CSS',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2017-03-01',
                    support: { chrome: '29', firefox: '28', safari: '9', edge: '12' }
                },
                compat_features: ['css.properties.display.flex', 'css.properties.flex-direction'],
                browserDetails: {
                    chrome: { version: '29', status: 'supported', since: '2013-08' },
                    firefox: { version: '28', status: 'supported', since: '2014-03' },
                    safari: { version: '9', status: 'supported', since: '2015-09' },
                    edge: { version: '12', status: 'supported', since: '2015-07' }
                }
            },
            {
                id: 'fetch',
                name: 'Fetch API',
                description: 'Modern promise-based API for making HTTP requests',
                group: 'web-api',
                category: 'JavaScript',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2017-04-01',
                    support: { chrome: '42', firefox: '39', safari: '10.1', edge: '14' }
                },
                compat_features: ['api.fetch', 'api.Request', 'api.Response'],
                browserDetails: {
                    chrome: { version: '42', status: 'supported', since: '2015-04' },
                    firefox: { version: '39', status: 'supported', since: '2015-06' },
                    safari: { version: '10.1', status: 'supported', since: '2017-03' },
                    edge: { version: '14', status: 'supported', since: '2016-08' }
                }
            },
            {
                id: 'let-const',
                name: 'let and const declarations',
                description: 'Block-scoped variable declarations with let and const keywords',
                group: 'javascript-syntax',
                category: 'JavaScript',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2016-07-01',
                    support: { chrome: '49', firefox: '36', safari: '10', edge: '12' }
                },
                compat_features: ['javascript.statements.let', 'javascript.statements.const'],
                browserDetails: {
                    chrome: { version: '49', status: 'supported', since: '2016-03' },
                    firefox: { version: '36', status: 'supported', since: '2015-02' },
                    safari: { version: '10', status: 'supported', since: '2016-09' },
                    edge: { version: '12', status: 'supported', since: '2015-07' }
                }
            },
            {
                id: 'grid',
                name: 'CSS Grid Layout',
                description: 'Two-dimensional layout system for complex grid-based designs',
                group: 'css-layout',
                category: 'CSS',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2020-01-01',
                    support: { chrome: '57', firefox: '52', safari: '10.1', edge: '16' }
                },
                compat_features: ['css.properties.display.grid', 'css.properties.grid-template-columns'],
                browserDetails: {
                    chrome: { version: '57', status: 'supported', since: '2017-03' },
                    firefox: { version: '52', status: 'supported', since: '2017-03' },
                    safari: { version: '10.1', status: 'supported', since: '2017-03' },
                    edge: { version: '16', status: 'supported', since: '2017-10' }
                }
            },
            {
                id: 'arrow-functions',
                name: 'Arrow Functions',
                description: 'Concise function syntax with lexical this binding',
                group: 'javascript-syntax',
                category: 'JavaScript',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2016-07-01',
                    support: { chrome: '45', firefox: '22', safari: '10', edge: '12' }
                },
                compat_features: ['javascript.functions.arrow_functions'],
                browserDetails: {
                    chrome: { version: '45', status: 'supported', since: '2015-09' },
                    firefox: { version: '22', status: 'supported', since: '2013-06' },
                    safari: { version: '10', status: 'supported', since: '2016-09' },
                    edge: { version: '12', status: 'supported', since: '2015-07' }
                }
            },
            {
                id: 'semantic-elements',
                name: 'HTML5 Semantic Elements',
                description: 'Meaningful HTML elements like header, nav, main, section, article, aside, footer',
                group: 'html-elements',
                category: 'HTML',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2014-01-01',
                    support: { chrome: '5', firefox: '4', safari: '4.1', edge: '12' }
                },
                compat_features: ['html.elements.header', 'html.elements.nav', 'html.elements.main'],
                browserDetails: {
                    chrome: { version: '5', status: 'supported', since: '2010-05' },
                    firefox: { version: '4', status: 'supported', since: '2011-03' },
                    safari: { version: '4.1', status: 'supported', since: '2010-06' },
                    edge: { version: '12', status: 'supported', since: '2015-07' }
                }
            },
            {
                id: 'custom-properties',
                name: 'CSS Custom Properties (Variables)',
                description: 'CSS variables for creating reusable values throughout stylesheets',
                group: 'css-syntax',
                category: 'CSS',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2018-04-01',
                    support: { chrome: '49', firefox: '31', safari: '9.1', edge: '16' }
                },
                compat_features: ['css.properties.custom-property'],
                browserDetails: {
                    chrome: { version: '49', status: 'supported', since: '2016-03' },
                    firefox: { version: '31', status: 'supported', since: '2014-07' },
                    safari: { version: '9.1', status: 'supported', since: '2016-03' },
                    edge: { version: '16', status: 'supported', since: '2017-10' }
                }
            },
            {
                id: 'template-literals',
                name: 'Template Literals',
                description: 'Enhanced string literals with embedded expressions using backticks',
                group: 'javascript-syntax',
                category: 'JavaScript',
                status: {
                    baseline: 'high',
                    baseline_high_date: '2016-07-01',
                    support: { chrome: '41', firefox: '34', safari: '9', edge: '12' }
                },
                compat_features: ['javascript.grammar.template_literals'],
                browserDetails: {
                    chrome: { version: '41', status: 'supported', since: '2015-03' },
                    firefox: { version: '34', status: 'supported', since: '2014-12' },
                    safari: { version: '9', status: 'supported', since: '2015-09' },
                    edge: { version: '12', status: 'supported', since: '2015-07' }
                }
            },
            {
                id: 'object-spread',
                name: 'Object Spread Syntax',
                description: 'Spread properties in object literals for easy object composition',
                group: 'javascript-syntax',
                category: 'JavaScript',
                status: {
                    baseline: 'low',
                    baseline_low_date: '2024-03-01',
                    support: { chrome: '60', firefox: '55', safari: '11.1', edge: '79' }
                },
                compat_features: ['javascript.operators.spread.spread_in_object_literals'],
                browserDetails: {
                    chrome: { version: '60', status: 'supported', since: '2017-07' },
                    firefox: { version: '55', status: 'supported', since: '2017-08' },
                    safari: { version: '11.1', status: 'supported', since: '2018-03' },
                    edge: { version: '79', status: 'supported', since: '2020-01' }
                }
            },
            {
                id: 'container-queries',
                name: 'CSS Container Queries',
                description: 'Style elements based on the size of their containing element',
                group: 'css-layout',
                category: 'CSS',
                status: {
                    baseline: 'low',
                    baseline_low_date: '2024-02-01',
                    support: { chrome: '105', firefox: '110', safari: '16', edge: '105' }
                },
                compat_features: ['css.at-rules.container', 'css.properties.container-type'],
                browserDetails: {
                    chrome: { version: '105', status: 'supported', since: '2022-08' },
                    firefox: { version: '110', status: 'supported', since: '2023-02' },
                    safari: { version: '16', status: 'supported', since: '2022-09' },
                    edge: { version: '105', status: 'supported', since: '2022-08' }
                }
            }
        ];

        // Populate features map
        this.sampleFeatures.forEach(feature => {
            this.featuresMap.set(feature.id, feature);
        });
    }

    private initializeModernAlternatives() {
        // Comprehensive modern alternatives with detailed information
        this.modernAlternatives.set('var', [
            {
                feature: 'let-const',
                replacement: 'let/const',
                description: 'Use let for variables that change, const for constants. Better scoping than var.',
                example: 'const API_URL = "https://api.example.com"; let userCount = 0;',
                baselineStatus: 'high',
                browserSupport: { chrome: '49', firefox: '36', safari: '10', edge: '12' },
                migrationGuide: 'Replace var with const for values that don\'t change, let for variables',
                benefits: ['Block scoping', 'Temporal dead zone', 'No hoisting confusion', 'Prevent accidental reassignment'],
                caveats: ['const requires initialization', 'Different hoisting behavior']
            }
        ]);

        this.modernAlternatives.set('XMLHttpRequest', [
            {
                feature: 'fetch',
                replacement: 'Fetch API',
                description: 'Modern promise-based HTTP client with better error handling and cleaner syntax',
                example: 'fetch("/api/users").then(response => response.json()).then(users => console.log(users))',
                baselineStatus: 'high',
                browserSupport: { chrome: '42', firefox: '39', safari: '10.1', edge: '14' },
                migrationGuide: 'Replace XMLHttpRequest with fetch(), handle promises instead of callbacks',
                benefits: ['Promise-based', 'Cleaner syntax', 'Better error handling', 'Streaming support'],
                caveats: ['Different error handling', 'No automatic request/response timeout', 'CORS restrictions']
            }
        ]);

        this.modernAlternatives.set('float', [
            {
                feature: 'flexbox',
                replacement: 'CSS Flexbox',
                description: 'Modern layout method for one-dimensional layouts with flexible items',
                example: '.container { display: flex; justify-content: space-between; align-items: center; }',
                baselineStatus: 'high',
                browserSupport: { chrome: '29', firefox: '28', safari: '9', edge: '12' },
                migrationGuide: 'Replace float-based layouts with flex containers',
                benefits: ['No clearfix needed', 'Better alignment', 'Responsive by default', 'Flexible spacing'],
                caveats: ['One-dimensional layout', 'Different mental model', 'IE10 has bugs']
            },
            {
                feature: 'grid',
                replacement: 'CSS Grid',
                description: 'Two-dimensional layout system for complex grid-based designs',
                example: '.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }',
                baselineStatus: 'high',
                browserSupport: { chrome: '57', firefox: '52', safari: '10.1', edge: '16' },
                migrationGuide: 'Use Grid for two-dimensional layouts, combine with flexbox',
                benefits: ['Two-dimensional control', 'Responsive grids', 'Powerful alignment', 'No framework needed'],
                caveats: ['Overkill for simple layouts', 'IE11 has old implementation']
            }
        ]);

        this.modernAlternatives.set('function', [
            {
                feature: 'arrow-functions',
                replacement: 'Arrow Functions',
                description: 'Concise function syntax with lexical this binding, perfect for callbacks',
                example: 'const users = data.map(item => ({ id: item.id, name: item.name }));',
                baselineStatus: 'high',
                browserSupport: { chrome: '45', firefox: '22', safari: '10', edge: '12' },
                migrationGuide: 'Replace function expressions with arrow functions, keep function declarations',
                benefits: ['Shorter syntax', 'Lexical this binding', 'No arguments object', 'Cannot be used as constructors'],
                caveats: ['No this binding', 'Cannot be hoisted', 'No arguments object']
            }
        ]);

        this.modernAlternatives.set('<div>', [
            {
                feature: 'semantic-elements',
                replacement: 'Semantic HTML5 Elements',
                description: 'Use meaningful HTML elements that describe content structure and purpose',
                example: '<header>, <nav>, <main>, <section>, <article>, <aside>, <footer>',
                baselineStatus: 'high',
                browserSupport: { chrome: '5', firefox: '4', safari: '4.1', edge: '12' },
                migrationGuide: 'Replace generic divs with appropriate semantic elements based on content',
                benefits: ['Better SEO', 'Improved accessibility', 'Clearer document structure', 'Screen reader support'],
                caveats: ['CSS selectors may need updates', 'Different default styling']
            }
        ]);

        this.modernAlternatives.set('<b><i><u>', [
            {
                feature: 'semantic-formatting',
                replacement: 'Semantic Text Elements',
                description: 'Use elements that convey meaning, not just appearance',
                example: '<strong> for importance, <em> for emphasis, <mark> for highlighting',
                baselineStatus: 'high',
                browserSupport: { chrome: '1', firefox: '1', safari: '1', edge: '12' },
                migrationGuide: 'Replace presentational elements with semantic alternatives',
                benefits: ['Better semantics', 'Accessibility improvements', 'Future-proof markup'],
                caveats: ['Default styling may differ', 'CSS updates needed']
            }
        ]);
    }

    getAllFeatures(): BaselineFeatureInfo[] {
        return [...this.sampleFeatures];
    }

    getBaselineFeatures(status: 'high' | 'low' | false): BaselineFeatureInfo[] {
        return this.sampleFeatures.filter(feature => feature.status.baseline === status);
    }

    getFeatureInfo(featureId: string): BaselineFeatureInfo | undefined {
        return this.featuresMap.get(featureId) || 
               this.sampleFeatures.find(f => f.name.toLowerCase().includes(featureId.toLowerCase()));
    }

    getBrowserSupport(featureId: string): Record<string, string | boolean | undefined> {
        const feature = this.getFeatureInfo(featureId);
        return feature?.status.support || {};
    }

    getModernAlternatives(legacyPattern: string): ModernAlternative[] {
        const exactMatch = this.modernAlternatives.get(legacyPattern);
        if (exactMatch) return exactMatch;

        // Check for partial matches
        const partialMatches: ModernAlternative[] = [];
        for (const [pattern, alternatives] of this.modernAlternatives) {
            if (legacyPattern.includes(pattern) || pattern.includes(legacyPattern)) {
                partialMatches.push(...alternatives);
            }
        }

        return partialMatches;
    }

    searchFeatures(query: string): BaselineFeatureInfo[] {
        const lowerQuery = query.toLowerCase();
        return this.sampleFeatures.filter(feature =>
            feature.name.toLowerCase().includes(lowerQuery) ||
            feature.description.toLowerCase().includes(lowerQuery) ||
            feature.id.toLowerCase().includes(lowerQuery) ||
            feature.category.toLowerCase().includes(lowerQuery)
        );
    }

    calculateBaselineScore(analysisResult: AnalysisResult): number {
        const totalPatterns = analysisResult.patterns.reduce((sum, pattern) => sum + pattern.count, 0);
        if (totalPatterns === 0) return 100;

        const modernPatterns = analysisResult.recommendations.filter(rec => rec.baselineStatus === 'high');
        const modernCount = modernPatterns.length;

        return Math.round(Math.max(0, 100 - (totalPatterns - modernCount) * 10));
    }

    getBrowsers() {
        return {
            chrome: { name: 'Chrome', icon: '🌐' },
            firefox: { name: 'Firefox', icon: '🦊' },
            safari: { name: 'Safari', icon: '🧭' },
            edge: { name: 'Edge', icon: '🔷' }
        };
    }
}
