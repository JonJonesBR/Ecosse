/**
 * Weather Effects Shader - Dynamic weather visualization
 * This shader creates realistic weather effects like rain, snow, and storms
 */

import * as THREE from 'three';
import { shaderErrorHandler } from '../systems/shaderErrorHandler.js';

// Vertex shader for rain particles
export const rainVertexShader = `
  uniform float time;
  uniform float rainSpeed;
  uniform float turbulence;
  
  attribute float size;
  attribute float randomness;
  
  varying float vAlpha;
  
  void main() {
    // Original position
    vec3 pos = position;
    
    // Add falling motion
    pos.y = mod(pos.y - time * rainSpeed * (0.8 + randomness * 0.4), 500.0) - 250.0;
    
    // Add some horizontal drift based on height (wind effect)
    pos.x += sin(time * 0.1 + pos.y * 0.01) * turbulence * randomness;
    pos.z += cos(time * 0.15 + pos.y * 0.01) * turbulence * randomness;
    
    // Fade out as particles get closer to the ground
    vAlpha = smoothstep(-240.0, -200.0, pos.y);
    
    // Project to screen space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for rain particles
export const rainFragmentShader = `
  uniform sampler2D rainTexture;
  
  varying float vAlpha;
  
  void main() {
    // Create elongated raindrop shape
    vec2 uv = gl_PointCoord;
    
    // Sample texture or create a simple raindrop shape
    vec4 rainColor = vec4(0.7, 0.8, 1.0, 0.6);
    
    // Adjust alpha based on distance from center and vertical position
    float alpha = (1.0 - 2.0 * abs(uv.x - 0.5)) * vAlpha;
    
    // Make drops more elongated at the top
    alpha *= smoothstep(0.5, 1.0, uv.y);
    
    gl_FragColor = rainColor * vec4(1.0, 1.0, 1.0, alpha);
  }
`;

// Vertex shader for snow particles
export const snowVertexShader = `
  uniform float time;
  uniform float snowSpeed;
  uniform float turbulence;
  
  attribute float size;
  attribute float randomness;
  attribute float rotationSpeed;
  
  varying float vAlpha;
  varying float vRotation;
  
  void main() {
    // Original position
    vec3 pos = position;
    
    // Add falling motion with swaying
    pos.y = mod(pos.y - time * snowSpeed * (0.5 + randomness * 0.5), 500.0) - 250.0;
    
    // Add swirling motion (more pronounced than rain)
    float swirl = sin(time * (0.1 + rotationSpeed * 0.1) + randomness * 6.28);
    pos.x += sin(time * 0.2 + pos.y * 0.01) * turbulence * randomness + swirl * 2.0;
    pos.z += cos(time * 0.25 + pos.y * 0.01) * turbulence * randomness + swirl * 2.0;
    
    // Calculate rotation for the snowflake
    vRotation = time * rotationSpeed;
    
    // Fade out as particles get closer to the ground
    vAlpha = smoothstep(-240.0, -200.0, pos.y);
    
    // Project to screen space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for snow particles
export const snowFragmentShader = `
  uniform sampler2D snowTexture;
  
  varying float vAlpha;
  varying float vRotation;
  
  void main() {
    // Create a snowflake shape
    vec2 uv = gl_PointCoord - 0.5;
    
    // Apply rotation
    float c = cos(vRotation);
    float s = sin(vRotation);
    vec2 rotatedUV = vec2(
      uv.x * c - uv.y * s,
      uv.x * s + uv.y * c
    ) + 0.5;
    
    // Create a simple snowflake pattern
    float dist = length(uv);
    float snowflakePattern = 0.0;
    
    // Main circle
    snowflakePattern = 1.0 - smoothstep(0.0, 0.4, dist);
    
    // Add six arms
    for (int i = 0; i < 6; i++) {
      float angle = float(i) * 3.14159 / 3.0;
      vec2 arm = vec2(cos(angle), sin(angle));
      float armStrength = pow(abs(dot(normalize(uv), arm)), 8.0);
      snowflakePattern += armStrength * 0.3 * (1.0 - smoothstep(0.0, 0.8, dist));
    }
    
    // Final color
    vec4 snowColor = vec4(1.0, 1.0, 1.0, min(snowflakePattern, 1.0) * vAlpha);
    gl_FragColor = snowColor;
  }
`;

// Vertex shader for cloud particles
export const cloudVertexShader = `
  uniform float time;
  uniform float windSpeed;
  
  varying vec2 vUv;
  varying float vAlpha;
  
  void main() {
    vUv = uv;
    
    // Create subtle movement
    vec3 pos = position;
    pos.x += sin(time * windSpeed * 0.1 + position.z * 0.05) * 2.0;
    pos.z += cos(time * windSpeed * 0.15 + position.x * 0.05) * 2.0;
    
    // Fade based on position
    vAlpha = 0.7 + sin(time * 0.2 + position.x * 0.05) * 0.3;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader for cloud particles
export const cloudFragmentShader = `
  uniform sampler2D cloudTexture;
  uniform float cloudDensity;
  
  varying vec2 vUv;
  varying float vAlpha;
  
  void main() {
    // Sample cloud texture or create procedural cloud
    vec4 texColor = texture2D(cloudTexture, vUv);
    
    // Adjust opacity based on density and position
    float alpha = texColor.a * vAlpha * cloudDensity;
    
    gl_FragColor = vec4(texColor.rgb, alpha);
  }
`;

/**
 * Create rain particles material with custom shader
 * @param {Object} options - Configuration options
 * @returns {THREE.ShaderMaterial} - The rain shader material
 */
export function createRainMaterial(options = {}) {
  const {
    rainSpeed = 20.0,
    turbulence = 5.0,
    rainTexture = null
  } = options;
  
  // Create uniforms object
  const uniforms = {
    time: { value: 0 },
    rainSpeed: { value: rainSpeed },
    turbulence: { value: turbulence },
    rainTexture: { value: rainTexture }
  };
  
  try {
    // Use the shader error handler to create a safe shader material
    return shaderErrorHandler.createSafeShaderMaterial({
      uniforms,
      vertexShader: rainVertexShader,
      fragmentShader: rainFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      shaderType: 'rain'
    });
  } catch (error) {
    console.error("Error creating rain material:", error);
    
    // Fallback to a simple material if shader creation fails
    return new THREE.PointsMaterial({
      color: new THREE.Color(0x88AAFF),
      size: 2.0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
  }
}

/**
 * Create snow particles material with custom shader
 * @param {Object} options - Configuration options
 * @returns {THREE.ShaderMaterial} - The snow shader material
 */
export function createSnowMaterial(options = {}) {
  const {
    snowSpeed = 5.0,
    turbulence = 8.0,
    snowTexture = null
  } = options;
  
  // Create uniforms object
  const uniforms = {
    time: { value: 0 },
    snowSpeed: { value: snowSpeed },
    turbulence: { value: turbulence },
    snowTexture: { value: snowTexture }
  };
  
  try {
    // Use the shader error handler to create a safe shader material
    return shaderErrorHandler.createSafeShaderMaterial({
      uniforms,
      vertexShader: snowVertexShader,
      fragmentShader: snowFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      shaderType: 'snow'
    });
  } catch (error) {
    console.error("Error creating snow material:", error);
    
    // Fallback to a simple material if shader creation fails
    return new THREE.PointsMaterial({
      color: new THREE.Color(0xFFFFFF),
      size: 2.0,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
  }
}

/**
 * Create cloud material with custom shader
 * @param {Object} options - Configuration options
 * @returns {THREE.ShaderMaterial} - The cloud shader material
 */
export function createCloudMaterial(options = {}) {
  const {
    windSpeed = 1.0,
    cloudDensity = 0.7,
    cloudTexture = null
  } = options;
  
  // Create default cloud texture if not provided
  const defaultTexture = cloudTexture || createDefaultCloudTexture();
  
  // Create uniforms object
  const uniforms = {
    time: { value: 0 },
    windSpeed: { value: windSpeed },
    cloudDensity: { value: cloudDensity },
    cloudTexture: { value: defaultTexture }
  };
  
  try {
    // Use the shader error handler to create a safe shader material
    return shaderErrorHandler.createSafeShaderMaterial({
      uniforms,
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      shaderType: 'cloud'
    });
  } catch (error) {
    console.error("Error creating cloud material:", error);
    
    // Fallback to a simple material if shader creation fails
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xFFFFFF),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
  }
}

/**
 * Create a default cloud texture
 * @returns {THREE.Texture} - The default cloud texture
 */
function createDefaultCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  context.fillStyle = 'rgba(255, 255, 255, 0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw some random white blobs for clouds
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 30 + 20;
    const opacity = Math.random() * 0.5 + 0.2;
    
    context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Create rain particles geometry
 * @param {number} count - Number of rain particles
 * @param {number} spread - How far to spread the particles
 * @returns {THREE.BufferGeometry} - The rain particles geometry
 */
export function createRainGeometry(count = 1000, spread = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randomness = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Position
    positions[i * 3] = (Math.random() - 0.5) * spread; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread; // z
    
    // Size - elongated rain drops
    sizes[i] = Math.random() * 2 + 1;
    
    // Randomness factor for variation
    randomness[i] = Math.random();
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('randomness', new THREE.BufferAttribute(randomness, 1));
  
  return geometry;
}

/**
 * Create snow particles geometry
 * @param {number} count - Number of snow particles
 * @param {number} spread - How far to spread the particles
 * @returns {THREE.BufferGeometry} - The snow particles geometry
 */
export function createSnowGeometry(count = 1000, spread = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randomness = new Float32Array(count);
  const rotationSpeeds = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Position
    positions[i * 3] = (Math.random() - 0.5) * spread; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread; // z
    
    // Size - snowflakes are more uniform than rain
    sizes[i] = Math.random() * 1.5 + 1.5;
    
    // Randomness factor for variation
    randomness[i] = Math.random();
    
    // Rotation speed
    rotationSpeeds[i] = Math.random() * 2 - 1;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('randomness', new THREE.BufferAttribute(randomness, 1));
  geometry.setAttribute('rotationSpeed', new THREE.BufferAttribute(rotationSpeeds, 1));
  
  return geometry;
}

/**
 * Update weather material uniforms
 * @param {THREE.ShaderMaterial} material - The weather shader material
 * @param {number} deltaTime - Time since last update
 */
export function updateWeatherMaterial(material, deltaTime) {
  if (material && material.uniforms && material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}

/**
 * Configure weather effects based on weather type
 * @param {Object} materials - Object containing different weather materials
 * @param {string} weatherType - Type of weather (clear, rain, snow, storm)
 */
export function configureWeatherEffects(materials, weatherType) {
  if (!materials) return;
  
  const { rainMaterial, snowMaterial, cloudMaterial } = materials;
  
  switch (weatherType) {
    case 'clear':
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 0.3;
        cloudMaterial.uniforms.windSpeed.value = 0.5;
      }
      break;
      
    case 'cloudy':
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 0.8;
        cloudMaterial.uniforms.windSpeed.value = 1.0;
      }
      break;
      
    case 'rain':
      if (rainMaterial) {
        rainMaterial.uniforms.rainSpeed.value = 20.0;
        rainMaterial.uniforms.turbulence.value = 5.0;
      }
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 0.9;
        cloudMaterial.uniforms.windSpeed.value = 1.5;
      }
      break;
      
    case 'storm':
      if (rainMaterial) {
        rainMaterial.uniforms.rainSpeed.value = 30.0;
        rainMaterial.uniforms.turbulence.value = 15.0;
      }
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 1.0;
        cloudMaterial.uniforms.windSpeed.value = 3.0;
      }
      break;
      
    case 'snow':
      if (snowMaterial) {
        snowMaterial.uniforms.snowSpeed.value = 5.0;
        snowMaterial.uniforms.turbulence.value = 8.0;
      }
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 0.7;
        cloudMaterial.uniforms.windSpeed.value = 0.8;
      }
      break;
      
    case 'blizzard':
      if (snowMaterial) {
        snowMaterial.uniforms.snowSpeed.value = 15.0;
        snowMaterial.uniforms.turbulence.value = 20.0;
      }
      if (cloudMaterial) {
        cloudMaterial.uniforms.cloudDensity.value = 1.0;
        cloudMaterial.uniforms.windSpeed.value = 2.5;
      }
      break;
  }
}