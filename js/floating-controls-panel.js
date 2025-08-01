/**
 * Floating Controls Panel - Enhanced UI for Ecosse™ Planetary Sandbox
 * Provides drag-and-drop, collapsible, and repositionable controls panel
 */

class FloatingControlsPanel {
    constructor() {
        this.panel = document.getElementById('bottom-panel');
        this.isCollapsed = false;
        this.isDragging = false;
        this.currentPosition = 'bottom-center';
        this.dragOffset = { x: 0, y: 0 };
        this.viewportUpdateTimeout = null;
        
        this.init();
    }
    
    init() {
        this.createControlButtons();
        this.createDragHandle();
        this.wrapPanelContent();
        this.setupEventListeners();
        this.setupResponsiveHandling();
        this.setupZIndexManagement();
        this.loadSavedState();
        this.setupElementControlsIntegration();
    }
    
    createControlButtons() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'floating-panel-controls';
        
        // Collapse/Expand button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'panel-control-btn';
        collapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        collapseBtn.title = 'Colapsar/Expandir Painel';
        collapseBtn.addEventListener('click', () => this.toggleCollapse());
        
        // Position button
        const positionBtn = document.createElement('button');
        positionBtn.className = 'panel-control-btn';
        positionBtn.innerHTML = '<i class="fas fa-arrows-alt"></i>';
        positionBtn.title = 'Reposicionar Painel';
        positionBtn.addEventListener('click', () => this.cyclePosition());
        
        // Compact mode button
        const compactBtn = document.createElement('button');
        compactBtn.className = 'panel-control-btn';
        compactBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
        compactBtn.title = 'Modo Compacto';
        compactBtn.addEventListener('click', () => this.toggleCompactMode());
        
        controlsContainer.appendChild(collapseBtn);
        controlsContainer.appendChild(positionBtn);
        controlsContainer.appendChild(compactBtn);
        
        this.panel.appendChild(controlsContainer);
        this.controlButtons = {
            collapse: collapseBtn,
            position: positionBtn,
            compact: compactBtn
        };
    }
    
    createDragHandle() {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'panel-drag-handle';
        dragHandle.title = 'Arrastar para reposicionar';
        
        this.panel.appendChild(dragHandle);
        this.dragHandle = dragHandle;
    }
    
    wrapPanelContent() {
        const existingContent = Array.from(this.panel.children).filter(
            child => !child.classList.contains('floating-panel-controls') && 
                    !child.classList.contains('panel-drag-handle')
        );
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'panel-content';
        
        existingContent.forEach(child => {
            contentWrapper.appendChild(child);
        });
        
        this.panel.appendChild(contentWrapper);
        this.contentWrapper = contentWrapper;
    }
    
    setupEventListeners() {
        // Drag functionality
        this.dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
        this.dragHandle.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.toggleCollapse();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.cyclePosition();
            }
        });
        
        // Auto-hide on canvas interaction (optional)
        const canvas = document.querySelector('#three-js-canvas-container canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', () => {
                if (!this.isCollapsed) {
                    this.panel.style.opacity = '0.3';
                }
            });
            
            canvas.addEventListener('mouseup', () => {
                this.panel.style.opacity = '1';
            });
        }
    }
    
    setupZIndexManagement() {
        // Ensure proper z-index layering to prevent canvas obstruction
        const canvasContainer = document.getElementById('three-js-canvas-container');
        const canvas = canvasContainer?.querySelector('canvas');
        
        if (canvasContainer) {
            // Set canvas container z-index lower than floating panel
            canvasContainer.style.zIndex = '10';
            canvasContainer.style.position = 'relative';
        }
        
        if (canvas) {
            // Ensure canvas itself has lowest z-index
            canvas.style.zIndex = '1';
            canvas.style.position = 'relative';
        }
        
        // Set floating panel z-index above canvas but below modals
        this.panel.style.zIndex = '50';
        
        // Monitor for dynamic canvas creation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newCanvas = node.querySelector?.('canvas') || 
                                        (node.tagName === 'CANVAS' ? node : null);
                        if (newCanvas) {
                            newCanvas.style.zIndex = '1';
                            newCanvas.style.position = 'relative';
                        }
                    }
                });
            });
        });
        
        if (canvasContainer) {
            observer.observe(canvasContainer, { childList: true, subtree: true });
        }
        
        // Store observer for cleanup
        this.zIndexObserver = observer;
    }

    setupResponsiveHandling() {
        const mobileQuery = window.matchMedia('(max-width: 768px)');
        const tabletQuery = window.matchMedia('(min-width: 769px) and (max-width: 1024px)');
        const desktopQuery = window.matchMedia('(min-width: 1025px)');
        
        const handleResponsive = () => {
            if (mobileQuery.matches) {
                // Mobile: force bottom-center position and enable compact mode
                this.setPosition('bottom-center');
                this.panel.classList.add('compact-mode');
                this.isCompactMode = true;
                this.updateViewportAwareness();
                this.disableDragOnMobile();
            } else if (tabletQuery.matches) {
                // Tablet: restore saved position but keep compact mode available
                this.setPosition(this.currentPosition);
                if (!this.isCompactMode) {
                    this.panel.classList.remove('compact-mode');
                }
                this.updateViewportAwareness();
                this.enableDragForDesktop();
            } else if (desktopQuery.matches) {
                // Desktop: full functionality with saved position
                this.setPosition(this.currentPosition);
                if (!this.isCompactMode) {
                    this.panel.classList.remove('compact-mode');
                }
                this.updateViewportAwareness();
                this.enableDragForDesktop();
            }
        };
        
        // Add listeners for all breakpoints
        mobileQuery.addListener(handleResponsive);
        tabletQuery.addListener(handleResponsive);
        desktopQuery.addListener(handleResponsive);
        
        // Initial setup
        handleResponsive();
        
        // Handle window resize for viewport awareness
        window.addEventListener('resize', () => {
            this.debounceViewportUpdate();
        });
    }
    
    startDrag(e) {
        if (!this.isDragEnabled || window.innerWidth <= 768) return; // Disable drag on mobile or when disabled
        
        this.isDragging = true;
        this.panel.classList.add('dragging');
        this.panel.style.transition = 'none';
        
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        const rect = this.panel.getBoundingClientRect();
        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        
        this.dragHandle.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        if (e.type === 'touchstart') {
            e.preventDefault();
        }
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - this.dragOffset.x;
        const y = clientY - this.dragOffset.y;
        
        // Enhanced viewport constraints with safe margins
        const safeMargin = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelWidth = this.panel.offsetWidth;
        const panelHeight = this.panel.offsetHeight;
        
        // Calculate safe bounds
        const minX = safeMargin;
        const maxX = viewportWidth - panelWidth - safeMargin;
        const minY = safeMargin;
        const maxY = viewportHeight - panelHeight - safeMargin;
        
        // Apply constraints with smooth boundaries
        const constrainedX = Math.max(minX, Math.min(x, maxX));
        const constrainedY = Math.max(minY, Math.min(y, maxY));
        
        // Apply position with enhanced viewport awareness
        this.panel.style.left = constrainedX + 'px';
        this.panel.style.top = constrainedY + 'px';
        this.panel.style.right = 'auto';
        this.panel.style.bottom = 'auto';
        this.panel.style.transform = 'none';
        
        // Add visual feedback for viewport boundaries
        const isNearEdge = (
            constrainedX <= minX + 10 || 
            constrainedX >= maxX - 10 || 
            constrainedY <= minY + 10 || 
            constrainedY >= maxY - 10
        );
        
        if (isNearEdge) {
            this.panel.classList.add('near-edge');
        } else {
            this.panel.classList.remove('near-edge');
        }
        
        if (e.type === 'touchmove') {
            e.preventDefault();
        }
    }
    
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.panel.classList.remove('dragging');
        this.panel.style.transition = '';
        this.dragHandle.style.cursor = 'grab';
        document.body.style.userSelect = '';
        
        // Remove viewport boundary feedback
        this.panel.classList.remove('near-edge');
        
        // Snap to nearest position
        this.snapToNearestPosition();
        this.saveState();
    }
    
    snapToNearestPosition() {
        // Don't allow snapping on mobile - force bottom-center
        if (window.innerWidth <= 768) {
            this.setPosition('bottom-center');
            return;
        }
        
        const rect = this.panel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let newPosition = 'bottom-center';
        
        // Enhanced viewport awareness for snapping
        const safeMargin = 40; // Minimum distance from viewport edges
        
        if (centerY > viewportHeight * 0.7) {
            // Bottom area
            if (centerX < viewportWidth * 0.33 && centerX > safeMargin) {
                newPosition = 'bottom-left';
            } else if (centerX > viewportWidth * 0.67 && centerX < viewportWidth - safeMargin) {
                newPosition = 'bottom-right';
            } else {
                newPosition = 'bottom-center';
            }
        } else {
            // Side areas - ensure panel fits within viewport
            const panelWidth = rect.width;
            const panelHeight = rect.height;
            
            if (centerX < viewportWidth * 0.5) {
                // Left side - check if panel fits
                if (panelWidth + safeMargin < viewportWidth * 0.4) {
                    newPosition = 'side-left';
                } else {
                    newPosition = 'bottom-center'; // Fallback if too wide
                }
            } else {
                // Right side - check if panel fits
                if (panelWidth + safeMargin < viewportWidth * 0.4) {
                    newPosition = 'side-right';
                } else {
                    newPosition = 'bottom-center'; // Fallback if too wide
                }
            }
        }
        
        this.setPosition(newPosition);
    }
    
    updateViewportAwareness() {
        // Ensure panel stays within viewport bounds with enhanced safety margins
        const rect = this.panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let needsRepositioning = false;
        const safeMargin = 20;
        
        // Check if panel is outside safe viewport bounds
        if (rect.left < safeMargin || 
            rect.right > viewportWidth - safeMargin || 
            rect.top < safeMargin || 
            rect.bottom > viewportHeight - safeMargin) {
            needsRepositioning = true;
        }
        
        // Check if current position is still valid for viewport size
        if (this.currentPosition.includes('side-') && viewportWidth <= 768) {
            needsRepositioning = true;
        }
        
        // Check if panel is too wide for side positions
        if (this.currentPosition.includes('side-') && 
            rect.width > viewportWidth * 0.4) {
            needsRepositioning = true;
        }
        
        if (needsRepositioning) {
            // Force repositioning to a safe position with viewport awareness
            if (viewportWidth <= 768) {
                // Mobile: always bottom-center
                this.setPosition('bottom-center');
            } else if (viewportWidth <= 1024) {
                // Tablet: prefer bottom positions
                if (this.currentPosition.includes('left')) {
                    this.setPosition('bottom-left');
                } else if (this.currentPosition.includes('right')) {
                    this.setPosition('bottom-right');
                } else {
                    this.setPosition('bottom-center');
                }
            } else {
                // Desktop: try to maintain similar position but ensure it fits
                const validPosition = this.validatePositionForViewport(this.currentPosition);
                this.setPosition(validPosition);
            }
        }
        
        // Ensure z-index is maintained after repositioning
        this.panel.style.zIndex = '50';
    }
    
    debounceViewportUpdate() {
        // Debounce viewport updates to improve performance
        if (this.viewportUpdateTimeout) {
            clearTimeout(this.viewportUpdateTimeout);
        }
        
        this.viewportUpdateTimeout = setTimeout(() => {
            this.updateViewportAwareness();
        }, 150);
    }
    
    disableDragOnMobile() {
        // Hide drag handle on mobile
        if (this.dragHandle) {
            this.dragHandle.style.display = 'none';
        }
        
        // Disable drag functionality
        this.isDragEnabled = false;
    }
    
    enableDragForDesktop() {
        // Show drag handle on desktop/tablet
        if (this.dragHandle) {
            this.dragHandle.style.display = 'block';
        }
        
        // Enable drag functionality
        this.isDragEnabled = true;
    }
    
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.panel.classList.add('collapsed');
            this.controlButtons.collapse.innerHTML = '<i class="fas fa-chevron-down"></i>';
            this.controlButtons.collapse.title = 'Expandir Painel';
        } else {
            this.panel.classList.remove('collapsed');
            this.controlButtons.collapse.innerHTML = '<i class="fas fa-chevron-up"></i>';
            this.controlButtons.collapse.title = 'Colapsar Painel';
        }
        
        this.saveState();
        
        // Trigger custom event
        this.panel.dispatchEvent(new CustomEvent('panelToggle', {
            detail: { collapsed: this.isCollapsed }
        }));
    }
    
    cyclePosition() {
        const positions = ['bottom-center', 'bottom-left', 'bottom-right', 'side-left', 'side-right'];
        const currentIndex = positions.indexOf(this.currentPosition);
        const nextIndex = (currentIndex + 1) % positions.length;
        
        this.setPosition(positions[nextIndex]);
        this.saveState();
    }
    
    setPosition(position) {
        // Remove all position classes
        this.panel.classList.remove(
            'position-bottom-left', 
            'position-bottom-right', 
            'position-side-left', 
            'position-side-right'
        );
        
        // Reset inline styles but maintain z-index
        this.panel.style.left = '';
        this.panel.style.top = '';
        this.panel.style.right = '';
        this.panel.style.bottom = '';
        this.panel.style.transform = '';
        
        // Remove visual feedback classes
        this.panel.classList.remove('near-edge');
        
        // Ensure z-index is maintained
        this.panel.style.zIndex = '50';
        
        // Validate position for current viewport
        const validPosition = this.validatePositionForViewport(position);
        this.currentPosition = validPosition;
        
        // Apply position with enhanced viewport awareness
        switch (validPosition) {
            case 'bottom-left':
                this.panel.classList.add('position-bottom-left');
                break;
            case 'bottom-right':
                this.panel.classList.add('position-bottom-right');
                break;
            case 'side-left':
                // Only apply if viewport is wide enough
                if (window.innerWidth > 768) {
                    this.panel.classList.add('position-side-left');
                } else {
                    // Fallback to bottom-center on narrow viewports
                    this.currentPosition = 'bottom-center';
                }
                break;
            case 'side-right':
                // Only apply if viewport is wide enough
                if (window.innerWidth > 768) {
                    this.panel.classList.add('position-side-right');
                } else {
                    // Fallback to bottom-center on narrow viewports
                    this.currentPosition = 'bottom-center';
                }
                break;
            default: // bottom-center
                // Default CSS positioning - no additional classes needed
                break;
        }
        
        // Trigger position change event for other components
        this.panel.dispatchEvent(new CustomEvent('positionChange', {
            detail: { position: this.currentPosition }
        }));
    }
    
    validatePositionForViewport(position) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Force bottom-center on mobile
        if (viewportWidth <= 768) {
            return 'bottom-center';
        }
        
        // Validate side positions for tablet and desktop
        if (position.includes('side-')) {
            // Check if viewport is wide enough for side positioning
            const minWidthForSide = 900; // Minimum width to allow side positioning
            if (viewportWidth < minWidthForSide) {
                // Convert side positions to bottom positions
                if (position === 'side-left') {
                    return 'bottom-left';
                } else if (position === 'side-right') {
                    return 'bottom-right';
                }
            }
        }
        
        return position;
    }
    
    toggleCompactMode() {
        this.isCompactMode = !this.isCompactMode;
        
        if (this.isCompactMode) {
            this.panel.classList.add('compact-mode');
            this.controlButtons.compact.classList.add('active');
            this.controlButtons.compact.title = 'Modo Normal';
        } else {
            this.panel.classList.remove('compact-mode');
            this.controlButtons.compact.classList.remove('active');
            this.controlButtons.compact.title = 'Modo Compacto';
        }
        
        this.saveState();
    }
    
    saveState() {
        const state = {
            collapsed: this.isCollapsed,
            position: this.currentPosition,
            compact: this.isCompactMode
        };
        
        localStorage.setItem('floatingPanelState', JSON.stringify(state));
    }
    
    loadSavedState() {
        try {
            const savedState = localStorage.getItem('floatingPanelState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                if (state.collapsed) {
                    this.toggleCollapse();
                }
                
                if (state.position) {
                    this.setPosition(state.position);
                }
                
                if (state.compact) {
                    this.toggleCompactMode();
                }
            }
        } catch (error) {
            console.warn('Failed to load floating panel state:', error);
        }
    }
    
    setupElementControlsIntegration() {
        // Listen for element controls organizer events
        this.panel.addEventListener('categoryToggle', (e) => {
            this.handleCategoryToggle(e.detail);
        });
        
        // Sync compact mode with element controls organizer
        this.panel.addEventListener('compactModeChange', (e) => {
            if (e.detail.enabled !== this.isCompactMode) {
                this.toggleCompactMode();
            }
        });
    }
    
    handleCategoryToggle(detail) {
        // Adjust panel height based on collapsed categories
        const collapsedCount = detail.collapsedCategories.length;
        const totalCategories = 6; // Total number of categories
        
        if (collapsedCount > totalCategories / 2) {
            // Many categories collapsed, make panel more compact
            this.panel.style.maxHeight = '45vh';
        } else {
            // Normal height
            this.panel.style.maxHeight = '65vh';
        }
    }
    
    // Public API methods
    collapse() {
        if (!this.isCollapsed) {
            this.toggleCollapse();
        }
    }
    
    expand() {
        if (this.isCollapsed) {
            this.toggleCollapse();
        }
    }
    
    setCompactMode(enabled) {
        if (this.isCompactMode !== enabled) {
            this.toggleCompactMode();
        }
        
        // Notify element controls organizer
        if (window.elementControlsOrganizer) {
            window.elementControlsOrganizer.setCompactMode(enabled);
        }
    }
    
    getState() {
        return {
            collapsed: this.isCollapsed,
            position: this.currentPosition,
            compact: this.isCompactMode
        };
    }
    
    // Cleanup method for proper resource management
    destroy() {
        // Disconnect z-index observer
        if (this.zIndexObserver) {
            this.zIndexObserver.disconnect();
        }
        
        // Clear viewport update timeout
        if (this.viewportUpdateTimeout) {
            clearTimeout(this.viewportUpdateTimeout);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.debounceViewportUpdate);
        
        // Remove panel from DOM if needed
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to initialize
    setTimeout(() => {
        window.floatingControlsPanel = new FloatingControlsPanel();
        
        // Add to global scope for debugging
        if (window.DEBUG) {
            console.log('Floating Controls Panel initialized:', window.floatingControlsPanel);
        }
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloatingControlsPanel;
}