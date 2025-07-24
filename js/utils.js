import { get3DPositionOnPlanet, triggerVolcanoEruption, triggerMeteorImpact } from './planetRenderer.js';
import * as THREE from 'three';
import { publish, EventTypes } from './systems/eventSystem.js';
import { log, info, warning, error, LogLevel } from './systems/loggingSystem.js';
import { 
    calculatePredationSuccess, 
    isPredatorPreyRelationship, 
    processPredatorPreyInteraction,
    getPotentialPrey,
    getPotentialPredators
} from './systems/foodWebSystem.js';

// js/utils.js
let messageBox, messageText, observerLogDiv;
let logHistory = []; // New array to store log history

export function initUIDomReferences(msgBox, msgText, obsLog, okBtn) {
    messageBox = msgBox;
    messageText = msgText;
    observerLogDiv = obsLog;
    if (okBtn) {
        okBtn.addEventListener('click', hideMessageBox);
    }
    
    // Initialize the logging system with the observer log div
    if (obsLog) {
        import('./systems/loggingSystem.js').then(loggingSystem => {
            loggingSystem.initLoggingSystem(obsLog);
        });
    }
}

export function showMessage(message) {
    if (messageText && messageBox) {
        messageText.textContent = message;
        messageBox.style.display = 'block';
        
        // Publish UI notification event
        publish(EventTypes.UI_NOTIFICATION, { message });
    }
}

export function hideMessageBox() {
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

export function logToObserver(message) {
    // Use the new logging system
    info(message);
    
    // Keep the old implementation for backward compatibility
    if (observerLogDiv) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        observerLogDiv.prepend(p);
        if (observerLogDiv.children.length > 50) {
            observerLogDiv.removeChild(observerLogDiv.lastChild);
        }
        logHistory.push(p.textContent); // Store in history
        if (logHistory.length > 1000) { // Limit history size
            logHistory.shift();
        }
    }
}

export function getLogHistory() {
    // Try to use the new logging system if available
    try {
        const loggingSystem = require('./systems/loggingSystem.js');
        return loggingSystem.getLogEntries().map(entry => 
            `[${entry.formattedTime}] ${entry.message}`
        );
    } catch (e) {
        // Fall back to the old log history
        return logHistory;
    }
}

export function showModal(modalElement) {
    if (modalElement) modalElement.style.display = 'flex';
}

export function hideModal(modalElement) {
    if (modalElement) modalElement.style.display = 'none';
}

function mutateGene(geneValue, mutationRate) {
    const mutationAmount = (Math.random() * 2 - 1) * mutationRate; // Random value between -mutationRate and +mutationRate
    return Math.max(0, geneValue + mutationAmount); // Ensure gene value doesn't go below zero
}

export function updateSliderValue(slider, span, suffix = '') {
    if (span && slider) {
        span.textContent = slider.value + suffix;
    }
}

export const ecosystemSizes = {
    small: { width: 500, height: 300, radius: 100 },
    medium: { width: 800, height: 450, radius: 150 },
    large: { width: 1200, height: 675, radius: 200 },
};

export const elementDefinitions = {
    water: { emoji: '💧', color: 'rgba(0, 191, 255, 0.7)', baseHealth: 100, size: 20, decayRate: 0.01 },
    rock: { emoji: '🪨', color: 'rgba(100, 100, 100, 0.9)', baseHealth: 100, size: 30, decayRate: 0, minerals: { iron: 50, silicon: 50, carbon: 50 } },
    plant: { emoji: '🌿', color: 'rgba(0, 200, 0, 0.9)', baseHealth: 100, energy: 50, size: 25, decayRate: 0.2, reproductionChance: 0.005 },
    creature: { emoji: '🐛', color: 'rgba(255, 165, 0, 0.9)', baseHealth: 100, energy: 100, size: 18, decayRate: 0.3, reproductionChance: 0.002, speed: 2, preferredBiome: 'terrestrial' },
    sun: { emoji: '☀️', color: 'rgba(255, 255, 0, 0.8)', baseHealth: 100, size: 30, decayRate: 0.05 },
    rain: { emoji: '🌧️', color: 'rgba(100, 149, 237, 0.6)', baseHealth: 100, size: 35, decayRate: 1.5 },
    fungus: { emoji: '🍄', color: 'rgba(150, 75, 0, 0.9)', baseHealth: 80, energy: 30, size: 22, decayRate: 0.15, reproductionChance: 0.003 },
    meteor: { emoji: '☄️', color: 'rgba(180, 180, 180, 0.9)', baseHealth: 50, size: 40, decayRate: 100 },
    volcano: { emoji: '🌋', color: 'rgba(100, 0, 0, 0.9)', baseHealth: 200, size: 45, decayRate: 0.05, eruptionChance: 0.001 },
    eraser: { emoji: '🚫', color: 'rgba(255, 0, 0, 0.5)', size: 30, decayRate: 0 },
    extractionProbe: { emoji: '⛏️', color: 'rgba(150, 150, 0, 0.9)', baseHealth: 80, size: 20, decayRate: 0.02, extractionRate: 1 },
    predator: { emoji: '🐺', color: 'rgba(139, 69, 19, 0.9)', baseHealth: 150, energy: 120, size: 25, decayRate: 0.4, reproductionChance: 0.001, speed: 3, preferredPrey: ['creature'] },
    tribe: { emoji: '🛖', color: 'rgba(150, 100, 50, 0.9)', baseHealth: 500, size: 40, decayRate: 0.01, population: 10, technologyLevel: 1 },
};

export class EcosystemElement {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        const def = elementDefinitions[type];
        this.health = def.baseHealth;
        this.energy = def.energy || 0;
        this.size = def.size;
        this.emoji = def.emoji;
        this.decayRate = def.decayRate;
        this.reproductionChance = def.reproductionChance;
        this.speed = def.speed || 0;
        this.age = 0;
    }

    update(simulationState, config, weather, activeTechEffects, weatherEffects) { // Added weatherEffects parameter
        this.age++;
        let decay = this.decayRate;

        // General decay influenced by gravity
        decay *= config.gravity; 

        // Apply microclimate effects if available
        let localWeatherEffect = weather.effect;
        if (weatherEffects && weatherEffects.microclimates) {
            const microclimate = this.getMicroclimateAt(this.x, this.y, weatherEffects.microclimates);
            if (microclimate) {
                // Modify local weather effect based on microclimate
                localWeatherEffect *= (1 + microclimate.temperatureModifier * 0.01); // Small temperature influence
            }
        }

        // General weather effect
        this.health -= decay * localWeatherEffect;
    }

    getMicroclimateAt(x, y, microclimates) {
        const gridX = Math.floor(x / 100);
        const gridY = Math.floor(y / 100);
        const key = `${gridX},${gridY}`;
        return microclimates.get(key) || null;
    }
}

class PlantElement extends EcosystemElement {
    constructor(id, x, y, parentGenome = null) { 
        super(id, x, y, 'plant'); 
        
        // Import genetics system
        import('./systems/geneticsSystem.js').then(genetics => {
            // Initialize genome
            if (parentGenome) {
                this.genome = parentGenome;
            } else {
                this.genome = genetics.createRandomGenome('plant');
            }
            
            // Express genetic traits to phenotype
            this.applyGeneticTraits();
            
            // Apply genetic color
            const geneticColor = genetics.calculateGeneticColor(this.genome, 'plant');
            if (geneticColor) {
                this.color = geneticColor;
            }
        }).catch(err => {
            console.error("Error loading genetics system:", err);
            // Fallback to default values if genetics system fails to load
        });
    }
    
    // Método para aplicar traços genéticos às características fenotípicas
    applyGeneticTraits() {
        if (!this.genome) return;
        
        const phenotype = this.genome.expressTraits();
        
        // Aplica os traços expressos às características do elemento
        this.size = phenotype.size ? phenotype.size * elementDefinitions.plant.size : elementDefinitions.plant.size;
        this.reproductionChance = phenotype.reproductionChance || elementDefinitions.plant.reproductionChance;
        
        // Traços adicionais
        this.waterDependency = phenotype.waterDependency || 1.0;
        this.temperatureTolerance = phenotype.temperatureTolerance || 1.0;
    }
    
    update(simulationState, config, weather, activeTechEffects, weatherEffects) { // Added weatherEffects parameter
        super.update(simulationState, config, weather, activeTechEffects, weatherEffects);

        // Plants need water and light to thrive
        const waterFactor = config.waterPresence / 100; // 0 to 1
        const luminosityFactor = config.luminosity / 2.0; // 0 to 1
        const temperatureFactor = 1 - Math.abs(config.temperature - 20) / 50; // Optimal at 20C, drops off

        let growthRate = 0.1 * waterFactor * luminosityFactor * temperatureFactor;

        // Apply technology effects
        if (activeTechEffects.plant_growth_multiplier) {
            growthRate *= activeTechEffects.plant_growth_multiplier;
        }

        // Apply microclimate effects
        if (weatherEffects && weatherEffects.microclimates) {
            const microclimate = this.getMicroclimateAt(this.x, this.y, weatherEffects.microclimates);
            if (microclimate) {
                // Forest microclimate benefits plants
                if (microclimate.type === 'forest') {
                    temperatureFactor *= 1.2; // Better temperature regulation
                    growthRate *= 1.1; // Slight growth bonus
                }
                // Wetland microclimate provides more water
                if (microclimate.type === 'wetland') {
                    const localWaterFactor = Math.min(1.0, waterFactor + microclimate.humidityModifier / 100);
                    growthRate = 0.1 * localWaterFactor * luminosityFactor * temperatureFactor;
                }
                // Rocky microclimate is harsh for plants
                if (microclimate.type === 'rocky') {
                    growthRate *= 0.8; // Growth penalty
                }
            }
        }

        // Apply seasonal growth effect from weather system
        if (weatherEffects && weatherEffects.seasonalGrowthEffect) {
            growthRate *= weatherEffects.seasonalGrowthEffect;
        }

        // Enhanced weather effects on plants
        if (weather.type === 'rainy' || weather.type === 'stormy') {
            growthRate *= 1.5; // Rain helps plants grow
        } else if (weather.type === 'drought' || weather.type === 'heatwave') {
            growthRate *= 0.3; // Extreme heat/drought severely hinders growth
        } else if (weather.type === 'snowy' || weather.type === 'blizzard') {
            growthRate *= 0.1; // Snow/blizzard severely hinders growth
        } else if (weather.type === 'cloudy' || weather.type === 'fog') {
            growthRate *= 0.8; // Reduced light
        }

        // Soil type influence
        if (config.soilType === 'fertile') {
            growthRate *= 1.5;
        } else if (config.soilType === 'sandy' || config.soilType === 'rocky') {
            growthRate *= 0.5;
        }

        this.health += growthRate;

        // Consume minerals from nearby rocks
        const nearbyRocks = simulationState.elements.filter(el =>
            el.type === 'rock' && Math.hypot(this.x - el.x, this.y - el.y) < 50 && el.currentMinerals
        );

        if (nearbyRocks.length > 0) {
            const targetRock = nearbyRocks[0]; // Just take the first one for simplicity
            const mineralToConsume = 'iron'; // Example: plants consume iron
            let consumptionRate = 0.1; // How much mineral to consume per tick

            // Apply mineral extraction bonus from technology
            if (activeTechEffects.mineral_extraction_bonus) {
                consumptionRate *= (1 + activeTechEffects.mineral_extraction_bonus);
            }

            if (targetRock.currentMinerals[mineralToConsume] > consumptionRate) {
                targetRock.currentMinerals[mineralToConsume] -= consumptionRate;
                this.health += consumptionRate * 0.5; // Plants gain health from minerals
            }
        }

        // Reproduction based on health and conditions, using genome
        if (this.health > 80) {
            // Use the reproductionChance from genome if available, otherwise fallback to default
            const reproChance = this.genome ? 
                this.genome.expressTraits().reproductionChance : 
                this.reproductionChance;
                
            if (Math.random() < reproChance * waterFactor * luminosityFactor) {
                // If we have a genome system, create a child with genetic inheritance
                if (this.genome) {
                    // Plants can reproduce with nearby plants (cross-pollination) or by themselves
                    const nearbyPlants = simulationState.elements.filter(el => 
                        el.type === 'plant' && 
                        el !== this && 
                        el.genome && 
                        Math.hypot(this.x - el.x, this.y - el.y) < 40 &&
                        el.health > 60
                    );
                    
                    let childGenome;
                    
                    // If we found a nearby plant, combine genomes (cross-pollination)
                    if (nearbyPlants.length > 0 && Math.random() < 0.7) { // 70% chance of cross-pollination if possible
                        // Find the most compatible plant for pollination
                        let bestMatch = nearbyPlants[0];
                        let bestCompatibility = this.genome.calculateCompatibility(bestMatch.genome);
                        
                        for (let i = 1; i < nearbyPlants.length; i++) {
                            const compatibility = this.genome.calculateCompatibility(nearbyPlants[i].genome);
                            if (compatibility > bestCompatibility) {
                                bestMatch = nearbyPlants[i];
                                bestCompatibility = compatibility;
                            }
                        }
                        
                        // Cross-pollination - combine genomes
                        childGenome = this.genome.combine(bestMatch.genome);
                    } else {
                        // Self-pollination - clone with mutations
                        childGenome = new (this.genome.constructor)(JSON.parse(JSON.stringify(this.genome.traits)));
                        childGenome.mutate(); // Apply mutations
                    }
                    
                    // Create the child plant with the new genome
                    simulationState.newElements.push(
                        new PlantElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50, 
                            childGenome
                        )
                    );
                } else {
                    // Fallback to old system if genome is not available
                    simulationState.newElements.push(
                        new PlantElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50
                        )
                    );
                }
            }
        }
    }
}

class CreatureElement extends EcosystemElement {
    constructor(id, x, y, parentGenome = null) {
        super(id, x, y, 'creature');
        this.preferredBiome = elementDefinitions.creature.preferredBiome;
        this.target = null;
        this.fleeingFrom = null; // To store the predator it's fleeing from
        
        // Social behavior properties
        this.socialGroup = null;
        this.leaderInfluence = null;
        this.sharedFoodSources = null;
        this.nearbyFood = null;
        this.velocity = { x: 0, y: 0 };
        this.socialBehavior = this.determineSocialBehavior();
        this.territorialRadius = 50 + Math.random() * 50; // Individual territory size
        this.aggressiveness = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
        this.cooperativeness = 0.2 + Math.random() * 0.6; // 0.2 to 0.8

        // Import genetics system
        import('./systems/geneticsSystem.js').then(genetics => {
            // Initialize genome
            if (parentGenome) {
                this.genome = parentGenome;
            } else {
                this.genome = genetics.createRandomGenome('creature');
            }
            
            // Express genetic traits to phenotype
            this.applyGeneticTraits();
            
            // Apply genetic color
            const geneticColor = genetics.calculateGeneticColor(this.genome, 'creature');
            if (geneticColor) {
                this.color = geneticColor;
            }
        }).catch(err => {
            console.error("Error loading genetics system:", err);
            
            // Fallback to old genetic system if module fails to load
            this.geneSpeed = elementDefinitions.creature.speed;
            this.geneSize = elementDefinitions.creature.size;
            this.geneReproductionChance = elementDefinitions.creature.reproductionChance;
            
            // Apply genetic properties to actual stats
            this.speed = this.geneSpeed;
            this.size = this.geneSize;
            this.reproductionChance = this.geneReproductionChance;
        });
    }
    
    // Método para aplicar traços genéticos às características fenotípicas
    applyGeneticTraits() {
        if (!this.genome) return;
        
        const phenotype = this.genome.expressTraits();
        
        // Aplica os traços expressos às características do elemento
        this.speed = phenotype.speed ? phenotype.speed * elementDefinitions.creature.speed : elementDefinitions.creature.speed;
        this.size = phenotype.size ? phenotype.size * elementDefinitions.creature.size : elementDefinitions.creature.size;
        this.reproductionChance = phenotype.reproductionChance || elementDefinitions.creature.reproductionChance;
        
        // Traços adicionais
        this.metabolismRate = phenotype.metabolismRate || 1.0;
        this.aggressiveness = phenotype.aggressiveness || 0.5;
        this.temperatureTolerance = phenotype.temperatureTolerance || 1.0;
        this.waterDependency = phenotype.waterDependency || 1.0;
    }
    
    determineSocialBehavior() {
        const behaviors = ['flocking', 'herding', 'territorial', 'cooperative', 'solitary'];
        const weights = [0.3, 0.25, 0.2, 0.15, 0.1]; // Probabilities for each behavior
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < behaviors.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return behaviors[i];
            }
        }
        
        return 'solitary'; // Fallback
    }
    update(simulationState, config, weather, activeTechEffects, weatherEffects) { // Added weatherEffects parameter
        super.update(simulationState, config, weather, activeTechEffects, weatherEffects);

        // NEW: Fleeing logic
        const nearbyPredators = simulationState.elements.filter(el =>
            el.type === 'predator' && el.health > 0 && Math.hypot(this.x - el.x, this.y - el.y) < 150 // Flee radius
        );

        if (nearbyPredators.length > 0) {
            // Prioritize fleeing from the closest predator
            this.fleeingFrom = nearbyPredators.reduce((prev, curr) => {
                const distPrev = Math.hypot(this.x - prev.x, this.y - prev.y);
                const distCurr = Math.hypot(this.x - curr.x, this.y - curr.y);
                return (distPrev < distCurr) ? prev : curr;
            });
            this.target = null; // Clear plant target when fleeing
        } else {
            this.fleeingFrom = null; // No predators to flee from
            // Find nearest plant if no target or target is dead
            if (!this.target || this.target.health <= 0) {
                const plants = simulationState.elements.filter(el => el.type === 'plant' && el.health > 0);
                if (plants.length > 0) {
                    this.target = plants.reduce((prev, curr) => {
                        const distPrev = Math.hypot(this.x - prev.x, this.y - prev.y);
                        const distCurr = Math.hypot(this.x - curr.x, this.y - curr.y);
                        return (distPrev < distCurr) ? prev : curr;
                    });
                } else {
                    this.target = null;
                }
            }
        }

        // Movement influenced by gravity and target/fleeing, based on geneSpeed
        let moveX = (Math.random() - 0.5) * this.geneSpeed / config.gravity;
        let moveY = (Math.random() - 0.5) * this.geneSpeed / config.gravity;

        // Social behavior influences on movement
        let socialMoveX = 0, socialMoveY = 0;
        
        // Leader influence
        if (this.leaderInfluence && this.socialBehavior !== 'territorial') {
            const leaderAngle = Math.atan2(
                this.leaderInfluence.y - this.y,
                this.leaderInfluence.x - this.x
            );
            const leaderDistance = Math.hypot(
                this.leaderInfluence.x - this.x,
                this.leaderInfluence.y - this.y
            );
            
            // Follow leader if not too close
            if (leaderDistance > 30) {
                socialMoveX += Math.cos(leaderAngle) * this.leaderInfluence.strength * 0.5;
                socialMoveY += Math.sin(leaderAngle) * this.leaderInfluence.strength * 0.5;
            }
        }
        
        // Territorial behavior - defend personal space
        if (this.socialBehavior === 'territorial') {
            const nearbyCreatures = simulationState.elements.filter(el =>
                el.type === 'creature' && el !== this && 
                Math.hypot(this.x - el.x, this.y - el.y) < this.territorialRadius
            );
            
            nearbyCreatures.forEach(creature => {
                const angle = Math.atan2(creature.y - this.y, creature.x - this.x);
                const distance = Math.hypot(creature.x - this.x, creature.y - this.y);
                const repelStrength = (this.territorialRadius - distance) / this.territorialRadius;
                
                socialMoveX -= Math.cos(angle) * repelStrength * this.aggressiveness;
                socialMoveY -= Math.sin(angle) * repelStrength * this.aggressiveness;
            });
        }
        
        // Cooperative behavior - share food sources
        if (this.socialBehavior === 'cooperative' && this.sharedFoodSources) {
            const availableFood = this.sharedFoodSources.filter(food => 
                food && food.health > 0 && !this.target
            );
            
            if (availableFood.length > 0) {
                const closestFood = availableFood.reduce((prev, curr) => {
                    const distPrev = Math.hypot(this.x - prev.x, this.y - prev.y);
                    const distCurr = Math.hypot(this.x - curr.x, this.y - curr.y);
                    return (distPrev < distCurr) ? prev : curr;
                });
                
                if (!this.target || Math.hypot(this.x - closestFood.x, this.y - closestFood.y) < 
                    Math.hypot(this.x - this.target.x, this.y - this.target.y)) {
                    this.target = closestFood;
                }
            }
        }

        if (this.fleeingFrom) {
            const angle = Math.atan2(this.fleeingFrom.y - this.y, this.fleeingFrom.x - this.x); // Angle towards predator
            moveX = -Math.cos(angle) * this.geneSpeed * 1.5 / config.gravity; // Move away faster
            moveY = -Math.sin(angle) * this.geneSpeed * 1.5 / config.gravity;
        } else if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            moveX = Math.cos(angle) * this.geneSpeed / config.gravity;
            moveY = Math.sin(angle) * this.geneSpeed / config.gravity;
        }
        
        // Apply social influences to movement
        moveX += socialMoveX;
        moveY += socialMoveY;
        
        // Update velocity for flocking calculations
        this.velocity.x = moveX;
        this.velocity.y = moveY;

        this.x += moveX;
        this.y += moveY;

        // Energy consumption influenced by temperature and water
        let energyConsumption = 0.1;
        if (config.temperature > 30 || config.temperature < 0) {
            energyConsumption *= 1.5; // More energy consumed in extreme temperatures
        }
        if (config.waterPresence < 30) {
            energyConsumption *= 1.2; // More energy consumed with less water
        }

        // Apply technology effects
        if (activeTechEffects.creature_energy_reduction) {
            energyConsumption *= (1 - activeTechEffects.creature_energy_reduction);
        }

        // Apply microclimate effects
        if (weatherEffects && weatherEffects.microclimates) {
            const microclimate = this.getMicroclimateAt(this.x, this.y, weatherEffects.microclimates);
            if (microclimate) {
                // Forest microclimate provides shelter
                if (microclimate.type === 'forest') {
                    energyConsumption *= 0.9; // Less energy consumption in shelter
                }
                // Wetland microclimate provides water access
                if (microclimate.type === 'wetland') {
                    energyConsumption *= 0.8; // Easy water access reduces energy needs
                }
                // Rocky microclimate is harsh
                if (microclimate.type === 'rocky') {
                    energyConsumption *= 1.1; // More energy needed in harsh terrain
                }
            }
        }

        // Enhanced weather effects on creatures
        if (weather.type === 'rainy' || weather.type === 'stormy') {
            energyConsumption *= 1.2; // Creatures might struggle in heavy rain/storms
        } else if (weather.type === 'drought' || weather.type === 'heatwave') {
            energyConsumption *= 1.8; // Extreme heat severely affects creatures
        } else if (weather.type === 'snowy' || weather.type === 'blizzard') {
            energyConsumption *= 2.0; // Extreme cold severely affects creatures
        } else if (weather.type === 'fog') {
            energyConsumption *= 1.1; // Reduced visibility affects movement
        }

        this.energy -= energyConsumption;

        // Biome suitability
        let biomeSuitability = 1.0;
        if (this.preferredBiome === 'aquatic' && config.waterPresence < 50) {
            biomeSuitability *= 0.5;
        } else if (this.preferredBiome === 'desert' && config.waterPresence > 50) {
            biomeSuitability *= 0.5;
        } // Add more biome checks as needed

        this.health *= biomeSuitability; // Health degrades if not in preferred biome

        if(this.energy <= 0) this.health -= 0.5;

        // Enhanced interaction with plants (food source) including social behaviors
        simulationState.elements.forEach(el => {
            if (el.type === 'plant' && Math.hypot(this.x - el.x, this.y - el.y) < 20) {
                let feedingEfficiency = 1.0;
                let energyGain = 0.5;
                
                // Cooperative feeding bonus
                if (this.socialBehavior === 'cooperative' && this.socialGroup) {
                    const nearbyGroupMembers = Array.from(this.socialGroup.members).filter(member =>
                        member !== this && Math.hypot(this.x - member.x, this.y - member.y) < 50
                    );
                    
                    if (nearbyGroupMembers.length > 0) {
                        feedingEfficiency *= 1.2; // 20% bonus for group feeding
                        energyGain *= 1.2;
                        
                        // Share food information with nearby group members
                        nearbyGroupMembers.forEach(member => {
                            if (!member.nearbyFood || Math.hypot(member.x - el.x, member.y - el.y) > 
                                Math.hypot(member.x - member.nearbyFood.x, member.y - member.nearbyFood.y)) {
                                member.nearbyFood = el;
                            }
                        });
                    }
                }
                
                // Territorial feeding - more aggressive feeding
                if (this.socialBehavior === 'territorial') {
                    feedingEfficiency *= 1.1;
                    energyGain *= 1.1;
                    
                    // Defend food source from other creatures
                    const competitors = simulationState.elements.filter(competitor =>
                        competitor.type === 'creature' && competitor !== this &&
                        Math.hypot(competitor.x - el.x, competitor.y - el.y) < 30
                    );
                    
                    competitors.forEach(competitor => {
                        if (competitor.energy) {
                            competitor.energy -= 0.2; // Intimidation effect
                        }
                    });
                }
                
                el.health -= feedingEfficiency;
                this.energy += energyGain;
                this.nearbyFood = el; // Remember this food source
            }
        });

        // Reproduction influenced by health, environment, and social behavior
        if (this.health > 70 && this.energy > 50) {
            // Use the reproductionChance from genome if available, otherwise fallback to old system
            let reproChance = this.genome ? 
                this.genome.expressTraits().reproductionChance : 
                this.geneReproductionChance;
            
            // Social behavior influences on reproduction
            if (this.socialGroup && this.socialGroup.members.size >= 3) {
                // Group breeding bonus (already applied in social system)
                reproChance *= 1.2;
            }
            
            if (this.socialBehavior === 'cooperative' && this.cooperativeness > 0.6) {
                reproChance *= 1.1; // Cooperative creatures breed more successfully
            }
            
            if (this.socialBehavior === 'territorial' && this.aggressiveness > 0.6) {
                reproChance *= 1.05; // Territorial creatures defend breeding grounds
            }
                
            if (Math.random() < reproChance / config.gravity * biomeSuitability) {
                // If we have a genome system, create a child with genetic inheritance
                if (this.genome) {
                    // Find a potential mate nearby (optional)
                    const potentialMates = simulationState.elements.filter(el => 
                        el.type === 'creature' && 
                        el !== this && 
                        el.genome && 
                        Math.hypot(this.x - el.x, this.y - el.y) < 50 &&
                        el.health > 50
                    );
                    
                    let childGenome;
                    
                    // If we found a mate, combine genomes
                    if (potentialMates.length > 0) {
                        // Find the most compatible mate
                        let bestMate = potentialMates[0];
                        let bestCompatibility = this.genome.calculateCompatibility(bestMate.genome);
                        
                        for (let i = 1; i < potentialMates.length; i++) {
                            const compatibility = this.genome.calculateCompatibility(potentialMates[i].genome);
                            if (compatibility > bestCompatibility) {
                                bestMate = potentialMates[i];
                                bestCompatibility = compatibility;
                            }
                        }
                        
                        // Sexual reproduction - combine genomes
                        childGenome = this.genome.combine(bestMate.genome);
                        
                        // Log the reproduction event
                        logToObserver(`Criatura em ${this.x.toFixed(0)},${this.y.toFixed(0)} reproduziu-se com outra criatura (compatibilidade: ${(bestCompatibility * 100).toFixed(0)}%).`);
                    } else {
                        // Asexual reproduction - clone with mutations
                        childGenome = new (this.genome.constructor)(JSON.parse(JSON.stringify(this.genome.traits)));
                        childGenome.mutate(); // Apply mutations
                        
                        // Log the reproduction event
                        logToObserver(`Criatura em ${this.x.toFixed(0)},${this.y.toFixed(0)} reproduziu-se assexuadamente.`);
                    }
                    
                    // Create the child with the new genome
                    simulationState.newElements.push(
                        new CreatureElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50, 
                            childGenome
                        )
                    );
                } else {
                    // Fallback to old system if genome is not available
                    simulationState.newElements.push(
                        new CreatureElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50, 
                            {
                                geneSpeed: this.geneSpeed,
                                geneSize: this.geneSize,
                                geneReproductionChance: this.geneReproductionChance
                            }
                        )
                    );
                }
                
                // Reproduction costs energy
                this.energy -= 20;
            }
        }
    }
}

class PredatorElement extends EcosystemElement {
    constructor(id, x, y, parentGenome = null) {
        super(id, x, y, 'predator');
        this.target = null;
        this.preferredPrey = elementDefinitions.predator.preferredPrey;
        
        // Import genetics system
        import('./systems/geneticsSystem.js').then(genetics => {
            // Initialize genome
            if (parentGenome) {
                this.genome = parentGenome;
            } else {
                this.genome = genetics.createRandomGenome('predator');
            }
            
            // Express genetic traits to phenotype
            this.applyGeneticTraits();
            
            // Apply genetic color
            const geneticColor = genetics.calculateGeneticColor(this.genome, 'predator');
            if (geneticColor) {
                this.color = geneticColor;
            }
        }).catch(err => {
            console.error("Error loading genetics system:", err);
            // Fallback to default values if genetics system fails to load
        });
    }
    
    // Método para aplicar traços genéticos às características fenotípicas
    applyGeneticTraits() {
        if (!this.genome) return;
        
        const phenotype = this.genome.expressTraits();
        
        // Aplica os traços expressos às características do elemento
        this.speed = phenotype.speed ? phenotype.speed * elementDefinitions.predator.speed : elementDefinitions.predator.speed;
        this.size = phenotype.size ? phenotype.size * elementDefinitions.predator.size : elementDefinitions.predator.size;
        this.reproductionChance = phenotype.reproductionChance || elementDefinitions.predator.reproductionChance;
        
        // Traços adicionais
        this.metabolismRate = phenotype.metabolismRate || 1.0;
        this.aggressiveness = phenotype.aggressiveness || 0.7; // Predators are more aggressive by default
        this.temperatureTolerance = phenotype.temperatureTolerance || 1.0;
        this.waterDependency = phenotype.waterDependency || 0.8;
    }

    update(simulationState, config, weather, activeTechEffects, weatherEffects) { // Added weatherEffects parameter
        super.update(simulationState, config, weather, activeTechEffects, weatherEffects);

        // Find nearest prey if no target or target is dead
        if (!this.target || this.target.health <= 0 || !simulationState.elements.includes(this.target)) {
            const potentialPrey = simulationState.elements.filter(el =>
                this.preferredPrey.includes(el.type) && el.health > 0
            );
            if (potentialPrey.length > 0) {
                this.target = potentialPrey.reduce((prev, curr) => {
                    const distPrev = Math.hypot(this.x - prev.x, this.y - prev.y);
                    const distCurr = Math.hypot(this.x - curr.x, this.y - curr.y);
                    return (distPrev < distCurr) ? prev : curr;
                });
            } else {
                this.target = null;
            }
        }

        // Movement towards target
        let moveX = (Math.random() - 0.5) * this.speed / config.gravity;
        let moveY = (Math.random() - 0.5) * this.speed / config.gravity;

        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            moveX = Math.cos(angle) * this.speed / config.gravity;
            moveY = Math.sin(angle) * this.speed / config.gravity;
        }

        this.x += moveX;
        this.y += moveY;

        // Energy consumption
        let energyConsumption = 0.15;

        // Apply microclimate effects
        if (weatherEffects && weatherEffects.microclimates) {
            const microclimate = this.getMicroclimateAt(this.x, this.y, weatherEffects.microclimates);
            if (microclimate) {
                // Forest microclimate provides hunting advantages
                if (microclimate.type === 'forest') {
                    energyConsumption *= 0.9; // Better hunting conditions
                }
                // Wetland microclimate attracts prey
                if (microclimate.type === 'wetland') {
                    energyConsumption *= 0.85; // More prey available
                }
                // Rocky microclimate is challenging for hunting
                if (microclimate.type === 'rocky') {
                    energyConsumption *= 1.2; // Harder to hunt in rocky terrain
                }
            }
        }

        // Enhanced weather effects on predators
        if (weather.type === 'snowy' || weather.type === 'blizzard') {
            energyConsumption *= 1.8; // Extreme cold severely affects predators
        } else if (weather.type === 'drought' || weather.type === 'heatwave') {
            energyConsumption *= 1.5; // Heat affects hunting efficiency
        } else if (weather.type === 'stormy') {
            energyConsumption *= 1.3; // Storms make hunting difficult
        } else if (weather.type === 'fog') {
            energyConsumption *= 1.4; // Reduced visibility affects hunting
        }

        this.energy -= energyConsumption;

        // Interaction with prey (eating) - using food web system
        if (this.target && Math.hypot(this.x - this.target.x, this.y - this.target.y) < (this.size + this.target.size) / 2) {
            // Use food web system to process predator-prey interaction
            const interactionResult = processPredatorPreyInteraction(this, this.target);
            
            if (interactionResult.success) {
                // Successful predation
                const eatenAmount = 10 + (interactionResult.energyGained || 0);
                this.target.health -= eatenAmount;
                this.health += eatenAmount * 0.5; // Predator gains health
                this.energy += eatenAmount * 0.8; // Predator gains energy

                // Ensure health and energy don't exceed base values
                this.health = Math.min(this.health, elementDefinitions.predator.baseHealth);
                this.energy = Math.min(this.energy, elementDefinitions.predator.energy);

                // Publish predation event
                publish(EventTypes.ELEMENT_INTERACTION, {
                    predatorId: this.id,
                    preyId: this.target.id,
                    interactionType: 'predation',
                    success: true,
                    energyTransferred: interactionResult.energyGained
                });

                if (this.target.health <= 0) {
                    logToObserver(`Predador devorou ${this.target.type} em ${this.target.x.toFixed(0)},${this.target.y.toFixed(0)}.`);
                    this.target = null; // Prey is gone
                }
            } else {
                // Failed predation attempt
                this.energy -= 2; // Predator loses energy from failed hunt
                
                // Publish failed predation event
                publish(EventTypes.ELEMENT_INTERACTION, {
                    predatorId: this.id,
                    preyId: this.target.id,
                    interactionType: 'predation',
                    success: false
                });
                
                logToObserver(`Predador falhou ao tentar caçar ${this.target.type} em ${this.target.x.toFixed(0)},${this.target.y.toFixed(0)}.`);
            }
        }

        // Health decay if energy is low
        if (this.energy <= 0) {
            this.health -= 0.5;
        }

        // Reproduction using genetics system
        if (this.health > 100 && this.energy > 80) {
            // Use the reproductionChance from genome if available, otherwise fallback to default
            const reproChance = this.genome ? 
                this.genome.expressTraits().reproductionChance : 
                this.reproductionChance;
                
            if (Math.random() < reproChance / config.gravity) {
                // If we have a genome system, create a child with genetic inheritance
                if (this.genome) {
                    // Find a potential mate nearby (optional)
                    const potentialMates = simulationState.elements.filter(el => 
                        el.type === 'predator' && 
                        el !== this && 
                        el.genome && 
                        Math.hypot(this.x - el.x, this.y - el.y) < 70 &&
                        el.health > 70
                    );
                    
                    let childGenome;
                    
                    // If we found a mate, combine genomes
                    if (potentialMates.length > 0) {
                        // Find the most compatible mate
                        let bestMate = potentialMates[0];
                        let bestCompatibility = this.genome.calculateCompatibility(bestMate.genome);
                        
                        for (let i = 1; i < potentialMates.length; i++) {
                            const compatibility = this.genome.calculateCompatibility(potentialMates[i].genome);
                            if (compatibility > bestCompatibility) {
                                bestMate = potentialMates[i];
                                bestCompatibility = compatibility;
                            }
                        }
                        
                        // Sexual reproduction - combine genomes
                        childGenome = this.genome.combine(bestMate.genome);
                        
                        // Log the reproduction event
                        logToObserver(`Predador em ${this.x.toFixed(0)},${this.y.toFixed(0)} reproduziu-se com outro predador (compatibilidade: ${(bestCompatibility * 100).toFixed(0)}%).`);
                    } else {
                        // Asexual reproduction - clone with mutations
                        childGenome = new (this.genome.constructor)(JSON.parse(JSON.stringify(this.genome.traits)));
                        childGenome.mutate(); // Apply mutations
                        
                        // Log the reproduction event
                        logToObserver(`Predador em ${this.x.toFixed(0)},${this.y.toFixed(0)} reproduziu-se assexuadamente.`);
                    }
                    
                    // Create the child with the new genome
                    simulationState.newElements.push(
                        new PredatorElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50, 
                            childGenome
                        )
                    );
                } else {
                    // Fallback to old system if genome is not available
                    simulationState.newElements.push(
                        new PredatorElement(
                            Date.now() + Math.random(), 
                            this.x + (Math.random() - 0.5) * 50, 
                            this.y + (Math.random() - 0.5) * 50
                        )
                    );
                }
                
                // Reproduction costs energy
                this.energy -= 30;
            }
        }
    }
}

class TribeElement extends EcosystemElement {
    constructor(id, x, y, initialPopulation = 10) {
        super(id, x, y, 'tribe');
        this.population = initialPopulation;
        this.technologyLevel = elementDefinitions.tribe.technologyLevel;
    }

    update(simulationState, config, weather, activeTechEffects, weatherEffects) {
        super.update(simulationState, config, weather, activeTechEffects, weatherEffects);

        // Tribe consumes resources (e.g., plants)
        const nearbyPlants = simulationState.elements.filter(el =>
            el.type === 'plant' && Math.hypot(this.x - el.x, this.y - el.y) < 100
        );

        if (nearbyPlants.length > 0 && this.population > 0) {
            const plantToConsume = nearbyPlants[0];
            const consumptionRate = 0.1 * this.population;
            if (plantToConsume.health > consumptionRate) {
                plantToConsume.health -= consumptionRate;
                this.health += consumptionRate * 0.1; // Tribe gains health from consuming
            } else {
                this.health -= 0.5; // Lose health if no food
            }
        } else if (this.population > 0) {
            this.health -= 0.5; // Lose health if no food
        }

        // Tribe population growth (slowly)
        if (this.health > 100 && Math.random() < 0.0001 * this.technologyLevel) {
            this.population += 1;
            logToObserver(`A tribo em ${this.x.toFixed(0)},${this.y.toFixed(0)} cresceu para ${this.population} indivíduos.`);
        }

        // Tribe can research technologies (placeholder for now)
        if (Math.random() < 0.00001 * this.technologyLevel) {
            // logToObserver(`A tribo em ${this.x.toFixed(0)},${this.y.toFixed(0)} está pesquisando uma nova tecnologia!`);
        }

        // Tribe can build (placeholder for now)
        if (Math.random() < 0.000005 * this.technologyLevel) {
            // logToObserver(`A tribo em ${this.x.toFixed(0)},${this.y.toFixed(0)} está construindo algo!`);
        }

        // Tribe can die if health is too low or population is zero
        if (this.health <= 0 || this.population <= 0) {
            logToObserver(`A tribo em ${this.x.toFixed(0)},${this.y.toFixed(0)} foi extinta.`);
            this.health = 0; // Ensure it's removed
        }
    }
}

class WaterElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'water'); this.amount = 100; this.lastSpreadTick = 0; }
    update(simulationState, config) {
        super.update(simulationState, config);

        // Only spread every 10 ticks to reduce overhead
        if (this.health > 0 && this.amount > 10 && simulationState.age - this.lastSpreadTick > 10) {
            const spreadAmount = this.amount * 0.05; // Reduced spread amount
            this.amount -= spreadAmount;
            this.lastSpreadTick = simulationState.age;

            const neighbors = [
                { x: this.x + this.size, y: this.y },
                { x: this.x - this.size, y: this.y },
                { x: this.x, y: this.y + this.size },
                { x: this.x, y: this.y - this.size },
            ];

            neighbors.forEach(n => {
                let existingWater = simulationState.elements.find(el => el.type === 'water' && Math.hypot(el.x - n.x, el.y - n.y) < this.size * 2); // Larger search radius
                if (existingWater) {
                    existingWater.amount += spreadAmount / neighbors.length;
                } else if (Math.random() < 0.2) { // Reduced chance to create new element
                    simulationState.newElements.push(new WaterElement(Date.now() + Math.random(), n.x, n.y));
                }
            });
        }
        if (this.amount <= 0) this.health = 0; // No more water, element dies
    }
}

class RockElement extends EcosystemElement {
    constructor(id, x, y) {
        super(id, x, y, 'rock');
        this.height = Math.random() * 50 + 10; // Random height
        this.currentMinerals = { ...elementDefinitions.rock.minerals }; // Initialize with defined minerals
    }
    update(simulationState, config) {
        super.update(simulationState, config);
        // Rocks are mostly static, but might erode over time
        this.height -= 0.01 * config.waterPresence / 100; // Erosion by water
        if (this.height < 5) this.health = 0; // Eroded away
    }
}

class SunElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'sun'); }
    update(simulationState, config) {
        super.update(simulationState, config);
        // Sun provides luminosity, which is handled by the renderer
        // No direct health impact on itself, but influences others
    }
}

class RainElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'rain'); this.duration = 100; } // Rain lasts for a duration
    update(simulationState, config) {
        super.update(simulationState, config);
        this.duration--;
        if (this.duration <= 0) this.health = 0; // Rain stops

        // Increase water presence in the area
        simulationState.elements.forEach(el => {
            if (el.type === 'water' && Math.hypot(this.x - el.x, el.y - el.y) < 100) {
                el.amount += 1; // Add water to existing water bodies
            }
        });
    }
}

class VolcanoElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'volcano'); this.eruptionCooldown = 0; }
    update(simulationState, config) {
        super.update(simulationState, config);

        if (this.eruptionCooldown > 0) {
            this.eruptionCooldown--;
        } else if (Math.random() < elementDefinitions.volcano.eruptionChance) {
            // Trigger eruption
            this.eruptionCooldown = 100; // Cooldown for 100 ticks
            logToObserver(`Vulcão em ${this.x.toFixed(0)},${this.y.toFixed(0)} entrou em erupção!`);
            const volcano3DPos = get3DPositionOnPlanet(this.x, this.y, simulationState.config, this.type);
            triggerVolcanoEruption(volcano3DPos);

            // Impact nearby elements
            simulationState.elements.forEach(el => {
                const distance = Math.hypot(this.x - el.x, this.y - el.y);
                if (distance < 100) { // Area of effect
                    el.health -= 50; // Damage
                    if (el.health <= 0) {
                        logToObserver(`${el.type} em ${el.x.toFixed(0)},${el.y.toFixed(0)} foi destruído pela erupção.`);
                    }
                }
            });
        }
    }
}

class MeteorElement extends EcosystemElement {
    constructor(id, x, y) {
        super(id, x, y, 'meteor');
        this.impacted = false;
        // Define a random start position far above the planet
        const startDistance = 500; // Fixed distance for now
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI / 4; // Some elevation
        this.startPos = new THREE.Vector3(
            startDistance * Math.cos(angle) * Math.cos(elevation),
            startDistance * Math.sin(elevation),
            startDistance * Math.sin(angle) * Math.cos(elevation)
        );
        this.targetPos = get3DPositionOnPlanet(x, y, { ecosystemSize: 'medium' }, 'meteor'); // Target on planet surface
        this.progress = 0; // 0 to 1, 1 means impact
    }

    update(simulationState, config) {
        super.update(simulationState, config);

        if (!this.impacted) {
            this.progress += 0.01; // Meteor moves towards the planet
            if (this.progress >= 1) {
                this.impacted = true;
                logToObserver(`Meteoro impactou em ${this.x.toFixed(0)},${this.y.toFixed(0)}!`);
                triggerMeteorImpact(this.targetPos);

                // Impact nearby elements
                simulationState.elements.forEach(el => {
                    const distance = Math.hypot(this.x - el.x, this.y - el.y);
                    if (distance < 150) { // Larger area of effect
                        el.health -= 80; // More damage
                        if (el.health <= 0) {
                            logToObserver(`${el.type} em ${el.x.toFixed(0)},${el.y.toFixed(0)} foi destruído pelo impacto do meteoro.`);
                        }
                    }
                });
                this.health = 0; // Meteor is destroyed after impact
            } else {
                // Update current 3D position based on progress
                const current3DPos = new THREE.Vector3().lerpVectors(this.startPos, this.targetPos, this.progress);
                this.x = current3DPos.x; // Update x and y for 2D simulation logic
                this.y = current3DPos.y;
                this.z = current3DPos.z; // Store z for 3D rendering
            }
        }
    }
}

class ExtractionProbeElement extends EcosystemElement {
    constructor(id, x, y) {
        super(id, x, y, 'extractionProbe');
        this.extractedMinerals = { iron: 0, silicon: 0, carbon: 0 };
    }

    update(simulationState, config) {
        super.update(simulationState, config);

        const nearbyRocks = simulationState.elements.filter(el =>
            el.type === 'rock' && el.health > 0 && Math.hypot(this.x - el.x, this.y - el.y) < 50
        );

        if (nearbyRocks.length > 0) {
            const targetRock = nearbyRocks[0];
            const extractionRate = elementDefinitions.extractionProbe.extractionRate;

            for (const mineral in this.extractedMinerals) {
                if (targetRock.currentMinerals[mineral] > 0) {
                    const extracted = Math.min(extractionRate, targetRock.currentMinerals[mineral]);
                    this.extractedMinerals[mineral] += extracted;
                    targetRock.currentMinerals[mineral] -= extracted;
                    // logToObserver(`Sonda de Extração em ${this.x.toFixed(0)},${this.y.toFixed(0)} extraiu ${extracted.toFixed(2)} de ${mineral} da rocha.`);
                }
            }
        } else {
            this.health -= 0.1; // Lose health if no rocks to extract from
        }
    }
}

export const elementClasses = {
    water: WaterElement,
    rock: RockElement,
    plant: PlantElement,
    creature: CreatureElement,
    sun: SunElement,
    rain: RainElement,
    fungus: (id, x, y) => new EcosystemElement(id, x, y, 'fungus'),
    meteor: MeteorElement,
    volcano: VolcanoElement,
    predator: PredatorElement,
    tribe: TribeElement,
    extractionProbe: ExtractionProbeElement,
    eraser: (id, x, y) => new EcosystemElement(id, x, y, 'eraser'),
};