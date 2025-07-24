// js/ui/selectionModes.js
import { eventSystem } from '../systems/eventSystem.js';
import { controlsManager } from './controlsManager.js';

/**
 * Advanced Selection Modes System
 * Provides different ways to select and manipulate elements
 */
export class SelectionModes {
    constructor() {
        this.currentMode = 'single';
        this.selectedElements = new Set();
        this.selectionHistory = [];
        this.selectionFilters = new Map();
        this.selectionBox = null;
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
        
        // Selection mode configurations
        this.modes = {
            single: {
                name: 'Seleção Única',
                description: 'Seleciona um elemento por vez',
                icon: '👆',
                shortcut: '1',
                allowMultiple: false,
                showPreview: true,
                handler: this.handleSingleSelection.bind(this)
            },
            area: {
                name: 'Seleção por Área',
                description: 'Arraste para selecionar múltiplos elementos em uma área',
                icon: '🔲',
                shortcut: '2',
                allowMultiple: true,
                showPreview: true,
                handler: this.handleAreaSelection.bind(this)
            },
            type: {
                name: 'Seleção por Tipo',
                description: 'Seleciona todos os elementos do mesmo tipo',
                icon: '🔗',
                shortcut: '3',
                allowMultiple: true,
                showPreview: false,
                handler: this.handleTypeSelection.bind(this)
            },
            properties: {
                name: 'Seleção por Propriedades',
                description: 'Seleciona elementos com propriedades similares',
                icon: '⚙️',
                shortcut: '4',
                allowMultiple: true,
                showPreview: false,
                handler: this.handlePropertiesSelection.bind(this)
            },
            smart: {
                name: 'Seleção Inteligente',
                description: 'Seleção baseada em contexto e relacionamentos',
                icon: '🧠',
                shortcut: '5',
                allowMultiple: true,
                showPreview: true,
                handler: this.handleSmartSelection.bind(this)
            },
            chain: {
                name: 'Seleção em Cadeia',
                description: 'Seleciona elementos conectados em uma cadeia alimentar',
                icon: '🔗',
                shortcut: '6',
                allowMultiple: true,
                showPreview: true,
                handler: this.handleChainSelection.bind(this)
            }
        };
        
        // Property filters for advanced selection
        this.propertyFilters = {
            health: { min: 0, max: 100, enabled: false },
            energy: { min: 0, max: 100, enabled: false },
            size: { min: 0, max: 10, enabled: false },
            age: { min: 0, max: 1000, enabled: false }
        };
    }

    /**
     * Initialize selection modes
     */
    initialize() {
        this.createSelectionUI();
        this.setupEventListeners();
        this.createSelectionBox();
        this.updateModeIndicator();
    }

    /**
     * Create selection UI elements
     */
    createSelectionUI() {
        this.createModeSelector();
        this.createSelectionInfo();
        this.createPropertyFilters();
    }

    /**
     * Create mode selector
     */
    createModeSelector() {
        const bottomPanel = document.getElementById('bottom-panel');
        if (!bottomPanel || document.getElementById('selection-mode-selector')) return;

        const selector = document.createElement('div');
        selector.id = 'selection-mode-selector';
        selector.className = 'selection-mode-selector';
        
        selector.innerHTML = `
            <div class="mode-selector-header">
                <h4>Modo de Seleção</h4>
                <button id="selection-settings-btn" class="btn-small">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            <div class="mode-buttons">
                ${Object.entries(this.modes).map(([key, mode]) => `
                    <button class="mode-btn ${key === this.currentMode ? 'active' : ''}" 
                            data-mode="${key}" 
                            title="${mode.description}">
                        <span class="mode-icon">${mode.icon}</span>
                        <span class="mode-name">${mode.name}</span>
                        <span class="mode-shortcut">${mode.shortcut}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Insert before element grid
        const elementGrid = bottomPanel.querySelector('.element-grid');
        if (elementGrid) {
            bottomPanel.insertBefore(selector, elementGrid);
        } else {
            bottomPanel.appendChild(selector);
        }
    }

    /**
     * Create selection info display
     */
    createSelectionInfo() {
        const rightPanel = document.getElementById('right-panel');
        if (!rightPanel || document.getElementById('selection-info')) return;

        const info = document.createElement('div');
        info.id = 'selection-info';
        info.className = 'selection-info';
        
        info.innerHTML = `
            <div class="selection-header">
                <h4>Seleção Atual</h4>
                <div class="selection-actions">
                    <button id="clear-selection-btn" class="btn-small" title="Limpar seleção">
                        <i class="fas fa-times"></i>
                    </button>
                    <button id="invert-selection-btn" class="btn-small" title="Inverter seleção">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>
            </div>
            <div class="selection-content">
                <div class="selection-count">
                    <span id="selected-count">0</span> elementos selecionados
                </div>
                <div class="selection-types" id="selection-types">
                    <!-- Selection type breakdown will be shown here -->
                </div>
                <div class="selection-stats" id="selection-stats">
                    <!-- Selection statistics will be shown here -->
                </div>
            </div>
        `;

        // Insert after simulation info panel
        const simInfo = rightPanel.querySelector('#simulation-info-panel');
        if (simInfo) {
            rightPanel.insertBefore(info, simInfo.nextSibling);
        } else {
            rightPanel.appendChild(info);
        }
    }

    /**
     * Create property filters
     */
    createPropertyFilters() {
        const rightPanel = document.getElementById('right-panel');
        if (!rightPanel || document.getElementById('property-filters')) return;

        const filters = document.createElement('div');
        filters.id = 'property-filters';
        filters.className = 'property-filters collapsed';
        
        filters.innerHTML = `
            <div class="filters-header">
                <h4>Filtros de Propriedades</h4>
                <button id="toggle-filters-btn" class="btn-small">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="filters-content">
                ${Object.entries(this.propertyFilters).map(([property, filter]) => `
                    <div class="filter-item">
                        <label class="filter-label">
                            <input type="checkbox" data-property="${property}" 
                                   ${filter.enabled ? 'checked' : ''}>
                            ${property.charAt(0).toUpperCase() + property.slice(1)}
                        </label>
                        <div class="filter-range">
                            <input type="range" class="range-min" 
                                   data-property="${property}" data-type="min"
                                   min="${filter.min}" max="${filter.max}" 
                                   value="${filter.min}">
                            <span class="range-value">${filter.min}</span>
                            <span class="range-separator">-</span>
                            <input type="range" class="range-max" 
                                   data-property="${property}" data-type="max"
                                   min="${filter.min}" max="${filter.max}" 
                                   value="${filter.max}">
                            <span class="range-value">${filter.max}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        rightPanel.appendChild(filters);
    }

    /**
     * Create selection box for area selection
     */
    createSelectionBox() {
        if (document.getElementById('selection-box')) return;

        const box = document.createElement('div');
        box.id = 'selection-box';
        box.className = 'selection-box hidden';
        document.body.appendChild(box);
        
        this.selectionBox = box;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode selector buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setMode(mode);
            });
        });

        // Selection actions
        const clearBtn = document.getElementById('clear-selection-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSelection());
        }

        const invertBtn = document.getElementById('invert-selection-btn');
        if (invertBtn) {
            invertBtn.addEventListener('click', () => this.invertSelection());
        }

        // Property filters
        const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', () => this.toggleFilters());
        }

        // Filter checkboxes and ranges
        document.querySelectorAll('[data-property]').forEach(input => {
            input.addEventListener('change', () => this.updatePropertyFilters());
        });

        // Canvas events for area selection
        const canvas = document.querySelector('#three-js-canvas-container canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        }

        // Listen for element interactions
        eventSystem.subscribe('elementClicked', (data) => {
            this.handleElementInteraction(data);
        });

        // Listen for keyboard shortcuts
        eventSystem.subscribe('keyPressed', (data) => {
            this.handleKeyPress(data);
        });
    }

    /**
     * Set selection mode
     */
    setMode(mode) {
        if (!this.modes[mode]) return;

        this.currentMode = mode;
        this.updateModeIndicator();
        this.clearSelection();
        
        eventSystem.emit('selectionModeChanged', { mode, config: this.modes[mode] });
    }

    /**
     * Update mode indicator
     */
    updateModeIndicator() {
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });

        // Update any other mode indicators
        const indicators = document.querySelectorAll('.selection-mode-indicator');
        indicators.forEach(indicator => {
            const mode = this.modes[this.currentMode];
            indicator.innerHTML = `
                <span class="mode-icon">${mode.icon}</span>
                <span class="mode-name">${mode.name}</span>
            `;
        });
    }

    /**
     * Handle element interaction based on current mode
     */
    handleElementInteraction(data) {
        const mode = this.modes[this.currentMode];
        if (mode && mode.handler) {
            mode.handler(data);
        }
    }

    /**
     * Handle single selection
     */
    handleSingleSelection(data) {
        if (!data.event.ctrlKey) {
            this.clearSelection();
        }
        
        if (this.selectedElements.has(data.element)) {
            this.removeFromSelection(data.element);
        } else {
            this.addToSelection(data.element);
        }
    }

    /**
     * Handle area selection
     */
    handleAreaSelection(data) {
        // Area selection is handled by mouse events
        // This is called when area selection is completed
        if (data.elements) {
            if (!data.event.ctrlKey) {
                this.clearSelection();
            }
            
            data.elements.forEach(element => {
                this.addToSelection(element);
            });
        }
    }

    /**
     * Handle type selection
     */
    handleTypeSelection(data) {
        const elementType = data.element.type;
        
        if (!data.event.ctrlKey) {
            this.clearSelection();
        }
        
        // Get all elements of the same type
        eventSystem.emit('requestElementsByType', {
            type: elementType,
            callback: (elements) => {
                elements.forEach(element => {
                    if (this.passesPropertyFilters(element)) {
                        this.addToSelection(element);
                    }
                });
            }
        });
    }

    /**
     * Handle properties selection
     */
    handlePropertiesSelection(data) {
        const referenceElement = data.element;
        
        if (!data.event.ctrlKey) {
            this.clearSelection();
        }
        
        // Get elements with similar properties
        eventSystem.emit('requestElementsByProperties', {
            reference: referenceElement,
            tolerance: 0.2, // 20% tolerance for property matching
            callback: (elements) => {
                elements.forEach(element => {
                    if (this.passesPropertyFilters(element)) {
                        this.addToSelection(element);
                    }
                });
            }
        });
    }

    /**
     * Handle smart selection
     */
    handleSmartSelection(data) {
        const element = data.element;
        
        if (!data.event.ctrlKey) {
            this.clearSelection();
        }
        
        // Smart selection considers relationships and context
        const smartCriteria = this.analyzeElementContext(element);
        
        eventSystem.emit('requestSmartSelection', {
            element,
            criteria: smartCriteria,
            callback: (elements) => {
                elements.forEach(el => {
                    if (this.passesPropertyFilters(el)) {
                        this.addToSelection(el);
                    }
                });
            }
        });
    }

    /**
     * Handle chain selection
     */
    handleChainSelection(data) {
        const element = data.element;
        
        if (!data.event.ctrlKey) {
            this.clearSelection();
        }
        
        // Select elements in the food chain
        eventSystem.emit('requestFoodChain', {
            element,
            includePreyAndPredators: true,
            callback: (chainElements) => {
                chainElements.forEach(el => {
                    if (this.passesPropertyFilters(el)) {
                        this.addToSelection(el);
                    }
                });
            }
        });
    }

    /**
     * Analyze element context for smart selection
     */
    analyzeElementContext(element) {
        const criteria = {
            type: element.type,
            proximityRadius: 100, // pixels
            healthRange: [element.health - 20, element.health + 20],
            energyRange: element.energy ? [element.energy - 20, element.energy + 20] : null,
            ageRange: [element.age - 50, element.age + 50]
        };

        // Add type-specific criteria
        switch (element.type) {
            case 'plant':
                criteria.needsWater = true;
                criteria.needsSun = true;
                break;
            case 'creature':
                criteria.needsFood = true;
                criteria.avoidsPredators = true;
                break;
            case 'predator':
                criteria.huntsCreatures = true;
                break;
        }

        return criteria;
    }

    /**
     * Handle canvas mouse down for area selection
     */
    handleCanvasMouseDown(e) {
        if (this.currentMode !== 'area') return;
        
        this.isSelecting = true;
        this.selectionStart = { x: e.clientX, y: e.clientY };
        this.selectionEnd = { x: e.clientX, y: e.clientY };
        
        this.showSelectionBox();
    }

    /**
     * Handle canvas mouse move for area selection
     */
    handleCanvasMouseMove(e) {
        if (!this.isSelecting || this.currentMode !== 'area') return;
        
        this.selectionEnd = { x: e.clientX, y: e.clientY };
        this.updateSelectionBox();
    }

    /**
     * Handle canvas mouse up for area selection
     */
    handleCanvasMouseUp(e) {
        if (!this.isSelecting || this.currentMode !== 'area') return;
        
        this.isSelecting = false;
        this.hideSelectionBox();
        
        // Get elements in selection area
        const selectedElements = this.getElementsInArea(
            this.selectionStart,
            this.selectionEnd
        );
        
        this.handleAreaSelection({
            elements: selectedElements,
            event: e
        });
        
        this.selectionStart = null;
        this.selectionEnd = null;
    }

    /**
     * Show selection box
     */
    showSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.classList.remove('hidden');
        }
    }

    /**
     * Hide selection box
     */
    hideSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.classList.add('hidden');
        }
    }

    /**
     * Update selection box position and size
     */
    updateSelectionBox() {
        if (!this.selectionBox || !this.selectionStart || !this.selectionEnd) return;

        const left = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const top = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
    }

    /**
     * Get elements within selection area
     */
    getElementsInArea(start, end) {
        // This would need to be implemented with the 3D renderer
        // For now, emit event to request elements in area
        return new Promise((resolve) => {
            eventSystem.emit('requestElementsInArea', {
                start,
                end,
                callback: resolve
            });
        });
    }

    /**
     * Add element to selection
     */
    addToSelection(element) {
        if (!element) return;
        
        this.selectedElements.add(element);
        this.updateSelectionInfo();
        
        eventSystem.emit('elementSelected', { element });
    }

    /**
     * Remove element from selection
     */
    removeFromSelection(element) {
        this.selectedElements.delete(element);
        this.updateSelectionInfo();
        
        eventSystem.emit('elementDeselected', { element });
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedElements.forEach(element => {
            eventSystem.emit('elementDeselected', { element });
        });
        
        this.selectedElements.clear();
        this.updateSelectionInfo();
        
        eventSystem.emit('selectionCleared');
    }

    /**
     * Invert selection
     */
    invertSelection() {
        eventSystem.emit('requestAllElements', {
            callback: (allElements) => {
                const newSelection = new Set();
                
                allElements.forEach(element => {
                    if (!this.selectedElements.has(element) && this.passesPropertyFilters(element)) {
                        newSelection.add(element);
                    }
                });
                
                this.clearSelection();
                newSelection.forEach(element => {
                    this.addToSelection(element);
                });
            }
        });
    }

    /**
     * Update selection info display
     */
    updateSelectionInfo() {
        const countElement = document.getElementById('selected-count');
        const typesElement = document.getElementById('selection-types');
        const statsElement = document.getElementById('selection-stats');
        
        if (countElement) {
            countElement.textContent = this.selectedElements.size;
        }
        
        if (typesElement) {
            const typeBreakdown = this.getSelectionTypeBreakdown();
            typesElement.innerHTML = Object.entries(typeBreakdown)
                .map(([type, count]) => `
                    <div class="type-item">
                        <span class="type-name">${type}</span>
                        <span class="type-count">${count}</span>
                    </div>
                `).join('');
        }
        
        if (statsElement) {
            const stats = this.getSelectionStats();
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Saúde Média:</span>
                    <span class="stat-value">${stats.avgHealth.toFixed(1)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Energia Média:</span>
                    <span class="stat-value">${stats.avgEnergy.toFixed(1)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Idade Média:</span>
                    <span class="stat-value">${stats.avgAge.toFixed(0)}</span>
                </div>
            `;
        }
    }

    /**
     * Get selection type breakdown
     */
    getSelectionTypeBreakdown() {
        const breakdown = {};
        
        this.selectedElements.forEach(element => {
            breakdown[element.type] = (breakdown[element.type] || 0) + 1;
        });
        
        return breakdown;
    }

    /**
     * Get selection statistics
     */
    getSelectionStats() {
        if (this.selectedElements.size === 0) {
            return { avgHealth: 0, avgEnergy: 0, avgAge: 0 };
        }
        
        let totalHealth = 0;
        let totalEnergy = 0;
        let totalAge = 0;
        let energyCount = 0;
        
        this.selectedElements.forEach(element => {
            totalHealth += element.health || 0;
            totalAge += element.age || 0;
            
            if (element.energy !== undefined) {
                totalEnergy += element.energy;
                energyCount++;
            }
        });
        
        return {
            avgHealth: totalHealth / this.selectedElements.size,
            avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
            avgAge: totalAge / this.selectedElements.size
        };
    }

    /**
     * Check if element passes property filters
     */
    passesPropertyFilters(element) {
        for (const [property, filter] of Object.entries(this.propertyFilters)) {
            if (!filter.enabled) continue;
            
            const value = element[property];
            if (value === undefined) continue;
            
            if (value < filter.min || value > filter.max) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update property filters
     */
    updatePropertyFilters() {
        // Update filter values from UI
        document.querySelectorAll('[data-property]').forEach(input => {
            const property = input.dataset.property;
            const filter = this.propertyFilters[property];
            
            if (!filter) return;
            
            if (input.type === 'checkbox') {
                filter.enabled = input.checked;
            } else if (input.type === 'range') {
                const type = input.dataset.type;
                filter[type] = parseFloat(input.value);
                
                // Update display
                const valueSpan = input.nextElementSibling;
                if (valueSpan && valueSpan.classList.contains('range-value')) {
                    valueSpan.textContent = input.value;
                }
            }
        });
        
        // Re-apply filters to current selection if any filters are active
        const hasActiveFilters = Object.values(this.propertyFilters).some(f => f.enabled);
        if (hasActiveFilters && this.selectedElements.size > 0) {
            const filteredElements = Array.from(this.selectedElements).filter(element => 
                this.passesPropertyFilters(element)
            );
            
            this.clearSelection();
            filteredElements.forEach(element => this.addToSelection(element));
        }
    }

    /**
     * Toggle property filters panel
     */
    toggleFilters() {
        const filtersPanel = document.getElementById('property-filters');
        const toggleBtn = document.getElementById('toggle-filters-btn');
        
        if (filtersPanel && toggleBtn) {
            const isCollapsed = filtersPanel.classList.contains('collapsed');
            
            filtersPanel.classList.toggle('collapsed');
            toggleBtn.querySelector('i').className = isCollapsed ? 
                'fas fa-chevron-up' : 'fas fa-chevron-down';
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress(data) {
        const key = data.key;
        
        // Check for mode shortcuts
        Object.entries(this.modes).forEach(([mode, config]) => {
            if (key === config.shortcut) {
                this.setMode(mode);
            }
        });
        
        // Other shortcuts
        switch (key) {
            case 'Escape':
                this.clearSelection();
                break;
            case 'a':
                if (data.ctrlKey) {
                    this.selectAll();
                }
                break;
            case 'i':
                if (data.ctrlKey) {
                    this.invertSelection();
                }
                break;
        }
    }

    /**
     * Select all elements
     */
    selectAll() {
        eventSystem.emit('requestAllElements', {
            callback: (allElements) => {
                this.clearSelection();
                allElements.forEach(element => {
                    if (this.passesPropertyFilters(element)) {
                        this.addToSelection(element);
                    }
                });
            }
        });
    }

    /**
     * Get selected elements
     */
    getSelectedElements() {
        return Array.from(this.selectedElements);
    }

    /**
     * Get current mode
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * Get mode configuration
     */
    getModeConfig(mode = this.currentMode) {
        return this.modes[mode];
    }
}

// Create and export singleton instance
export const selectionModes = new SelectionModes();