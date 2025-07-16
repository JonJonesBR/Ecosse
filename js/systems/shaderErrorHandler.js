/**
 * Shader Error Handler - System for validating and handling shader errors
 * This module provides utilities for shader validation and error recovery
 */

import * as THREE from 'three';
import { loggingSystem } from './loggingSystem.js';
import { notificationSystem } from './notificationSystem.js';

/**
 * Class for handling shader errors and validation
 */
class ShaderErrorHandler {
  constructor() {
    this.fallbackShaders = {
      water: {
        vertex: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragment: `
          uniform vec3 waterColor;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(waterColor, 0.8);
          }
        `
      },
      atmosphere: {
        vertex: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragment: `
          uniform vec3 atmosphereColor;
          uniform float atmosphereDensity;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(atmosphereColor, atmosphereDensity);
          }
        `
      },
      weather: {
        vertex: `
          attribute float size;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragment: `
          void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
          }
        `
      }
    };
    
    // Keep track of shader errors
    this.errorLog = [];
    this.maxErrorLogSize = 50;
  }
  
  /**
   * Validate a shader program
   * @param {string} vertexShader - The vertex shader source code
   * @param {string} fragmentShader - The fragment shader source code
   * @param {string} shaderType - Type of shader (water, atmosphere, etc.)
   * @returns {Object} - Validation result with status and error message if any
   */
  validateShader(vertexShader, fragmentShader, shaderType) {
    try {
      // Create a temporary renderer for shader compilation
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
      
      // Create a simple material with the shaders
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.getDefaultUniforms(shaderType)
      });
      
      // Create a simple mesh to test the material
      const geometry = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Create a scene and add the mesh
      const scene = new THREE.Scene();
      scene.add(mesh);
      
      // Create a camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 5;
      
      // Try to render the scene
      renderer.render(scene, camera);
      
      // If we get here, the shader compiled successfully
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      
      return { valid: true };
    } catch (error) {
      // Log the error
      this.logError(shaderType, error.message);
      
      // Return validation result
      return { 
        valid: false, 
        error: error.message,
        fallback: this.getFallbackShader(shaderType)
      };
    }
  }
  
  /**
   * Get default uniforms for shader validation
   * @param {string} shaderType - Type of shader
   * @returns {Object} - Default uniforms
   */
  getDefaultUniforms(shaderType) {
    switch (shaderType) {
      case 'water':
        return {
          time: { value: 0 },
          waterColor: { value: new THREE.Color(0x0066FF) },
          waterDeepColor: { value: new THREE.Color(0x001E4C) },
          waveHeight: { value: 0.2 },
          waveFrequency: { value: 0.05 },
          reflectionStrength: { value: 0.7 },
          distortionScale: { value: 3.0 },
          envMap: { value: new THREE.CubeTexture() }
        };
      case 'atmosphere':
        return {
          atmosphereColor: { value: new THREE.Color(0x88AAFF) },
          atmosphereHighlightColor: { value: new THREE.Color(0xFFFFFF) },
          atmosphereDensity: { value: 0.3 },
          planetRadius: { value: 100 },
          atmosphereThickness: { value: 10 },
          scatteringStrength: { value: 1.0 },
          time: { value: 0 }
        };
      case 'rain':
        return {
          time: { value: 0 },
          rainSpeed: { value: 20.0 },
          turbulence: { value: 5.0 }
        };
      case 'snow':
        return {
          time: { value: 0 },
          snowSpeed: { value: 5.0 },
          turbulence: { value: 8.0 }
        };
      case 'cloud':
        return {
          time: { value: 0 },
          windSpeed: { value: 1.0 },
          cloudDensity: { value: 0.7 }
        };
      default:
        return {};
    }
  }
  
  /**
   * Get fallback shader for a specific shader type
   * @param {string} shaderType - Type of shader
   * @returns {Object} - Fallback vertex and fragment shaders
   */
  getFallbackShader(shaderType) {
    // Get the appropriate fallback shader or use a generic one
    const fallback = this.fallbackShaders[shaderType] || this.fallbackShaders.water;
    
    loggingSystem.warn(`Using fallback shader for ${shaderType}`);
    
    return {
      vertexShader: fallback.vertex,
      fragmentShader: fallback.fragment
    };
  }
  
  /**
   * Create a safe shader material with error handling
   * @param {Object} options - Shader material options
   * @returns {THREE.ShaderMaterial} - Safe shader material
   */
  createSafeShaderMaterial(options) {
    const {
      vertexShader,
      fragmentShader,
      uniforms,
      shaderType = 'generic',
      ...otherOptions
    } = options;
    
    // Validate the shaders
    const validationResult = this.validateShader(vertexShader, fragmentShader, shaderType);
    
    if (validationResult.valid) {
      // If valid, create the material with the original shaders
      return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        ...otherOptions
      });
    } else {
      // If invalid, use fallback shaders
      const { vertexShader: fallbackVertex, fragmentShader: fallbackFragment } = validationResult.fallback;
      
      loggingSystem.error(`Shader error in ${shaderType}: ${validationResult.error}`);
      loggingSystem.info(`Using fallback shader for ${shaderType}`);
      
      return new THREE.ShaderMaterial({
        vertexShader: fallbackVertex,
        fragmentShader: fallbackFragment,
        uniforms,
        ...otherOptions
      });
    }
  }
  
  /**
   * Log a shader error
   * @param {string} shaderType - Type of shader
   * @param {string} errorMessage - Error message
   */
  logError(shaderType, errorMessage) {
    // Add error to log
    this.errorLog.push({
      timestamp: new Date(),
      shaderType,
      message: errorMessage
    });
    
    // Trim log if it gets too large
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
    }
    
    // Log to console
    loggingSystem.error(`Shader error in ${shaderType}: ${errorMessage}`);
    
    // Show notification to user
    notificationSystem.warning(`Shader issue detected in ${shaderType}. Using fallback shader.`, 8000);
  }
  
  /**
   * Get the error log
   * @returns {Array} - Error log
   */
  getErrorLog() {
    return [...this.errorLog];
  }
  
  /**
   * Clear the error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}

// Create and export a singleton instance
export const shaderErrorHandler = new ShaderErrorHandler();