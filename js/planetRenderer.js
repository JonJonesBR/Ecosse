import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { elementDefinitions, ecosystemSizes } from './utils.js';
import { SimplexNoise } from './simplexNoise.js';
import { 
    shaderManager, 
    createAtmosphereMaterial, 
    createWaterMaterial,
    createRainMaterial,
    createSnowMaterial,
    createCloudMaterial,
    createRainGeometry,
    createSnowGeometry
} from './shaders/index.js';
import { particleSystem, ParticleTypes } from './systems/particleSystem.js';
import { lightingSystem } from './systems/lightingSystem.js';
import { eventSystem, EventTypes } from './systems/eventSystem.js';
import { renderingSystem } from './systems/renderingSystem.js';

let scene, camera, renderer, controls;
let planetMesh, starField, ghostElementMesh, rainParticles, cloudMesh, waterMesh;
const elements3D = new THREE.Group(); // This will now hold non-instanced elements
let instancedMeshes = {}; // To hold InstancedMesh objects keyed by element type
const dummy = new THREE.Object3D(); // Dummy object for setting instance matrices
let rendererContainer;

export function init3DScene(container, initialConfig) {
    rendererContainer = container;
    
    // Initialize the enhanced rendering system
    const rendererDomElement = renderingSystem.init(container, {
        enablePostProcessing: true,
        enableBloom: true,
        enableFXAA: true,
        enableShadows: false,
        qualityLevel: 'high',
        adaptiveQuality: true
    });
    
    // Store references to scene, camera, and renderer from the rendering system
    scene = renderingSystem.scene;
    camera = renderingSystem.camera;
    renderer = renderingSystem.renderer;
    
    // Setup controls with optimized settings
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;
    
    // Store controls in rendering system for animation updates
    renderingSystem.controls = controls;
    
    // Create scene elements
    createPlanet(initialConfig);
    createStarfield();
    createClouds(initialConfig);
    createRainParticles();

    // Initialize InstancedMeshes with color support for common elements
    for (const type in elementDefinitions) {
        const def = elementDefinitions[type];
        if (['plant', 'creature', 'rock'].includes(type)) {
            const { geometry, material } = getBaseMeshForInstancing(type);
            if (geometry && material) {
                // Use the rendering system to create instanced meshes
                instancedMeshes[type] = renderingSystem.createOrUpdateInstancedMesh(
                    type, 
                    geometry, 
                    material, 
                    5000
                );
            }
        }
    }

    // Add group for non-instanced elements
    scene.add(elements3D);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    return rendererDomElement;
}

function onWindowResize() {
    if (renderingSystem) {
        renderingSystem.onWindowResize(rendererContainer);
    } else {
        camera.aspect = rendererContainer.clientWidth / rendererContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(rendererContainer.clientWidth, rendererContainer.clientHeight);
    }
}

export function updatePlanetAppearance(config) {
    createPlanet(config);
}

function createPlanet(config) {
    const planetRadius = ecosystemSizes[config.ecosystemSize].radius;

    // Create a LOD (Level of Detail) system for the planet
    const createPlanetLOD = () => {
        // Create LOD object if it doesn't exist
        const planetLOD = new THREE.LOD();
        
        // Create high detail geometry (for close-up viewing)
        const highDetailGeometry = new THREE.SphereGeometry(planetRadius, 64, 64);
        const highDetailMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generatePlanetTexture(config)),
            bumpMap: new THREE.CanvasTexture(generateBumpMapTexture(config)),
            bumpScale: 5,
            shininess: config.planetType === 'aquatic' ? 100 : 10
        });
        const highDetailMesh = new THREE.Mesh(highDetailGeometry, highDetailMaterial);
        
        // Create medium detail geometry (for medium distance viewing)
        const mediumDetailGeometry = new THREE.SphereGeometry(planetRadius, 48, 48);
        const mediumDetailMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generatePlanetTexture(config, 0.75)), // Lower resolution texture
            bumpMap: new THREE.CanvasTexture(generateBumpMapTexture(config, 0.75)),
            bumpScale: 3,
            shininess: config.planetType === 'aquatic' ? 80 : 8
        });
        const mediumDetailMesh = new THREE.Mesh(mediumDetailGeometry, mediumDetailMaterial);
        
        // Create low detail geometry (for distant viewing)
        const lowDetailGeometry = new THREE.SphereGeometry(planetRadius, 32, 32);
        const lowDetailMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generatePlanetTexture(config, 0.5)), // Lower resolution texture
            bumpMap: new THREE.CanvasTexture(generateBumpMapTexture(config, 0.5)),
            bumpScale: 2,
            shininess: config.planetType === 'aquatic' ? 60 : 6
        });
        const lowDetailMesh = new THREE.Mesh(lowDetailGeometry, lowDetailMaterial);
        
        // Add LOD levels
        planetLOD.addLevel(highDetailMesh, 0);          // High detail for close-up
        planetLOD.addLevel(mediumDetailMesh, 200);      // Medium detail for medium distance
        planetLOD.addLevel(lowDetailMesh, 500);         // Low detail for far distance
        
        // Set rotation
        planetLOD.rotation.z = Math.PI / 8; // Add a slight axial tilt (22.5 degrees)
        
        return planetLOD;
    };

    // Update or create planet mesh
    if (planetMesh) {
        // If the existing planet is not a LOD object, replace it with one
        if (!(planetMesh instanceof THREE.LOD)) {
            scene.remove(planetMesh);
            planetMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            if (m.bumpMap) m.bumpMap.dispose();
                            m.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.bumpMap) child.material.bumpMap.dispose();
                        child.material.dispose();
                    }
                }
            });
            
            // Create new LOD planet
            planetMesh = createPlanetLOD();
            scene.add(planetMesh);
        } else {
            // Update existing LOD planet
            // This is more complex as we need to update each LOD level
            // For simplicity, we'll replace the entire LOD object
            scene.remove(planetMesh);
            planetMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m.map) m.map.dispose();
                            if (m.bumpMap) m.bumpMap.dispose();
                            m.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        if (child.material.bumpMap) child.material.bumpMap.dispose();
                        child.material.dispose();
                    }
                }
            });
            
            // Create new LOD planet
            planetMesh = createPlanetLOD();
            scene.add(planetMesh);
        }
    } else {
        // Create new LOD planet
        planetMesh = createPlanetLOD();
        scene.add(planetMesh);
    }

    // Update or create atmosphere with enhanced atmosphere shader
    let atmosphere = planetMesh.children.find(child => child.name === 'atmosphere');

    // Configure atmosphere options based on planet type
    let atmosphereColor = new THREE.Color(0x88AAFF);
    let atmosphereHighlightColor = new THREE.Color(0xFFFFFF);
    let atmosphereDensity = 0.3;
    let atmosphereThickness = planetRadius * 0.05;
    let scatteringStrength = 1.0;

    // Adjust atmosphere based on planet type
    switch (config.planetType) {
        case 'terrestrial':
            atmosphereColor = new THREE.Color(0x88AAFF); // Blue-ish
            break;
        case 'desert':
            atmosphereColor = new THREE.Color(0xFFD580); // Light orange
            scatteringStrength = 1.2;
            break;
        case 'aquatic':
            atmosphereColor = new THREE.Color(0x00BFFF); // Deep blue
            scatteringStrength = 0.8;
            break;
        case 'volcanic':
            atmosphereColor = new THREE.Color(0xFF4500); // Red-orange
            atmosphereHighlightColor = new THREE.Color(0xFFCC00);
            scatteringStrength = 1.5;
            break;
        case 'gas':
            atmosphereColor = new THREE.Color(0xFFD700); // Gold
            atmosphereHighlightColor = new THREE.Color(0xFFA500);
            scatteringStrength = 2.0;
            atmosphereThickness = planetRadius * 0.1; // Thicker atmosphere for gas giants
            break;
    }

    // Adjust based on atmosphere type
    switch (config.atmosphere) {
        case 'methane':
            atmosphereColor = new THREE.Color(0xFF4500); // Orange-red
            atmosphereDensity = 0.4;
            scatteringStrength *= 1.2;
            break;
        case 'thin':
            atmosphereDensity = 0.1;
            scatteringStrength *= 0.7;
            break;
        case 'dense':
            atmosphereDensity = 0.6;
            scatteringStrength *= 1.3;
            atmosphereThickness = planetRadius * 0.08; // Thicker for dense atmosphere
            break;
        case 'none':
            atmosphereDensity = 0.0; // Invisible
            break;
    }

    if (atmosphere) {
        // Update existing atmosphere material uniforms
        atmosphere.material.uniforms.atmosphereColor.value = atmosphereColor;
        atmosphere.material.uniforms.atmosphereHighlightColor.value = atmosphereHighlightColor;
        atmosphere.material.uniforms.atmosphereDensity.value = atmosphereDensity;
        atmosphere.material.uniforms.planetRadius.value = planetRadius;
        atmosphere.material.uniforms.atmosphereThickness.value = atmosphereThickness;
        atmosphere.material.uniforms.scatteringStrength.value = scatteringStrength;
        atmosphere.material.needsUpdate = true;
        
        // Update geometry if planet size changed
        if (atmosphere.geometry.parameters.radius !== planetRadius * 1.05) {
            atmosphere.geometry.dispose();
            atmosphere.geometry = new THREE.SphereGeometry(planetRadius * 1.05, 64, 64);
        }
    } else {
        // Create new atmosphere mesh with enhanced shader
        const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.05, 64, 64);
        const atmosphereMaterial = createAtmosphereMaterial({
            atmosphereColor: atmosphereColor,
            atmosphereHighlightColor: atmosphereHighlightColor,
            atmosphereDensity: atmosphereDensity,
            planetRadius: planetRadius,
            atmosphereThickness: atmosphereThickness,
            scatteringStrength: scatteringStrength
        });
        
        atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = 'atmosphere';
        planetMesh.add(atmosphere);
    }

    // Update lighting system configuration based on planet type
    lightingSystem.updateLightingConfiguration({
        sunIntensity: config.luminosity,
        colorTemperature: config.planetType === 'desert' ? 7500 : 
                         config.planetType === 'aquatic' ? 6000 : 
                         config.planetType === 'volcanic' ? 8000 : 
                         config.planetType === 'gas' ? 7000 : 6500
    });

    camera.position.z = planetRadius * 2;
    controls.minDistance = planetRadius + 10;
    controls.maxDistance = planetRadius * 4;
    controls.update();
}

const simplex = new SimplexNoise(); // Initialize Simplex Noise

function generatePlanetTexture(config, detailLevel = 1.0) {
    const canvas = document.createElement('canvas');
    // Adjust resolution based on detail level
    const baseWidth = 1024;
    const baseHeight = 512;
    canvas.width = Math.floor(baseWidth * detailLevel);
    canvas.height = Math.floor(baseHeight * detailLevel);
    const context = canvas.getContext('2d');

    const waterColor = '#1E90FF'; // DodgerBlue
    const landColor = '#228B22'; // ForestGreen
    const desertColor = '#D2B48C'; // Tan
    const volcanicColor = '#A0522D'; // Sienna
    const gasColor1 = '#FFD700'; // Gold
    const gasColor2 = '#FFDEAD'; // NavajoWhite

    const scale = 0.02; // Adjust for continent size
    // Adjust octaves based on detail level to reduce computation for lower detail
    const octaves = Math.max(2, Math.floor(4 * detailLevel));
    const persistence = 0.5;
    const lacunarity = 2.0;
    const threshold = 0.1; // Adjust for land/water ratio

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            // Scale coordinates to match the full-size texture
            const scaledX = x * (baseWidth / canvas.width);
            const scaledY = y * (baseHeight / canvas.height);

            for (let i = 0; i < octaves; i++) {
                noiseValue += simplex.noise2D(scaledX * scale * frequency, scaledY * scale * frequency) * amplitude;
                frequency *= lacunarity;
                amplitude *= persistence;
            }

            // Normalize noiseValue to be between 0 and 1
            noiseValue = (noiseValue + 1) / 2;

            let color;
            switch (config.planetType) {
                case 'terrestrial':
                    if (noiseValue < threshold) {
                        color = waterColor;
                    } else {
                        color = landColor;
                    }
                    break;
                case 'desert':
                    if (noiseValue < threshold + 0.1) { // More land for desert
                        color = desertColor;
                    } else {
                        color = waterColor; // Still some water
                    }
                    break;
                case 'aquatic':
                    color = waterColor; // Mostly water
                    break;
                case 'volcanic':
                    if (noiseValue < threshold) {
                        color = waterColor;
                    } else {
                        color = volcanicColor;
                    }
                    break;
                case 'gas':
                    // For gas giants, use noise to create bands
                    const bandNoise = simplex.noise2D(0, scaledY * 0.05); // Noise along y-axis for bands
                    if (bandNoise > 0) {
                        color = gasColor1;
                    } else {
                        color = gasColor2;
                    }
                    break;
                default:
                    color = '#000000'; // Fallback
                    break;
            }
            context.fillStyle = color;
            context.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

function generateBumpMapTexture(config, detailLevel = 1.0) {
    const canvas = document.createElement('canvas');
    // Adjust resolution based on detail level
    const baseWidth = 1024;
    const baseHeight = 512;
    canvas.width = Math.floor(baseWidth * detailLevel);
    canvas.height = Math.floor(baseHeight * detailLevel);
    const context = canvas.getContext('2d');

    const scale = 0.05; // Adjust for mountain size
    // Adjust octaves based on detail level to reduce computation for lower detail
    const octaves = Math.max(3, Math.floor(6 * detailLevel));
    const persistence = 0.5;
    const lacunarity = 2.0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            // Scale coordinates to match the full-size texture
            const scaledX = x * (baseWidth / canvas.width);
            const scaledY = y * (baseHeight / canvas.height);

            for (let i = 0; i < octaves; i++) {
                noiseValue += simplex.noise2D(scaledX * scale * frequency, scaledY * scale * frequency) * amplitude;
                frequency *= lacunarity;
                amplitude *= persistence;
            }

            // Normalize noiseValue to be between 0 and 1
            noiseValue = (noiseValue + 1) / 2;

            // For bump map, we want values from 0 to 255 (grayscale)
            const gray = Math.floor(noiseValue * 255);
            context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            context.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

function generateCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');

    context.fillStyle = 'rgba(255, 255, 255, 0)'; // Transparent background
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some random white blobs for clouds
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 30 + 20;
        const opacity = Math.random() * 0.5 + 0.2; // Vary opacity

        context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    return canvas;
}

function createStarfield() {
    if (!starField) {
        const positions = [];
        for (let i = 0; i < 2000; i++) {
            positions.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        starField = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 }));
        scene.add(starField);
    }
}

export function resetCamera(config) {
    if (planetMesh && config) {
        controls.reset();
        camera.position.z = ecosystemSizes[config.ecosystemSize].radius * 2;
    }
}

function createClouds(config) {
    const planetRadius = ecosystemSizes[config.ecosystemSize].radius;

    if (cloudMesh) {
        // Update geometry only if radius changes
        if (cloudMesh.geometry.parameters.radius !== planetRadius * 1.02) {
            cloudMesh.geometry.dispose();
            cloudMesh.geometry = new THREE.SphereGeometry(planetRadius * 1.02, 64, 64);
        }
        
        // Update material with custom cloud shader
        if (cloudMesh.material.type !== 'ShaderMaterial') {
            // Replace with custom shader material if not already using it
            cloudMesh.material.dispose();
            cloudMesh.material = createCloudMaterial({
                windSpeed: 1.0,
                cloudDensity: 0.7,
                cloudTexture: new THREE.CanvasTexture(generateCloudTexture())
            });
        } else {
            // Update existing shader material
            cloudMesh.material.uniforms.cloudTexture.value = new THREE.CanvasTexture(generateCloudTexture());
            cloudMesh.material.needsUpdate = true;
        }
    } else {
        const cloudGeometry = new THREE.SphereGeometry(planetRadius * 1.02, 64, 64);
        const cloudMaterial = createCloudMaterial({
            windSpeed: 1.0,
            cloudDensity: 0.7,
            cloudTexture: new THREE.CanvasTexture(generateCloudTexture())
        });
        cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(cloudMesh);
    }
    
    // Initialize shader manager if not already done
    if (scene && !shaderManager.scene) {
        shaderManager.init(scene, {
            planetType: config.planetType,
            atmosphereType: config.atmosphere,
            weatherType: 'clear'
        });
        
        // Initialize particle system if not already done
        if (particleSystem && !particleSystem.scene) {
            particleSystem.init(scene);
        }
    }
}

function createRainParticles() {
    // Create rain particles with custom shader
    const rainGeometry = createRainGeometry(1000, 500);
    const rainMaterial = createRainMaterial({
        rainSpeed: 20.0,
        turbulence: 5.0
    });
    
    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    rainParticles.visible = false; // Hidden by default
    scene.add(rainParticles);
    
    // Create snow particles with custom shader (initially hidden)
    const snowGeometry = createSnowGeometry(800, 500);
    const snowMaterial = createSnowMaterial({
        snowSpeed: 5.0,
        turbulence: 8.0
    });
    
    const snowParticles = new THREE.Points(snowGeometry, snowMaterial);
    snowParticles.visible = false;
    snowParticles.name = 'snowParticles';
    scene.add(snowParticles);
}

function createMeshForElement(element) {
    const def = elementDefinitions[element.type];
    if (!def) return null;
    const size = def.size * 0.5;
    let geometry;
    let material;

    // If it's a water element, we don't create a mesh here as it's handled by the consolidated waterMesh
    if (element.type === 'water' || ['plant', 'creature', 'rock'].includes(element.type)) {
        return null; // These types are now handled by InstancedMesh
    } else {
        switch (element.type) {
            case 'sun':
                geometry = new THREE.SphereGeometry(size, 32, 32);
                material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow for sun
                break;
            case 'rain':
                geometry = new THREE.BoxGeometry(size * 0.5, size * 2, size * 0.5); // Simple raindrop
                material = new THREE.MeshBasicMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'), transparent: true, opacity: 0.6 });
                break;
            case 'fungus':
                geometry = new THREE.SphereGeometry(size, 16, 16);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'meteor':
                geometry = new THREE.SphereGeometry(size, 16, 16);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'volcano':
                geometry = new THREE.ConeGeometry(size * 0.8, 50, 8);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'tribe':
                geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5); // Simple box for tribe
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'eraser':
                geometry = new THREE.SphereGeometry(size, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'), transparent: true, opacity: 0.5 });
                break;
            default:
                geometry = new THREE.SphereGeometry(size, 16, 16);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
        }
    }
    return new THREE.Mesh(geometry, material);
}

let volcanoSmokeParticles = null;
let meteorExplosionParticles = null;

export function triggerVolcanoEruption(position) {
    // Use the enhanced rendering system for visual effects
    renderingSystem.triggerVisualEffect('volcano', position, {
        scale: 2.0, // Larger scale for more dramatic effect
        duration: 3.0 // Longer duration for volcano eruption
    });
    
    // Add additional smoke particles with delay for a more realistic eruption
    setTimeout(() => {
        renderingSystem.triggerVisualEffect('smoke', position, {
            scale: 2.5,
            duration: 5.0
        });
    }, 500);
    
    // Add some sparks/embers
    setTimeout(() => {
        renderingSystem.triggerVisualEffect('sparkle', position, {
            scale: 1.0,
            duration: 2.0
        });
    }, 200);
}

export function triggerMeteorImpact(position) {
    // Use the enhanced rendering system for visual effects
    renderingSystem.triggerVisualEffect('explosion', position, {
        scale: 3.0, // Large scale for dramatic effect
        duration: 2.0 // Short duration for explosive impact
    });
    
    // Add dust particles with slight delay
    setTimeout(() => {
        renderingSystem.triggerVisualEffect('dust', position, {
            scale: 4.0,
            duration: 4.0
        });
    }, 200);
    
    // Add fire particles
    setTimeout(() => {
        renderingSystem.triggerVisualEffect('fire', position, {
            scale: 2.0,
            duration: 3.0
        });
    }, 100);
    
    // Create crater
    createCrater(position, 50); // Create a crater with radius 50 at the impact position
}

function createCrater(position, radius) {
    if (!planetMesh) return;

    const planetGeometry = planetMesh.geometry;
    const positions = planetGeometry.attributes.position.array;
    const planetRadius = planetMesh.geometry.parameters.radius;

    const localImpactPos = planetMesh.worldToLocal(position.clone());

    for (let i = 0; i < positions.length; i += 3) {
        const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const distance = vertex.distanceTo(localImpactPos);

        if (distance < radius) {
            const depth = (1 - (distance / radius)) * 5; // Max depth of 5 units
            vertex.normalize().multiplyScalar(planetRadius - depth);
            positions[i] = vertex.x;
            positions[i + 1] = vertex.y;
            positions[i + 2] = vertex.z;
        }
    }
    planetGeometry.attributes.position.needsUpdate = true;
    planetGeometry.computeVertexNormals();
    planetGeometry.normalsNeedUpdate = true;
}

function getBaseMeshForInstancing(type) {
    const def = elementDefinitions[type];
    const size = def.size * 0.5;
    let geometry;
    let material;

    switch (type) {
        case 'rock':
            geometry = new THREE.ConeGeometry(size * 0.8, 50, 8); // Fixed height for instanced rocks
            material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
            break;
        case 'plant':
            geometry = new THREE.ConeGeometry(size * 0.7, size * 2, 8);
            material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
            break;
        case 'creature':
            geometry = new THREE.SphereGeometry(size, 16, 16);
            material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
            break;
        default:
            return { geometry: null, material: null };
    }
    return { geometry, material };
}



// Import LOD and optimization utilities from renderOptimizer
// Import LOD and optimization utilities from renderOptimizer
import { 
    LOD_LEVELS, 
    getLODLevel, 
    isVisible, 
    getSimplifiedGeometry, 
    sortElementsByImportance, 
    filterElementsByLODAndVisibility,
    updateInstancedMeshWithLOD
} from './systems/renderOptimizer.js';

export function updateElements3D(elements, config, currentMouse3DPoint, placingElement) {
    if (!planetMesh || !config) return;

    // Clear previous instances
    for (const type in instancedMeshes) {
        instancedMeshes[type].count = 0;
    }

    // Track active elements and rain status
    const activeIds = new Set();
    let hasRain = false;

    // Group elements by type for better processing
    const elementsByType = {};
    elements.forEach(el => {
        if (!elementsByType[el.type]) {
            elementsByType[el.type] = [];
        }
        elementsByType[el.type].push(el);
        
        // Check for rain elements
        if (el.type === 'rain') {
            hasRain = true;
        }
    });

    // Process each element type
    for (const type in elementsByType) {
        const typeElements = elementsByType[type];
        
        // Skip processing if no elements of this type
        if (!typeElements.length) continue;

        // Process instanced elements (plants, creatures, rocks) using the enhanced rendering system
        if (['plant', 'creature', 'rock'].includes(type)) {
            const instancedMesh = instancedMeshes[type];
            if (!instancedMesh) continue;
            
            // Use the rendering system's optimized instanced mesh update
            renderingSystem.updateInstancedElements(
                type,
                typeElements,
                config,
                get3DPositionOnPlanet
            );
        } 
        // Handle water elements with consolidated rendering and LOD
        else if (type === 'water') {
            // Sort elements by importance (distance to camera-facing hemisphere)
            const sortedElements = sortElementsByImportance(typeElements, config, camera, get3DPositionOnPlanet);
            
            // Filter water elements by LOD and visibility
            const filteredElements = filterElementsByLODAndVisibility(
                sortedElements, 
                config, 
                camera, 
                get3DPositionOnPlanet
            );
            
            // Remove existing water meshes
            elements3D.children.slice().forEach(child => {
                if (child.userData.type === 'water') {
                    elements3D.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            
            // Create shared material for water elements
            const waterMaterial = new THREE.MeshPhongMaterial({
                color: 0x1E90FF,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            // Process visible water elements with appropriate LOD
            const visibleWaterElements = [
                ...filteredElements.high.slice(0, LOD_LEVELS.HIGH.maxElements / 10),
                ...filteredElements.medium.slice(0, LOD_LEVELS.MEDIUM.maxElements / 10),
                ...filteredElements.low.slice(0, LOD_LEVELS.LOW.maxElements / 10)
            ];
            
            // Create water meshes with appropriate LOD
            visibleWaterElements.forEach(el => {
                const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
                const lodLevel = getLODLevel(pos, camera);
                
                activeIds.add(el.id);
                const waterSize = el.size * Math.min(1, el.amount / 100) * lodLevel.detail;
                
                // Get simplified geometry based on LOD
                const waterGeometry = getSimplifiedGeometry('water', lodLevel, waterSize);
                
                const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
                waterMesh.position.copy(pos);
                waterMesh.lookAt(planetMesh.position);
                waterMesh.userData.id = el.id;
                waterMesh.userData.type = 'water';
                elements3D.add(waterMesh);
            });
        }
        // Handle other non-instanced elements with LOD and occlusion culling
        else {
            // Sort elements by importance (distance to camera-facing hemisphere)
            const sortedElements = sortElementsByImportance(typeElements, config, camera, get3DPositionOnPlanet);
            
            for (const el of sortedElements) {
                // Get position based on element type
                let pos;
                if (el.type === 'meteor' && el.startPos && el.targetPos && el.progress !== undefined) {
                    pos = new THREE.Vector3().lerpVectors(el.startPos, el.targetPos, el.progress);
                } else if (el.type === 'sun') {
                    pos = new THREE.Vector3(500, 500, 500);
                } else {
                    pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
                }
                
                // Apply occlusion culling (except for sun which is always visible)
                if (el.type !== 'sun' && !isVisible(pos, camera)) {
                    continue;
                }
                
                // Apply LOD
                const lodLevel = el.type === 'sun' ? LOD_LEVELS.HIGH : getLODLevel(pos, camera);
                
                // Track active element
                activeIds.add(el.id);
                
                // Find or create mesh
                let mesh = elements3D.children.find(c => c.userData.id === el.id);
                
                if (!mesh) {
                    mesh = createMeshForElement(el);
                    if (!mesh) continue;
                    
                    mesh.userData.id = el.id;
                    mesh.userData.type = el.type;
                    
                    if (el.type === 'sun') {
                        scene.add(mesh); // Add sun directly to scene
                    } else {
                        elements3D.add(mesh);
                    }
                }
                
                // Update position and orientation
                if (el.type === 'meteor') {
                    mesh.position.copy(pos);
                } else if (el.type !== 'sun') {
                    mesh.position.copy(pos);
                    mesh.lookAt(planetMesh.position);
                    
                    // Scale based on LOD level
                    mesh.scale.set(lodLevel.detail, lodLevel.detail, lodLevel.detail);
                }
                
                // Update visual appearance based on health
                if (mesh.material && mesh.material.color && el.health !== undefined) {
                    const healthFactor = Math.max(0, Math.min(1, el.health / 100));
                    const baseColor = new THREE.Color(elementDefinitions[el.type].color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'));
                    const deadColor = new THREE.Color(0x808080);
                    mesh.material.color.lerpColors(deadColor, baseColor, healthFactor);
                }
            }
        }
    }

    // Clean up non-instanced meshes that are no longer active
    elements3D.children.slice().forEach(child => {
        if (child.userData.id !== undefined && !activeIds.has(child.userData.id)) {
            elements3D.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });

    // Update rain particles visibility
    rainParticles.visible = hasRain;
    
    // Update snow particles visibility based on weather
    const snowParticles = scene.getObjectByName('snowParticles');
    if (snowParticles) {
        // Check if any weather elements indicate snow
        const hasSnow = elements.some(el => el.type === 'weather' && el.weatherType === 'snowy');
        snowParticles.visible = hasSnow;
    }

    // Ghost element logic with LOD support
    if (ghostElementMesh) scene.remove(ghostElementMesh);
    if (placingElement && placingElement !== 'eraser' && currentMouse3DPoint) {
        // Create a dummy element object for ghost rendering
        const dummyElement = { type: placingElement, height: 50 }; // Add height for rock ghost
        
        // Use LOD for ghost element based on element type
        if (['plant', 'creature', 'rock'].includes(placingElement)) {
            // For instanced types, create a simplified ghost mesh
            const def = elementDefinitions[placingElement];
            const size = def.size * 0.5;
            let geometry;
            
            switch (placingElement) {
                case 'rock':
                    geometry = new THREE.ConeGeometry(size * 0.8, 50, 8);
                    break;
                case 'plant':
                    geometry = new THREE.ConeGeometry(size * 0.7, size * 2, 8);
                    break;
                case 'creature':
                    geometry = new THREE.SphereGeometry(size, 16, 16);
                    break;
            }
            
            const material = new THREE.MeshPhongMaterial({
                color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'),
                transparent: true,
                opacity: 0.5,
                wireframe: false
            });
            
            ghostElementMesh = new THREE.Mesh(geometry, material);
        } else {
            // For other types, use the standard mesh creation
            ghostElementMesh = createMeshForElement(dummyElement);
            if (ghostElementMesh) {
                ghostElementMesh.material.transparent = true;
                ghostElementMesh.material.opacity = 0.5;
            }
        }
        
        if (ghostElementMesh) {
            ghostElementMesh.position.copy(currentMouse3DPoint);
            ghostElementMesh.lookAt(planetMesh.position);
            scene.add(ghostElementMesh);
        }
    }
}

export function get3DPositionOnPlanet(x, y, config, elementType) {
    const ecoSize = ecosystemSizes[config.ecosystemSize];
    const lat = (y / ecoSize.height - 0.5) * Math.PI;
    const lon = (x / ecoSize.width - 0.5) * 2 * Math.PI;
    let radius = ecoSize.radius;

    // Adjust radius based on element type for better visual placement
    if (elementType === 'water') {
        radius += 0.5; // Slightly above surface for water
    } else if (elementType === 'rock') {
        radius += 0.1; // On the surface for rocks
    } else {
        radius += 1; // Default slightly above surface
    }

    return new THREE.Vector3(
        -radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon)
    );
}

export function get3DIntersectionPoint(event, canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planetMesh);
    return intersects.length > 0 ? intersects[0].point : null;
}

// Funções de get/set/convert que podem ser necessárias
export function getCameraState() { return { position: camera.position.toArray(), target: controls.target.toArray() }; }
export function setCameraState(state) { camera.position.fromArray(state.position); controls.target.fromArray(state.target); }
export function convert3DTo2DCoordinates(point3D, config) { 
    if (!planetMesh || !config) return { x: 0, y: 0 };

    const ecoSize = ecosystemSizes[config.ecosystemSize];
    const localPoint = planetMesh.worldToLocal(point3D.clone());
    
    const lon = Math.atan2(localPoint.z, -localPoint.x);
    const lat = Math.asin(localPoint.y / ecoSize.radius);

    const x = (lon / (2 * Math.PI) + 0.5) * ecoSize.width;
    const y = (lat / Math.PI + 0.5) * ecoSize.height;

    return { x, y };
}