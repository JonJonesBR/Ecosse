/**
 * Tribal Culture System - Manages cultural evolution and development of tribes
 * This system handles cultural aspects, traditions, beliefs, and technological development
 */

import { eventSystem, EventTypes } from './eventSystem.js';
import { logToObserver } from '../utils.js';

class TribalCultureSystem {
    constructor() {
        this.tribalCultures = new Map();
        this.culturalEvents = [];
        this.isInitialized = false;
        
        // Cultural development stages
        this.developmentStages = {
            1: { name: 'Primitiva', description: 'Caçadores-coletores básicos' },
            2: { name: 'Tribal', description: 'Organização social básica' },
            3: { name: 'Agrícola', description: 'Desenvolvimento da agricultura' },
            4: { name: 'Artesanal', description: 'Especialização em ofícios' },
            5: { name: 'Avançada', description: 'Tecnologia e arte complexas' }
        };
        
        // Cultural aspects that can be developed
        this.culturalAspects = {
            technology: {
                name: 'Tecnologia',
                developments: [
                    'ferramentas de pedra',
                    'uso do fogo',
                    'agricultura básica',
                    'metalurgia',
                    'construção avançada'
                ]
            },
            art: {
                name: 'Arte',
                developments: [
                    'pinturas corporais',
                    'arte rupestre',
                    'esculturas em madeira',
                    'cerâmica decorativa',
                    'arquitetura monumental'
                ]
            },
            religion: {
                name: 'Religião',
                developments: [
                    'adoração da natureza',
                    'rituais sazonais',
                    'xamanismo',
                    'templos sagrados',
                    'mitologia complexa'
                ]
            },
            social: {
                name: 'Organização Social',
                developments: [
                    'hierarquia básica',
                    'divisão do trabalho',
                    'sistema de liderança',
                    'leis tribais',
                    'diplomacia inter-tribal'
                ]
            },
            knowledge: {
                name: 'Conhecimento',
                developments: [
                    'observação da natureza',
                    'medicina herbal',
                    'astronomia básica',
                    'escrita primitiva',
                    'educação formal'
                ]
            }
        };
        
        // Traditions that can emerge
        this.traditions = [
            {
                name: 'Festival da Colheita',
                description: 'Celebração anual dos frutos da terra',
                requirements: ['agriculture'],
                effects: { happiness: 10, productivity: 5 }
            },
            {
                name: 'Ritual da Chuva',
                description: 'Cerimônia para invocar as chuvas',
                requirements: ['religion'],
                effects: { weather_influence: 5, unity: 10 }
            },
            {
                name: 'Conselho dos Anciãos',
                description: 'Sistema de governança baseado na sabedoria',
                requirements: ['social'],
                effects: { stability: 15, wisdom: 10 }
            },
            {
                name: 'Caça Ritual',
                description: 'Práticas sagradas de caça sustentável',
                requirements: ['religion', 'knowledge'],
                effects: { sustainability: 20, respect: 10 }
            },
            {
                name: 'Troca de Conhecimento',
                description: 'Intercâmbio cultural com outras tribos',
                requirements: ['social', 'knowledge'],
                effects: { learning: 15, diplomacy: 10 }
            }
        ];
        
        // Beliefs that can develop
        this.beliefs = [
            {
                name: 'Harmonia Natural',
                description: 'Crença na importância do equilíbrio ecológico',
                effects: { environmental_care: 20, sustainability: 15 }
            },
            {
                name: 'Ancestralidade',
                description: 'Veneração dos antepassados e sua sabedoria',
                effects: { tradition_preservation: 15, unity: 10 }
            },
            {
                name: 'Espíritos da Natureza',
                description: 'Crença em espíritos que habitam elementos naturais',
                effects: { nature_connection: 20, mysticism: 15 }
            },
            {
                name: 'Ciclos Eternos',
                description: 'Compreensão dos ciclos naturais e temporais',
                effects: { patience: 15, planning: 10 }
            },
            {
                name: 'Unidade Tribal',
                description: 'Forte senso de comunidade e cooperação',
                effects: { cooperation: 20, loyalty: 15 }
            }
        ];
        
        // Behavioral patterns
        this.behaviors = [
            {
                name: 'Caça Cooperativa',
                description: 'Trabalho em equipe para caçar grandes presas',
                requirements: ['social'],
                effects: { hunting_efficiency: 25, teamwork: 15 }
            },
            {
                name: 'Agricultura Rotativa',
                description: 'Práticas sustentáveis de cultivo',
                requirements: ['technology', 'knowledge'],
                effects: { food_production: 20, soil_health: 15 }
            },
            {
                name: 'Defesa Territorial',
                description: 'Proteção organizada do território tribal',
                requirements: ['social'],
                effects: { territory_control: 20, security: 15 }
            },
            {
                name: 'Cuidado Comunitário',
                description: 'Cuidado coletivo de crianças e idosos',
                requirements: ['social'],
                effects: { population_growth: 10, wisdom_transfer: 15 }
            }
        ];
    }
    
    /**
     * Initialize the tribal culture system
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Tribal Culture System...');
        
        // Subscribe to tribal events
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Tribal Culture System initialized');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for new tribe creation
        eventSystem.subscribe(EventTypes.ELEMENT_CREATED, (data) => {
            if (data.type === 'tribe') {
                this.initializeTribalCulture(data.id);
            }
        });
        
        // Listen for tribe removal
        eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
            if (data.type === 'tribe') {
                this.removeTribalCulture(data.id);
            }
        });
        
        // Listen for population changes
        eventSystem.subscribe(EventTypes.POPULATION_CHANGE, (data) => {
            if (data.species === 'tribe') {
                this.handlePopulationChange(data);
            }
        });
    }
    
    /**
     * Initialize cultural data for a new tribe
     */
    initializeTribalCulture(tribeId) {
        const culture = {
            id: tribeId,
            name: this.generateTribeName(),
            developmentLevel: 1,
            population: 10,
            happiness: 50,
            stability: 50,
            
            // Cultural aspects
            developments: {
                technology: [],
                art: [],
                religion: [],
                social: [],
                knowledge: []
            },
            
            // Active traditions
            traditions: [],
            
            // Core beliefs
            beliefs: [],
            
            // Behavioral patterns
            behaviors: [],
            
            // Cultural stats
            stats: {
                unity: 50,
                wisdom: 30,
                creativity: 40,
                adaptability: 35,
                spirituality: 45
            },
            
            // Development history
            history: [],
            
            // Last update time
            lastUpdate: Date.now()
        };
        
        this.tribalCultures.set(tribeId, culture);
        
        // Generate initial cultural development
        this.developInitialCulture(culture);
        
        logToObserver(`🏛️ A tribo ${culture.name} estabeleceu sua cultura inicial`);
        
        // Publish cultural initialization event
        eventSystem.publish('tribal_culture:initialized', {
            tribeId: tribeId,
            tribeName: culture.name,
            culture: culture
        });
    }
    
    /**
     * Develop initial cultural aspects for a new tribe
     */
    developInitialCulture(culture) {
        // Start with basic developments
        culture.developments.technology.push('ferramentas de pedra');
        culture.developments.social.push('hierarquia básica');
        culture.developments.religion.push('adoração da natureza');
        
        // Add initial belief
        const initialBelief = this.beliefs[Math.floor(Math.random() * 2)]; // First two beliefs
        culture.beliefs.push(initialBelief);
        
        // Add initial behavior
        const initialBehavior = this.behaviors[0]; // Cooperative hunting
        culture.behaviors.push(initialBehavior);
        
        // Record in history
        culture.history.push({
            timestamp: Date.now(),
            event: 'Fundação da tribo',
            description: `A tribo ${culture.name} foi estabelecida com cultura inicial`
        });
    }
    
    /**
     * Update tribal culture development
     */
    updateTribalCulture(tribeId, tribeElement) {
        const culture = this.tribalCultures.get(tribeId);
        if (!culture) return;
        
        // Update population
        culture.population = tribeElement.population;
        
        // Check for cultural development opportunities
        this.checkCulturalDevelopment(culture, tribeElement);
        
        // Update cultural stats based on developments
        this.updateCulturalStats(culture);
        
        // Check for new traditions
        this.checkNewTraditions(culture);
        
        // Check for belief evolution
        this.checkBeliefEvolution(culture);
        
        // Check for behavioral changes
        this.checkBehavioralChanges(culture);
        
        culture.lastUpdate = Date.now();
    }
    
    /**
     * Check for cultural development opportunities
     */
    checkCulturalDevelopment(culture, tribeElement) {
        const developmentChance = this.calculateDevelopmentChance(culture, tribeElement);
        
        if (Math.random() < developmentChance) {
            const aspectToImprove = this.selectAspectForDevelopment(culture);
            if (aspectToImprove) {
                this.developCulturalAspect(culture, aspectToImprove);
            }
        }
    }
    
    /**
     * Calculate chance for cultural development
     */
    calculateDevelopmentChance(culture, tribeElement) {
        let baseChance = 0.001; // 0.1% base chance
        
        // Increase chance based on population
        baseChance += (culture.population / 1000);
        
        // Increase chance based on stability
        baseChance += (culture.stability / 10000);
        
        // Increase chance based on development level
        baseChance += (culture.developmentLevel / 1000);
        
        // Increase chance based on tribe health
        baseChance += (tribeElement.health / 10000);
        
        return Math.min(baseChance, 0.01); // Cap at 1%
    }
    
    /**
     * Select which cultural aspect to develop
     */
    selectAspectForDevelopment(culture) {
        const aspects = Object.keys(this.culturalAspects);
        const availableAspects = [];
        
        for (const aspect of aspects) {
            const currentDevelopments = culture.developments[aspect].length;
            const maxDevelopments = this.culturalAspects[aspect].developments.length;
            
            if (currentDevelopments < maxDevelopments) {
                // Weight by development level and current progress
                const weight = Math.max(1, culture.developmentLevel - currentDevelopments);
                for (let i = 0; i < weight; i++) {
                    availableAspects.push(aspect);
                }
            }
        }
        
        if (availableAspects.length === 0) return null;
        
        return availableAspects[Math.floor(Math.random() * availableAspects.length)];
    }
    
    /**
     * Develop a specific cultural aspect
     */
    developCulturalAspect(culture, aspect) {
        const aspectData = this.culturalAspects[aspect];
        const currentLevel = culture.developments[aspect].length;
        
        if (currentLevel >= aspectData.developments.length) return;
        
        const newDevelopment = aspectData.developments[currentLevel];
        culture.developments[aspect].push(newDevelopment);
        
        // Record in history
        culture.history.push({
            timestamp: Date.now(),
            event: 'Desenvolvimento Cultural',
            description: `A tribo ${culture.name} desenvolveu: ${newDevelopment}`,
            aspect: aspect
        });
        
        // Check for level up
        this.checkLevelUp(culture);
        
        logToObserver(`🎭 A tribo ${culture.name} desenvolveu: ${newDevelopment}`);
        
        // Publish development event
        eventSystem.publish('tribal_culture:development', {
            tribeId: culture.id,
            tribeName: culture.name,
            aspect: aspect,
            development: newDevelopment,
            level: currentLevel + 1
        });
    }
    
    /**
     * Check if tribe should level up
     */
    checkLevelUp(culture) {
        const totalDevelopments = Object.values(culture.developments)
            .reduce((sum, devs) => sum + devs.length, 0);
        
        const requiredDevelopments = culture.developmentLevel * 3;
        
        if (totalDevelopments >= requiredDevelopments && culture.developmentLevel < 5) {
            culture.developmentLevel++;
            
            const stageInfo = this.developmentStages[culture.developmentLevel];
            
            culture.history.push({
                timestamp: Date.now(),
                event: 'Evolução Cultural',
                description: `A tribo ${culture.name} evoluiu para o estágio ${stageInfo.name}: ${stageInfo.description}`
            });
            
            logToObserver(`🏆 A tribo ${culture.name} evoluiu para o estágio ${stageInfo.name}!`);
            
            // Publish level up event
            eventSystem.publish('tribal_culture:level_up', {
                tribeId: culture.id,
                tribeName: culture.name,
                newLevel: culture.developmentLevel,
                stageName: stageInfo.name,
                stageDescription: stageInfo.description
            });
        }
    }
    
    /**
     * Update cultural stats based on developments
     */
    updateCulturalStats(culture) {
        // Reset stats to base values
        culture.stats = {
            unity: 50,
            wisdom: 30,
            creativity: 40,
            adaptability: 35,
            spirituality: 45
        };
        
        // Apply bonuses from developments
        const techLevel = culture.developments.technology.length;
        const artLevel = culture.developments.art.length;
        const religionLevel = culture.developments.religion.length;
        const socialLevel = culture.developments.social.length;
        const knowledgeLevel = culture.developments.knowledge.length;
        
        culture.stats.unity += socialLevel * 5 + religionLevel * 3;
        culture.stats.wisdom += knowledgeLevel * 8 + religionLevel * 2;
        culture.stats.creativity += artLevel * 6 + techLevel * 2;
        culture.stats.adaptability += techLevel * 4 + knowledgeLevel * 3;
        culture.stats.spirituality += religionLevel * 7 + artLevel * 2;
        
        // Apply bonuses from beliefs
        culture.beliefs.forEach(belief => {
            Object.entries(belief.effects).forEach(([stat, bonus]) => {
                if (culture.stats[stat] !== undefined) {
                    culture.stats[stat] += bonus;
                }
            });
        });
        
        // Cap stats at 100
        Object.keys(culture.stats).forEach(stat => {
            culture.stats[stat] = Math.min(culture.stats[stat], 100);
        });
    }
    
    /**
     * Check for new traditions
     */
    checkNewTraditions(culture) {
        if (Math.random() < 0.0005) { // 0.05% chance
            const availableTraditions = this.traditions.filter(tradition => {
                // Check if tradition is already active
                if (culture.traditions.some(t => t.name === tradition.name)) return false;
                
                // Check requirements
                return tradition.requirements.every(req => {
                    return culture.developments[req] && culture.developments[req].length > 0;
                });
            });
            
            if (availableTraditions.length > 0) {
                const newTradition = availableTraditions[Math.floor(Math.random() * availableTraditions.length)];
                culture.traditions.push(newTradition);
                
                culture.history.push({
                    timestamp: Date.now(),
                    event: 'Nova Tradição',
                    description: `A tribo ${culture.name} estabeleceu a tradição: ${newTradition.name}`
                });
                
                logToObserver(`🎪 A tribo ${culture.name} estabeleceu a tradição: ${newTradition.name}`);
                
                eventSystem.publish('tribal_culture:tradition_established', {
                    tribeId: culture.id,
                    tribeName: culture.name,
                    tradition: newTradition
                });
            }
        }
    }
    
    /**
     * Check for belief evolution
     */
    checkBeliefEvolution(culture) {
        if (Math.random() < 0.0003 && culture.beliefs.length < 3) { // 0.03% chance, max 3 beliefs
            const availableBeliefs = this.beliefs.filter(belief => {
                return !culture.beliefs.some(b => b.name === belief.name);
            });
            
            if (availableBeliefs.length > 0) {
                const newBelief = availableBeliefs[Math.floor(Math.random() * availableBeliefs.length)];
                culture.beliefs.push(newBelief);
                
                culture.history.push({
                    timestamp: Date.now(),
                    event: 'Nova Crença',
                    description: `A tribo ${culture.name} desenvolveu a crença: ${newBelief.name}`
                });
                
                logToObserver(`🙏 A tribo ${culture.name} desenvolveu a crença: ${newBelief.name}`);
                
                eventSystem.publish('tribal_culture:belief_developed', {
                    tribeId: culture.id,
                    tribeName: culture.name,
                    belief: newBelief
                });
            }
        }
    }
    
    /**
     * Check for behavioral changes
     */
    checkBehavioralChanges(culture) {
        if (Math.random() < 0.0004) { // 0.04% chance
            const availableBehaviors = this.behaviors.filter(behavior => {
                // Check if behavior is already active
                if (culture.behaviors.some(b => b.name === behavior.name)) return false;
                
                // Check requirements
                return behavior.requirements.every(req => {
                    return culture.developments[req] && culture.developments[req].length > 0;
                });
            });
            
            if (availableBehaviors.length > 0) {
                const newBehavior = availableBehaviors[Math.floor(Math.random() * availableBehaviors.length)];
                culture.behaviors.push(newBehavior);
                
                culture.history.push({
                    timestamp: Date.now(),
                    event: 'Novo Comportamento',
                    description: `A tribo ${culture.name} adotou o comportamento: ${newBehavior.name}`
                });
                
                logToObserver(`🤝 A tribo ${culture.name} adotou o comportamento: ${newBehavior.name}`);
                
                eventSystem.publish('tribal_culture:behavior_adopted', {
                    tribeId: culture.id,
                    tribeName: culture.name,
                    behavior: newBehavior
                });
            }
        }
    }
    
    /**
     * Handle population changes
     */
    handlePopulationChange(data) {
        const culture = this.tribalCultures.get(data.tribeId);
        if (!culture) return;
        
        culture.population = data.newPopulation;
        
        // Significant population changes can affect culture
        if (Math.abs(data.change) > 5) {
            const event = data.change > 0 ? 'Crescimento Populacional' : 'Declínio Populacional';
            const description = data.change > 0 
                ? `A tribo ${culture.name} experimentou um período de crescimento`
                : `A tribo ${culture.name} passou por dificuldades populacionais`;
            
            culture.history.push({
                timestamp: Date.now(),
                event: event,
                description: description
            });
        }
    }
    
    /**
     * Remove tribal culture when tribe is destroyed
     */
    removeTribalCulture(tribeId) {
        const culture = this.tribalCultures.get(tribeId);
        if (culture) {
            logToObserver(`💀 A cultura da tribo ${culture.name} foi perdida para sempre`);
            
            eventSystem.publish('tribal_culture:lost', {
                tribeId: tribeId,
                tribeName: culture.name,
                culture: culture
            });
            
            this.tribalCultures.delete(tribeId);
        }
    }
    
    /**
     * Generate a unique tribe name
     */
    generateTribeName() {
        const prefixes = [
            'Kala', 'Nara', 'Zeph', 'Tera', 'Aqua', 'Pyro', 'Aero', 'Geo',
            'Luna', 'Sola', 'Vega', 'Nova', 'Orion', 'Lyra', 'Cygn', 'Draco'
        ];
        const suffixes = [
            'ni', 'ra', 'th', 'ka', 'ma', 'da', 'sa', 'ta',
            'rim', 'lon', 'dor', 'wen', 'mir', 'gal', 'eth', 'oth'
        ];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return prefix + suffix;
    }
    
    /**
     * Get tribal culture data
     */
    getTribalCulture(tribeId) {
        return this.tribalCultures.get(tribeId);
    }
    
    /**
     * Get all tribal cultures
     */
    getAllTribalCultures() {
        return Array.from(this.tribalCultures.values());
    }
    
    /**
     * Get cultural summary for a tribe
     */
    getCulturalSummary(tribeId) {
        const culture = this.tribalCultures.get(tribeId);
        if (!culture) return null;
        
        const stage = this.developmentStages[culture.developmentLevel];
        const totalDevelopments = Object.values(culture.developments)
            .reduce((sum, devs) => sum + devs.length, 0);
        
        return {
            name: culture.name,
            stage: stage.name,
            stageDescription: stage.description,
            population: culture.population,
            developmentLevel: culture.developmentLevel,
            totalDevelopments: totalDevelopments,
            traditions: culture.traditions.length,
            beliefs: culture.beliefs.length,
            behaviors: culture.behaviors.length,
            stats: culture.stats
        };
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        const cultures = Array.from(this.tribalCultures.values());
        
        return {
            totalTribes: cultures.length,
            averageLevel: cultures.length > 0 
                ? cultures.reduce((sum, c) => sum + c.developmentLevel, 0) / cultures.length 
                : 0,
            totalTraditions: cultures.reduce((sum, c) => sum + c.traditions.length, 0),
            totalBeliefs: cultures.reduce((sum, c) => sum + c.beliefs.length, 0),
            totalBehaviors: cultures.reduce((sum, c) => sum + c.behaviors.length, 0),
            advancedTribes: cultures.filter(c => c.developmentLevel >= 4).length
        };
    }
}

// Create singleton instance
export const tribalCultureSystem = new TribalCultureSystem();

// Export the class for testing
export const TribalCultureSystemClass = TribalCultureSystem;

// Initialize the system
tribalCultureSystem.initialize();