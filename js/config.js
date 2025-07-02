import { updateSliderValue, ecosystemSizes } from './utils.js';

let elements = {}; // This will be removed later, but keep for now to avoid immediate errors
const presets = {
    oasis: { planetType: 'desert', gravity: 0.8, atmosphere: 'thin', luminosity: 1.5, temperature: 35, waterPresence: 80, soilType: 'sandy', minerals: 'silicon', ecosystemSize: 'medium' },
    swamp: { planetType: 'aquatic', gravity: 1.1, atmosphere: 'dense', luminosity: 0.7, temperature: 10, waterPresence: 90, soilType: 'clay', minerals: 'carbon', ecosystemSize: 'medium' },
    forest: { planetType: 'terrestrial', gravity: 1.0, atmosphere: 'oxygenated', luminosity: 1.2, temperature: 20, waterPresence: 60, soilType: 'fertile', minerals: 'iron', ecosystemSize: 'large' },
    desert: { planetType: 'desert', gravity: 1.0, atmosphere: 'thin', luminosity: 1.8, temperature: 45, waterPresence: 10, soilType: 'sandy', minerals: 'none', ecosystemSize: 'small' }
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