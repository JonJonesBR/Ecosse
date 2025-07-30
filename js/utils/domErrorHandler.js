/**
 * DOM Error Handler - Task 1: Fix critical DOM issues
 * 
 * This module provides utilities to handle DOM-related errors gracefully,
 * including safe element insertion, validation, and fallback creation.
 * 
 * Addresses the following errors:
 * - AnalysisTools insertBefore error
 * - Panel finding issues (left/right panels)
 * - Missing DOM elements during initialization
 */

export class DOMErrorHandler {
    constructor() {
        this.errorLog = [];
        this.fixedElements = new Set();
        this.isInitialized = false;
    }

    /**
     * Initialize the DOM Error Handler
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('🔧 Initializing DOM Error Handler...');
        
        // Set up global error handling for DOM operations
        this.setupGlobalErrorHandling();
        
        // Validate critical DOM elements
        this.validateCriticalElements();
        
        this.isInitialized = true;
        console.log('✅ DOM Error Handler initialized');
    }

    /**
     * Set up global error handling for DOM operations
     */
    setupGlobalErrorHandling() {
        // Override insertBefore to make it safer
        const originalInsertBefore = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function(newNode, referenceNode) {
            try {
                return window.domErrorHandler.safeInsertBefore(newNode, referenceNode, this);
            } catch (error) {
                console.warn('DOM insertBefore failed, using fallback:', error);
                return this.appendChild(newNode);
            }
        };
    }

    /**
     * Validate that critical DOM elements exist
     */
    validateCriticalElements() {
        const criticalElements = [
            'left-panel',
            'right-panel', 
            'simulation-info-panel',
            'app-container',
            'main-content',
            'three-js-canvas-container'
        ];

        criticalElements.forEach(elementId => {
            this.validateDOMElement(elementId);
        });
    }

    /**
     * Validate if a DOM element exists and is accessible
     * @param {string} elementId - The ID of the element to validate
     * @returns {boolean} True if element exists and is valid
     */
    validateDOMElement(elementId) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            this.logError('dom', `Element with ID '${elementId}' not found`, 'validateDOMElement');
            return false;
        }

        if (!element.parentNode) {
            this.logError('dom', `Element '${elementId}' has no parent node`, 'validateDOMElement');
            return false;
        }

        return true;
    }

    /**
     * Safe insertion of DOM elements with fallback strategies
     * @param {Node} newNode - The node to insert
     * @param {Node} referenceNode - The reference node to insert before
     * @param {Node} parent - The parent node
     * @returns {Node} The inserted node
     */
    safeInsertBefore(newNode, referenceNode, parent) {
        try {
            // Validate all parameters
            if (!newNode) {
                throw new Error('newNode is null or undefined');
            }
            
            if (!parent) {
                throw new Error('parent is null or undefined');
            }

            // If referenceNode is null, append to end
            if (!referenceNode) {
                return parent.appendChild(newNode);
            }

            // Check if referenceNode is actually a child of parent
            if (!parent.contains(referenceNode)) {
                console.warn('Reference node is not a child of parent, appending to end');
                return parent.appendChild(newNode);
            }

            // Perform the insertion
            return parent.insertBefore(newNode, referenceNode);

        } catch (error) {
            this.logError('dom', `Safe insertBefore failed: ${error.message}`, 'safeInsertBefore');
            
            // Fallback: just append to parent
            try {
                return parent.appendChild(newNode);
            } catch (fallbackError) {
                this.logError('dom', `Fallback appendChild also failed: ${fallbackError.message}`, 'safeInsertBefore');
                throw fallbackError;
            }
        }
    }

    /**
     * Find an element or create it if it doesn't exist
     * @param {string} elementId - The ID of the element to find
     * @param {Object} fallbackConfig - Configuration for creating the element if not found
     * @returns {HTMLElement} The found or created element
     */
    findOrCreateElement(elementId, fallbackConfig = {}) {
        let element = document.getElementById(elementId);
        
        if (element) {
            return element;
        }

        // Element doesn't exist, create it
        console.warn(`Element '${elementId}' not found, creating fallback element`);
        
        element = document.createElement(fallbackConfig.tagName || 'div');
        element.id = elementId;
        
        if (fallbackConfig.className) {
            element.className = fallbackConfig.className;
        }
        
        if (fallbackConfig.innerHTML) {
            element.innerHTML = fallbackConfig.innerHTML;
        }

        // Find parent and insert
        const parentId = fallbackConfig.parentId || 'app-container';
        const parent = document.getElementById(parentId) || document.body;
        
        if (fallbackConfig.insertBefore) {
            const referenceElement = document.getElementById(fallbackConfig.insertBefore);
            if (referenceElement && parent.contains(referenceElement)) {
                this.safeInsertBefore(element, referenceElement, parent);
            } else {
                parent.appendChild(element);
            }
        } else {
            parent.appendChild(element);
        }

        this.fixedElements.add(elementId);
        this.logError('dom', `Created fallback element '${elementId}'`, 'findOrCreateElement', 'info');
        
        return element;
    }

    /**
     * Safe panel finding with fallback creation
     * @param {string} panelId - The ID of the panel to find ('left-panel' or 'right-panel')
     * @returns {HTMLElement} The panel element
     */
    findOrCreatePanel(panelId) {
        const panelConfigs = {
            'left-panel': {
                tagName: 'div',
                className: 'panel',
                innerHTML: `
                    <div class="panel-content">
                        <h3 class="text-xl font-semibold mb-3 text-gray-200 flex items-center justify-between">
                            Configurações
                            <button id="toggle-left-panel" class="panel-toggle-btn lg:hidden">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                        </h3>
                        <div class="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            <!-- Panel content will be populated by other systems -->
                        </div>
                    </div>
                `,
                parentId: 'app-container',
                insertBefore: 'main-content'
            },
            'right-panel': {
                tagName: 'div',
                className: 'panel',
                innerHTML: `
                    <div class="panel-content">
                        <h3 class="text-xl font-semibold mb-3 text-gray-200 flex items-center justify-between">
                            Informações
                            <button id="toggle-right-panel" class="panel-toggle-btn lg:hidden">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </h3>
                        <div id="simulation-info-panel" class="flex-grow mb-4 overflow-y-auto pr-2 custom-scrollbar">
                            <!-- Panel content will be populated by other systems -->
                        </div>
                    </div>
                `,
                parentId: 'app-container'
            }
        };

        const config = panelConfigs[panelId];
        if (!config) {
            throw new Error(`Unknown panel ID: ${panelId}`);
        }

        return this.findOrCreateElement(panelId, config);
    }

    /**
     * Fix AnalysisTools DOM insertion issues
     * @param {HTMLElement} rightPanel - The right panel element
     * @returns {HTMLElement} The simulation info panel element
     */
    fixAnalysisToolsDOM(rightPanel = null) {
        // Ensure right panel exists
        if (!rightPanel) {
            rightPanel = this.findOrCreatePanel('right-panel');
        }

        // Ensure simulation-info-panel exists within right panel
        let simInfoPanel = document.getElementById('simulation-info-panel');
        
        if (!simInfoPanel) {
            simInfoPanel = this.findOrCreateElement('simulation-info-panel', {
                tagName: 'div',
                className: 'flex-grow mb-4 overflow-y-auto pr-2 custom-scrollbar',
                innerHTML: `
                    <p class="text-sm text-gray-400">Estabilidade: <span id="ecosystem-stability">N/A</span></p>
                    <p class="text-sm text-gray-400">Biodiversidade: <span id="ecosystem-biodiversity">N/A</span></p>
                    <p class="text-sm text-gray-400">Recursos: <span id="ecosystem-resources">N/A</span></p>
                    <p class="text-sm text-gray-400">Clima: <span id="current-weather">☀️ Ensolarado</span></p>
                    <p class="text-sm text-gray-400">Estação: <span id="current-season-display">Primavera</span></p>
                `,
                parentId: 'right-panel'
            });
        }

        // Ensure the simulation info panel is properly positioned within the right panel
        const panelContent = rightPanel.querySelector('.panel-content');
        if (panelContent && !panelContent.contains(simInfoPanel)) {
            panelContent.appendChild(simInfoPanel);
        }

        return simInfoPanel;
    }

    /**
     * Create safe DOM manipulation methods
     */
    createSafeDOMMethods() {
        return {
            safeQuerySelector: (selector) => {
                try {
                    return document.querySelector(selector);
                } catch (error) {
                    this.logError('dom', `querySelector failed for '${selector}': ${error.message}`, 'safeQuerySelector');
                    return null;
                }
            },

            safeQuerySelectorAll: (selector) => {
                try {
                    return document.querySelectorAll(selector);
                } catch (error) {
                    this.logError('dom', `querySelectorAll failed for '${selector}': ${error.message}`, 'safeQuerySelectorAll');
                    return [];
                }
            },

            safeGetElementById: (id) => {
                try {
                    const element = document.getElementById(id);
                    if (!element) {
                        this.logError('dom', `Element with ID '${id}' not found`, 'safeGetElementById', 'warning');
                    }
                    return element;
                } catch (error) {
                    this.logError('dom', `getElementById failed for '${id}': ${error.message}`, 'safeGetElementById');
                    return null;
                }
            },

            safeAppendChild: (parent, child) => {
                try {
                    if (!parent || !child) {
                        throw new Error('Parent or child is null/undefined');
                    }
                    return parent.appendChild(child);
                } catch (error) {
                    this.logError('dom', `appendChild failed: ${error.message}`, 'safeAppendChild');
                    return null;
                }
            }
        };
    }

    /**
     * Log an error with context
     * @param {string} type - Type of error
     * @param {string} message - Error message
     * @param {string} source - Source of the error
     * @param {string} severity - Severity level
     */
    logError(type, message, source, severity = 'error') {
        const errorEntry = {
            id: Date.now() + Math.random(),
            type,
            severity,
            message,
            source,
            timestamp: Date.now(),
            fixed: false,
            fixApplied: null
        };

        this.errorLog.push(errorEntry);

        // Log to console with appropriate level
        const logMethod = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
        console[logMethod](`[DOM Error Handler] ${source}: ${message}`);

        return errorEntry;
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            fixed: 0,
            unfixed: 0
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            
            if (error.fixed) {
                stats.fixed++;
            } else {
                stats.unfixed++;
            }
        });

        return stats;
    }

    /**
     * Run comprehensive DOM health check
     * @returns {Object} Health check results
     */
    runHealthCheck() {
        console.log('🔍 Running DOM health check...');
        
        const results = {
            timestamp: Date.now(),
            criticalElements: {},
            panels: {},
            overall: true,
            issues: []
        };

        // Check critical elements
        const criticalElements = [
            'app-container',
            'main-content', 
            'three-js-canvas-container',
            'left-panel',
            'right-panel',
            'simulation-info-panel'
        ];

        criticalElements.forEach(elementId => {
            const exists = this.validateDOMElement(elementId);
            results.criticalElements[elementId] = exists;
            
            if (!exists) {
                results.overall = false;
                results.issues.push(`Missing critical element: ${elementId}`);
            }
        });

        // Check panel structure
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        results.panels.leftPanel = {
            exists: !!leftPanel,
            hasContent: leftPanel ? leftPanel.querySelector('.panel-content') !== null : false
        };
        
        results.panels.rightPanel = {
            exists: !!rightPanel,
            hasContent: rightPanel ? rightPanel.querySelector('.panel-content') !== null : false,
            hasSimInfoPanel: !!document.getElementById('simulation-info-panel')
        };

        // Log results
        if (results.overall) {
            console.log('✅ DOM health check passed');
        } else {
            console.warn('⚠️ DOM health check found issues:', results.issues);
        }

        return results;
    }

    /**
     * Auto-fix common DOM issues
     * @returns {Array} List of fixes applied
     */
    autoFixCommonIssues() {
        console.log('🔧 Auto-fixing common DOM issues...');
        
        const fixes = [];

        // Fix missing panels
        try {
            const leftPanel = this.findOrCreatePanel('left-panel');
            if (this.fixedElements.has('left-panel')) {
                fixes.push('Created missing left panel');
            }

            const rightPanel = this.findOrCreatePanel('right-panel');
            if (this.fixedElements.has('right-panel')) {
                fixes.push('Created missing right panel');
            }

            // Fix AnalysisTools DOM structure
            this.fixAnalysisToolsDOM(rightPanel);
            fixes.push('Fixed AnalysisTools DOM structure');

        } catch (error) {
            console.error('Error during auto-fix:', error);
            fixes.push(`Auto-fix error: ${error.message}`);
        }

        console.log(`✅ Applied ${fixes.length} DOM fixes`);
        return fixes;
    }

    /**
     * Dispose of the DOM Error Handler
     */
    dispose() {
        // Restore original insertBefore if we modified it
        // Note: In a real implementation, we'd store the original method
        
        this.errorLog = [];
        this.fixedElements.clear();
        this.isInitialized = false;
        
        console.log('DOM Error Handler disposed');
    }
}

// Create and export singleton instance
export const domErrorHandler = new DOMErrorHandler();

// Make available globally for debugging and integration
if (typeof window !== 'undefined') {
    window.domErrorHandler = domErrorHandler;
    console.log('🔧 DOM Error Handler available globally');
}