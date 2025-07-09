// js/achievements.js

import { showMessage, logToObserver } from './utils.js';

const achievements = {
    'first_plant': {
        id: 'first_plant',
        name: 'Primeira Planta',
        description: 'Crie sua primeira planta.',
        unlocked: false,
        criteria: { plantsCreated: 0 }
    },
    'ecosystem_builder': {
        id: 'ecosystem_builder',
        name: 'Construtor de Ecossistemas',
        description: 'Crie 100 elementos no total.',
        unlocked: false,
        criteria: { totalElementsCreated: 0 }
    },
    'stable_ecosystem': {
        id: 'stable_ecosystem',
        name: 'Ecossistema Estável',
        description: 'Mantenha a estabilidade do ecossistema acima de 90% por 10 ciclos.',
        unlocked: false,
        criteria: { stableCycles: 0, requiredStableCycles: 10, minStability: 90 }
    },
    'survivalist': {
        id: 'survivalist',
        name: 'Sobrevivente',
        description: 'Execute a simulação por 500 ciclos.',
        unlocked: false,
        criteria: { simulationCycles: 0, requiredCycles: 500 }
    }
    // Add more achievements here
};

export function getAchievements() {
    return achievements;
}

export function loadAchievements(savedAchievements) {
    if (savedAchievements) {
        Object.keys(achievements).forEach(key => {
            if (savedAchievements[key]) {
                achievements[key].unlocked = savedAchievements[key].unlocked;
                // Optionally, load criteria progress if you want persistent progress tracking
                // For simplicity, we'll reset criteria on load for now, but it can be extended.
                if (savedAchievements[key].criteria) {
                    Object.assign(achievements[key].criteria, savedAchievements[key].criteria);
                }
            }
        });
    }
    logToObserver("Conquistas carregadas.");
}

function unlockAchievement(achievementId) {
    const achievement = achievements[achievementId];
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        showMessage(`Conquista Desbloqueada: ${achievement.name}!`, 'success');
        logToObserver(`Conquista Desbloqueada: ${achievement.name}`);
        // Potentially trigger a visual notification here
    }
}

// Tracking functions
export function trackElementCreated(elementType) {
    // Track 'first_plant'
    if (elementType === 'plant' && !achievements.first_plant.unlocked) {
        achievements.first_plant.criteria.plantsCreated++;
        if (achievements.first_plant.criteria.plantsCreated >= 1) {
            unlockAchievement('first_plant');
        }
    }

    // Track 'ecosystem_builder'
    if (!achievements.ecosystem_builder.unlocked) {
        achievements.ecosystem_builder.criteria.totalElementsCreated++;
        if (achievements.ecosystem_builder.criteria.totalElementsCreated >= 100) {
            unlockAchievement('ecosystem_builder');
        }
    }
}

export function trackSimulationCycle() {
    // Track 'survivalist'
    if (!achievements.survivalist.unlocked) {
        achievements.survivalist.criteria.simulationCycles++;
        if (achievements.survivalist.criteria.simulationCycles >= achievements.survivalist.criteria.requiredCycles) {
            unlockAchievement('survivalist');
        }
    }
}

export function checkStabilityAchievement(currentStability) {
    // Track 'stable_ecosystem'
    if (!achievements.stable_ecosystem.unlocked) {
        if (currentStability >= achievements.stable_ecosystem.criteria.minStability) {
            achievements.stable_ecosystem.criteria.stableCycles++;
            if (achievements.stable_ecosystem.criteria.stableCycles >= achievements.stable_ecosystem.criteria.requiredStableCycles) {
                unlockAchievement('stable_ecosystem');
            }
        } else {
            // Reset counter if stability drops
            achievements.stable_ecosystem.criteria.stableCycles = 0;
        }
    }
}

export function resetAchievementProgress() {
    Object.keys(achievements).forEach(key => {
        const achievement = achievements[key];
        if (achievement.criteria) {
            for (const criterion in achievement.criteria) {
                if (typeof achievement.criteria[criterion] === 'number') {
                    achievement.criteria[criterion] = 0; // Reset numeric criteria
                }
            }
        }
    });
    logToObserver("Progresso das conquistas resetado.");
}