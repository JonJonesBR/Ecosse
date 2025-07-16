/**
 * Water Shader - Realistic water with reflections and waves
 * This shader creates a realistic water surface with dynamic waves, reflections, and depth effects
 */

import * as THREE from 'three';
import { shaderErrorHandler } from '../systems/shaderErrorHandler.js';

// Vertex shader for water
export const waterVertexShader = `
  uniform float time;
  uniform float waveHeight;
  uniform float waveFrequency;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  
  // Function to create wave effect
  float calculateWave(vec2 position, float time, float frequency, float amplitude) {
    return amplitude * sin(position.x * frequency + time) * sin(position.y * frequency + time);
  }
  
  void main() {
    vUv = uv;
    
    // Create wave effect by modifying the vertex position
    vec3 newPosition = position;
    
    // Apply multiple waves with different frequencies for more realistic effect
    float wave1 = calculateWave(position.xy, time * 0.5, waveFrequency, waveHeight);
    float wave2 = calculateWave(position.xy, time * 0.3, waveFrequency * 2.0, waveHeight * 0.3);
    float wave3 = calculateWave(position.xy, time * 0.7, waveFrequency * 0.5, waveHeight * 0.6);
    
    // Combine waves
    newPosition.z += wave1 + wave2 + wave3;
    
    // Calculate normal for lighting
    vec3 tangent = normalize(vec3(1.0, 0.0, calculateWave(position.xy + vec2(0.01, 0.0), time * 0.5, waveFrequency, waveHeight) - wave1));
    vec3 bitangent = normalize(vec3(0.0, 1.0, calculateWave(position.xy + vec2(0.0, 0.01), time * 0.5, waveFrequency, waveHeight) - wave1));
    vec3 modifiedNormal = normalize(cross(tangent, bitangent));
    
    vNormal = normalMatrix * modifiedNormal;
    vPosition = newPosition;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for water
export const waterFragmentShader = `
  uniform vec3 waterColor;
  uniform vec3 waterDeepColor;
  uniform float time;
  uniform float reflectionStrength;
  uniform float distortionScale;
  uniform samplerCube envMap;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  
  // Function to create caustics effect
  vec3 caustics(vec2 uv, float time) {
    vec2 p = mod(uv * distortionScale, vec2(1.0)) * 2.0 - 1.0;
    float d = length(p);
    vec2 st = uv * 0.1 + 0.2 * vec2(cos(time * 0.4 + 2.0 * d), sin(time * 0.3 + 2.0 * d));
    
    // Create a 3D direction vector from 2D coordinates for cube texture sampling
    vec3 dir1 = vec3(st.x, st.y, 1.0);
    vec3 dir2 = vec3(st.x + 0.1, st.y, 1.0);
    vec3 dir3 = vec3(st.x, st.y + 0.1, 1.0);
    
    // Normalize directions for proper cubemap sampling
    dir1 = normalize(dir1);
    dir2 = normalize(dir2);
    dir3 = normalize(dir3);
    
    // Sample the cubemap with the proper function
    float r = textureCube(envMap, dir1).r;
    float g = textureCube(envMap, dir2).g;
    float b = textureCube(envMap, dir3).b;
    
    return vec3(r, g, b);
  }
  
  void main() {
    // Calculate reflection vector
    vec3 viewDirection = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    // Distort normal for more dynamic water surface
    normal.xz += sin(vUv * 10.0 + time * 0.5) * 0.1;
    normal = normalize(normal);
    
    // Calculate reflection vector
    vec3 reflectionVector = reflect(viewDirection, normal);
    
    // Sample environment map for reflection
    vec3 reflection = textureCube(envMap, reflectionVector).rgb;
    
    // Calculate fresnel effect for reflection strength
    float fresnel = pow(1.0 - max(0.0, dot(normal, viewDirection)), 4.0);
    
    // Calculate water depth effect
    float depth = clamp(vPosition.z * 0.5 + 0.5, 0.0, 1.0);
    vec3 baseColor = mix(waterDeepColor, waterColor, depth);
    
    // Add caustics effect
    vec3 causticEffect = caustics(vUv, time) * 0.3;
    
    // Combine all effects
    vec3 finalColor = mix(baseColor + causticEffect, reflection, fresnel * reflectionStrength);
    
    // Add specular highlight
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float specular = pow(max(0.0, dot(reflect(-lightDir, normal), viewDirection)), 100.0) * 0.5;
    finalColor += vec3(specular);
    
    gl_FragColor = vec4(finalColor, 0.8); // Slightly transparent
  }
`;

/**
 * Create water material with the custom shader
 * @param {Object} options - Configuration options for the water material
 * @returns {THREE.ShaderMaterial} - The water shader material
 */
export function createWaterMaterial(options = {}) {
  const {
    waterColor = new THREE.Color(0x0066FF),
    waterDeepColor = new THREE.Color(0x001E4C),
    waveHeight = 0.2,
    waveFrequency = 0.05,
    reflectionStrength = 0.7,
    distortionScale = 3.0,
    envMap = null
  } = options;
  
  // Create environment map if not provided
  const defaultEnvMap = envMap || createDefaultEnvMap();
  
  // Create uniforms object
  const uniforms = {
    time: { value: 0 },
    waterColor: { value: waterColor },
    waterDeepColor: { value: waterDeepColor },
    waveHeight: { value: waveHeight },
    waveFrequency: { value: waveFrequency },
    reflectionStrength: { value: reflectionStrength },
    distortionScale: { value: distortionScale },
    envMap: { value: defaultEnvMap }
  };
  
  try {
    // Use the shader error handler to create a safe shader material
    return shaderErrorHandler.createSafeShaderMaterial({
      uniforms,
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      shaderType: 'water'
    });
  } catch (error) {
    console.error('Error creating water material:', error);
    
    // Fallback to a simple material if shader creation fails
    return new THREE.MeshPhongMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
  }
}

/**
 * Create a default environment map for reflections
 * @returns {THREE.CubeTexture} - The default environment map
 */
function createDefaultEnvMap() {
  // Create a dummy cube texture
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  
  // Fill with sky blue color
  for (let i = 0; i < size * size * 4; i += 4) {
    data[i] = 135; // R
    data[i + 1] = 206; // G
    data[i + 2] = 235; // B
    data[i + 3] = 255; // A
  }
  
  const texture = new THREE.DataTexture(data, size, size);
  texture.format = THREE.RGBAFormat;
  texture.needsUpdate = true;
  
  return texture;
}

/**
 * Update water material uniforms
 * @param {THREE.ShaderMaterial} material - The water shader material
 * @param {number} deltaTime - Time since last update
 */
export function updateWaterMaterial(material, deltaTime) {
  if (material && material.uniforms) {
    material.uniforms.time.value += deltaTime * 0.5;
  }
}
