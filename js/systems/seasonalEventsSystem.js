// js/systems/seasonalEventsSystem.js
import { logToObserver, showMessage } from '../utils.js';
import { playSFX } from '../audioManager.js';
import { addResource, addEnergy } from '../energySystem.js';
import { publish, EventTypes } from './eventSystem.js';

/**
 * Seasonal Events System - Manages biome-specific seasonal events
 * Different planet types have unique seasonal events and celebrations
 */
export class SeasonalEventsSystem {
    constructor() {
        this.activeSeasonalEvents = new Map();
        this.seasonalEventHistory = [];
        this.lastSeason = null;
        
        // Biome-specific seasonal events
        this.biomeSeasonalEvents = {
            // Terrestrial planet events
            terrestrial: {
                spring: [
                    {
                        name: 'Floração Primaveril',
                        emoji: '🌸',
                        description: 'Uma explosão de flores cobre o planeta, aumentando a reprodução das plantas.',
                        effects: { plant_reproduction_boost: 2.0, beauty_bonus: 1.5 },
                        probability: 0.3
                    },
                    {
                        name: 'Migração Animal',
                        emoji: '🦋',
                        description: 'Criaturas migram em grandes grupos, espalhando sementes pelo planeta.',
                        effects: { creature_movement_boost: 1.5, seed_dispersal: 2.0 },
                        probability: 0.2
                    }
                ],
                summer: [
                    {
                        name: 'Festival do Sol',
                        emoji: '☀️',
                        description: 'O sol brilha intensamente, energizando toda a vida no planeta.',
                        effects: { solar_energy_boost: 1.8, plant_growth_boost: 1.4 },
                        probability: 0.25
                    },
                    {
                        name: 'Chuvas de Verão',
                        emoji: '🌦️',
                        description: 'Chuvas refrescantes nutrem o ecossistema durante o calor.',
                        effects: { water_abundance: 1.6, cooling_effect: 1.2 },
                        probability: 0.35
                    }
                ],
                autumn: [
                    {
                        name: 'Colheita Abundante',
                        emoji: '🍂',
                        description: 'Plantas produzem frutos em abundância, alimentando todo o ecossistema.',
                        effects: { food_abundance: 2.2, creature_health_boost: 1.3 },
                        probability: 0.4
                    },
                    {
                        name: 'Preparação Hibernal',
                        emoji: '🐿️',
                        description: 'Criaturas se preparam para o inverno, acumulando recursos.',
                        effects: { resource_gathering: 1.8, survival_instinct: 1.5 },
                        probability: 0.3
                    }
                ],
                winter: [
                    {
                        name: 'Aurora Invernal',
                        emoji: '🌌',
                        description: 'Luzes místicas dançam no céu, inspirando todas as formas de vida.',
                        effects: { mystical_energy: 2.0, inspiration_boost: 1.7 },
                        probability: 0.2
                    },
                    {
                        name: 'Hibernação Coletiva',
                        emoji: '😴',
                        description: 'O ecossistema entra em um estado de descanso regenerativo.',
                        effects: { energy_conservation: 1.5, healing_boost: 1.8 },
                        probability: 0.25
                    }
                ]
            },
            
            // Desert planet events
            desert: {
                spring: [
                    {
                        name: 'Oásis Temporário',
                        emoji: '🏝️',
                        description: 'Fontes de água emergem temporariamente, criando oásis de vida.',
                        effects: { water_springs: 3.0, desert_bloom: 2.5 },
                        probability: 0.15
                    }
                ],
                summer: [
                    {
                        name: 'Tempestade de Areia Cristalina',
                        emoji: '🌪️',
                        description: 'Ventos carregam cristais preciosos pelo deserto.',
                        effects: { crystal_rain: 5, mineral_enrichment: 2.0 },
                        probability: 0.2
                    }
                ],
                autumn: [
                    {
                        name: 'Migração das Dunas',
                        emoji: '🏜️',
                        description: 'As dunas se movem, revelando tesouros enterrados.',
                        effects: { treasure_discovery: 3, landscape_change: 1.5 },
                        probability: 0.25
                    }
                ],
                winter: [
                    {
                        name: 'Noites Estreladas',
                        emoji: '✨',
                        description: 'O céu noturno brilha com intensidade especial no deserto.',
                        effects: { stellar_energy: 1.8, navigation_boost: 2.0 },
                        probability: 0.3
                    }
                ]
            },
            
            // Aquatic planet events
            aquatic: {
                spring: [
                    {
                        name: 'Maré de Plâncton',
                        emoji: '🌊',
                        description: 'Explosão de plâncton luminoso ilumina os oceanos.',
                        effects: { bioluminescence: 2.0, aquatic_fertility: 1.8 },
                        probability: 0.35
                    }
                ],
                summer: [
                    {
                        name: 'Correntes Quentes',
                        emoji: '🌡️',
                        description: 'Correntes oceânicas quentes aceleram a vida marinha.',
                        effects: { thermal_boost: 1.6, circulation_improvement: 1.4 },
                        probability: 0.3
                    }
                ],
                autumn: [
                    {
                        name: 'Grande Migração Marinha',
                        emoji: '🐋',
                        description: 'Criaturas marinhas migram em grupos massivos.',
                        effects: { marine_migration: 2.2, ecosystem_mixing: 1.7 },
                        probability: 0.25
                    }
                ],
                winter: [
                    {
                        name: 'Calmaria Profunda',
                        emoji: '🧘',
                        description: 'Os oceanos entram em um estado de calma regenerativa.',
                        effects: { deep_rest: 1.8, pressure_balance: 1.5 },
                        probability: 0.2
                    }
                ]
            },
            
            // Volcanic planet events
            volcanic: {
                spring: [
                    {
                        name: 'Nascimento de Ilhas',
                        emoji: '🏝️',
                        description: 'Nova atividade vulcânica cria ilhas férteis.',
                        effects: { new_land: 2.5, volcanic_fertility: 2.0 },
                        probability: 0.2
                    }
                ],
                summer: [
                    {
                        name: 'Chuva de Cinzas Nutritivas',
                        emoji: '🌋',
                        description: 'Cinzas vulcânicas enriquecem o solo com minerais.',
                        effects: { soil_enrichment: 2.8, mineral_abundance: 2.2 },
                        probability: 0.3
                    }
                ],
                autumn: [
                    {
                        name: 'Fontes Termais',
                        emoji: '♨️',
                        description: 'Novas fontes termais emergem, criando microclimas únicos.',
                        effects: { thermal_springs: 2.0, microclimate_creation: 1.8 },
                        probability: 0.25
                    }
                ],
                winter: [
                    {
                        name: 'Dormência Vulcânica',
                        emoji: '😴',
                        description: 'Os vulcões entram em período de descanso, permitindo recuperação.',
                        effects: { volcanic_rest: 1.5, ecosystem_recovery: 2.0 },
                        probability: 0.35
                    }
                ]
            },
            
            // Tundra planet events
            tundra: {
                spring: [
                    {
                        name: 'Degelo Primaveril',
                        emoji: '🌊',
                        description: 'O gelo derrete revelando vida preservada no permafrost.',
                        effects: { ice_melt: 2.0, preserved_life_awakening: 2.5 },
                        probability: 0.4
                    }
                ],
                summer: [
                    {
                        name: 'Sol da Meia-Noite',
                        emoji: '🌅',
                        description: 'O sol não se põe, proporcionando crescimento acelerado.',
                        effects: { continuous_daylight: 2.2, rapid_growth: 1.8 },
                        probability: 0.3
                    }
                ],
                autumn: [
                    {
                        name: 'Migração Ártica',
                        emoji: '🦌',
                        description: 'Grandes migrações atravessam a tundra.',
                        effects: { arctic_migration: 2.0, ecosystem_connection: 1.6 },
                        probability: 0.25
                    }
                ],
                winter: [
                    {
                        name: 'Tempestade de Neve Cristalina',
                        emoji: '❄️',
                        description: 'Neve cristalina cria paisagens mágicas e preserva a vida.',
                        effects: { crystal_snow: 1.8, life_preservation: 2.2 },
                        probability: 0.35
                    }
                ]
            },
            
            // Ice planet events
            ice: {
                spring: [
                    {
                        name: 'Rachaduras de Gelo',
                        emoji: '🧊',
                        description: 'O gelo se racha, liberando gases e nutrientes antigos.',
                        effects: { ancient_nutrients: 2.5, gas_release: 1.8 },
                        probability: 0.2
                    }
                ],
                summer: [
                    {
                        name: 'Reflexos Solares',
                        emoji: '💎',
                        description: 'O gelo reflete a luz solar, criando efeitos energéticos únicos.',
                        effects: { solar_reflection: 2.0, energy_amplification: 1.7 },
                        probability: 0.25
                    }
                ],
                autumn: [
                    {
                        name: 'Formação de Cavernas',
                        emoji: '🕳️',
                        description: 'Novas cavernas de gelo se formam, criando habitats protegidos.',
                        effects: { ice_caves: 1.8, protected_habitats: 2.0 },
                        probability: 0.3
                    }
                ],
                winter: [
                    {
                        name: 'Cristalização Perfeita',
                        emoji: '💎',
                        description: 'O frio extremo cria cristais de gelo perfeitos com propriedades especiais.',
                        effects: { perfect_crystals: 3.0, ice_magic: 2.2 },
                        probability: 0.15
                    }
                ]
            },
            
            // Paradise planet events
            paradise: {
                spring: [
                    {
                        name: 'Harmonia Perfeita',
                        emoji: '🎵',
                        description: 'Todo o ecossistema vibra em harmonia perfeita.',
                        effects: { perfect_harmony: 2.5, universal_peace: 2.0 },
                        probability: 0.4
                    }
                ],
                summer: [
                    {
                        name: 'Chuva de Pétalas',
                        emoji: '🌸',
                        description: 'Pétalas coloridas caem como chuva, espalhando alegria.',
                        effects: { petal_rain: 2.0, joy_amplification: 1.8 },
                        probability: 0.35
                    }
                ],
                autumn: [
                    {
                        name: 'Colheita Dourada',
                        emoji: '🍯',
                        description: 'Frutos dourados aparecem, concedendo sabedoria a quem os consome.',
                        effects: { golden_harvest: 2.8, wisdom_boost: 2.2 },
                        probability: 0.3
                    }
                ],
                winter: [
                    {
                        name: 'Sonhos Compartilhados',
                        emoji: '💭',
                        description: 'Todas as criaturas compartilham sonhos pacíficos.',
                        effects: { shared_dreams: 2.0, collective_consciousness: 1.9 },
                        probability: 0.25
                    }
                ]
            }
        };
    }
    
    /**
     * Update the seasonal events system
     * @param {string} currentSeason - Current season
     * @param {string} planetType - Type of planet
     * @param {Object} simulationState - Current simulation state
     */
    update(currentSeason, planetType, simulationState) {
        // Check if season changed
        if (this.lastSeason !== currentSeason) {
            this.onSeasonChange(currentSeason, planetType, simulationState);
            this.lastSeason = currentSeason;
        }
        
        // Update active seasonal events
        for (const [eventId, event] of this.activeSeasonalEvents.entries()) {
            event.remainingDuration--;
            
            if (event.remainingDuration <= 0) {
                this.endSeasonalEvent(eventId, simulationState);
            } else {
                this.applySeasonalEventEffects(event, simulationState);
            }
        }
    }
    
    /**
     * Handle season change and potentially trigger seasonal events
     * @param {string} newSeason - The new season
     * @param {string} planetType - Type of planet
     * @param {Object} simulationState - Current simulation state
     */
    onSeasonChange(newSeason, planetType, simulationState) {
        const biomeEvents = this.biomeSeasonalEvents[planetType];
        if (!biomeEvents || !biomeEvents[newSeason]) return;
        
        const seasonalEvents = biomeEvents[newSeason];
        
        // Check each potential seasonal event
        seasonalEvents.forEach(eventDef => {
            if (Math.random() < eventDef.probability) {
                this.triggerSeasonalEvent(eventDef, newSeason, simulationState);
            }
        });
    }
    
    /**
     * Trigger a seasonal event
     * @param {Object} eventDef - Event definition
     * @param {string} season - Current season
     * @param {Object} simulationState - Current simulation state
     */
    triggerSeasonalEvent(eventDef, season, simulationState) {
        const eventId = `seasonal_${eventDef.name}_${Date.now()}`;
        
        const event = {
            id: eventId,
            name: eventDef.name,
            emoji: eventDef.emoji,
            description: eventDef.description,
            effects: { ...eventDef.effects },
            season: season,
            duration: 100 + Math.random() * 100, // 100-200 cycles
            remainingDuration: 100 + Math.random() * 100,
            startTime: Date.now()
        };
        
        this.activeSeasonalEvents.set(eventId, event);
        this.seasonalEventHistory.push({
            ...event,
            timestamp: new Date().toISOString()
        });
        
        // Announce the seasonal event
        logToObserver(`🌟 EVENTO SAZONAL: ${event.emoji} ${event.name}! ${event.description}`);
        showMessage(`${event.emoji} ${event.name} (${season})`, 'seasonal');
        playSFX('seasonalEvent');
        
        // Publish event
        publish(EventTypes.SEASONAL_EVENT_STARTED, {
            eventId,
            name: event.name,
            description: event.description,
            season: season,
            duration: event.duration
        });
        
        // Apply immediate effects
        this.applySeasonalEventStartEffects(event, simulationState);
    }
    
    /**
     * Apply effects when a seasonal event starts
     * @param {Object} event - The seasonal event object
     * @param {Object} simulationState - Current simulation state
     */
    applySeasonalEventStartEffects(event, simulationState) {
        const effects = event.effects;
        
        // Resource rewards
        if (effects.crystal_rain) {
            addResource('seasonal_crystals', effects.crystal_rain, `evento sazonal: ${event.name}`);
        }
        
        if (effects.treasure_discovery) {
            addResource('ancient_treasures', effects.treasure_discovery, `evento sazonal: ${event.name}`);
        }
        
        if (effects.golden_harvest) {
            addResource('golden_fruits', effects.golden_harvest, `evento sazonal: ${event.name}`);
        }
        
        if (effects.perfect_crystals) {
            addResource('perfect_ice_crystals', effects.perfect_crystals, `evento sazonal: ${event.name}`);
        }
        
        // Energy rewards
        if (effects.mystical_energy || effects.stellar_energy) {
            const energyBonus = (effects.mystical_energy || effects.stellar_energy) * 15;
            addEnergy(energyBonus, `evento sazonal: ${event.name}`);
        }
    }
    
    /**
     * Apply ongoing effects of an active seasonal event
     * @param {Object} event - The seasonal event object
     * @param {Object} simulationState - Current simulation state
     */
    applySeasonalEventEffects(event, simulationState) {
        const effects = event.effects;
        
        // Apply effects to all elements
        simulationState.elements.forEach(element => {
            // Plant-specific seasonal effects
            if (element.type === 'plant' || element.type.includes('plant')) {
                if (effects.plant_reproduction_boost) {
                    element.reproductionChance *= effects.plant_reproduction_boost;
                }
                if (effects.plant_growth_boost) {
                    element.health += 0.5 * effects.plant_growth_boost;
                }
                if (effects.desert_bloom) {
                    element.health += 0.8 * effects.desert_bloom;
                }
                if (effects.solar_energy_boost) {
                    element.energy += 0.3 * effects.solar_energy_boost;
                }
            }
            
            // Creature-specific seasonal effects
            if (element.type === 'creature' || element.type.includes('creature')) {
                if (effects.creature_movement_boost) {
                    element.speed *= effects.creature_movement_boost;
                }
                if (effects.creature_health_boost) {
                    element.health += 0.3 * effects.creature_health_boost;
                }
                if (effects.food_abundance) {
                    element.energy += 0.4 * effects.food_abundance;
                }
                if (effects.survival_instinct) {
                    element.health += 0.2 * effects.survival_instinct;
                }
            }
            
            // Universal effects
            if (effects.healing_boost) {
                element.health += 0.3 * effects.healing_boost;
            }
            
            if (effects.energy_conservation) {
                element.decayRate *= (2 - effects.energy_conservation); // Reduce decay
            }
            
            if (effects.perfect_harmony) {
                element.health += 0.4 * effects.perfect_harmony;
                element.energy += 0.2 * effects.perfect_harmony;
            }
        });
    }
    
    /**
     * End a seasonal event
     * @param {string} eventId - ID of the event to end
     * @param {Object} simulationState - Current simulation state
     */
    endSeasonalEvent(eventId, simulationState) {
        const event = this.activeSeasonalEvents.get(eventId);
        if (!event) return;
        
        logToObserver(`🍂 O evento sazonal "${event.name}" chegou ao fim.`);
        
        // Publish event end
        publish(EventTypes.SEASONAL_EVENT_ENDED, {
            eventId,
            name: event.name,
            season: event.season,
            duration: event.duration
        });
        
        this.activeSeasonalEvents.delete(eventId);
    }
    
    /**
     * Get all active seasonal events
     * @returns {Array} Array of active seasonal events
     */
    getActiveSeasonalEvents() {
        return Array.from(this.activeSeasonalEvents.values());
    }
    
    /**
     * Get seasonal event history
     * @returns {Array} Array of historical seasonal events
     */
    getSeasonalEventHistory() {
        return [...this.seasonalEventHistory];
    }
    
    /**
     * Force trigger a seasonal event (for testing)
     * @param {string} planetType - Type of planet
     * @param {string} season - Season
     * @param {string} eventName - Name of event to trigger
     * @param {Object} simulationState - Current simulation state
     */
    forceSeasonalEvent(planetType, season, eventName, simulationState) {
        const biomeEvents = this.biomeSeasonalEvents[planetType];
        if (!biomeEvents || !biomeEvents[season]) return;
        
        const eventDef = biomeEvents[season].find(e => e.name === eventName);
        if (eventDef) {
            this.triggerSeasonalEvent(eventDef, season, simulationState);
        }
    }
}

// Create and export singleton instance
export const seasonalEventsSystem = new SeasonalEventsSystem();