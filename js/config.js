import { updateSliderValue, ecosystemSizes } from './utils.js';

let elements = {}; // This will be removed later, but keep for now to avoid immediate errors
const presets = {
    // Existing presets
    oasis: { planetType: 'desert', gravity: 0.8, atmosphere: 'thin', luminosity: 1.5, temperature: 35, waterPresence: 80, soilType: 'sandy', minerals: 'silicon', ecosystemSize: 'medium' },
    swamp: { planetType: 'aquatic', gravity: 1.1, atmosphere: 'dense', luminosity: 0.7, temperature: 10, waterPresence: 90, soilType: 'clay', minerals: 'carbon', ecosystemSize: 'medium' },
    forest: { planetType: 'terrestrial', gravity: 1.0, atmosphere: 'oxygenated', luminosity: 1.2, temperature: 20, waterPresence: 60, soilType: 'fertile', minerals: 'iron', ecosystemSize: 'large' },
    desert: { planetType: 'desert', gravity: 1.0, atmosphere: 'thin', luminosity: 1.8, temperature: 45, waterPresence: 10, soilType: 'sandy', minerals: 'none', ecosystemSize: 'small' },
    
    // NEW BIOME PRESETS - Expanded variety
    tundra: { planetType: 'tundra', gravity: 0.9, atmosphere: 'thin', luminosity: 0.6, temperature: -15, waterPresence: 40, soilType: 'frozen', minerals: 'iron', ecosystemSize: 'large' },
    marsh: { planetType: 'marsh', gravity: 1.2, atmosphere: 'humid', luminosity: 0.8, temperature: 25, waterPresence: 95, soilType: 'peat', minerals: 'carbon', ecosystemSize: 'medium' },
    crystal_caves: { planetType: 'crystalline', gravity: 0.7, atmosphere: 'crystalline', luminosity: 1.4, temperature: 15, waterPresence: 30, soilType: 'crystalline', minerals: 'rare_crystals', ecosystemSize: 'small' },
    lava_world: { planetType: 'volcanic', gravity: 1.3, atmosphere: 'sulfurous', luminosity: 2.0, temperature: 80, waterPresence: 5, soilType: 'volcanic', minerals: 'rare_metals', ecosystemSize: 'medium' },
    ice_planet: { planetType: 'ice', gravity: 0.8, atmosphere: 'thin', luminosity: 0.4, temperature: -40, waterPresence: 100, soilType: 'frozen', minerals: 'ice_crystals', ecosystemSize: 'large' },
    floating_islands: { planetType: 'aerial', gravity: 0.6, atmosphere: 'light', luminosity: 1.3, temperature: 18, waterPresence: 70, soilType: 'floating', minerals: 'levitation_stones', ecosystemSize: 'medium' },
    deep_ocean: { planetType: 'oceanic', gravity: 1.1, atmosphere: 'pressurized', luminosity: 0.3, temperature: 5, waterPresence: 100, soilType: 'abyssal', minerals: 'deep_sea_minerals', ecosystemSize: 'large' },
    toxic_wasteland: { planetType: 'toxic', gravity: 1.0, atmosphere: 'toxic', luminosity: 0.9, temperature: 35, waterPresence: 20, soilType: 'contaminated', minerals: 'toxic_compounds', ecosystemSize: 'small' },
    paradise_world: { planetType: 'paradise', gravity: 1.0, atmosphere: 'perfect', luminosity: 1.0, temperature: 22, waterPresence: 75, soilType: 'perfect', minerals: 'harmony_crystals', ecosystemSize: 'large' },
    storm_world: { planetType: 'storm', gravity: 1.4, atmosphere: 'turbulent', luminosity: 1.1, temperature: 30, waterPresence: 85, soilType: 'storm_swept', minerals: 'lightning_stones', ecosystemSize: 'medium' },
    
    // EXTREME CONFIGURATIONS
    binary_system: { planetType: 'binary', gravity: 1.5, atmosphere: 'variable', luminosity: 1.8, temperature: 50, waterPresence: 45, soilType: 'tidal_locked', minerals: 'binary_crystals', ecosystemSize: 'large' },
    rogue_planet: { planetType: 'rogue', gravity: 0.5, atmosphere: 'escaping', luminosity: 0.1, temperature: -80, waterPresence: 15, soilType: 'frozen_core', minerals: 'dark_matter', ecosystemSize: 'small' },
    ringworld: { planetType: 'artificial', gravity: 1.0, atmosphere: 'controlled', luminosity: 1.5, temperature: 25, waterPresence: 60, soilType: 'engineered', minerals: 'exotic_alloys', ecosystemSize: 'large' },
    
    // MIXED BIOMES - Transition zones
    forest_desert: { planetType: 'mixed', gravity: 1.0, atmosphere: 'variable', luminosity: 1.4, temperature: 32, waterPresence: 35, soilType: 'transitional', minerals: 'mixed', ecosystemSize: 'large' },
    arctic_ocean: { planetType: 'polar_ocean', gravity: 0.9, atmosphere: 'cold_humid', luminosity: 0.5, temperature: -5, waterPresence: 90, soilType: 'ice_shelf', minerals: 'polar_minerals', ecosystemSize: 'medium' },
    volcanic_jungle: { planetType: 'tropical_volcanic', gravity: 1.2, atmosphere: 'humid_sulfurous', luminosity: 1.3, temperature: 45, waterPresence: 80, soilType: 'fertile_volcanic', minerals: 'volcanic_gems', ecosystemSize: 'medium' }
};



export function setupConfigPanelListeners(refs, onApplyCallback) {
    refs.gravity.addEventListener('input', () => updateSliderValue(refs.gravity, refs.gravityValue, 'x'));
    refs.luminosity.addEventListener('input', () => updateSliderValue(refs.luminosity, refs.luminosityValue, 'x'));
    refs.temperature.addEventListener('input', () => updateSliderValue(refs.temperature, refs.temperatureValue, '°C'));
    refs.waterPresence.addEventListener('input', () => updateSliderValue(refs.waterPresence, refs.waterPresenceValue, '%'));
    refs.randomizeConfigBtn.addEventListener('click', () => {
        generateRandomConfig(refs);
        onApplyCallback();
    });
    refs.presetSandbox.addEventListener('change', (e) => applyPreset(refs, e.target.value));
    refs.applyConfigBtn.addEventListener('click', onApplyCallback);
}

function generateRandomConfig(refs) {
    const randomOption = (select) => select.options[Math.floor(Math.random() * select.options.length)].value;

    refs.planetType.value = randomOption(refs.planetType);
    refs.gravity.value = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
    refs.atmosphere.value = randomOption(refs.atmosphere);
    refs.luminosity.value = (Math.random() * (2.0 - 0.1) + 0.1).toFixed(1);
    refs.temperature.value = (Math.random() * (100 - (-50)) + (-50)).toFixed(0);
    refs.waterPresence.value = (Math.random() * (100 - 0) + 0).toFixed(0);
    refs.soilType.value = randomOption(refs.soilType);
    refs.minerals.value = randomOption(refs.minerals);
    refs.ecosystemSize.value = randomOption(refs.ecosystemSize);

    // Update all slider values
    updateSliderValue(refs.gravity, refs.gravityValue, 'x');
    updateSliderValue(refs.luminosity, refs.luminosityValue, 'x');
    updateSliderValue(refs.temperature, refs.temperatureValue, '°C');
    updateSliderValue(refs.waterPresence, refs.waterPresenceValue, '%');

    // Apply the new random configuration
    const newConfig = getCurrentConfig(refs);
    populateConfigForm(refs, newConfig);
    // The onApplyCallback is handled by the event listener in main.js
}

function applyPreset(refs, presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    Object.keys(preset).forEach(key => {
        const camelCaseKey = key.replace(/([-_]\w)/g, g => g[1].toUpperCase());
        if (refs[camelCaseKey]) {
            refs[camelCaseKey].value = preset[key];
        }
    });
    // Atualiza todos os valores visuais dos sliders
    updateSliderValue(refs.gravity, refs.gravityValue, 'x');
    updateSliderValue(refs.luminosity, refs.luminosityValue, 'x');
    updateSliderValue(refs.temperature, refs.temperatureValue, '°C');
    updateSliderValue(refs.waterPresence, refs.waterPresenceValue, '%');
}

export function getCurrentConfig(refs) {
    return {
        planetType: refs.planetType.value,
        gravity: parseFloat(refs.gravity.value),
        atmosphere: refs.atmosphere.value,
        luminosity: parseFloat(refs.luminosity.value),
        temperature: parseInt(refs.temperature.value),
        waterPresence: parseInt(refs.waterPresence.value),
        soilType: refs.soilType.value,
        minerals: refs.minerals.value,
        ecosystemSize: refs.ecosystemSize.value,
    };
}

export function populateConfigForm(refs, config) {
    if (!config) return;
    Object.keys(config).forEach(key => {
        const camelCaseKey = key.replace(/([-_]\w)/g, g => g[1].toUpperCase());
        if (refs[camelCaseKey]) {
            refs[camelCaseKey].value = config[key];
        }
    });
    updateSliderValue(refs.gravity, refs.gravityValue, 'x');
    updateSliderValue(refs.luminosity, refs.luminosityValue, 'x');
    updateSliderValue(refs.temperature, refs.temperatureValue, '°C');
    updateSliderValue(refs.waterPresence, refs.waterPresenceValue, '%');
}