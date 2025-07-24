let backgroundMusic = null;
let sfx = {};

export function loadAudio() {
    try {
        // Load background music
        backgroundMusic = new Audio('./audio/background_music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        
        // Handle loading errors gracefully
        backgroundMusic.addEventListener('error', () => {
            console.warn('Background music file not found, audio disabled');
            backgroundMusic = null;
        });
        
        // Load sound effects with error handling
        const soundFiles = {
            elementPlace: './audio/element_place.mp3',
            bless: './audio/bless.mp3',
            curse: './audio/curse.mp3',
            weatherChange: './audio/weather_change.mp3',
            tribeEvolution: './audio/tribe_evolution.mp3'
        };
        
        Object.entries(soundFiles).forEach(([name, path]) => {
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
        console.warn('Audio system initialization failed:', error);
    }
}

export function playBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.readyState >= 2) {
        backgroundMusic.play().catch(e => console.warn("Error playing background music:", e));
    }
}

export function pauseBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
}

export function playSFX(name) {
    if (sfx[name] && sfx[name] !== null && sfx[name].readyState >= 2) {
        try {
            sfx[name].currentTime = 0; // Rewind to start if already playing
            sfx[name].play().catch(e => console.warn(`Error playing SFX ${name}:`, e));
        } catch (error) {
            console.warn(`Failed to play SFX ${name}:`, error);
        }
    }
}

export function setBackgroundMusicVolume(volume) {
    if (backgroundMusic) {
        backgroundMusic.volume = volume;
    }
}

export function setSFXVolume(volume) {
    for (const key in sfx) {
        if (sfx.hasOwnProperty(key)) {
            sfx[key].volume = volume;
        }
    }
}
