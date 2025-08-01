/**
 * Layout Error Handler - Task 6: Add layout error handling and recovery
 * 
 * This class provides comprehensive error detection, fallback mechanisms, and graceful degradation
 * for layout-related issues including missing DOM elements and CSS conflicts.
 * 
 * Requirements addressed:
 * - 5.1: Error detection for missing DOM elements
 * - 5.2: Fallback layout mechanisms  
 * - 5.3: Graceful degradation for CSS conflicts
 * - 5.4: Layout error recovery
 */

export class LayoutErrorHandler {
    constructor() {
        this.fallbackApplied = false;
        this.errorCount = 0;
        this.maxErrors = 5;
        this.fallbackLayouts = new Map();
        this.lastKnownGoodState = null;
        this.missingElements = new Set();
        this.cssConflicts = new Map();
        this.errorDetectionInterval = null;
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        
        this.setupFallbackLayouts();
        this.initializeErrorDetection();
    }

    /**
     * Initialize error detection system
     */
    initializeErrorDetection() {
        // Start periodic DOM element checking
        this.startDOMElementMonitoring();
        
        // Set up CSS conflict detection
        this.setupCSSConflictDetection();
        
        // Monitor for layout calculation errors
        this.setupLayoutCalculationMonitoring();
        
        console.log('✅ Layout error detection system initialized');
    }

    /**
     * Start monitoring for missing DOM elements
     */
    startDOMElementMonitoring() {
        const criticalElements = [
            'app-container',
            'main-content',
            'three-js-canvas-container',
            'left-panel',
            'right-panel',
            'bottom-panel',
            'top-panel'
        ];

        // Check immediately
        this.detectMissingElements(criticalElements);

        // Set up periodic checking
        this.errorDetectionInterval = setInterval(() => {
            this.detectMissingElements(criticalElements);
        }, 5000); // Check every 5 seconds
    }

    /**
     * Detect missing DOM elements
     * @param {Array} elementIds - Array of element IDs to check
     */
    detectMissingElements(elementIds) {
        const currentlyMissing = new Set();

        elementIds.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                currentlyMissing.add(elementId);
                
                if (!this.missingElements.has(elementId)) {
                    console.warn(`🚨 Missing DOM element detected: ${elementId}`);
                    this.handleMissingElement(elementId);
                }
            }
        });

        // Update missing elements set
        this.missingElements = currentlyMissing;

        // If we have missing critical elements, attempt recovery
        if (currentlyMissing.size > 0 && this.recoveryAttempts < this.maxRecoveryAttempts) {
            this.attemptDOMRecovery();
        }
    }

    /**
     * Handle a missing DOM element
     * @param {string} elementId - ID of the missing element
     */
    handleMissingElement(elementId) {
        this.errorCount++;
        
        // Log the error
        console.error(`Missing DOM element: ${elementId}`);
        
        // Attempt to create the missing element
        try {
            this.createMissingElement(elementId);
        } catch (error) {
            console.error(`Failed to create missing element ${elementId}:`, error);
            this.applyFallbackLayout();
        }
    }

    /**
     * Create a missing DOM element with appropriate fallback structure
     * @param {string} elementId - ID of the element to create
     */
    createMissingElement(elementId) {
        const elementConfigs = {
            'app-container': {
                tagName: 'div',
                className: 'app-container-fallback',
                styles: {
                    display: 'flex',
                    flexDirection: 'row',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden'
                },
                parent: document.body
            },
            'main-content': {
                tagName: 'main',
                className: 'main-content-fallback',
                styles: {
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    height: '100vh',
                    overflow: 'hidden'
                },
                parent: document.getElementById('app-container') || document.body
            },
            'three-js-canvas-container': {
                tagName: 'div',
                className: 'canvas-container-fallback',
                styles: {
                    flex: '1',
                    position: 'relative',
                    width: '100%',
                    minHeight: '300px',
                    background: 'linear-gradient(135deg, #1e293b, #334155)'
                },
                parent: document.getElementById('main-content') || document.body
            },
            'left-panel': {
                tagName: 'div',
                className: 'panel panel-fallback',
                styles: {
                    width: '280px',
                    flexShrink: '0',
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '1rem',
                    height: '100vh',
                    overflow: 'auto'
                },
                parent: document.getElementById('app-container') || document.body,
                innerHTML: '<div class="panel-content"><h3>Configurações</h3></div>'
            },
            'right-panel': {
                tagName: 'div',
                className: 'panel panel-fallback',
                styles: {
                    width: '280px',
                    flexShrink: '0',
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '1rem',
                    height: '100vh',
                    overflow: 'auto'
                },
                parent: document.getElementById('app-container') || document.body,
                innerHTML: '<div class="panel-content"><h3>Informações</h3><div id="simulation-info-panel"></div></div>'
            },
            'bottom-panel': {
                tagName: 'div',
                className: 'bottom-panel-fallback',
                styles: {
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '1rem',
                    borderRadius: '1rem',
                    zIndex: '1000'
                },
                parent: document.body,
                innerHTML: '<h3>Controles</h3><div>Painel de controles temporário</div>'
            },
            'top-panel': {
                tagName: 'div',
                className: 'top-panel-fallback',
                styles: {
                    background: 'rgba(30, 41, 59, 0.9)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: '0'
                },
                parent: document.getElementById('main-content') || document.body,
                innerHTML: '<h1>Ecosse™ - Sandbox Planetário</h1>'
            }
        };

        const config = elementConfigs[elementId];
        if (!config) {
            console.warn(`No fallback configuration for element: ${elementId}`);
            return;
        }

        // Create the element
        const element = document.createElement(config.tagName);
        element.id = elementId;
        element.className = config.className || '';

        // Apply styles
        if (config.styles) {
            Object.assign(element.style, config.styles);
        }

        // Set innerHTML if provided
        if (config.innerHTML) {
            element.innerHTML = config.innerHTML;
        }

        // Insert into parent
        if (config.parent) {
            config.parent.appendChild(element);
            console.log(`✅ Created fallback element: ${elementId}`);
        } else {
            console.error(`No parent found for fallback element: ${elementId}`);
        }
    }

    /**
     * Setup CSS conflict detection
     */
    setupCSSConflictDetection() {
        // Monitor for common CSS conflicts
        this.monitorCSSConflicts();
        
        // Set up MutationObserver to detect style changes
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.checkForCSSConflicts(mutation.target);
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                subtree: true
            });
        }
    }

    /**
     * Monitor for CSS conflicts in critical elements
     */
    monitorCSSConflicts() {
        const criticalElements = [
            'app-container',
            'main-content',
            'three-js-canvas-container',
            'left-panel',
            'right-panel',
            'bottom-panel'
        ];

        criticalElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                this.checkForCSSConflicts(element);
            }
        });
    }

    /**
     * Check for CSS conflicts on an element
     * @param {HTMLElement} element - Element to check
     */
    checkForCSSConflicts(element) {
        if (!element || !element.id) return;

        const computedStyle = window.getComputedStyle(element);
        const conflicts = [];

        // Check for common layout-breaking conflicts
        const checks = {
            'display-none': () => computedStyle.display === 'none' && element.id !== 'bottom-panel',
            'zero-dimensions': () => (computedStyle.width === '0px' || computedStyle.height === '0px') && 
                                   !['left-panel', 'right-panel'].includes(element.id),
            'negative-margins': () => {
                const marginTop = parseInt(computedStyle.marginTop);
                const marginLeft = parseInt(computedStyle.marginLeft);
                return marginTop < -100 || marginLeft < -100;
            },
            'overflow-issues': () => computedStyle.overflow === 'visible' && 
                                   ['app-container', 'main-content'].includes(element.id),
            'z-index-conflicts': () => {
                const zIndex = parseInt(computedStyle.zIndex);
                return element.id === 'bottom-panel' && zIndex < 100;
            }
        };

        Object.entries(checks).forEach(([conflictType, checkFn]) => {
            try {
                if (checkFn()) {
                    conflicts.push(conflictType);
                }
            } catch (error) {
                console.warn(`CSS conflict check failed for ${conflictType}:`, error);
            }
        });

        if (conflicts.length > 0) {
            this.handleCSSConflicts(element, conflicts);
        }
    }

    /**
     * Handle detected CSS conflicts
     * @param {HTMLElement} element - Element with conflicts
     * @param {Array} conflicts - Array of conflict types
     */
    handleCSSConflicts(element, conflicts) {
        const elementId = element.id;
        
        console.warn(`🚨 CSS conflicts detected on ${elementId}:`, conflicts);
        
        // Store conflict information
        this.cssConflicts.set(elementId, {
            element,
            conflicts,
            timestamp: Date.now(),
            resolved: false
        });

        // Apply conflict resolution
        this.resolveCSSConflicts(element, conflicts);
    }

    /**
     * Resolve CSS conflicts by applying inline styles
     * @param {HTMLElement} element - Element to fix
     * @param {Array} conflicts - Array of conflict types
     */
    resolveCSSConflicts(element, conflicts) {
        const elementId = element.id;
        const resolutionStyles = {};

        conflicts.forEach(conflictType => {
            switch (conflictType) {
                case 'display-none':
                    resolutionStyles.display = this.getDefaultDisplay(elementId);
                    break;
                case 'zero-dimensions':
                    if (elementId === 'three-js-canvas-container') {
                        resolutionStyles.width = '100%';
                        resolutionStyles.height = '100%';
                        resolutionStyles.minHeight = '300px';
                    }
                    break;
                case 'negative-margins':
                    resolutionStyles.margin = '0';
                    break;
                case 'overflow-issues':
                    resolutionStyles.overflow = 'hidden';
                    break;
                case 'z-index-conflicts':
                    if (elementId === 'bottom-panel') {
                        resolutionStyles.zIndex = '1000';
                    }
                    break;
            }
        });

        // Apply resolution styles with !important
        Object.entries(resolutionStyles).forEach(([property, value]) => {
            element.style.setProperty(property, value, 'important');
        });

        console.log(`✅ Applied CSS conflict resolution for ${elementId}:`, resolutionStyles);
        
        // Mark as resolved
        const conflictInfo = this.cssConflicts.get(elementId);
        if (conflictInfo) {
            conflictInfo.resolved = true;
            conflictInfo.resolutionStyles = resolutionStyles;
        }
    }

    /**
     * Get default display value for an element
     * @param {string} elementId - Element ID
     * @returns {string} Default display value
     */
    getDefaultDisplay(elementId) {
        const displayMap = {
            'app-container': 'flex',
            'main-content': 'flex',
            'three-js-canvas-container': 'block',
            'left-panel': 'flex',
            'right-panel': 'flex',
            'bottom-panel': 'flex',
            'top-panel': 'flex'
        };

        return displayMap[elementId] || 'block';
    }

    /**
     * Setup layout calculation monitoring
     */
    setupLayoutCalculationMonitoring() {
        // Override common layout calculation methods to catch errors
        this.wrapLayoutMethods();
        
        // Monitor resize events for errors
        window.addEventListener('resize', () => {
            try {
                this.validateLayoutAfterResize();
            } catch (error) {
                this.handleResizeError(error, 'resize-event');
            }
        });
    }

    /**
     * Wrap layout methods to catch calculation errors
     */
    wrapLayoutMethods() {
        // Wrap getBoundingClientRect
        const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = function() {
            try {
                return originalGetBoundingClientRect.call(this);
            } catch (error) {
                console.warn('getBoundingClientRect failed:', error);
                // Return a safe fallback
                return {
                    top: 0, left: 0, bottom: 0, right: 0,
                    width: 0, height: 0, x: 0, y: 0
                };
            }
        };
    }

    /**
     * Validate layout after resize
     */
    validateLayoutAfterResize() {
        const canvasContainer = document.getElementById('three-js-canvas-container');
        if (canvasContainer) {
            const rect = canvasContainer.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.warn('Canvas container has zero dimensions after resize');
                this.handleCanvasResizeError(new Error('Canvas container has zero dimensions'));
            }
        }
    }

    /**
     * Attempt DOM recovery
     */
    attemptDOMRecovery() {
        this.recoveryAttempts++;
        console.log(`🔄 Attempting DOM recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

        // Try to recreate missing elements
        this.missingElements.forEach(elementId => {
            try {
                this.createMissingElement(elementId);
            } catch (error) {
                console.error(`Failed to recover element ${elementId}:`, error);
            }
        });

        // Validate recovery
        setTimeout(() => {
            this.detectMissingElements(Array.from(this.missingElements));
            
            if (this.missingElements.size === 0) {
                console.log('✅ DOM recovery successful');
                this.recoveryAttempts = 0;
            } else if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
                console.error('❌ DOM recovery failed after maximum attempts');
                this.applyFallbackLayout();
            }
        }, 1000);
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
     * Get comprehensive error handler status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            fallbackApplied: this.fallbackApplied,
            errorCount: this.errorCount,
            hasLastKnownGoodState: !!this.lastKnownGoodState,
            maxErrors: this.maxErrors,
            missingElements: Array.from(this.missingElements),
            cssConflicts: Array.from(this.cssConflicts.entries()).map(([id, info]) => ({
                elementId: id,
                conflicts: info.conflicts,
                resolved: info.resolved,
                timestamp: info.timestamp
            })),
            recoveryAttempts: this.recoveryAttempts,
            maxRecoveryAttempts: this.maxRecoveryAttempts,
            monitoringActive: !!this.errorDetectionInterval
        };
    }

    /**
     * Get error statistics and diagnostics
     * @returns {Object} Diagnostic information
     */
    getDiagnostics() {
        const status = this.getStatus();
        
        return {
            ...status,
            summary: {
                totalErrors: this.errorCount,
                criticalIssues: this.missingElements.size + 
                               Array.from(this.cssConflicts.values()).filter(c => !c.resolved).length,
                recoverySuccess: this.recoveryAttempts > 0 && this.missingElements.size === 0,
                systemHealth: this.getSystemHealth()
            },
            recommendations: this.getRecoveryRecommendations()
        };
    }

    /**
     * Get system health assessment
     * @returns {string} Health status
     */
    getSystemHealth() {
        if (this.fallbackApplied) return 'degraded';
        if (this.missingElements.size > 0) return 'critical';
        if (this.cssConflicts.size > 0) return 'warning';
        if (this.errorCount > 0) return 'stable-with-issues';
        return 'healthy';
    }

    /**
     * Get recovery recommendations
     * @returns {Array} Array of recommendations
     */
    getRecoveryRecommendations() {
        const recommendations = [];

        if (this.missingElements.size > 0) {
            recommendations.push('Critical DOM elements are missing. Consider page reload.');
        }

        if (this.cssConflicts.size > 0) {
            const unresolvedConflicts = Array.from(this.cssConflicts.values())
                .filter(c => !c.resolved).length;
            if (unresolvedConflicts > 0) {
                recommendations.push(`${unresolvedConflicts} CSS conflicts need resolution.`);
            }
        }

        if (this.errorCount >= this.maxErrors * 0.8) {
            recommendations.push('Error count is high. System may need restart.');
        }

        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
            recommendations.push('Maximum recovery attempts reached. Manual intervention required.');
        }

        return recommendations;
    }

    /**
     * Force a comprehensive system check
     * @returns {Object} Check results
     */
    runComprehensiveCheck() {
        console.log('🔍 Running comprehensive layout error check...');

        // Reset counters for fresh check
        const originalErrorCount = this.errorCount;
        this.errorCount = 0;

        // Check DOM elements
        const criticalElements = [
            'app-container', 'main-content', 'three-js-canvas-container',
            'left-panel', 'right-panel', 'bottom-panel', 'top-panel'
        ];
        
        this.detectMissingElements(criticalElements);

        // Check CSS conflicts
        this.monitorCSSConflicts();

        // Validate layout calculations
        try {
            this.validateLayoutAfterResize();
        } catch (error) {
            this.handleResizeError(error, 'comprehensive-check');
        }

        const results = {
            timestamp: Date.now(),
            previousErrorCount: originalErrorCount,
            newErrorCount: this.errorCount,
            diagnostics: this.getDiagnostics(),
            actionsTaken: []
        };

        // Take corrective actions if needed
        if (this.missingElements.size > 0 && this.recoveryAttempts < this.maxRecoveryAttempts) {
            this.attemptDOMRecovery();
            results.actionsTaken.push('DOM recovery attempted');
        }

        if (this.errorCount > this.maxErrors) {
            this.applyFallbackLayout();
            results.actionsTaken.push('Fallback layout applied');
        }

        console.log('✅ Comprehensive check completed:', results);
        return results;
    }

    /**
     * Cleanup and dispose of error handler
     */
    dispose() {
        // Clear monitoring interval
        if (this.errorDetectionInterval) {
            clearInterval(this.errorDetectionInterval);
            this.errorDetectionInterval = null;
        }

        // Clear error data
        this.missingElements.clear();
        this.cssConflicts.clear();
        this.errorCount = 0;
        this.recoveryAttempts = 0;
        this.fallbackApplied = false;
        this.lastKnownGoodState = null;

        console.log('Layout error handler disposed');
    }
}

// Create and export singleton instance
export const layoutErrorHandler = new LayoutErrorHandler();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutErrorHandler = layoutErrorHandler;
    console.log('🔧 Layout Error Handler available globally');
}