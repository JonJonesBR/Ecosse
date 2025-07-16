/**
 * Advanced Particle System
 * This system manages various particle effects in the game world
 */

import * as THREE from 'three';
import { eventSystem, EventTypes } from './eventSystem.js';
import { shaderManager } from '../shaders/shaderManager.js';

// Particle types
export const ParticleTypes = {
  EXPLOSION: 'explosion',
  FIRE: 'fire',
  SMOKE: 'smoke',
  DUST: 'dust',
  SPARKLE: 'sparkle',
  BUBBLE: 'bubble',
  LEAF: 'leaf',
  ENERGY: 'energy'
};

// Particle presets
const ParticlePresets = {
  [ParticleTypes.EXPLOSION]: {
    count: 1000,
    size: { min: 2, max: 5 },
    lifetime: { min: 0.5, max: 1.5 },
    speed: { min: 10, max: 30 },
    colors: [0xFF5500, 0xFF0000, 0xFFAA00],
    gravity: -5,
    spread: 1.0,
    opacity: { start: 1.0, end: 0 },
    blending: THREE.AdditiveBlending
  },
  [ParticleTypes.FIRE]: {
    count: 500,
    size: { min: 1, max: 3 },
    lifetime: { min: 0.8, max: 2.0 },
    speed: { min: 5, max: 10 },
    colors: [0xFF5500, 0xFF0000, 0xFFAA00],
    gravity: -2,
    spread: 0.3,
    opacity: { start: 1.0, end: 0 },
    blending: THREE.AdditiveBlending
  },
  [ParticleTypes.SMOKE]: {
    count: 300,
    size: { min: 3, max: 8 },
    lifetime: { min: 2.0, max: 4.0 },
    speed: { min: 2, max: 5 },
    colors: [0x333333, 0x555555, 0x999999],
    gravity: -0.5,
    spread: 0.5,
    opacity: { start: 0.6, end: 0 },
    blending: THREE.NormalBlending
  },
  [ParticleTypes.DUST]: {
    count: 200,
    size: { min: 1, max: 3 },
    lifetime: { min: 1.0, max: 3.0 },
    speed: { min: 1, max: 3 },
    colors: [0xCCBB99, 0xAA9977],
    gravity: 0.2,
    spread: 0.8,
    opacity: { start: 0.4, end: 0 },
    blending: THREE.NormalBlending
  },
  [ParticleTypes.SPARKLE]: {
    count: 100,
    size: { min: 1, max: 2 },
    lifetime: { min: 0.5, max: 1.5 },
    speed: { min: 2, max: 8 },
    colors: [0xFFFFFF, 0xFFFF77, 0x77FFFF],
    gravity: 0,
    spread: 0.5,
    opacity: { start: 1.0, end: 0 },
    blending: THREE.AdditiveBlending
  },
  [ParticleTypes.BUBBLE]: {
    count: 150,
    size: { min: 1, max: 4 },
    lifetime: { min: 2.0, max: 5.0 },
    speed: { min: 1, max: 3 },
    colors: [0x77AAFF, 0x77FFFF],
    gravity: -1,
    spread: 0.3,
    opacity: { start: 0.7, end: 0 },
    blending: THREE.NormalBlending
  },
  [ParticleTypes.LEAF]: {
    count: 100,
    size: { min: 1, max: 3 },
    lifetime: { min: 3.0, max: 6.0 },
    speed: { min: 1, max: 3 },
    colors: [0x33AA33, 0x55CC55, 0x77DD77],
    gravity: 0.1,
    spread: 0.8,
    opacity: { start: 0.8, end: 0 },
    blending: THREE.NormalBlending
  },
  [ParticleTypes.ENERGY]: {
    count: 200,
    size: { min: 1, max: 3 },
    lifetime: { min: 0.5, max: 1.5 },
    speed: { min: 5, max: 15 },
    colors: [0x00FFFF, 0x0088FF, 0x0000FF],
    gravity: 0,
    spread: 0.5,
    opacity: { start: 1.0, end: 0 },
    blending: THREE.AdditiveBlending
  }
};

// Vertex shader for particles
const particleVertexShader = `
  uniform float time;
  uniform float gravity;
  
  attribute float size;
  attribute float lifetime;
  attribute float maxLifetime;
  attribute vec3 velocity;
  attribute float opacity;
  attribute float seed;
  
  varying float vOpacity;
  varying float vLifeProgress;
  varying float vSeed;
  
  void main() {
    // Calculate remaining lifetime
    float remainingLife = maxLifetime - lifetime;
    if (remainingLife < 0.0) {
      // Hide expired particles
      gl_Position = vec4(0.0);
      gl_PointSize = 0.0;
      vOpacity = 0.0;
      return;
    }
    
    // Calculate life progress (0 to 1)
    vLifeProgress = lifetime / maxLifetime;
    vSeed = seed;
    
    // Calculate position with physics
    vec3 pos = position + velocity * lifetime;
    
    // Apply gravity
    pos.y += gravity * lifetime * lifetime * 0.5;
    
    // Add some turbulence based on seed
    float turbulence = sin(time * (0.1 + seed * 0.5) + position.x * 0.1) * seed * 0.3;
    pos.x += turbulence;
    pos.z += turbulence * 0.5;
    
    // Project to screen space
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculate point size with distance attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 - vLifeProgress * 0.5);
    
    // Pass opacity to fragment shader
    vOpacity = opacity * (1.0 - vLifeProgress);
  }
`;

// Fragment shader for particles
const particleFragmentShader = `
  uniform sampler2D particleTexture;
  uniform vec3 colorStart;
  uniform vec3 colorEnd;
  
  varying float vOpacity;
  varying float vLifeProgress;
  varying float vSeed;
  
  void main() {
    // Create circular particle shape
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    
    // Discard pixels outside the circle
    if (dist > 0.5) discard;
    
    // Calculate color based on life progress
    vec3 color = mix(colorStart, colorEnd, vLifeProgress);
    
    // Add some variation based on seed
    color = mix(color, color * (0.8 + vSeed * 0.4), 0.2);
    
    // Soften edges
    float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Particle System class for managing particle effects
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.scene = null;
    this.clock = new THREE.Clock();
    this.textures = {};
    this.maxParticles = 10000; // Maximum number of particles in the system
    this.subscriptions = [];
  }
  
  /**
   * Initialize the particle system
   * @param {THREE.Scene} scene - The Three.js scene
   */
  init(scene) {
    this.scene = scene;
    this.clock.start();
    
    // Load particle textures
    this.loadTextures();
    
    // Subscribe to events
    this.subscribeToEvents();
    
    console.log('Particle System initialized');
    return this;
  }
  
  /**
   * Load particle textures
   */
  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    // Create default particle texture
    this.textures.default = this.createDefaultParticleTexture();
    
    // Load other textures if needed
    // this.textures.smoke = textureLoader.load('path/to/smoke.png');
    // this.textures.fire = textureLoader.load('path/to/fire.png');
  }
  
  /**
   * Create a default particle texture
   * @returns {THREE.Texture} - The default particle texture
   */
  createDefaultParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Draw a soft circle
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Subscribe to relevant events
   */
  subscribeToEvents() {
    // Element events
    this.subscriptions.push(
      eventSystem.subscribe(EventTypes.ELEMENT_CREATED, data => {
        // Spawn creation particles for certain element types
        if (['plant', 'creature', 'tribe'].includes(data.type)) {
          const position = new THREE.Vector3(data.x, data.y, 0);
          this.spawnParticles(ParticleTypes.SPARKLE, position, { scale: data.size || 1 });
        }
      })
    );
    
    this.subscriptions.push(
      eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, data => {
        // Spawn destruction particles
        const position = new THREE.Vector3(data.x, data.y, 0);
        
        if (data.type === 'creature') {
          this.spawnParticles(ParticleTypes.DUST, position, { scale: data.size || 1 });
        } else if (data.type === 'plant') {
          this.spawnParticles(ParticleTypes.LEAF, position, { scale: data.size || 1 });
        } else if (data.type === 'volcano') {
          this.spawnParticles(ParticleTypes.SMOKE, position, { scale: 2 });
          this.spawnParticles(ParticleTypes.FIRE, position, { scale: 1.5 });
        }
      })
    );
    
    // Weather events
    this.subscriptions.push(
      eventSystem.subscribe(EventTypes.WEATHER_CHANGED, data => {
        // Could spawn global weather particles here
        // This is handled by the weather shader system
      })
    );
  }
  
  /**
   * Create a particle emitter
   * @param {string} type - Type of particles to emit
   * @param {THREE.Vector3} position - Position to emit particles from
   * @param {Object} options - Additional options
   * @returns {Object} - The particle emitter object
   */
  createEmitter(type, position, options = {}) {
    const preset = ParticlePresets[type] || ParticlePresets[ParticleTypes.SPARKLE];
    const emitterOptions = {
      ...preset,
      ...options,
      position: position.clone(),
      active: true,
      age: 0,
      duration: options.duration || 1.0,
      emissionRate: options.emissionRate || preset.count / (options.duration || 1.0),
      lastEmitTime: 0
    };
    
    const emitter = {
      ...emitterOptions,
      update: (deltaTime) => this.updateEmitter(emitter, deltaTime)
    };
    
    return emitter;
  }
  
  /**
   * Update an emitter
   * @param {Object} emitter - The emitter to update
   * @param {number} deltaTime - Time since last update
   */
  updateEmitter(emitter, deltaTime) {
    if (!emitter.active) return;
    
    emitter.age += deltaTime;
    if (emitter.age >= emitter.duration) {
      emitter.active = false;
      return;
    }
    
    // Calculate how many particles to emit this frame
    const particlesToEmit = Math.floor((emitter.age - emitter.lastEmitTime) * emitter.emissionRate);
    if (particlesToEmit > 0) {
      this.emitParticles(emitter, particlesToEmit);
      emitter.lastEmitTime = emitter.age;
    }
  }
  
  /**
   * Emit particles from an emitter
   * @param {Object} emitter - The emitter
   * @param {number} count - Number of particles to emit
   */
  emitParticles(emitter, count) {
    // Implementation depends on how particles are stored and rendered
    // This would create and add particles to the system
    console.log(`Emitting ${count} particles of type ${emitter.type}`);
  }
  
  /**
   * Spawn a burst of particles
   * @param {string} type - Type of particles to spawn
   * @param {THREE.Vector3} position - Position to spawn particles at
   * @param {Object} options - Additional options
   */
  spawnParticles(type, position, options = {}) {
    const preset = ParticlePresets[type] || ParticlePresets[ParticleTypes.SPARKLE];
    const scale = options.scale || 1.0;
    
    // Calculate actual count based on scale
    const count = Math.floor(preset.count * scale);
    
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create arrays for attributes
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lifetimes = new Float32Array(count);
    const maxLifetimes = new Float32Array(count);
    const opacities = new Float32Array(count);
    const seeds = new Float32Array(count);
    
    // Fill attribute arrays
    for (let i = 0; i < count; i++) {
      // Position (start at emission point)
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      
      // Random direction with spread
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * preset.spread;
      const speed = preset.speed.min + Math.random() * (preset.speed.max - preset.speed.min);
      
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      
      // Size
      sizes[i] = preset.size.min + Math.random() * (preset.size.max - preset.size.min);
      
      // Lifetime
      lifetimes[i] = 0; // Start at 0
      maxLifetimes[i] = preset.lifetime.min + Math.random() * (preset.lifetime.max - preset.lifetime.min);
      
      // Opacity
      opacities[i] = preset.opacity.start;
      
      // Random seed for variation
      seeds[i] = Math.random();
    }
    
    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('maxLifetime', new THREE.BufferAttribute(maxLifetimes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    
    // Create material
    const colorStart = new THREE.Color(preset.colors[0]);
    const colorEnd = new THREE.Color(preset.colors[preset.colors.length - 1]);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        gravity: { value: preset.gravity },
        particleTexture: { value: this.textures.default },
        colorStart: { value: colorStart },
        colorEnd: { value: colorEnd }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: preset.blending
    });
    
    // Create particle system
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.name = `particles-${type}-${Date.now()}`;
    particleSystem.userData = {
      type: type,
      creationTime: this.clock.getElapsedTime(),
      maxLifetime: Math.max(...maxLifetimes),
      isParticleSystem: true
    };
    
    // Add to scene
    if (this.scene) {
      this.scene.add(particleSystem);
      this.particles.push(particleSystem);
      
      // Clean up after particles expire
      setTimeout(() => {
        this.removeParticleSystem(particleSystem);
      }, particleSystem.userData.maxLifetime * 1000 + 100); // Add a small buffer
    }
    
    return particleSystem;
  }
  
  /**
   * Remove a particle system
   * @param {THREE.Points} particleSystem - The particle system to remove
   */
  removeParticleSystem(particleSystem) {
    if (!particleSystem || !this.scene) return;
    
    // Remove from scene
    this.scene.remove(particleSystem);
    
    // Remove from particles array
    const index = this.particles.indexOf(particleSystem);
    if (index !== -1) {
      this.particles.splice(index, 1);
    }
    
    // Dispose resources
    particleSystem.geometry.dispose();
    particleSystem.material.dispose();
  }
  
  /**
   * Update all particle systems
   */
  update() {
    if (!this.scene) return;
    
    const time = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();
    
    // Update all particle systems
    for (const particleSystem of this.particles) {
      if (particleSystem.material && particleSystem.material.uniforms) {
        particleSystem.material.uniforms.time.value = time;
        
        // Update particle lifetimes
        const lifetimeAttr = particleSystem.geometry.getAttribute('lifetime');
        if (lifetimeAttr) {
          const lifetimeArray = lifetimeAttr.array;
          for (let i = 0; i < lifetimeArray.length; i++) {
            lifetimeArray[i] += deltaTime;
          }
          lifetimeAttr.needsUpdate = true;
        }
      }
    }
    
    // Clean up expired particle systems
    this.particles = this.particles.filter(ps => {
      const age = time - ps.userData.creationTime;
      if (age > ps.userData.maxLifetime * 1.5) {
        this.removeParticleSystem(ps);
        return false;
      }
      return true;
    });
    
    // Limit total number of particle systems
    if (this.particles.length > 20) {
      // Remove oldest particle systems if we have too many
      const toRemove = this.particles.slice(0, this.particles.length - 20);
      toRemove.forEach(ps => this.removeParticleSystem(ps));
      this.particles = this.particles.slice(this.particles.length - 20);
    }
  }
  
  /**
   * Create a special effect at a position
   * @param {string} effectName - Name of the effect
   * @param {THREE.Vector3} position - Position for the effect
   * @param {Object} options - Additional options
   */
  createEffect(effectName, position, options = {}) {
    switch (effectName) {
      case 'explosion':
        this.spawnParticles(ParticleTypes.EXPLOSION, position, options);
        break;
        
      case 'fireAndSmoke':
        this.spawnParticles(ParticleTypes.FIRE, position, options);
        this.spawnParticles(ParticleTypes.SMOKE, position, { ...options, scale: (options.scale || 1) * 1.5 });
        break;
        
      case 'magic':
        this.spawnParticles(ParticleTypes.SPARKLE, position, options);
        this.spawnParticles(ParticleTypes.ENERGY, position, options);
        break;
        
      case 'growth':
        this.spawnParticles(ParticleTypes.SPARKLE, position, { ...options, scale: (options.scale || 1) * 0.5 });
        this.spawnParticles(ParticleTypes.LEAF, position, options);
        break;
        
      case 'waterEffect':
        this.spawnParticles(ParticleTypes.BUBBLE, position, options);
        break;
        
      default:
        this.spawnParticles(ParticleTypes.SPARKLE, position, options);
        break;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove all particle systems
    this.particles.forEach(ps => this.removeParticleSystem(ps));
    this.particles = [];
    
    // Dispose textures
    for (const key in this.textures) {
      if (this.textures[key]) {
        this.textures[key].dispose();
      }
    }
    
    // Unsubscribe from events
    this.subscriptions.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    
    console.log('Particle System disposed');
  }
}

// Create and export a singleton instance
export const particleSystem = new ParticleSystem();

// Export the class for testing or if multiple instances are needed
export const ParticleSystemClass = ParticleSystem;