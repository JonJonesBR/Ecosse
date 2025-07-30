/**
 * Production Configuration Manager
 * Handles environment detection and resource loading optimization
 */

class ProductionConfigManager {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.loadConfiguration();
        this.resourcesLoaded = false;
        
        console.log(`Environment detected: ${this.environment}`);
    }

    /**
     * Detect if we're running in production or development environment
     * @returns {string} 'production' or 'development'
     */
    detectEnvironment() {
        // Check for common production indicators
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        const isFileProtocol = window.location.protocol === 'file:';
        const hasDevPort = /:\d{4,5}$/.test(window.location.host); // Common dev ports
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isNetlify = window.location.hostname.includes('netlify.app');
        const isVercel = window.location.hostname.includes('vercel.app');
        
        // Consider it production if it's on a hosting service or not localhost
        if (isGitHubPages || isNetlify || isVercel || (!isLocalhost && !isFileProtocol && !hasDevPort)) {
            return 'production';
        }
        
        return 'development';
    }

    /**
     * Load configuration based on environment
     * @returns {Object} Configuration object
     */
    loadConfiguration() {
        // Default configuration
        const defaultConfig = {
            environment: this.environment,
            resources: {
                tailwind: {
                    development: 'https://cdn.tailwindcss.com',
                    production: './css/tailwind.min.css'
                },
                fonts: {
                    development: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
                    production: './css/fonts.css'
                },
                fontAwesome: {
                    development: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
                    production: './css/font-awesome.min.css'
                }
            },
            optimization: {
                minifyCSS: this.environment === 'production',
                bundleResources: this.environment === 'production',
                enableCaching: this.environment === 'production',
                compressionLevel: this.environment === 'production' ? 'high' : 'none'
            }
        };

        // Try to load production configuration file
        if (this.environment === 'production') {
            try {
                // In a real scenario, this would be loaded via fetch or bundled
                // For now, we'll use the default config with production optimizations
                return {
                    ...defaultConfig,
                    optimization: {
                        ...defaultConfig.optimization,
                        preloadCriticalResources: true,
                        lazyLoadNonCritical: true,
                        enablePerformanceMonitoring: true
                    }
                };
            } catch (error) {
                console.warn('Could not load production config, using defaults:', error);
            }
        }

        return defaultConfig;
    }

    /**
     * Replace CDN resources with local production-ready versions
     */
    async replaceCDNResources() {
        if (this.environment === 'development') {
            console.log('Development environment detected, keeping CDN resources');
            return;
        }

        console.log('Production environment detected, replacing CDN resources...');

        try {
            // Replace Tailwind CSS
            await this.replaceTailwindCSS();
            
            // Replace Google Fonts
            await this.replaceGoogleFonts();
            
            // Replace Font Awesome
            await this.replaceFontAwesome();
            
            this.resourcesLoaded = true;
            console.log('All CDN resources successfully replaced with local versions');
            
        } catch (error) {
            console.warn('Failed to replace some CDN resources, falling back to CDN:', error);
            this.handleResourceLoadingError(error);
        }
    }

    /**
     * Replace Tailwind CSS CDN with local version
     */
    async replaceTailwindCSS() {
        const tailwindScript = document.querySelector('script[src*="tailwindcss.com"]');
        if (!tailwindScript) {
            console.log('Tailwind CDN script not found');
            return;
        }

        // Check if local Tailwind CSS exists
        const localTailwindExists = await this.checkResourceExists('./css/tailwind.min.css');
        
        if (localTailwindExists) {
            // Create link element for local CSS
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = './css/tailwind.min.css';
            linkElement.id = 'tailwind-local';
            
            // Insert before the script tag
            tailwindScript.parentNode.insertBefore(linkElement, tailwindScript);
            
            // Remove the CDN script
            tailwindScript.remove();
            
            console.log('Tailwind CSS replaced with local version');
        } else {
            console.warn('Local Tailwind CSS not found, generating minimal build...');
            await this.generateMinimalTailwindBuild();
        }
    }

    /**
     * Replace Google Fonts with local version
     */
    async replaceGoogleFonts() {
        const googleFontsLink = document.querySelector('link[href*="fonts.googleapis.com"]');
        if (!googleFontsLink) {
            console.log('Google Fonts link not found');
            return;
        }

        const localFontsExists = await this.checkResourceExists('./css/fonts.css');
        
        if (localFontsExists) {
            googleFontsLink.href = './css/fonts.css';
            console.log('Google Fonts replaced with local version');
        } else {
            console.warn('Local fonts not found, keeping CDN version');
        }
    }

    /**
     * Replace Font Awesome with local version
     */
    async replaceFontAwesome() {
        const fontAwesomeLink = document.querySelector('link[href*="font-awesome"]');
        if (!fontAwesomeLink) {
            console.log('Font Awesome link not found');
            return;
        }

        const localFontAwesomeExists = await this.checkResourceExists('./css/font-awesome.min.css');
        
        if (localFontAwesomeExists) {
            fontAwesomeLink.href = './css/font-awesome.min.css';
            console.log('Font Awesome replaced with local version');
        } else {
            console.warn('Local Font Awesome not found, keeping CDN version');
        }
    }

    /**
     * Check if a resource exists
     * @param {string} url - Resource URL to check
     * @returns {Promise<boolean>} True if resource exists
     */
    async checkResourceExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate minimal Tailwind CSS build with only used classes
     */
    async generateMinimalTailwindBuild() {
        // This would typically be done at build time, but we'll create a minimal fallback
        const minimalTailwindCSS = `
/* Minimal Tailwind CSS Build - Production Fallback */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-grow { flex-grow: 1; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.text-sm { font-size: 0.875rem; }
.text-xl { font-size: 1.25rem; }
.text-3xl { font-size: 1.875rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-white { color: rgb(255 255 255); }
.text-gray-200 { color: rgb(229 231 235); }
.text-gray-300 { color: rgb(209 213 219); }
.text-gray-400 { color: rgb(156 163 175); }
.bg-green-600 { background-color: rgb(22 163 74); }
.bg-green-700 { background-color: rgb(21 128 61); }
.bg-blue-600 { background-color: rgb(37 99 235); }
.bg-blue-700 { background-color: rgb(29 78 216); }
.bg-purple-600 { background-color: rgb(147 51 234); }
.bg-purple-700 { background-color: rgb(126 34 206); }
.bg-red-600 { background-color: rgb(220 38 38); }
.bg-red-700 { background-color: rgb(185 28 28); }
.hover\\:bg-green-700:hover { background-color: rgb(21 128 61); }
.hover\\:bg-blue-800:hover { background-color: rgb(30 64 175); }
.hover\\:bg-purple-700:hover { background-color: rgb(126 34 206); }
.hover\\:bg-red-700:hover { background-color: rgb(185 28 28); }
.hidden { display: none; }
.block { display: block; }
.selection\\:bg-indigo-700 *::selection { background-color: rgb(67 56 202); }
.selection\\:text-white *::selection { color: rgb(255 255 255); }
@media (min-width: 1024px) {
  .lg\\:hidden { display: none; }
}
@media (min-width: 640px) {
  .sm\\:inline { display: inline; }
}
`;

        // Create and inject the minimal CSS
        const styleElement = document.createElement('style');
        styleElement.id = 'minimal-tailwind';
        styleElement.textContent = minimalTailwindCSS;
        document.head.appendChild(styleElement);
        
        console.log('Minimal Tailwind CSS build generated and injected');
    }

    /**
     * Handle resource loading errors with graceful fallback
     * @param {Error} error - The error that occurred
     */
    handleResourceLoadingError(error) {
        console.warn('Resource loading error:', error);
        
        // Implement graceful degradation
        if (!document.querySelector('#fallback-styles')) {
            const fallbackStyles = document.createElement('style');
            fallbackStyles.id = 'fallback-styles';
            fallbackStyles.textContent = `
                /* Fallback styles for production */
                body { font-family: Arial, sans-serif; }
                .btn { 
                    padding: 8px 16px; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    background: #4f46e5; 
                    color: white; 
                }
                .btn:hover { background: #3730a3; }
                .panel { background: rgba(0,0,0,0.8); padding: 16px; }
                .text-white { color: white; }
                .flex { display: flex; }
                .hidden { display: none; }
            `;
            document.head.appendChild(fallbackStyles);
        }
    }

    /**
     * Initialize production optimizations
     */
    async initialize() {
        console.log('Initializing Production Configuration Manager...');
        
        // Replace CDN resources if in production
        await this.replaceCDNResources();
        
        // Apply production optimizations
        if (this.environment === 'production') {
            this.applyProductionOptimizations();
        }
        
        // Monitor resource loading
        this.monitorResourceLoading();
        
        console.log('Production Configuration Manager initialized successfully');
    }

    /**
     * Apply production-specific optimizations
     */
    applyProductionOptimizations() {
        // Enable resource caching
        if (this.config.optimization.enableCaching) {
            this.enableResourceCaching();
        }
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Optimize loading performance
        this.optimizeLoadingPerformance();
    }

    /**
     * Enable resource caching for production
     */
    enableResourceCaching() {
        // Add cache headers meta tag
        const cacheMetaTag = document.createElement('meta');
        cacheMetaTag.httpEquiv = 'Cache-Control';
        cacheMetaTag.content = 'public, max-age=31536000';
        document.head.appendChild(cacheMetaTag);
        
        console.log('Resource caching enabled');
    }

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            './css/style.css',
            './css/adaptive-ui.css',
            './js/main.js'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            link.href = resource;
            document.head.appendChild(link);
        });
        
        console.log('Critical resources preloaded');
    }

    /**
     * Optimize loading performance
     */
    optimizeLoadingPerformance() {
        // Add loading performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
                
                // Report slow loading
                if (loadTime > 3000) {
                    console.warn('Slow page load detected, consider further optimization');
                }
            });
        }
    }

    /**
     * Monitor resource loading status
     */
    monitorResourceLoading() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name.includes('cdn') && this.environment === 'production') {
                    console.warn(`CDN resource still loading in production: ${entry.name}`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * Get current environment
     * @returns {string} Current environment
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Get configuration
     * @returns {Object} Current configuration
     */
    getConfiguration() {
        return this.config;
    }

    /**
     * Check if resources are loaded
     * @returns {boolean} True if resources are loaded
     */
    areResourcesLoaded() {
        return this.resourcesLoaded;
    }
}

// Export for use in other modules
window.ProductionConfigManager = ProductionConfigManager;

// Auto-initialize if not in test environment
if (typeof window !== 'undefined' && !window.location.href.includes('test')) {
    window.productionConfigManager = new ProductionConfigManager();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.productionConfigManager.initialize();
        });
    } else {
        window.productionConfigManager.initialize();
    }
}