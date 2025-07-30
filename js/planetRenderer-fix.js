/**
 * Planet Renderer Fix
 * This file contains fixes for planet rendering issues
 * Addresses: container initialization, canvas sizing, planet creation, and rendering system
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { elementDefinitions, ecosystemSizes } from './utils.js';
import { SimplexNoise } from './simplexNoise.js';

// Global variables for the rendering system
let scene, camera, renderer, controls;
let planetMesh, starField, atmosphereMesh;
let rendererContainer;
let isInitialized = false;

/**
 * Fix for container initialization issues
 * Ensures proper container setup before 3D scene creation
 */
export function fixContainerInitialization(container) {
    if (!container) {
        console.error('Container element is null or undefined');
        return false;
    }

    // Set proper CSS properties first
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Ensure container has proper dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Container has zero dimensions, setting default size');
        container.style.width = '800px';
        container.style.height = '600px';

        // Force a reflow to ensure dimensions are applied
        container.offsetHeight;

        // Check again after setting dimensions
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            console.warn('Container still has zero dimensions after setting size, using computed style');
            const computedStyle = window.getComputedStyle(container);
            const width = parseInt(computedStyle.width) || 800;
            const height = parseInt(computedStyle.height) || 600;

            if (width === 0 || height === 0) {
                console.warn('Using absolute positioning to force dimensions');
                container.style.position = 'absolute';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '800px';
                container.style.height = '600px';
                container.offsetHeight; // Force reflow again
            }
        }
    }

    // Clear any existing content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    console.log(`Container dimensions after fix: ${container.clientWidth}x${container.clientHeight}`);

    return container.clientWidth > 0 && container.clientHeight > 0;
}

/**
 * Fix for canvas sizing issues
 * Ensures proper canvas dimensions and pixel ratio
 */
export function fixCanvasSizing(renderer, container) {
    if (!renderer || !container) {
        console.error('Renderer or container is null');
        return false;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
        console.error('Container has zero dimensions');
        return false;
    }

    // Set renderer size
    renderer.setSize(width, height);

    // Set appropriate pixel ratio (limit to 2 for performance)
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);

    // Update camera aspect ratio
    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    return true;
}

/**
 * Fix for planet creation issues
 * Ensures proper planet geometry and materials
 */
export function fixPlanetCreation(config) {
    if (!scene) {
        console.error('Scene not initialized');
        return false;
    }

    try {
        // Remove existing planet if it exists
        if (planetMesh) {
            scene.remove(planetMesh);

            // Dispose of geometry and materials
            planetMesh.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            if (material.map) material.map.dispose();
                            if (material.bumpMap) material.bumpMap.dispose();
                            material.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.bumpMap) child.material.bumpMap.dispose();
                        child.material.dispose();
                    }
                }
            });
        }

        // Create new planet
        const planetRadius = ecosystemSizes[config.ecosystemSize].radius;

        // Create planet geometry with appropriate detail level
        const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);

        // Generate planet texture
        const planetTexture = new THREE.CanvasTexture(generatePlanetTexture(config));
        planetTexture.wrapS = THREE.RepeatWrapping;
        planetTexture.wrapT = THREE.RepeatWrapping;

        // Generate bump map
        const bumpTexture = new THREE.CanvasTexture(generateBumpMapTexture(config));
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;

        // Create material
        const material = new THREE.MeshPhongMaterial({
            map: planetTexture,
            bumpMap: bumpTexture,
            bumpScale: 5,
            shininess: config.planetType === 'aquatic' ? 100 : 10
        });

        // Create planet mesh
        planetMesh = new THREE.Mesh(geometry, material);
        planetMesh.rotation.z = Math.PI / 8; // Add slight tilt

        // Add to scene
        scene.add(planetMesh);

        // Create atmosphere
        createAtmosphere(config, planetRadius);

        console.log('Planet created successfully');
        return true;

    } catch (error) {
        console.error('Error creating planet:', error);
        return false;
    }
}

/**
 * Create atmosphere for the planet
 */
function createAtmosphere(config, planetRadius) {
    // Remove existing atmosphere
    if (atmosphereMesh) {
        scene.remove(atmosphereMesh);
        atmosphereMesh.geometry.dispose();
        atmosphereMesh.material.dispose();
    }

    // Create atmosphere geometry
    const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.05, 32, 32);

    // Determine atmosphere color based on planet type
    let atmosphereColor = 0x88AAFF; // Default blue

    switch (config.planetType) {
        case 'desert':
            atmosphereColor = 0xFFD580;
            break;
        case 'aquatic':
            atmosphereColor = 0x00BFFF;
            break;
        case 'volcanic':
            atmosphereColor = 0xFF4500;
            break;
        case 'gas':
            atmosphereColor = 0xFFD700;
            break;
    }

    // Create atmosphere material
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });

    // Create atmosphere mesh
    atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
}

/**
 * Generate planet texture based on configuration
 */
function generatePlanetTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Initialize noise generator
    const simplex = new SimplexNoise();

    // Color definitions
    const colors = {
        water: '#1E90FF',
        land: '#228B22',
        desert: '#D2B48C',
        volcanic: '#A0522D',
        gas1: '#FFD700',
        gas2: '#FFDEAD'
    };

    const scale = 0.02;
    const threshold = 0.1;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            // Generate fractal noise
            for (let i = 0; i < 4; i++) {
                noiseValue += simplex.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
                frequency *= 2;
                amplitude *= 0.5;
            }

            noiseValue = (noiseValue + 1) / 2; // Normalize to 0-1

            let color;
            switch (config.planetType) {
                case 'terrestrial':
                    color = noiseValue < threshold ? colors.water : colors.land;
                    break;
                case 'desert':
                    color = noiseValue < threshold + 0.1 ? colors.desert : colors.water;
                    break;
                case 'aquatic':
                    color = colors.water;
                    break;
                case 'volcanic':
                    color = noiseValue < threshold ? colors.water : colors.volcanic;
                    break;
                case 'gas':
                    const bandNoise = simplex.noise2D(0, y * 0.05);
                    color = bandNoise > 0 ? colors.gas1 : colors.gas2;
                    break;
                default:
                    color = colors.land;
            }

            context.fillStyle = color;
            context.fillRect(x, y, 1, 1);
        }
    }

    return canvas;
}

/**
 * Generate bump map texture
 */
function generateBumpMapTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    const simplex = new SimplexNoise();
    const scale = 0.05;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            for (let i = 0; i < 6; i++) {
                noiseValue += simplex.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
                frequency *= 2;
                amplitude *= 0.5;
            }

            noiseValue = (noiseValue + 1) / 2;
            const gray = Math.floor(noiseValue * 255);

            context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            context.fillRect(x, y, 1, 1);
        }
    }

    return canvas;
}

/**
 * Fix for rendering system initialization
 */
export function fixRenderingSystem(container, config) {
    try {
        // Step 1: Fix container initialization
        if (!fixContainerInitialization(container)) {
            throw new Error('Failed to initialize container');
        }

        // Step 2: Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);

        // Step 3: Create camera
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
        camera.position.z = ecosystemSizes[config.ecosystemSize].radius * 2;

        // Step 4: Create renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });

        // Step 5: Fix canvas sizing
        if (!fixCanvasSizing(renderer, container)) {
            throw new Error('Failed to set canvas size');
        }

        // Step 6: Add renderer to container
        container.appendChild(renderer.domElement);

        // Step 7: Create controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 0.8;

        const planetRadius = ecosystemSizes[config.ecosystemSize].radius;
        controls.minDistance = planetRadius + 10;
        controls.maxDistance = planetRadius * 4;

        // Step 8: Create planet
        if (!fixPlanetCreation(config)) {
            throw new Error('Failed to create planet');
        }

        // Step 9: Create starfield
        createStarfield();

        // Step 10: Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Step 11: Start render loop
        startRenderLoop();

        // Step 12: Handle window resize
        window.addEventListener('resize', () => onWindowResize(container));

        isInitialized = true;
        console.log('Rendering system initialized successfully');

        return renderer.domElement;

    } catch (error) {
        console.error('Error initializing rendering system:', error);
        return null;
    }
}

/**
 * Create starfield background
 */
function createStarfield() {
    if (starField) {
        scene.remove(starField);
        starField.geometry.dispose();
        starField.material.dispose();
    }

    const positions = [];
    for (let i = 0; i < 2000; i++) {
        positions.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5
    });

    starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

/**
 * Render loop
 */
function startRenderLoop() {
    function animate() {
        requestAnimationFrame(animate);

        if (controls) {
            controls.update();
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    animate();
}

/**
 * Handle window resize
 */
function onWindowResize(container) {
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

/**
 * Main fix function - call this to apply all fixes
 */
export function applyPlanetRendererFixes(container, config) {
    console.log('Applying planet renderer fixes...');

    // Store container reference
    rendererContainer = container;

    // Apply all fixes
    const rendererElement = fixRenderingSystem(container, config);

    if (rendererElement) {
        console.log('Planet renderer fixes applied successfully');
        return rendererElement;
    } else {
        console.error('Failed to apply planet renderer fixes');
        return null;
    }
}

/**
 * Update planet appearance
 */
export function updatePlanetAppearance(config) {
    if (isInitialized) {
        fixPlanetCreation(config);
    }
}

/**
 * Reset camera position
 */
export function resetCamera(config) {
    if (camera && controls && config) {
        controls.reset();
        camera.position.z = ecosystemSizes[config.ecosystemSize].radius * 2;
        controls.update();
    }
}

/**
 * Get current scene, camera, and renderer (for compatibility)
 */
export function getRenderingComponents() {
    return { scene, camera, renderer, controls };
}