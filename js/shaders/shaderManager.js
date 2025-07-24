/**
 * Shader Manager - Central module for managing and updating all custom shaders
 * This module integrates all shader systems and provides a unified interface
 */

import * as THREE from 'three';
import { createWaterMaterial, updateWaterMaterial, waterVertexShader, waterFragmentShader } from './waterShader.js';
import { createAtmosphereMaterial, updateAtmosphereMaterial, configureAtmosphereForPlanetType, atmosphereVertexShader, atmosphereFragmentShader } from './atmosphereShader.js';
import { 
  createRainMaterial, 
  createSnowMaterial, 
  createCloudMaterial,
  createRainGeometry,
  createSnowGeometry,
  updateWeatherMaterial,
  configureWeatherEffects,
  rainVertexShader,
  rainFragmentShader,
  snowVertexShader,
  snowFragmentShader,
  cloudVertexShader,
  cloudFragmentShader
} from './weatherShader.js';
import { eventSystem, EventTypes } from '../systems/eventSystem.js';
import { stateManager } from '../systems/stateManager.js';
import { loggingSystem } from '../systems/loggingSystem.js';
import { particleSystem } from '../systems/particleSystem.js';
import { shaderErrorHandler } from '../systems/shaderErrorHandler.js';
import { shaderDiagnostics } from '../systems/shaderDiagnostics.js';
import { notificationSystem } from '../systems/notificationSystem.js';

/**
 * ShaderManager class for managing all custom shaders
 */
class ShaderManager {
  constructor() {
    // Materials
    this.materials = {
      water: null,
      atmosphere: null,
      rain: null,
      snow: null,
      cloud: null
    };
    
    // Meshes
    this.meshes = {
      water: null,
      atmosphere: null,
      rain: null,
      snow: null,
      cloud: null
    };
    
    // Configuration
    this.config = {
      planetType: 'terrestrial',
      atmosphereType: 'normal',
      weatherType: 'clear',
      dayCycleTime: 0
    };
    
    // Animation properties
    this.clock = THREE ? new THREE.Clock() : null;
    this.animationEnabled = true;
    
    // Event subscriptions
    this.subscriptions = [];
  }
  
  /**
   * Initialize the shader manager
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {Object} config - Initial configuration
   */
  init(scene, config = {}) {
    this.scene = scene;
    this.config = { ...this.config, ...config };
    
    // Initialize materials
    this.initMaterials();
    
    // Subscribe to events
    this.subscribeToEvents();
    
    // Initialize particle system
    particleSystem.init(scene);
    
    loggingSystem.info('Shader Manager initialized');
    return this;
  }
  
  /**
   * Initialize all shader materials
   */
  initMaterials() {
    // Create water material
    this.materials.water = createWaterMaterial({
      waterColor: new THREE.Color(0x0066FF),
      waterDeepColor: new THREE.Color(0x001E4C),
      waveHeight: 0.2,
      waveFrequency: 0.05,
      reflectionStrength: 0.7
    });
    
    // Create atmosphere material
    this.materials.atmosphere = createAtmosphereMaterial({
      atmosphereColor: new THREE.Color(0x88AAFF),
      atmosphereDensity: 0.3,
      planetRadius: 100,
      atmosphereThickness: 10
    });
    
    // Configure atmosphere based on planet type
    configureAtmosphereForPlanetType(
      this.materials.atmosphere, 
      this.config.planetType, 
      this.config.atmosphereType
    );
    
    // Create weather materials
    this.materials.rain = createRainMaterial({
      rainSpeed: 20.0,
      turbulence: 5.0
    });
    
    this.materials.snow = createSnowMaterial({
      snowSpeed: 5.0,
      turbulence: 8.0
    });
    
    this.materials.cloud = createCloudMaterial({
      windSpeed: 1.0,
      cloudDensity: 0.7
    });
    
    // Configure weather effects
    configureWeatherEffects(
      {
        rainMaterial: this.materials.rain,
        snowMaterial: this.materials.snow,
        cloudMaterial: this.materials.cloud
      },
      this.config.weatherType
    );
  }
  
  /**
   * Subscribe to relevant events
   */
  subscribeToEvents() {
    // Weather change events
    this.subscriptions.push(
      eventSystem.subscribe(EventTypes.WEATHER_CHANGED, data => {
        this.updateWeather(data.type);
      })
    );
    
    // Planet configuration events
    this.subscriptions.push(
      eventSystem.subscribe('planet:config_changed', data => {
        this.updatePlanetConfiguration(data);
      })
    );
    
    // State change events
    this.subscriptions.push(
      stateManager.addObserver(stateChange => {
        if (stateChange.to === 'paused') {
          this.animationEnabled = false;
        } else if (stateChange.to === 'running') {
          this.animationEnabled = true;
        }
      })
    );
  }
  
  /**
   * Update all shader materials
   */
  update() {
    if (!this.animationEnabled || !this.clock) return;
    
    try {
      const deltaTime = this.clock.getDelta();
      
      // Update water material
      if (this.materials.water) {
        try {
          updateWaterMaterial(this.materials.water, deltaTime);
        } catch (error) {
          this.handleShaderError('water', error);
        }
      }
      
      // Update atmosphere material
      if (this.materials.atmosphere) {
        try {
          updateAtmosphereMaterial(this.materials.atmosphere, deltaTime);
        } catch (error) {
          this.handleShaderError('atmosphere', error);
        }
      }
      
      // Update weather materials
      if (this.materials.rain) {
        try {
          updateWeatherMaterial(this.materials.rain, deltaTime);
        } catch (error) {
          this.handleShaderError('rain', error);
        }
      }
      
      if (this.materials.snow) {
        try {
          updateWeatherMaterial(this.materials.snow, deltaTime);
        } catch (error) {
          this.handleShaderError('snow', error);
        }
      }
      
      if (this.materials.cloud) {
        try {
          updateWeatherMaterial(this.materials.cloud, deltaTime);
        } catch (error) {
          this.handleShaderError('cloud', error);
        }
      }
      
      // Update particle system
      try {
        particleSystem.update();
      } catch (error) {
        loggingSystem.error("Error updating particle system:", error);
      }
    } catch (error) {
      loggingSystem.error("Critical error in shader update cycle:", error);
      // Instead of disabling all animations, we'll try to recover
      this.recoverFromCriticalError();
    }
  }
  
  /**
   * Handle shader-specific errors
   * @param {string} shaderType - Type of shader that encountered an error
   * @param {Error} error - The error object
   */
  handleShaderError(shaderType, error) {
    loggingSystem.error(`Error updating ${shaderType} shader:`, error);
    
    // Log the error to the shader error handler
    shaderErrorHandler.logError(shaderType, error.message);
    
    // Try to recover the specific shader
    this.recoverShader(shaderType);
  }
  
  /**
   * Attempt to recover a specific shader after an error
   * @param {string} shaderType - Type of shader to recover
   */
  recoverShader(shaderType) {
    loggingSystem.info(`Attempting to recover ${shaderType} shader`);
    
    try {
      switch (shaderType) {
        case 'water':
          if (this.meshes.water) {
            // Replace with a simpler material
            const fallbackMaterial = new THREE.MeshPhongMaterial({
              color: new THREE.Color(0x0066FF),
              transparent: true,
              opacity: 0.8,
              side: THREE.DoubleSide
            });
            this.meshes.water.material = fallbackMaterial;
            this.materials.water = fallbackMaterial;
          }
          break;
          
        case 'atmosphere':
          if (this.meshes.atmosphere) {
            // Replace with a simpler material
            const fallbackMaterial = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0x88AAFF),
              transparent: true,
              opacity: 0.3,
              side: THREE.BackSide
            });
            this.meshes.atmosphere.material = fallbackMaterial;
            this.materials.atmosphere = fallbackMaterial;
          }
          break;
          
        case 'rain':
        case 'snow':
          // Hide the particles if they cause problems
          if (this.meshes[shaderType]) {
            this.meshes[shaderType].visible = false;
          }
          break;
          
        case 'cloud':
          if (this.meshes.cloud) {
            // Replace with a simpler material
            const fallbackMaterial = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0xFFFFFF),
              transparent: true,
              opacity: 0.5,
              side: THREE.DoubleSide
            });
            this.meshes.cloud.material = fallbackMaterial;
            this.materials.cloud = fallbackMaterial;
          }
          break;
      }
      
      loggingSystem.info(`Successfully recovered ${shaderType} shader`);
      
      // Dispatch an event to notify the system about the recovery
      eventSystem.dispatch(EventTypes.SHADER_RECOVERED, { 
        shaderType, 
        timestamp: Date.now() 
      });
    } catch (recoveryError) {
      loggingSystem.error(`Failed to recover ${shaderType} shader:`, recoveryError);
    }
  }
  
  /**
   * Recover from a critical shader error
   */
  recoverFromCriticalError() {
    loggingSystem.warn("Attempting to recover from critical shader error");
    
    // Reset the clock to prevent large time jumps
    if (this.clock) {
      this.clock.getDelta(); // Clear accumulated time
    }
    
    // Try to reinitialize materials with fallback options
    try {
      this.initMaterialsWithFallbacks();
      this.animationEnabled = true;
      
      loggingSystem.info("Successfully recovered from critical shader error");
      
      // Dispatch an event to notify the system about the recovery
      eventSystem.dispatch(EventTypes.SHADER_SYSTEM_RECOVERED, { 
        timestamp: Date.now() 
      });
    } catch (error) {
      loggingSystem.error("Failed to recover from critical shader error:", error);
      this.animationEnabled = false;
      
      // Dispatch an event to notify the system about the failure
      eventSystem.dispatch(EventTypes.SHADER_SYSTEM_FAILED, { 
        error: error.message,
        timestamp: Date.now() 
      });
    }
  }
  
  /**
   * Initialize materials with fallback options
   */
  initMaterialsWithFallbacks() {
    // Use simple materials instead of shaders
    this.materials.water = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x0066FF),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    this.materials.atmosphere = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x88AAFF),
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    this.materials.rain = new THREE.PointsMaterial({
      color: new THREE.Color(0x88AAFF),
      size: 2.0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.materials.snow = new THREE.PointsMaterial({
      color: new THREE.Color(0xFFFFFF),
      size: 2.0,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    this.materials.cloud = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xFFFFFF),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    // Apply materials to meshes if they exist
    if (this.meshes.water) this.meshes.water.material = this.materials.water;
    if (this.meshes.atmosphere) this.meshes.atmosphere.material = this.materials.atmosphere;
    if (this.meshes.rain) this.meshes.rain.material = this.materials.rain;
    if (this.meshes.snow) this.meshes.snow.material = this.materials.snow;
    if (this.meshes.cloud) this.meshes.cloud.material = this.materials.cloud;
  }
  
  /**
   * Apply water shader to a mesh
   * @param {THREE.Mesh} mesh - The mesh to apply the water shader to
   */
  applyWaterShader(mesh) {
    if (!mesh || !this.materials.water) return;
    
    mesh.material = this.materials.water;
    this.meshes.water = mesh;
  }
  
  /**
   * Apply atmosphere shader to a mesh
   * @param {THREE.Mesh} mesh - The mesh to apply the atmosphere shader to
   */
  applyAtmosphereShader(mesh) {
    if (!mesh || !this.materials.atmosphere) return;
    
    mesh.material = this.materials.atmosphere;
    this.meshes.atmosphere = mesh;
  }
  
  /**
   * Create and add rain particles to the scene
   * @param {number} count - Number of rain particles
   * @param {number} spread - How far to spread the particles
   */
  createRainParticles(count = 1000, spread = 500) {
    if (!this.scene || !this.materials.rain) return;
    
    // Remove existing rain particles
    if (this.meshes.rain) {
      this.scene.remove(this.meshes.rain);
      this.meshes.rain.geometry.dispose();
    }
    
    // Create new rain particles
    const geometry = createRainGeometry(count, spread);
    this.meshes.rain = new THREE.Points(geometry, this.materials.rain);
    this.meshes.rain.visible = this.config.weatherType === 'rain' || this.config.weatherType === 'storm';
    this.scene.add(this.meshes.rain);
  }
  
  /**
   * Create and add snow particles to the scene
   * @param {number} count - Number of snow particles
   * @param {number} spread - How far to spread the particles
   */
  createSnowParticles(count = 1000, spread = 500) {
    if (!this.scene || !this.materials.snow) return;
    
    // Remove existing snow particles
    if (this.meshes.snow) {
      this.scene.remove(this.meshes.snow);
      this.meshes.snow.geometry.dispose();
    }
    
    // Create new snow particles
    const geometry = createSnowGeometry(count, spread);
    this.meshes.snow = new THREE.Points(geometry, this.materials.snow);
    this.meshes.snow.visible = this.config.weatherType === 'snow' || this.config.weatherType === 'blizzard';
    this.scene.add(this.meshes.snow);
  }
  
  /**
   * Update weather effects
   * @param {string} weatherType - Type of weather
   */
  updateWeather(weatherType) {
    this.config.weatherType = weatherType;
    
    // Configure weather materials
    configureWeatherEffects(
      {
        rainMaterial: this.materials.rain,
        snowMaterial: this.materials.snow,
        cloudMaterial: this.materials.cloud
      },
      weatherType
    );
    
    // Update visibility of weather particles
    if (this.meshes.rain) {
      this.meshes.rain.visible = weatherType === 'rain' || weatherType === 'storm';
    }
    
    if (this.meshes.snow) {
      this.meshes.snow.visible = weatherType === 'snow' || weatherType === 'blizzard';
    }
    
    loggingSystem.info(`Weather updated to: ${weatherType}`);
  }

  /**
   * Update weather effects (alias for updateWeather for compatibility)
   * @param {string} weatherType - Type of weather
   */
  updateWeatherEffects(weatherType) {
    this.updateWeather(weatherType);
  }
  
  /**
   * Update planet configuration
   * @param {Object} config - Planet configuration
   */
  updatePlanetConfiguration(config) {
    this.config = { ...this.config, ...config };
    
    // Update atmosphere based on planet type
    if (this.materials.atmosphere) {
      configureAtmosphereForPlanetType(
        this.materials.atmosphere, 
        this.config.planetType, 
        this.config.atmosphereType
      );
    }
    
    loggingSystem.info(`Planet configuration updated: ${this.config.planetType}, ${this.config.atmosphereType}`);
  }
  
  /**
   * Update shader uniforms based on time of day
   * @param {number} dayFactor - Factor representing time of day (0-1)
   */
  updateTimeOfDay(dayFactor) {
    // Update water material based on time of day
    if (this.materials.water && this.materials.water.uniforms) {
      // Adjust water color based on time of day
      const waterColor = new THREE.Color(0x0066FF);
      const waterDeepColor = new THREE.Color(0x001E4C);
      
      // Make water darker at night
      if (dayFactor < 0.5) {
        const nightFactor = 1 - (dayFactor * 2);
        waterColor.multiplyScalar(0.5 + 0.5 * (1 - nightFactor));
        waterDeepColor.multiplyScalar(0.3 + 0.7 * (1 - nightFactor));
      }
      
      if (this.materials.water.uniforms.waterColor) {
        this.materials.water.uniforms.waterColor.value = waterColor;
      }
      
      if (this.materials.water.uniforms.waterDeepColor) {
        this.materials.water.uniforms.waterDeepColor.value = waterDeepColor;
      }
    }
    
    // Update atmosphere material based on time of day
    if (this.materials.atmosphere && this.materials.atmosphere.uniforms) {
      // Adjust atmosphere glow based on time of day
      if (this.materials.atmosphere.uniforms.glowIntensity) {
        // More glow during sunrise/sunset, less during day/night
        const timeOfDayFactor = Math.sin(dayFactor * Math.PI);
        const glowIntensity = 0.5 + timeOfDayFactor * 0.5;
        this.materials.atmosphere.uniforms.glowIntensity.value = glowIntensity;
      }
    }
    
    // Store the current day factor
    this.config.dayCycleTime = dayFactor;
    
    loggingSystem.debug(`Shader time of day updated: ${dayFactor.toFixed(2)}`);
  }
  
  /**
   * Run diagnostics on all shaders
   * @returns {Object} - Diagnostic results
   */
  runDiagnostics() {
    loggingSystem.info('Running shader diagnostics');
    
    const results = {};
    
    // Run diagnostics on water shader
    if (waterVertexShader && waterFragmentShader) {
      results.water = shaderDiagnostics.runDiagnostics(
        waterVertexShader,
        waterFragmentShader,
        'water'
      );
    }
    
    // Run diagnostics on atmosphere shader
    if (atmosphereVertexShader && atmosphereFragmentShader) {
      results.atmosphere = shaderDiagnostics.runDiagnostics(
        atmosphereVertexShader,
        atmosphereFragmentShader,
        'atmosphere'
      );
    }
    
    // Run diagnostics on rain shader
    if (rainVertexShader && rainFragmentShader) {
      results.rain = shaderDiagnostics.runDiagnostics(
        rainVertexShader,
        rainFragmentShader,
        'rain'
      );
    }
    
    // Run diagnostics on snow shader
    if (snowVertexShader && snowFragmentShader) {
      results.snow = shaderDiagnostics.runDiagnostics(
        snowVertexShader,
        snowFragmentShader,
        'snow'
      );
    }
    
    // Run diagnostics on cloud shader
    if (cloudVertexShader && cloudFragmentShader) {
      results.cloud = shaderDiagnostics.runDiagnostics(
        cloudVertexShader,
        cloudFragmentShader,
        'cloud'
      );
    }
    
    // Show notification to user
    notificationSystem.info('Shader diagnostics completed. Check console for details.');
    
    // Log results
    loggingSystem.info('Shader diagnostics results:', results);
    
    return results;
  }
  
  /**
   * Show shader diagnostics report
   */
  showDiagnosticsReport() {
    // Run diagnostics first
    this.runDiagnostics();
    
    // Show diagnostic report
    shaderDiagnostics.showDiagnosticReport();
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose materials
    for (const key in this.materials) {
      if (this.materials[key]) {
        this.materials[key].dispose();
      }
    }
    
    // Dispose geometries
    for (const key in this.meshes) {
      if (this.meshes[key] && this.meshes[key].geometry) {
        this.meshes[key].geometry.dispose();
      }
    }
    
    // Unsubscribe from events
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    
    loggingSystem.info('Shader Manager disposed');
  }
}

// Create and export a singleton instance
export const shaderManager = new ShaderManager();

// Export the class for testing or if multiple instances are needed
export const ShaderManagerClass = ShaderManager;