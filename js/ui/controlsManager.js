// js/ui/controlsManager.js
import { eventSystem, EventTypes } from '../systems/eventSystem.js';
import { uiController } from './uiController.js';

/**
 * Enhanced Controls Manager
 * Handles intuitive gestures, keyboard shortcuts, and advanced selection modes
 */
export class ControlsManager {
    constructor() {
        this.isInitialized = false;
        this.shortcuts = new Map();
        this.gestureHandlers = new Map();
        this.selectionMode = 'single'; // single, area, type, properties
        this.currentGesture = null;
        this.gestureStartPos = null;
        this.gestureThreshold = 10; // pixels
        this.multiSelectEnabled = false;
        this.selectedElements = new Set();
        
        // Gesture recognition state
        this.isGesturing = false;
        this.gestureStartTime = 0;
        this.gestureDistance = 0;
        this.gestureDirection = null;
        
        // Touch/mouse state
        this.touchStartPos = null;
        this.lastTouchPos = null;
        this.touchCount = 0;
        this.isLongPress = false;
        this.longPressTimer = null;
        this.longPressDelay = 500; // ms
        
        // Selection state
        this.selectionBox = null;
        this.selectionStart = null;
        this.selectionEnd = null;
        
        // Default shortcuts configuration
        this.defaultShortcuts = {
            // Simulation controls
            'Space': { action: 'toggleSimulation', description: 'Pausar/Continuar simulação' },
            'KeyT': { action: 'toggleTimeLapse', description: 'Acelerar tempo' },
            'KeyR': { action: 'resetCamera', description: 'Reset câmera' },
            'KeyS': { action: 'saveSimulation', description: 'Salvar simulação', ctrl: true },
            'KeyL': { action: 'loadSimulation', description: 'Carregar simulação', ctrl: true },
            
            // UI controls
            'Escape': { action: 'toggleMainMenu', description: 'Menu principal' },
            'KeyA': { action: 'showAchievements', description: 'Conquistas' },
            'KeyH': { action: 'showHelp', description: 'Ajuda', shift: true },
            'F1': { action: 'showHelp', description: 'Ajuda' },
            
            // Selection modes
            'Digit1': { action: 'setSingleSelection', description: 'Seleção única' },
            'Digit2': { action: 'setAreaSelection', description: 'Seleção por área' },
            'Digit3': { action: 'setTypeSelection', description: 'Seleção por tipo' },
            'Digit4': { action: 'setPropertiesSelection', description: 'Seleção por propriedades' },
            
            // Element manipulation
            'Delete': { action: 'deleteSelected', description: 'Deletar selecionados' },
            'KeyC': { action: 'copySelected', description: 'Copiar selecionados', ctrl: true },
            'KeyV': { action: 'pasteElements', description: 'Colar elementos', ctrl: true },
            'KeyZ': { action: 'undo', description: 'Desfazer', ctrl: true },
            'KeyY': { action: 'redo', description: 'Refazer', ctrl: true },
            
            // View controls
            'KeyF': { action: 'focusSelected', description: 'Focar nos selecionados' },
            'KeyG': { action: 'toggleGrid', description: 'Mostrar/ocultar grade' },
            'KeyI': { action: 'toggleInfo', description: 'Mostrar/ocultar informações' },
            
            // Quick element selection
            'KeyQ': { action: 'selectWater', description: 'Selecionar água' },
            'KeyW': { action: 'selectPlant', description: 'Selecionar planta' },
            'KeyE': { action: 'selectCreature', description: 'Selecionar criatura' },
            
            // Panel toggles
            'F2': { action: 'toggleLeftPanel', description: 'Painel esquerdo' },
            'F3': { action: 'toggleRightPanel', description: 'Painel direito' },
            'F4': { action: 'toggleBottomPanel', description: 'Painel inferior' }
        };
        
        // Load custom shortcuts from localStorage
        this.loadCustomShortcuts();
    }

    /**
     * Initialize the controls manager
     */
    initialize() {
        if (this.isInitialized) return;

        this.setupKeyboardShortcuts();
        this.setupGestureRecognition();
        this.setupSelectionModes();
        this.setupEventListeners();
        // this.createSelectionUI(); // Temporarily disabled to fix rendering issue
        
        this.isInitialized = true;
        eventSystem.emit('controlsInitialized');
    }
    
    /**
     * Handle layout changes from the layout manager
     * @param {Object} layoutInfo - Layout change information
     */
    onLayoutChange(layoutInfo) {
        try {
            console.log('🎮 Controls Manager received layout change:', layoutInfo.viewportType);
            
            // Adjust gesture recognition for different viewports
            this.adjustGestureRecognition(layoutInfo.viewportType);
            
            // Update selection modes for viewport
            this.updateSelectionModesForViewport(layoutInfo.viewportType);
            
            // Adjust keyboard shortcuts if needed
            this.adjustKeyboardShortcuts(layoutInfo.viewportType);
            
        } catch (error) {
            console.error('❌ Error handling layout change in Controls Manager:', error);
        }
    }
    
    /**
     * Adjust gesture recognition for viewport type
     * @param {string} viewportType - Current viewport type
     */
    adjustGestureRecognition(viewportType) {
        switch (viewportType) {
            case 'mobile':
                // Increase gesture threshold for touch
                this.gestureThreshold = 15;
                this.longPressDelay = 600;
                break;
            case 'tablet':
                this.gestureThreshold = 12;
                this.longPressDelay = 550;
                break;
            case 'desktop':
                this.gestureThreshold = 10;
                this.longPressDelay = 500;
                break;
        }
    }
    
    /**
     * Update selection modes for viewport
     * @param {string} viewportType - Current viewport type
     */
    updateSelectionModesForViewport(viewportType) {
        if (viewportType === 'mobile') {
            // Simplify selection modes for mobile
            this.selectionMode = 'single';
            this.multiSelectEnabled = false;
        } else {
            // Enable advanced selection modes for larger screens
            this.multiSelectEnabled = true;
        }
    }
    
    /**
     * Adjust keyboard shortcuts for viewport
     * @param {string} viewportType - Current viewport type
     */
    adjustKeyboardShortcuts(viewportType) {
        // Mobile devices might not have physical keyboards
        if (viewportType === 'mobile') {
            // Keep shortcuts but mark them as less important
            console.log('📱 Adjusting shortcuts for mobile viewport');
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Register default shortcuts
        Object.entries(this.defaultShortcuts).forEach(([key, config]) => {
            this.registerShortcut(key, config);
        });

        // Global keyboard event listener
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }

    /**
     * Setup gesture recognition
     */
    setupGestureRecognition() {
        const canvas = document.querySelector('#three-js-canvas-container canvas');
        if (!canvas) return;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        canvas.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Context menu for right-click gestures
        canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // Register gesture handlers
        this.registerGesture('swipeLeft', this.handleSwipeLeft.bind(this));
        this.registerGesture('swipeRight', this.handleSwipeRight.bind(this));
        this.registerGesture('swipeUp', this.handleSwipeUp.bind(this));
        this.registerGesture('swipeDown', this.handleSwipeDown.bind(this));
        this.registerGesture('pinch', this.handlePinch.bind(this));
        this.registerGesture('longPress', this.handleLongPress.bind(this));
        this.registerGesture('doubleClick', this.handleDoubleClick.bind(this));
        this.registerGesture('rightClick', this.handleRightClick.bind(this));
    }

    /**
     * Setup selection modes
     */
    setupSelectionModes() {
        this.selectionModes = {
            single: {
                name: 'Seleção Única',
                description: 'Seleciona um elemento por vez',
                icon: '👆',
                handler: this.handleSingleSelection.bind(this)
            },
            area: {
                name: 'Seleção por Área',
                description: 'Arraste para selecionar múltiplos elementos',
                icon: '🔲',
                handler: this.handleAreaSelection.bind(this)
            },
            type: {
                name: 'Seleção por Tipo',
                description: 'Seleciona todos os elementos do mesmo tipo',
                icon: '🔗',
                handler: this.handleTypeSelection.bind(this)
            },
            properties: {
                name: 'Seleção por Propriedades',
                description: 'Seleciona elementos com propriedades similares',
                icon: '⚙️',
                handler: this.handlePropertiesSelection.bind(this)
            }
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for selection mode changes
        eventSystem.subscribe('selectionModeChanged', (data) => {
            this.setSelectionMode(data.mode);
        });

        // Listen for element interactions
        eventSystem.subscribe('elementClicked', (data) => {
            this.handleElementClick(data);
        });

        // Listen for shortcut customization
        eventSystem.subscribe('customizeShortcut', (data) => {
            this.customizeShortcut(data.action, data.key);
        });
    }

    /**
     * Create selection UI
     */
    createSelectionUI() {
        // Create selection mode indicator
        const topPanel = document.getElementById('top-panel');
        if (topPanel && !document.getElementById('selection-mode-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'selection-mode-indicator';
            indicator.className = 'selection-mode-indicator';
            indicator.innerHTML = `
                <span class="mode-icon">${this.selectionModes[this.selectionMode].icon}</span>
                <span class="mode-name">${this.selectionModes[this.selectionMode].name}</span>
            `;
            topPanel.appendChild(indicator);
        }

        // Create selection box for area selection
        this.createSelectionBox();
    }

    /**
     * Create selection box element
     */
    createSelectionBox() {
        if (document.getElementById('selection-box')) return;

        const selectionBox = document.createElement('div');
        selectionBox.id = 'selection-box';
        selectionBox.className = 'selection-box hidden';
        document.body.appendChild(selectionBox);
        this.selectionBox = selectionBox;
    }

    /**
     * Register a keyboard shortcut
     */
    registerShortcut(key, config) {
        this.shortcuts.set(key, {
            ...config,
            key: key
        });
    }

    /**
     * Register a gesture handler
     */
    registerGesture(gesture, handler) {
        this.gestureHandlers.set(gesture, handler);
    }

    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        // Don't handle shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        const shortcut = this.shortcuts.get(e.code);
        if (!shortcut) return;

        // Check modifier keys
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (ctrlMatch && shiftMatch && altMatch) {
            e.preventDefault();
            this.executeAction(shortcut.action, { event: e, shortcut });
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        // Handle any key up specific logic here
    }

    /**
     * Handle pointer start (mouse down)
     */
    handlePointerStart(e) {
        this.gestureStartPos = { x: e.clientX, y: e.clientY };
        this.gestureStartTime = Date.now();
        this.isGesturing = true;
        this.gestureDistance = 0;

        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            if (this.isGesturing && this.gestureDistance < this.gestureThreshold) {
                this.triggerGesture('longPress', { x: e.clientX, y: e.clientY });
            }
        }, this.longPressDelay);

        // Handle selection start
        if (this.selectionMode === 'area') {
            this.startAreaSelection(e);
        }
    }

    /**
     * Handle pointer move (mouse move)
     */
    handlePointerMove(e) {
        if (!this.isGesturing || !this.gestureStartPos) return;

        const currentPos = { x: e.clientX, y: e.clientY };
        this.gestureDistance = this.calculateDistance(this.gestureStartPos, currentPos);

        // Cancel long press if moved too much
        if (this.gestureDistance > this.gestureThreshold && this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Update area selection
        if (this.selectionMode === 'area' && this.selectionStart) {
            this.updateAreaSelection(e);
        }
    }

    /**
     * Handle pointer end (mouse up)
     */
    handlePointerEnd(e) {
        if (!this.isGesturing) return;

        const gestureTime = Date.now() - this.gestureStartTime;
        const currentPos = { x: e.clientX, y: e.clientY };

        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        // Detect gesture type
        if (this.gestureDistance < this.gestureThreshold) {
            // Click or tap
            if (gestureTime < 300) {
                this.handleClick(e);
            }
        } else {
            // Swipe gesture
            this.detectSwipeGesture(this.gestureStartPos, currentPos, gestureTime);
        }

        // End area selection
        if (this.selectionMode === 'area' && this.selectionStart) {
            this.endAreaSelection(e);
        }

        this.resetGestureState();
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        this.touchCount = e.touches.length;
        
        if (this.touchCount === 1) {
            const touch = e.touches[0];
            this.handlePointerStart({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            });
        } else if (this.touchCount === 2) {
            // Start pinch gesture
            this.startPinchGesture(e);
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (this.touchCount === 1) {
            const touch = e.touches[0];
            this.handlePointerMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        } else if (this.touchCount === 2) {
            this.updatePinchGesture(e);
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            this.handlePointerEnd({
                clientX: this.lastTouchPos?.x || 0,
                clientY: this.lastTouchPos?.y || 0
            });
            this.touchCount = 0;
        }
    }

    /**
     * Handle wheel events for zoom gestures
     */
    handleWheel(e) {
        e.preventDefault();
        
        const zoomDirection = e.deltaY > 0 ? 'out' : 'in';
        const zoomIntensity = Math.abs(e.deltaY) / 100;
        
        eventSystem.emit('zoomGesture', {
            direction: zoomDirection,
            intensity: zoomIntensity,
            position: { x: e.clientX, y: e.clientY }
        });
    }

    /**
     * Handle context menu (right-click)
     */
    handleContextMenu(e) {
        e.preventDefault();
        this.triggerGesture('rightClick', { x: e.clientX, y: e.clientY });
    }

    /**
     * Calculate distance between two points
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Detect swipe gesture direction
     */
    detectSwipeGesture(startPos, endPos, duration) {
        if (duration > 1000) return; // Too slow to be a swipe

        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        let gesture = null;
        
        if (absDx > absDy) {
            // Horizontal swipe
            gesture = dx > 0 ? 'swipeRight' : 'swipeLeft';
        } else {
            // Vertical swipe
            gesture = dy > 0 ? 'swipeDown' : 'swipeUp';
        }

        if (gesture) {
            this.triggerGesture(gesture, {
                startPos,
                endPos,
                distance: this.gestureDistance,
                duration
            });
        }
    }

    /**
     * Trigger a gesture
     */
    triggerGesture(gesture, data) {
        const handler = this.gestureHandlers.get(gesture);
        if (handler) {
            handler(data);
        }
        
        eventSystem.emit('gestureTriggered', { gesture, data });
    }

    /**
     * Reset gesture state
     */
    resetGestureState() {
        this.isGesturing = false;
        this.gestureStartPos = null;
        this.gestureStartTime = 0;
        this.gestureDistance = 0;
        this.gestureDirection = null;
    }

    /**
     * Execute an action
     */
    executeAction(action, data = {}) {
        switch (action) {
            case 'toggleSimulation':
                eventSystem.emit('toggleSimulation');
                break;
            case 'toggleTimeLapse':
                eventSystem.emit('toggleTimeLapse');
                break;
            case 'resetCamera':
                eventSystem.emit('resetCamera');
                break;
            case 'saveSimulation':
                eventSystem.emit('saveSimulation');
                break;
            case 'loadSimulation':
                eventSystem.emit('loadSimulation');
                break;
            case 'toggleMainMenu':
                uiController.toggleMainMenu();
                break;
            case 'showAchievements':
                eventSystem.emit('showModal', { modalId: 'achievements' });
                break;
            case 'showHelp':
                eventSystem.emit('showModal', { modalId: 'help' });
                break;
            case 'setSingleSelection':
                this.setSelectionMode('single');
                break;
            case 'setAreaSelection':
                this.setSelectionMode('area');
                break;
            case 'setTypeSelection':
                this.setSelectionMode('type');
                break;
            case 'setPropertiesSelection':
                this.setSelectionMode('properties');
                break;
            case 'deleteSelected':
                this.deleteSelectedElements();
                break;
            case 'copySelected':
                this.copySelectedElements();
                break;
            case 'pasteElements':
                this.pasteElements();
                break;
            case 'undo':
                eventSystem.emit('undo');
                break;
            case 'redo':
                eventSystem.emit('redo');
                break;
            case 'focusSelected':
                this.focusSelectedElements();
                break;
            case 'toggleGrid':
                eventSystem.emit('toggleGrid');
                break;
            case 'toggleInfo':
                eventSystem.emit('toggleInfo');
                break;
            case 'selectWater':
                this.selectElementType('water');
                break;
            case 'selectPlant':
                this.selectElementType('plant');
                break;
            case 'selectCreature':
                this.selectElementType('creature');
                break;
            case 'toggleLeftPanel':
                uiController.togglePanel('left-panel');
                break;
            case 'toggleRightPanel':
                uiController.togglePanel('right-panel');
                break;
            case 'toggleBottomPanel':
                uiController.togglePanel('bottom-panel');
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    /**
     * Set selection mode
     */
    setSelectionMode(mode) {
        if (!this.selectionModes[mode] || this.selectionMode === mode) return;

        this.selectionMode = mode;
        this.clearSelection();
        this.updateSelectionModeIndicator();
        
        eventSystem.emit('selectionModeChanged', { mode });
    }

    /**
     * Update selection mode indicator
     */
    updateSelectionModeIndicator() {
        const indicator = document.getElementById('selection-mode-indicator');
        if (indicator) {
            const modeConfig = this.selectionModes[this.selectionMode];
            indicator.innerHTML = `
                <span class="mode-icon">${modeConfig.icon}</span>
                <span class="mode-name">${modeConfig.name}</span>
            `;
        }
    }

    /**
     * Handle element click based on current selection mode
     */
    handleElementClick(data) {
        const handler = this.selectionModes[this.selectionMode]?.handler;
        if (handler) {
            handler(data);
        }
    }

    /**
     * Handle single selection
     */
    handleSingleSelection(data) {
        this.clearSelection();
        this.addToSelection(data.element);
    }

    /**
     * Handle area selection
     */
    handleAreaSelection(data) {
        // For area selection, we start the area selection process
        // The actual area selection is handled by mouse events
        if (data.event) {
            this.startAreaSelection(data.event);
        }
    }

    /**
     * Handle area selection start
     */
    startAreaSelection(e) {
        this.selectionStart = { x: e.clientX, y: e.clientY };
        this.selectionEnd = { x: e.clientX, y: e.clientY };
        this.showSelectionBox();
    }

    /**
     * Handle area selection update
     */
    updateAreaSelection(e) {
        this.selectionEnd = { x: e.clientX, y: e.clientY };
        this.updateSelectionBox();
    }

    /**
     * Handle area selection end
     */
    endAreaSelection(e) {
        this.hideSelectionBox();
        
        // Get elements within selection area
        const selectedElements = this.getElementsInArea(
            this.selectionStart,
            this.selectionEnd
        );
        
        if (!e.ctrlKey) {
            this.clearSelection();
        }
        
        selectedElements.forEach(element => {
            this.addToSelection(element);
        });
        
        this.selectionStart = null;
        this.selectionEnd = null;
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
        eventSystem.emit('getElementsByType', {
            type: elementType,
            callback: (elements) => {
                elements.forEach(element => {
                    this.addToSelection(element);
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
        eventSystem.emit('getElementsByProperties', {
            reference: referenceElement,
            callback: (elements) => {
                elements.forEach(element => {
                    this.addToSelection(element);
                });
            }
        });
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
        // For now, return empty array
        return [];
    }

    /**
     * Add element to selection
     */
    addToSelection(element) {
        this.selectedElements.add(element);
        eventSystem.emit('elementSelected', { element });
    }

    /**
     * Remove element from selection
     */
    removeFromSelection(element) {
        this.selectedElements.delete(element);
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
    }

    /**
     * Delete selected elements
     */
    deleteSelectedElements() {
        this.selectedElements.forEach(element => {
            eventSystem.emit('deleteElement', { element });
        });
        this.clearSelection();
    }

    /**
     * Copy selected elements
     */
    copySelectedElements() {
        const elementsData = Array.from(this.selectedElements).map(element => ({
            type: element.type,
            properties: { ...element }
        }));
        
        localStorage.setItem('copiedElements', JSON.stringify(elementsData));
        eventSystem.emit('elementsCopied', { count: elementsData.length });
    }

    /**
     * Paste elements
     */
    pasteElements() {
        const copiedData = localStorage.getItem('copiedElements');
        if (!copiedData) return;
        
        try {
            const elementsData = JSON.parse(copiedData);
            eventSystem.emit('pasteElements', { elementsData });
        } catch (error) {
            console.error('Error pasting elements:', error);
        }
    }

    /**
     * Focus on selected elements
     */
    focusSelectedElements() {
        if (this.selectedElements.size === 0) return;
        
        eventSystem.emit('focusElements', {
            elements: Array.from(this.selectedElements)
        });
    }

    /**
     * Select element type for placement
     */
    selectElementType(type) {
        eventSystem.emit('selectElementType', { type });
    }

    /**
     * Gesture handlers
     */
    handleSwipeLeft(data) {
        // Switch to previous element type
        eventSystem.emit('previousElementType');
    }

    handleSwipeRight(data) {
        // Switch to next element type
        eventSystem.emit('nextElementType');
    }

    handleSwipeUp(data) {
        // Increase multiplier
        eventSystem.emit('increaseMultiplier');
    }

    handleSwipeDown(data) {
        // Decrease multiplier
        eventSystem.emit('decreaseMultiplier');
    }

    handlePinch(data) {
        // Zoom based on pinch
        eventSystem.emit('pinchZoom', data);
    }

    handleLongPress(data) {
        // Show context menu
        eventSystem.emit('showContextMenu', { position: data });
    }

    handleDoubleClick(data) {
        // Focus on clicked area
        eventSystem.emit('focusOnPosition', { position: data });
    }

    handleRightClick(data) {
        // Show element context menu
        eventSystem.emit('showElementContextMenu', { position: data });
    }

    /**
     * Start pinch gesture
     */
    startPinchGesture(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.pinchStartDistance = this.calculateDistance(
            { x: touch1.clientX, y: touch1.clientY },
            { x: touch2.clientX, y: touch2.clientY }
        );
    }

    /**
     * Update pinch gesture
     */
    updatePinchGesture(e) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const currentDistance = this.calculateDistance(
            { x: touch1.clientX, y: touch1.clientY },
            { x: touch2.clientX, y: touch2.clientY }
        );
        
        const scale = currentDistance / this.pinchStartDistance;
        
        this.triggerGesture('pinch', {
            scale,
            center: {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            }
        });
    }

    /**
     * Handle click events
     */
    handleClick(e) {
        // Emit click event for other systems to handle
        eventSystem.emit('canvasClicked', {
            position: { x: e.clientX, y: e.clientY },
            button: e.button,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        });
    }

    /**
     * Customize a keyboard shortcut
     */
    customizeShortcut(action, newKey) {
        // Find existing shortcut for this action
        let existingKey = null;
        for (const [key, config] of this.shortcuts.entries()) {
            if (config.action === action) {
                existingKey = key;
                break;
            }
        }

        // Remove existing shortcut
        if (existingKey) {
            this.shortcuts.delete(existingKey);
        }

        // Add new shortcut
        const existingConfig = this.defaultShortcuts[existingKey] || {};
        this.registerShortcut(newKey, {
            ...existingConfig,
            action
        });

        // Save to localStorage
        this.saveCustomShortcuts();
        
        eventSystem.emit('shortcutCustomized', { action, oldKey: existingKey, newKey });
    }

    /**
     * Load custom shortcuts from localStorage
     */
    loadCustomShortcuts() {
        const customShortcuts = localStorage.getItem('customShortcuts');
        if (customShortcuts) {
            try {
                const shortcuts = JSON.parse(customShortcuts);
                Object.entries(shortcuts).forEach(([key, config]) => {
                    this.registerShortcut(key, config);
                });
            } catch (error) {
                console.error('Error loading custom shortcuts:', error);
            }
        }
    }

    /**
     * Save custom shortcuts to localStorage
     */
    saveCustomShortcuts() {
        const customShortcuts = {};
        this.shortcuts.forEach((config, key) => {
            if (!this.defaultShortcuts[key]) {
                customShortcuts[key] = config;
            }
        });
        
        localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts));
    }

    /**
     * Get all shortcuts for display
     */
    getAllShortcuts() {
        const shortcuts = [];
        this.shortcuts.forEach((config, key) => {
            shortcuts.push({
                key,
                ...config,
                displayKey: this.formatKeyForDisplay(key, config)
            });
        });
        
        return shortcuts.sort((a, b) => a.description.localeCompare(b.description));
    }

    /**
     * Format key combination for display
     */
    formatKeyForDisplay(key, config) {
        let display = key.replace('Key', '').replace('Digit', '');
        
        const modifiers = [];
        if (config.ctrl) modifiers.push('Ctrl');
        if (config.shift) modifiers.push('Shift');
        if (config.alt) modifiers.push('Alt');
        
        if (modifiers.length > 0) {
            display = modifiers.join(' + ') + ' + ' + display;
        }
        
        return display;
    }

    /**
     * Reset shortcuts to defaults
     */
    resetShortcutsToDefaults() {
        this.shortcuts.clear();
        Object.entries(this.defaultShortcuts).forEach(([key, config]) => {
            this.registerShortcut(key, config);
        });
        
        localStorage.removeItem('customShortcuts');
        eventSystem.emit('shortcutsReset');
    }

    /**
     * Get current state
     */
    getState() {
        return {
            selectionMode: this.selectionMode,
            selectedCount: this.selectedElements.size,
            shortcuts: this.getAllShortcuts(),
            gesturesEnabled: this.isInitialized
        };
    }
}

// Create and export singleton instance
export const controlsManager = new ControlsManager();