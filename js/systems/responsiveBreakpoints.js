/**
 * Responsive Breakpoint Detection System
 * Handles viewport size monitoring and breakpoint-based layout changes
 * Requirements: 5.1, 5.2
 */

class ResponsiveBreakpointSystem {
    constructor() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1440,
            ultrawide: 1920
        };
        
        this.currentBreakpoint = null;
        this.previousBreakpoint = null;
        
        // Listeners for breakpoint changes
        this.breakpointChangeListeners = [];
        
        // Media query objects for efficient monitoring
        this.mediaQueries = {};
        
        this.init();
    }
    
    init() {
        console.log('📱 Initializing Responsive Breakpoint System...');
        
        // Set initial breakpoint
        this.updateCurrentBreakpoint();
        
        // Set up media query listeners
        this.setupMediaQueryListeners();
        
        console.log(`✅ Responsive Breakpoint System initialized - Current: ${this.currentBreakpoint}`);
    }
    
    /**
     * Set up media query listeners for efficient breakpoint detection
     */
    setupMediaQueryListeners() {
        // Create media queries for each breakpoint
        this.mediaQueries.mobile = window.matchMedia(`(max-width: ${this.breakpoints.mobile - 1}px)`);
        this.mediaQueries.tablet = window.matchMedia(`(min-width: ${this.breakpoints.mobile}px) and (max-width: ${this.breakpoints.tablet - 1}px)`);
        this.mediaQueries.desktop = window.matchMedia(`(min-width: ${this.breakpoints.tablet}px) and (max-width: ${this.breakpoints.desktop - 1}px)`);
        this.mediaQueries.ultrawide = window.matchMedia(`(min-width: ${this.breakpoints.desktop}px)`);
        
        // Add listeners to each media query
        Object.keys(this.mediaQueries).forEach(breakpoint => {
            this.mediaQueries[breakpoint].addListener((mq) => {
                if (mq.matches) {
                    this.handleBreakpointChange(breakpoint);
                }
            });
        });
    }
    
    /**
     * Update current breakpoint based on viewport width
     */
    updateCurrentBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint;
        
        if (width < this.breakpoints.mobile) {
            newBreakpoint = 'mobile';
        } else if (width < this.breakpoints.tablet) {
            newBreakpoint = 'tablet';
        } else if (width < this.breakpoints.desktop) {
            newBreakpoint = 'desktop';
        } else {
            newBreakpoint = 'ultrawide';
        }
        
        if (newBreakpoint !== this.currentBreakpoint) {
            this.previousBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;
            
            if (this.previousBreakpoint !== null) {
                this.handleBreakpointChange(newBreakpoint);
            }
        }
    }
    
    /**
     * Handle breakpoint change
     */
    handleBreakpointChange(newBreakpoint) {
        console.log(`📱 Breakpoint changed: ${this.previousBreakpoint} → ${newBreakpoint}`);
        
        // Notify listeners
        this.notifyBreakpointChange({
            current: newBreakpoint,
            previous: this.previousBreakpoint,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
    
    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }
    
    /**
     * Get previous breakpoint
     */
    getPreviousBreakpoint() {
        return this.previousBreakpoint;
    }
    
    /**
     * Check if current viewport matches a specific breakpoint
     */
    isBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }
    
    /**
     * Check if current viewport is mobile
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }
    
    /**
     * Check if current viewport is tablet
     */
    isTablet() {
        return this.currentBreakpoint === 'tablet';
    }
    
    /**
     * Check if current viewport is desktop
     */
    isDesktop() {
        return this.currentBreakpoint === 'desktop';
    }
    
    /**
     * Check if current viewport is ultrawide
     */
    isUltrawide() {
        return this.currentBreakpoint === 'ultrawide';
    }
    
    /**
     * Check if current viewport is mobile or tablet (touch devices)
     */
    isTouchDevice() {
        return this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet';
    }
    
    /**
     * Check if current viewport is desktop or ultrawide (non-touch devices)
     */
    isDesktopDevice() {
        return this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'ultrawide';
    }
    
    /**
     * Get breakpoint-specific configuration
     */
    getBreakpointConfig(breakpoint = this.currentBreakpoint) {
        const configs = {
            mobile: {
                panels: {
                    left: { position: 'overlay', width: 280 },
                    right: { position: 'overlay', width: 280 },
                    controls: { position: 'bottom-fixed', compact: true }
                },
                canvas: { 
                    fullscreen: true,
                    minWidth: 320,
                    minHeight: 240
                },
                ui: {
                    compactMode: true,
                    touchOptimized: true,
                    showLabels: false
                }
            },
            tablet: {
                panels: {
                    left: { position: 'collapsible', width: 280 },
                    right: { position: 'collapsible', width: 280 },
                    controls: { position: 'floating', compact: false }
                },
                canvas: { 
                    optimized: true,
                    minWidth: 400,
                    minHeight: 300
                },
                ui: {
                    compactMode: false,
                    touchOptimized: true,
                    showLabels: true
                }
            },
            desktop: {
                panels: {
                    left: { position: 'visible', width: 280 },
                    right: { position: 'visible', width: 280 },
                    controls: { position: 'floating', compact: false }
                },
                canvas: { 
                    maximized: true,
                    minWidth: 600,
                    minHeight: 400
                },
                ui: {
                    compactMode: false,
                    touchOptimized: false,
                    showLabels: true
                }
            },
            ultrawide: {
                panels: {
                    left: { position: 'visible', width: 320 },
                    right: { position: 'visible', width: 320 },
                    controls: { position: 'floating', compact: false }
                },
                canvas: { 
                    maximized: true,
                    minWidth: 800,
                    minHeight: 500
                },
                ui: {
                    compactMode: false,
                    touchOptimized: false,
                    showLabels: true
                }
            }
        };
        
        return configs[breakpoint] || configs.desktop;
    }
    
    /**
     * Get viewport dimensions
     */
    getViewportDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            aspectRatio: window.innerWidth / window.innerHeight
        };
    }
    
    /**
     * Check if viewport has changed significantly
     */
    hasSignificantViewportChange(threshold = 50) {
        const current = this.getViewportDimensions();
        
        if (!this.lastViewportDimensions) {
            this.lastViewportDimensions = current;
            return true;
        }
        
        const widthDiff = Math.abs(current.width - this.lastViewportDimensions.width);
        const heightDiff = Math.abs(current.height - this.lastViewportDimensions.height);
        
        const hasChanged = widthDiff > threshold || heightDiff > threshold;
        
        if (hasChanged) {
            this.lastViewportDimensions = current;
        }
        
        return hasChanged;
    }
    
    /**
     * Add breakpoint change listener
     */
    addBreakpointChangeListener(callback) {
        this.breakpointChangeListeners.push(callback);
    }
    
    /**
     * Remove breakpoint change listener
     */
    removeBreakpointChangeListener(callback) {
        const index = this.breakpointChangeListeners.indexOf(callback);
        if (index > -1) {
            this.breakpointChangeListeners.splice(index, 1);
        }
    }
    
    /**
     * Notify breakpoint change listeners
     */
    notifyBreakpointChange(changeInfo) {
        this.breakpointChangeListeners.forEach(callback => {
            try {
                callback(changeInfo);
            } catch (error) {
                console.error('Error in breakpoint change listener:', error);
            }
        });
    }
    
    /**
     * Get CSS media query string for a breakpoint
     */
    getMediaQuery(breakpoint) {
        switch (breakpoint) {
            case 'mobile':
                return `(max-width: ${this.breakpoints.mobile - 1}px)`;
            case 'tablet':
                return `(min-width: ${this.breakpoints.mobile}px) and (max-width: ${this.breakpoints.tablet - 1}px)`;
            case 'desktop':
                return `(min-width: ${this.breakpoints.tablet}px) and (max-width: ${this.breakpoints.desktop - 1}px)`;
            case 'ultrawide':
                return `(min-width: ${this.breakpoints.desktop}px)`;
            default:
                return '';
        }
    }
    
    /**
     * Update breakpoint thresholds
     */
    updateBreakpoints(newBreakpoints) {
        this.breakpoints = { ...this.breakpoints, ...newBreakpoints };
        
        // Recreate media query listeners
        this.setupMediaQueryListeners();
        
        // Update current breakpoint
        this.updateCurrentBreakpoint();
        
        console.log('📱 Breakpoints updated:', this.breakpoints);
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            currentBreakpoint: this.currentBreakpoint,
            previousBreakpoint: this.previousBreakpoint,
            viewport: this.getViewportDimensions(),
            breakpoints: this.breakpoints,
            mediaQueries: Object.keys(this.mediaQueries).reduce((acc, key) => {
                acc[key] = this.mediaQueries[key].matches;
                return acc;
            }, {})
        };
    }
}

// Create and export singleton instance
export const responsiveBreakpoints = new ResponsiveBreakpointSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.responsiveBreakpoints = responsiveBreakpoints;
    console.log('🔧 Responsive Breakpoints available globally as window.responsiveBreakpoints');
}