/**
 * Spatial Audio System - 3D Audio positioning and environmental effects
 * This system provides immersive 3D audio based on camera position and ecosystem elements
 */

import { playEnhancedSFX, playElementSound, playEnvironmentSound, getAudioConfig } from '../audioManager.js';
import { getCameraState, get3DPositionOnPlanet } from '../planetRenderer.js';
import { getEcosystemElements, getSimulationConfig } from '../simulation.js';
import { eventSystem, EventTypes } from './eventSystem.js';

class SpatialAudioSystem {
    constructor() {
        this.audioContext = null;
        this.listenerNode = null;
        this.spatialSources = new Map(); // Track spatial audio sources
        this.environmentalSources = new Map(); // Environmental audio sources
        this.reverbNodes = new Map(); // Reverb nodes for different environments
        this.isInitialized = false;
        this.updateInterval = null;
        this.lastCameraState = null;
        
        // Spatial audio configuration
        this.config = {
            enabled: true,
            maxDistance: 1000,        // Maximum audible distance
            minDistance: 10,          // Minimum distance for full volume
            rolloffFactor: 1,         // How quickly sound fades with distance
            updateFrequency: 100,     // Update frequency in ms
            dopplerFactor: 1,         // Doppler effect strength
            speedOfSound: 343,        // Speed of sound in m/s
            enableReverb: true,       // Enable environmental reverb
            enableOcclusion: true,    // Enable sound occlusion by terrain
            enableDoppler: false,     // Enable doppler effects (can be disorienting)
            panningModel: 'HRTF',     // Panning model: 'HRTF' or 'equalpower'
            distanceModel: 'inverse'  // Distance model: 'linear', 'inverse', 'exponential'
        };
        
        // Environmental reverb presets
        this.reverbPresets = {
            forest: {
                roomSize: 0.7,
                decay: 2.5,
                wetness: 0.3,
                dryness: 0.7
            },
            ocean: {
                roomSize: 0.9,
                decay: 4.0,
                wetness: 0.5,
                dryness: 0.5
            },
            desert: {
                roomSize: 0.3,
                decay: 1.0,
                wetness: 0.1,
                dryness: 0.9
            },
            mountain: {
                roomSize: 0.8,
                decay: 3.5,
                wetness: 0.4,
                dryness: 0.6
            },
            cave: {
                roomSize: 0.9,
                decay: 5.0,
                wetness: 0.8,
                dryness: 0.2
            },
            arctic: {
                roomSize: 0.6,
                decay: 2.0,
                wetness: 0.2,
                dryness: 0.8
            }
        };
        
        // Element sound mapping for spatial audio
        this.elementSoundMap = {
            'Planta': {
                ambient: 'plantRustle',
                interaction: 'plantGrow',
                volume: 0.3,
                range: 50
            },
            'Árvore': {
                ambient: 'treeCreak',
                interaction: 'leafFall',
                volume: 0.4,
                range: 80
            },
            'Criatura': {
                ambient: 'creatureCall',
                interaction: 'creatureMove',
                volume: 0.6,
                range: 100
            },
            'Predador': {
                ambient: 'predatorRoar',
                interaction: 'predatorHunt',
                volume: 0.8,
                range: 150
            },
            'Água': {
                ambient: 'waterFlow',
                interaction: 'waterSplash',
                volume: 0.5,
                range: 120
            },
            'Tribo': {
                ambient: 'tribeChant',
                interaction: 'tribeDrum',
                volume: 0.7,
                range: 200
            }
        };
    }

    /**
     * Initialize the spatial audio system
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio listener (represents the camera/player position)
            this.listenerNode = this.audioContext.listener;
            
            // Set up listener properties
            if (this.listenerNode.positionX) {
                // Modern browsers with AudioParam interface
                this.listenerNode.positionX.value = 0;
                this.listenerNode.positionY.value = 0;
                this.listenerNode.positionZ.value = 0;
                this.listenerNode.forwardX.value = 0;
                this.listenerNode.forwardY.value = 0;
                this.listenerNode.forwardZ.value = -1;
                this.listenerNode.upX.value = 0;
                this.listenerNode.upY.value = 1;
                this.listenerNode.upZ.value = 0;
            } else {
                // Fallback for older browsers
                this.listenerNode.setPosition(0, 0, 0);
                this.listenerNode.setOrientation(0, 0, -1, 0, 1, 0);
            }
            
            // Initialize reverb nodes for different environments
            this.initializeReverbNodes();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start the update loop
            this.startUpdateLoop();
            
            this.isInitialized = true;
            console.log('Spatial Audio System initialized successfully');
            
        } catch (error) {
            console.warn('Failed to initialize Spatial Audio System:', error);
            this.config.enabled = false;
        }
    }

    /**
     * Initialize reverb nodes for environmental effects
     */
    initializeReverbNodes() {
        if (!this.config.enableReverb || !this.audioContext) return;
        
        Object.entries(this.reverbPresets).forEach(([environment, preset]) => {
            try {
                const convolver = this.audioContext.createConvolver();
                const impulseResponse = this.createImpulseResponse(preset);
                convolver.buffer = impulseResponse;
                
                // Create wet/dry mix
                const wetGain = this.audioContext.createGain();
                const dryGain = this.audioContext.createGain();
                const outputGain = this.audioContext.createGain();
                
                wetGain.gain.value = preset.wetness;
                dryGain.gain.value = preset.dryness;
                
                // Store the reverb chain
                this.reverbNodes.set(environment, {
                    convolver,
                    wetGain,
                    dryGain,
                    outputGain,
                    input: this.audioContext.createGain(),
                    output: outputGain
                });
                
                console.log(`Created reverb node for ${environment}`);
                
            } catch (error) {
                console.warn(`Failed to create reverb for ${environment}:`, error);
            }
        });
    }

    /**
     * Create impulse response for reverb
     */
    createImpulseResponse(preset) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * preset.decay;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, preset.roomSize * 3);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        return impulse;
    }

    /**
     * Set up event listeners for spatial audio events
     */
    setupEventListeners() {
        // Listen for element interactions
        eventSystem.subscribe(EventTypes.ELEMENT_CREATED, (data) => {
            this.onElementCreated(data);
        });
        
        eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
            this.onElementRemoved(data);
        });
        
        eventSystem.subscribe(EventTypes.ELEMENT_INTERACTION, (data) => {
            this.onElementInteraction(data);
        });
        
        // Listen for weather changes for environmental audio
        eventSystem.subscribe(EventTypes.WEATHER_CHANGED, (data) => {
            this.onWeatherChanged(data);
        });
        
        // Listen for camera movements
        eventSystem.subscribe(EventTypes.CAMERA_MOVED, (data) => {
            this.updateListenerPosition();
        });
    }

    /**
     * Start the spatial audio update loop
     */
    startUpdateLoop() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            if (this.config.enabled && this.isInitialized) {
                this.updateSpatialAudio();
            }
        }, this.config.updateFrequency);
    }

    /**
     * Stop the spatial audio update loop
     */
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update spatial audio based on current camera position and ecosystem state
     */
    updateSpatialAudio() {
        try {
            // Update listener position based on camera
            this.updateListenerPosition();
            
            // Update spatial sources based on ecosystem elements
            this.updateElementSpatialAudio();
            
            // Update environmental audio
            this.updateEnvironmentalAudio();
            
        } catch (error) {
            console.warn('Error updating spatial audio:', error);
        }
    }

    /**
     * Update listener position based on camera state
     */
    updateListenerPosition() {
        if (!this.listenerNode || !this.audioContext) return;
        
        try {
            const cameraState = getCameraState();
            if (!cameraState || !cameraState.position || !cameraState.target) return;
            
            const [x, y, z] = cameraState.position;
            const [targetX, targetY, targetZ] = cameraState.target;
            
            // Calculate forward vector (from camera to target)
            const forwardX = targetX - x;
            const forwardY = targetY - y;
            const forwardZ = targetZ - z;
            
            // Normalize forward vector
            const forwardLength = Math.sqrt(forwardX * forwardX + forwardY * forwardY + forwardZ * forwardZ);
            const normalizedForwardX = forwardX / forwardLength;
            const normalizedForwardY = forwardY / forwardLength;
            const normalizedForwardZ = forwardZ / forwardLength;
            
            // Set listener position and orientation
            if (this.listenerNode.positionX) {
                // Modern API
                this.listenerNode.positionX.value = x;
                this.listenerNode.positionY.value = y;
                this.listenerNode.positionZ.value = z;
                this.listenerNode.forwardX.value = normalizedForwardX;
                this.listenerNode.forwardY.value = normalizedForwardY;
                this.listenerNode.forwardZ.value = normalizedForwardZ;
                this.listenerNode.upX.value = 0;
                this.listenerNode.upY.value = 1;
                this.listenerNode.upZ.value = 0;
            } else {
                // Legacy API
                this.listenerNode.setPosition(x, y, z);
                this.listenerNode.setOrientation(normalizedForwardX, normalizedForwardY, normalizedForwardZ, 0, 1, 0);
            }
            
            this.lastCameraState = cameraState;
            
        } catch (error) {
            console.warn('Error updating listener position:', error);
        }
    }

    /**
     * Update spatial audio for ecosystem elements
     */
    updateElementSpatialAudio() {
        if (!this.audioContext) return;
        
        try {
            const elements = getEcosystemElements();
            const config = getSimulationConfig();
            
            if (!elements || !config) return;
            
            // Group elements by type for efficient processing
            const elementsByType = {};
            elements.forEach(element => {
                if (!elementsByType[element.type]) {
                    elementsByType[element.type] = [];
                }
                elementsByType[element.type].push(element);
            });
            
            // Process each element type
            Object.entries(elementsByType).forEach(([type, typeElements]) => {
                this.updateElementTypeSpatialAudio(type, typeElements, config);
            });
            
        } catch (error) {
            console.warn('Error updating element spatial audio:', error);
        }
    }

    /**
     * Update spatial audio for a specific element type
     */
    updateElementTypeSpatialAudio(elementType, elements, config) {
        const soundConfig = this.elementSoundMap[elementType];
        if (!soundConfig) return;
        
        const cameraState = getCameraState();
        if (!cameraState) return;
        
        const [cameraX, cameraY, cameraZ] = cameraState.position;
        
        // Find elements within audible range
        const audibleElements = elements.filter(element => {
            const pos3D = get3DPositionOnPlanet(element.x, element.y, config, element.type);
            const distance = Math.sqrt(
                Math.pow(pos3D.x - cameraX, 2) +
                Math.pow(pos3D.y - cameraY, 2) +
                Math.pow(pos3D.z - cameraZ, 2)
            );
            return distance <= soundConfig.range;
        });
        
        // Play ambient sounds for nearby elements (limit to prevent audio overload)
        const maxAmbientSounds = 5;
        const selectedElements = audibleElements
            .sort((a, b) => {
                const posA = get3DPositionOnPlanet(a.x, a.y, config, a.type);
                const posB = get3DPositionOnPlanet(b.x, b.y, config, b.type);
                const distA = Math.sqrt(Math.pow(posA.x - cameraX, 2) + Math.pow(posA.y - cameraY, 2) + Math.pow(posA.z - cameraZ, 2));
                const distB = Math.sqrt(Math.pow(posB.x - cameraX, 2) + Math.pow(posB.y - cameraY, 2) + Math.pow(posB.z - cameraZ, 2));
                return distA - distB;
            })
            .slice(0, maxAmbientSounds);
        
        // Play spatial ambient sounds for selected elements
        selectedElements.forEach((element, index) => {
            // Stagger ambient sound playback to avoid all playing at once
            setTimeout(() => {
                this.playElementSpatialSound(element, soundConfig, config, 'ambient');
            }, index * 200);
        });
    }

    /**
     * Play spatial sound for a specific element
     */
    playElementSpatialSound(element, soundConfig, simConfig, soundType = 'ambient') {
        if (!this.audioContext || !this.config.enabled) return;
        
        try {
            const pos3D = get3DPositionOnPlanet(element.x, element.y, simConfig, element.type);
            const soundName = soundConfig[soundType];
            
            if (!soundName) return;
            
            // Calculate distance-based volume
            const cameraState = getCameraState();
            if (!cameraState) return;
            
            const [cameraX, cameraY, cameraZ] = cameraState.position;
            const distance = Math.sqrt(
                Math.pow(pos3D.x - cameraX, 2) +
                Math.pow(pos3D.y - cameraY, 2) +
                Math.pow(pos3D.z - cameraZ, 2)
            );
            
            // Calculate volume based on distance
            const normalizedDistance = Math.min(distance / soundConfig.range, 1);
            const volume = soundConfig.volume * (1 - normalizedDistance);
            
            if (volume <= 0.01) return; // Too quiet to be audible
            
            // Play the sound with spatial positioning
            this.playSpatialSound(soundName, pos3D, {
                volume: volume,
                category: 'elements',
                elementType: element.type,
                maxDistance: soundConfig.range,
                rolloffFactor: this.config.rolloffFactor
            });
            
        } catch (error) {
            console.warn('Error playing element spatial sound:', error);
        }
    }

    /**
     * Play a spatial sound at a specific 3D position
     */
    playSpatialSound(soundName, position, options = {}) {
        if (!this.audioContext || !this.config.enabled) return null;
        
        try {
            // Create audio element
            const audio = new Audio();
            const soundPath = this.getSoundPath(soundName, options.category || 'elements');
            audio.src = soundPath;
            audio.volume = options.volume || 0.5;
            
            // Create Web Audio nodes
            const source = this.audioContext.createMediaElementSource(audio);
            const panner = this.audioContext.createPanner();
            const gainNode = this.audioContext.createGain();
            
            // Configure panner
            panner.panningModel = this.config.panningModel;
            panner.distanceModel = this.config.distanceModel;
            panner.refDistance = this.config.minDistance;
            panner.maxDistance = options.maxDistance || this.config.maxDistance;
            panner.rolloffFactor = options.rolloffFactor || this.config.rolloffFactor;
            panner.coneInnerAngle = 360;
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;
            
            // Set position
            if (panner.positionX) {
                panner.positionX.value = position.x;
                panner.positionY.value = position.y;
                panner.positionZ.value = position.z;
            } else {
                panner.setPosition(position.x, position.y, position.z);
            }
            
            // Configure gain
            gainNode.gain.value = options.volume || 0.5;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(panner);
            
            // Apply environmental reverb if enabled
            if (this.config.enableReverb) {
                const environment = this.detectEnvironment(position);
                const reverbNode = this.reverbNodes.get(environment);
                if (reverbNode) {
                    panner.connect(reverbNode.input);
                    reverbNode.output.connect(this.audioContext.destination);
                } else {
                    panner.connect(this.audioContext.destination);
                }
            } else {
                panner.connect(this.audioContext.destination);
            }
            
            // Play the audio
            audio.play().catch(e => console.warn('Error playing spatial audio:', e));
            
            // Store reference for cleanup
            const sourceId = `${soundName}_${Date.now()}_${Math.random()}`;
            this.spatialSources.set(sourceId, {
                audio,
                source,
                panner,
                gainNode,
                position: { ...position },
                options: { ...options }
            });
            
            // Clean up when audio ends
            audio.addEventListener('ended', () => {
                this.cleanupSpatialSource(sourceId);
            });
            
            return sourceId;
            
        } catch (error) {
            console.warn('Error creating spatial sound:', error);
            return null;
        }
    }

    /**
     * Get sound file path based on sound name and category
     */
    getSoundPath(soundName, category) {
        // This is a simplified mapping - in a real implementation,
        // you'd have a more sophisticated sound library system
        const basePath = './audio/';
        const categoryPaths = {
            elements: 'elements/',
            environment: 'environment/',
            interactions: 'interactions/',
            events: 'events/',
            ui: 'ui/'
        };
        
        const categoryPath = categoryPaths[category] || 'elements/';
        return `${basePath}${categoryPath}${soundName}.mp3`;
    }

    /**
     * Detect environment type based on position for reverb selection
     */
    detectEnvironment(position) {
        // Simple environment detection based on position
        // In a real implementation, this would analyze the surrounding elements
        const y = position.y;
        
        if (y < -50) return 'cave';
        if (y > 100) return 'mountain';
        if (Math.abs(position.x) < 50 && Math.abs(position.z) < 50) return 'forest';
        if (position.x > 200 || position.z > 200) return 'desert';
        return 'forest'; // Default
    }

    /**
     * Update environmental audio based on weather and biome
     */
    updateEnvironmentalAudio() {
        // This would be called periodically to update ambient environmental sounds
        // Implementation depends on weather system and biome detection
    }

    /**
     * Handle element creation events
     */
    onElementCreated(data) {
        if (!data.element || !this.config.enabled) return;
        
        const soundConfig = this.elementSoundMap[data.element.type];
        if (!soundConfig) return;
        
        // Play creation sound with spatial positioning
        const config = getSimulationConfig();
        if (config) {
            this.playElementSpatialSound(data.element, soundConfig, config, 'interaction');
        }
    }

    /**
     * Handle element removal events
     */
    onElementRemoved(data) {
        // Clean up any spatial sources associated with this element
        // Implementation would track element-specific sources
    }

    /**
     * Handle element interaction events
     */
    onElementInteraction(data) {
        if (!data.element || !this.config.enabled) return;
        
        const soundConfig = this.elementSoundMap[data.element.type];
        if (!soundConfig) return;
        
        const config = getSimulationConfig();
        if (config) {
            this.playElementSpatialSound(data.element, soundConfig, config, 'interaction');
        }
    }

    /**
     * Handle weather change events
     */
    onWeatherChanged(data) {
        // Update environmental reverb and ambient sounds based on weather
        // Implementation would adjust reverb parameters and play weather sounds
    }

    /**
     * Clean up a spatial audio source
     */
    cleanupSpatialSource(sourceId) {
        const source = this.spatialSources.get(sourceId);
        if (source) {
            try {
                source.audio.pause();
                source.source.disconnect();
                source.panner.disconnect();
                source.gainNode.disconnect();
            } catch (error) {
                console.warn('Error cleaning up spatial source:', error);
            }
            this.spatialSources.delete(sourceId);
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        
        if (!newConfig.enabled && this.isInitialized) {
            this.cleanup();
        } else if (newConfig.enabled && !this.isInitialized) {
            this.initialize();
        }
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Clean up spatial audio system
     */
    cleanup() {
        this.stopUpdateLoop();
        
        // Clean up all spatial sources
        this.spatialSources.forEach((source, id) => {
            this.cleanupSpatialSource(id);
        });
        
        // Clean up environmental sources
        this.environmentalSources.clear();
        
        // Clean up reverb nodes
        this.reverbNodes.forEach(reverbNode => {
            try {
                reverbNode.convolver.disconnect();
                reverbNode.wetGain.disconnect();
                reverbNode.dryGain.disconnect();
                reverbNode.outputGain.disconnect();
                reverbNode.input.disconnect();
            } catch (error) {
                console.warn('Error cleaning up reverb node:', error);
            }
        });
        this.reverbNodes.clear();
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(e => console.warn('Error closing spatial audio context:', e));
        }
        
        this.isInitialized = false;
        console.log('Spatial Audio System cleaned up');
    }

    /**
     * Get system status for debugging
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.config.enabled,
            activeSources: this.spatialSources.size,
            environmentalSources: this.environmentalSources.size,
            reverbNodes: this.reverbNodes.size,
            audioContextState: this.audioContext ? this.audioContext.state : 'none'
        };
    }
}

// Create and export singleton instance
export const spatialAudioSystem = new SpatialAudioSystem();

// Auto-initialize when module is loaded
spatialAudioSystem.initialize().catch(error => {
    console.warn('Failed to auto-initialize spatial audio system:', error);
});

export default spatialAudioSystem;
          