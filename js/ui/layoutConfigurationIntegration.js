/**
 * Layout Configuration Integration - Task 10: Create layout configuration system
 * 
 * This file integrates the layout configuration system with existing UI systems
 * and ensures proper initialization and communication between components.
 */

import { layoutConfigurationSystem } from './layoutConfigurationSystem.js';

/**
 * Initialize layout configuration system integration
 */
export function initializeLayoutConfigurationIntegration() {
    console.log('🔗 Initializing Layout Configuration Integration...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAfterDOM);
    } else {
        initializeAfterDOM();
    }
}

/**
 * Initialize after DOM is ready
 */
function initializeAfterDOM() {
    // Wait for other systems to initialize
    setTimeout(() => {
        // Initialize layout configuration system
        layoutConfigurationSystem.initialize();
        
        // Create settings toggle button
        layoutConfigurationSystem.createSettingsToggleButton();
        
        // Set up integration with existing systems
        setupSystemIntegrations();
        
        // Set up global keyboard shortcuts
        setupGlobalShortcuts();
        
        // Set up automatic configuration sync
        setupConfigurationSync();
        
        console.log('✅ Layout Configuration Integration initialized');
    }, 500); // Allow time for other systems to initialize
}

/**
 * Set up integration with existing UI systems
 */
function setupSystemIntegrations() {
    // Integration with Panel Visibility Manager
    if (window.panelVisibilityManager) {
        console.log('🔗 Integrating with Panel Visibility Manager');
        
        // Listen for panel state changes
        document.addEventListener('panelStateChanged', (e) => {
            const { panelName, newState } = e.detail;
            
            // Update configuration based on panel changes
            const config = layoutConfigurationSystem.getCurrentConfiguration();
            
            if (panelName === 'left') {
                config.panels.left.visible = newState !== 'hidden';
                config.panels.left.minimized = newState === 'minimized';
            } else if (panelName === 'right') {
                config.panels.right.visible = newState !== 'hidden';
                config.panels.right.minimized = newState === 'minimized';
            }
            
            // Save updated configuration
            layoutConfigurationSystem.saveConfiguration();
        });
    }
    
    // Integration with Floating Controls Panel
    if (window.floatingControlsPanel) {
        console.log('🔗 Integrating with Floating Controls Panel');
        
        // Listen for floating panel changes
        document.addEventListener('panelToggle', (e) => {
            const { collapsed } = e.detail;
            
            const config = layoutConfigurationSystem.getCurrentConfiguration();
            config.panels.controls.collapsed = collapsed;
            
            layoutConfigurationSystem.saveConfiguration();
        });
        
        // Sync initial state
        const controlsState = window.floatingControlsPanel.getState();
        const config = layoutConfigurationSystem.getCurrentConfiguration();
        
        config.panels.controls.position = controlsState.position;
        config.panels.controls.collapsed = controlsState.collapsed;
        config.panels.controls.compact = controlsState.compact;
    }
    
    // Integration with Adaptive UI Controller
    if (window.adaptiveUIController) {
        console.log('🔗 Integrating with Adaptive UI Controller');
        
        // Listen for viewport changes
        document.addEventListener('viewportChanged', (e) => {
            const { to: viewport } = e.detail;
            
            // Auto-apply responsive configurations if enabled
            const config = layoutConfigurationSystem.getCurrentConfiguration();
            if (config.responsive.autoAdapt) {
                handleResponsiveConfigurationChange(viewport);
            }
        });
    }
    
    // Integration with Responsive Canvas Container
    if (window.responsiveCanvasContainer) {
        console.log('🔗 Integrating with Responsive Canvas Container');
        
        // Listen for canvas resize events
        document.addEventListener('canvasResized', (e) => {
            // Update configuration if needed
            const config = layoutConfigurationSystem.getCurrentConfiguration();
            if (config.canvas.autoResize) {
                // Configuration is already applied, just log
                console.log('📐 Canvas resized automatically');
            }
        });
    }
}

/**
 * Handle responsive configuration changes
 */
function handleResponsiveConfigurationChange(viewport) {
    const config = layoutConfigurationSystem.getCurrentConfiguration();
    
    switch (viewport) {
        case 'mobile':
            // Apply mobile-optimized settings
            if (config.panels.left.visible && !config.panels.left.minimized) {
                window.panelVisibilityManager?.setPanelState('left', 'minimized');
            }
            if (config.panels.right.visible && !config.panels.right.minimized) {
                window.panelVisibilityManager?.setPanelState('right', 'minimized');
            }
            if (!config.panels.controls.compact) {
                window.floatingControlsPanel?.setCompactMode(true);
            }
            break;
            
        case 'tablet':
            // Apply tablet-optimized settings
            if (config.panels.left.minimized) {
                window.panelVisibilityManager?.setPanelState('left', 'visible');
            }
            if (config.panels.right.minimized) {
                window.panelVisibilityManager?.setPanelState('right', 'visible');
            }
            break;
            
        case 'desktop':
            // Apply desktop-optimized settings
            if (config.panels.left.minimized) {
                window.panelVisibilityManager?.setPanelState('left', 'visible');
            }
            if (config.panels.right.minimized) {
                window.panelVisibilityManager?.setPanelState('right', 'visible');
            }
            if (config.panels.controls.compact) {
                window.floatingControlsPanel?.setCompactMode(false);
            }
            break;
    }
}

/**
 * Set up global keyboard shortcuts
 */
function setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Quick preset shortcuts (Ctrl+Alt+1-4)
        if (e.ctrlKey && e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            
            const presets = ['default', 'compact', 'full', 'presentation'];
            const presetIndex = parseInt(e.key) - 1;
            
            if (presets[presetIndex]) {
                layoutConfigurationSystem.applyPreset(presets[presetIndex]);
                
                // Show notification
                showPresetNotification(presets[presetIndex]);
            }
        }
        
        // Quick settings toggle (Ctrl+,)
        if (e.key === ',' && e.ctrlKey) {
            e.preventDefault();
            layoutConfigurationSystem.showSettingsPanel();
        }
    });
}

/**
 * Show preset notification
 */
function showPresetNotification(presetName) {
    const presets = {
        default: 'Padrão',
        compact: 'Compacto',
        full: 'Completo',
        presentation: 'Apresentação'
    };
    
    const notification = document.createElement('div');
    notification.className = 'preset-notification';
    notification.textContent = `Layout: ${presets[presetName]}`;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

/**
 * Set up automatic configuration sync
 */
function setupConfigurationSync() {
    // Sync configuration every 30 seconds to catch any missed changes
    setInterval(() => {
        syncConfigurationWithCurrentState();
    }, 30000);
    
    // Sync on window focus
    window.addEventListener('focus', () => {
        syncConfigurationWithCurrentState();
    });
    
    // Sync before page unload
    window.addEventListener('beforeunload', () => {
        syncConfigurationWithCurrentState();
        layoutConfigurationSystem.saveConfiguration();
    });
}

/**
 * Sync configuration with current UI state
 */
function syncConfigurationWithCurrentState() {
    const config = layoutConfigurationSystem.getCurrentConfiguration();
    let hasChanges = false;
    
    // Sync panel states
    if (window.panelVisibilityManager) {
        const panelStates = window.panelVisibilityManager.getPanelStates();
        
        if (panelStates.left) {
            const leftVisible = panelStates.left !== 'hidden';
            const leftMinimized = panelStates.left === 'minimized';
            
            if (config.panels.left.visible !== leftVisible || config.panels.left.minimized !== leftMinimized) {
                config.panels.left.visible = leftVisible;
                config.panels.left.minimized = leftMinimized;
                hasChanges = true;
            }
        }
        
        if (panelStates.right) {
            const rightVisible = panelStates.right !== 'hidden';
            const rightMinimized = panelStates.right === 'minimized';
            
            if (config.panels.right.visible !== rightVisible || config.panels.right.minimized !== rightMinimized) {
                config.panels.right.visible = rightVisible;
                config.panels.right.minimized = rightMinimized;
                hasChanges = true;
            }
        }
    }
    
    // Sync floating controls state
    if (window.floatingControlsPanel) {
        const controlsState = window.floatingControlsPanel.getState();
        
        if (config.panels.controls.position !== controlsState.position ||
            config.panels.controls.collapsed !== controlsState.collapsed ||
            config.panels.controls.compact !== controlsState.compact) {
            
            config.panels.controls.position = controlsState.position;
            config.panels.controls.collapsed = controlsState.collapsed;
            config.panels.controls.compact = controlsState.compact;
            hasChanges = true;
        }
    }
    
    // Save if there are changes
    if (hasChanges) {
        layoutConfigurationSystem.saveConfiguration();
        console.log('🔄 Configuration synced with current state');
    }
}

/**
 * Add layout configuration menu to existing UI
 */
function addLayoutConfigurationMenu() {
    // Try to add to existing menu system
    const menuSystem = document.querySelector('.menu-system') || document.querySelector('#menu');
    
    if (menuSystem) {
        const layoutMenuItem = document.createElement('div');
        layoutMenuItem.className = 'menu-item';
        layoutMenuItem.innerHTML = `
            <button class="menu-button" id="layout-config-menu-btn">
                <span class="menu-icon">⚙️</span>
                <span class="menu-text">Layout</span>
            </button>
        `;
        
        layoutMenuItem.addEventListener('click', () => {
            layoutConfigurationSystem.showSettingsPanel();
        });
        
        menuSystem.appendChild(layoutMenuItem);
        console.log('📋 Added layout configuration to menu system');
    }
}

/**
 * Export configuration for backup/restore
 */
export function exportLayoutConfiguration() {
    const config = {
        preset: layoutConfigurationSystem.getCurrentPreset(),
        configuration: layoutConfigurationSystem.getCurrentConfiguration(),
        timestamp: Date.now(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosse-layout-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    console.log('📤 Layout configuration exported');
}

/**
 * Import configuration from file
 */
export function importLayoutConfiguration(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Validate configuration structure
                if (config.configuration && config.preset) {
                    // Apply imported configuration
                    layoutConfigurationSystem.currentConfig = config.configuration;
                    layoutConfigurationSystem.currentPreset = config.preset;
                    
                    layoutConfigurationSystem.applyConfiguration();
                    layoutConfigurationSystem.saveConfiguration();
                    
                    console.log('📥 Layout configuration imported successfully');
                    resolve(config);
                } else {
                    throw new Error('Invalid configuration file format');
                }
            } catch (error) {
                console.error('❌ Failed to import configuration:', error);
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read configuration file'));
        };
        
        reader.readAsText(file);
    });
}

// Initialize integration when this module is loaded
initializeLayoutConfigurationIntegration();

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutConfigurationIntegration = {
        exportConfiguration: exportLayoutConfiguration,
        importConfiguration: importLayoutConfiguration,
        syncConfiguration: syncConfigurationWithCurrentState
    };
}