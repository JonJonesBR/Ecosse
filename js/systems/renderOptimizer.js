/**
 * Render Optimization System
 * This system provides optimization utilities for 3D rendering
 */

import * as THREE from 'three';

// LOD configuration
export const LOD_LEVELS = {
    HIGH: { distance: 150, detail: 1.0, maxElements: 5000 },
    MEDIUM: { distance: 300, detail: 0.6, maxElements: 2000 },
    LOW: { distance: 500, detail: 0.3, maxElements: 1000 }
};

// Frustum for occlusion culling
const frustum = new THREE.Frustum();
const cameraViewProjectionMatrix = new THREE.Matrix4();

/**
 * Determines the LOD level based on distance from camera
 * @param {THREE.Vector3} position - The position to check
 * @param {THREE.Camera} camera - The camera
 * @returns {Object} - The LOD level configuration
 */
export function getLODLevel(position, camera) {
    const distanceToCamera = position.distanceTo(camera.position);
    if (distanceToCamera < LOD_LEVELS.HIGH.distance) return LOD_LEVELS.HIGH;
    if (distanceToCamera < LOD_LEVELS.MEDIUM.distance) return LOD_LEVELS.MEDIUM;
    return LOD_LEVELS.LOW;
}

/**
 * Checks if a position is visible to the camera (occlusion culling)
 * @param {THREE.Vector3} position - The position to check
 * @param {THREE.Camera} camera - The camera
 * @returns {boolean} - Whether the position is visible
 */
export function isVisible(position, camera) {
    // Update the frustum with current camera matrices
    camera.updateMatrixWorld();
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
    
    // Check if the position is within the camera frustum
    return frustum.containsPoint(position);
}

/**
 * Creates a simplified geometry based on LOD level
 * @param {string} type - The element type
 * @param {Object} lodLevel - The LOD level configuration
 * @param {number} size - The base size of the element
 * @returns {THREE.BufferGeometry} - The simplified geometry
 */
export function getSimplifiedGeometry(type, lodLevel, size) {
    const scaledSize = size * lodLevel.detail;
    
    switch (type) {
        case 'rock':
            // Reduce polygon count for lower LOD levels
            const rockSegments = lodLevel === LOD_LEVELS.HIGH ? 8 : lodLevel === LOD_LEVELS.MEDIUM ? 6 : 4;
            return new THREE.ConeGeometry(scaledSize * 0.8, 50 * lodLevel.detail, rockSegments);
        case 'plant':
            const plantSegments = lodLevel === LOD_LEVELS.HIGH ? 8 : lodLevel === LOD_LEVELS.MEDIUM ? 6 : 4;
            return new THREE.ConeGeometry(scaledSize * 0.7, scaledSize * 2, plantSegments);
        case 'creature':
            const creatureSegments = lodLevel === LOD_LEVELS.HIGH ? 16 : lodLevel === LOD_LEVELS.MEDIUM ? 12 : 8;
            return new THREE.SphereGeometry(scaledSize, creatureSegments, creatureSegments);
        case 'water':
            const waterSegments = lodLevel === LOD_LEVELS.HIGH ? 8 : lodLevel === LOD_LEVELS.MEDIUM ? 4 : 2;
            return new THREE.PlaneGeometry(scaledSize, scaledSize, waterSegments, waterSegments);
        case 'planet':
            const planetSegments = lodLevel === LOD_LEVELS.HIGH ? 64 : lodLevel === LOD_LEVELS.MEDIUM ? 48 : 32;
            return new THREE.SphereGeometry(scaledSize, planetSegments, planetSegments);
        default:
            return null;
    }
}

/**
 * Optimizes instanced rendering by sorting elements by distance to camera
 * @param {Array} elements - The elements to sort
 * @param {Object} config - The simulation configuration
 * @param {THREE.Camera} camera - The camera
 * @param {Function} get3DPositionOnPlanet - Function to get 3D position on planet
 * @returns {Array} - The sorted elements
 */
export function sortElementsByImportance(elements, config, camera, get3DPositionOnPlanet) {
    // Calculate camera-facing hemisphere for prioritization
    const planetToCameraDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
    
    return elements.sort((a, b) => {
        const posA = get3DPositionOnPlanet(a.x, a.y, config, a.type);
        const posB = get3DPositionOnPlanet(b.x, b.y, config, b.type);
        
        // Calculate dot product with camera direction (higher means more camera-facing)
        const dotA = planetToCameraDir.dot(posA.clone().normalize());
        const dotB = planetToCameraDir.dot(posB.clone().normalize());
        
        // Sort by dot product (higher values first)
        return dotB - dotA;
    });
}

/**
 * Filters elements based on LOD and visibility
 * @param {Array} elements - The elements to filter
 * @param {Object} config - The simulation configuration
 * @param {THREE.Camera} camera - The camera
 * @param {Function} get3DPositionOnPlanet - Function to get 3D position on planet
 * @returns {Object} - Object containing filtered elements by LOD level
 */
export function filterElementsByLODAndVisibility(elements, config, camera, get3DPositionOnPlanet) {
    const result = {
        high: [],
        medium: [],
        low: [],
        invisible: []
    };
    
    elements.forEach(el => {
        const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
        
        if (!isVisible(pos, camera)) {
            result.invisible.push(el);
            return;
        }
        
        const lodLevel = getLODLevel(pos, camera);
        if (lodLevel === LOD_LEVELS.HIGH) {
            result.high.push(el);
        } else if (lodLevel === LOD_LEVELS.MEDIUM) {
            result.medium.push(el);
        } else {
            result.low.push(el);
        }
    });
    
    return result;
}

/**
 * Manages instanced mesh rendering with LOD and occlusion culling
 * @param {Object} instancedMesh - The instanced mesh to update
 * @param {Array} elements - The elements to render
 * @param {Object} config - The simulation configuration
 * @param {THREE.Camera} camera - The camera
 * @param {Function} get3DPositionOnPlanet - Function to get 3D position on planet
 * @param {THREE.Object3D} dummy - Dummy object for setting instance matrices
 */
export function updateInstancedMeshWithLOD(instancedMesh, elements, config, camera, get3DPositionOnPlanet, dummy) {
    if (!instancedMesh) return;
    
    // Reset instance count
    let instanceCount = 0;
    const maxInstances = instancedMesh.instanceMatrix.count;
    
    // Sort elements by importance
    const sortedElements = sortElementsByImportance(elements, config, camera, get3DPositionOnPlanet);
    
    // Process elements with LOD and occlusion culling
    for (const el of sortedElements) {
        // Get 3D position
        const pos = get3DPositionOnPlanet(el.x, el.y, config, el.type);
        
        // Apply LOD and occlusion culling
        const lodLevel = getLODLevel(pos, camera);
        
        // Skip if we've reached the max elements for this LOD level or if not visible
        if (instanceCount >= lodLevel.maxElements || !isVisible(pos, camera)) {
            continue;
        }
        
        // Set instance matrix
        dummy.position.copy(pos);
        dummy.lookAt(new THREE.Vector3(0, 0, 0)); // Look at planet center
        
        // Scale based on LOD level
        dummy.scale.set(lodLevel.detail, lodLevel.detail, lodLevel.detail);
        
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(instanceCount, dummy.matrix);
        
        // Set color based on health if the mesh supports it
        if (instancedMesh.instanceColor && el.health !== undefined) {
            const healthFactor = Math.max(0, Math.min(1, el.health / 100));
            const baseColor = new THREE.Color(0x00FF00); // Green for full health
            const deadColor = new THREE.Color(0x808080); // Grey for no health
            const instanceColor = new THREE.Color().lerpColors(deadColor, baseColor, healthFactor);
            instancedMesh.setColorAt(instanceCount, instanceColor);
        }
        
        instanceCount++;
        
        // Break if we've reached the maximum instances
        if (instanceCount >= maxInstances) break;
    }
    
    // Update instance count and flags
    instancedMesh.count = instanceCount;
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
    }
}

/**
 * Creates a performance monitor for tracking FPS and other metrics
 * @param {HTMLElement} container - The container to append the monitor to
 * @returns {Object} - The performance monitor object
 */
export function createPerformanceMonitor(container) {
    const monitor = {
        container: document.createElement('div'),
        fpsDisplay: document.createElement('div'),
        elementsDisplay: document.createElement('div'),
        lastTime: performance.now(),
        frames: 0,
        fps: 0,
        elementsCount: 0
    };
    
    // Style the monitor
    monitor.container.style.position = 'absolute';
    monitor.container.style.top = '10px';
    monitor.container.style.right = '10px';
    monitor.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    monitor.container.style.color = 'white';
    monitor.container.style.padding = '5px';
    monitor.container.style.borderRadius = '5px';
    monitor.container.style.fontFamily = 'monospace';
    monitor.container.style.fontSize = '12px';
    monitor.container.style.zIndex = '1000';
    
    // Add displays to container
    monitor.container.appendChild(monitor.fpsDisplay);
    monitor.container.appendChild(monitor.elementsDisplay);
    
    // Add container to parent
    if (container) {
        container.appendChild(monitor.container);
    }
    
    // Update function
    monitor.update = (elementsCount) => {
        monitor.frames++;
        monitor.elementsCount = elementsCount;
        
        const now = performance.now();
        const elapsed = now - monitor.lastTime;
        
        if (elapsed >= 1000) {
            monitor.fps = Math.round((monitor.frames * 1000) / elapsed);
            monitor.fpsDisplay.textContent = `FPS: ${monitor.fps}`;
            monitor.elementsDisplay.textContent = `Elements: ${monitor.elementsCount}`;
            
            monitor.frames = 0;
            monitor.lastTime = now;
        }
    };
    
    // Toggle visibility
    monitor.toggle = () => {
        monitor.container.style.display = monitor.container.style.display === 'none' ? 'block' : 'none';
    };
    
    return monitor;
}