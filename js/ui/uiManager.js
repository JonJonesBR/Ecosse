// js/ui/uiManager.js
import { eventSystem } from '../systems/eventSystem.js';

/**
 * UI Manager class
 * Handles UI updates and interactions
 */
export class UIManager {
    constructor() {
        this.uiElements = {};
        this.eventSubscriptions = [];
    }

    /**
     * Initialize UI manager with DOM references
     * @param {Object} domReferences - Object containing DOM element references
     */
    initialize(domReferences) {
        this.uiElements = domReferences;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for UI updates
     */
    setupEventListeners() {
        // Subscribe to simulation events
        this.eventSubscriptions.push(
            eventSystem.subscribe('simulationUpdate', this.updateSimulationInfo.bind(this)),
            eventSystem.subscribe('elementCreated', this.handleElementCreated.bind(this)),
            eventSystem.subscribe('elementRemoved', this.handleElementRemoved.bind(this)),
            eventSystem.subscribe('stateChanged', this.handleStateChanged.bind(this))
        );
    }

    /**
     * Update simulation info in UI
     * @param {Object} data - Simulation data
     */
    updateSimulationInfo(data) {
        const { stability, biodiversity, resources } = data;

        if (this.uiElements.ecosystemStability) {
            this.uiElements.ecosystemStability.textContent = `${stability.toFixed(0)}%`;
        }

        if (this.uiElements.ecosystemBiodiversity) {
            this.uiElements.ecosystemBiodiversity.textContent = `${biodiversity} tipos`;
        }

        if (this.uiElements.ecosystemResources) {
            this.uiElements.ecosystemResources.textContent = `${resources.toFixed(0)}% água`;
        }
    }

    /**
     * Handle element created event
     * @param {Object} data - Element data
     */
    handleElementCreated(data) {
        // Update UI when element is created
        console.log(`Element created: ${data.type}`);
    }

    /**
     * Handle element removed event
     * @param {Object} data - Element data
     */
    handleElementRemoved(data) {
        // Update UI when element is removed
        console.log(`Element removed: ${data.type}`);
    }

    /**
     * Handle state changed event
     * @param {Object} data - State change data
     */
    handleStateChanged(data) {
        // Update UI based on state changes
        console.log(`State changed from ${data.from} to ${data.to}`);
        
        // Update UI elements based on state
        if (data.to === 'running') {
            if (this.uiElements.playPauseBtn) {
                this.uiElements.playPauseBtn.innerHTML = '⏸️ Pausar';
            }
        } else if (data.to === 'paused') {
            if (this.uiElements.playPauseBtn) {
                this.uiElements.playPauseBtn.innerHTML = '▶️ Play';
            }
        }
    }

    /**
     * Show a message to the user
     * @param {string} message - Message to show
     * @param {string} type - Message type (info, success, error, warning)
     */
    showMessage(message, type = 'info') {
        if (this.uiElements.messageText && this.uiElements.messageBox) {
            this.uiElements.messageText.textContent = message;
            
            // Remove all type classes
            this.uiElements.messageBox.classList.remove('info', 'success', 'error', 'warning');
            
            // Add the current type class
            this.uiElements.messageBox.classList.add(type);
            
            // Show the message box
            this.uiElements.messageBox.style.display = 'block';
            
            // Auto-hide after 3 seconds for non-error messages
            if (type !== 'error') {
                setTimeout(() => {
                    this.hideMessage();
                }, 3000);
            }
        }
    }

    /**
     * Hide the message box
     */
    hideMessage() {
        if (this.uiElements.messageBox) {
            this.uiElements.messageBox.style.display = 'none';
        }
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        // Unsubscribe from all events
        this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
        this.eventSubscriptions = [];
    }
}

// Create and export a singleton instance
export const uiManager = new UIManager();