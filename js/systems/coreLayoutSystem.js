/**
 * Core Layout System Integration
 * Integrates LayoutManager, ResponsiveBreakpoints, and ViewportMonitor
 * Requirements: 1.1, 1.2, 5.1, 5.2
 */

import { layoutManager } from './layoutManager.js';
import { responsiveBreakpoints } from './responsiveBreakpoints.js';
import { viewportMonitor } from './viewportMonitor.js';

class CoreLayoutSystem {
    constructor() {
        this.isInitialized = false;
        this.systems = {
            layoutManager,
            responsiveBreakpoints,
            viewportMonitor
        };
        
        // Integration state
        this.currentLayout = null;
        this.isUpdating = false;
        
        // Performance tracking
        this.updateCount = 0;
        this.lastUpdateTime = 0;
    }
    
    /**
     * Initialize the core layout system
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Core Layout System already initialized');
            return;
        }
        
        console.log('🚀 Initializing Core Layout System...');
        
        try {
            // Set up system integrations
            this.setupSystemIntegrations();
            
            // Apply initial layout
            this.applyInitialLayout();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Core Layout System initialized successfully');
            
            // Emit initialization event
            this.emitEvent('layout:initialized', {
                timestamp: Date.now(),
                systems: Object.keys(this.systems)
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Core Layout System:', error);
            throw error;
        }
    }
    
    /**
     * Set up integrations between different systems
     */
    setupSystemIntegrations() {
        console.log('🔗 Setting up system integrations...');
        
        // Viewport Monitor → Responsive Breakpoints
        viewportMonitor.addViewportChangeListener((changeInfo) => {
            responsiveBreakpoints.updateCurrentBreakpoint();
        });
        
        // Responsive Breakpoints → Layout Manager
        responsiveBreakpoints.addBreakpointChangeListener((changeInfo) => {
            this.handleBreakpointChange(changeInfo);
        });
        
        // Viewport Monitor → Layout Manager
        viewportMonitor.addViewportChangeListener((changeInfo) => {
            this.handleViewportChange(changeInfo);
        });
        
        // Layout Manager → Canvas Resize
        layoutManager.addResizeListener((width, height) => {
            this.handleCanvasResize(width, height);
        });
        
        // Orientation changes
        viewportMonitor.addOrientationChangeListener((changeInfo) => {
            this.handleOrientationChange(changeInfo);
        });
        
        console.log('✅ System integrations set up');
    }
    
    /**
     * Apply initial layout based on current viewport
     */
    applyInitialLayout() {
        console.log('🎨 Applying initial layout...');
        
        const viewport = viewportMonitor.getViewportDimensions();
        const breakpoint = responsiveBreakpoints.getCurrentBreakpoint();
        
        console.log(`📐 Initial layout: ${viewport.width}x${viewport.height} (${breakpoint})`);
        
        // Force layout update
        layoutManager.updateLayout();
        
        this.currentLayout = {
            viewport,
            breakpoint,
            timestamp: Date.now()
        };
    }
    
    /**
     * Handle breakpoint changes
     */
    handleBreakpointChange(changeInfo) {
        if (this.isUpdating) return;
        
        console.log('📱 Handling breakpoint change:', changeInfo);
        
        this.isUpdating = true;
        
        try {
            // Get breakpoint-specific configuration
            const config = responsiveBreakpoints.getBreakpointConfig(changeInfo.current);
            
            // Update layout manager configuration
            layoutManager.updateLayoutConfig(config);
            
            // Apply layout changes
            layoutManager.updateLayout();
            
            // Update current layout state
            this.currentLayout = {
                ...this.currentLayout,
                breakpoint: changeInfo.current,
                config,
                timestamp: Date.now()
            };
            
            // Emit breakpoint change event
            this.emitEvent('layout:breakpointChanged', {
                ...changeInfo,
                config,
                layout: this.currentLayout
            });
            
        } catch (error) {
            console.error('❌ Error handling breakpoint change:', error);
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * Handle viewport changes
     */
    handleViewportChange(changeInfo) {
        if (this.isUpdating) return;
        
        console.log('👁️ Handling viewport change:', changeInfo);
        
        this.isUpdating = true;
        
        try {
            // Update layout manager viewport
            layoutManager.updateViewportSize();
            
            // Update current layout state
            this.currentLayout = {
                ...this.currentLayout,
                viewport: changeInfo.current,
                timestamp: Date.now()
            };
            
            // Emit viewport change event
            this.emitEvent('layout:viewportChanged', {
                ...changeInfo,
                layout: this.currentLayout
            });
            
        } catch (error) {
            console.error('❌ Error handling viewport change:', error);
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * Handle canvas resize events
     */
    handleCanvasResize(width, height) {
        console.log(`🎨 Canvas resized: ${width}x${height}`);
        
        // Notify Three.js renderer if available
        if (window.onWindowResize && typeof window.onWindowResize === 'function') {
            try {
                window.onWindowResize();
            } catch (error) {
                console.warn('⚠️ Error calling onWindowResize:', error);
            }
        }
        
        // Emit canvas resize event
        this.emitEvent('layout:canvasResized', {
            width,
            height,
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle orientation changes
     */
    handleOrientationChange(changeInfo) {
        console.log('📱 Handling orientation change:', changeInfo);
        
        // Small delay to allow orientation change to complete
        setTimeout(() => {
            // Force layout update after orientation change
            layoutManager.updateLayout();
            
            // Emit orientation change event
            this.emitEvent('layout:orientationChanged', {
                ...changeInfo,
                layout: this.currentLayout
            });
        }, 200);
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Track layout update frequency
        const originalUpdateLayout = layoutManager.updateLayout.bind(layoutManager);
        
        layoutManager.updateLayout = () => {
            const startTime = performance.now();
            
            originalUpdateLayout();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.updateCount++;
            this.lastUpdateTime = endTime;
            
            if (duration > 16) { // More than one frame at 60fps
                console.warn(`⚠️ Slow layout update: ${duration.toFixed(2)}ms`);
            }
            
            // Emit performance event
            this.emitEvent('layout:performanceUpdate', {
                duration,
                updateCount: this.updateCount,
                timestamp: endTime
            });
        };
    }
    
    /**
     * Get current layout state
     */
    getCurrentLayout() {
        return {
            ...this.currentLayout,
            systems: {
                viewport: viewportMonitor.getViewportDimensions(),
                breakpoint: responsiveBreakpoints.getCurrentBreakpoint(),
                layoutInfo: layoutManager.getLayoutInfo()
            }
        };
    }
    
    /**
     * Optimize layout for planet rendering
     */
    optimizeForPlanetRendering() {
        console.log('🚀 Optimizing layout for planet rendering...');
        
        const restoreFunction = layoutManager.optimizeForPlanetRendering();
        
        // Emit optimization event
        this.emitEvent('layout:optimized', {
            type: 'planet-rendering',
            timestamp: Date.now()
        });
        
        return () => {
            restoreFunction();
            
            // Emit restoration event
            this.emitEvent('layout:restored', {
                type: 'planet-rendering',
                timestamp: Date.now()
            });
        };
    }
    
    /**
     * Toggle panel visibility
     */
    togglePanel(panelName) {
        layoutManager.togglePanel(panelName);
        
        // Emit panel toggle event
        this.emitEvent('layout:panelToggled', {
            panel: panelName,
            state: layoutManager.panelStates[panelName],
            timestamp: Date.now()
        });
    }
    
    /**
     * Force layout update
     */
    forceUpdate() {
        console.log('🔄 Forcing layout update...');
        
        viewportMonitor.forceUpdate();
        responsiveBreakpoints.updateCurrentBreakpoint();
        layoutManager.updateLayout();
        
        // Emit force update event
        this.emitEvent('layout:forceUpdated', {
            timestamp: Date.now()
        });
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime,
            averageUpdateTime: this.lastUpdateTime / this.updateCount,
            isUpdating: this.isUpdating
        };
    }
    
    /**
     * Get debug information from all systems
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentLayout: this.currentLayout,
            performance: this.getPerformanceMetrics(),
            systems: {
                layoutManager: layoutManager.getLayoutInfo(),
                responsiveBreakpoints: responsiveBreakpoints.getDebugInfo(),
                viewportMonitor: viewportMonitor.getDebugInfo()
            }
        };
    }
    
    /**
     * Emit custom events
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * Add event listener for layout events
     */
    addEventListener(eventName, callback) {
        window.addEventListener(eventName, callback);
    }
    
    /**
     * Remove event listener for layout events
     */
    removeEventListener(eventName, callback) {
        window.removeEventListener(eventName, callback);
    }
    
    /**
     * Destroy the layout system
     */
    destroy() {
        console.log('🗑️ Destroying Core Layout System...');
        
        // Clean up event listeners
        // (Individual systems handle their own cleanup)
        
        this.isInitialized = false;
        
        // Emit destruction event
        this.emitEvent('layout:destroyed', {
            timestamp: Date.now()
        });
    }
}

// Create and export singleton instance
export const coreLayoutSystem = new CoreLayoutSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.coreLayoutSystem = coreLayoutSystem;
    console.log('🔧 Core Layout System available globally as window.coreLayoutSystem');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        coreLayoutSystem.initialize();
    });
} else {
    // DOM is already ready
    coreLayoutSystem.initialize();
}