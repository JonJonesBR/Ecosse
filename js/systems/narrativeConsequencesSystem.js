/**
 * Narrative Consequences System - Manages long-term narrative ramifications and meta-narrative
 * This system tracks player actions and creates meaningful consequences that affect the planet's destiny
 */

import { eventSystem, EventTypes } from './eventSystem.js';
import { logToObserver } from '../utils.js';

class NarrativeConsequencesSystem {
    constructor() {
        this.playerActions = [];
        this.narrativeConsequences = [];
        this.planetDestiny = {
            path: 'balanced', // balanced, technological, natural, chaotic, extinct
            alignment: 0, // -100 to 100 (destructive to constructive)
            stability: 50, // 0 to 100
            biodiversity: 50, // 0 to 100
            culturalDevelopment: 0 // 0 to 100
        };
        this.consequenceThresholds = {
            minor: 5,
            moderate: 15,
            major: 30,
            critical: 50
        };
        this.actionHistory = new Map(); // Track frequency of action types
        this.longTermEvents = [];
        this.metaNarrative = {
            chapter: 1,
            themes: [],
            prophecies: [],
            legends: []
        };
        this.isInitialized = false;
        
        // Consequence templates for different action patterns
        this.consequenceTemplates = {
            excessive_intervention: {
                minor: "Os habitantes começam a notar padrões estranhos na natureza, como se uma força invisível estivesse moldando o mundo.",
                moderate: "Lendas surgem sobre os 'Moldadores do Mundo' - seres que alteram a realidade com um simples pensamento.",
                major: "Uma nova religião emerge, adorando os poderes divinos que constantemente remodelam o planeta.",
                critical: "A sociedade se divide entre aqueles que abraçam a mudança constante e os que buscam estabilidade natural."
            },
            ecosystem_destroyer: {
                minor: "Pequenas perturbações no equilíbrio natural começam a se acumular.",
                moderate: "Espécies começam a desaparecer misteriosamente, deixando vazios no ecossistema.",
                major: "Um colapso ecológico se espalha, forçando as civilizações a se adaptarem drasticamente.",
                critical: "O planeta entra em uma era de extinção em massa, com apenas as espécies mais resistentes sobrevivendo."
            },
            ecosystem_guardian: {
                minor: "O ecossistema mostra sinais de harmonia e equilíbrio crescentes.",
                moderate: "Uma era dourada de biodiversidade floresce, com novas espécies emergindo naturalmente.",
                major: "O planeta se torna um paraíso ecológico, com todas as espécies vivendo em perfeita harmonia.",
                critical: "Lendas falam de um 'Guardião Verde' que protege eternamente o equilíbrio da vida."
            },
            tribal_manipulator: {
                minor: "As tribos desenvolvem tradições estranhas, como se influenciadas por forças externas.",
                moderate: "Conflitos e alianças entre tribos seguem padrões que parecem orquestrados por uma inteligência superior.",
                major: "Uma civilização unificada emerge, guiada por profecias sobre os 'Arquitetos do Destino'.",
                critical: "A humanidade transcende suas limitações, evoluindo para uma forma de vida superior."
            },
            weather_controller: {
                minor: "Padrões climáticos incomuns começam a ser observados pelos habitantes.",
                moderate: "Mitos sobre controladores do clima se espalham entre as civilizações.",
                major: "O clima se torna uma ferramenta de poder, com tempestades e calmarias seguindo a vontade divina.",
                critical: "O planeta desenvolve um clima consciente, respondendo aos desejos de seus habitantes."
            }
        };
        
        // Meta-narrative themes based on player behavior
        this.narrativeThemes = {
            creation: "A Gênese Eterna",
            destruction: "O Fim dos Tempos",
            balance: "A Harmonia Cósmica",
            chaos: "A Dança do Caos",
            evolution: "A Ascensão da Vida",
            transcendence: "Além da Mortalidade"
        };
    }
    
    /**
     * Initialize the narrative consequences system
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Narrative Consequences System...');
        
        this.setupEventListeners();
        this.initializeMetaNarrative();
        
        this.isInitialized = true;
        console.log('✅ Narrative Consequences System initialized');
    }
    
    /**
     * Set up event listeners for player actions
     */
    setupEventListeners() {
        // Track player interventions
        eventSystem.subscribe(EventTypes.ELEMENT_CREATED, (data) => {
            if (data.source === 'player') {
                this.recordPlayerAction('create_element', data);
            }
        });
        
        eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
            if (data.source === 'player') {
                this.recordPlayerAction('remove_element', data);
            }
        });
        
        eventSystem.subscribe(EventTypes.WEATHER_CHANGED, (data) => {
            if (data.source === 'player') {
                this.recordPlayerAction('control_weather', data);
            }
        });
        
        // Track ecosystem changes
        eventSystem.subscribe(EventTypes.POPULATION_CHANGE, (data) => {
            this.analyzeEcosystemImpact(data);
        });
        
        eventSystem.subscribe(EventTypes.TROPHIC_CASCADE, (data) => {
            this.recordPlayerAction('cause_cascade', data);
        });
        
        // Track tribal interactions
        eventSystem.subscribe(EventTypes.GROUP_FORMED, (data) => {
            if (data.influenced) {
                this.recordPlayerAction('influence_tribe', data);
            }
        });
        
        // Listen for narrative events to build meta-narrative
        eventSystem.subscribe('narrative:event_generated', (data) => {
            this.processNarrativeEvent(data);
        });
    }
    
    /**
     * Initialize the meta-narrative structure
     */
    initializeMetaNarrative() {
        this.metaNarrative = {
            chapter: 1,
            title: "O Despertar",
            themes: ['creation'],
            prophecies: [
                "Nas brumas do tempo, uma consciência desperta para moldar mundos.",
                "O primeiro sopro de vida ecoa através das eras vindouras.",
                "Um planeta jovem aguarda o toque de seu criador."
            ],
            legends: [],
            milestones: []
        };
    }
    
    /**
     * Record a player action and analyze its consequences
     */
    recordPlayerAction(actionType, data) {
        const action = {
            type: actionType,
            data: data,
            timestamp: Date.now(),
            impact: this.calculateActionImpact(actionType, data)
        };
        
        this.playerActions.push(action);
        
        // Update action frequency tracking
        const count = this.actionHistory.get(actionType) || 0;
        this.actionHistory.set(actionType, count + 1);
        
        // Update planet destiny based on action
        this.updatePlanetDestiny(action);
        
        // Check for consequence triggers
        this.checkConsequenceTriggers();
        
        // Maintain action history size
        if (this.playerActions.length > 1000) {
            this.playerActions = this.playerActions.slice(-500);
        }
    }
    
    /**
     * Calculate the impact level of a player action
     */
    calculateActionImpact(actionType, data) {
        let impact = 1;
        
        switch (actionType) {
            case 'create_element':
                impact = data.type === 'tribe' ? 3 : 1;
                break;
            case 'remove_element':
                impact = data.type === 'tribe' ? 4 : 2;
                break;
            case 'control_weather':
                impact = data.isExtreme ? 3 : 2;
                break;
            case 'cause_cascade':
                impact = 4;
                break;
            case 'influence_tribe':
                impact = 3;
                break;
            default:
                impact = 1;
        }
        
        return impact;
    }
    
    /**
     * Update planet destiny based on player actions
     */
    updatePlanetDestiny(action) {
        const { type, impact } = action;
        
        switch (type) {
            case 'create_element':
                this.planetDestiny.alignment += impact;
                this.planetDestiny.biodiversity += impact * 0.5;
                break;
            case 'remove_element':
                this.planetDestiny.alignment -= impact;
                this.planetDestiny.biodiversity -= impact;
                break;
            case 'control_weather':
                this.planetDestiny.stability -= impact * 0.5;
                break;
            case 'cause_cascade':
                this.planetDestiny.stability -= impact * 2;
                this.planetDestiny.biodiversity -= impact;
                break;
            case 'influence_tribe':
                this.planetDestiny.culturalDevelopment += impact;
                break;
        }
        
        // Clamp values to valid ranges
        this.planetDestiny.alignment = Math.max(-100, Math.min(100, this.planetDestiny.alignment));
        this.planetDestiny.stability = Math.max(0, Math.min(100, this.planetDestiny.stability));
        this.planetDestiny.biodiversity = Math.max(0, Math.min(100, this.planetDestiny.biodiversity));
        this.planetDestiny.culturalDevelopment = Math.max(0, Math.min(100, this.planetDestiny.culturalDevelopment));
        
        // Update planet path based on current state
        this.updatePlanetPath();
    }
    
    /**
     * Update the planet's destiny path based on current metrics
     */
    updatePlanetPath() {
        const { alignment, stability, biodiversity, culturalDevelopment } = this.planetDestiny;
        
        if (biodiversity < 20 || stability < 20) {
            this.planetDestiny.path = 'extinct';
        } else if (alignment < -50) {
            this.planetDestiny.path = 'chaotic';
        } else if (culturalDevelopment > 70) {
            this.planetDestiny.path = 'technological';
        } else if (biodiversity > 80 && alignment > 30) {
            this.planetDestiny.path = 'natural';
        } else {
            this.planetDestiny.path = 'balanced';
        }
    }
    
    /**
     * Check if any consequence thresholds have been reached
     */
    checkConsequenceTriggers() {
        for (const [actionType, count] of this.actionHistory.entries()) {
            const pattern = this.identifyActionPattern(actionType, count);
            
            if (pattern && !this.hasConsequenceForPattern(pattern)) {
                this.triggerConsequence(pattern, count);
            }
        }
        
        // Check for meta-narrative progression
        this.checkMetaNarrativeProgression();
    }
    
    /**
     * Identify action patterns that warrant consequences
     */
    identifyActionPattern(actionType, count) {
        const recentActions = this.playerActions.slice(-50);
        const recentCount = recentActions.filter(a => a.type === actionType).length;
        
        // Excessive intervention pattern
        if (recentCount > 20) {
            return 'excessive_intervention';
        }
        
        // Ecosystem destruction pattern
        if (actionType === 'remove_element' && count > 15) {
            return 'ecosystem_destroyer';
        }
        
        // Ecosystem guardian pattern
        if (actionType === 'create_element' && count > 20 && this.planetDestiny.biodiversity > 60) {
            return 'ecosystem_guardian';
        }
        
        // Tribal manipulation pattern
        if (actionType === 'influence_tribe' && count > 10) {
            return 'tribal_manipulator';
        }
        
        // Weather control pattern
        if (actionType === 'control_weather' && count > 8) {
            return 'weather_controller';
        }
        
        return null;
    }
    
    /**
     * Check if a consequence already exists for a pattern
     */
    hasConsequenceForPattern(pattern) {
        return this.narrativeConsequences.some(c => c.pattern === pattern);
    }
    
    /**
     * Trigger a narrative consequence
     */
    triggerConsequence(pattern, actionCount) {
        const severity = this.calculateConsequenceSeverity(actionCount);
        const template = this.consequenceTemplates[pattern];
        
        if (!template) return;
        
        const consequence = {
            id: `${pattern}_${Date.now()}`,
            pattern: pattern,
            severity: severity,
            narrative: template[severity],
            timestamp: Date.now(),
            effects: this.generateConsequenceEffects(pattern, severity),
            resolved: false
        };
        
        this.narrativeConsequences.push(consequence);
        
        // Apply immediate effects
        this.applyConsequenceEffects(consequence);
        
        // Log the consequence
        logToObserver(`🌟 Consequência Narrativa: ${consequence.narrative}`);
        
        // Publish event for other systems
        eventSystem.publish('narrative:consequence_triggered', consequence);
        
        // Update meta-narrative
        this.updateMetaNarrativeFromConsequence(consequence);
    }
    
    /**
     * Calculate consequence severity based on action count
     */
    calculateConsequenceSeverity(actionCount) {
        if (actionCount >= this.consequenceThresholds.critical) return 'critical';
        if (actionCount >= this.consequenceThresholds.major) return 'major';
        if (actionCount >= this.consequenceThresholds.moderate) return 'moderate';
        return 'minor';
    }
    
    /**
     * Generate effects for a consequence
     */
    generateConsequenceEffects(pattern, severity) {
        const effects = {
            planetDestiny: {},
            gameplayChanges: [],
            narrativeUnlocks: []
        };
        
        const multiplier = severity === 'critical' ? 3 : severity === 'major' ? 2 : severity === 'moderate' ? 1.5 : 1;
        
        switch (pattern) {
            case 'excessive_intervention':
                effects.planetDestiny.stability = -5 * multiplier;
                effects.gameplayChanges.push('increased_energy_cost');
                break;
            case 'ecosystem_destroyer':
                effects.planetDestiny.biodiversity = -10 * multiplier;
                effects.planetDestiny.alignment = -5 * multiplier;
                break;
            case 'ecosystem_guardian':
                effects.planetDestiny.biodiversity = 10 * multiplier;
                effects.planetDestiny.alignment = 5 * multiplier;
                effects.narrativeUnlocks.push('guardian_legend');
                break;
            case 'tribal_manipulator':
                effects.planetDestiny.culturalDevelopment = 10 * multiplier;
                effects.narrativeUnlocks.push('divine_influence_myth');
                break;
            case 'weather_controller':
                effects.planetDestiny.stability = -3 * multiplier;
                effects.narrativeUnlocks.push('weather_god_legend');
                break;
        }
        
        return effects;
    }
    
    /**
     * Apply the effects of a consequence
     */
    applyConsequenceEffects(consequence) {
        const { effects } = consequence;
        
        // Apply planet destiny changes
        for (const [key, value] of Object.entries(effects.planetDestiny)) {
            if (this.planetDestiny.hasOwnProperty(key)) {
                this.planetDestiny[key] += value;
                this.planetDestiny[key] = Math.max(0, Math.min(100, this.planetDestiny[key]));
            }
        }
        
        // Update planet path
        this.updatePlanetPath();
        
        // Handle narrative unlocks
        for (const unlock of effects.narrativeUnlocks) {
            this.unlockNarrativeContent(unlock);
        }
    }
    
    /**
     * Unlock narrative content
     */
    unlockNarrativeContent(contentType) {
        switch (contentType) {
            case 'guardian_legend':
                this.metaNarrative.legends.push("O Guardião Verde que protege toda vida");
                break;
            case 'divine_influence_myth':
                this.metaNarrative.legends.push("Os Arquitetos do Destino que guiam as civilizações");
                break;
            case 'weather_god_legend':
                this.metaNarrative.legends.push("O Senhor das Tempestades que comanda os céus");
                break;
        }
    }
    
    /**
     * Process narrative events for meta-narrative building
     */
    processNarrativeEvent(event) {
        if (event.significance === 'high') {
            this.longTermEvents.push({
                narrative: event.narrative,
                timestamp: event.timestamp,
                type: event.type
            });
            
            // Maintain long-term events size
            if (this.longTermEvents.length > 100) {
                this.longTermEvents = this.longTermEvents.slice(-50);
            }
        }
    }
    
    /**
     * Check for meta-narrative progression
     */
    checkMetaNarrativeProgression() {
        const totalActions = this.playerActions.length;
        const currentChapter = this.metaNarrative.chapter;
        
        // Progress chapters based on action count and planet state
        if (totalActions > currentChapter * 100) {
            this.advanceMetaNarrativeChapter();
        }
    }
    
    /**
     * Advance to the next chapter of the meta-narrative
     */
    advanceMetaNarrativeChapter() {
        this.metaNarrative.chapter++;
        
        const chapterTitles = [
            "O Despertar",
            "A Primeira Era",
            "O Tempo das Mudanças",
            "A Grande Transformação",
            "O Equilíbrio Cósmico",
            "O Destino Revelado"
        ];
        
        const newTitle = chapterTitles[Math.min(this.metaNarrative.chapter - 1, chapterTitles.length - 1)];
        this.metaNarrative.title = newTitle;
        
        // Add new prophecy for the chapter
        this.addChapterProphecy();
        
        // Log chapter advancement
        logToObserver(`📖 Nova Era: Capítulo ${this.metaNarrative.chapter} - ${newTitle}`);
        
        // Publish event
        eventSystem.publish('narrative:chapter_advanced', {
            chapter: this.metaNarrative.chapter,
            title: newTitle
        });
    }
    
    /**
     * Add a prophecy for the current chapter
     */
    addChapterProphecy() {
        const prophecies = {
            2: "As sementes do destino começam a germinar nas ações do presente.",
            3: "O equilíbrio entre criação e destruição define o futuro do mundo.",
            4: "Uma grande transformação se aproxima, moldada pelas escolhas passadas.",
            5: "O cosmos observa enquanto o planeta encontra seu verdadeiro propósito.",
            6: "O destino final se revela através das consequências de cada ação."
        };
        
        const prophecy = prophecies[this.metaNarrative.chapter];
        if (prophecy) {
            this.metaNarrative.prophecies.push(prophecy);
        }
    }
    
    /**
     * Analyze ecosystem impact for consequence tracking
     */
    analyzeEcosystemImpact(data) {
        // Track significant population changes that might be player-caused
        if (Math.abs(data.change) > 10) {
            const recentPlayerActions = this.playerActions.slice(-10);
            const hasRecentIntervention = recentPlayerActions.some(a => 
                a.type === 'create_element' || a.type === 'remove_element'
            );
            
            if (hasRecentIntervention) {
                this.recordPlayerAction('indirect_impact', data);
            }
        }
    }
    
    /**
     * Get current planet destiny information
     */
    getPlanetDestiny() {
        return { ...this.planetDestiny };
    }
    
    /**
     * Get active narrative consequences
     */
    getActiveConsequences() {
        return this.narrativeConsequences.filter(c => !c.resolved);
    }
    
    /**
     * Get meta-narrative information
     */
    getMetaNarrative() {
        return { ...this.metaNarrative };
    }
    
    /**
     * Get recent long-term events
     */
    getLongTermEvents(limit = 20) {
        return this.longTermEvents.slice(-limit);
    }
    
    /**
     * Generate a destiny report
     */
    generateDestinyReport() {
        const destiny = this.planetDestiny;
        const consequences = this.getActiveConsequences();
        
        let report = `**Estado Atual do Planeta:**\n`;
        report += `Caminho: ${this.getPathDescription(destiny.path)}\n`;
        report += `Alinhamento: ${this.getAlignmentDescription(destiny.alignment)}\n`;
        report += `Estabilidade: ${destiny.stability}%\n`;
        report += `Biodiversidade: ${destiny.biodiversity}%\n`;
        report += `Desenvolvimento Cultural: ${destiny.culturalDevelopment}%\n\n`;
        
        if (consequences.length > 0) {
            report += `**Consequências Ativas:**\n`;
            consequences.forEach(c => {
                report += `• ${c.narrative}\n`;
            });
        }
        
        return report;
    }
    
    /**
     * Get path description
     */
    getPathDescription(path) {
        const descriptions = {
            balanced: "Equilíbrio Harmônico",
            technological: "Ascensão Tecnológica",
            natural: "Paraíso Natural",
            chaotic: "Era do Caos",
            extinct: "Caminho da Extinção"
        };
        return descriptions[path] || path;
    }
    
    /**
     * Get alignment description
     */
    getAlignmentDescription(alignment) {
        if (alignment > 50) return "Altamente Construtivo";
        if (alignment > 20) return "Construtivo";
        if (alignment > -20) return "Neutro";
        if (alignment > -50) return "Destrutivo";
        return "Altamente Destrutivo";
    }
    
    /**
     * Clear all consequences and reset destiny (for testing)
     */
    reset() {
        this.playerActions = [];
        this.narrativeConsequences = [];
        this.actionHistory.clear();
        this.longTermEvents = [];
        this.planetDestiny = {
            path: 'balanced',
            alignment: 0,
            stability: 50,
            biodiversity: 50,
            culturalDevelopment: 0
        };
        this.initializeMetaNarrative();
        console.log('Narrative Consequences System reset');
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        return {
            totalActions: this.playerActions.length,
            activeConsequences: this.getActiveConsequences().length,
            totalConsequences: this.narrativeConsequences.length,
            currentChapter: this.metaNarrative.chapter,
            planetPath: this.planetDestiny.path,
            longTermEvents: this.longTermEvents.length
        };
    }
    
    /**
     * Update meta-narrative based on consequence
     */
    updateMetaNarrativeFromConsequence(consequence) {
        // Add themes based on consequence pattern
        switch (consequence.pattern) {
            case 'ecosystem_guardian':
                if (!this.metaNarrative.themes.includes('balance')) {
                    this.metaNarrative.themes.push('balance');
                }
                break;
            case 'ecosystem_destroyer':
                if (!this.metaNarrative.themes.includes('destruction')) {
                    this.metaNarrative.themes.push('destruction');
                }
                break;
            case 'tribal_manipulator':
                if (!this.metaNarrative.themes.includes('transcendence')) {
                    this.metaNarrative.themes.push('transcendence');
                }
                break;
            case 'weather_controller':
                if (!this.metaNarrative.themes.includes('chaos')) {
                    this.metaNarrative.themes.push('chaos');
                }
                break;
            case 'excessive_intervention':
                if (!this.metaNarrative.themes.includes('evolution')) {
                    this.metaNarrative.themes.push('evolution');
                }
                break;
        }
        
        // Add milestone for critical consequences
        if (consequence.severity === 'critical') {
            this.metaNarrative.milestones.push({
                chapter: this.metaNarrative.chapter,
                event: consequence.narrative,
                timestamp: consequence.timestamp
            });
        }
    }
}

// Create singleton instance
export const narrativeConsequencesSystem = new NarrativeConsequencesSystem();

// Export the class for testing
export const NarrativeConsequencesSystemClass = NarrativeConsequencesSystem;

// Initialize the system
narrativeConsequencesSystem.initialize();