// js/persistence.js

import { showMessage, logToObserver } from './utils.js';
import { getAchievements, loadAchievements } from './achievements.js'; // NEW IMPORT
import { getUnlockedTechnologies, loadTechnologies } from './techTree.js'; // NEW IMPORT

// Assuming pako is available globally or imported elsewhere if needed for compression
// If pako is not available, you might need to add a script tag for it in index.html
// <script src="https://cdn.jsdelivr.net/npm/pako@2.0.4/dist/pako.min.js"></script>

export function saveSimulation(config, elements, geminiKey, useGemini, cameraState) {
    const simulationData = {
        config: config,
        elements: elements,
        geminiKey: geminiKey,
        useGemini: useGemini,
        cameraState: cameraState,
        achievements: getAchievements(),
        unlockedTechnologies: getUnlockedTechnologies() // NEW: Save unlocked technologies
    };
    localStorage.setItem('ecosimulation', JSON.stringify(simulationData));
    showMessage('Simulação salva!');
    logToObserver('Simulação salva no armazenamento local.');
}

export function loadSimulation() {
    const savedData = localStorage.getItem('ecosimulation');
    if (savedData) {
        const simulationData = JSON.parse(savedData);
        logToObserver('Simulação carregada do armazenamento local.');
        loadAchievements(simulationData.achievements);
        loadTechnologies(simulationData.unlockedTechnologies); // NEW: Load unlocked technologies
        return simulationData;
    }
    logToObserver('Nenhuma simulação salva encontrada.');
    return null;
}

export function loadSimulationFromSeed(seed) {
    try {
        // Assuming pako is available for decompression
        const decoded = atob(seed);
        const decompressed = pako.inflate(decoded, { to: 'string' });
        const simulationData = JSON.parse(decompressed);
        logToObserver('Simulação carregada do seed.');
        loadAchievements(simulationData.achievements);
        loadTechnologies(simulationData.unlockedTechnologies); // NEW: Load unlocked technologies
        return simulationData;
    } catch (error) {
        showMessage('Erro ao carregar simulação do seed: ' + error.message);
        logToObserver('Erro ao carregar simulação do seed: ' + error.message);
        return null;
    }
}

export function generateSeed(config, elements, cameraState) {
    const simulationData = {
        config: config,
        elements: elements,
        cameraState: cameraState,
        achievements: getAchievements(),
        unlockedTechnologies: getUnlockedTechnologies() // NEW: Include unlocked technologies in seed
    };
    const jsonString = JSON.stringify(simulationData);
    // Assuming pako is available for compression
    const compressed = pako.deflate(jsonString, { to: 'string' });
    const encoded = btoa(compressed);
    const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        showMessage('Link de compartilhamento copiado para a área de transferência!');
        logToObserver('Link de compartilhamento gerado e copiado.');
    }).catch(err => {
        showMessage('Erro ao copiar link: ' + err);
        logToObserver('Erro ao copiar link: ' + err);
    });
}