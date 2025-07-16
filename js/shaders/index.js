/**
 * Shaders module - Exports all shader components
 * This module serves as the central point for accessing all shader functionality
 */

import * as THREE from 'three';

// Import shader modules
import { 
  createWaterMaterial, 
  updateWaterMaterial,
  waterVertexShader,
  waterFragmentShader
} from './waterShader.js';

import { 
  createAtmosphereMaterial, 
  updateAtmosphereMaterial, 
  configureAtmosphereForPlanetType,
  atmosphereVertexShader,
  atmosphereFragmentShader
} from './atmosphereShader.js';

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

import { shaderManager, ShaderManagerClass } from './shaderManager.js';
import { particleSystem, ParticleTypes } from '../systems/particleSystem.js';

// Export all shader components
export {
  // Water shader
  createWaterMaterial,
  updateWaterMaterial,
  waterVertexShader,
  waterFragmentShader,
  
  // Atmosphere shader
  createAtmosphereMaterial,
  updateAtmosphereMaterial,
  configureAtmosphereForPlanetType,
  atmosphereVertexShader,
  atmosphereFragmentShader,
  
  // Weather shaders
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
  cloudFragmentShader,
  
  // Shader manager
  shaderManager,
  ShaderManagerClass,
  
  // Particle system
  particleSystem,
  ParticleTypes
};

/**
 * Initialize all shader systems
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} config - Initial configuration
 * @returns {Object} - The shader manager instance
 */
export function initShaders(scene, config = {}) {
  return shaderManager.init(scene, config);
}