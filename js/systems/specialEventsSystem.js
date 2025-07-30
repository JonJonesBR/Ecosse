// js/systems/specialEventsSystem.js
import { logToObserver, showMessage, elementClasses } from '../utils.js';
import { playSFX } from '../audioManager.js';
import { addResource, addEnergy } from '../energySystem.js';
import { publish, EventTypes } from './eventSystem.js';

/**
 * Special Events System - Manages rare and special events in the ecosystem
 * Includes astronomical events, scientific discoveries, and planetary anomalies
 */
export class SpecialEventsSystem {
    constructor() {
        this.eventHistory = [];
        this.activeEvents = new Map();
        this.eventCooldowns = new Map();
        this.globalEventChance = 0.0001; // Base chance per simulation tick
        
        // Event definitions with their properties
        this.eventDefinitions = {
            // Astronomical Events
            comet_passage: {
                name: 'Passagem de Cometa',
                emoji: '☄️',
                rarity: 'rare',
                baseChance: 0.00005,
                duration: 150,
                cooldown: 500,
                effects: {
                    energy_boost: 2.0,
                    plant_growth: 1.5,
                    inspiration: 3
                },
                description: 'Um cometa brilhante cruza o céu, inspirando todas as formas de vida.'
            },
            
            aurora_display: {
                name: 'Aurora Boreal',
                emoji: '🌌',
                rarity: 'uncommon',
                baseChance: 0.0001,
                duration: 100,
                cooldown: 200,
                effects: {
                    energy_regeneration: 1.3,
                    creature_happiness: 1.2,
                    tribal_inspiration: 2
                },
                description: 'Luzes dançantes iluminam o céu noturno com cores místicas.'
            },
            
            solar_flare: {
                name: 'Erupção Solar',
                emoji: '🌞',
                rarity: 'rare',
                baseChance: 0.00003,
                duration: 80,
                cooldown: 400,
                effects: {
                    plant_supercharge: 2.5,
                    technology_disruption: 0.5,
                    energy_overload: 1.8
                },
                description: 'Uma poderosa erupção solar energiza toda a vida vegetal.'
            },
            
            meteor_shower: {
                name: 'Chuva de Meteoros',
                emoji: '🌠',
                rarity: 'uncommon',
                baseChance: 0.00008,
                duration: 120,
                cooldown: 300,
                effects: {
                    mineral_rain: 5,
                    wish_fulfillment: 1,
                    cosmic_energy: 1.4
                },
                description: 'Dezenas de meteoros iluminam o céu, trazendo minerais raros.'
            },
            
            // Scientific Discoveries
            genetic_breakthrough: {
                name: 'Descoberta Genética',
                emoji: '🧬',
                rarity: 'very_rare',
                baseChance: 0.00001,
                duration: 200,
                cooldown: 800,
                effects: {
                    mutation_rate: 2.0,
                    evolution_speed: 1.8,
                    adaptation_bonus: 1.5
                },
                description: 'Uma descoberta revolucionária acelera a evolução de todas as espécies.'
            },
            
            symbiosis_discovery: {
                name: 'Descoberta de Simbiose',
                emoji: '🤝',
                rarity: 'rare',
                baseChance: 0.00004,
                duration: 180,
                cooldown: 600,
                effects: {
                    cooperation_bonus: 2.0,
                    symbiotic_efficiency: 1.6,
                    ecosystem_harmony: 1.4
                },
                description: 'Novas formas de cooperação entre espécies são descobertas.'
            },
            
            consciousness_emergence: {
                name: 'Emergência de Consciência',
                emoji: '🧠',
                rarity: 'legendary',
                baseChance: 0.000005,
                duration: 300,
                cooldown: 1000,
                effects: {
                    intelligence_boost: 3.0,
                    tribal_advancement: 2.5,
                    wisdom_gain: 5
                },
                description: 'Um salto evolutivo na consciência eleva todas as formas de vida inteligente.'
            },
            
            // Planetary Anomalies
            time_dilation: {
                name: 'Dilatação Temporal',
                emoji: '⏳',
                rarity: 'very_rare',
                baseChance: 0.00002,
                duration: 100,
                cooldown: 700,
                effects: {
                    time_acceleration: 1.5,
                    aging_slowdown: 0.7,
                    temporal_energy: 2.0
                },
                description: 'O tempo flui de forma estranha, afetando todos os processos naturais.'
            },
            
            dimensional_rift: {
                name: 'Fenda Dimensional',
                emoji: '🌀',
                rarity: 'legendary',
                baseChance: 0.000003,
                duration: 150,
                cooldown: 1200,
                effects: {
                    exotic_matter: 10,
                    reality_distortion: 1.3,
                    interdimensional_energy: 3.0
                },
                description: 'Uma fenda no espaço-tempo traz energia e matéria de outras dimensões.'
            },
            
            planetary_resonance: {
                name: 'Ressonância Planetária',
                emoji: '🎵',
                rarity: 'rare',
                baseChance: 0.00006,
                duration: 200,
                cooldown: 500,
                effects: {
                    harmonic_growth: 1.8,
                    crystal_formation: 2.0,
                    vibrational_healing: 1.5
                },
                description: 'O planeta inteiro vibra em harmonia, promovendo crescimento e cura.'
            },
            
            magnetic_storm: {
                name: 'Tempestade Magnética',
                emoji: '🧲',
                rarity: 'uncommon',
                baseChance: 0.0001,
                duration: 90,
                cooldown: 250,
                effects: {
                    electromagnetic_boost: 1.6,
                    navigation_disruption: 0.8,
                    mineral_magnetization: 1.4
                },
                description: 'Campos magnéticos intensos afetam toda a vida no planeta.'
            },
            
            // Mystical Events
            ancient_awakening: {
                name: 'Despertar Ancestral',
                emoji: '🗿',
                rarity: 'legendary',
                baseChance: 0.000002,
                duration: 250,
                cooldown: 1500,
                effects: {
                    ancient_wisdom: 5,
                    spiritual_energy: 3.0,
                    ancestral_blessing: 2.5
                },
                description: 'Espíritos ancestrais despertam, compartilhando sabedoria antiga.'
            },
            
            cosmic_alignment: {
                name: 'Alinhamento Cósmico',
                emoji: '✨',
                rarity: 'very_rare',
                baseChance: 0.00001,
                duration: 180,
                cooldown: 900,
                effects: {
                    cosmic_power: 2.8,
                    universal_harmony: 2.0,
                    stellar_blessing: 1.8
                },
                description: 'Os corpos celestes se alinham, canalizando energia cósmica.'
            },
            
            // Additional Astronomical Events
            lunar_eclipse: {
                name: 'Eclipse Lunar',
                emoji: '🌙',
                rarity: 'uncommon',
                baseChance: 0.00012,
                duration: 80,
                cooldown: 300,
                effects: {
                    nocturnal_boost: 1.8,
                    mystical_energy: 1.5,
                    creature_activity: 1.3
                },
                description: 'A lua se esconde nas sombras, despertando energias místicas.'
            },
            
            solar_eclipse: {
                name: 'Eclipse Solar',
                emoji: '🌑',
                rarity: 'rare',
                baseChance: 0.00008,
                duration: 60,
                cooldown: 600,
                effects: {
                    shadow_power: 2.0,
                    temperature_drop: 0.7,
                    spiritual_awakening: 1.6
                },
                description: 'O sol é obscurecido, trazendo um momento de reflexão cósmica.'
            },
            
            supernova_light: {
                name: 'Luz de Supernova',
                emoji: '💥',
                rarity: 'legendary',
                baseChance: 0.000001,
                duration: 300,
                cooldown: 2000,
                effects: {
                    stellar_radiation: 3.0,
                    evolution_catalyst: 2.5,
                    cosmic_awakening: 4.0
                },
                description: 'A luz de uma estrela distante que explodiu ilumina o planeta com energia primordial.'
            },
            
            // Additional Scientific Discoveries
            quantum_entanglement: {
                name: 'Entrelaçamento Quântico',
                emoji: '⚛️',
                rarity: 'very_rare',
                baseChance: 0.00003,
                duration: 250,
                cooldown: 800,
                effects: {
                    quantum_connection: 2.2,
                    instantaneous_communication: 1.8,
                    reality_manipulation: 1.4
                },
                description: 'Descoberta de conexões quânticas instantâneas entre partículas distantes.'
            },
            
            crystalline_network: {
                name: 'Rede Cristalina',
                emoji: '🔮',
                rarity: 'rare',
                baseChance: 0.00005,
                duration: 200,
                cooldown: 500,
                effects: {
                    crystal_resonance: 2.0,
                    information_storage: 1.6,
                    energy_amplification: 1.8
                },
                description: 'Cristais naturais formam uma rede de comunicação e armazenamento de energia.'
            },
            
            bioharmonic_frequency: {
                name: 'Frequência Bio-harmônica',
                emoji: '🎼',
                rarity: 'rare',
                baseChance: 0.00007,
                duration: 180,
                cooldown: 400,
                effects: {
                    biological_harmony: 2.1,
                    healing_resonance: 1.7,
                    growth_acceleration: 1.5
                },
                description: 'Descoberta de frequências que promovem harmonia e crescimento biológico.'
            },
            
            // Additional Planetary Anomalies
            gravity_well: {
                name: 'Poço Gravitacional',
                emoji: '🌀',
                rarity: 'rare',
                baseChance: 0.00004,
                duration: 150,
                cooldown: 600,
                effects: {
                    gravitational_anomaly: 1.8,
                    matter_compression: 1.4,
                    space_distortion: 1.6
                },
                description: 'Uma anomalia gravitacional cria efeitos estranhos na matéria local.'
            },
            
            energy_vortex: {
                name: 'Vórtice de Energia',
                emoji: '🌪️',
                rarity: 'uncommon',
                baseChance: 0.0001,
                duration: 120,
                cooldown: 350,
                effects: {
                    energy_concentration: 2.0,
                    elemental_fusion: 1.5,
                    atmospheric_charge: 1.3
                },
                description: 'Um vórtice de energia pura se forma, concentrando forças elementais.'
            },
            
            crystal_rain: {
                name: 'Chuva de Cristais',
                emoji: '💎',
                rarity: 'uncommon',
                baseChance: 0.00009,
                duration: 100,
                cooldown: 250,
                effects: {
                    crystal_formation: 2.5,
                    mineral_enrichment: 2.0,
                    geological_activity: 1.4
                },
                description: 'Cristais microscópicos caem do céu, enriquecendo o solo com minerais raros.'
            }
        };
    }
    
    /**
     * Update the special events system
     * @param {Object} simulationState - Current simulation state
     * @param {Object} config - Simulation configuration
     * @param {Object} weather - Current weather conditions
     */
    update(simulationState, config, weather) {
        // Update cooldowns
        for (const [eventType, cooldown] of this.eventCooldowns.entries()) {
            if (cooldown > 0) {
                this.eventCooldowns.set(eventType, cooldown - 1);
            }
        }
        
        // Update active events
        for (const [eventId, event] of this.activeEvents.entries()) {
            event.remainingDuration--;
            
            if (event.remainingDuration <= 0) {
                this.endEvent(eventId, simulationState);
            } else {
                this.applyEventEffects(event, simulationState, config);
            }
        }
        
        // Check for new events
        this.checkForNewEvents(simulationState, config, weather);
    }
    
    /**
     * Check if new events should trigger
     * @param {Object} simulationState - Current simulation state
     * @param {Object} config - Simulation configuration
     * @param {Object} weather - Current weather conditions
     */
    checkForNewEvents(simulationState, config, weather) {
        for (const [eventType, eventDef] of Object.entries(this.eventDefinitions)) {
            // Skip if event is on cooldown
            if (this.eventCooldowns.get(eventType) > 0) continue;
            
            // Skip if event is already active
            if (Array.from(this.activeEvents.values()).some(e => e.type === eventType)) continue;
            
            // Calculate event chance based on various factors
            let eventChance = eventDef.baseChance;
            
            // Modify chance based on ecosystem conditions
            eventChance *= this.calculateEventChanceModifier(eventType, simulationState, config, weather);
            
            // Roll for event
            if (Math.random() < eventChance) {
                this.triggerEvent(eventType, simulationState);
            }
        }
    }
    
    /**
     * Calculate event chance modifier based on conditions
     * @param {string} eventType - Type of event
     * @param {Object} simulationState - Current simulation state
     * @param {Object} config - Simulation configuration
     * @param {Object} weather - Current weather conditions
     * @returns {number} Chance modifier
     */
    calculateEventChanceModifier(eventType, simulationState, config, weather) {
        let modifier = 1.0;
        const eventDef = this.eventDefinitions[eventType];
        
        // Ecosystem diversity bonus
        const uniqueTypes = new Set(simulationState.elements.map(el => el.type)).size;
        if (uniqueTypes > 8) {
            modifier *= 1.2; // More diverse ecosystems attract more events
        }
        
        // Population size influence
        const totalPopulation = simulationState.elements.length;
        if (totalPopulation > 100) {
            modifier *= 1.1;
        } else if (totalPopulation < 20) {
            modifier *= 0.8;
        }
        
        // Weather influence on specific events
        if (eventType === 'aurora_display' && (weather.type === 'clear' || weather.type === 'cold')) {
            modifier *= 2.0;
        }
        
        if (eventType === 'solar_flare' && weather.type === 'sunny') {
            modifier *= 1.5;
        }
        
        if (eventType === 'meteor_shower' && weather.type === 'clear') {
            modifier *= 1.3;
        }
        
        // Planetary configuration influence
        if (config.planetType === 'volcanic' && eventType === 'dimensional_rift') {
            modifier *= 1.4;
        }
        
        if (config.atmosphere === 'thin' && eventType.includes('cosmic')) {
            modifier *= 1.3;
        }
        
        // Tribal presence increases chance of consciousness-related events
        const tribes = simulationState.elements.filter(el => el.type === 'tribe');
        if (tribes.length > 0 && eventType.includes('consciousness')) {
            modifier *= 2.0;
        }
        
        return modifier;
    }
    
    /**
     * Trigger a special event
     * @param {string} eventType - Type of event to trigger
     * @param {Object} simulationState - Current simulation state
     */
    triggerEvent(eventType, simulationState) {
        const eventDef = this.eventDefinitions[eventType];
        const eventId = `${eventType}_${Date.now()}`;
        
        const event = {
            id: eventId,
            type: eventType,
            name: eventDef.name,
            emoji: eventDef.emoji,
            description: eventDef.description,
            effects: { ...eventDef.effects },
            duration: eventDef.duration,
            remainingDuration: eventDef.duration,
            startTime: Date.now()
        };
        
        this.activeEvents.set(eventId, event);
        this.eventCooldowns.set(eventType, eventDef.cooldown);
        this.eventHistory.push({
            ...event,
            timestamp: new Date().toISOString()
        });
        
        // Announce the event
        logToObserver(`🌟 EVENTO ESPECIAL: ${event.emoji} ${event.name}! ${event.description}`);
        showMessage(`${event.emoji} ${event.name}`, 'special');
        playSFX('specialEvent');
        
        // Publish event
        publish(EventTypes.SPECIAL_EVENT_STARTED, {
            eventId,
            eventType,
            name: event.name,
            description: event.description,
            duration: event.duration
        });
        
        // Apply immediate effects
        this.applyEventStartEffects(event, simulationState);
    }
    
    /**
     * Apply effects when an event starts
     * @param {Object} event - The event object
     * @param {Object} simulationState - Current simulation state
     */
    applyEventStartEffects(event, simulationState) {
        const effects = event.effects;
        
        // Resource rewards
        if (effects.mineral_rain) {
            addResource('rare_minerals', effects.mineral_rain, `evento: ${event.name}`);
        }
        
        if (effects.exotic_matter) {
            addResource('exotic_matter', effects.exotic_matter, `evento: ${event.name}`);
        }
        
        if (effects.ancient_wisdom) {
            addResource('ancient_wisdom', effects.ancient_wisdom, `evento: ${event.name}`);
        }
        
        if (effects.cosmic_power) {
            addEnergy(effects.cosmic_power * 10, `evento: ${event.name}`);
        }
        
        // Spawn special elements for certain events
        if (event.type === 'dimensional_rift') {
            this.spawnSpecialElements(simulationState, 'portal_stone', 1);
        }
        
        if (event.type === 'planetary_resonance') {
            this.spawnSpecialElements(simulationState, 'energy_crystal', 2);
        }
        
        if (event.type === 'time_dilation') {
            this.spawnSpecialElements(simulationState, 'time_anomaly', 1);
        }
        
        if (event.type === 'ancient_awakening') {
            this.spawnSpecialElements(simulationState, 'life_spring', 1);
        }
    }
    
    /**
     * Apply ongoing effects of an active event
     * @param {Object} event - The event object
     * @param {Object} simulationState - Current simulation state
     * @param {Object} config - Simulation configuration
     */
    applyEventEffects(event, simulationState, config) {
        const effects = event.effects;
        
        // Apply effects to all elements
        simulationState.elements.forEach(element => {
            // Plant effects
            if (element.type === 'plant' || element.type.includes('plant')) {
                if (effects.plant_growth) {
                    element.health += 0.5 * effects.plant_growth;
                }
                if (effects.plant_supercharge) {
                    element.health += 1.0 * effects.plant_supercharge;
                    element.reproductionChance *= effects.plant_supercharge;
                }
                if (effects.harmonic_growth) {
                    element.health += 0.3 * effects.harmonic_growth;
                }
            }
            
            // Creature effects
            if (element.type === 'creature' || element.type.includes('creature')) {
                if (effects.creature_happiness) {
                    element.health += 0.2 * effects.creature_happiness;
                    element.energy += 0.3 * effects.creature_happiness;
                }
                if (effects.evolution_speed) {
                    if (element.genome) {
                        element.genome.mutationRate *= effects.evolution_speed;
                    }
                }
                if (effects.adaptation_bonus) {
                    element.health += 0.1 * effects.adaptation_bonus;
                }
            }
            
            // Tribal effects
            if (element.type === 'tribe') {
                if (effects.tribal_inspiration) {
                    element.technologyLevel += 0.01 * effects.tribal_inspiration;
                    element.health += 0.5 * effects.tribal_inspiration;
                }
                if (effects.tribal_advancement) {
                    element.technologyLevel += 0.02 * effects.tribal_advancement;
                    element.population += 0.1 * effects.tribal_advancement;
                }
                if (effects.intelligence_boost) {
                    element.technologyLevel += 0.03 * effects.intelligence_boost;
                }
            }
            
            // Crystal effects
            if (element.type === 'energy_crystal') {
                if (effects.crystal_formation) {
                    element.energyOutput *= effects.crystal_formation;
                }
                if (effects.cosmic_energy) {
                    element.amplification *= effects.cosmic_energy;
                }
            }
            
            // Time effects
            if (effects.time_acceleration) {
                element.age += effects.time_acceleration - 1;
            }
            
            if (effects.aging_slowdown) {
                element.decayRate *= effects.aging_slowdown;
            }
            
            // Healing effects
            if (effects.vibrational_healing) {
                element.health += 0.2 * effects.vibrational_healing;
            }
        });
    }
    
    /**
     * End an active event
     * @param {string} eventId - ID of the event to end
     * @param {Object} simulationState - Current simulation state
     */
    endEvent(eventId, simulationState) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        logToObserver(`✨ O evento "${event.name}" chegou ao fim.`);
        
        // Publish event end
        publish(EventTypes.SPECIAL_EVENT_ENDED, {
            eventId,
            eventType: event.type,
            name: event.name,
            duration: event.duration
        });
        
        this.activeEvents.delete(eventId);
    }
    
    /**
     * Spawn special elements during events
     * @param {Object} simulationState - Current simulation state
     * @param {string} elementType - Type of element to spawn
     * @param {number} count - Number of elements to spawn
     */
    spawnSpecialElements(simulationState, elementType, count) {
        const ElementClass = elementClasses[elementType];
        if (!ElementClass) return;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * (simulationState.canvasWidth || 800);
            const y = Math.random() * (simulationState.canvasHeight || 450);
            const id = Date.now() + Math.random();
            
            let newElement;
            if (ElementClass.prototype) {
                newElement = new ElementClass(id, x, y);
            } else {
                newElement = ElementClass(id, x, y);
            }
            
            simulationState.newElements.push(newElement);
        }
        
        logToObserver(`${count}x ${elementType} apareceram devido ao evento especial!`);
    }
    
    /**
     * Get all active events
     * @returns {Array} Array of active events
     */
    getActiveEvents() {
        return Array.from(this.activeEvents.values());
    }
    
    /**
     * Get event history
     * @returns {Array} Array of historical events
     */
    getEventHistory() {
        return [...this.eventHistory];
    }
    
    /**
     * Force trigger an event (for testing or special circumstances)
     * @param {string} eventType - Type of event to trigger
     * @param {Object} simulationState - Current simulation state
     */
    forceEvent(eventType, simulationState) {
        if (this.eventDefinitions[eventType]) {
            this.triggerEvent(eventType, simulationState);
        }
    }
    
    /**
     * Get event statistics
     * @returns {Object} Event statistics
     */
    getEventStatistics() {
        const stats = {
            totalEvents: this.eventHistory.length,
            activeEvents: this.activeEvents.size,
            eventsByType: {},
            eventsByRarity: {}
        };
        
        this.eventHistory.forEach(event => {
            stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
            
            const rarity = this.eventDefinitions[event.type]?.rarity || 'unknown';
            stats.eventsByRarity[rarity] = (stats.eventsByRarity[rarity] || 0) + 1;
        });
        
        return stats;
    }
}

// Create and export singleton instance
export const specialEventsSystem = new SpecialEventsSystem();