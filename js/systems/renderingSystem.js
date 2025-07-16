/**
 * Enhanced Rendering System
 * This system integrates and manages all rendering-related functionality
 * including shaders, particles, lighting, and optimization.
 */

import * as THREE from 'three';
import { shaderManager } from '../shaders/shaderManager.js';
import { particleSystem, ParticleTypes } from './particleSystem.js';
import { lightingSystem } from './lightingSystem.js';
import { 
    getLODLevel, 
    isVisible, 
    updateInstancedMeshWithLOD, 
    createPerformanceMonitor 
} from './renderOptimizer.js';
import { eventSystem, EventTypes } from './eventSystem.js';
import { loggingSystem } from './loggingSystem.js';

/**
 * RenderingSystem class for managing all rendering aspects
 */
class RenderingSystem {
    constructor() {
        // Core rendering components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Performance monitoring
        this.performanceMonitor = null;
        this.stats = {
            fps: 0,
            drawCalls: 0,
            triangles: 0,
            elements: 0
        };
        
        // Rendering groups
        this.instancedMeshes = {};
        this.nonInstancedElements = new THREE.Group();
        
        // Helpers
        this.dummy = new THREE.Object3D(); // For instanced mesh manipulation
        
        // Configuration
        this.config = {
            enablePostProcessing: true,
            enableBloom: true,
            enableSSAO: false, // Ambient Occlusion (performance heavy)
            enableFXAA: true,  // Fast anti-aliasing
            bloomStrength: 0.5,
            bloomThreshold: 0.7,
            bloomRadius: 0.4,
            enableShadows: false, // Shadows are performance heavy
            maxInstancedElements: 5000,
            targetFPS: 60,
            adaptiveQuality: true, // Automatically adjust quality based on performance
            qualityLevel: 'high' // high, medium, low
        };
        
        // Post-processing
        this.composer = null;
        this.effectPass = null;
        
        // Event subscriptions
        this.subscriptions = [];
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
        
        // Last frame timestamp for delta calculation
        this.lastFrameTime = 0;
    }
    
    /**
     * Initialize the rendering system
     * @param {HTMLElement} container - The container element
     * @param {Object} initialConfig - Initial configuration
     * @returns {HTMLElement} - The renderer's DOM element
     */
    init(container, initialConfig = {}) {
        // Clear existing content in the container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Update configuration
        this.config = { ...this.config, ...initialConfig };
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            1, 
            1000
        );
        
        // Create renderer with optimized settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.qualityLevel === 'high',
            powerPreference: 'high-performance',
            precision: this.config.qualityLevel === 'low' ? 'lowp' : 'mediump'
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio, 
                this.config.qualityLevel === 'high' ? 2 : 
                this.config.qualityLevel === 'medium' ? 1.5 : 1
            )
        );
        
        // Configure renderer based on quality settings
        this.renderer.shadowMap.enabled = this.config.enableShadows;
        if (this.config.enableShadows) {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // Add renderer to container
        container.appendChild(this.renderer.domElement);
        
        // Initialize sub-systems
        this.initSubSystems(initialConfig);
        
        // Add non-instanced elements group to scene
        this.scene.add(this.nonInstancedElements);
        
        // Initialize post-processing effects if enabled
        if (this.config.enablePostProcessing) {
            this.initPostProcessing(container);
        }
        
        // Create performance monitor
        this.performanceMonitor = createPerformanceMonitor(container);
        this.performanceMonitor.container.style.display = 'none'; // Hide by default
        
        // Add key listener to toggle performance monitor
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F3') {
                this.performanceMonitor.toggle();
            }
        });
        
        // Subscribe to events
        this.subscribeToEvents();
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(container));
        
        loggingSystem.info('Rendering System initialized');
        return this.renderer.domElement;
    }
    
    /**
     * Initialize post-processing effects
     * @param {HTMLElement} container - The container element
     */
    initPostProcessing(container) {
        try {
            // Import post-processing modules dynamically
            import('three/examples/jsm/postprocessing/EffectComposer.js').then(({ EffectComposer }) => {
                import('three/examples/jsm/postprocessing/RenderPass.js').then(({ RenderPass }) => {
                    import('three/examples/jsm/postprocessing/UnrealBloomPass.js').then(({ UnrealBloomPass }) => {
                        import('three/examples/jsm/postprocessing/ShaderPass.js').then(({ ShaderPass }) => {
                            import('three/examples/jsm/shaders/FXAAShader.js').then(({ FXAAShader }) => {
                                // Create effect composer
                                this.composer = new EffectComposer(this.renderer);
                                
                                // Add render pass
                                const renderPass = new RenderPass(this.scene, this.camera);
                                this.composer.addPass(renderPass);
                                
                                // Add bloom pass if enabled
                                if (this.config.enableBloom) {
                                    const bloomPass = new UnrealBloomPass(
                                        new THREE.Vector2(container.clientWidth, container.clientHeight),
                                        this.config.bloomStrength,
                                        this.config.bloomRadius,
                                        this.config.bloomThreshold
                                    );
                                    this.composer.addPass(bloomPass);
                                }
                                
                                // Add FXAA pass if enabled
                                if (this.config.enableFXAA) {
                                    const fxaaPass = new ShaderPass(FXAAShader);
                                    fxaaPass.material.uniforms['resolution'].value.set(
                                        1 / container.clientWidth,
                                        1 / container.clientHeight
                                    );
                                    this.composer.addPass(fxaaPass);
                                }
                                
                                loggingSystem.info('Post-processing initialized');
                            }).catch(error => {
                                loggingSystem.warning('Failed to load FXAAShader:', error);
                            });
                        }).catch(error => {
                            loggingSystem.warning('Failed to load ShaderPass:', error);
                        });
                    }).catch(error => {
                        loggingSystem.warning('Failed to load UnrealBloomPass:', error);
                    });
                }).catch(error => {
                    loggingSystem.warning('Failed to load RenderPass:', error);
                });
            }).catch(error => {
                loggingSystem.warning('Failed to load EffectComposer:', error);
            });
        } catch (error) {
            loggingSystem.warning('Post-processing initialization failed:', error);
        }
    }
    
    /**
     * Initialize all rendering sub-systems
     * @param {Object} config - Initial configuration
     */
    initSubSystems(config) {
        // Initialize lighting system
        lightingSystem.init(this.scene, {
            sunIntensity: config.luminosity || 1.0,
            colorTemperature: this.getPlanetColorTemperature(config),
            enableShadows: this.config.enableShadows
        });
        
        // Initialize shader manager
        shaderManager.init(this.scene, {
            planetType: config.planetType || 'terrestrial',
            atmosphereType: config.atmosphere || 'normal',
            weatherType: 'clear'
        });
        
        // Initialize particle system
        particleSystem.init(this.scene);
        
        // Set up day/night cycle callback
        lightingSystem.setDayNightCycleCallback((cycleData) => {
            // Emit event for time of day change
            eventSystem.emit(EventTypes.TIME_OF_DAY_CHANGED, {
                timeOfDay: cycleData.timeOfDay,
                dayFactor: cycleData.dayFactor
            });
            
            // Update shader uniforms based on time of day
            shaderManager.updateTimeOfDay(cycleData.dayFactor);
        });
    }
    
    /**
     * Get color temperature based on planet type
     * @param {Object} config - Planet configuration
     * @returns {number} - Color temperature in Kelvin
     */
    getPlanetColorTemperature(config) {
        if (!config.planetType) return 6500;
        
        switch (config.planetType) {
            case 'desert': return 7500;
            case 'aquatic': return 6000;
            case 'volcanic': return 8000;
            case 'gas': return 7000;
            default: return 6500;
        }
    }
    
    /**
     * Subscribe to relevant events
     */
    subscribeToEvents() {
        // Weather events
        this.subscriptions.push(
            eventSystem.subscribe(EventTypes.WEATHER_CHANGED, data => {
                shaderManager.updateWeatherEffects(data.type);
                lightingSystem.updateLightingForWeather(data.type);
            })
        );
        
        // Planet configuration events
        this.subscriptions.push(
            eventSystem.subscribe('planet:config_changed', data => {
                this.updatePlanetAppearance(data);
            })
        );
        
        // Performance monitoring events
        this.subscriptions.push(
            eventSystem.subscribe('settings:quality_changed', data => {
                this.updateQualitySettings(data.qualityLevel);
            })
        );
    }
    
    /**
     * Start the animation loop
     */
    startAnimationLoop() {
        // Animation loop with optimizations
        const targetFrameInterval = 1000 / this.config.targetFPS;
        
        const animate = (currentTime) => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            // Throttle rendering for consistent performance
            const deltaTime = currentTime - this.lastFrameTime;
            if (deltaTime < targetFrameInterval) return;
            
            // Adjust for variable frame rate
            this.lastFrameTime = currentTime - (deltaTime % targetFrameInterval);
            
            // Update controls if available
            if (this.controls) {
                this.controls.update();
            }
            
            // Update sub-systems
            this.updateSubSystems(deltaTime);
            
            // Render the scene
            this.render();
            
            // Update performance monitor
            this.updatePerformanceStats();
        };
        
        // Start animation loop
        this.lastFrameTime = performance.now();
        animate(this.lastFrameTime);
    }
    
    /**
     * Update all rendering sub-systems
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    updateSubSystems(deltaTime) {
        // Convert to seconds for some systems
        const deltaSeconds = deltaTime / 1000;
        
        // Update lighting system
        if (lightingSystem) {
            lightingSystem.update(deltaSeconds);
        }
        
        // Update shader systems
        if (shaderManager) {
            shaderManager.update(deltaTime);
        }
        
        // Update particle systems
        if (particleSystem) {
            particleSystem.update(deltaSeconds);
        }
        
        // Adaptive quality adjustment
        if (this.config.adaptiveQuality && this.stats.fps > 0) {
            this.adjustQualityBasedOnPerformance();
        }
    }
    
    /**
     * Render the scene
     */
    render() {
        if (!this.scene || !this.camera) return;
        
        if (this.composer && this.config.enablePostProcessing) {
            // Render with post-processing
            this.composer.render();
        } else {
            // Standard rendering
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Update performance statistics
     */
    updatePerformanceStats() {
        if (!this.performanceMonitor) return;
        
        // Get renderer info
        const info = this.renderer.info;
        this.stats.drawCalls = info.render.calls;
        this.stats.triangles = info.render.triangles;
        
        // Count total elements (instanced + non-instanced)
        let totalElements = 0;
        for (const type in this.instancedMeshes) {
            totalElements += this.instancedMeshes[type].count;
        }
        totalElements += this.nonInstancedElements.children.length;
        this.stats.elements = totalElements;
        
        // Update performance monitor
        this.performanceMonitor.update(totalElements);
        
        // Store FPS
        this.stats.fps = this.performanceMonitor.fps;
    }
    
    /**
     * Adjust quality settings based on performance
     */
    adjustQualityBasedOnPerformance() {
        // Only adjust every few seconds to avoid rapid changes
        const now = performance.now();
        if (!this._lastQualityAdjustTime || now - this._lastQualityAdjustTime > 5000) {
            this._lastQualityAdjustTime = now;
            
            // Check FPS thresholds
            if (this.stats.fps < 30 && this.config.qualityLevel !== 'low') {
                this.updateQualitySettings('low');
                loggingSystem.info('Automatically reduced quality to low due to performance');
            } else if (this.stats.fps < 45 && this.config.qualityLevel === 'high') {
                this.updateQualitySettings('medium');
                loggingSystem.info('Automatically reduced quality to medium due to performance');
            } else if (this.stats.fps > 55 && this.config.qualityLevel === 'low') {
                this.updateQualitySettings('medium');
                loggingSystem.info('Automatically increased quality to medium due to good performance');
            } else if (this.stats.fps > 58 && this.config.qualityLevel === 'medium') {
                this.updateQualitySettings('high');
                loggingSystem.info('Automatically increased quality to high due to excellent performance');
            }
        }
    }
    
    /**
     * Update quality settings
     * @param {string} qualityLevel - Quality level (high, medium, low)
     */
    updateQualitySettings(qualityLevel) {
        this.config.qualityLevel = qualityLevel;
        
        // Update renderer settings
        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio, 
                qualityLevel === 'high' ? 2 : 
                qualityLevel === 'medium' ? 1.5 : 1
            )
        );
        
        // Update post-processing
        this.config.enableBloom = qualityLevel !== 'low';
        this.config.enableFXAA = qualityLevel !== 'low';
        this.config.enableSSAO = qualityLevel === 'high';
        
        // Update shader quality
        shaderManager.setQualityLevel(qualityLevel);
        
        // Update particle system quality
        particleSystem.setQualityLevel(qualityLevel);
        
        // Emit event for quality change
        eventSystem.emit('rendering:quality_changed', { qualityLevel });
        
        loggingSystem.info(`Rendering quality set to ${qualityLevel}`);
    }
    
    /**
     * Handle window resize
     * @param {HTMLElement} container - The container element
     */
    onWindowResize(container) {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Update composer if it exists
        if (this.composer) {
            this.composer.setSize(container.clientWidth, container.clientHeight);
        }
    }
    
    /**
     * Update planet appearance
     * @param {Object} config - Planet configuration
     */
    updatePlanetAppearance(config) {
        // This will be implemented in planetRenderer.js
        // Here we just update the lighting and shader configurations
        
        lightingSystem.updateLightingConfiguration({
            sunIntensity: config.luminosity || 1.0,
            colorTemperature: this.getPlanetColorTemperature(config)
        });
        
        shaderManager.updateConfiguration({
            planetType: config.planetType || 'terrestrial',
            atmosphereType: config.atmosphere || 'normal'
        });
    }
    
    /**
     * Create or update an instanced mesh
     * @param {string} type - Element type
     * @param {THREE.BufferGeometry} geometry - Geometry to use
     * @param {THREE.Material} material - Material to use
     * @param {number} maxInstances - Maximum number of instances
     * @returns {THREE.InstancedMesh} - The instanced mesh
     */
    createOrUpdateInstancedMesh(type, geometry, material, maxInstances = 5000) {
        if (this.instancedMeshes[type]) {
            // If geometry or material changed, recreate the mesh
            if (
                this.instancedMeshes[type].geometry !== geometry ||
                this.instancedMeshes[type].material !== material
            ) {
                this.scene.remove(this.instancedMeshes[type]);
                this.instancedMeshes[type].geometry.dispose();
                this.instancedMeshes[type].material.dispose();
                
                const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
                instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                
                // Add instance colors for health visualization
                const colors = new Float32Array(maxInstances * 3); // RGB for each instance
                instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
                
                this.instancedMeshes[type] = instancedMesh;
                this.scene.add(instancedMesh);
            }
        } else {
            // Create new instanced mesh
            const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            // Add instance colors for health visualization
            const colors = new Float32Array(maxInstances * 3); // RGB for each instance
            instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
            
            this.instancedMeshes[type] = instancedMesh;
            this.scene.add(instancedMesh);
        }
        
        return this.instancedMeshes[type];
    }
    
    /**
     * Update instanced elements
     * @param {string} type - Element type
     * @param {Array} elements - Elements to render
     * @param {Object} config - Simulation configuration
     * @param {Function} get3DPositionOnPlanet - Function to get 3D position on planet
     */
    updateInstancedElements(type, elements, config, get3DPositionOnPlanet) {
        const instancedMesh = this.instancedMeshes[type];
        if (!instancedMesh) return;
        
        updateInstancedMeshWithLOD(
            instancedMesh,
            elements,
            config,
            this.camera,
            get3DPositionOnPlanet,
            this.dummy
        );
    }
    
    /**
     * Add a non-instanced element to the scene
     * @param {THREE.Object3D} object - The object to add
     */
    addNonInstancedElement(object) {
        if (!object) return;
        this.nonInstancedElements.add(object);
    }
    
    /**
     * Remove a non-instanced element from the scene
     * @param {THREE.Object3D} object - The object to remove
     */
    removeNonInstancedElement(object) {
        if (!object) return;
        this.nonInstancedElements.remove(object);
    }
    
    /**
     * Clear all non-instanced elements
     */
    clearNonInstancedElements() {
        while (this.nonInstancedElements.children.length > 0) {
            const object = this.nonInstancedElements.children[0];
            this.nonInstancedElements.remove(object);
            
            // Dispose resources
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    }
    
    /**
     * Trigger a special visual effect
     * @param {string} effectType - Type of effect
     * @param {THREE.Vector3} position - Position for the effect
     * @param {Object} options - Additional options
     */
    triggerVisualEffect(effectType, position, options = {}) {
        if (!particleSystem) return;
        
        switch (effectType) {
            case 'explosion':
                particleSystem.createEffect('explosion', position, options);
                break;
                
            case 'volcano':
                particleSystem.createEffect('fireAndSmoke', position, {
                    scale: 2.0,
                    duration: 3.0,
                    ...options
                });
                break;
                
            case 'growth':
                particleSystem.createEffect('growth', position, options);
                break;
                
            case 'magic':
                particleSystem.createEffect('magic', position, options);
                break;
                
            case 'water':
                particleSystem.createEffect('waterEffect', position, options);
                break;
                
            default:
                particleSystem.spawnParticles(ParticleTypes.SPARKLE, position, options);
                break;
        }
    }
    
    /**
     * Set weather effects
     * @param {string} weatherType - Type of weather
     */
    setWeatherEffects(weatherType) {
        shaderManager.updateWeatherEffects(weatherType);
        lightingSystem.updateLightingForWeather(weatherType);
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Dispose instanced meshes
        for (const type in this.instancedMeshes) {
            const mesh = this.instancedMeshes[type];
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        this.instancedMeshes = {};
        
        // Clear non-instanced elements
        this.clearNonInstancedElements();
        
        // Dispose sub-systems
        if (lightingSystem) lightingSystem.dispose();
        if (shaderManager) shaderManager.dispose();
        if (particleSystem) particleSystem.dispose();
        
        // Dispose composer if it exists
        if (this.composer) {
            this.composer.dispose();
        }
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Unsubscribe from events
        this.subscriptions.forEach(subscription => {
            if (subscription.unsubscribe) {
                subscription.unsubscribe();
            }
        });
        
        loggingSystem.info('Rendering System disposed');
    }
}

// Create and export a singleton instance
export const renderingSystem = new RenderingSystem();

// Export the class for testing or if multiple instances are needed
export const RenderingSystemClass = RenderingSystem;