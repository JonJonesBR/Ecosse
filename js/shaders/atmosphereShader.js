/**
 * Atmosphere Shader - Enhanced atmospheric effects for planets
 * This shader creates a realistic atmospheric effect with scattering and rim lighting
 */

import * as THREE from 'three';
import { shaderErrorHandler } from '../systems/shaderErrorHandler.js';

// Vertex shader for atmosphere
export const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vViewAngle;
  varying vec2 vUv;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Calculate view angle for atmospheric scattering
    vViewAngle = dot(normalize(vViewPosition), vNormal);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for atmosphere
export const atmosphereFragmentShader = `
  uniform vec3 atmosphereColor;
  uniform vec3 atmosphereHighlightColor;
  uniform float atmosphereDensity;
  uniform float planetRadius;
  uniform float atmosphereThickness;
  uniform float scatteringStrength;
  uniform float time;
  
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vViewAngle;
  varying vec2 vUv;
  
  // Rayleigh scattering approximation
  vec3 rayleighScattering(float cosAngle, vec3 color) {
    // Simplified Rayleigh scattering formula
    float scattering = 0.25 + 0.75 * pow(1.0 - cosAngle, 5.0);
    return color * scattering;
  }
  
  // Mie scattering approximation
  vec3 mieScattering(float cosAngle, vec3 color) {
    // Simplified Mie scattering formula
    float g = 0.8; // Asymmetry factor
    float scattering = 1.5 * ((1.0 - g * g) / (2.0 + g * g)) * 
                      (1.0 + cosAngle * cosAngle) / 
                      pow(1.0 + g * g - 2.0 * g * cosAngle, 1.5);
    return color * scattering;
  }
  
  void main() {
    // Calculate basic rim lighting effect
    float intensity = pow(atmosphereDensity + dot(vNormal, normalize(vViewPosition)), 2.0);
    
    // Calculate atmospheric scattering
    float cosAngle = vViewAngle;
    vec3 rayleigh = rayleighScattering(cosAngle, atmosphereColor);
    vec3 mie = mieScattering(cosAngle, atmosphereHighlightColor);
    
    // Combine scattering effects
    vec3 scatteringColor = mix(rayleigh, mie, 0.2) * scatteringStrength;
    
    // Add time-based variation for subtle movement
    float timeVariation = sin(vUv.y * 10.0 + time * 0.2) * 0.05 + 0.95;
    
    // Calculate final color with height-based gradient
    float heightFactor = position.y / (planetRadius + atmosphereThickness);
    vec3 finalColor = mix(atmosphereColor, scatteringColor, clamp(heightFactor + 0.5, 0.0, 1.0)) * timeVariation;
    
    // Apply intensity for rim effect
    gl_FragColor = vec4(finalColor, clamp(intensity, 0.0, 1.0));
  }
`;

/**
 * Create atmosphere material with the custom shader
 * @param {Object} options - Configuration options for the atmosphere material
 * @returns {THREE.ShaderMaterial} - The atmosphere shader material
 */
export function createAtmosphereMaterial(options = {}) {
  const {
    atmosphereColor = new THREE.Color(0x88AAFF),
    atmosphereHighlightColor = new THREE.Color(0xFFFFFF),
    atmosphereDensity = 0.3,
    planetRadius = 100,
    atmosphereThickness = 10,
    scatteringStrength = 1.0
  } = options;
  
  // Create uniforms object
  const uniforms = {
    atmosphereColor: { value: atmosphereColor },
    atmosphereHighlightColor: { value: atmosphereHighlightColor },
    atmosphereDensity: { value: atmosphereDensity },
    planetRadius: { value: planetRadius },
    atmosphereThickness: { value: atmosphereThickness },
    scatteringStrength: { value: scatteringStrength },
    time: { value: 0 }
  };
  
  try {
    // Use the shader error handler to create a safe shader material
    return shaderErrorHandler.createSafeShaderMaterial({
      uniforms,
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      shaderType: 'atmosphere'
    });
  } catch (error) {
    console.error("Error creating atmosphere material:", error);
    
    // Fallback to a simple material if shader creation fails
    return new THREE.MeshBasicMaterial({
      color: atmosphereColor,
      transparent: true,
      opacity: atmosphereDensity,
      side: THREE.BackSide
    });
  }
}

/**
 * Update atmosphere material uniforms
 * @param {THREE.ShaderMaterial} material - The atmosphere shader material
 * @param {number} deltaTime - Time since last update
 */
export function updateAtmosphereMaterial(material, deltaTime) {
  if (material && material.uniforms) {
    material.uniforms.time.value += deltaTime * 0.5;
  }
}

/**
 * Configure atmosphere based on planet type
 * @param {THREE.ShaderMaterial} material - The atmosphere shader material
 * @param {string} planetType - Type of planet (terrestrial, desert, aquatic, volcanic, gas)
 * @param {string} atmosphereType - Type of atmosphere (thin, normal, dense, methane, none)
 */
export function configureAtmosphereForPlanetType(material, planetType, atmosphereType) {
  if (!material || !material.uniforms) return;
  
  // Base values
  let color = new THREE.Color(0x88AAFF);
  let highlightColor = new THREE.Color(0xFFFFFF);
  let density = 0.3;
  let scattering = 1.0;
  
  // Adjust based on planet type
  switch (planetType) {
    case 'terrestrial':
      color = new THREE.Color(0x88AAFF); // Blue-ish
      break;
    case 'desert':
      color = new THREE.Color(0xFFD580); // Light orange
      scattering = 1.2;
      break;
    case 'aquatic':
      color = new THREE.Color(0x00BFFF); // Deep blue
      scattering = 0.8;
      break;
    case 'volcanic':
      color = new THREE.Color(0xFF4500); // Red-orange
      highlightColor = new THREE.Color(0xFFCC00);
      scattering = 1.5;
      break;
    case 'gas':
      color = new THREE.Color(0xFFD700); // Gold
      highlightColor = new THREE.Color(0xFFA500);
      scattering = 2.0;
      break;
  }
  
  // Adjust based on atmosphere type
  switch (atmosphereType) {
    case 'thin':
      density = 0.1;
      scattering *= 0.7;
      break;
    case 'normal':
      density = 0.3;
      break;
    case 'dense':
      density = 0.6;
      scattering *= 1.3;
      break;
    case 'methane':
      color = new THREE.Color(0xFF4500); // Orange-red
      density = 0.4;
      scattering *= 1.2;
      break;
    case 'none':
      density = 0.0; // Invisible
      break;
  }
  
  // Update material uniforms
  material.uniforms.atmosphereColor.value = color;
  material.uniforms.atmosphereHighlightColor.value = highlightColor;
  material.uniforms.atmosphereDensity.value = density;
  material.uniforms.scatteringStrength.value = scattering;
}