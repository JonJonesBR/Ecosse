/**
 * Layout Configuration System - Task 10: Create layout configuration system
 * 
 * This class manages user preferences for panel positions and visibility,
 * provides layout presets (compact, full, presentation mode), and creates
 * a settings panel for layout customization.
 * 
 * Requirements addressed:
 * - 5.1: Layout reorganizes for smaller screens
 * - 5.2: Elements reposition automatically when window is resized
 * - 5.3: Maximized planet rendering area when layout adapts
 */

export class LayoutConfigurationSystem {
    constructor() {
        this.isInitialized = false;
        this.storageKey = 'ecosse_layout_config';
        this.settingsPanel = null;
        this.currentPreset = 'default';
        
        // Default configuration
        this.defaultConfig = {
            panels: {
                left: {
                    visible: true,
                    width: 280,
                    position: 'left',
                    minimized: false
                },
                right: {
                    visible: true,
                    width: 280,
                    position: 'right',
                    minimized: false
                },
                controls: {
                    position: 'bottom-center',
                    collapsed: false,
                    compact: false,
                    draggable: true
                }
            },
            canvas: {
                autoResize: true,
                maintainAspectRatio: true,
                maxWidth: '100%',
                maxHeight: '100%'
            },
            animations: {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            responsive: {
                breakpoints: {
                    mobile: 768,
                    tablet: 1024,
                    desktop: 1440
                },
                autoAdapt: true
            }
        };
        
        // Layout presets
        this.presets = {
            default: {
                name: 'Padrão',
                description: 'Layout balanceado com todos os painéis visíveis',
                config: { ...this.defaultConfig }
            },
            compact: {
                name: 'Compacto',
                description: 'Layout otimizado para telas menores',
                config: {
                    ...this.defaultConfig,
                    panels: {
                        ...this.defaultConfig.panels,
                        left: { ...this.defaultConfig.panels.left, minimized: true },
                        right: { ...this.defaultConfig.panels.right, minimized: true },
                        controls: { ...this.defaultConfig.panels.controls, compact: true }
                    }
                }
            },
            full: {
                name: 'Completo',
                description: 'Todos os painéis expandidos para máxima funcionalidade',
                config: {
                    ...this.defaultConfig,
                    panels: {
                        ...this.defaultConfig.panels,
                        left: { ...this.defaultConfig.panels.left, width: 320 },
                        right: { ...this.defaultConfig.panels.right, width: 320 }
                    }
                }
            },
            presentation: {
                name: 'Apresentação',
                description: 'Foco máximo no planeta, painéis ocultos',
                config: {
                    ...this.defaultConfig,
                    panels: {
                        ...this.defaultConfig.panels,
                        left: { ...this.defaultConfig.panels.left, visible: false },
                        right: { ...this.defaultConfig.panels.right, visible: false },
                        controls: { ...this.defaultConfig.panels.controls, collapsed: true }
                    }
                }
            }
        };
        
        this.currentConfig = { ...this.defaultConfig };
        
        // Bind methods
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
    }

    /**
     * Initialize the layout configuration system
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('LayoutConfigurationSystem already initialized');
            return;
        }

        console.log('⚙️ Initializing Layout Configuration System...');

        // Load saved configuration
        this.loadConfiguration();
        
        // Create settings panel
        this.createSettingsPanel();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply current configuration
        this.applyConfiguration();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        this.isInitialized = true;
        console.log('✅ Layout Configuration System initialized');
    }

    /**
     * Load configuration from localStorage
     */
    loadConfiguration() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const savedConfig = JSON.parse(saved);
                this.currentConfig = this.mergeConfigurations(this.defaultConfig, savedConfig.config);
                this.currentPreset = savedConfig.preset || 'default';
                console.log('📂 Loaded layout configuration:', this.currentPreset);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load layout configuration:', error);
            this.currentConfig = { ...this.defaultConfig };
            this.currentPreset = 'default';
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfiguration() {
        try {
            const configToSave = {
                preset: this.currentPreset,
                config: this.currentConfig,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(configToSave));
            console.log('💾 Layout configuration saved');
        } catch (error) {
            console.warn('⚠️ Failed to save layout configuration:', error);
        }
    }

    /**
     * Create settings panel for layout customization
     */
    createSettingsPanel() {
        // Create settings panel container
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.id = 'layout-settings-panel';
        this.settingsPanel.className = 'settings-panel hidden';
        
        // Create panel content
        this.settingsPanel.innerHTML = `
            <div class="settings-header">
                <h3>⚙️ Configurações de Layout</h3>
                <button class="close-btn" id="close-settings">×</button>
            </div>
            
            <div class="settings-content">
                <!-- Preset Selection -->
                <div class="settings-section">
                    <h4>Presets de Layout</h4>
                    <div class="preset-buttons">
                        ${Object.entries(this.presets).map(([key, preset]) => `
                            <button class="preset-btn" data-preset="${key}">
                                <div class="preset-name">${preset.name}</div>
                                <div class="preset-description">${preset.description}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Panel Configuration -->
                <div class="settings-section">
                    <h4>Configuração de Painéis</h4>
                    
                    <!-- Left Panel -->
                    <div class="panel-config">
                        <h5>Painel Esquerdo</h5>
                        <label class="checkbox-label">
                            <input type="checkbox" id="left-panel-visible" ${this.currentConfig.panels.left.visible ? 'checked' : ''}>
                            Visível
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="left-panel-minimized" ${this.currentConfig.panels.left.minimized ? 'checked' : ''}>
                            Minimizado
                        </label>
                        <label class="range-label">
                            Largura: <span id="left-panel-width-value">${this.currentConfig.panels.left.width}px</span>
                            <input type="range" id="left-panel-width" min="200" max="400" value="${this.currentConfig.panels.left.width}">
                        </label>
                    </div>
                    
                    <!-- Right Panel -->
                    <div class="panel-config">
                        <h5>Painel Direito</h5>
                        <label class="checkbox-label">
                            <input type="checkbox" id="right-panel-visible" ${this.currentConfig.panels.right.visible ? 'checked' : ''}>
                            Visível
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="right-panel-minimized" ${this.currentConfig.panels.right.minimized ? 'checked' : ''}>
                            Minimizado
                        </label>
                        <label class="range-label">
                            Largura: <span id="right-panel-width-value">${this.currentConfig.panels.right.width}px</span>
                            <input type="range" id="right-panel-width" min="200" max="400" value="${this.currentConfig.panels.right.width}">
                        </label>
                    </div>
                    
                    <!-- Controls Panel -->
                    <div class="panel-config">
                        <h5>Painel de Controles</h5>
                        <label class="select-label">
                            Posição:
                            <select id="controls-position">
                                <option value="bottom-center" ${this.currentConfig.panels.controls.position === 'bottom-center' ? 'selected' : ''}>Centro Inferior</option>
                                <option value="bottom-left" ${this.currentConfig.panels.controls.position === 'bottom-left' ? 'selected' : ''}>Esquerda Inferior</option>
                                <option value="bottom-right" ${this.currentConfig.panels.controls.position === 'bottom-right' ? 'selected' : ''}>Direita Inferior</option>
                                <option value="side-left" ${this.currentConfig.panels.controls.position === 'side-left' ? 'selected' : ''}>Lateral Esquerda</option>
                                <option value="side-right" ${this.currentConfig.panels.controls.position === 'side-right' ? 'selected' : ''}>Lateral Direita</option>
                            </select>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="controls-collapsed" ${this.currentConfig.panels.controls.collapsed ? 'checked' : ''}>
                            Colapsado
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="controls-compact" ${this.currentConfig.panels.controls.compact ? 'checked' : ''}>
                            Modo Compacto
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="controls-draggable" ${this.currentConfig.panels.controls.draggable ? 'checked' : ''}>
                            Arrastável
                        </label>
                    </div>
                </div>
                
                <!-- Canvas Configuration -->
                <div class="settings-section">
                    <h4>Configuração do Canvas</h4>
                    <label class="checkbox-label">
                        <input type="checkbox" id="canvas-auto-resize" ${this.currentConfig.canvas.autoResize ? 'checked' : ''}>
                        Redimensionamento Automático
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="canvas-maintain-aspect" ${this.currentConfig.canvas.maintainAspectRatio ? 'checked' : ''}>
                        Manter Proporção
                    </label>
                </div>
                
                <!-- Animation Configuration -->
                <div class="settings-section">
                    <h4>Configuração de Animações</h4>
                    <label class="checkbox-label">
                        <input type="checkbox" id="animations-enabled" ${this.currentConfig.animations.enabled ? 'checked' : ''}>
                        Animações Habilitadas
                    </label>
                    <label class="range-label">
                        Duração: <span id="animation-duration-value">${this.currentConfig.animations.duration}ms</span>
                        <input type="range" id="animation-duration" min="100" max="1000" step="50" value="${this.currentConfig.animations.duration}">
                    </label>
                </div>
                
                <!-- Responsive Configuration -->
                <div class="settings-section">
                    <h4>Configuração Responsiva</h4>
                    <label class="checkbox-label">
                        <input type="checkbox" id="responsive-auto-adapt" ${this.currentConfig.responsive.autoAdapt ? 'checked' : ''}>
                        Adaptação Automática
                    </label>
                </div>
            </div>
            
            <div class="settings-footer">
                <button class="btn btn-secondary" id="reset-to-default">Restaurar Padrão</button>
                <button class="btn btn-primary" id="apply-settings">Aplicar</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(this.settingsPanel);
        
        // Set up settings panel event listeners
        this.setupSettingsPanelEvents();
    }    
/**
     * Set up settings panel event listeners
     */
    setupSettingsPanelEvents() {
        // Close button
        const closeBtn = this.settingsPanel.querySelector('#close-settings');
        closeBtn.addEventListener('click', () => this.hideSettingsPanel());
        
        // Preset buttons
        const presetButtons = this.settingsPanel.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
                this.updateSettingsUI();
            });
        });
        
        // Panel configuration inputs
        this.setupPanelConfigInputs();
        
        // Canvas configuration inputs
        this.setupCanvasConfigInputs();
        
        // Animation configuration inputs
        this.setupAnimationConfigInputs();
        
        // Responsive configuration inputs
        this.setupResponsiveConfigInputs();
        
        // Footer buttons
        const resetBtn = this.settingsPanel.querySelector('#reset-to-default');
        const applyBtn = this.settingsPanel.querySelector('#apply-settings');
        
        resetBtn.addEventListener('click', () => this.resetToDefault());
        applyBtn.addEventListener('click', () => this.applyAndSaveConfiguration());
    }

    /**
     * Set up panel configuration inputs
     */
    setupPanelConfigInputs() {
        // Left panel inputs
        const leftVisible = this.settingsPanel.querySelector('#left-panel-visible');
        const leftMinimized = this.settingsPanel.querySelector('#left-panel-minimized');
        const leftWidth = this.settingsPanel.querySelector('#left-panel-width');
        const leftWidthValue = this.settingsPanel.querySelector('#left-panel-width-value');
        
        leftVisible.addEventListener('change', (e) => {
            this.currentConfig.panels.left.visible = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        leftMinimized.addEventListener('change', (e) => {
            this.currentConfig.panels.left.minimized = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        leftWidth.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.currentConfig.panels.left.width = value;
            leftWidthValue.textContent = `${value}px`;
            this.currentPreset = 'custom';
        });
        
        // Right panel inputs
        const rightVisible = this.settingsPanel.querySelector('#right-panel-visible');
        const rightMinimized = this.settingsPanel.querySelector('#right-panel-minimized');
        const rightWidth = this.settingsPanel.querySelector('#right-panel-width');
        const rightWidthValue = this.settingsPanel.querySelector('#right-panel-width-value');
        
        rightVisible.addEventListener('change', (e) => {
            this.currentConfig.panels.right.visible = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        rightMinimized.addEventListener('change', (e) => {
            this.currentConfig.panels.right.minimized = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        rightWidth.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.currentConfig.panels.right.width = value;
            rightWidthValue.textContent = `${value}px`;
            this.currentPreset = 'custom';
        });
        
        // Controls panel inputs
        const controlsPosition = this.settingsPanel.querySelector('#controls-position');
        const controlsCollapsed = this.settingsPanel.querySelector('#controls-collapsed');
        const controlsCompact = this.settingsPanel.querySelector('#controls-compact');
        const controlsDraggable = this.settingsPanel.querySelector('#controls-draggable');
        
        controlsPosition.addEventListener('change', (e) => {
            this.currentConfig.panels.controls.position = e.target.value;
            this.currentPreset = 'custom';
        });
        
        controlsCollapsed.addEventListener('change', (e) => {
            this.currentConfig.panels.controls.collapsed = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        controlsCompact.addEventListener('change', (e) => {
            this.currentConfig.panels.controls.compact = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        controlsDraggable.addEventListener('change', (e) => {
            this.currentConfig.panels.controls.draggable = e.target.checked;
            this.currentPreset = 'custom';
        });
    }

    /**
     * Set up canvas configuration inputs
     */
    setupCanvasConfigInputs() {
        const autoResize = this.settingsPanel.querySelector('#canvas-auto-resize');
        const maintainAspect = this.settingsPanel.querySelector('#canvas-maintain-aspect');
        
        autoResize.addEventListener('change', (e) => {
            this.currentConfig.canvas.autoResize = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        maintainAspect.addEventListener('change', (e) => {
            this.currentConfig.canvas.maintainAspectRatio = e.target.checked;
            this.currentPreset = 'custom';
        });
    }

    /**
     * Set up animation configuration inputs
     */
    setupAnimationConfigInputs() {
        const animationsEnabled = this.settingsPanel.querySelector('#animations-enabled');
        const animationDuration = this.settingsPanel.querySelector('#animation-duration');
        const durationValue = this.settingsPanel.querySelector('#animation-duration-value');
        
        animationsEnabled.addEventListener('change', (e) => {
            this.currentConfig.animations.enabled = e.target.checked;
            this.currentPreset = 'custom';
        });
        
        animationDuration.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.currentConfig.animations.duration = value;
            durationValue.textContent = `${value}ms`;
            this.currentPreset = 'custom';
        });
    }

    /**
     * Set up responsive configuration inputs
     */
    setupResponsiveConfigInputs() {
        const autoAdapt = this.settingsPanel.querySelector('#responsive-auto-adapt');
        
        autoAdapt.addEventListener('change', (e) => {
            this.currentConfig.responsive.autoAdapt = e.target.checked;
            this.currentPreset = 'custom';
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for panel state changes
        document.addEventListener('panelStateChanged', (e) => {
            this.handlePanelStateChange(e.detail);
        });
        
        // Listen for viewport changes
        document.addEventListener('viewportChanged', (e) => {
            this.handleViewportChange(e.detail);
        });
        
        // Listen for floating panel changes
        document.addEventListener('panelToggle', (e) => {
            this.handleFloatingPanelChange(e.detail);
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+Shift+S: Open settings panel
        if (e.key === 'S' && e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            this.showSettingsPanel();
        }
        
        // Ctrl+Shift+1-4: Apply presets
        if (e.ctrlKey && e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            const presets = ['default', 'compact', 'full', 'presentation'];
            const presetIndex = parseInt(e.key) - 1;
            if (presets[presetIndex]) {
                this.applyPreset(presets[presetIndex]);
            }
        }
    }

    /**
     * Apply preset configuration
     */
    applyPreset(presetName) {
        if (!this.presets[presetName]) {
            console.warn(`Preset ${presetName} not found`);
            return;
        }
        
        console.log(`🎨 Applying preset: ${presetName}`);
        
        this.currentPreset = presetName;
        this.currentConfig = JSON.parse(JSON.stringify(this.presets[presetName].config));
        
        this.applyConfiguration();
        this.saveConfiguration();
        
        // Update active preset button
        this.updatePresetButtons();
        
        // Dispatch event
        this.dispatchConfigurationChangeEvent('preset', presetName);
    }

    /**
     * Apply current configuration to the UI
     */
    applyConfiguration() {
        console.log('⚙️ Applying layout configuration...');
        
        // Apply panel configurations
        this.applyPanelConfiguration();
        
        // Apply canvas configuration
        this.applyCanvasConfiguration();
        
        // Apply animation configuration
        this.applyAnimationConfiguration();
        
        // Apply responsive configuration
        this.applyResponsiveConfiguration();
        
        console.log('✅ Layout configuration applied');
    }

    /**
     * Apply panel configuration
     */
    applyPanelConfiguration() {
        // Apply left panel configuration
        if (window.panelVisibilityManager) {
            const leftState = this.currentConfig.panels.left.visible ? 
                (this.currentConfig.panels.left.minimized ? 'minimized' : 'visible') : 'hidden';
            window.panelVisibilityManager.setPanelState('left', leftState, true);
        }
        
        // Apply right panel configuration
        if (window.panelVisibilityManager) {
            const rightState = this.currentConfig.panels.right.visible ? 
                (this.currentConfig.panels.right.minimized ? 'minimized' : 'visible') : 'hidden';
            window.panelVisibilityManager.setPanelState('right', rightState, true);
        }
        
        // Apply panel widths
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (leftPanel && this.currentConfig.panels.left.visible && !this.currentConfig.panels.left.minimized) {
            leftPanel.style.width = `${this.currentConfig.panels.left.width}px`;
        }
        
        if (rightPanel && this.currentConfig.panels.right.visible && !this.currentConfig.panels.right.minimized) {
            rightPanel.style.width = `${this.currentConfig.panels.right.width}px`;
        }
        
        // Apply controls panel configuration
        if (window.floatingControlsPanel) {
            const controlsConfig = this.currentConfig.panels.controls;
            
            window.floatingControlsPanel.setPosition(controlsConfig.position);
            
            if (controlsConfig.collapsed) {
                window.floatingControlsPanel.collapse();
            } else {
                window.floatingControlsPanel.expand();
            }
            
            window.floatingControlsPanel.setCompactMode(controlsConfig.compact);
        }
    }

    /**
     * Apply canvas configuration
     */
    applyCanvasConfiguration() {
        if (window.responsiveCanvasContainer) {
            const canvasConfig = this.currentConfig.canvas;
            
            // Validate and update canvas auto-resize setting
            if (this.validateCanvasMethod('setAutoResize')) {
                window.responsiveCanvasContainer.setAutoResize(canvasConfig.autoResize);
            }
            
            // Validate and update aspect ratio maintenance
            if (this.validateCanvasMethod('setMaintainAspectRatio')) {
                window.responsiveCanvasContainer.setMaintainAspectRatio(canvasConfig.maintainAspectRatio);
            }
            
            // Trigger canvas resize if auto-resize is enabled
            if (canvasConfig.autoResize && this.validateCanvasMethod('forceResize')) {
                window.responsiveCanvasContainer.forceResize();
            }
        }
    }

    /**
     * Validate that a method exists on the responsive canvas container
     * @param {string} methodName - Name of the method to validate
     * @returns {boolean} True if method exists and is callable
     */
    validateCanvasMethod(methodName) {
        if (!window.responsiveCanvasContainer) {
            console.warn(`ResponsiveCanvasContainer not available for method: ${methodName}`);
            this.handleMissingCanvasContainer();
            return false;
        }

        if (typeof window.responsiveCanvasContainer[methodName] !== 'function') {
            console.warn(`ResponsiveCanvasContainer method '${methodName}' is not available or not a function`);
            this.handleMissingCanvasMethod(methodName);
            return false;
        }

        return true;
    }

    /**
     * Handle missing canvas container by providing fallback behavior
     */
    handleMissingCanvasContainer() {
        console.warn('⚠️ ResponsiveCanvasContainer not found - layout configuration may not work properly');
        
        // Dispatch event to notify other systems
        document.dispatchEvent(new CustomEvent('canvasContainerMissing', {
            detail: { 
                timestamp: Date.now(),
                source: 'LayoutConfigurationSystem'
            }
        }));
    }

    /**
     * Handle missing canvas method by providing fallback or stub implementation
     * @param {string} methodName - Name of the missing method
     */
    handleMissingCanvasMethod(methodName) {
        console.warn(`⚠️ ResponsiveCanvasContainer method '${methodName}' missing - attempting fallback`);
        
        // Provide fallback implementations for critical methods
        switch (methodName) {
            case 'setAutoResize':
                console.log('📝 Using fallback: Auto-resize setting ignored');
                break;
            case 'setMaintainAspectRatio':
                console.log('📝 Using fallback: Aspect ratio maintenance setting ignored');
                break;
            case 'forceResize':
                console.log('📝 Using fallback: Manual canvas resize triggered');
                this.triggerManualCanvasResize();
                break;
            case 'updateCanvasSize':
                console.log('📝 Using fallback: Manual canvas size update triggered');
                this.triggerManualCanvasResize();
                break;
            default:
                console.log(`📝 No fallback available for method: ${methodName}`);
        }
        
        // Dispatch event to notify other systems
        document.dispatchEvent(new CustomEvent('canvasMethodMissing', {
            detail: { 
                methodName,
                timestamp: Date.now(),
                source: 'LayoutConfigurationSystem'
            }
        }));
    }

    /**
     * Trigger manual canvas resize as fallback
     */
    triggerManualCanvasResize() {
        try {
            // Try to find canvas element and trigger resize
            const canvas = document.querySelector('canvas');
            if (canvas && canvas.parentElement) {
                const container = canvas.parentElement;
                const rect = container.getBoundingClientRect();
                
                // Update canvas size directly
                canvas.width = rect.width;
                canvas.height = rect.height;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                
                console.log(`📐 Manual canvas resize: ${rect.width}x${rect.height}`);
                
                // Dispatch resize event
                window.dispatchEvent(new Event('resize'));
            }
        } catch (error) {
            console.warn('⚠️ Manual canvas resize failed:', error);
        }
    }

    /**
     * Apply animation configuration
     */
    applyAnimationConfiguration() {
        const animConfig = this.currentConfig.animations;
        
        // Update CSS custom properties for animations
        document.documentElement.style.setProperty('--animation-duration', `${animConfig.duration}ms`);
        document.documentElement.style.setProperty('--animation-easing', animConfig.easing);
        
        // Enable/disable animations globally
        if (animConfig.enabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    }

    /**
     * Apply responsive configuration
     */
    applyResponsiveConfiguration() {
        if (window.adaptiveUIController) {
            const responsiveConfig = this.currentConfig.responsive;
            
            // Update breakpoints if needed
            window.adaptiveUIController.breakpoints = responsiveConfig.breakpoints;
            
            // Enable/disable auto-adaptation
            if (responsiveConfig.autoAdapt) {
                window.adaptiveUIController.forceLayoutUpdate();
            }
        }
    }

    /**
     * Show settings panel
     */
    showSettingsPanel() {
        this.settingsPanel.classList.remove('hidden');
        this.updateSettingsUI();
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'settings-backdrop';
        backdrop.addEventListener('click', () => this.hideSettingsPanel());
        document.body.appendChild(backdrop);
        
        console.log('⚙️ Settings panel opened');
    }

    /**
     * Hide settings panel
     */
    hideSettingsPanel() {
        this.settingsPanel.classList.add('hidden');
        
        // Remove backdrop
        const backdrop = document.querySelector('.settings-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        console.log('⚙️ Settings panel closed');
    }

    /**
     * Update settings UI to reflect current configuration
     */
    updateSettingsUI() {
        // Update preset buttons
        this.updatePresetButtons();
        
        // Update panel configuration inputs
        this.updatePanelConfigInputs();
        
        // Update canvas configuration inputs
        this.updateCanvasConfigInputs();
        
        // Update animation configuration inputs
        this.updateAnimationConfigInputs();
        
        // Update responsive configuration inputs
        this.updateResponsiveConfigInputs();
    }

    /**
     * Update preset buttons
     */
    updatePresetButtons() {
        const presetButtons = this.settingsPanel.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.preset === this.currentPreset) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Update panel configuration inputs
     */
    updatePanelConfigInputs() {
        // Left panel
        this.settingsPanel.querySelector('#left-panel-visible').checked = this.currentConfig.panels.left.visible;
        this.settingsPanel.querySelector('#left-panel-minimized').checked = this.currentConfig.panels.left.minimized;
        this.settingsPanel.querySelector('#left-panel-width').value = this.currentConfig.panels.left.width;
        this.settingsPanel.querySelector('#left-panel-width-value').textContent = `${this.currentConfig.panels.left.width}px`;
        
        // Right panel
        this.settingsPanel.querySelector('#right-panel-visible').checked = this.currentConfig.panels.right.visible;
        this.settingsPanel.querySelector('#right-panel-minimized').checked = this.currentConfig.panels.right.minimized;
        this.settingsPanel.querySelector('#right-panel-width').value = this.currentConfig.panels.right.width;
        this.settingsPanel.querySelector('#right-panel-width-value').textContent = `${this.currentConfig.panels.right.width}px`;
        
        // Controls panel
        this.settingsPanel.querySelector('#controls-position').value = this.currentConfig.panels.controls.position;
        this.settingsPanel.querySelector('#controls-collapsed').checked = this.currentConfig.panels.controls.collapsed;
        this.settingsPanel.querySelector('#controls-compact').checked = this.currentConfig.panels.controls.compact;
        this.settingsPanel.querySelector('#controls-draggable').checked = this.currentConfig.panels.controls.draggable;
    }

    /**
     * Update canvas configuration inputs
     */
    updateCanvasConfigInputs() {
        this.settingsPanel.querySelector('#canvas-auto-resize').checked = this.currentConfig.canvas.autoResize;
        this.settingsPanel.querySelector('#canvas-maintain-aspect').checked = this.currentConfig.canvas.maintainAspectRatio;
    }

    /**
     * Update animation configuration inputs
     */
    updateAnimationConfigInputs() {
        this.settingsPanel.querySelector('#animations-enabled').checked = this.currentConfig.animations.enabled;
        this.settingsPanel.querySelector('#animation-duration').value = this.currentConfig.animations.duration;
        this.settingsPanel.querySelector('#animation-duration-value').textContent = `${this.currentConfig.animations.duration}ms`;
    }

    /**
     * Update responsive configuration inputs
     */
    updateResponsiveConfigInputs() {
        this.settingsPanel.querySelector('#responsive-auto-adapt').checked = this.currentConfig.responsive.autoAdapt;
    }

    /**
     * Reset to default configuration
     */
    resetToDefault() {
        this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig));
        this.currentPreset = 'default';
        
        this.updateSettingsUI();
        this.applyConfiguration();
        this.saveConfiguration();
        
        console.log('🔄 Configuration reset to default');
    }

    /**
     * Apply and save current configuration
     */
    applyAndSaveConfiguration() {
        this.applyConfiguration();
        this.saveConfiguration();
        this.hideSettingsPanel();
        
        console.log('✅ Configuration applied and saved');
    }

    /**
     * Handle panel state changes from other systems
     */
    handlePanelStateChange(detail) {
        const { panelName, newState } = detail;
        
        if (panelName === 'left') {
            this.currentConfig.panels.left.visible = newState !== 'hidden';
            this.currentConfig.panels.left.minimized = newState === 'minimized';
        } else if (panelName === 'right') {
            this.currentConfig.panels.right.visible = newState !== 'hidden';
            this.currentConfig.panels.right.minimized = newState === 'minimized';
        }
        
        this.currentPreset = 'custom';
        this.saveConfiguration();
    }

    /**
     * Handle viewport changes
     */
    handleViewportChange(detail) {
        if (this.currentConfig.responsive.autoAdapt) {
            // Auto-adapt configuration based on viewport
            const { to: viewport } = detail;
            
            if (viewport === 'mobile' && this.currentPreset !== 'presentation') {
                // Temporarily apply compact-like settings for mobile
                this.applyTemporaryMobileConfiguration();
            }
        }
    }

    /**
     * Apply temporary mobile configuration
     */
    applyTemporaryMobileConfiguration() {
        // Minimize panels on mobile for better space utilization
        if (window.panelVisibilityManager) {
            window.panelVisibilityManager.setPanelState('left', 'minimized', true);
            window.panelVisibilityManager.setPanelState('right', 'minimized', true);
        }
        
        // Enable compact mode for controls
        if (window.floatingControlsPanel) {
            window.floatingControlsPanel.setCompactMode(true);
        }
    }

    /**
     * Handle floating panel changes
     */
    handleFloatingPanelChange(detail) {
        this.currentConfig.panels.controls.collapsed = detail.collapsed;
        this.currentPreset = 'custom';
        this.saveConfiguration();
    }

    /**
     * Merge configurations (deep merge)
     */
    mergeConfigurations(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        merge(result, source);
        return result;
    }

    /**
     * Dispatch configuration change event
     */
    dispatchConfigurationChangeEvent(type, value) {
        const event = new CustomEvent('layoutConfigurationChanged', {
            detail: {
                type,
                value,
                preset: this.currentPreset,
                config: this.currentConfig,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get current configuration
     */
    getCurrentConfiguration() {
        return JSON.parse(JSON.stringify(this.currentConfig));
    }

    /**
     * Get current preset
     */
    getCurrentPreset() {
        return this.currentPreset;
    }

    /**
     * Get available presets
     */
    getAvailablePresets() {
        return Object.keys(this.presets);
    }

    /**
     * Create settings toggle button
     */
    createSettingsToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'layout-settings-toggle';
        toggleButton.className = 'settings-toggle-btn';
        toggleButton.innerHTML = '⚙️';
        toggleButton.title = 'Configurações de Layout (Ctrl+Shift+S)';
        
        toggleButton.addEventListener('click', () => this.showSettingsPanel());
        
        // Add to top panel or create floating button
        const topPanel = document.getElementById('top-panel');
        if (topPanel) {
            topPanel.appendChild(toggleButton);
        } else {
            toggleButton.classList.add('floating-settings-btn');
            document.body.appendChild(toggleButton);
        }
        
        return toggleButton;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Remove settings panel
        if (this.settingsPanel && this.settingsPanel.parentNode) {
            this.settingsPanel.parentNode.removeChild(this.settingsPanel);
        }
        
        // Remove backdrop if exists
        const backdrop = document.querySelector('.settings-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Clear references
        this.settingsPanel = null;
        this.isInitialized = false;
        
        console.log('LayoutConfigurationSystem disposed');
    }
}

// Create and export singleton instance
export const layoutConfigurationSystem = new LayoutConfigurationSystem();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutConfigurationSystem = layoutConfigurationSystem;
    console.log('🔧 Layout Configuration System available globally');
}