let backgroundMusic = null;
let sfx = {};

export function loadAudio() {
    // Load background music
    backgroundMusic = new Audio('./audio/background_music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    // Load sound effects
    sfx.elementPlace = new Audio('./audio/element_place.mp3');
    sfx.bless = new Audio('./audio/bless.mp3');
    sfx.curse = new Audio('./audio/curse.mp3');
    sfx.weatherChange = new Audio('./audio/weather_change.mp3');
    sfx.tribeEvolution = new Audio('./audio/tribe_evolution.mp3');
}

export function playBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.play().catch(e => console.error("Error playing background music:", e));
    }
}

export function pauseBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
}

export function playSFX(name) {
    if (sfx[name]) {
        sfx[name].currentTime = 0; // Rewind to start if already playing
        sfx[name].play().catch(e => console.error(`Error playing SFX ${name}:`, e));
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
