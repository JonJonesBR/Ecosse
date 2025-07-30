/**
 * Integration file for planet renderer fixes
 * This file provides a seamless integration between the original system and the fixes
 * Updated for Task 4: Implement responsive canvas container
 */

import { applyPlanetRendererFixes, updatePlanetAppearance as fixedUpdatePlanetAppearance, resetCamera as fixedResetCamera, getRenderingComponents } from './planetRenderer-fix.js';
import { init3DScene as originalInit3DScene, updatePlanetAppearance as originalUpdatePlanetAppearance, resetCamera as originalResetCamera } from './planetRenderer.js';
import { responsiveCanvasContainer } from './responsive-canvas-container.js';
import { rendererLayoutIntegration } from './ui/rendererLayoutIntegration.js';

// Flag to determine which system to use
let useFixes = true;

/**
 * Enhanced init3DScene that tries the fix first, falls back to original if needed
 * Updated for Task 4: Implement responsive canvas container
 */
export function enhancedInit3DScene(container, initialConfig) {
    console.log('Initializing 3D scene with enhanced renderer and responsive canvas container...');
    
    // Wait for container to be ready
    return new Promise((resolve) => {
        const initializeRenderer = () => {
            if (useFixes) {
                try {
                    console.log('Attempting to use planet renderer fixes with responsive canvas...');
                    const rendererElement = applyPlanetRendererFixes(container, initialConfig);
                    
                    if (rendererElement) {
                        console.log('✅ Planet renderer fixes applied successfully');
                        
                        // Initialize responsive canvas container and layout integration
                        const renderingComponents = getRenderingComponents();
                        if (renderingComponents && renderingComponents.renderer && renderingComponents.camera && container) {
                            // Initialize responsive canvas container
                            const canvasSuccess = responsiveCanvasContainer.initialize(
                                container, 
                                renderingComponents.renderer, 
                                renderingComponents.camera
                            );
                            
                            if (canvasSuccess) {
                                console.log('✅ Responsive canvas container initialized');
                            } else {
                                console.warn('⚠️ Responsive canvas container initialization failed');
                            }
                            
                            // Initialize renderer layout integration
                            const integrationSuccess = rendererLayoutIntegration.initialize(
                                renderingComponents, 
                                container
                            );
                            
                            if (integrationSuccess) {
                                console.log('✅ Renderer layout integration initialized');
                                
                                // Set up enhanced canvas resize event listener
                                container.addEventListener('canvasResize', (event) => {
                                    console.log(`Canvas resized to ${event.detail.width}x${event.detail.height}`);
                                    // The renderer layout integration handles the rest
                                });
                                
                            } else {
                                console.warn('⚠️ Renderer layout integration initialization failed');
                            }
                        }
                        
                        resolve(rendererElement);
                        return;
                    } else {
                        console.warn('⚠️ Planet renderer fixes failed, falling back to original system');
                        useFixes = false;
                    }
                } catch (error) {
                    console.error('❌ Error with planet renderer fixes:', error);
                    console.log('Falling back to original system...');
                    useFixes = false;
                }
            }
            
            // Fallback to original system
            try {
                console.log('Using original planet renderer system...');
                const result = originalInit3DScene(container, initialConfig);
                
                // Try to initialize responsive canvas container with original system too
                // Note: This requires the original system to expose renderer and camera
                // For now, we'll skip this integration for the original system
                console.log('⚠️ Responsive canvas container not available for original renderer system');
                
                resolve(result);
            } catch (error) {
                console.error('❌ Both rendering systems failed:', error);
                
                // Last resort: create a simple error message
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1e293b, #334155);
                    color: white;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    box-sizing: border-box;
                `;
                
                errorDiv.innerHTML = `
                    <div>
                        <h2 style="margin-bottom: 20px; color: #ef4444;">🚫 Erro de Renderização</h2>
                        <p style="margin-bottom: 15px;">Não foi possível inicializar o renderizador 3D do planeta.</p>
                        <p style="margin-bottom: 15px; font-size: 14px; opacity: 0.8;">
                            Possíveis soluções:<br>
                            • Recarregue a página<br>
                            • Verifique se seu navegador suporta WebGL<br>
                            • Tente usar um navegador diferente
                        </p>
                        <button onclick="location.reload()" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">🔄 Recarregar Página</button>
                    </div>
                `;
                
                container.appendChild(errorDiv);
                resolve(errorDiv);
            }
        };
        
        // Check if container is ready
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            initializeRenderer();
        } else {
            // Wait a bit for the container to be ready
            setTimeout(() => {
                if (container && container.clientWidth > 0 && container.clientHeight > 0) {
                    initializeRenderer();
                } else {
                    // Force container dimensions and try again
                    if (container) {
                        container.style.width = '800px';
                        container.style.height = '600px';
                        container.style.position = 'relative';
                        container.offsetHeight; // Force reflow
                    }
                    setTimeout(initializeRenderer, 50);
                }
            }, 100);
        }
    });
}

/**
 * Enhanced updatePlanetAppearance that uses the appropriate system
 */
export function enhancedUpdatePlanetAppearance(config) {
    if (useFixes) {
        try {
            fixedUpdatePlanetAppearance(config);
        } catch (error) {
            console.error('Error with fixed updatePlanetAppearance:', error);
            originalUpdatePlanetAppearance(config);
        }
    } else {
        originalUpdatePlanetAppearance(config);
    }
}

/**
 * Enhanced resetCamera that uses the appropriate system
 */
export function enhancedResetCamera(config) {
    if (useFixes) {
        try {
            fixedResetCamera(config);
        } catch (error) {
            console.error('Error with fixed resetCamera:', error);
            originalResetCamera(config);
        }
    } else {
        originalResetCamera(config);
    }
}

/**
 * Function to manually switch to fixes (for testing)
 */
export function enableFixes() {
    useFixes = true;
    console.log('Planet renderer fixes enabled');
}

/**
 * Function to manually switch to original system (for testing)
 */
export function disableFixes() {
    useFixes = false;
    console.log('Planet renderer fixes disabled, using original system');
}

/**
 * Get current system status
 */
export function getSystemStatus() {
    return {
        usingFixes: useFixes,
        systemName: useFixes ? 'Enhanced (with fixes)' : 'Original',
        responsiveCanvasEnabled: responsiveCanvasContainer.isInitialized
    };
}

/**
 * Force canvas resize - useful for testing and manual adjustments
 */
export function forceCanvasResize() {
    let resized = false;
    
    if (responsiveCanvasContainer.isInitialized) {
        responsiveCanvasContainer.forceResize();
        resized = true;
    }
    
    if (rendererLayoutIntegration.isInitialized) {
        rendererLayoutIntegration.forceUpdate();
        resized = true;
    }
    
    if (resized) {
        console.log('Canvas resize and layout integration forced');
    } else {
        console.warn('No responsive systems initialized');
    }
}

/**
 * Get canvas metrics for debugging
 */
export function getCanvasMetrics() {
    const canvasMetrics = responsiveCanvasContainer.isInitialized ? 
        responsiveCanvasContainer.getMetrics() : null;
    
    const integrationStatus = rendererLayoutIntegration.isInitialized ? 
        rendererLayoutIntegration.getStatus() : null;
    
    return {
        canvas: canvasMetrics,
        integration: integrationStatus,
        timestamp: Date.now()
    };
}

/**
 * Set minimum canvas size constraints
 */
export function setMinimumCanvasSize(width, height) {
    if (responsiveCanvasContainer.isInitialized) {
        responsiveCanvasContainer.setMinimumSize({ width, height });
        console.log(`Minimum canvas size set to ${width}x${height}`);
    } else {
        console.warn('Responsive canvas container not initialized');
    }
}

/**
 * Set maximum canvas size constraints
 */
export function setMaximumCanvasSize(width, height) {
    if (responsiveCanvasContainer.isInitialized) {
        responsiveCanvasContainer.setMaximumSize({ width, height });
        console.log(`Maximum canvas size set to ${width}x${height}`);
    } else {
        console.warn('Responsive canvas container not initialized');
    }
}

/**
 * Set rendering quality level
 * @param {string} quality - Quality level: 'low', 'medium', 'high', 'ultra'
 */
export function setRenderingQuality(quality) {
    if (rendererLayoutIntegration.isInitialized) {
        rendererLayoutIntegration.setRenderingQuality(quality);
        console.log(`Rendering quality set to: ${quality}`);
    } else {
        console.warn('Renderer layout integration not initialized');
    }
}

/**
 * Optimize rendering for current layout
 */
export function optimizeRenderingForLayout() {
    if (rendererLayoutIntegration.isInitialized) {
        rendererLayoutIntegration.forceUpdate();
        console.log('Rendering optimized for current layout');
    } else {
        console.warn('Renderer layout integration not initialized');
    }
}

/**
 * Get integration status for debugging
 */
export function getIntegrationStatus() {
    return {
        responsiveCanvas: {
            initialized: responsiveCanvasContainer.isInitialized,
            metrics: responsiveCanvasContainer.isInitialized ? 
                responsiveCanvasContainer.getMetrics() : null
        },
        layoutIntegration: {
            initialized: rendererLayoutIntegration.isInitialized,
            status: rendererLayoutIntegration.isInitialized ? 
                rendererLayoutIntegration.getStatus() : null
        },
        systemStatus: getSystemStatus()
    };
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.planetRendererIntegration = {
        enableFixes,
        disableFixes,
        getSystemStatus,
        enhancedInit3DScene,
        enhancedUpdatePlanetAppearance,
        enhancedResetCamera,
        forceCanvasResize,
        getCanvasMetrics,
        setMinimumCanvasSize,
        setMaximumCanvasSize,
        setRenderingQuality,
        optimizeRenderingForLayout,
        getIntegrationStatus
    };
    
    console.log('🔧 Planet Renderer Integration available globally');
    console.log('Use window.planetRendererIntegration to control the system');
    console.log('Task 4 functions: forceCanvasResize(), getCanvasMetrics(), setMinimumCanvasSize(), setMaximumCanvasSize()');
    console.log('Task 8 functions: setRenderingQuality(), optimizeRenderingForLayout(), getIntegrationStatus()');
}