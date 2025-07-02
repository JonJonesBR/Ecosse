import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { elementDefinitions, ecosystemSizes } from './utils.js';

let scene, camera, renderer, controls;
let planetMesh, starField, ghostElementMesh;
const elements3D = new THREE.Group();
let rendererContainer;

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

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    createPlanet(initialConfig);
    createStarfield();
    scene.add(elements3D);

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
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
    if (planetMesh) {
        scene.remove(planetMesh);
        planetMesh.geometry.dispose();
        planetMesh.material.dispose();
    }

    const planetRadius = ecosystemSizes[config.ecosystemSize].radius;
    const geometry = new THREE.SphereGeometry(planetRadius, 64, 64);

    // Dynamic texture generation
    const texture = new THREE.CanvasTexture(generatePlanetTexture(config));
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: config.planetType === 'aquatic' ? 100 : 10
    });

    planetMesh = new THREE.Mesh(geometry, material);
    scene.add(planetMesh);

    // Atmosphere
    if (planetMesh.children.length > 0) {
        const atmosphere = planetMesh.children[0];
        atmosphere.geometry.dispose();
        atmosphere.material.dispose();
        planetMesh.remove(atmosphere);
    }

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
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planetMesh.add(atmosphere);

    // Update sun light
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

function createStarfield() {
    if (starField) scene.remove(starField);
    const positions = [];
    for (let i = 0; i < 2000; i++) {
        positions.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starField = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 }));
    scene.add(starField);
}

export function resetCamera(config) {
    if (planetMesh && config) {
        controls.reset();
        camera.position.z = ecosystemSizes[config.ecosystemSize].radius * 2;
    }
}

function createMeshForElement(elementType) {
    const def = elementDefinitions[elementType];
    if (!def) return null;
    const size = def.size * 0.5;
    let geometry;
    if(elementType === 'plant') geometry = new THREE.ConeGeometry(size * 0.7, size * 2, 8);
    else if(elementType === 'rock') geometry = new THREE.IcosahedronGeometry(size, 0);
    else geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshPhongMaterial({ color: def.color.replace('rgba', 'rgb').replace(/, \d\.\d+\)/, ')') });
    return new THREE.Mesh(geometry, material);
}

export function updateElements3D(elements, config, currentMouse3DPoint, placingElement) {
    if (!planetMesh || !config) return;
    // Sincronizar elementos
    const activeIds = new Set(elements.map(el => el.id));
    elements3D.children.filter(c => !activeIds.has(c.userData.id)).forEach(c => elements3D.remove(c));
    elements.forEach(el => {
        let mesh = elements3D.children.find(c => c.userData.id === el.id);
        if (!mesh) {
            mesh = createMeshForElement(el.type);
            if(!mesh) return;
            mesh.userData.id = el.id;
            elements3D.add(mesh);
        }
        const pos = get3DPositionOnPlanet(el.x, el.y, config);
        mesh.position.copy(pos);
        mesh.lookAt(planetMesh.position);
    });
    scene.add(elements3D);

    // Lógica do fantasma
    if (ghostElementMesh) scene.remove(ghostElementMesh);
    if (placingElement && placingElement !== 'eraser' && currentMouse3DPoint) {
        ghostElementMesh = createMeshForElement(placingElement);
        if(ghostElementMesh) {
            ghostElementMesh.material.transparent = true;
            ghostElementMesh.material.opacity = 0.5;
            ghostElementMesh.position.copy(currentMouse3DPoint);
            ghostElementMesh.lookAt(planetMesh.position);
            scene.add(ghostElementMesh);
        }
    }
}

export function get3DPositionOnPlanet(x, y, config) {
    const ecoSize = ecosystemSizes[config.ecosystemSize];
    const lat = (y / ecoSize.height - 0.5) * Math.PI;
    const lon = (x / ecoSize.width - 0.5) * 2 * Math.PI;
    const radius = ecoSize.radius + 1; // Levemente acima da superfície
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