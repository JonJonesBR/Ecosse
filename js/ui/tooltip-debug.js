/**
 * Tooltip Debug Utilities
 * Utilities for debugging and testing tooltip functionality
 */

export class TooltipDebugger {
    constructor() {
        this.debugMode = false;
    }

    /**
     * Enable debug mode for tooltips
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log('Tooltip debug mode enabled');
        
        // Add visual indicators for elements with tooltips
        this.highlightTooltipElements();
        
        // Log tooltip events
        this.logTooltipEvents();
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.debugMode = false;
        console.log('Tooltip debug mode disabled');
        
        // Remove visual indicators
        this.removeTooltipHighlights();
    }

    /**
     * Highlight all elements with data-tooltip attribute
     */
    highlightTooltipElements() {
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(element => {
            element.style.outline = '2px dashed #6366f1';
            element.style.outlineOffset = '2px';
            element.setAttribute('data-tooltip-debug', 'true');
        });
        
        console.log(`Found ${elements.length} elements with tooltips`);
    }

    /**
     * Remove tooltip highlights
     */
    removeTooltipHighlights() {
        const elements = document.querySelectorAll('[data-tooltip-debug]');
        elements.forEach(element => {
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.removeAttribute('data-tooltip-debug');
        });
    }

    /**
     * Log tooltip events for debugging
     */
    logTooltipEvents() {
        if (!this.debugMode) return;
        
        const originalShow = window.feedbackSystem.showTooltip.bind(window.feedbackSystem);
        const originalHide = window.feedbackSystem.hideTooltip.bind(window.feedbackSystem);
        
        window.feedbackSystem.showTooltip = (element, options) => {
            console.log('🔍 Showing tooltip for:', element, options);
            return originalShow(element, options);
        };
        
        window.feedbackSystem.hideTooltip = (element) => {
            console.log('❌ Hiding tooltip for:', element);
            return originalHide(element);
        };
    }

    /**
     * Test tooltip functionality
     */
    testTooltips() {
        console.log('🧪 Testing tooltip functionality...');
        
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        if (tooltipElements.length === 0) {
            console.warn('No elements with data-tooltip found');
            return;
        }
        
        console.log(`Found ${tooltipElements.length} tooltip elements`);
        
        // Test each tooltip
        tooltipElements.forEach((element, index) => {
            setTimeout(() => {
                console.log(`Testing tooltip ${index + 1}/${tooltipElements.length}`);
                
                // Simulate mouseover
                const mouseOverEvent = new MouseEvent('mouseover', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                element.dispatchEvent(mouseOverEvent);
                
                // Wait and then simulate mouseout
                setTimeout(() => {
                    const mouseOutEvent = new MouseEvent('mouseout', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        relatedTarget: document.body
                    });
                    element.dispatchEvent(mouseOutEvent);
                }, 1000);
                
            }, index * 1500);
        });
    }

    /**
     * Force clear all tooltips
     */
    clearAllTooltips() {
        if (window.feedbackSystem && window.feedbackSystem.clearAllTooltips) {
            window.feedbackSystem.clearAllTooltips();
            console.log('✅ All tooltips cleared');
        } else {
            console.error('FeedbackSystem not available');
        }
    }

    /**
     * Get tooltip statistics
     */
    getTooltipStats() {
        const stats = {
            totalElements: document.querySelectorAll('[data-tooltip]').length,
            activeTooltips: 0,
            tooltipContainer: null
        };
        
        if (window.feedbackSystem) {
            stats.activeTooltips = window.feedbackSystem.tooltips.size;
            stats.tooltipContainer = document.getElementById('tooltip-container');
        }
        
        console.table(stats);
        return stats;
    }

    /**
     * Fix common tooltip issues
     */
    fixTooltipIssues() {
        console.log('🔧 Attempting to fix tooltip issues...');
        
        // Clear all active tooltips
        this.clearAllTooltips();
        
        // Remove orphaned tooltip elements
        const orphanedTooltips = document.querySelectorAll('.enhanced-tooltip');
        orphanedTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        
        // Clean up tooltip IDs from elements
        document.querySelectorAll('[data-tooltip-id]').forEach(element => {
            delete element.dataset.tooltipId;
        });
        
        console.log('✅ Tooltip cleanup completed');
    }
}

// Create singleton instance
export const tooltipDebugger = new TooltipDebugger();

// Make it globally available for console debugging
if (typeof window !== 'undefined') {
    window.tooltipDebugger = tooltipDebugger;
}

// Console commands for easy debugging
if (typeof window !== 'undefined') {
    window.debugTooltips = () => tooltipDebugger.enableDebugMode();
    window.testTooltips = () => tooltipDebugger.testTooltips();
    window.clearTooltips = () => tooltipDebugger.clearAllTooltips();
    window.fixTooltips = () => tooltipDebugger.fixTooltipIssues();
    window.tooltipStats = () => tooltipDebugger.getTooltipStats();
}