/**
 * Viewport Size Monitoring System
 * Handles automatic layout updates when viewport changes
 * Requirements: 1.1, 1.2, 5.1, 5.2
 */

class ViewportMonitor {
    constructor() {
        this.currentViewport = {
            width: 0,
            height: 0,
            aspectRatio: 0
        };
        
        this.previousViewport = null;
        
        // Monitoring configuration
        this.config = {
            debounceDelay: 150, // ms
            significantChangeThreshold: 50, // pixels
            aspectRatioChangeThreshold: 0.1
        };
        
        // Event listeners
        this.viewportChangeListeners = [];
        this.orientationChangeListeners = [];
        
        // Debounce timer
        this.debounceTimer = null;
        
        // Orientation tracking
        this.currentOrientation = this.getOrientation();
        
        this.init();
    }
    
    init() {
        console.log('👁️ Initializing Viewport Monitor...');
        
        // Set initial viewport
        this.updateViewport();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log(`✅ Viewport Monitor initialized - ${this.currentViewport.width}x${this.currentViewport.height}`);
    }
    
    /**
     * Set up viewport monitoring event listeners
     */
    setupEventListeners() {
        // Window resize listener with debouncing
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Orientation change listener
        window.addEventListener('orientationchange', () => {
            // Small delay to allow orientation change to complete
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Visual viewport API support (for mobile browsers)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleVisualViewportResize();
            });
        }
        
        // Page visibility change (to handle tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Re-check viewport when tab becomes visible
                this.updateViewport();
            }
        });
    }
    
    /**
     * Handle window resize with debouncing
     */
    handleResize() {
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            this.updateViewport();
        }, this.config.debounceDelay);
    }
    
    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        const newOrientation = this.getOrientation();
        
        if (newOrientation !== this.currentOrientation) {
            console.log(`📱 Orientation changed: ${this.currentOrientation} → ${newOrientation}`);
            
            const previousOrientation = this.currentOrientation;
            this.currentOrientation = newOrientation;
            
            // Update viewport after orientation change
            this.updateViewport();
            
            // Notify orientation change listeners
            this.notifyOrientationChange({
                current: newOrientation,
                previous: previousOrientation,
                viewport: this.currentViewport
            });
        }
    }
    
    /**
     * Handle visual viewport resize (mobile browsers)
     */
    handleVisualViewportResize() {
        if (window.visualViewport) {
            const visualViewport = {
                width: window.visualViewport.width,
                height: window.visualViewport.height,
                scale: window.visualViewport.scale
            };
            
            console.log('📱 Visual viewport changed:', visualViewport);
            
            // Update viewport with visual viewport data
            this.updateViewport(visualViewport);
        }
    }
    
    /**
     * Update viewport dimensions and notify listeners if changed significantly
     */
    updateViewport(visualViewport = null) {
        this.previousViewport = { ...this.currentViewport };
        
        // Use visual viewport if available (mobile), otherwise use window dimensions
        const width = visualViewport ? visualViewport.width : window.innerWidth;
        const height = visualViewport ? visualViewport.height : window.innerHeight;
        
        this.currentViewport = {
            width: width,
            height: height,
            aspectRatio: width / height,
            scale: visualViewport ? visualViewport.scale : 1,
            orientation: this.getOrientation(),
            devicePixelRatio: window.devicePixelRatio || 1
        };
        
        // Check if change is significant
        if (this.hasSignificantChange()) {
            console.log(`👁️ Significant viewport change detected: ${this.currentViewport.width}x${this.currentViewport.height}`);
            
            this.notifyViewportChange({
                current: this.currentViewport,
                previous: this.previousViewport,
                change: this.getChangeInfo()
            });
        }
    }
    
    /**
     * Check if viewport change is significant enough to trigger updates
     */
    hasSignificantChange() {
        if (!this.previousViewport) return true;
        
        const widthDiff = Math.abs(this.currentViewport.width - this.previousViewport.width);
        const heightDiff = Math.abs(this.currentViewport.height - this.previousViewport.height);
        const aspectRatioDiff = Math.abs(this.currentViewport.aspectRatio - this.previousViewport.aspectRatio);
        
        return (
            widthDiff >= this.config.significantChangeThreshold ||
            heightDiff >= this.config.significantChangeThreshold ||
            aspectRatioDiff >= this.config.aspectRatioChangeThreshold
        );
    }
    
    /**
     * Get information about the viewport change
     */
    getChangeInfo() {
        if (!this.previousViewport) return null;
        
        return {
            widthChange: this.currentViewport.width - this.previousViewport.width,
            heightChange: this.currentViewport.height - this.previousViewport.height,
            aspectRatioChange: this.currentViewport.aspectRatio - this.previousViewport.aspectRatio,
            orientationChanged: this.currentViewport.orientation !== this.previousViewport.orientation
        };
    }
    
    /**
     * Get current device orientation
     */
    getOrientation() {
        if (window.screen && window.screen.orientation) {
            return window.screen.orientation.type;
        } else if (window.orientation !== undefined) {
            // Fallback for older browsers
            const angle = window.orientation;
            if (angle === 0 || angle === 180) {
                return 'portrait-primary';
            } else {
                return 'landscape-primary';
            }
        } else {
            // Determine from aspect ratio
            return this.currentViewport.width > this.currentViewport.height ? 'landscape-primary' : 'portrait-primary';
        }
    }
    
    /**
     * Check if device is in portrait orientation
     */
    isPortrait() {
        return this.currentOrientation.includes('portrait');
    }
    
    /**
     * Check if device is in landscape orientation
     */
    isLandscape() {
        return this.currentOrientation.includes('landscape');
    }
    
    /**
     * Get current viewport dimensions
     */
    getViewportDimensions() {
        return { ...this.currentViewport };
    }
    
    /**
     * Get available space for content (excluding browser UI)
     */
    getAvailableSpace() {
        // Account for browser UI elements
        const browserUIHeight = this.estimateBrowserUIHeight();
        
        return {
            width: this.currentViewport.width,
            height: this.currentViewport.height - browserUIHeight,
            aspectRatio: this.currentViewport.width / (this.currentViewport.height - browserUIHeight)
        };
    }
    
    /**
     * Estimate browser UI height (address bar, etc.)
     */
    estimateBrowserUIHeight() {
        // This is an approximation - actual values vary by browser and device
        if (this.isMobileDevice()) {
            return 60; // Typical mobile browser UI
        }
        return 0; // Desktop browsers typically don't reduce viewport
    }
    
    /**
     * Check if device is mobile based on viewport and user agent
     */
    isMobileDevice() {
        return (
            this.currentViewport.width <= 768 ||
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
    }
    
    /**
     * Check if device is tablet based on viewport
     */
    isTabletDevice() {
        return (
            this.currentViewport.width > 768 && 
            this.currentViewport.width <= 1024 &&
            ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        );
    }
    
    /**
     * Get viewport category
     */
    getViewportCategory() {
        if (this.isMobileDevice()) return 'mobile';
        if (this.isTabletDevice()) return 'tablet';
        return 'desktop';
    }
    
    /**
     * Add viewport change listener
     */
    addViewportChangeListener(callback) {
        this.viewportChangeListeners.push(callback);
    }
    
    /**
     * Remove viewport change listener
     */
    removeViewportChangeListener(callback) {
        const index = this.viewportChangeListeners.indexOf(callback);
        if (index > -1) {
            this.viewportChangeListeners.splice(index, 1);
        }
    }
    
    /**
     * Add orientation change listener
     */
    addOrientationChangeListener(callback) {
        this.orientationChangeListeners.push(callback);
    }
    
    /**
     * Remove orientation change listener
     */
    removeOrientationChangeListener(callback) {
        const index = this.orientationChangeListeners.indexOf(callback);
        if (index > -1) {
            this.orientationChangeListeners.splice(index, 1);
        }
    }
    
    /**
     * Notify viewport change listeners
     */
    notifyViewportChange(changeInfo) {
        this.viewportChangeListeners.forEach(callback => {
            try {
                callback(changeInfo);
            } catch (error) {
                console.error('Error in viewport change listener:', error);
            }
        });
    }
    
    /**
     * Notify orientation change listeners
     */
    notifyOrientationChange(changeInfo) {
        this.orientationChangeListeners.forEach(callback => {
            try {
                callback(changeInfo);
            } catch (error) {
                console.error('Error in orientation change listener:', error);
            }
        });
    }
    
    /**
     * Force viewport update (useful for manual triggers)
     */
    forceUpdate() {
        console.log('👁️ Forcing viewport update...');
        this.updateViewport();
    }
    
    /**
     * Update monitoring configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('👁️ Viewport monitor config updated:', this.config);
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            current: this.currentViewport,
            previous: this.previousViewport,
            orientation: this.currentOrientation,
            config: this.config,
            category: this.getViewportCategory(),
            availableSpace: this.getAvailableSpace(),
            changeInfo: this.getChangeInfo()
        };
    }
}

// Create and export singleton instance
export const viewportMonitor = new ViewportMonitor();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.viewportMonitor = viewportMonitor;
    console.log('🔧 Viewport Monitor available globally as window.viewportMonitor');
}