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

let scene, camera, renderer, controls;
let planetMesh, starField, ghostElementMesh, rainParticles, cloudMesh, waterMesh;
const elements3D = new THREE.Group(); // This will now hold non-instanced elements
let instancedMeshes = {}; // NEW: To hold InstancedMesh objects keyed by element type
const dummy = new THREE.Object3D(); // NEW: Dummy object for setting instance matrices
let rendererContainer;
let dayCycleTime = 0; // New variable for day/night cycle
let moonLight; // New variable for moon light

export function init3DScene(container, initialConfig) {
    rendererContainer = container;
    // Clear existing content in the container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x404040, 2));
    const sunLight = new THREE.DirectionalLight(0xffffff, initialConfig.luminosity);
    sunLight.position.set(200, 100, 200);
    sunLight.name = 'sunLight'; // Name the light for easy access
    scene.add(sunLight);

    moonLight = new THREE.DirectionalLight(0xADD8E6, 0); // Light blue, initially off
    moonLight.position.set(-200, -100, -200);
    moonLight.name = 'moonLight';
    scene.add(moonLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    createPlanet(initialConfig);
    createStarfield();
    createClouds(initialConfig);
    createRainParticles();

    // NEW: Initialize InstancedMeshes for common elements
    for (const type in elementDefinitions) {
        const def = elementDefinitions[type];
        if (['plant', 'creature', 'rock'].includes(type)) { // Elements to be instanced
            const { geometry, material } = getBaseMeshForInstancing(type);
            if (geometry && material) {
                const instancedMesh = new THREE.InstancedMesh(geometry, material, 5000); // Max instances
                instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                instancedMeshes[type] = instancedMesh;
                scene.add(instancedMesh);
            }
        }
    }

    scene.add(elements3D); // elements3D will now hold non-instanced elements

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();

        // Update day/night cycle
        dayCycleTime += 0.001; // Adjust speed of day/night cycle
        const sunLight = scene.getObjectByName('sunLight');
        const ambientLight = scene.getObjectByProperty('isAmbientLight', true);

        if (sunLight) {
            // Rotate sun around the planet
            sunLight.position.x = Math.sin(dayCycleTime) * 200;
            sunLight.position.z = Math.cos(dayCycleTime) * 200;

            // Adjust sun intensity based on its position (simulating dawn/dusk)
            const sunIntensityFactor = Math.max(0, Math.sin(dayCycleTime + Math.PI / 4)); // Offset for smoother transition
            sunLight.intensity = initialConfig.luminosity * sunIntensityFactor;
        }

        if (moonLight) {
            // Rotate moon opposite to sun
            moonLight.position.x = Math.sin(dayCycleTime + Math.PI) * 200;
            moonLight.position.z = Math.cos(dayCycleTime + Math.PI) * 200;

            // Adjust moon intensity
            const moonIntensityFactor = Math.max(0, Math.sin(dayCycleTime - Math.PI / 4)); // Offset for smoother transition
            moonLight.intensity = 0.5 * moonIntensityFactor; // Moonlight is dimmer
        }

        if (ambientLight) {
            // Adjust ambient light intensity based on time of day
            ambientLight.intensity = 0.8 + (Math.sin(dayCycleTime) + 1) * 0.75; // Brighter during day, dimmer at night (adjusted for brighter night)
        }
        
        // Update all custom shaders via shader manager
        if (shaderManager) {
            shaderManager.update();
        }
        
        // No need to manually animate rain particles or clouds anymore
        // as they're now handled by the shader manager

        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', onWindowResize);
    return renderer.domElement;
}

function onWindowResize() {
    camera.aspect = rendererContainer.clientWidth / rendererContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(rendererContainer.clientWidth, rendererContainer.clientHeight);
}

export function updatePlanetAppearance(config) {
    createPlanet(config);
}

function createPlanet(config) {
    const planetRadius = ecosystemSizes[config.ecosystemSize].radius;

    // Update or create planet mesh
    if (planetMesh) {
        // Update geometry only if radius changes
        if (planetMesh.geometry.parameters.radius !== planetRadius) {
            planetMesh.geometry.dispose();
            planetMesh.geometry = new THREE.SphereGeometry(planetRadius, 64, 64);
        }

        // Update material properties
        const newTexture = new THREE.CanvasTexture(generatePlanetTexture(config));
        const newBumpMap = new THREE.CanvasTexture(generateBumpMapTexture(config));
        if (planetMesh.material.map) {
            planetMesh.material.map.dispose(); // Dispose old texture
        }
        if (planetMesh.material.bumpMap) {
            planetMesh.material.bumpMap.dispose(); // Dispose old bump map
        }
        planetMesh.material.map = newTexture;
        planetMesh.material.bumpMap = newBumpMap;
        planetMesh.material.bumpScale = 5; // Adjust this value for desired bump intensity
        planetMesh.material.shininess = config.planetType === 'aquatic' ? 100 : 10;
        planetMesh.material.needsUpdate = true; // Important for material changes
    } else {
        // Create new planet mesh if it doesn't exist
        const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generatePlanetTexture(config)),
            bumpMap: new THREE.CanvasTexture(generateBumpMapTexture(config)),
            bumpScale: 5, // Adjust this value for desired bump intensity
            shininess: config.planetType === 'aquatic' ? 100 : 10
        });
        planetMesh = new THREE.Mesh(geometry, material);
        planetMesh.rotation.z = Math.PI / 8; // Add a slight axial tilt (22.5 degrees)
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

    // Update sun light (already optimized)
    const sunLight = scene.getObjectByName('sunLight');
    if (sunLight) {
        sunLight.intensity = config.luminosity;
    }

    camera.position.z = planetRadius * 2;
    controls.minDistance = planetRadius + 10;
    controls.maxDistance = planetRadius * 4;
    controls.update();
}

const simplex = new SimplexNoise(); // Initialize Simplex Noise

function generatePlanetTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Increased resolution for better detail
    canvas.height = 512;
    const context = canvas.getContext('2d');

    const waterColor = '#1E90FF'; // DodgerBlue
    const landColor = '#228B22'; // ForestGreen
    const desertColor = '#D2B48C'; // Tan
    const volcanicColor = '#A0522D'; // Sienna
    const gasColor1 = '#FFD700'; // Gold
    const gasColor2 = '#FFDEAD'; // NavajoWhite

    const scale = 0.02; // Adjust for continent size
    const octaves = 4;
    const persistence = 0.5;
    const lacunarity = 2.0;
    const threshold = 0.1; // Adjust for land/water ratio

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            for (let i = 0; i < octaves; i++) {
                noiseValue += simplex.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
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
                    const bandNoise = simplex.noise2D(0, y * 0.05); // Noise along y-axis for bands
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

function generateBumpMapTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    const scale = 0.05; // Adjust for mountain size
    const octaves = 6;
    const persistence = 0.5;
    const lacunarity = 2.0;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let noiseValue = 0;
            let frequency = 1;
            let amplitude = 1;

            for (let i = 0; i < octaves; i++) {
                noiseValue += simplex.noise2D(x * scale * frequency, y * scale * frequency) * amplitude;
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
    // Use the advanced particle system instead of the basic one
    if (particleSystem) {
        // Create fire and smoke effect at the volcano position
        particleSystem.createEffect('fireAndSmoke', position, {
            scale: 2.0, // Larger scale for more dramatic effect
            duration: 3.0 // Longer duration for volcano eruption
        });
        
        // Add additional smoke particles with delay for a more realistic eruption
        setTimeout(() => {
            particleSystem.spawnParticles(ParticleTypes.SMOKE, position, {
                scale: 2.5,
                duration: 5.0
            });
        }, 500);
        
        // Add some sparks/embers
        setTimeout(() => {
            particleSystem.spawnParticles(ParticleTypes.SPARKLE, position, {
                scale: 1.0,
                duration: 2.0
            });
        }, 200);
    } else {
        // Fallback to old implementation if particle system is not available
        if (volcanoSmokeParticles) scene.remove(volcanoSmokeParticles);

        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const pArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            pArray[i] = position.x + (Math.random() - 0.5) * 20;
            pArray[i + 1] = position.y + (Math.random() - 0.5) * 20;
            pArray[i + 2] = position.z + (Math.random() - 0.5) * 20;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(pArray, 3));

        const pMaterial = new THREE.PointsMaterial({
            color: 0x808080, // Grey smoke
            size: 5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        volcanoSmokeParticles = new THREE.Points(particles, pMaterial);
        scene.add(volcanoSmokeParticles);

        // Animate smoke for a short duration
        let opacity = 0.8;
        const animateSmoke = () => {
            if (volcanoSmokeParticles) {
                opacity -= 0.02;
                volcanoSmokeParticles.material.opacity = opacity;
                volcanoSmokeParticles.scale.multiplyScalar(1.05);
                if (opacity > 0) {
                    requestAnimationFrame(animateSmoke);
                } else {
                    scene.remove(volcanoSmokeParticles);
                    volcanoSmokeParticles.geometry.dispose();
                    volcanoSmokeParticles.material.dispose();
                    volcanoSmokeParticles = null;
                }
            }
        };
        animateSmoke();
    }
}

export function triggerMeteorImpact(position) {
    // Use the advanced particle system if available
    if (particleSystem) {
        // Create explosion effect at the impact position
        particleSystem.createEffect('explosion', position, {
            scale: 3.0, // Large scale for dramatic effect
            duration: 2.0 // Short duration for explosive impact
        });
        
        // Add dust particles with slight delay
        setTimeout(() => {
            particleSystem.spawnParticles(ParticleTypes.DUST, position, {
                scale: 4.0,
                duration: 4.0
            });
        }, 200);
        
        // Add fire particles
        setTimeout(() => {
            particleSystem.spawnParticles(ParticleTypes.FIRE, position, {
                scale: 2.0,
                duration: 3.0
            });
        }, 100);
    } else {
        // Fallback to old implementation if particle system is not available
        if (meteorExplosionParticles) scene.remove(meteorExplosionParticles);

        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const pArray = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            pArray[i] = position.x + (Math.random() - 0.5) * 50;
            pArray[i + 1] = position.y + (Math.random() - 0.5) * 50;
            pArray[i + 2] = position.z + (Math.random() - 0.5) * 50;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(pArray, 3));

        const pMaterial = new THREE.PointsMaterial({
            color: 0xFF4500, // Orange-red explosion
            size: 10,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        meteorExplosionParticles = new THREE.Points(particles, pMaterial);
        scene.add(meteorExplosionParticles);

        // Animate explosion for a short duration
        let opacity = 1.0;
        const animateExplosion = () => {
            if (meteorExplosionParticles) {
                opacity -= 0.05;
                meteorExplosionParticles.material.opacity = opacity;
                meteorExplosionParticles.scale.multiplyScalar(1.1);
                if (opacity > 0) {
                    requestAnimationFrame(animateExplosion);
                } else {
                    scene.remove(meteorExplosionParticles);
                    meteorExplosionParticles.geometry.dispose();
                    meteorExplosionParticles.material.dispose();
                    meteorExplosionParticles = null;
                }
            }
        };
        animateExplosion();
    }
    
    // Create crater regardless of which particle system is used
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



export function updateElements3D(elements, config, currentMouse3DPoint, placingElement) {
    if (!planetMesh || !config) return;

    const maxRenderedElementsPerType = 500; // Limit the number of 3D elements per type

    // Clear previous instances
    for (const type in instancedMeshes) {
        instancedMeshes[type].count = 0;
    }

    // Sincronizar elementos
    const activeIds = new Set();
    let hasRain = false;

    // Filter and limit elements to be rendered in 3D
    const elementsToRender = {};
    for (const el of elements) {
        if (!elementsToRender[el.type]) {
            elementsToRender[el.type] = [];
        }
        if (elementsToRender[el.type].length < maxRenderedElementsPerType) {
            elementsToRender[el.type].push(el);
        }
    }

    // Process elements to render
    for (const type in elementsToRender) {
        elementsToRender[type].forEach((el, index) => {
            if (el.type === 'rain') {
                hasRain = true;
            }

            const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);

            if (['plant', 'creature', 'rock'].includes(el.type)) {
                // Handle instanced elements
                const instancedMesh = instancedMeshes[el.type];
                if (instancedMesh) {
                    dummy.position.copy(pos);
                    dummy.lookAt(planetMesh.position);
                    dummy.updateMatrix();
                    instancedMesh.setMatrixAt(instancedMesh.count, dummy.matrix);

                    // Set color based on health
                    const healthFactor = el.health / 100; // Assuming max health is 100
                    const baseColor = new THREE.Color(elementDefinitions[el.type].color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'));
                    const deadColor = new THREE.Color(0x808080); // Grey
                    const instanceColor = new THREE.Color().lerpColors(deadColor, baseColor, healthFactor);
                    instancedMesh.setColorAt(instancedMesh.count, instanceColor);

                    instancedMesh.count++;
                }
            } else if (el.type === 'water') {
                // Handle water elements (still individual meshes for now)
                activeIds.add(el.id);
                let mesh = elements3D.children.find(c => c.userData.id === el.id);

                if (!mesh) {
                    const waterMaterial = new THREE.MeshPhongMaterial({
                        color: 0x1E90FF, // DodgerBlue
                        transparent: true,
                        opacity: 0.7,
                        side: THREE.DoubleSide
                    });
                    const waterSize = el.size * Math.min(1, el.amount / 100);
                    const waterGeometry = new THREE.PlaneGeometry(waterSize, waterSize);
                    mesh = new THREE.Mesh(waterGeometry, waterMaterial);
                    mesh.userData.id = el.id;
                    mesh.userData.type = 'water';
                    elements3D.add(mesh);
                }
                mesh.position.copy(pos);
                mesh.lookAt(planetMesh.position);
            } else {
                // Handle non-instanced elements (sun, meteor, volcano, tribe, fungus, eraser, rain)
                activeIds.add(el.id);
                let mesh = elements3D.children.find(c => c.userData.id === el.id);

                if (!mesh) {
                    mesh = createMeshForElement(el);
                    if (!mesh) return; // Should not happen for these types now
                    mesh.userData.id = el.id;
                    mesh.userData.type = el.type; // Store type for easier filtering
                    elements3D.add(mesh);

                    if (el.type === 'sun') {
                        mesh.position.set(500, 500, 500); // Sun is a special case, fixed position
                        scene.add(mesh); // Add sun directly to scene, not elements3D
                    } else if (el.type === 'meteor') {
                        mesh.position.set(el.x, el.y, el.z); // Use the 3D position from MeteorElement
                    }
                }

                // Update existing mesh properties
                if (el.type === 'meteor') {
                    mesh.position.set(el.x, el.y, el.z); // Use the 3D position from MeteorElement
                } else if (el.type !== 'sun') { // Sun position is fixed
                    mesh.position.copy(pos);
                    mesh.lookAt(planetMesh.position);
                }

                // Visual feedback for element health
                if (mesh.material.color) {
                    const healthFactor = el.health / 100; // Assuming max health is 100
                    const baseColor = new THREE.Color(elementDefinitions[el.type].color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'));
                    const deadColor = new THREE.Color(0x808080); // Grey
                    mesh.material.color.lerpColors(deadColor, baseColor, healthFactor);
                }
            }
        });
    }

    // Update instance matrices and colors
    for (const type in instancedMeshes) {
        instancedMeshes[type].instanceMatrix.needsUpdate = true;
        if (instancedMeshes[type].instanceColor) {
            instancedMeshes[type].instanceColor.needsUpdate = true;
        }
    }

    // Remove non-instanced meshes that are no longer in the elements list or exceed the limit
    elements3D.children.slice().forEach(child => {
        // Check if the element still exists in the simulation and is within the rendering limit
        const elementExistsAndShouldBeRendered = elementsToRender[child.userData.type] &&
                                                 elementsToRender[child.userData.type].some(el => el.id === child.userData.id);

        // Also check if it's an instanced type, if so, it should not be in elements3D anymore
        const isInstancedType = ['plant', 'creature', 'rock'].includes(child.userData.type);

        if ((!elementExistsAndShouldBeRendered && child.userData.id !== undefined && child.userData.type !== 'water') || isInstancedType) {
            elements3D.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    });

    // Handle water as a single mesh (existing logic, no change needed here)
    const waterElements = elements.filter(el => el.type === 'water');
    if (waterElements.length > 0) {
        // Remove existing water meshes from elements3D if any
        elements3D.children.slice().forEach(child => {
            if (child.userData.type === 'water') {
                elements3D.remove(child);
                child.geometry.dispose();
                child.material.dispose();
            }
        });

        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E90FF, // DodgerBlue
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        waterElements.forEach(el => {
            const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
            const waterSize = el.size * Math.min(1, el.amount / 100);
            const waterGeometry = new THREE.PlaneGeometry(waterSize, waterSize);
            const individualWaterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
            individualWaterMesh.position.copy(pos);
            individualWaterMesh.lookAt(planetMesh.position); // Orient towards planet center
            individualWaterMesh.userData.id = el.id; // Keep track of the element ID
            individualWaterMesh.userData.type = 'water';
            elements3D.add(individualWaterMesh);
        });

    } else {
        // Remove all water meshes if no water elements exist
        elements3D.children.slice().forEach(child => {
            if (child.userData.type === 'water') {
                elements3D.remove(child);
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
    rainParticles.visible = hasRain;

    // Lógica do fantasma (existing logic, no change needed here)
    if (ghostElementMesh) scene.remove(ghostElementMesh);
    if (placingElement && placingElement !== 'eraser' && currentMouse3DPoint) {
        // Create a dummy element object for ghost rendering
        const dummyElement = { type: placingElement, height: 50 }; // Add height for rock ghost
        ghostElementMesh = createMeshForElement(dummyElement);
        if(ghostElementMesh) {
            ghostElementMesh.material.transparent = true;
            ghostElementMesh.material.opacity = 0.5;
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