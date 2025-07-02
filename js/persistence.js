import { showMessage } from './utils.js';
import { getCurrentConfig, populateConfigForm } from './config.js';

export function saveSimulation(config, elements, geminiKey, useGemini, cameraState) {
    const serializableElements = elements.map(el => ({ id: el.id, type: el.type, x: el.x, y: el.y, health: el.health, energy: el.energy }));
    const data = { config, elements: serializableElements, geminiKey, useGemini, cameraState };
    localStorage.setItem('ecosse_simulation', JSON.stringify(data));
    showMessage('Simulação salva!');
}

export function loadSimulation() {
    const savedData = localStorage.getItem('ecosse_simulation');
    if (savedData) {
        showMessage('Simulação carregada!');
        return JSON.parse(savedData);
    }
    return null;
}

export function generateSeed(config, elements, cameraState) {
    const serializableElements = elements.map(el => ({ id: el.id, type: el.type, x: el.x, y: el.y }));
    const data = { config, elements: serializableElements, cameraState };
    const seed = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?seed=${seed}`;
    navigator.clipboard.writeText(url).then(() => showMessage('Link de partilha copiado!'));
}

export function loadSimulationFromSeed(seed) {
    try {
        const data = JSON.parse(atob(seed));
        return data;
    } catch (e) {
        showMessage('Erro: Seed de partilha inválido.');
        return null;
    }
}