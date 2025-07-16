/**
 * Lighting System - Advanced lighting management for the planet ecosystem
 * This system manages all light sources, day/night cycles, and lighting effects
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from './eventSystem.js';
import { loggingSystem } from './loggingSystem.js';

/**
 * LightingSystem class for managing all light sources and effects
 */
class LightingSystem {
  constructor() {
    // Light sources
    this.lights = {
      ambient: null,
      sun: null,
      moon: null,
      hemisphere: null,
      pointLights: []
    };
    
    // Configuration
    this.config = {
      dayCycleSpeed: 0.001,
      dayCycleTime: 0,
      sunIntensity: 1.0,
      moonIntensity: 0.3,
      ambientDayIntensity: 0.8,
      ambientNightIntensity: 0.2,
      enableShadows: false,
      colorTemperature: 6500, // in Kelvin
      sunColor: 0xffffff,
      moonColor: 0xadd8e6,
      sunPosition: new THREE.Vector3(200, 100, 200),
      moonPosition: new THREE.Vector3(-200, -100, -200)
    };
    
    // Scene reference
    this.scene = null;
    
    // Event subscriptions
    this.subscriptions = [];
    
    // Callbacks
    this.onDayNightCycleChange = null;
  }
  
  /**
   * Initialize the lighting system
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {Object} config - Initial configuration
   */
  init(scene, config = {}) {
    this.scene = scene;
    this.config = { ...this.config, ...config };
    
    // Create light sources
    this.createLights();
    
    // Subscribe to events
    this.subscribeToEvents();
    
    loggingSystem.info('Lighting System initialized');
    return this;
  }
  
  /**
   * Create all light sources
   */
  createLights() {
    if (!this.scene) return;
    
    // Remove existing lights
    this.removeLights();
    
    // Create ambient light
    this.lights.ambient = new THREE.AmbientLight(0x404040, this.config.ambientDayIntensity);
    this.scene.add(this.lights.ambient);
    
    // Create hemisphere light for more natural lighting
    this.lights.hemisphere = new THREE.HemisphereLight(
      0xffffff, // Sky color
      0x444444, // Ground color
      0.6       // Intensity
    );
    this.scene.add(this.lights.hemisphere);
    
    // Create sun directional light
    this.lights.sun = new THREE.DirectionalLight(this.config.sunColor, this.config.sunIntensity);
    this.lights.sun.position.copy(this.config.sunPosition);
    this.lights.sun.name = 'sunLight';
    
    // Setup shadows if enabled
    if (this.config.enableShadows) {
      this.lights.sun.castShadow = true;
      this.lights.sun.shadow.mapSize.width = 1024;
      this.lights.sun.shadow.mapSize.height = 1024;
      this.lights.sun.shadow.camera.near = 10;
      this.lights.sun.shadow.camera.far = 500;
      this.lights.sun.shadow.camera.left = -100;
      this.lights.sun.shadow.camera.right = 100;
      this.lights.sun.shadow.camera.top = 100;
      this.lights.sun.shadow.camera.bottom = -100;
      this.lights.sun.shadow.bias = -0.001;
    }
    
    this.scene.add(this.lights.sun);
    
    // Create moon directional light
    this.lights.moon = new THREE.DirectionalLight(this.config.moonColor, 0); // Start with zero intensity
    this.lights.moon.position.copy(this.config.moonPosition);
    this.lights.moon.name = 'moonLight';
    this.scene.add(this.lights.moon);
  }
  
  /**
   * Remove all lights from the scene
   */
  removeLights() {
    if (!this.scene) return;
    
    // Remove ambient light
    if (this.lights.ambient) {
      this.scene.remove(this.lights.ambient);
      this.lights.ambient = null;
    }
    
    // Remove hemisphere light
    if (this.lights.hemisphere) {
      this.scene.remove(this.lights.hemisphere);
      this.lights.hemisphere = null;
    }
    
    // Remove sun light
    if (this.lights.sun) {
      this.scene.remove(this.lights.sun);
      this.lights.sun = null;
    }
    
    // Remove moon light
    if (this.lights.moon) {
      this.scene.remove(this.lights.moon);
      this.lights.moon = null;
    }
    
    // Remove all point lights
    this.lights.pointLights.forEach(light => {
      if (light) {
        this.scene.remove(light);
      }
    });
    this.lights.pointLights = [];
  }
  
  /**
   * Subscribe to relevant events
   */
  subscribeToEvents() {
    // Weather change events
    this.subscriptions.push(
      eventSystem.subscribe(EventTypes.WEATHER_CHANGED, data => {
        this.updateLightingForWeather(data.type);
      })
    );
    
    // Planet configuration events
    this.subscriptions.push(
      eventSystem.subscribe('planet:config_changed', data => {
        this.updateLightingConfiguration(data);
      })
    );
  }
  
  /**
   * Update lighting based on weather conditions
   * @param {string} weatherType - Type of weather
   */
  updateLightingForWeather(weatherType) {
    if (!this.lights.ambient || !this.lights.hemisphere) return;
    
    // Adjust lighting based on weather
    switch (weatherType) {
      case 'clear':
        this.lights.hemisphere.intensity = 0.6;
        break;
      case 'cloudy':
        this.lights.hemisphere.intensity = 0.4;
        break;
      case 'rain':
        this.lights.hemisphere.intensity = 0.3;
        break;
      case 'storm':
        this.lights.hemisphere.intensity = 0.2;
        // Add lightning flashes
        this.addLightningEffect();
        break;
      case 'snow':
        this.lights.hemisphere.intensity = 0.5;
        // Adjust color temperature for snow
        this.setColorTemperature(9000); // Cooler light for snow
        break;
      case 'blizzard':
        this.lights.hemisphere.intensity = 0.3;
        this.setColorTemperature(10000); // Even cooler light for blizzard
        break;
      default:
        this.lights.hemisphere.intensity = 0.6;
        this.setColorTemperature(6500); // Reset to default
        break;
    }
    
    loggingSystem.info(`Lighting adjusted for weather: ${weatherType}`);
  }
  
  /**
   * Add lightning effect during storms
   */
  addLightningEffect() {
    if (!this.scene) return;
    
    // Random chance of lightning
    if (Math.random() > 0.98) {
      // Create a point light for lightning
      const lightning = new THREE.PointLight(0xffffff, 2, 500);
      lightning.position.set(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200 + 100,
        (Math.random() - 0.5) * 400
      );
      
      this.scene.add(lightning);
      
      // Remove the lightning after a short duration
      setTimeout(() => {
        this.scene.remove(lightning);
      }, 150);
    }
  }
  
  /**
   * Update lighting configuration
   * @param {Object} config - Lighting configuration
   */
  updateLightingConfiguration(config) {
    // Update configuration
    this.config = { ...this.config, ...config };
    
    // Update sun intensity
    if (this.lights.sun) {
      this.lights.sun.intensity = this.config.sunIntensity;
    }
    
    // Update color temperature
    if (config.colorTemperature) {
      this.setColorTemperature(config.colorTemperature);
    }
    
    // Update shadow settings
    if (this.lights.sun && config.enableShadows !== undefined) {
      this.lights.sun.castShadow = config.enableShadows;
    }
    
    loggingSystem.info('Lighting configuration updated');
  }
  
  /**
   * Set color temperature of lights
   * @param {number} temperature - Color temperature in Kelvin
   */
  setColorTemperature(temperature) {
    // Convert temperature to RGB color
    const color = this.kelvinToRGB(temperature);
    
    // Update sun color
    if (this.lights.sun) {
      this.lights.sun.color.setRGB(color.r, color.g, color.b);
    }
    
    // Update hemisphere light sky color
    if (this.lights.hemisphere) {
      this.lights.hemisphere.color.setRGB(color.r, color.g, color.b);
    }
  }
  
  /**
   * Convert Kelvin temperature to RGB color
   * @param {number} kelvin - Temperature in Kelvin
   * @returns {Object} RGB color object
   */
  kelvinToRGB(kelvin) {
    // Algorithm from http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
    kelvin = kelvin / 100;
    
    let r, g, b;
    
    // Red
    if (kelvin <= 66) {
      r = 255;
    } else {
      r = kelvin - 60;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      r = Math.max(0, Math.min(255, r));
    }
    
    // Green
    if (kelvin <= 66) {
      g = kelvin;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
    } else {
      g = kelvin - 60;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
    }
    g = Math.max(0, Math.min(255, g));
    
    // Blue
    if (kelvin >= 66) {
      b = 255;
    } else if (kelvin <= 19) {
      b = 0;
    } else {
      b = kelvin - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = Math.max(0, Math.min(255, b));
    }
    
    return {
      r: r / 255,
      g: g / 255,
      b: b / 255
    };
  }
  
  /**
   * Update day/night cycle
   * @param {number} deltaTime - Time since last update
   */
  updateDayNightCycle(deltaTime) {
    if (!this.lights.sun || !this.lights.moon || !this.lights.ambient) return;
    
    // Update day cycle time
    this.config.dayCycleTime += this.config.dayCycleSpeed * deltaTime;
    
    // Calculate sun position
    const sunX = Math.sin(this.config.dayCycleTime) * 200;
    const sunZ = Math.cos(this.config.dayCycleTime) * 200;
    this.lights.sun.position.set(sunX, 100, sunZ);
    
    // Calculate moon position (opposite to sun)
    const moonX = Math.sin(this.config.dayCycleTime + Math.PI) * 200;
    const moonZ = Math.cos(this.config.dayCycleTime + Math.PI) * 200;
    this.lights.moon.position.set(moonX, 100, moonZ);
    
    // Adjust sun intensity based on its position
    const sunIntensityFactor = Math.max(0, Math.sin(this.config.dayCycleTime + Math.PI / 4));
    this.lights.sun.intensity = this.config.sunIntensity * sunIntensityFactor;
    
    // Adjust moon intensity
    const moonIntensityFactor = Math.max(0, Math.sin(this.config.dayCycleTime - Math.PI / 4));
    this.lights.moon.intensity = this.config.moonIntensity * moonIntensityFactor;
    
    // Adjust ambient light intensity based on time of day
    const dayFactor = (Math.sin(this.config.dayCycleTime) + 1) * 0.5; // 0 to 1
    const ambientIntensity = this.config.ambientNightIntensity + 
                            (this.config.ambientDayIntensity - this.config.ambientNightIntensity) * dayFactor;
    this.lights.ambient.intensity = ambientIntensity;
    
    // Adjust hemisphere light intensity
    if (this.lights.hemisphere) {
      this.lights.hemisphere.intensity = 0.3 + 0.3 * dayFactor;
    }
    
    // Notify listeners of day/night cycle change
    if (this.onDayNightCycleChange) {
      const timeOfDay = this.getTimeOfDay();
      this.onDayNightCycleChange({
        cycleTime: this.config.dayCycleTime,
        dayFactor: dayFactor,
        timeOfDay: timeOfDay
      });
    }
  }
  
  /**
   * Get current time of day
   * @returns {string} Time of day (dawn, day, dusk, night)
   */
  getTimeOfDay() {
    // Normalize cycle time to 0-1 range
    const normalizedTime = (Math.sin(this.config.dayCycleTime) + 1) * 0.5;
    
    if (normalizedTime > 0.9 || normalizedTime < 0.1) {
      return 'dawn';
    } else if (normalizedTime >= 0.1 && normalizedTime < 0.4) {
      return 'day';
    } else if (normalizedTime >= 0.4 && normalizedTime < 0.6) {
      return 'dusk';
    } else {
      return 'night';
    }
  }
  
  /**
   * Add a point light to the scene
   * @param {Object} options - Point light options
   * @returns {THREE.PointLight} The created point light
   */
  addPointLight(options = {}) {
    if (!this.scene) return null;
    
    const {
      color = 0xffffff,
      intensity = 1,
      distance = 100,
      position = { x: 0, y: 0, z: 0 },
      castShadow = false
    } = options;
    
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(position.x, position.y, position.z);
    light.castShadow = castShadow && this.config.enableShadows;
    
    this.scene.add(light);
    this.lights.pointLights.push(light);
    
    return light;
  }
  
  /**
   * Remove a point light from the scene
   * @param {THREE.PointLight} light - The point light to remove
   */
  removePointLight(light) {
    if (!this.scene || !light) return;
    
    const index = this.lights.pointLights.indexOf(light);
    if (index !== -1) {
      this.scene.remove(light);
      this.lights.pointLights.splice(index, 1);
    }
  }
  
  /**
   * Set callback for day/night cycle changes
   * @param {Function} callback - Callback function
   */
  setDayNightCycleCallback(callback) {
    this.onDayNightCycleChange = callback;
  }
  
  /**
   * Update the lighting system
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update day/night cycle
    this.updateDayNightCycle(deltaTime);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove all lights
    this.removeLights();
    
    // Unsubscribe from events
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    
    loggingSystem.info('Lighting System disposed');
  }
}

// Create and export a singleton instance
export const lightingSystem = new LightingSystem();

// Export the class for testing or if multiple instances are needed
export const LightingSystemClass = LightingSystem;