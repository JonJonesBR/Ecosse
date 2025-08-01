/**
 * Canvas Sizing Integration - Task 5: Implement canvas sizing optimization
 * 
 * This module integrates the canvas sizing optimizer with the existing
 * planet renderer and layout systems.
 * 
 * Requirements addressed:
 * - 2.1: Canvas 3D occupies maximum available central area
 * - 2.2: Canvas expands when panels are hidden  
 * - 2.3: Canvas adjusts automatically when screen is resized
 */

import { canvasSizingOptimizer } from './canvasSizingOptimizer.js';
import { responsiveCanvasContainer } from '../responsive-canvas-container.js';

/**
 * Integration class for canvas sizing optimization
 */
export class CanvasSizingIntegration {
    constructor() {
        this.isInitialized = false;
        this.renderingComponents = null;
        this.canvasContainer = null;
        this.topPanel = null;
    }

    /**
     * Initialize canvas sizing integration
     * @param {Object} renderingComponents - Rendering components from planet renderer
     * @param {HTMLElement} canvasContainer - Canvas container element
     * @param {HTMLElement} topPanel - Top panel element (optional)
     */
    initialize(renderingComponents, canvasContainer, topPanel = null) {
        if (this.isInitialized) {
            console.warn('CanvasSizingIntegration already initialized');
            return false;
        }

        if (!renderingComponents || !canvasContainer) {
            console.error('CanvasSizingIntegration: Missing required parameters');
            return false;
        }

        this.renderingComponents = renderingComponents;
        this.canvasContainer = canvasContainer;
        this.topPanel = topPanel || document.getElementById('top-panel');

        // Initialize canvas sizing optimizer
        const optimizerSuccess = canvasSizingOptimizer.initialize({
            canvasContainer: this.canvasContainer,
            renderer: this.renderingComponents.renderer,
            camera: this.renderingComponents.camera,
            topPanel: this.topPanel
        });

        if (!optimizerSuccess) {
            console.error('Failed to initialize canvas sizing optimizer');
            return false;
        }

        // Set up integration with responsive canvas container if available
        this.setupResponsiveCanvasIntegration();

        // Set up event listeners for coordination
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('✅ CanvasSizingIntegration initialized');
        return true;
    }

    /**
     * Set up integration with responsive canvas container
     */
    setupResponsiveCanvasIntegration() {
        // Check if responsive canvas container is already initialized
        if (responsiveCanvasContainer.isInitialized) {
            console.log('🔗 Coordinating with existing responsive canvas container');
            
            // Disable auto-resize on responsive canvas container to avoid conflicts
            responsiveCanvasContainer.setAutoResize(false);
            
            // Use canvas sizing optimizer as the primary resize handler
            console.log('📐 Canvas sizing optimizer taking over resize handling');
        } else {
            console.log('📐 Canvas sizing optimizer operating independently');
        }
    }

    /**
     * Set up event listeners for system coordination
     */
    setupEventListeners() {
        // Listen for canvas size optimization events
        document.addEventListener('canvasSizeOptimized', (event) => {
            this.handleCanvasSizeOptimized(event.detail);
        });

        // Listen for panel toggle events
        document.addEventListener('panelToggle', (event) => {
            this.handlePanelToggle(event.detail);
        });

        // Listen for viewport changes
        document.addEventListener('viewportChanged', (event) => {
            this.handleViewportChange(event.detail);
        });

        // Listen for layout error recovery
        document.addEventListener('layoutErrorRecovery', (event) => {
            this.handleLayoutErrorRecovery(event.detail);
        });
    }

    /**
     * Handle canvas size optimization events
     * @param {Object} detail - Event detail
     */
    handleCanvasSizeOptimized(detail) {
        console.log(`🎯 Canvas optimized to ${detail.width}x${detail.height} with top panel offset: ${detail.topPanelHeight}px`);
        
        // Notify responsive canvas container if needed
        if (responsiveCanvasContainer.isInitialized) {
            // Update responsive canvas container's cached size
            responsiveCanvasContainer.lastKnownSize = {
                width: detail.width,
                height: detail.height
            };
        }

        // Dispatch integration event for other systems
        this.dispatchIntegrationEvent('canvasOptimized', detail);
    }

    /**
     * Handle panel toggle events
     * @param {Object} detail - Event detail
     */
    handlePanelToggle(detail) {
        console.log(`🎛️ Panel ${detail.panelId} ${detail.isOpen ? 'opened' : 'closed'}, optimizing canvas`);
        
        // Force canvas resize after panel state change
        setTimeout(() => {
            canvasSizingOptimizer.forceResize();
        }, 350); // Wait for panel animation to complete
    }

    /**
     * Handle viewport changes
     * @param {Object} detail - Event detail
     */
    handleViewportChange(detail) {
        console.log(`📱 Viewport changed from ${detail.from} to ${detail.to}, optimizing canvas`);
        
        // Update top panel reference in case it changed
        this.updateTopPanelReference();
        
        // Force canvas resize for new viewport
        setTimeout(() => {
            canvasSizingOptimizer.forceResize();
        }, 100);
    }

    /**
     * Handle layout error recovery
     * @param {Object} detail - Event detail
     */
    handleLayoutErrorRecovery(detail) {
        console.log('🔧 Layout error recovery triggered, reinitializing canvas sizing');
        
        // Reinitialize canvas sizing optimizer
        this.reinitialize();
    }

    /**
     * Update top panel reference
     */
    updateTopPanelReference() {
        const newTopPanel = document.getElementById('top-panel');
        if (newTopPanel !== this.topPanel) {
            this.topPanel = newTopPanel;
            
            // Update canvas sizing optimizer's top panel reference
            if (canvasSizingOptimizer.isInitialized) {
                canvasSizingOptimizer.topPanel = this.topPanel;
                canvasSizingOptimizer.updateTopPanelHeight();
            }
        }
    }

    /**
     * Dispatch integration event
     * @param {string} type - Event type
     * @param {Object} detail - Event detail
     */
    dispatchIntegrationEvent(type, detail) {
        const event = new CustomEvent('canvasSizingIntegration', {
            detail: {
                type,
                ...detail,
                timestamp: Date.now()
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Force canvas resize
     */
    forceResize() {
        if (canvasSizingOptimizer.isInitialized) {
            canvasSizingOptimizer.forceResize();
        }
    }

    /**
     * Get canvas sizing metrics
     * @returns {Object} Metrics object
     */
    getMetrics() {
        if (!canvasSizingOptimizer.isInitialized) {
            return { error: 'Canvas sizing optimizer not initialized' };
        }

        const optimizerMetrics = canvasSizingOptimizer.getMetrics();
        const responsiveMetrics = responsiveCanvasContainer.isInitialized ? 
            responsiveCanvasContainer.getMetrics() : null;

        return {
            optimizer: optimizerMetrics,
            responsive: responsiveMetrics,
            integration: {
                isInitialized: this.isInitialized,
                hasTopPanel: !!this.topPanel,
                topPanelHeight: canvasSizingOptimizer.topPanelHeight,
                coordinatingWithResponsive: responsiveCanvasContainer.isInitialized
            }
        };
    }

    /**
     * Reinitialize the integration
     */
    reinitialize() {
        if (!this.isInitialized) {
            console.warn('Cannot reinitialize: integration not previously initialized');
            return false;
        }

        console.log('🔄 Reinitializing canvas sizing integration');

        // Dispose current optimizer
        canvasSizingOptimizer.dispose();

        // Reinitialize
        const success = canvasSizingOptimizer.initialize({
            canvasContainer: this.canvasContainer,
            renderer: this.renderingComponents.renderer,
            camera: this.renderingComponents.camera,
            topPanel: this.topPanel
        });

        if (success) {
            console.log('✅ Canvas sizing integration reinitialized successfully');
        } else {
            console.error('❌ Failed to reinitialize canvas sizing integration');
        }

        return success;
    }

    /**
     * Check if canvas is optimally sized
     * @returns {boolean} True if canvas is optimally sized
     */
    isOptimallySized() {
        return canvasSizingOptimizer.isInitialized && canvasSizingOptimizer.isOptimallySized();
    }

    /**
     * Set minimum canvas size
     * @param {Object} minSize - Minimum size {width, height}
     */
    setMinimumSize(minSize) {
        if (canvasSizingOptimizer.isInitialized) {
            canvasSizingOptimizer.setMinimumSize(minSize);
        }
    }

    /**
     * Set maximum canvas size
     * @param {Object} maxSize - Maximum size {width, height}
     */
    setMaximumSize(maxSize) {
        if (canvasSizingOptimizer.isInitialized) {
            canvasSizingOptimizer.setMaximumSize(maxSize);
        }
    }

    /**
     * Dispose of the integration
     */
    dispose() {
        if (canvasSizingOptimizer.isInitialized) {
            canvasSizingOptimizer.dispose();
        }

        // Re-enable responsive canvas container auto-resize if it was disabled
        if (responsiveCanvasContainer.isInitialized) {
            responsiveCanvasContainer.setAutoResize(true);
        }

        this.renderingComponents = null;
        this.canvasContainer = null;
        this.topPanel = null;
        this.isInitialized = false;

        console.log('CanvasSizingIntegration disposed');
    }
}

// Create and export singleton instance
export const canvasSizingIntegration = new CanvasSizingIntegration();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.canvasSizingIntegration = canvasSizingIntegration;
    console.log('🔧 CanvasSizingIntegration available globally');
}