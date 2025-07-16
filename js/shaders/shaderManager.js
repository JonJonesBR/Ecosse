/**
 * Shader Manager - Central module for managing and updating all custom shaders
 * This module integrates all shader systems and provides a unified interface
 */

import * as THREE from 'three';
import { createWaterMaterial, updateWaterMaterial } from './waterShader.js';
import { createAtmosphereMaterial, updateAtmosphereMaterial, configureAtmosphereForPlanetType } from './atmosphereShader.js';
import { 
  createRainMaterial, 
  createSnowMaterial, 
  createCloudMaterial,
  createRainGeometry,
  createSnowGeometry,
  updateWeatherMaterial,
  configureWeatherEffects
} from './weatherShader.js';
import { eventSystem, EventTypes } from '../systems/eventSystem.js';
import { stateManager } from '../systems/stateManager.js';
import { loggingSystem } from '../systems/loggingSystem.js';
import { particleSystem } from '../systems/particleSystem.js';

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
        updateWaterMaterial(this.materials.water, deltaTime);
      }
      
      // Update atmosphere material
      if (this.materials.atmosphere) {
        updateAtmosphereMaterial(this.materials.atmosphere, deltaTime);
      }
      
      // Update weather materials
      if (this.materials.rain) {
        updateWeatherMaterial(this.materials.rain, deltaTime);
      }
      
      if (this.materials.snow) {
        updateWeatherMaterial(this.materials.snow, deltaTime);
      }
      
      if (this.materials.cloud) {
        updateWeatherMaterial(this.materials.cloud, deltaTime);
      }
      
      // Update particle system
      particleSystem.update();
    } catch (error) {
      console.error("Error updating shaders:", error);
      // Disable animation if there's an error to prevent continuous errors
      this.animationEnabled = false;
    }
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