// js/techTree.js

import { showMessage, logToObserver } from './utils.js';

// Basic Technology Tree
const technologies = {
    'enhanced_photosynthesis': {
        id: 'enhanced_photosynthesis',
        name: 'Fotossíntese Aprimorada',
        description: 'Plantas crescem 20% mais rápido e produzem mais oxigênio.',
        cost: { iron: 10, carbon: 5 },
        unlocked: false,
        prerequisites: [],
        category: 'biological',
        tier: 1,
        effect: { type: 'plant_growth_multiplier', value: 1.2 }
    },
    'mineral_extraction': {
        id: 'mineral_extraction',
        name: 'Extração Mineral',
        description: 'Melhora a eficiência de extração de minerais das rochas.',
        cost: { iron: 15, silicon: 10 },
        unlocked: false,
        prerequisites: ['enhanced_photosynthesis'],
        category: 'technological',
        tier: 2,
        effect: { type: 'mineral_extraction_bonus', value: 0.1 }
    },
    'creature_adaptation': {
        id: 'creature_adaptation',
        name: 'Adaptação de Criaturas',
        description: 'Criaturas consomem 15% menos energia para sobreviver.',
        cost: { carbon: 12, iron: 8 },
        unlocked: false,
        prerequisites: [],
        category: 'biological',
        tier: 1,
        effect: { type: 'creature_energy_reduction', value: 0.15 }
    },
    'basic_tools': {
        id: 'basic_tools',
        name: 'Ferramentas Básicas',
        description: 'Tribos desenvolvem ferramentas simples, aumentando eficiência de coleta.',
        cost: { iron: 20, silicon: 15 },
        unlocked: false,
        prerequisites: [],
        category: 'technological',
        tier: 1,
        effect: { type: 'tribe_resource_efficiency', value: 0.1 }
    }
};

let unlockedTechnologies = {};

// Technology categories for organization
const technologyCategories = {
    biological: { name: 'Biológica', color: '#4CAF50' },
    technological: { name: 'Tecnológica', color: '#2196F3' },
    environmental: { name: 'Ambiental', color: '#FF9800' },
    advanced: { name: 'Avançada', color: '#9C27B0' }
};

// Technology Tree Management Class
class TechnologyTree {
    constructor() {
        this.technologies = technologies;
        this.unlockedTechnologies = unlockedTechnologies;
        this.loadProgress();
    }

    // Check if a technology can be unlocked
    canUnlock(techId) {
        const tech = this.technologies[techId];
        if (!tech || tech.unlocked) return false;

        // Check prerequisites
        for (const prereqId of tech.prerequisites) {
            if (!this.unlockedTechnologies[prereqId]) {
                return false;
            }
        }

        return true;
    }

    // Unlock a technology
    unlock(techId, currentMinerals) {
        const tech = this.technologies[techId];
        if (!tech || !this.canUnlock(techId)) {
            showMessage('Não é possível desbloquear esta tecnologia.', 'error');
            return false;
        }

        // Check if player has enough resources
        for (const [mineral, cost] of Object.entries(tech.cost)) {
            if ((currentMinerals[mineral] || 0) < cost) {
                showMessage(`Minerais insuficientes: ${mineral}`, 'error');
                return false;
            }
        }

        // Deduct costs and unlock
        for (const [mineral, cost] of Object.entries(tech.cost)) {
            currentMinerals[mineral] -= cost;
        }

        tech.unlocked = true;
        this.unlockedTechnologies[techId] = true;
        
        showMessage(`Tecnologia desbloqueada: ${tech.name}!`, 'success');
        logToObserver(`Tecnologia desbloqueada: ${tech.name}`);
        
        this.saveProgress();
        return true;
    }

    // Get active technology effects
    getActiveEffects() {
        const effects = {};
        
        for (const [techId, unlocked] of Object.entries(this.unlockedTechnologies)) {
            if (unlocked && this.technologies[techId]) {
                const effect = this.technologies[techId].effect;
                if (effect) {
                    effects[effect.type] = (effects[effect.type] || 0) + effect.value;
                }
            }
        }
        
        return effects;
    }

    // Save progress to localStorage
    saveProgress() {
        try {
            localStorage.setItem('techTreeProgress', JSON.stringify(this.unlockedTechnologies));
            logToObserver('Progresso da árvore tecnológica salvo.');
        } catch (e) {
            console.error('Erro ao salvar progresso da árvore tecnológica:', e);
        }
    }

    // Load progress from localStorage
    loadProgress() {
        try {
            const saved = localStorage.getItem('techTreeProgress');
            if (saved) {
                this.unlockedTechnologies = JSON.parse(saved);
                
                // Update technology objects
                for (const [techId, unlocked] of Object.entries(this.unlockedTechnologies)) {
                    if (this.technologies[techId]) {
                        this.technologies[techId].unlocked = unlocked;
                    }
                }
                
                logToObserver('Progresso da árvore tecnológica carregado.');
            }
        } catch (e) {
            console.error('Erro ao carregar progresso da árvore tecnológica:', e);
        }
    }

    // Reset all progress
    reset() {
        this.unlockedTechnologies = {};
        for (const tech of Object.values(this.technologies)) {
            tech.unlocked = false;
        }
        this.saveProgress();
        logToObserver('Árvore tecnológica resetada.');
    }
}

// Create global technology tree instance
const technologyTree = new TechnologyTree();

// Export functions for compatibility with existing code
export function getTechnologies() {
    return technologies;
}

export function getUnlockedTechnologies() {
    return unlockedTechnologies;
}

export function unlockTechnology(techId, currentMinerals) {
    return technologyTree.unlock(techId, currentMinerals);
}

export function getActiveTechnologyEffects() {
    return technologyTree.getActiveEffects();
}

export function resetTechnologyTree() {
    technologyTree.reset();
}

export function loadTechnologies(savedData) {
    if (savedData && savedData.technologies) {
        technologyTree.unlockedTechnologies = savedData.technologies;
        
        // Update technology objects
        for (const [techId, unlocked] of Object.entries(savedData.technologies)) {
            if (technologyTree.technologies[techId]) {
                technologyTree.technologies[techId].unlocked = unlocked;
            }
        }
        
        logToObserver('Tecnologias carregadas do save.');
    } else {
        // Load from localStorage if no saved data provided
        technologyTree.loadProgress();
    }
}

// Export for use in other modules
export { 
    technologies, 
    technologyCategories, 
    TechnologyTree, 
    technologyTree 
};

// Auto-load progress on initialization
technologyTree.loadProgress();