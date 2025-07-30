// js/energySystem.js

import { showMessage, logToObserver } from './utils.js';
import { trackEnergyLevel } from './achievements.js';

// Energy and resource configuration
const ENERGY_CONFIG = {
    maxEnergy: 1000,
    baseRegenRate: 2, // Energy per cycle
    interventionCosts: {
        create_element: 10,
        remove_element: 5,
        weather_control: 25,
        time_acceleration: 15,
        divine_intervention: 50,
        ecosystem_reset: 100
    },
    bonusMultipliers: {
        stability_bonus: 1.2,
        diversity_bonus: 1.1,
        achievement_bonus: 1.5,
        challenge_bonus: 1.3
    }
};

// Special resources configuration
const SPECIAL_RESOURCES = {
    fertile_soil: { name: 'Solo Fértil', emoji: '🌱', description: 'Aumenta crescimento de plantas', maxStack: 50 },
    life_essence: { name: 'Essência Vital', emoji: '✨', description: 'Acelera reprodução de criaturas', maxStack: 30 },
    pure_water: { name: 'Água Pura', emoji: '💧', description: 'Melhora qualidade da água', maxStack: 100 },
    storm_essence: { name: 'Essência da Tempestade', emoji: '⚡', description: 'Controla eventos climáticos', maxStack: 20 },
    harmony_crystals: { name: 'Cristais de Harmonia', emoji: '💎', description: 'Estabiliza ecossistemas', maxStack: 15 },
    variety_seeds: { name: 'Sementes da Variedade', emoji: '🌰', description: 'Aumenta diversidade genética', maxStack: 25 },
    genetic_samples: { name: 'Amostras Genéticas', emoji: '🧬', description: 'Acelera evolução', maxStack: 40 },
    power_cores: { name: 'Núcleos de Energia', emoji: '🔋', description: 'Aumenta regeneração de energia', maxStack: 10 },
    time_crystals: { name: 'Cristais Temporais', emoji: '⏰', description: 'Manipula fluxo do tempo', maxStack: 5 },
    evolution_catalyst: { name: 'Catalisador Evolutivo', emoji: '🔬', description: 'Força mutações benéficas', maxStack: 8 },
    architect_blueprints: { name: 'Plantas Arquitetônicas', emoji: '📐', description: 'Cria estruturas complexas', maxStack: 12 },
    balance_stones: { name: 'Pedras do Equilíbrio', emoji: '⚖️', description: 'Mantém estabilidade perfeita', maxStack: 6 },
    mastery_tokens: { name: 'Fichas de Maestria', emoji: '🏅', description: 'Desbloqueia habilidades especiais', maxStack: 20 },
    dedication_tokens: { name: 'Fichas de Dedicação', emoji: '🎖️', description: 'Bônus para desafios', maxStack: 30 },
    daily_tokens: { name: 'Fichas Diárias', emoji: '📅', description: 'Recompensas de desafios diários', maxStack: 100 },
    weekly_tokens: { name: 'Fichas Semanais', emoji: '📆', description: 'Recompensas de desafios semanais', maxStack: 50 },
    rare_materials: { name: 'Materiais Raros', emoji: '💍', description: 'Recursos especiais de eventos', maxStack: 15 },
    common_materials: { name: 'Materiais Comuns', emoji: '🔩', description: 'Recursos básicos de construção', maxStack: 200 },
    divine_essence: { name: 'Essência Divina', emoji: '👑', description: 'Poder supremo de criação', maxStack: 3 },
    creation_matrix: { name: 'Matrix da Criação', emoji: '🌌', description: 'Controle total sobre a realidade', maxStack: 1 },
    eternity_shards: { name: 'Fragmentos da Eternidade', emoji: '♾️', description: 'Transcende limitações temporais', maxStack: 2 },
    temporal_essence: { name: 'Essência Temporal', emoji: '🌀', description: 'Manipula linha do tempo', maxStack: 4 },
    omnipotence_core: { name: 'Núcleo da Onipotência', emoji: '🔮', description: 'Poder absoluto sobre tudo', maxStack: 1 },
    legend_tokens: { name: 'Fichas Lendárias', emoji: '🏆', description: 'Marca de conquistas lendárias', maxStack: 10 },
    challenge_crown: { name: 'Coroa dos Desafios', emoji: '👑', description: 'Símbolo de maestria em desafios', maxStack: 1 },
    transcendence_orb: { name: 'Orbe da Transcendência', emoji: '🌟', description: 'Eleva além dos limites mortais', maxStack: 1 },
    phoenix_essence: { name: 'Essência da Fênix', emoji: '🔥', description: 'Poder de renascimento e recuperação', maxStack: 5 },
    biome_essences: { name: 'Essências de Bioma', emoji: '🌍', description: 'Controla características de biomas', maxStack: 25 },
    construction_materials: { name: 'Materiais de Construção', emoji: '🏗️', description: 'Para construir estruturas avançadas', maxStack: 150 }
};

// Player energy and resources state
let playerState = {
    energy: 100,
    maxEnergy: ENERGY_CONFIG.maxEnergy,
    regenRate: ENERGY_CONFIG.baseRegenRate,
    resources: {},
    activeBonus: [],
    energyHistory: [],
    totalEnergyGenerated: 0,
    totalEnergySpent: 0
};

// Initialize all special resources to 0
Object.keys(SPECIAL_RESOURCES).forEach(resourceId => {
    playerState.resources[resourceId] = 0;
});

// Energy system functions
export function getPlayerEnergy() {
    return playerState.energy;
}

export function getMaxEnergy() {
    return playerState.maxEnergy;
}

export function getEnergyRegenRate() {
    return playerState.regenRate;
}

export function getPlayerResources() {
    return { ...playerState.resources };
}

export function getResourceInfo(resourceId) {
    return SPECIAL_RESOURCES[resourceId] || null;
}

export function getAllResourcesInfo() {
    return SPECIAL_RESOURCES;
}

export function hasEnoughEnergy(cost) {
    return playerState.energy >= cost;
}

export function hasResource(resourceId, amount = 1) {
    return (playerState.resources[resourceId] || 0) >= amount;
}

export function spendEnergy(cost, action = 'unknown') {
    if (!hasEnoughEnergy(cost)) {
        showMessage(`Energia insuficiente! Necessário: ${cost}, Disponível: ${playerState.energy}`, 'error');
        return false;
    }
    
    playerState.energy -= cost;
    playerState.totalEnergySpent += cost;
    
    logToObserver(`Energia gasta: ${cost} (${action}). Energia restante: ${playerState.energy}`);
    updateEnergyDisplay();
    
    return true;
}

export function addEnergy(amount, source = 'unknown') {
    const oldEnergy = playerState.energy;
    playerState.energy = Math.min(playerState.energy + amount, playerState.maxEnergy);
    const actualGain = playerState.energy - oldEnergy;
    
    if (actualGain > 0) {
        playerState.totalEnergyGenerated += actualGain;
        logToObserver(`Energia ganha: ${actualGain} (${source}). Energia atual: ${playerState.energy}`);
        updateEnergyDisplay();
    }
    
    return actualGain;
}

export function addResource(resourceId, amount = 1, source = 'unknown') {
    const resourceInfo = SPECIAL_RESOURCES[resourceId];
    if (!resourceInfo) {
        console.warn(`Recurso desconhecido: ${resourceId}`);
        return false;
    }
    
    const currentAmount = playerState.resources[resourceId] || 0;
    const maxAmount = resourceInfo.maxStack;
    const actualAmount = Math.min(amount, maxAmount - currentAmount);
    
    if (actualAmount > 0) {
        playerState.resources[resourceId] = currentAmount + actualAmount;
        showMessage(`+${actualAmount} ${resourceInfo.name} ${resourceInfo.emoji}`, 'success');
        logToObserver(`Recurso adicionado: ${actualAmount}x ${resourceInfo.name} (${source})`);
        updateResourcesDisplay();
        return true;
    } else {
        showMessage(`${resourceInfo.name} no limite máximo (${maxAmount})`, 'warning');
        return false;
    }
}

export function spendResource(resourceId, amount = 1, action = 'unknown') {
    if (!hasResource(resourceId, amount)) {
        const resourceInfo = SPECIAL_RESOURCES[resourceId];
        const resourceName = resourceInfo ? resourceInfo.name : resourceId;
        showMessage(`${resourceName} insuficiente! Necessário: ${amount}, Disponível: ${playerState.resources[resourceId] || 0}`, 'error');
        return false;
    }
    
    playerState.resources[resourceId] -= amount;
    const resourceInfo = SPECIAL_RESOURCES[resourceId];
    logToObserver(`Recurso gasto: ${amount}x ${resourceInfo.name} (${action})`);
    updateResourcesDisplay();
    
    return true;
}

export function regenerateEnergy() {
    const baseRegen = playerState.regenRate;
    let totalRegen = baseRegen;
    
    // Apply bonuses
    playerState.activeBonus.forEach(bonus => {
        if (ENERGY_CONFIG.bonusMultipliers[bonus]) {
            totalRegen *= ENERGY_CONFIG.bonusMultipliers[bonus];
        }
    });
    
    // Power cores bonus
    const powerCores = playerState.resources.power_cores || 0;
    if (powerCores > 0) {
        totalRegen += powerCores * 0.5; // Each power core adds 0.5 energy per cycle
    }
    
    const energyGained = addEnergy(totalRegen, 'regeneração');
    
    // Track energy history for analysis
    playerState.energyHistory.push({
        timestamp: Date.now(),
        energy: playerState.energy,
        regen: energyGained,
        bonuses: [...playerState.activeBonus]
    });
    
    // Keep only last 100 entries
    if (playerState.energyHistory.length > 100) {
        playerState.energyHistory.shift();
    }
    
    // Track for achievements
    trackEnergyLevel(playerState.energy);
}

export function applyEnergyBonus(bonusType, duration = null) {
    if (!playerState.activeBonus.includes(bonusType)) {
        playerState.activeBonus.push(bonusType);
        logToObserver(`Bônus de energia ativado: ${bonusType}`);
        
        if (duration) {
            setTimeout(() => {
                removeEnergyBonus(bonusType);
            }, duration);
        }
    }
}

export function removeEnergyBonus(bonusType) {
    const index = playerState.activeBonus.indexOf(bonusType);
    if (index > -1) {
        playerState.activeBonus.splice(index, 1);
        logToObserver(`Bônus de energia removido: ${bonusType}`);
    }
}

export function getInterventionCost(interventionType) {
    return ENERGY_CONFIG.interventionCosts[interventionType] || 10;
}

export function canAffordIntervention(interventionType) {
    const cost = getInterventionCost(interventionType);
    return hasEnoughEnergy(cost);
}

export function performIntervention(interventionType, customCost = null) {
    const cost = customCost || getInterventionCost(interventionType);
    
    if (spendEnergy(cost, interventionType)) {
        logToObserver(`Intervenção realizada: ${interventionType}`);
        return true;
    }
    
    return false;
}

// Special resource effects
export function applyResourceEffect(resourceId, targetElement = null, ecosystem = null) {
    const resourceInfo = SPECIAL_RESOURCES[resourceId];
    if (!resourceInfo || !hasResource(resourceId)) {
        return false;
    }
    
    let effectApplied = false;
    
    switch (resourceId) {
        case 'fertile_soil':
            if (targetElement && targetElement.type === 'plant') {
                targetElement.growthRate = (targetElement.growthRate || 1) * 1.5;
                effectApplied = true;
            }
            break;
            
        case 'life_essence':
            if (targetElement && targetElement.type === 'creature') {
                targetElement.reproductionChance = Math.min((targetElement.reproductionChance || 0.01) * 1.3, 0.1);
                effectApplied = true;
            }
            break;
            
        case 'pure_water':
            if (ecosystem) {
                ecosystem.elements.filter(e => e.type === 'water').forEach(water => {
                    water.purity = Math.min((water.purity || 0.8) + 0.2, 1.0);
                });
                effectApplied = true;
            }
            break;
            
        case 'storm_essence':
            // Can be used to trigger or control weather events
            effectApplied = true;
            break;
            
        case 'harmony_crystals':
            if (ecosystem) {
                // Temporarily boost ecosystem stability
                ecosystem.stabilityBonus = (ecosystem.stabilityBonus || 0) + 10;
                effectApplied = true;
            }
            break;
            
        case 'evolution_catalyst':
            if (targetElement && targetElement.genome) {
                // Force beneficial mutations
                targetElement.genome.mutationRate *= 2;
                targetElement.genome.beneficialMutationChance = 0.8;
                effectApplied = true;
            }
            break;
            
        default:
            // Generic resource effect
            effectApplied = true;
            break;
    }
    
    if (effectApplied) {
        spendResource(resourceId, 1, 'efeito aplicado');
        showMessage(`${resourceInfo.emoji} ${resourceInfo.name} aplicado!`, 'success');
        return true;
    }
    
    return false;
}

// Rare event resource generation
export function generateEventResources(eventType, intensity = 1) {
    const resourceRewards = {
        'volcanic_eruption': ['storm_essence', 'rare_materials'],
        'meteor_impact': ['time_crystals', 'rare_materials'],
        'aurora': ['harmony_crystals', 'pure_water'],
        'earthquake': ['balance_stones', 'construction_materials'],
        'flood': ['pure_water', 'life_essence'],
        'drought': ['fertile_soil', 'common_materials'],
        'blizzard': ['time_crystals', 'storm_essence'],
        'solar_flare': ['power_cores', 'evolution_catalyst']
    };
    
    const rewards = resourceRewards[eventType];
    if (rewards) {
        rewards.forEach(resourceId => {
            const amount = Math.floor(Math.random() * intensity) + 1;
            addResource(resourceId, amount, `evento: ${eventType}`);
        });
    }
}

// Energy system UI updates
let energyDisplayElement = null;
let resourcesDisplayElement = null;

export function initEnergyDisplay(energyElement, resourcesElement = null) {
    energyDisplayElement = energyElement;
    resourcesDisplayElement = resourcesElement;
    updateEnergyDisplay();
    updateResourcesDisplay();
}

function updateEnergyDisplay() {
    if (energyDisplayElement) {
        const percentage = Math.floor((playerState.energy / playerState.maxEnergy) * 100);
        energyDisplayElement.innerHTML = `
            <div class="energy-bar">
                <div class="energy-fill" style="width: ${percentage}%"></div>
                <span class="energy-text">⚡ ${playerState.energy}/${playerState.maxEnergy}</span>
            </div>
            <div class="energy-regen">+${playerState.regenRate.toFixed(1)}/ciclo</div>
        `;
        
        // Add color coding based on energy level
        const fillElement = energyDisplayElement.querySelector('.energy-fill');
        if (fillElement) {
            if (percentage > 75) {
                fillElement.style.backgroundColor = '#4CAF50';
            } else if (percentage > 50) {
                fillElement.style.backgroundColor = '#FF9800';
            } else if (percentage > 25) {
                fillElement.style.backgroundColor = '#FF5722';
            } else {
                fillElement.style.backgroundColor = '#F44336';
            }
        }
    }
}

function updateResourcesDisplay() {
    if (resourcesDisplayElement) {
        const activeResources = Object.entries(playerState.resources)
            .filter(([_, amount]) => amount > 0)
            .sort(([a], [b]) => a.localeCompare(b));
        
        if (activeResources.length === 0) {
            resourcesDisplayElement.innerHTML = '<p class="no-resources">Nenhum recurso especial</p>';
            return;
        }
        
        let html = '<div class="resources-grid">';
        activeResources.forEach(([resourceId, amount]) => {
            const info = SPECIAL_RESOURCES[resourceId];
            if (info) {
                html += `
                    <div class="resource-item" title="${info.description}">
                        <span class="resource-emoji">${info.emoji}</span>
                        <span class="resource-amount">${amount}</span>
                        <span class="resource-name">${info.name}</span>
                    </div>
                `;
            }
        });
        html += '</div>';
        
        resourcesDisplayElement.innerHTML = html;
    }
}

// Save and load functions
export function saveEnergySystem() {
    return {
        playerState: { ...playerState },
        timestamp: Date.now()
    };
}

export function loadEnergySystem(savedData) {
    if (savedData && savedData.playerState) {
        // Merge saved state with current state, preserving structure
        Object.assign(playerState, savedData.playerState);
        
        // Ensure all resources exist
        Object.keys(SPECIAL_RESOURCES).forEach(resourceId => {
            if (playerState.resources[resourceId] === undefined) {
                playerState.resources[resourceId] = 0;
            }
        });
        
        updateEnergyDisplay();
        updateResourcesDisplay();
        logToObserver("Sistema de energia carregado.");
    }
}

// Statistics and analysis
export function getEnergyStats() {
    return {
        currentEnergy: playerState.energy,
        maxEnergy: playerState.maxEnergy,
        regenRate: playerState.regenRate,
        totalGenerated: playerState.totalEnergyGenerated,
        totalSpent: playerState.totalEnergySpent,
        netEnergy: playerState.totalEnergyGenerated - playerState.totalEnergySpent,
        activeBonuses: [...playerState.activeBonus],
        resourceCount: Object.values(playerState.resources).reduce((sum, amount) => sum + amount, 0),
        uniqueResources: Object.values(playerState.resources).filter(amount => amount > 0).length
    };
}

export function getResourceStats() {
    const stats = {
        totalResources: 0,
        uniqueResources: 0,
        resourcesByType: {},
        mostValuableResource: null,
        rarest: []
    };
    
    Object.entries(playerState.resources).forEach(([resourceId, amount]) => {
        if (amount > 0) {
            stats.totalResources += amount;
            stats.uniqueResources++;
            
            const info = SPECIAL_RESOURCES[resourceId];
            if (info) {
                stats.resourcesByType[resourceId] = {
                    name: info.name,
                    amount,
                    maxStack: info.maxStack,
                    percentage: Math.floor((amount / info.maxStack) * 100)
                };
                
                // Find rarest resources (low max stack)
                if (info.maxStack <= 5) {
                    stats.rarest.push({ resourceId, ...info, amount });
                }
            }
        }
    });
    
    return stats;
}

// Initialize energy system
export function initEnergySystem() {
    // Set up energy regeneration interval
    setInterval(regenerateEnergy, 5000); // Regenerate every 5 seconds
    logToObserver("Sistema de energia inicializado.");
}

// Export energy configuration for other modules
export function getEnergyConfig() {
    return ENERGY_CONFIG;
}