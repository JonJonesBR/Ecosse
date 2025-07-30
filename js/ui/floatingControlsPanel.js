/**
 * Simplified Floating Controls Panel Management
 * Handles basic floating bottom panel behavior
 * Requirements: 2.1, 2.2, 4.1, 4.2
 */

class FloatingControlsPanel {
    constructor() {
        this.panel = null;
        this.toggleButton = null;
        this.isCollapsed = false;
        this.isInitialized = false;
    }
    
    init() {
        console.log('🎛️ Initializing Floating Controls Panel...');
        
        try {
            this.panel = document.getElementById('bottom-panel');
            if (!this.panel) {
                console.warn('⚠️ Bottom panel element not found, skipping floating controls initialization');
                return false;
            }
            
            this.setupBasicToggle();
            this.setupKeyboardShortcuts();
            this.isInitialized = true;
            
            console.log('✅ Floating Controls Panel initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Floating Controls Panel:', error);
            return false;
        }
    }
    
    /**
     * Create and setup basic toggle functionality
     */
    setupBasicToggle() {
        // Create simple toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'floating-panel-toggle';
        this.toggleButton.innerHTML = '−';
        this.toggleButton.title = 'Minimizar/Expandir Controles (Ctrl+Tab)';
        this.toggleButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(59, 130, 246, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            transition: background-color 0.2s ease;
        `;
        
        // Add hover effect
        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.background = 'rgba(59, 130, 246, 1)';
        });
        
        this.toggleButton.addEventListener('mouseleave', () => {
            this.toggleButton.style.background = 'rgba(59, 130, 246, 0.8)';
        });
        
        // Add to panel
        this.panel.style.position = 'relative';
        this.panel.appendChild(this.toggleButton);
        
        // Add click listener
        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Tab to toggle panel
            if (e.key === 'Tab' && e.ctrlKey) {
                e.preventDefault();
                this.toggleCollapse();
            }
            
            // Escape to collapse panel if expanded
            if (e.key === 'Escape' && !this.isCollapsed) {
                this.toggleCollapse();
            }
        });
    }
    
    /**
     * Toggle panel collapse state
     */
    toggleCollapse() {
        if (!this.panel || !this.toggleButton) return;
        
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.panel.classList.add('collapsed');
            this.toggleButton.innerHTML = '+';
            this.toggleButton.title = 'Expandir Controles (Ctrl+Tab)';
        } else {
            this.panel.classList.remove('collapsed');
            this.toggleButton.innerHTML = '−';
            this.toggleButton.title = 'Minimizar Controles (Ctrl+Tab)';
        }
        
        console.log(`🎛️ Panel ${this.isCollapsed ? 'collapsed' : 'expanded'}`);
    }
    
    /**
     * Get current panel state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isCollapsed: this.isCollapsed,
            panelExists: !!this.panel
        };
    }
}

// Create and export singleton instance
const floatingControlsPanel = new FloatingControlsPanel();

export { floatingControlsPanel };