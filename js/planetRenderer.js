import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { elementDefinitions, ecosystemSizes } from './utils.js';

let scene, camera, renderer, controls;
let planetMesh, starField, ghostElementMesh, rainParticles, cloudMesh, waterMesh;
const elements3D = new THREE.Group();
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
    scene.add(elements3D);

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
            ambientLight.intensity = 0.5 + (Math.sin(dayCycleTime) + 1) * 0.75; // Brighter during day, dimmer at night
        }

        // Animate rain particles
        if (rainParticles && rainParticles.visible) {
            rainParticles.geometry.attributes.position.array.forEach((p, i) => {
                if (i % 3 === 1) { // Y-coordinate
                    rainParticles.geometry.attributes.position.array[i] -= 2; // Fall speed
                    if (rainParticles.geometry.attributes.position.array[i] < -250) {
                        rainParticles.geometry.attributes.position.array[i] = 250; // Reset to top
                    }
                }
            });
            rainParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Animate clouds
        if (cloudMesh) {
            cloudMesh.rotation.y += 0.0005;
        }

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
        if (planetMesh.material.map) {
            planetMesh.material.map.dispose(); // Dispose old texture
        }
        planetMesh.material.map = newTexture;
        planetMesh.material.shininess = config.planetType === 'aquatic' ? 100 : 10;
        planetMesh.material.needsUpdate = true; // Important for material changes
    } else {
        // Create new planet mesh if it doesn't exist
        const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generatePlanetTexture(config)),
            shininess: config.planetType === 'aquatic' ? 100 : 10
        });
        planetMesh = new THREE.Mesh(geometry, material);
        scene.add(planetMesh);
    }

    // Update or create atmosphere
    let atmosphere = planetMesh.children.find(child => child.name === 'atmosphere');
    if (atmosphere) {
        // Update existing atmosphere material
        let atmosphereColor = 0xFFFFFF;
        let atmosphereOpacity = 0.3;

        switch (config.atmosphere) {
            case 'methane':
                atmosphereColor = 0xFF4500;
                atmosphereOpacity = 0.4;
                break;
            case 'thin':
                atmosphereOpacity = 0.1;
                break;
            case 'dense':
                atmosphereOpacity = 0.6;
                break;
        }
        atmosphere.material.color.set(atmosphereColor);
        atmosphere.material.opacity = atmosphereOpacity;
        atmosphere.material.needsUpdate = true;
    } else {
        // Create new atmosphere if it doesn't exist
        const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * 1.05, 64, 64);
        let atmosphereColor = 0xFFFFFF;
        let atmosphereOpacity = 0.3;

        switch (config.atmosphere) {
            case 'methane':
                atmosphereColor = 0xFF4500;
                atmosphereOpacity = 0.4;
                break;
            case 'thin':
                atmosphereOpacity = 0.1;
                break;
            case 'dense':
                atmosphereOpacity = 0.6;
                break;
        }

        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: atmosphereColor,
            transparent: true,
            opacity: atmosphereOpacity,
            side: THREE.BackSide
        });
        atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.name = 'atmosphere'; // Name the atmosphere for easy access
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

function generatePlanetTexture(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Base color
    let baseColor;
    switch (config.planetType) {
        case 'desert': baseColor = '#D2B48C'; break;
        case 'aquatic': baseColor = '#1E90FF'; break;
        case 'volcanic': baseColor = '#A0522D'; break;
        case 'gas': baseColor = '#FFD700'; break;
        default: baseColor = '#228B22'; break; // Terrestrial
    }
    context.fillStyle = baseColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add features
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        let color;

        switch (config.planetType) {
            case 'terrestrial':
                color = Math.random() > 0.2 ? '#1E90FF' : '#FFFFFF'; // Water and clouds
                break;
            case 'desert':
                color = '#A0522D'; // Darker sand
                break;
            case 'aquatic':
                color = '#FFFFFF'; // Clouds
                break;
            case 'volcanic':
                color = Math.random() > 0.1 ? '#FF4500' : '#8B0000'; // Lava and rock
                break;
            case 'gas':
                color = Math.random() > 0.5 ? '#FFA500' : '#FFDEAD'; // Gas bands
                break;
        }

        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
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
        // Update material (texture and opacity)
        cloudMesh.material.map = new THREE.CanvasTexture(generateCloudTexture());
        cloudMesh.material.opacity = 0.4;
        cloudMesh.material.needsUpdate = true;
    } else {
        const cloudGeometry = new THREE.SphereGeometry(planetRadius * 1.02, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.CanvasTexture(generateCloudTexture()),
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
        });
        cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
        scene.add(cloudMesh);
    }
}

function createRainParticles() {
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const pMaterial = new THREE.PointsMaterial({
        color: 0xADD8E6, // Light blue
        size: 1,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const pArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        pArray[i] = (Math.random() - 0.5) * 500; // Spread particles in a cube
    }
    particles.setAttribute('position', new THREE.BufferAttribute(pArray, 3));

    rainParticles = new THREE.Points(particles, pMaterial);
    rainParticles.visible = false; // Hidden by default
    scene.add(rainParticles);
}

function createMeshForElement(element) {
    const def = elementDefinitions[element.type];
    if (!def) return null;
    const size = def.size * 0.5;
    let geometry;
    let material;

    // If it's a water element, we don't create a mesh here as it's handled by the consolidated waterMesh
    if (element.type === 'water') {
        return null;
    } else {
        switch (element.type) {
            case 'rock':
                geometry = new THREE.ConeGeometry(size * 0.8, element.height, 8);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'plant':
                geometry = new THREE.ConeGeometry(size * 0.7, size * 2, 8);
                material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
                break;
            case 'creature':
                geometry = new THREE.SphereGeometry(size, 16, 16);
                let creatureColor = def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')');
                if (element.preferredBiome === 'aquatic') {
                    creatureColor = '#0000FF'; // Blue for aquatic creatures
                } else if (element.preferredBiome === 'desert') {
                    creatureColor = '#8B4513'; // SaddleBrown for desert creatures
                }
                material = new THREE.MeshPhongMaterial({ color: creatureColor });
                break;
            case 'sun':
                geometry = new THREE.SphereGeometry(size, 32, 32);
                material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow for sun
                break;
            case 'rain':
                geometry = new THREE.BoxGeometry(size * 0.5, size * 2, size * 0.5); // Simple raindrop
                material = new THREE.MeshBasicMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')'), transparent: true, opacity: 0.6 });
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

export function triggerMeteorImpact(position) {
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

export function updateElements3D(elements, config, currentMouse3DPoint, placingElement) {
    if (!planetMesh || !config) return;
    // Sincronizar elementos
    const activeIds = new Set();
    const meshesToKeep = [];
    let hasRain = false;

    elements.forEach(el => {
        if (el.type === 'rain') {
            hasRain = true;
        }
        // Skip water elements as they are handled by the consolidated waterMesh
        if (el.type === 'water') {
            return;
        }
        activeIds.add(el.id);
        let mesh = elements3D.children.find(c => c.userData.id === el.id);

        if (!mesh) {
            if (el.type === 'sun') {
                mesh = createMeshForElement(el);
                if (!mesh) return;
                mesh.userData.id = el.id;
                mesh.position.set(500, 500, 500);
                scene.add(mesh);
            } else if (el.type === 'meteor') {
                mesh = createMeshForElement(el);
                if (!mesh) return;
                mesh.userData.id = el.id;
                mesh.position.set(el.x, el.y, el.z); // Use the 3D position from MeteorElement
                elements3D.add(mesh);
            } else {
                mesh = createMeshForElement(el);
                if (!mesh) return;
                mesh.userData.id = el.id;
                elements3D.add(mesh);
            }
        } else {
            // Update existing mesh properties if needed (e.g., water amount)
            if (el.type === 'water') {
                const scale = Math.min(1, el.amount / 100);
                mesh.scale.set(scale, scale, 1);
            }
        }
        const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
        if (el.type === 'meteor') {
            mesh.position.set(el.x, el.y, el.z); // Use the 3D position from MeteorElement
        } else {
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
        meshesToKeep.push(mesh);
    });

    // Remove meshes that are no longer in the elements list
    elements3D.children.slice().forEach(child => {
        if (!activeIds.has(child.userData.id) && child.userData.id !== undefined && child.userData.type !== 'water') {
            elements3D.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    });

    // Handle water as a single mesh
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

    // Lógica do fantasma
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