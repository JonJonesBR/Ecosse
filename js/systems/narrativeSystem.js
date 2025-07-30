/**
 * Narrative System - Generates dynamic narratives based on ecosystem events
 * This system creates contextual stories, tracks historical events, and manages narrative consequences
 */

import { eventSystem, EventTypes } from './eventSystem.js';
import { logToObserver } from '../utils.js';

class NarrativeSystem {
    constructor() {
        this.eventHistory = [];
        this.narrativeEvents = [];
        this.culturalEvolution = new Map(); // Track tribal cultural development
        this.narrativeConsequences = [];
        this.maxHistorySize = 500;
        this.isInitialized = false;
        
        // Narrative templates for different event types
        this.narrativeTemplates = {
            element_created: [
                "Um novo {element} surge no {location}, trazendo mudanças inesperadas ao ecossistema.",
                "Os habitantes locais observam com curiosidade o aparecimento de {element} em {location}.",
                "A chegada de {element} em {location} marca o início de uma nova era para a região."
            ],
            element_removed: [
                "O desaparecimento de {element} em {location} deixa um vazio que será sentido por gerações.",
                "A ausência de {element} em {location} força as outras espécies a se adaptarem rapidamente.",
                "Com a partida de {element}, {location} nunca mais será o mesmo."
            ],
            weather_changed: [
                "Os ventos trazem {weather} para a região, alterando o ritmo da vida local.",
                "Uma mudança climática transforma o ambiente: {weather} domina os céus.",
                "A natureza responde à chegada de {weather} com uma dança de adaptação."
            ],
            population_change: [
                "A população de {species} {change} dramaticamente, causando ondas de mudança no ecossistema.",
                "Os números de {species} {change}, criando novas oportunidades e desafios.",
                "Uma transformação demográfica: {species} {change} em resposta às condições ambientais."
            ],
            tribal_evolution: [
                "Uma nova civilização nasce: a tribo {tribeName} desenvolve {culturalAspect}.",
                "Os {tribeName} descobrem {culturalAspect}, marcando um marco em sua evolução cultural.",
                "A sabedoria ancestral dos {tribeName} se manifesta através de {culturalAspect}."
            ]
        };
        
        // Cultural aspects for tribal evolution
        this.culturalAspects = [
            "rituais de adoração à natureza",
            "técnicas avançadas de agricultura",
            "arte rupestre representando o ecossistema",
            "tradições de caça sustentável",
            "cerimônias de celebração das estações",
            "conhecimento sobre plantas medicinais",
            "sistemas de comunicação com outras espécies",
            "arquitetura harmoniosa com o ambiente",
            "lendas sobre os criadores do mundo",
            "práticas de conservação dos recursos"
        ];
        
        // Location descriptors
        this.locationDescriptors = [
            "nas planícies verdejantes",
            "junto às águas cristalinas",
            "nas montanhas rochosas",
            "nos vales profundos",
            "nas terras áridas",
            "perto das nascentes",
            "nas florestas densas",
            "nos campos abertos",
            "nas regiões pantanosas",
            "nos planaltos elevados"
        ];
    }
    
    /**
     * Initialize the narrative system and set up event listeners
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Narrative System...');
        
        // Subscribe to relevant events
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Narrative System initialized');
    }
    
    /**
     * Set up event listeners for narrative generation
     */
    setupEventListeners() {
        // Listen for element creation/removal
        eventSystem.subscribe(EventTypes.ELEMENT_CREATED, (data) => {
            this.handleElementEvent('created', data);
        });
        
        eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
            this.handleElementEvent('removed', data);
        });
        
        // Listen for weather changes
        eventSystem.subscribe(EventTypes.WEATHER_CHANGED, (data) => {
            this.handleWeatherEvent(data);
        });
        
        // Listen for population changes
        eventSystem.subscribe(EventTypes.POPULATION_CHANGE, (data) => {
            this.handlePopulationEvent(data);
        });
        
        // Listen for tribal events
        eventSystem.subscribe(EventTypes.GROUP_FORMED, (data) => {
            this.handleTribalEvent('formation', data);
        });
        
        // Listen for significant ecosystem changes
        eventSystem.subscribe(EventTypes.TROPHIC_CASCADE, (data) => {
            this.handleEcosystemEvent('cascade', data);
        });
    }
    
    /**
     * Handle element creation/removal events
     */
    handleElementEvent(action, data) {
        const eventType = action === 'created' ? 'element_created' : 'element_removed';
        const location = this.getRandomLocation();
        
        const narrative = this.generateContextualNarrative(eventType, {
            element: data.type,
            location: location,
            emoji: data.emoji
        });
        
        this.recordNarrativeEvent({
            type: eventType,
            narrative: narrative,
            timestamp: Date.now(),
            data: data,
            significance: this.calculateEventSignificance(eventType, data)
        });
    }
    
    /**
     * Handle weather change events
     */
    handleWeatherEvent(data) {
        const narrative = this.generateContextualNarrative('weather_changed', {
            weather: data.name || data.type,
            intensity: data.intensity || 'moderada'
        });
        
        this.recordNarrativeEvent({
            type: 'weather_changed',
            narrative: narrative,
            timestamp: Date.now(),
            data: data,
            significance: data.isExtreme ? 'high' : 'medium'
        });
    }
    
    /**
     * Handle population change events
     */
    handlePopulationEvent(data) {
        const changeType = data.change > 0 ? 'cresceu' : 'diminuiu';
        
        const narrative = this.generateContextualNarrative('population_change', {
            species: data.species,
            change: changeType
        });
        
        this.recordNarrativeEvent({
            type: 'population_change',
            narrative: narrative,
            timestamp: Date.now(),
            data: data,
            significance: Math.abs(data.change) > 10 ? 'high' : 'medium'
        });
    }
    
    /**
     * Handle tribal formation and evolution events
     */
    handleTribalEvent(action, data) {
        const tribeName = this.generateTribeName();
        const culturalAspect = this.getRandomCulturalAspect();
        
        // Track cultural evolution
        if (!this.culturalEvolution.has(data.id)) {
            this.culturalEvolution.set(data.id, {
                name: tribeName,
                culturalAspects: [],
                traditions: [],
                beliefs: [],
                developmentLevel: 1
            });
        }
        
        const tribeData = this.culturalEvolution.get(data.id);
        tribeData.culturalAspects.push(culturalAspect);
        
        const narrative = this.generateContextualNarrative('tribal_evolution', {
            tribeName: tribeName,
            culturalAspect: culturalAspect
        });
        
        this.recordNarrativeEvent({
            type: 'tribal_evolution',
            narrative: narrative,
            timestamp: Date.now(),
            data: { ...data, tribeName, culturalAspect },
            significance: 'high'
        });
    }
    
    /**
     * Handle major ecosystem events
     */
    handleEcosystemEvent(type, data) {
        let narrative;
        
        switch (type) {
            case 'cascade':
                narrative = `Uma cascata trófica se espalha pelo ecossistema: a mudança em ${data.species} desencadeia efeitos em cadeia que transformam toda a região.`;
                break;
            default:
                narrative = `Um evento significativo altera o equilíbrio do ecossistema.`;
        }
        
        this.recordNarrativeEvent({
            type: 'ecosystem_event',
            narrative: narrative,
            timestamp: Date.now(),
            data: data,
            significance: 'high'
        });
    }
    
    /**
     * Generate contextual narrative using templates
     */
    generateContextualNarrative(eventType, variables) {
        const templates = this.narrativeTemplates[eventType];
        if (!templates || templates.length === 0) {
            return `Um evento interessante ocorreu no ecossistema.`;
        }
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        let narrative = template;
        
        // Replace variables in template
        for (const [key, value] of Object.entries(variables)) {
            narrative = narrative.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        
        return narrative;
    }
    
    /**
     * Record a narrative event in history
     */
    recordNarrativeEvent(event) {
        this.narrativeEvents.unshift(event);
        
        // Maintain history size limit
        if (this.narrativeEvents.length > this.maxHistorySize) {
            this.narrativeEvents.pop();
        }
        
        // Log significant events
        if (event.significance === 'high') {
            logToObserver(`📖 ${event.narrative}`);
        }
        
        // Publish narrative event for other systems
        eventSystem.publish('narrative:event_generated', event);
    }
    
    /**
     * Calculate the significance of an event
     */
    calculateEventSignificance(eventType, data) {
        switch (eventType) {
            case 'element_created':
                return data.type === 'tribe' ? 'high' : 'medium';
            case 'element_removed':
                return data.type === 'tribe' ? 'high' : 'low';
            case 'tribal_evolution':
                return 'high';
            default:
                return 'medium';
        }
    }
    
    /**
     * Generate a random tribe name
     */
    generateTribeName() {
        const prefixes = ['Kala', 'Nara', 'Zeph', 'Tera', 'Aqua', 'Pyro', 'Aero', 'Geo'];
        const suffixes = ['ni', 'ra', 'th', 'ka', 'ma', 'da', 'sa', 'ta'];
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return prefix + suffix;
    }
    
    /**
     * Get a random cultural aspect
     */
    getRandomCulturalAspect() {
        return this.culturalAspects[Math.floor(Math.random() * this.culturalAspects.length)];
    }
    
    /**
     * Get a random location descriptor
     */
    getRandomLocation() {
        return this.locationDescriptors[Math.floor(Math.random() * this.locationDescriptors.length)];
    }
    
    /**
     * Get recent narrative events
     */
    getRecentNarratives(limit = 10) {
        return this.narrativeEvents.slice(0, limit);
    }
    
    /**
     * Get narrative events by type
     */
    getNarrativesByType(type, limit = 10) {
        return this.narrativeEvents
            .filter(event => event.type === type)
            .slice(0, limit);
    }
    
    /**
     * Get tribal cultural evolution data
     */
    getTribalCulture(tribeId) {
        return this.culturalEvolution.get(tribeId);
    }
    
    /**
     * Get all tribal cultures
     */
    getAllTribalCultures() {
        return Array.from(this.culturalEvolution.values());
    }
    
    /**
     * Generate a comprehensive narrative summary
     */
    generateNarrativeSummary(timeframe = 'recent') {
        let events;
        
        switch (timeframe) {
            case 'recent':
                events = this.narrativeEvents.slice(0, 20);
                break;
            case 'significant':
                events = this.narrativeEvents.filter(e => e.significance === 'high').slice(0, 10);
                break;
            case 'all':
                events = this.narrativeEvents;
                break;
            default:
                events = this.narrativeEvents.slice(0, 10);
        }
        
        if (events.length === 0) {
            return "O ecossistema está em seus primeiros momentos, aguardando os primeiros capítulos de sua história.";
        }
        
        const summary = events.map(event => event.narrative).join(' ');
        return summary;
    }
    
    /**
     * Clear narrative history (for testing or reset)
     */
    clearHistory() {
        this.narrativeEvents = [];
        this.culturalEvolution.clear();
        this.narrativeConsequences = [];
        console.log('Narrative history cleared');
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        return {
            totalNarratives: this.narrativeEvents.length,
            tribalCultures: this.culturalEvolution.size,
            significantEvents: this.narrativeEvents.filter(e => e.significance === 'high').length,
            recentEvents: this.narrativeEvents.filter(e => Date.now() - e.timestamp < 300000).length // Last 5 minutes
        };
    }
}

// Create singleton instance
export const narrativeSystem = new NarrativeSystem();

// Export the class for testing
export const NarrativeSystemClass = NarrativeSystem;

// Initialize the system
narrativeSystem.initialize();