/**
 * Layout Error Handler - Task 12: Add error handling and fallbacks
 * 
 * This class provides graceful degradation for layout calculation failures,
 * fallback layouts for unsupported screen sizes, and error recovery mechanisms.
 * 
 * Requirements addressed:
 * - 1.1: Planet rendering without UI obstruction (fallback layouts)
 * - 5.1: Layout reorganizes for smaller screens (error recovery)
 * - 5.2: Responsive layout handling (graceful degradation)
 */

export class LayoutErrorHandler {
    constructor() {
        this.fallbackApplied = false;
        this.errorCount = 0;
        this.maxErrors = 5;
        this.fallbackLayouts = new Map();
        this.lastKnownGoodState = null;
        
        this.setupFallbackLayouts();
    }

    /**
     * Set up fallback layout configurations
     */
    setupFallbackLayouts() {
        // Safe mobile fallback
        this.fallbackLayouts.set('mobile', {
            appContainer: {
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden'
            },
            mainContent: {
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '0'
            },
            canvasContainer: {
                flex: '1',
                position: 'relative',
                minHeight: '200px'
            },
            bottomPanel: {
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                maxHeight: '40vh',
                zIndex: '30'
            },
            sidePanels: {
                display: 'none' // Hide side panels on mobile fallback
            }
        });

        // Safe desktop fallback
        this.fallbackLayouts.set('desktop', {
            appContainer: {
                display: 'flex',
                flexDirection: 'row',
                height: '100vh',
                overflow: 'hidden'
            },
            mainContent: {
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '0'
            },
            canvasContainer: {
                flex: '1',
                position: 'relative',
                minHeight: '300px'
            },
            bottomPanel: {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                maxHeight: '60vh',
                zIndex: '30'
            },
            sidePanels: {
                width: '280px',
                flexShrink: '0'
            }
        });

        // Ultra-safe minimal fallback
        this.fallbackLayouts.set('minimal', {
            appContainer: {
                display: 'block',
                height: '100vh',
                overflow: 'auto'
            },
            mainContent: {
                display: 'block',
                height: '70vh',
                position: 'relative'
            },
            canvasContainer: {
                display: 'block',
                height: '100%',
                position: 'relative'
            },
            bottomPanel: {
                position: 'relative',
                bottom: 'auto',
                left: 'auto',
                transform: 'none',
                maxHeight: 'none',
                zIndex: 'auto'
            },
            sidePanels: {
                display: 'block',
                width: 'auto',
                position: 'relative'
            }
        });
    }

    /**
     * Handle layout resize errors
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     */
    handleResizeError(error, context = 'unknown') {
        console.warn(`Layout resize failed in ${context}:`, error);
        this.errorCount++;
        
        if (this.errorCount >= this.maxErrors) {
            console.error('Too many layout errors, applying fallback layout');
            this.applyFallbackLayout();
            return;
        }
        
        // Try to recover with last known good state
        if (this.lastKnownGoodState) {
            try {
                this.restoreLastKnownGoodState();
                console.log('✅ Restored last known good layout state');
            } catch (restoreError) {
                console.error('Failed to restore last known good state:', restoreError);
                this.applyFallbackLayout();
            }
        } else {
            this.applyFallbackLayout();
        }
    }

    /**
     * Handle canvas resize errors
     * @param {Error} error - The error that occurred
     */
    handleCanvasResizeError(error) {
        console.error('Canvas resize failed:', error);
        
        // Maintain minimum viable canvas size
        this.setMinimumCanvasSize();
        
        // Notify other systems about canvas issues
        this.dispatchCanvasErrorEvent(error);
    }

    /**
     * Set minimum viable canvas size
     */
    setMinimumCanvasSize() {
        const canvasContainer = document.getElementById('three-js-canvas-container');
        if (!canvasContainer) return;
        
        try {
            // Apply safe minimum dimensions
            canvasContainer.style.minWidth = '320px';
            canvasContainer.style.minHeight = '240px';
            canvasContainer.style.width = '100%';
            canvasContainer.style.height = '100%';
            canvasContainer.style.position = 'relative';
            
            console.log('✅ Applied minimum canvas size fallback');
        } catch (error) {
            console.error('Failed to set minimum canvas size:', error);
        }
    }

    /**
     * Apply fallback layout based on current viewport
     */
    applyFallbackLayout() {
        if (this.fallbackApplied) {
            console.warn('Fallback layout already applied');
            return;
        }
        
        const viewport = this.detectViewportType();
        let fallbackConfig = this.fallbackLayouts.get(viewport);
        
        // If viewport-specific fallback fails, use minimal fallback
        if (!fallbackConfig) {
            fallbackConfig = this.fallbackLayouts.get('minimal');
        }
        
        try {
            this.applyLayoutConfig(fallbackConfig);
            this.fallbackApplied = true;
            console.log(`✅ Applied ${viewport} fallback layout`);
            
            // Dispatch fallback event
            this.dispatchFallbackEvent(viewport);
            
        } catch (error) {
            console.error('Failed to apply fallback layout:', error);
            this.applyMinimalFallback();
        }
    }

    /**
     * Apply layout configuration to DOM elements
     * @param {Object} config - Layout configuration
     */
    applyLayoutConfig(config) {
        // Apply app container styles
        const appContainer = document.getElementById('app-container');
        if (appContainer && config.appContainer) {
            Object.assign(appContainer.style, config.appContainer);
        }

        // Apply main content styles
        const mainContent = document.getElementById('main-content');
        if (mainContent && config.mainContent) {
            Object.assign(mainContent.style, config.mainContent);
        }

        // Apply canvas container styles
        const canvasContainer = document.getElementById('three-js-canvas-container');
        if (canvasContainer && config.canvasContainer) {
            Object.assign(canvasContainer.style, config.canvasContainer);
        }

        // Apply bottom panel styles
        const bottomPanel = document.getElementById('bottom-panel');
        if (bottomPanel && config.bottomPanel) {
            Object.assign(bottomPanel.style, config.bottomPanel);
        }

        // Apply side panel styles
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        if (config.sidePanels) {
            [leftPanel, rightPanel].forEach(panel => {
                if (panel) {
                    Object.assign(panel.style, config.sidePanels);
                }
            });
        }
    }

    /**
     * Apply minimal fallback when all else fails
     */
    applyMinimalFallback() {
        try {
            const minimalConfig = this.fallbackLayouts.get('minimal');
            this.applyLayoutConfig(minimalConfig);
            
            // Force canvas to be visible
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (canvasContainer) {
                canvasContainer.style.display = 'block';
                canvasContainer.style.visibility = 'visible';
            }
            
            console.log('✅ Applied minimal fallback layout');
            this.fallbackApplied = true;
            
        } catch (error) {
            console.error('Critical: Even minimal fallback failed:', error);
            // Last resort: show error message to user
            this.showCriticalErrorMessage();
        }
    }

    /**
     * Detect current viewport type
     * @returns {string} Viewport type
     */
    detectViewportType() {
        const width = window.innerWidth;
        
        if (width <= 768) {
            return 'mobile';
        } else if (width <= 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Save current layout state as last known good
     */
    saveLastKnownGoodState() {
        try {
            const appContainer = document.getElementById('app-container');
            const mainContent = document.getElementById('main-content');
            const canvasContainer = document.getElementById('three-js-canvas-container');
            
            this.lastKnownGoodState = {
                appContainer: appContainer ? this.getElementStyles(appContainer) : null,
                mainContent: mainContent ? this.getElementStyles(mainContent) : null,
                canvasContainer: canvasContainer ? this.getElementStyles(canvasContainer) : null,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.warn('Failed to save last known good state:', error);
        }
    }

    /**
     * Get computed styles for an element
     * @param {HTMLElement} element - Element to get styles from
     * @returns {Object} Style object
     */
    getElementStyles(element) {
        const computed = window.getComputedStyle(element);
        return {
            display: computed.display,
            flexDirection: computed.flexDirection,
            flex: computed.flex,
            position: computed.position,
            width: computed.width,
            height: computed.height,
            minWidth: computed.minWidth,
            minHeight: computed.minHeight
        };
    }

    /**
     * Restore last known good state
     */
    restoreLastKnownGoodState() {
        if (!this.lastKnownGoodState) {
            throw new Error('No last known good state available');
        }
        
        const { appContainer, mainContent, canvasContainer } = this.lastKnownGoodState;
        
        if (appContainer) {
            const appEl = document.getElementById('app-container');
            if (appEl) Object.assign(appEl.style, appContainer);
        }
        
        if (mainContent) {
            const mainEl = document.getElementById('main-content');
            if (mainEl) Object.assign(mainEl.style, mainContent);
        }
        
        if (canvasContainer) {
            const canvasEl = document.getElementById('three-js-canvas-container');
            if (canvasEl) Object.assign(canvasEl.style, canvasContainer);
        }
    }

    /**
     * Handle breakpoint errors
     * @param {string} breakpoint - Breakpoint that failed
     * @param {Error} error - The error that occurred
     */
    handleBreakpointError(breakpoint, error) {
        console.warn(`Breakpoint ${breakpoint} failed:`, error);
        
        // Use previous working breakpoint configuration
        const fallbackBreakpoint = this.getFallbackBreakpoint(breakpoint);
        
        try {
            // Apply fallback breakpoint layout
            const fallbackConfig = this.fallbackLayouts.get(fallbackBreakpoint);
            if (fallbackConfig) {
                this.applyLayoutConfig(fallbackConfig);
                console.log(`✅ Applied fallback breakpoint: ${fallbackBreakpoint}`);
            }
        } catch (fallbackError) {
            console.error('Fallback breakpoint also failed:', fallbackError);
            this.applyFallbackLayout();
        }
    }

    /**
     * Get fallback breakpoint for failed breakpoint
     * @param {string} breakpoint - Failed breakpoint
     * @returns {string} Fallback breakpoint
     */
    getFallbackBreakpoint(breakpoint) {
        const fallbackMap = {
            'mobile': 'minimal',
            'tablet': 'mobile',
            'desktop': 'desktop'
        };
        
        return fallbackMap[breakpoint] || 'minimal';
    }

    /**
     * Validate layout configuration
     * @param {Object} config - Layout configuration to validate
     * @returns {boolean} True if valid
     */
    validateLayoutConfiguration(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        // Check required properties
        const requiredSections = ['appContainer', 'mainContent', 'canvasContainer'];
        
        for (const section of requiredSections) {
            if (!config[section] || typeof config[section] !== 'object') {
                console.warn(`Invalid layout config: missing ${section}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Show critical error message to user
     */
    showCriticalErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'critical-layout-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc2626;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            text-align: center;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;
        
        errorDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">Layout Error</h3>
            <p style="margin: 0 0 15px 0;">The interface layout has encountered a critical error.</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #dc2626;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            ">Reload Page</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Dispatch canvas error event
     * @param {Error} error - The error that occurred
     */
    dispatchCanvasErrorEvent(error) {
        const event = new CustomEvent('canvasError', {
            detail: {
                error: error.message,
                timestamp: Date.now(),
                fallbackApplied: this.fallbackApplied
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Dispatch fallback event
     * @param {string} viewport - Viewport type for fallback
     */
    dispatchFallbackEvent(viewport) {
        const event = new CustomEvent('layoutFallbackApplied', {
            detail: {
                viewport,
                timestamp: Date.now(),
                errorCount: this.errorCount
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Reset error handler state
     */
    reset() {
        this.fallbackApplied = false;
        this.errorCount = 0;
        this.lastKnownGoodState = null;
        
        // Remove critical error message if present
        const errorDiv = document.getElementById('critical-layout-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        console.log('Layout error handler reset');
    }

    /**
     * Get error handler status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            fallbackApplied: this.fallbackApplied,
            errorCount: this.errorCount,
            hasLastKnownGoodState: !!this.lastKnownGoodState,
            maxErrors: this.maxErrors
        };
    }
}

// Create and export singleton instance
export const layoutErrorHandler = new LayoutErrorHandler();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutErrorHandler = layoutErrorHandler;
    console.log('🔧 Layout Error Handler available globally');
}