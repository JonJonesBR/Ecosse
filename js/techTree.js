// js/techTree.js

import { showMessage, logToObserver } from './utils.js';

const technologies = {
    'enhanced_photosynthesis': {
        id: 'enhanced_photosynthesis',
        name: 'Fotossíntese Aprimorada',
        description: 'Plantas crescem 20% mais rápido.',
        cost: { iron: 10, carbon: 5 },
        unlocked: false,
        prerequisites: [],
        effect: { type: 'plant_growth_multiplier', value: 1.2 }
    },
    'mineral_extraction': {
        id: 'mineral_extraction',
        name: 'Extração Mineral Eficiente',
        description: 'Aumenta a quantidade de minerais extraídos de rochas em 10%.',
        cost: { silicon: 15 },
        unlocked: false,
        prerequisites: ['enhanced_photosynthesis'], // Example prerequisite
        effect: { type: 'mineral_extraction_bonus', value: 0.1 }
    },
    'creature_adaptation': {
        id: 'creature_adaptation',
        name: 'Adaptação de Criaturas',
        description: 'Criaturas se adaptam melhor a biomas extremos, reduzindo o consumo de energia em 15%.',
        cost: { carbon: 10, iron: 5 },
        unlocked: false,
        prerequisites: [],
        effect: { type: 'creature_energy_reduction', value: 0.15 }
    }
    // Add more technologies here
};

let unlockedTechnologies = {}; // To store the state of unlocked technologies

export function getTechnologies() {
    return technologies;
}

export function getUnlockedTechnologies() {
    return unlockedTechnologies;
}

export function loadTechnologies(savedTechnologies) {
    if (savedTechnologies) {
        unlockedTechnologies = savedTechnologies;
        logToObserver("Tecnologias carregadas.");
    }
}

export function unlockTechnology(techId, currentMinerals) {
    const tech = technologies[techId];
    if (!tech || tech.unlocked) {
        showMessage('Tecnologia já desbloqueada ou não existe.');
        return false;
    }

    // Check prerequisites
    for (const prereqId of tech.prerequisites) {
        if (!unlockedTechnologies[prereqId]) {
            showMessage(`Requisito não atendido: ${technologies[prereqId].name}`);
            return false;
        }
    }

    // Check cost
    for (const mineral in tech.cost) {
        if (currentMinerals[mineral] < tech.cost[mineral]) {
            showMessage(`Minerais insuficientes para ${tech.name}. Necessário ${tech.cost[mineral]} ${mineral}.`);
            return false;
        }
    }

    // Deduct cost and unlock
    for (const mineral in tech.cost) {
        currentMinerals[mineral] -= tech.cost[mineral];
    }
    tech.unlocked = true;
    unlockedTechnologies[techId] = true; // Mark as unlocked
    showMessage(`Tecnologia desbloqueada: ${tech.name}!`, 'success');
    logToObserver(`Tecnologia desbloqueada: ${tech.name}`);

    // Apply immediate effects if any (long-term effects handled in simulation.js)
    // Example: if a technology gives immediate resources, apply here.

    return true;
}

// Function to get active effects for simulation.js
export function getActiveTechnologyEffects() {
    const effects = {};
    for (const techId in unlockedTechnologies) {
        if (unlockedTechnologies[techId] && technologies[techId] && technologies[techId].effect) {
            const effect = technologies[techId].effect;
            if (!effects[effect.type]) {
                effects[effect.type] = effect.value;
            } else {
                // Combine effects if multiple technologies affect the same thing
                // This logic depends on how effects combine (e.g., multiply, add)
                if (effect.type.includes('multiplier')) {
                    effects[effect.type] *= effect.value;
                } else {
                    effects[effect.type] += effect.value;
                }
            }
        }
    }
    return effects;
}