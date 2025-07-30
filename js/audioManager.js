// Enhanced Audio System with comprehensive sound library
let backgroundMusic = null;
let sfx = {};
let ambientSounds = {};
let musicTracks = {};
let audioContext = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let ambientGain = null;

// Audio configuration
const audioConfig = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    ambientVolume: 0.3,
    fadeTime: 2000, // 2 seconds for fades
    spatialAudioEnabled: true
};

// Comprehensive sound library definition
const soundLibrary = {
    // Element-specific sounds
    elements: {
        // Plant sounds
        plantGrow: './audio/elements/plant_grow.mp3',
        plantWither: './audio/elements/plant_wither.mp3',
        plantRustle: './audio/elements/plant_rustle.mp3',
        treeCreak: './audio/elements/tree_creak.mp3',
        leafFall: './audio/elements/leaf_fall.mp3',
        
        // Creature sounds
        creatureMove: './audio/elements/creature_move.mp3',
        creatureFeed: './audio/elements/creature_feed.mp3',
        creatureBirth: './audio/elements/creature_birth.mp3',
        creatureDeath: './audio/elements/creature_death.mp3',
        creatureCall: './audio/elements/creature_call.mp3',
        predatorHunt: './audio/elements/predator_hunt.mp3',
        predatorRoar: './audio/elements/predator_roar.mp3',
        
        // Water sounds
        waterDrop: './audio/elements/water_drop.mp3',
        waterFlow: './audio/elements/water_flow.mp3',
        waterSplash: './audio/elements/water_splash.mp3',
        waterEvaporate: './audio/elements/water_evaporate.mp3',
        
        // Rock and mineral sounds
        rockCrumble: './audio/elements/rock_crumble.mp3',
        rockHit: './audio/elements/rock_hit.mp3',
        mineralChime: './audio/elements/mineral_chime.mp3',
        
        // Tribal sounds
        tribeChant: './audio/elements/tribe_chant.mp3',
        tribeDrum: './audio/elements/tribe_drum.mp3',
        tribeHorn: './audio/elements/tribe_horn.mp3',
        tribeCelebration: './audio/elements/tribe_celebration.mp3'
    },
    
    // Environmental and weather sounds
    environment: {
        windLight: './audio/environment/wind_light.mp3',
        windStrong: './audio/environment/wind_strong.mp3',
        rainLight: './audio/environment/rain_light.mp3',
        rainHeavy: './audio/environment/rain_heavy.mp3',
        thunder: './audio/environment/thunder.mp3',
        lightning: './audio/environment/lightning.mp3',
        snowfall: './audio/environment/snowfall.mp3',
        earthquake: './audio/environment/earthquake.mp3',
        volcano: './audio/environment/volcano.mp3'
    },
    
    // Interaction sounds
    interactions: {
        elementPlace: './audio/interactions/element_place.mp3',
        elementRemove: './audio/interactions/element_remove.mp3',
        elementSelect: './audio/interactions/element_select.mp3',
        bless: './audio/interactions/bless.mp3',
        curse: './audio/interactions/curse.mp3',
        intervention: './audio/interactions/intervention.mp3',
        achievement: './audio/interactions/achievement.mp3',
        notification: './audio/interactions/notification.mp3',
        error: './audio/interactions/error.mp3',
        success: './audio/interactions/success.mp3'
    },
    
    // Event sounds
    events: {
        meteorImpact: './audio/events/meteor_impact.mp3',
        speciesExtinction: './audio/events/species_extinction.mp3',
        newSpecies: './audio/events/new_species.mp3',
        ecosystemCollapse: './audio/events/ecosystem_collapse.mp3',
        ecosystemThriving: './audio/events/ecosystem_thriving.mp3',
        seasonChange: './audio/events/season_change.mp3',
        dayNightCycle: './audio/events/day_night_cycle.mp3',
        discovery: './audio/events/discovery.mp3',
        evolution: './audio/events/evolution.mp3'
    },
    
    // UI sounds
    ui: {
        buttonClick: './audio/ui/button_click.mp3',
        buttonHover: './audio/ui/button_hover.mp3',
        panelOpen: './audio/ui/panel_open.mp3',
        panelClose: './audio/ui/panel_close.mp3',
        tabSwitch: './audio/ui/tab_switch.mp3',
        modalOpen: './audio/ui/modal_open.mp3',
        modalClose: './audio/ui/modal_close.mp3',
        typing: './audio/ui/typing.mp3'
    }
};

// Ambient sound definitions for different biomes
const ambientSoundLibrary = {
    forest: './audio/ambient/forest_ambient.mp3',
    ocean: './audio/ambient/ocean_ambient.mp3',
    desert: './audio/ambient/desert_ambient.mp3',
    mountain: './audio/ambient/mountain_ambient.mp3',
    arctic: './audio/ambient/arctic_ambient.mp3',
    volcanic: './audio/ambient/volcanic_ambient.mp3',
    cave: './audio/ambient/cave_ambient.mp3',
    swamp: './audio/ambient/swamp_ambient.mp3'
};

// Music track definitions
const musicLibrary = {
    peaceful: './audio/music/peaceful_theme.mp3',
    mysterious: './audio/music/mysterious_theme.mp3',
    dramatic: './audio/music/dramatic_theme.mp3',
    triumphant: './audio/music/triumphant_theme.mp3',
    melancholic: './audio/music/melancholic_theme.mp3',
    epic: './audio/music/epic_theme.mp3',
    ambient: './audio/music/ambient_theme.mp3',
    tension: './audio/music/tension_theme.mp3'
};

export function loadAudio() {
    try {
        // Initialize Web Audio API for advanced features
        initializeWebAudioAPI();
        
        // Load all sound categories
        loadSoundCategory('elements', soundLibrary.elements);
        loadSoundCategory('environment', soundLibrary.environment);
        loadSoundCategory('interactions', soundLibrary.interactions);
        loadSoundCategory('events', soundLibrary.events);
        loadSoundCategory('ui', soundLibrary.ui);
        
        // Load ambient sounds
        loadAmbientSounds();
        
        // Load music tracks
        loadMusicTracks();
        
        console.log('Enhanced audio system initialized successfully');
        
    } catch (error) {
        console.warn('Enhanced audio system initialization failed:', error);
        // Fallback to basic audio system
        loadBasicAudio();
    }
}

function initializeWebAudioAPI() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain nodes for different audio categories
        masterGain = audioContext.createGain();
        musicGain = audioContext.createGain();
        sfxGain = audioContext.createGain();
        ambientGain = audioContext.createGain();
        
        // Connect gain nodes
        musicGain.connect(masterGain);
        sfxGain.connect(masterGain);
        ambientGain.connect(masterGain);
        masterGain.connect(audioContext.destination);
        
        // Set initial volumes
        masterGain.gain.value = audioConfig.masterVolume;
        musicGain.gain.value = audioConfig.musicVolume;
        sfxGain.gain.value = audioConfig.sfxVolume;
        ambientGain.gain.value = audioConfig.ambientVolume;
        
    } catch (error) {
        console.warn('Web Audio API not available, using fallback');
        audioContext = null;
    }
}

function loadSoundCategory(category, sounds) {
    if (!sfx[category]) sfx[category] = {};
    
    Object.entries(sounds).forEach(([name, path]) => {
        try {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = audioConfig.sfxVolume;
            
            audio.addEventListener('error', () => {
                console.warn(`Sound effect ${category}/${name} not found, creating fallback`);
                sfx[category][name] = createFallbackSound(category, name);
            });
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`Loaded sound: ${category}/${name}`);
            });
            
            sfx[category][name] = audio;
            
        } catch (error) {
            console.warn(`Failed to load sound effect ${category}/${name}:`, error);
            sfx[category][name] = createFallbackSound(category, name);
        }
    });
}

function loadAmbientSounds() {
    Object.entries(ambientSoundLibrary).forEach(([biome, path]) => {
        try {
            const audio = new Audio(path);
            audio.loop = true;
            audio.volume = audioConfig.ambientVolume;
            audio.preload = 'auto';
            
            audio.addEventListener('error', () => {
                console.warn(`Ambient sound ${biome} not found, creating fallback`);
                ambientSounds[biome] = createFallbackAmbient(biome);
            });
            
            ambientSounds[biome] = audio;
            
        } catch (error) {
            console.warn(`Failed to load ambient sound ${biome}:`, error);
            ambientSounds[biome] = createFallbackAmbient(biome);
        }
    });
}

function loadMusicTracks() {
    Object.entries(musicLibrary).forEach(([mood, path]) => {
        try {
            const audio = new Audio(path);
            audio.loop = true;
            audio.volume = audioConfig.musicVolume;
            audio.preload = 'auto';
            
            audio.addEventListener('error', () => {
                console.warn(`Music track ${mood} not found, creating fallback`);
                musicTracks[mood] = createFallbackMusic(mood);
            });
            
            musicTracks[mood] = audio;
            
        } catch (error) {
            console.warn(`Failed to load music track ${mood}:`, error);
            musicTracks[mood] = createFallbackMusic(mood);
        }
    });
}

function loadBasicAudio() {
    // Fallback to original simple audio system
    try {
        backgroundMusic = new Audio('./audio/background_music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        
        backgroundMusic.addEventListener('error', () => {
            console.warn('Background music file not found, audio disabled');
            backgroundMusic = null;
        });
        
        const basicSounds = {
            elementPlace: './audio/element_place.mp3',
            bless: './audio/bless.mp3',
            curse: './audio/curse.mp3',
            weatherChange: './audio/weather_change.mp3',
            tribeEvolution: './audio/tribe_evolution.mp3'
        };
        
        Object.entries(basicSounds).forEach(([name, path]) => {
            try {
                sfx[name] = new Audio(path);
                sfx[name].addEventListener('error', () => {
                    console.warn(`Sound effect ${name} not found, skipping`);
                    sfx[name] = null;
                });
            } catch (error) {
                console.warn(`Failed to load sound effect ${name}:`, error);
                sfx[name] = null;
            }
        });
    } catch (error) {
        console.warn('Basic audio system initialization failed:', error);
    }
}

// Fallback sound creation functions
function createFallbackSound(category, name) {
    return {
        play: () => console.log(`Playing fallback sound: ${category}/${name}`),
        pause: () => {},
        currentTime: 0,
        volume: audioConfig.sfxVolume,
        readyState: 4
    };
}

function createFallbackAmbient(biome) {
    return {
        play: () => console.log(`Playing fallback ambient: ${biome}`),
        pause: () => {},
        currentTime: 0,
        volume: audioConfig.ambientVolume,
        loop: true,
        readyState: 4
    };
}

function createFallbackMusic(mood) {
    return {
        play: () => console.log(`Playing fallback music: ${mood}`),
        pause: () => {},
        currentTime: 0,
        volume: audioConfig.musicVolume,
        loop: true,
        readyState: 4
    };
}

// Enhanced playback functions

/**
 * Play a sound effect from the enhanced library
 * @param {string} category - Sound category (elements, environment, interactions, events, ui)
 * @param {string} name - Sound name within the category
 * @param {Object} options - Playback options (volume, pitch, spatial position)
 */
export function playEnhancedSFX(category, name, options = {}) {
    try {
        const sound = sfx[category] && sfx[category][name];
        if (!sound) {
            console.warn(`Sound not found: ${category}/${name}`);
            return;
        }
        
        if (sound.readyState >= 2) {
            // Clone audio for overlapping sounds
            const audioClone = sound.cloneNode();
            
            // Apply options
            if (options.volume !== undefined) {
                audioClone.volume = Math.max(0, Math.min(1, options.volume));
            }
            
            if (options.pitch && audioContext) {
                // Use Web Audio API for pitch shifting
                playWithPitch(audioClone, options.pitch, options);
            } else {
                // Standard playback
                audioClone.currentTime = 0;
                audioClone.play().catch(e => console.warn(`Error playing SFX ${category}/${name}:`, e));
            }
            
            // Apply spatial audio if enabled and position provided
            if (audioConfig.spatialAudioEnabled && options.position && audioContext) {
                applySpatialAudio(audioClone, options.position);
            }
        }
    } catch (error) {
        console.warn(`Failed to play enhanced SFX ${category}/${name}:`, error);
    }
}

/**
 * Play element-specific sounds
 */
export function playElementSound(elementType, action, options = {}) {
    const soundMap = {
        'Planta': {
            create: 'plantGrow',
            remove: 'plantWither',
            interact: 'plantRustle'
        },
        'Árvore': {
            create: 'plantGrow',
            remove: 'treeCreak',
            interact: 'leafFall'
        },
        'Criatura': {
            create: 'creatureBirth',
            remove: 'creatureDeath',
            interact: 'creatureCall',
            move: 'creatureMove',
            feed: 'creatureFeed'
        },
        'Predador': {
            create: 'creatureBirth',
            remove: 'creatureDeath',
            interact: 'predatorRoar',
            hunt: 'predatorHunt'
        },
        'Água': {
            create: 'waterDrop',
            remove: 'waterEvaporate',
            interact: 'waterSplash',
            flow: 'waterFlow'
        },
        'Rocha': {
            create: 'rockHit',
            remove: 'rockCrumble',
            interact: 'mineralChime'
        },
        'Tribo': {
            create: 'tribeCelebration',
            remove: 'tribeChant',
            interact: 'tribeDrum',
            evolve: 'tribeHorn'
        }
    };
    
    const elementSounds = soundMap[elementType];
    if (elementSounds && elementSounds[action]) {
        playEnhancedSFX('elements', elementSounds[action], options);
    }
}

/**
 * Play environment/weather sounds
 */
export function playEnvironmentSound(weatherType, intensity = 'normal', options = {}) {
    const weatherSounds = {
        rain: intensity === 'heavy' ? 'rainHeavy' : 'rainLight',
        wind: intensity === 'strong' ? 'windStrong' : 'windLight',
        storm: 'thunder',
        lightning: 'lightning',
        snow: 'snowfall',
        earthquake: 'earthquake',
        volcano: 'volcano'
    };
    
    const soundName = weatherSounds[weatherType];
    if (soundName) {
        playEnhancedSFX('environment', soundName, options);
    }
}

/**
 * Play interaction sounds
 */
export function playInteractionSound(interactionType, options = {}) {
    playEnhancedSFX('interactions', interactionType, options);
}

/**
 * Play event sounds
 */
export function playEventSound(eventType, options = {}) {
    playEnhancedSFX('events', eventType, options);
}

/**
 * Play UI sounds
 */
export function playUISound(uiAction, options = {}) {
    playEnhancedSFX('ui', uiAction, options);
}

/**
 * Play ambient sound for biome
 */
export function playAmbientSound(biome, fadeIn = true) {
    try {
        // Stop current ambient sound
        stopAmbientSound();
        
        const ambientSound = ambientSounds[biome];
        if (ambientSound && ambientSound.readyState >= 2) {
            if (fadeIn) {
                fadeInAudio(ambientSound, audioConfig.ambientVolume, audioConfig.fadeTime);
            } else {
                ambientSound.volume = audioConfig.ambientVolume;
                ambientSound.play().catch(e => console.warn(`Error playing ambient sound ${biome}:`, e));
            }
        }
    } catch (error) {
        console.warn(`Failed to play ambient sound ${biome}:`, error);
    }
}

/**
 * Stop current ambient sound
 */
export function stopAmbientSound(fadeOut = true) {
    Object.values(ambientSounds).forEach(sound => {
        if (sound && !sound.paused) {
            if (fadeOut) {
                fadeOutAudio(sound, audioConfig.fadeTime);
            } else {
                sound.pause();
                sound.currentTime = 0;
            }
        }
    });
}

/**
 * Play music track based on mood
 */
export function playMusicTrack(mood, fadeIn = true) {
    try {
        // Stop current music
        stopCurrentMusic();
        
        const track = musicTracks[mood];
        if (track && track.readyState >= 2) {
            if (fadeIn) {
                fadeInAudio(track, audioConfig.musicVolume, audioConfig.fadeTime);
            } else {
                track.volume = audioConfig.musicVolume;
                track.play().catch(e => console.warn(`Error playing music track ${mood}:`, e));
            }
        }
    } catch (error) {
        console.warn(`Failed to play music track ${mood}:`, error);
    }
}

/**
 * Stop current music
 */
export function stopCurrentMusic(fadeOut = true) {
    Object.values(musicTracks).forEach(track => {
        if (track && !track.paused) {
            if (fadeOut) {
                fadeOutAudio(track, audioConfig.fadeTime);
            } else {
                track.pause();
                track.currentTime = 0;
            }
        }
    });
    
    // Also handle legacy background music
    if (backgroundMusic && !backgroundMusic.paused) {
        if (fadeOut) {
            fadeOutAudio(backgroundMusic, audioConfig.fadeTime);
        } else {
            backgroundMusic.pause();
        }
    }
}

// Legacy functions for backward compatibility
export function playBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.readyState >= 2) {
        backgroundMusic.play().catch(e => console.warn("Error playing background music:", e));
    } else {
        // Use enhanced music system
        playMusicTrack('peaceful');
    }
}

export function pauseBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
    stopCurrentMusic();
}

export function playSFX(name, options = {}) {
    // Try enhanced system first
    if (sfx.interactions && sfx.interactions[name]) {
        playEnhancedSFX('interactions', name, options);
        return;
    }
    
    // Fallback to legacy system
    if (sfx[name] && sfx[name] !== null && sfx[name].readyState >= 2) {
        try {
            sfx[name].currentTime = 0;
            sfx[name].play().catch(e => console.warn(`Error playing SFX ${name}:`, e));
        } catch (error) {
            console.warn(`Failed to play SFX ${name}:`, error);
        }
    }
}

// Volume control functions
export function setMasterVolume(volume) {
    audioConfig.masterVolume = Math.max(0, Math.min(1, volume));
    if (masterGain) {
        masterGain.gain.value = audioConfig.masterVolume;
    }
}

export function setMusicVolume(volume) {
    audioConfig.musicVolume = Math.max(0, Math.min(1, volume));
    if (musicGain) {
        musicGain.gain.value = audioConfig.musicVolume;
    }
    
    // Update current music tracks
    Object.values(musicTracks).forEach(track => {
        if (track) track.volume = audioConfig.musicVolume;
    });
    
    if (backgroundMusic) {
        backgroundMusic.volume = audioConfig.musicVolume;
    }
}

export function setSFXVolume(volume) {
    audioConfig.sfxVolume = Math.max(0, Math.min(1, volume));
    if (sfxGain) {
        sfxGain.gain.value = audioConfig.sfxVolume;
    }
    
    // Update all SFX volumes
    Object.values(sfx).forEach(category => {
        if (typeof category === 'object') {
            Object.values(category).forEach(sound => {
                if (sound && sound.volume !== undefined) {
                    sound.volume = audioConfig.sfxVolume;
                }
            });
        } else if (category && category.volume !== undefined) {
            category.volume = audioConfig.sfxVolume;
        }
    });
}

export function setAmbientVolume(volume) {
    audioConfig.ambientVolume = Math.max(0, Math.min(1, volume));
    if (ambientGain) {
        ambientGain.gain.value = audioConfig.ambientVolume;
    }
    
    // Update ambient sounds
    Object.values(ambientSounds).forEach(sound => {
        if (sound) sound.volume = audioConfig.ambientVolume;
    });
}

// Legacy compatibility
export function setBackgroundMusicVolume(volume) {
    setMusicVolume(volume);
}

// Advanced audio utility functions

/**
 * Fade in audio over specified duration
 */
function fadeInAudio(audio, targetVolume, duration) {
    if (!audio) return;
    
    audio.volume = 0;
    audio.play().catch(e => console.warn("Error starting fade in:", e));
    
    const steps = 50;
    const stepTime = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.min(volumeStep * currentStep, targetVolume);
        
        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            audio.volume = targetVolume;
        }
    }, stepTime);
}

/**
 * Fade out audio over specified duration
 */
function fadeOutAudio(audio, duration) {
    if (!audio || audio.paused) return;
    
    const initialVolume = audio.volume;
    const steps = 50;
    const stepTime = duration / steps;
    const volumeStep = initialVolume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);
        
        if (currentStep >= steps || audio.volume <= 0) {
            clearInterval(fadeInterval);
            audio.pause();
            audio.currentTime = 0;
            audio.volume = initialVolume; // Reset for next use
        }
    }, stepTime);
}

/**
 * Play audio with pitch modification using Web Audio API
 */
function playWithPitch(audio, pitchRatio, options = {}) {
    if (!audioContext) {
        // Fallback to normal playback
        audio.play().catch(e => console.warn("Error playing audio:", e));
        return;
    }
    
    try {
        const source = audioContext.createMediaElementSource(audio);
        const gainNode = audioContext.createGain();
        
        // Apply pitch shifting (simplified - real pitch shifting is complex)
        audio.playbackRate = pitchRatio;
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (options.volume !== undefined) {
            gainNode.gain.value = options.volume;
        }
        
        audio.play().catch(e => console.warn("Error playing pitched audio:", e));
        
    } catch (error) {
        console.warn("Error applying pitch effect:", error);
        audio.play().catch(e => console.warn("Error playing fallback audio:", e));
    }
}

/**
 * Apply spatial audio positioning with enhanced 3D audio features
 */
function applySpatialAudio(audio, position, options = {}) {
    if (!audioContext) return null;
    
    try {
        const source = audioContext.createMediaElementSource(audio);
        const panner = audioContext.createPanner();
        const gainNode = audioContext.createGain();
        
        // Enhanced panner configuration
        panner.panningModel = options.panningModel || 'HRTF';
        panner.distanceModel = options.distanceModel || 'inverse';
        panner.refDistance = options.refDistance || 10;
        panner.maxDistance = options.maxDistance || 1000;
        panner.rolloffFactor = options.rolloffFactor || 1;
        panner.coneInnerAngle = options.coneInnerAngle || 360;
        panner.coneOuterAngle = options.coneOuterAngle || 0;
        panner.coneOuterGain = options.coneOuterGain || 0;
        
        // Set position with fallback for older browsers
        if (panner.positionX) {
            panner.positionX.value = position.x || 0;
            panner.positionY.value = position.y || 0;
            panner.positionZ.value = position.z || 0;
        } else {
            panner.setPosition(position.x || 0, position.y || 0, position.z || 0);
        }
        
        // Set orientation if provided
        if (options.orientation) {
            if (panner.orientationX) {
                panner.orientationX.value = options.orientation.x || 0;
                panner.orientationY.value = options.orientation.y || 0;
                panner.orientationZ.value = options.orientation.z || -1;
            } else {
                panner.setOrientation(
                    options.orientation.x || 0,
                    options.orientation.y || 0,
                    options.orientation.z || -1
                );
            }
        }
        
        // Configure gain
        gainNode.gain.value = options.volume || 1.0;
        
        // Connect the audio graph
        source.connect(gainNode);
        gainNode.connect(panner);
        
        // Apply environmental effects if provided
        if (options.reverb && options.reverbNode) {
            const dryGain = audioContext.createGain();
            const wetGain = audioContext.createGain();
            
            dryGain.gain.value = 1 - (options.reverbWetness || 0.3);
            wetGain.gain.value = options.reverbWetness || 0.3;
            
            // Dry signal
            panner.connect(dryGain);
            dryGain.connect(audioContext.destination);
            
            // Wet signal through reverb
            panner.connect(wetGain);
            wetGain.connect(options.reverbNode);
            options.reverbNode.connect(audioContext.destination);
        } else {
            panner.connect(audioContext.destination);
        }
        
        return {
            source,
            panner,
            gainNode,
            cleanup: () => {
                try {
                    source.disconnect();
                    panner.disconnect();
                    gainNode.disconnect();
                } catch (e) {
                    console.warn('Error cleaning up spatial audio nodes:', e);
                }
            }
        };
        
    } catch (error) {
        console.warn("Error applying spatial audio:", error);
        return null;
    }
}

/**
 * Create a reverb node for environmental audio effects
 */
function createReverbNode(preset = {}) {
    if (!audioContext) return null;
    
    try {
        const convolver = audioContext.createConvolver();
        const impulseResponse = createImpulseResponse(preset);
        convolver.buffer = impulseResponse;
        
        return convolver;
    } catch (error) {
        console.warn("Error creating reverb node:", error);
        return null;
    }
}

/**
 * Create impulse response for reverb effect
 */
function createImpulseResponse(preset = {}) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * (preset.decay || 2.0);
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    const roomSize = preset.roomSize || 0.5;
    const dampening = preset.dampening || 0.5;
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - i / length, roomSize * 3);
            const dampenedDecay = decay * (1 - dampening * (i / length));
            channelData[i] = (Math.random() * 2 - 1) * dampenedDecay;
        }
    }
    
    return impulse;
}

/**
 * Update audio listener position and orientation (for camera-based spatial audio)
 */
function updateAudioListener(position, orientation = null) {
    if (!audioContext || !audioContext.listener) return;
    
    try {
        const listener = audioContext.listener;
        
        // Set listener position
        if (listener.positionX) {
            listener.positionX.value = position.x || 0;
            listener.positionY.value = position.y || 0;
            listener.positionZ.value = position.z || 0;
        } else {
            listener.setPosition(position.x || 0, position.y || 0, position.z || 0);
        }
        
        // Set listener orientation if provided
        if (orientation) {
            if (listener.forwardX) {
                listener.forwardX.value = orientation.forward.x || 0;
                listener.forwardY.value = orientation.forward.y || 0;
                listener.forwardZ.value = orientation.forward.z || -1;
                listener.upX.value = orientation.up.x || 0;
                listener.upY.value = orientation.up.y || 1;
                listener.upZ.value = orientation.up.z || 0;
            } else {
                listener.setOrientation(
                    orientation.forward.x || 0,
                    orientation.forward.y || 0,
                    orientation.forward.z || -1,
                    orientation.up.x || 0,
                    orientation.up.y || 1,
                    orientation.up.z || 0
                );
            }
        }
    } catch (error) {
        console.warn("Error updating audio listener:", error);
    }
}

/**
 * Get current audio configuration
 */
export function getAudioConfig() {
    return { ...audioConfig };
}

/**
 * Update audio configuration
 */
export function updateAudioConfig(newConfig) {
    Object.assign(audioConfig, newConfig);
    
    // Apply volume changes
    if (newConfig.masterVolume !== undefined) setMasterVolume(newConfig.masterVolume);
    if (newConfig.musicVolume !== undefined) setMusicVolume(newConfig.musicVolume);
    if (newConfig.sfxVolume !== undefined) setSFXVolume(newConfig.sfxVolume);
    if (newConfig.ambientVolume !== undefined) setAmbientVolume(newConfig.ambientVolume);
}

/**
 * Get available sound categories and sounds
 */
export function getAvailableSounds() {
    const available = {};
    
    Object.keys(soundLibrary).forEach(category => {
        available[category] = Object.keys(soundLibrary[category]);
    });
    
    available.ambient = Object.keys(ambientSoundLibrary);
    available.music = Object.keys(musicLibrary);
    
    return available;
}

/**
 * Test audio system functionality
 */
export function testAudioSystem() {
    console.log('Testing enhanced audio system...');
    
    // Test SFX
    setTimeout(() => playEnhancedSFX('ui', 'buttonClick'), 500);
    setTimeout(() => playEnhancedSFX('elements', 'plantGrow'), 1000);
    setTimeout(() => playEnhancedSFX('environment', 'windLight'), 1500);
    
    // Test music
    setTimeout(() => playMusicTrack('peaceful'), 2000);
    
    console.log('Audio system test completed');
}

/**
 * Create audio visualization data (for potential future use)
 */
export function getAudioVisualizationData() {
    if (!audioContext) return null;
    
    try {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Connect to master gain for overall visualization
        masterGain.connect(analyser);
        
        return {
            analyser,
            bufferLength,
            dataArray,
            getFrequencyData: () => {
                analyser.getByteFrequencyData(dataArray);
                return dataArray;
            }
        };
    } catch (error) {
        console.warn("Error creating audio visualization:", error);
        return null;
    }
}

/**
 * Cleanup audio resources
 */
export function cleanupAudio() {
    // Stop all audio
    stopCurrentMusic(false);
    stopAmbientSound(false);
    
    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(e => console.warn("Error closing audio context:", e));
    }
    
    console.log('Audio system cleaned up');
}

// Export enhanced spatial audio functions
export { createReverbNode, updateAudioListener };
