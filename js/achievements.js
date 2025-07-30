// js/achievements.js

import { showMessage, logToObserver } from './utils.js';

// Achievement tiers and their rewards
const ACHIEVEMENT_TIERS = {
    BASIC: { name: 'Básica', energyReward: 5, color: '#4CAF50', specialRewards: [] },
    INTERMEDIATE: { name: 'Intermediária', energyReward: 15, color: '#FF9800', specialRewards: ['new_elements', 'tools'] },
    ADVANCED: { name: 'Avançada', energyReward: 30, color: '#9C27B0', specialRewards: ['rare_elements', 'advanced_tools', 'biomes'] },
    LEGENDARY: { name: 'Lendária', energyReward: 50, color: '#FFD700', specialRewards: ['unique_abilities', 'planet_types', 'divine_powers'] }
};

// Daily and weekly challenges system
let dailyChallenges = [];
let weeklyChallenges = [];
let lastChallengeReset = { daily: null, weekly: null };
let challengeStreak = { daily: 0, weekly: 0 };

// Challenge templates for dynamic generation
const CHALLENGE_TEMPLATES = {
    daily: [
        { id: 'daily_creator', name: 'Criador Diário', description: 'Crie {count} elementos hoje', type: 'create_elements', target: [5, 10, 15] },
        { id: 'daily_stability', name: 'Estabilidade Diária', description: 'Mantenha estabilidade acima de {percent}% por {cycles} ciclos', type: 'maintain_stability', target: [80, 85, 90], cycles: [5, 8, 10] },
        { id: 'daily_diversity', name: 'Diversidade Diária', description: 'Tenha {types} tipos diferentes de elementos ativos', type: 'diversity', target: [4, 6, 8] },
        { id: 'daily_survivor', name: 'Sobrevivente Diário', description: 'Execute {cycles} ciclos de simulação', type: 'run_cycles', target: [20, 30, 50] }
    ],
    weekly: [
        { id: 'weekly_master', name: 'Mestre Semanal', description: 'Crie {count} elementos esta semana', type: 'create_elements', target: [50, 75, 100] },
        { id: 'weekly_evolution', name: 'Evolução Semanal', description: 'Observe {count} reproduções bem-sucedidas', type: 'reproductions', target: [10, 20, 30] },
        { id: 'weekly_weather', name: 'Mestre do Clima Semanal', description: 'Sobreviva a {count} eventos climáticos extremos', type: 'weather_events', target: [3, 5, 8] },
        { id: 'weekly_balance', name: 'Equilíbrio Semanal', description: 'Mantenha estabilidade média acima de {percent}%', type: 'average_stability', target: [85, 90, 95] }
    ]
};

const achievements = {
    // BASIC ACHIEVEMENTS - Entry level achievements for new players
    'first_plant': {
        id: 'first_plant',
        name: 'Primeira Planta',
        description: 'Crie sua primeira planta.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { plantsCreated: 0, required: 1 },
        rewards: { energy: 5, unlocks: ['plant_mastery_path'], specialResources: ['fertile_soil'] }
    },
    'first_creature': {
        id: 'first_creature',
        name: 'Primeira Criatura',
        description: 'Crie sua primeira criatura.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { creaturesCreated: 0, required: 1 },
        rewards: { energy: 5, unlocks: ['creature_mastery_path'], specialResources: ['life_essence'] }
    },
    'first_water': {
        id: 'first_water',
        name: 'Primeira Fonte de Água',
        description: 'Adicione água ao seu ecossistema.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { waterCreated: 0, required: 1 },
        rewards: { energy: 5, specialResources: ['pure_water'] }
    },
    'early_explorer': {
        id: 'early_explorer',
        name: 'Explorador Iniciante',
        description: 'Crie 10 elementos diferentes.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { totalElementsCreated: 0, required: 10 },
        rewards: { energy: 10, unlocks: ['exploration_tools'] }
    },
    'first_interaction': {
        id: 'first_interaction',
        name: 'Primeira Interação',
        description: 'Observe sua primeira interação entre elementos.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { interactionsObserved: 0, required: 1 },
        rewards: { energy: 8, unlocks: ['interaction_tracker'] }
    },
    'quick_learner': {
        id: 'quick_learner',
        name: 'Aprendiz Rápido',
        description: 'Complete 3 desafios diários consecutivos.',
        tier: 'BASIC',
        unlocked: false,
        criteria: { dailyChallengeStreak: 0, required: 3 },
        rewards: { energy: 12, unlocks: ['challenge_bonus'] }
    },

    // INTERMEDIATE ACHIEVEMENTS - For experienced players
    'ecosystem_builder': {
        id: 'ecosystem_builder',
        name: 'Construtor de Ecossistemas',
        description: 'Crie 100 elementos no total.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { totalElementsCreated: 0, required: 100 },
        rewards: { energy: 15, unlocks: ['advanced_tools'], specialResources: ['construction_materials'] }
    },
    'stable_ecosystem': {
        id: 'stable_ecosystem',
        name: 'Ecossistema Estável',
        description: 'Mantenha a estabilidade acima de 90% por 10 ciclos.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { stableCycles: 0, requiredStableCycles: 10, minStability: 90 },
        rewards: { energy: 20, unlocks: ['stability_bonus'], specialResources: ['harmony_crystals'] }
    },
    'diversity_champion': {
        id: 'diversity_champion',
        name: 'Campeão da Diversidade',
        description: 'Tenha 8 tipos diferentes de elementos ativos simultaneamente.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { maxDiversityTypes: 0, required: 8 },
        rewards: { energy: 15, unlocks: ['diversity_bonus'], specialResources: ['variety_seeds'] }
    },
    'weather_master': {
        id: 'weather_master',
        name: 'Mestre do Clima',
        description: 'Sobreviva a 5 eventos climáticos extremos.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { extremeWeatherSurvived: 0, required: 5 },
        rewards: { energy: 18, unlocks: ['weather_resistance'], specialResources: ['storm_essence'] }
    },
    'weekly_warrior': {
        id: 'weekly_warrior',
        name: 'Guerreiro Semanal',
        description: 'Complete 5 desafios semanais.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { weeklyChallengesCompleted: 0, required: 5 },
        rewards: { energy: 25, unlocks: ['weekly_bonus'], specialResources: ['dedication_tokens'] }
    },
    'evolution_observer': {
        id: 'evolution_observer',
        name: 'Observador da Evolução',
        description: 'Observe 25 reproduções bem-sucedidas.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { reproductionsWitnessed: 0, required: 25 },
        rewards: { energy: 20, unlocks: ['evolution_tracker'], specialResources: ['genetic_samples'] }
    },
    'resource_manager': {
        id: 'resource_manager',
        name: 'Gerente de Recursos',
        description: 'Acumule 500 pontos de energia.',
        tier: 'INTERMEDIATE',
        unlocked: false,
        criteria: { maxEnergyReached: 0, required: 500 },
        rewards: { energy: 30, unlocks: ['energy_efficiency'], specialResources: ['power_cores'] }
    },

    // ADVANCED ACHIEVEMENTS - For expert players
    'survivalist': {
        id: 'survivalist',
        name: 'Sobrevivente',
        description: 'Execute a simulação por 500 ciclos.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { simulationCycles: 0, required: 500 },
        rewards: { energy: 25, unlocks: ['endurance_bonus'], specialResources: ['time_crystals'], newBiomes: ['ancient_forest'] }
    },
    'evolution_witness': {
        id: 'evolution_witness',
        name: 'Testemunha da Evolução',
        description: 'Observe 50 reproduções bem-sucedidas.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { reproductionsWitnessed: 0, required: 50 },
        rewards: { energy: 30, unlocks: ['evolution_accelerator'], specialResources: ['evolution_catalyst'], newElements: ['apex_predator'] }
    },
    'ecosystem_architect': {
        id: 'ecosystem_architect',
        name: 'Arquiteto de Ecossistemas',
        description: 'Crie 500 elementos no total.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { totalElementsCreated: 0, required: 500 },
        rewards: { energy: 35, unlocks: ['master_creator'], specialResources: ['architect_blueprints'], newTools: ['ecosystem_designer'] }
    },
    'balance_keeper': {
        id: 'balance_keeper',
        name: 'Guardião do Equilíbrio',
        description: 'Mantenha estabilidade acima de 95% por 50 ciclos.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { stableCycles: 0, requiredStableCycles: 50, minStability: 95 },
        rewards: { energy: 40, unlocks: ['perfect_balance'], specialResources: ['balance_stones'], newAbilities: ['stability_aura'] }
    },
    'challenge_master': {
        id: 'challenge_master',
        name: 'Mestre dos Desafios',
        description: 'Complete 20 desafios semanais e mantenha uma sequência de 10 desafios diários.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { weeklyChallengesCompleted: 0, requiredWeekly: 20, dailyChallengeStreak: 0, requiredDailyStreak: 10 },
        rewards: { energy: 45, unlocks: ['challenge_mastery'], specialResources: ['mastery_tokens'], newAbilities: ['challenge_sight'] }
    },
    'biome_explorer': {
        id: 'biome_explorer',
        name: 'Explorador de Biomas',
        description: 'Crie ecossistemas estáveis em 5 biomas diferentes.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { stableBiomes: [], required: 5 },
        rewards: { energy: 35, unlocks: ['biome_mastery'], specialResources: ['biome_essences'], newPlanetTypes: ['multi_biome_world'] }
    },
    'extinction_survivor': {
        id: 'extinction_survivor',
        name: 'Sobrevivente de Extinção',
        description: 'Recupere um ecossistema após uma extinção em massa.',
        tier: 'ADVANCED',
        unlocked: false,
        criteria: { extinctionRecoveries: 0, required: 1 },
        rewards: { energy: 50, unlocks: ['recovery_protocols'], specialResources: ['phoenix_essence'], newAbilities: ['resurrection_power'] }
    },

    // LEGENDARY ACHIEVEMENTS - Ultimate challenges for master players
    'planet_god': {
        id: 'planet_god',
        name: 'Deus Planetário',
        description: 'Crie 1000 elementos e mantenha estabilidade acima de 90%.',
        tier: 'LEGENDARY',
        unlocked: false,
        criteria: { totalElementsCreated: 0, requiredElements: 1000, minStability: 90, currentStability: 0 },
        rewards: { 
            energy: 50, 
            unlocks: ['divine_powers', 'unlimited_energy_regen'], 
            specialResources: ['divine_essence', 'creation_matrix'],
            newPlanetTypes: ['divine_realm'],
            newAbilities: ['planet_shaping', 'life_creation']
        }
    },
    'eternal_guardian': {
        id: 'eternal_guardian',
        name: 'Guardião Eterno',
        description: 'Execute a simulação por 2000 ciclos sem resetar.',
        tier: 'LEGENDARY',
        unlocked: false,
        criteria: { simulationCycles: 0, required: 2000 },
        rewards: { 
            energy: 60, 
            unlocks: ['time_mastery'], 
            specialResources: ['eternity_shards', 'temporal_essence'],
            newAbilities: ['time_acceleration', 'temporal_vision']
        }
    },
    'master_of_all': {
        id: 'master_of_all',
        name: 'Mestre de Tudo',
        description: 'Desbloqueie todas as outras conquistas.',
        tier: 'LEGENDARY',
        unlocked: false,
        criteria: { otherAchievementsUnlocked: 0, required: -1 }, // -1 means all others
        rewards: { 
            energy: 100, 
            unlocks: ['ultimate_mastery'], 
            specialResources: ['omnipotence_core'],
            newPlanetTypes: ['perfect_world'],
            newAbilities: ['reality_control']
        }
    },
    'challenge_legend': {
        id: 'challenge_legend',
        name: 'Lenda dos Desafios',
        description: 'Complete 100 desafios semanais e mantenha uma sequência de 30 desafios diários.',
        tier: 'LEGENDARY',
        unlocked: false,
        criteria: { weeklyChallengesCompleted: 0, requiredWeekly: 100, dailyChallengeStreak: 0, requiredDailyStreak: 30 },
        rewards: { 
            energy: 75, 
            unlocks: ['legendary_challenges'], 
            specialResources: ['legend_tokens', 'challenge_crown'],
            newAbilities: ['challenge_creation', 'infinite_motivation']
        }
    },
    'ecosystem_transcendent': {
        id: 'ecosystem_transcendent',
        name: 'Transcendente dos Ecossistemas',
        description: 'Crie ecossistemas perfeitos em todos os biomas disponíveis.',
        tier: 'LEGENDARY',
        unlocked: false,
        criteria: { perfectEcosystems: [], requiredBiomes: ['forest', 'desert', 'ocean', 'tundra', 'volcanic', 'swamp', 'mountain', 'grassland'] },
        rewards: { 
            energy: 80, 
            unlocks: ['transcendent_powers'], 
            specialResources: ['transcendence_orb'],
            newPlanetTypes: ['transcendent_world'],
            newAbilities: ['ecosystem_fusion', 'biome_mastery']
        }
    }
};

export function getAchievements() {
    return achievements;
}

export function loadAchievements(savedData) {
    if (savedData) {
        // Load achievements
        if (savedData.achievements) {
            Object.keys(achievements).forEach(key => {
                if (savedData.achievements[key]) {
                    achievements[key].unlocked = savedData.achievements[key].unlocked;
                    if (savedData.achievements[key].criteria) {
                        Object.assign(achievements[key].criteria, savedData.achievements[key].criteria);
                    }
                }
            });
        } else if (savedData.first_plant) {
            // Legacy format support
            Object.keys(achievements).forEach(key => {
                if (savedData[key]) {
                    achievements[key].unlocked = savedData[key].unlocked;
                    if (savedData[key].criteria) {
                        Object.assign(achievements[key].criteria, savedData[key].criteria);
                    }
                }
            });
        }
        
        // Load challenges
        if (savedData.dailyChallenges) {
            dailyChallenges = savedData.dailyChallenges;
        }
        if (savedData.weeklyChallenges) {
            weeklyChallenges = savedData.weeklyChallenges;
        }
        if (savedData.lastChallengeReset) {
            lastChallengeReset = savedData.lastChallengeReset;
        }
        if (savedData.challengeStreak) {
            challengeStreak = savedData.challengeStreak;
        }
    }
    
    // Generate challenges if none exist
    generateDailyChallenge();
    generateWeeklyChallenge();
    
    logToObserver("Conquistas e desafios carregados.");
}

function unlockAchievement(achievementId) {
    const achievement = achievements[achievementId];
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        
        // Apply rewards immediately
        applyAchievementRewards(achievementId);
        
        // Show unlock notification
        const tier = ACHIEVEMENT_TIERS[achievement.tier];
        showMessage(`🏆 Conquista ${tier.name} Desbloqueada: ${achievement.name}!`, 'success');
        logToObserver(`Conquista Desbloqueada: ${achievement.name} (${tier.name})`);
        
        // Check for master of all achievement
        checkMasterOfAllAchievement();
        
        // Trigger visual effects based on tier
        triggerAchievementEffects(achievement);
    }
}

function checkMasterOfAllAchievement() {
    if (achievements.master_of_all && !achievements.master_of_all.unlocked) {
        const totalAchievements = Object.keys(achievements).length - 1; // Exclude master_of_all itself
        const unlockedCount = Object.values(achievements).filter(a => a.unlocked && a.id !== 'master_of_all').length;
        
        achievements.master_of_all.criteria.otherAchievementsUnlocked = unlockedCount;
        
        if (unlockedCount >= totalAchievements) {
            unlockAchievement('master_of_all');
        }
    }
}

function triggerAchievementEffects(achievement) {
    // This function can be extended to trigger visual/audio effects
    // For now, we'll just log the tier-specific effect
    const tier = ACHIEVEMENT_TIERS[achievement.tier];
    logToObserver(`Efeito de conquista ${tier.name} ativado para ${achievement.name}`);
    
    // Future: Add particle effects, sounds, screen effects based on tier
    switch (achievement.tier) {
        case 'LEGENDARY':
            logToObserver("🌟 Efeito lendário ativado!");
            break;
        case 'ADVANCED':
            logToObserver("✨ Efeito avançado ativado!");
            break;
        case 'INTERMEDIATE':
            logToObserver("⭐ Efeito intermediário ativado!");
            break;
        default:
            logToObserver("🎉 Efeito básico ativado!");
    }
}

// Enhanced tracking functions
export function trackElementCreated(elementType, currentEcosystem) {
    // Track first element achievements
    if (elementType === 'plant' && !achievements.first_plant.unlocked) {
        achievements.first_plant.criteria.plantsCreated++;
        if (achievements.first_plant.criteria.plantsCreated >= 1) {
            unlockAchievement('first_plant');
        }
    }
    
    if (elementType === 'creature' && !achievements.first_creature.unlocked) {
        achievements.first_creature.criteria.creaturesCreated++;
        if (achievements.first_creature.criteria.creaturesCreated >= 1) {
            unlockAchievement('first_creature');
        }
    }
    
    if (elementType === 'water' && !achievements.first_water.unlocked) {
        achievements.first_water.criteria.waterCreated++;
        if (achievements.first_water.criteria.waterCreated >= 1) {
            unlockAchievement('first_water');
        }
    }

    // Track total elements created for multiple achievements
    const elementsToTrack = ['early_explorer', 'ecosystem_builder', 'ecosystem_architect', 'planet_god'];
    elementsToTrack.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.criteria.totalElementsCreated++;
            const required = achievement.criteria.required || achievement.criteria.requiredElements;
            if (achievement.criteria.totalElementsCreated >= required) {
                unlockAchievement(achievementId);
            }
        }
    });

    // Update challenge progress
    updateChallengeProgress('create_elements', 1);
    
    // Track diversity
    if (currentEcosystem) {
        trackDiversity(currentEcosystem);
    }
}

export function trackSimulationCycle(currentStability) {
    // Track survivalist and eternal guardian
    const cycleAchievements = ['survivalist', 'eternal_guardian'];
    cycleAchievements.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.criteria.simulationCycles++;
            if (achievement.criteria.simulationCycles >= achievement.criteria.required) {
                unlockAchievement(achievementId);
            }
        }
    });

    // Update challenge progress
    updateChallengeProgress('run_cycles', 1);
    
    // Check stability achievements
    checkStabilityAchievement(currentStability);
}

export function checkStabilityAchievement(currentStability) {
    // Track stable ecosystem achievements
    const stabilityAchievements = ['stable_ecosystem', 'balance_keeper'];
    stabilityAchievements.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            if (currentStability >= achievement.criteria.minStability) {
                achievement.criteria.stableCycles++;
                if (achievement.criteria.stableCycles >= achievement.criteria.requiredStableCycles) {
                    unlockAchievement(achievementId);
                }
            } else {
                // Reset counter if stability drops
                achievement.criteria.stableCycles = 0;
            }
        }
    });

    // Update planet god achievement
    if (achievements.planet_god && !achievements.planet_god.unlocked) {
        achievements.planet_god.criteria.currentStability = currentStability;
        if (achievements.planet_god.criteria.totalElementsCreated >= 1000 && 
            currentStability >= 90) {
            unlockAchievement('planet_god');
        }
    }

    // Update challenge progress
    updateChallengeProgress('maintain_stability', currentStability >= 80 ? 1 : 0);
}

export function trackDiversity(ecosystem) {
    const elementTypes = new Set();
    ecosystem.elements.forEach(element => {
        elementTypes.add(element.type);
    });
    
    const diversityCount = elementTypes.size;
    
    // Track diversity champion
    if (achievements.diversity_champion && !achievements.diversity_champion.unlocked) {
        achievements.diversity_champion.criteria.maxDiversityTypes = Math.max(
            achievements.diversity_champion.criteria.maxDiversityTypes, 
            diversityCount
        );
        if (diversityCount >= 8) {
            unlockAchievement('diversity_champion');
        }
    }

    // Update challenge progress
    updateChallengeProgress('diversity', diversityCount);
}

export function trackReproduction() {
    // Track evolution achievements
    const reproductionAchievements = ['evolution_observer', 'evolution_witness'];
    reproductionAchievements.forEach(achievementId => {
        const achievement = achievements[achievementId];
        if (achievement && !achievement.unlocked) {
            achievement.criteria.reproductionsWitnessed++;
            if (achievement.criteria.reproductionsWitnessed >= achievement.criteria.required) {
                unlockAchievement(achievementId);
            }
        }
    });

    // Update challenge progress
    updateChallengeProgress('reproductions', 1);
}

export function trackWeatherEvent(eventType) {
    if (eventType === 'extreme') {
        // Track weather master
        if (achievements.weather_master && !achievements.weather_master.unlocked) {
            achievements.weather_master.criteria.extremeWeatherSurvived++;
            if (achievements.weather_master.criteria.extremeWeatherSurvived >= 5) {
                unlockAchievement('weather_master');
            }
        }

        // Update challenge progress
        updateChallengeProgress('weather_events', 1);
    }
}

export function trackInteraction() {
    // Track first interaction
    if (achievements.first_interaction && !achievements.first_interaction.unlocked) {
        achievements.first_interaction.criteria.interactionsObserved++;
        if (achievements.first_interaction.criteria.interactionsObserved >= 1) {
            unlockAchievement('first_interaction');
        }
    }
}

export function trackEnergyLevel(currentEnergy) {
    // Track resource manager
    if (achievements.resource_manager && !achievements.resource_manager.unlocked) {
        achievements.resource_manager.criteria.maxEnergyReached = Math.max(
            achievements.resource_manager.criteria.maxEnergyReached,
            currentEnergy
        );
        if (currentEnergy >= 500) {
            unlockAchievement('resource_manager');
        }
    }
}

export function trackBiomeStability(biome, isStable) {
    // Track biome explorer
    if (achievements.biome_explorer && !achievements.biome_explorer.unlocked && isStable) {
        if (!achievements.biome_explorer.criteria.stableBiomes.includes(biome)) {
            achievements.biome_explorer.criteria.stableBiomes.push(biome);
            if (achievements.biome_explorer.criteria.stableBiomes.length >= 5) {
                unlockAchievement('biome_explorer');
            }
        }
    }
    
    // Track ecosystem transcendent
    if (achievements.ecosystem_transcendent && !achievements.ecosystem_transcendent.unlocked && isStable) {
        if (!achievements.ecosystem_transcendent.criteria.perfectEcosystems.includes(biome)) {
            achievements.ecosystem_transcendent.criteria.perfectEcosystems.push(biome);
            const required = achievements.ecosystem_transcendent.criteria.requiredBiomes;
            if (achievements.ecosystem_transcendent.criteria.perfectEcosystems.length >= required.length) {
                unlockAchievement('ecosystem_transcendent');
            }
        }
    }
}

export function trackExtinctionRecovery() {
    // Track extinction survivor
    if (achievements.extinction_survivor && !achievements.extinction_survivor.unlocked) {
        achievements.extinction_survivor.criteria.extinctionRecoveries++;
        if (achievements.extinction_survivor.criteria.extinctionRecoveries >= 1) {
            unlockAchievement('extinction_survivor');
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

// Daily and Weekly Challenge System
export function generateDailyChallenge() {
    const today = new Date().toDateString();
    if (lastChallengeReset.daily === today && dailyChallenges.length > 0) {
        return dailyChallenges[0]; // Return existing challenge
    }

    // Generate new daily challenge
    const template = CHALLENGE_TEMPLATES.daily[Math.floor(Math.random() * CHALLENGE_TEMPLATES.daily.length)];
    const difficulty = Math.min(Math.floor(challengeStreak.daily / 5), 2); // Increase difficulty with streak
    
    const challenge = {
        id: `${template.id}_${Date.now()}`,
        name: template.name,
        description: template.description.replace('{count}', template.target[difficulty])
                                        .replace('{percent}', template.target[difficulty])
                                        .replace('{cycles}', template.cycles ? template.cycles[difficulty] : 10)
                                        .replace('{types}', template.target[difficulty]),
        type: template.type,
        target: template.target[difficulty],
        progress: 0,
        completed: false,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        rewards: {
            energy: 10 + (difficulty * 5),
            specialResources: difficulty > 0 ? ['daily_tokens'] : [],
            streakBonus: challengeStreak.daily > 0 ? Math.floor(challengeStreak.daily / 3) * 2 : 0
        }
    };

    dailyChallenges = [challenge];
    lastChallengeReset.daily = today;
    logToObserver(`Novo desafio diário: ${challenge.name}`);
    return challenge;
}

export function generateWeeklyChallenge() {
    const thisWeek = getWeekNumber(new Date());
    if (lastChallengeReset.weekly === thisWeek && weeklyChallenges.length > 0) {
        return weeklyChallenges[0]; // Return existing challenge
    }

    // Generate new weekly challenge
    const template = CHALLENGE_TEMPLATES.weekly[Math.floor(Math.random() * CHALLENGE_TEMPLATES.weekly.length)];
    const difficulty = Math.min(Math.floor(challengeStreak.weekly / 3), 2); // Increase difficulty with streak
    
    const challenge = {
        id: `${template.id}_${Date.now()}`,
        name: template.name,
        description: template.description.replace('{count}', template.target[difficulty])
                                        .replace('{percent}', template.target[difficulty]),
        type: template.type,
        target: template.target[difficulty],
        progress: 0,
        completed: false,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        rewards: {
            energy: 25 + (difficulty * 10),
            specialResources: ['weekly_tokens', difficulty > 1 ? 'rare_materials' : 'common_materials'],
            streakBonus: challengeStreak.weekly > 0 ? Math.floor(challengeStreak.weekly / 2) * 5 : 0
        }
    };

    weeklyChallenges = [challenge];
    lastChallengeReset.weekly = thisWeek;
    logToObserver(`Novo desafio semanal: ${challenge.name}`);
    return challenge;
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function updateChallengeProgress(type, value = 1) {
    // Update daily challenge
    const dailyChallenge = dailyChallenges[0];
    if (dailyChallenge && !dailyChallenge.completed && dailyChallenge.type === type) {
        dailyChallenge.progress += value;
        if (dailyChallenge.progress >= dailyChallenge.target) {
            completeDailyChallenge();
        }
    }

    // Update weekly challenge
    const weeklyChallenge = weeklyChallenges[0];
    if (weeklyChallenge && !weeklyChallenge.completed && weeklyChallenge.type === type) {
        weeklyChallenge.progress += value;
        if (weeklyChallenge.progress >= weeklyChallenge.target) {
            completeWeeklyChallenge();
        }
    }
}

function completeDailyChallenge() {
    const challenge = dailyChallenges[0];
    if (challenge && !challenge.completed) {
        challenge.completed = true;
        challengeStreak.daily++;
        
        const totalReward = challenge.rewards.energy + challenge.rewards.streakBonus;
        showMessage(`Desafio Diário Completo! +${totalReward} energia`, 'success');
        logToObserver(`Desafio diário completado: ${challenge.name}`);
        
        // Track achievement progress
        if (achievements.quick_learner && !achievements.quick_learner.unlocked) {
            achievements.quick_learner.criteria.dailyChallengeStreak = challengeStreak.daily;
            if (challengeStreak.daily >= 3) {
                unlockAchievement('quick_learner');
            }
        }
        
        // Update other challenge-related achievements
        updateChallengeAchievements();
    }
}

function completeWeeklyChallenge() {
    const challenge = weeklyChallenges[0];
    if (challenge && !challenge.completed) {
        challenge.completed = true;
        challengeStreak.weekly++;
        
        const totalReward = challenge.rewards.energy + challenge.rewards.streakBonus;
        showMessage(`Desafio Semanal Completo! +${totalReward} energia`, 'success');
        logToObserver(`Desafio semanal completado: ${challenge.name}`);
        
        // Track achievement progress
        if (achievements.weekly_warrior && !achievements.weekly_warrior.unlocked) {
            achievements.weekly_warrior.criteria.weeklyChallengesCompleted++;
            if (achievements.weekly_warrior.criteria.weeklyChallengesCompleted >= 5) {
                unlockAchievement('weekly_warrior');
            }
        }
        
        // Update other challenge-related achievements
        updateChallengeAchievements();
    }
}

function updateChallengeAchievements() {
    // Update challenge master achievement
    if (achievements.challenge_master && !achievements.challenge_master.unlocked) {
        achievements.challenge_master.criteria.weeklyChallengesCompleted = challengeStreak.weekly;
        achievements.challenge_master.criteria.dailyChallengeStreak = challengeStreak.daily;
        
        if (challengeStreak.weekly >= 20 && challengeStreak.daily >= 10) {
            unlockAchievement('challenge_master');
        }
    }
    
    // Update challenge legend achievement
    if (achievements.challenge_legend && !achievements.challenge_legend.unlocked) {
        achievements.challenge_legend.criteria.weeklyChallengesCompleted = challengeStreak.weekly;
        achievements.challenge_legend.criteria.dailyChallengeStreak = challengeStreak.daily;
        
        if (challengeStreak.weekly >= 100 && challengeStreak.daily >= 30) {
            unlockAchievement('challenge_legend');
        }
    }
}

export function getDailyChallenges() {
    return dailyChallenges;
}

export function getWeeklyChallenges() {
    return weeklyChallenges;
}

export function getChallengeStreak() {
    return challengeStreak;
}

// Enhanced reward system
export function applyAchievementRewards(achievementId) {
    const achievement = achievements[achievementId];
    if (!achievement || !achievement.unlocked) return;

    const rewards = achievement.rewards;
    let rewardMessage = `Recompensas de ${achievement.name}:\n`;
    
    // Energy reward
    if (rewards.energy) {
        rewardMessage += `+${rewards.energy} Energia\n`;
    }
    
    // Special resources
    if (rewards.specialResources && rewards.specialResources.length > 0) {
        rewardMessage += `Recursos especiais: ${rewards.specialResources.join(', ')}\n`;
    }
    
    // New elements
    if (rewards.newElements && rewards.newElements.length > 0) {
        rewardMessage += `Novos elementos desbloqueados: ${rewards.newElements.join(', ')}\n`;
    }
    
    // New biomes
    if (rewards.newBiomes && rewards.newBiomes.length > 0) {
        rewardMessage += `Novos biomas desbloqueados: ${rewards.newBiomes.join(', ')}\n`;
    }
    
    // New planet types
    if (rewards.newPlanetTypes && rewards.newPlanetTypes.length > 0) {
        rewardMessage += `Novos tipos de planeta: ${rewards.newPlanetTypes.join(', ')}\n`;
    }
    
    // New abilities
    if (rewards.newAbilities && rewards.newAbilities.length > 0) {
        rewardMessage += `Novas habilidades: ${rewards.newAbilities.join(', ')}\n`;
    }
    
    // New tools
    if (rewards.newTools && rewards.newTools.length > 0) {
        rewardMessage += `Novas ferramentas: ${rewards.newTools.join(', ')}\n`;
    }
    
    showMessage(rewardMessage, 'success');
    logToObserver(`Recompensas aplicadas para ${achievement.name}`);
}

export function saveAchievements() {
    try {
        const saveData = {
            achievements,
            dailyChallenges,
            weeklyChallenges,
            lastChallengeReset,
            challengeStreak
        };
        localStorage.setItem('ecosseAchievements', JSON.stringify(saveData));
        logToObserver("Conquistas e desafios salvos.");
    } catch (e) {
        console.error("Erro ao salvar conquistas no localStorage:", e);
        logToObserver("Erro ao salvar conquistas.");
    }
}

// Utility functions for UI and integration
export function getAchievementsByTier(tier) {
    return Object.values(achievements).filter(achievement => achievement.tier === tier);
}

export function getUnlockedAchievements() {
    return Object.values(achievements).filter(achievement => achievement.unlocked);
}

export function getLockedAchievements() {
    return Object.values(achievements).filter(achievement => !achievement.unlocked);
}

export function getAchievementProgress(achievementId) {
    const achievement = achievements[achievementId];
    if (!achievement || achievement.unlocked) return 100;
    
    const criteria = achievement.criteria;
    let progress = 0;
    let total = 0;
    
    // Calculate progress based on criteria type
    if (criteria.required !== undefined) {
        const current = Object.values(criteria).find(val => typeof val === 'number' && val !== criteria.required) || 0;
        progress = Math.min(current, criteria.required);
        total = criteria.required;
    } else if (criteria.requiredElements !== undefined) {
        progress = Math.min(criteria.totalElementsCreated || 0, criteria.requiredElements);
        total = criteria.requiredElements;
    } else if (criteria.requiredStableCycles !== undefined) {
        progress = Math.min(criteria.stableCycles || 0, criteria.requiredStableCycles);
        total = criteria.requiredStableCycles;
    }
    
    return total > 0 ? Math.floor((progress / total) * 100) : 0;
}

export function getAchievementStats() {
    const total = Object.keys(achievements).length;
    const unlocked = getUnlockedAchievements().length;
    const byTier = {};
    
    Object.keys(ACHIEVEMENT_TIERS).forEach(tier => {
        const tierAchievements = getAchievementsByTier(tier);
        const tierUnlocked = tierAchievements.filter(a => a.unlocked).length;
        byTier[tier] = {
            total: tierAchievements.length,
            unlocked: tierUnlocked,
            percentage: tierAchievements.length > 0 ? Math.floor((tierUnlocked / tierAchievements.length) * 100) : 0
        };
    });
    
    return {
        total,
        unlocked,
        percentage: Math.floor((unlocked / total) * 100),
        byTier,
        challengeStreak
    };
}

export function resetChallengeStreak(type) {
    if (type === 'daily') {
        challengeStreak.daily = 0;
        logToObserver("Sequência de desafios diários resetada.");
    } else if (type === 'weekly') {
        challengeStreak.weekly = 0;
        logToObserver("Sequência de desafios semanais resetada.");
    }
}

export function getAvailableRewards() {
    const rewards = {
        energy: 0,
        specialResources: new Set(),
        unlocks: new Set(),
        newElements: new Set(),
        newBiomes: new Set(),
        newPlanetTypes: new Set(),
        newAbilities: new Set(),
        newTools: new Set()
    };
    
    // Collect rewards from unlocked achievements
    Object.values(achievements).forEach(achievement => {
        if (achievement.unlocked && achievement.rewards) {
            const r = achievement.rewards;
            if (r.energy) rewards.energy += r.energy;
            if (r.specialResources) r.specialResources.forEach(res => rewards.specialResources.add(res));
            if (r.unlocks) r.unlocks.forEach(unlock => rewards.unlocks.add(unlock));
            if (r.newElements) r.newElements.forEach(elem => rewards.newElements.add(elem));
            if (r.newBiomes) r.newBiomes.forEach(biome => rewards.newBiomes.add(biome));
            if (r.newPlanetTypes) r.newPlanetTypes.forEach(type => rewards.newPlanetTypes.add(type));
            if (r.newAbilities) r.newAbilities.forEach(ability => rewards.newAbilities.add(ability));
            if (r.newTools) r.newTools.forEach(tool => rewards.newTools.add(tool));
        }
    });
    
    // Convert sets to arrays
    Object.keys(rewards).forEach(key => {
        if (rewards[key] instanceof Set) {
            rewards[key] = Array.from(rewards[key]);
        }
    });
    
    return rewards;
}

// Initialize challenges on module load
export function initializeChallenges() {
    generateDailyChallenge();
    generateWeeklyChallenge();
    logToObserver("Sistema de desafios inicializado.");
}

// Export achievement tiers for UI use
export function getAchievementTiers() {
    return ACHIEVEMENT_TIERS;
}