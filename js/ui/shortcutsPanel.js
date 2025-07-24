// js/ui/shortcutsPanel.js
import { controlsManager } from './controlsManager.js';
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Keyboard Shortcuts Configuration Panel
 * Allows users to view and customize keyboard shortcuts
 */
export class ShortcutsPanel {
    constructor() {
        this.isVisible = false;
        this.currentlyEditing = null;
        this.shortcuts = [];
        this.filteredShortcuts = [];
        this.searchTerm = '';
        this.categoryFilter = 'all';
    }

    /**
     * Initialize the shortcuts panel
     */
    initialize() {
        this.createPanel();
        this.setupEventListeners();
        this.loadShortcuts();
    }

    /**
     * Create the shortcuts panel HTML
     */
    createPanel() {
        // Check if panel already exists
        if (document.getElementById('shortcuts-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'shortcuts-panel';
        panel.className = 'shortcuts-panel modal-overlay hidden';
        
        panel.innerHTML = `
            <div class="modal-content shortcuts-modal-content">
                <div class="modal-header">
                    <h3>⌨️ Configurar Atalhos de Teclado</h3>
                    <button id="shortcuts-close-btn" class="modal-close-btn">&times;</button>
                </div>
                
                <div class="shortcuts-controls">
                    <div class="search-container">
                        <input type="text" id="shortcuts-search" class="input-field" 
                               placeholder="Buscar atalhos...">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    
                    <div class="filter-container">
                        <select id="shortcuts-category" class="input-field">
                            <option value="all">Todas as Categorias</option>
                            <option value="simulation">Simulação</option>
                            <option value="ui">Interface</option>
                            <option value="selection">Seleção</option>
                            <option value="elements">Elementos</option>
                            <option value="view">Visualização</option>
                        </select>
                    </div>
                    
                    <div class="shortcuts-actions">
                        <button id="reset-shortcuts-btn" class="btn secondary">
                            <i class="fas fa-undo"></i> Restaurar Padrões
                        </button>
                        <button id="export-shortcuts-btn" class="btn secondary">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                        <button id="import-shortcuts-btn" class="btn secondary">
                            <i class="fas fa-upload"></i> Importar
                        </button>
                    </div>
                </div>
                
                <div class="shortcuts-content">
                    <div class="shortcuts-list" id="shortcuts-list">
                        <!-- Shortcuts will be populated here -->
                    </div>
                </div>
                
                <div class="shortcuts-footer">
                    <div class="shortcuts-help">
                        <p><strong>Dica:</strong> Clique em um atalho para editá-lo. Use Ctrl, Shift, Alt + tecla para combinações.</p>
                    </div>
                </div>
            </div>
            
            <!-- Key capture modal -->
            <div id="key-capture-modal" class="key-capture-modal hidden">
                <div class="key-capture-content">
                    <h4>Pressione a nova combinação de teclas</h4>
                    <div class="key-display" id="key-display">
                        Aguardando...
                    </div>
                    <div class="key-capture-actions">
                        <button id="key-capture-cancel" class="btn secondary">Cancelar</button>
                        <button id="key-capture-clear" class="btn secondary">Limpar</button>
                        <button id="key-capture-save" class="btn primary" disabled>Salvar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        document.getElementById('shortcuts-close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Search functionality
        document.getElementById('shortcuts-search').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterShortcuts();
        });

        // Category filter
        document.getElementById('shortcuts-category').addEventListener('change', (e) => {
            this.categoryFilter = e.target.value;
            this.filterShortcuts();
        });

        // Action buttons
        document.getElementById('reset-shortcuts-btn').addEventListener('click', () => {
            this.resetShortcuts();
        });

        document.getElementById('export-shortcuts-btn').addEventListener('click', () => {
            this.exportShortcuts();
        });

        document.getElementById('import-shortcuts-btn').addEventListener('click', () => {
            this.importShortcuts();
        });

        // Key capture modal
        document.getElementById('key-capture-cancel').addEventListener('click', () => {
            this.cancelKeyCapture();
        });

        document.getElementById('key-capture-clear').addEventListener('click', () => {
            this.clearShortcut();
        });

        document.getElementById('key-capture-save').addEventListener('click', () => {
            this.saveShortcut();
        });

        // Global key capture
        document.addEventListener('keydown', (e) => {
            if (this.currentlyEditing) {
                this.handleKeyCapture(e);
            }
        });

        // Listen for shortcut updates
        eventSystem.subscribe('shortcutCustomized', () => {
            this.loadShortcuts();
        });

        eventSystem.subscribe('shortcutsReset', () => {
            this.loadShortcuts();
        });
    }

    /**
     * Show the shortcuts panel
     */
    show() {
        this.panel.classList.remove('hidden');
        this.isVisible = true;
        this.loadShortcuts();
        
        // Focus search input
        setTimeout(() => {
            document.getElementById('shortcuts-search').focus();
        }, 100);
    }

    /**
     * Hide the shortcuts panel
     */
    hide() {
        this.panel.classList.add('hidden');
        this.isVisible = false;
        this.cancelKeyCapture();
    }

    /**
     * Load shortcuts from controls manager
     */
    loadShortcuts() {
        this.shortcuts = controlsManager.getAllShortcuts();
        this.filterShortcuts();
    }

    /**
     * Filter shortcuts based on search and category
     */
    filterShortcuts() {
        this.filteredShortcuts = this.shortcuts.filter(shortcut => {
            const matchesSearch = !this.searchTerm || 
                shortcut.description.toLowerCase().includes(this.searchTerm) ||
                shortcut.displayKey.toLowerCase().includes(this.searchTerm);
            
            const matchesCategory = this.categoryFilter === 'all' || 
                this.getShortcutCategory(shortcut.action) === this.categoryFilter;
            
            return matchesSearch && matchesCategory;
        });

        this.renderShortcuts();
    }

    /**
     * Get category for a shortcut action
     */
    getShortcutCategory(action) {
        const categories = {
            simulation: ['toggleSimulation', 'toggleTimeLapse', 'saveSimulation', 'loadSimulation'],
            ui: ['toggleMainMenu', 'showAchievements', 'showHelp', 'toggleLeftPanel', 'toggleRightPanel', 'toggleBottomPanel'],
            selection: ['setSingleSelection', 'setAreaSelection', 'setTypeSelection', 'setPropertiesSelection'],
            elements: ['deleteSelected', 'copySelected', 'pasteElements', 'selectWater', 'selectPlant', 'selectCreature'],
            view: ['resetCamera', 'focusSelected', 'toggleGrid', 'toggleInfo', 'undo', 'redo']
        };

        for (const [category, actions] of Object.entries(categories)) {
            if (actions.includes(action)) {
                return category;
            }
        }
        
        return 'other';
    }

    /**
     * Render shortcuts list
     */
    renderShortcuts() {
        const listContainer = document.getElementById('shortcuts-list');
        
        if (this.filteredShortcuts.length === 0) {
            listContainer.innerHTML = `
                <div class="no-shortcuts">
                    <i class="fas fa-search"></i>
                    <p>Nenhum atalho encontrado</p>
                </div>
            `;
            return;
        }

        // Group shortcuts by category
        const groupedShortcuts = this.groupShortcutsByCategory();
        
        let html = '';
        Object.entries(groupedShortcuts).forEach(([category, shortcuts]) => {
            if (shortcuts.length === 0) return;
            
            html += `
                <div class="shortcuts-category">
                    <h4 class="category-title">${this.getCategoryDisplayName(category)}</h4>
                    <div class="shortcuts-group">
            `;
            
            shortcuts.forEach(shortcut => {
                html += this.renderShortcutItem(shortcut);
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;
        this.attachShortcutEventListeners();
    }

    /**
     * Group shortcuts by category
     */
    groupShortcutsByCategory() {
        const grouped = {
            simulation: [],
            ui: [],
            selection: [],
            elements: [],
            view: [],
            other: []
        };

        this.filteredShortcuts.forEach(shortcut => {
            const category = this.getShortcutCategory(shortcut.action);
            grouped[category].push(shortcut);
        });

        return grouped;
    }

    /**
     * Get display name for category
     */
    getCategoryDisplayName(category) {
        const names = {
            simulation: '🎮 Simulação',
            ui: '🖥️ Interface',
            selection: '🎯 Seleção',
            elements: '🧩 Elementos',
            view: '👁️ Visualização',
            other: '📋 Outros'
        };
        
        return names[category] || category;
    }

    /**
     * Render individual shortcut item
     */
    renderShortcutItem(shortcut) {
        return `
            <div class="shortcut-item" data-action="${shortcut.action}">
                <div class="shortcut-info">
                    <div class="shortcut-description">${shortcut.description}</div>
                    <div class="shortcut-key" data-key="${shortcut.key}">
                        ${shortcut.displayKey}
                    </div>
                </div>
                <div class="shortcut-actions">
                    <button class="edit-shortcut-btn" title="Editar atalho">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-shortcut-btn" title="Remover atalho">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to shortcut items
     */
    attachShortcutEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shortcutItem = e.target.closest('.shortcut-item');
                const action = shortcutItem.dataset.action;
                this.editShortcut(action);
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-shortcut-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shortcutItem = e.target.closest('.shortcut-item');
                const action = shortcutItem.dataset.action;
                this.removeShortcut(action);
            });
        });

        // Click on shortcut key to edit
        document.querySelectorAll('.shortcut-key').forEach(key => {
            key.addEventListener('click', (e) => {
                const shortcutItem = e.target.closest('.shortcut-item');
                const action = shortcutItem.dataset.action;
                this.editShortcut(action);
            });
        });
    }

    /**
     * Edit a shortcut
     */
    editShortcut(action) {
        this.currentlyEditing = action;
        this.showKeyCapture();
    }

    /**
     * Remove a shortcut
     */
    removeShortcut(action) {
        if (confirm('Tem certeza que deseja remover este atalho?')) {
            controlsManager.customizeShortcut(action, null);
        }
    }

    /**
     * Show key capture modal
     */
    showKeyCapture() {
        const modal = document.getElementById('key-capture-modal');
        modal.classList.remove('hidden');
        
        const display = document.getElementById('key-display');
        display.textContent = 'Aguardando...';
        
        const saveBtn = document.getElementById('key-capture-save');
        saveBtn.disabled = true;
        
        this.capturedKey = null;
    }

    /**
     * Hide key capture modal
     */
    hideKeyCapture() {
        const modal = document.getElementById('key-capture-modal');
        modal.classList.add('hidden');
    }

    /**
     * Handle key capture
     */
    handleKeyCapture(e) {
        e.preventDefault();
        e.stopPropagation();

        // Ignore modifier keys alone
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            return;
        }

        // Build key combination
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.altKey) modifiers.push('Alt');

        let keyName = e.code;
        let displayKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;

        // Handle special keys
        const specialKeys = {
            'Space': 'Espaço',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };

        if (specialKeys[e.key]) {
            displayKey = specialKeys[e.key];
        }

        // Build display string
        let displayString = displayKey;
        if (modifiers.length > 0) {
            displayString = modifiers.join(' + ') + ' + ' + displayKey;
        }

        // Update display
        const display = document.getElementById('key-display');
        display.textContent = displayString;

        // Store captured key
        this.capturedKey = {
            code: keyName,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            display: displayString
        };

        // Enable save button
        const saveBtn = document.getElementById('key-capture-save');
        saveBtn.disabled = false;
    }

    /**
     * Cancel key capture
     */
    cancelKeyCapture() {
        this.currentlyEditing = null;
        this.capturedKey = null;
        this.hideKeyCapture();
    }

    /**
     * Clear shortcut
     */
    clearShortcut() {
        if (this.currentlyEditing) {
            controlsManager.customizeShortcut(this.currentlyEditing, null);
            this.cancelKeyCapture();
        }
    }

    /**
     * Save captured shortcut
     */
    saveShortcut() {
        if (this.currentlyEditing && this.capturedKey) {
            controlsManager.customizeShortcut(this.currentlyEditing, this.capturedKey.code);
            this.cancelKeyCapture();
        }
    }

    /**
     * Reset all shortcuts to defaults
     */
    resetShortcuts() {
        if (confirm('Tem certeza que deseja restaurar todos os atalhos para os padrões?')) {
            controlsManager.resetShortcutsToDefaults();
        }
    }

    /**
     * Export shortcuts configuration
     */
    exportShortcuts() {
        const shortcuts = controlsManager.getAllShortcuts();
        const exportData = {
            version: '1.0',
            shortcuts: shortcuts.reduce((acc, shortcut) => {
                acc[shortcut.action] = {
                    key: shortcut.key,
                    ctrl: shortcut.ctrl,
                    shift: shortcut.shift,
                    alt: shortcut.alt
                };
                return acc;
            }, {}),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ecosse-shortcuts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import shortcuts configuration
     */
    importShortcuts() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.shortcuts) {
                        throw new Error('Formato de arquivo inválido');
                    }

                    // Apply imported shortcuts
                    Object.entries(importData.shortcuts).forEach(([action, config]) => {
                        controlsManager.customizeShortcut(action, config.key);
                    });

                    alert('Atalhos importados com sucesso!');
                } catch (error) {
                    alert('Erro ao importar atalhos: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        });

        input.click();
    }
}

// Create and export singleton instance
export const shortcutsPanel = new ShortcutsPanel();