// js/elements/creature.js
import { BaseElement } from './baseElement.js';
import { elementDefinitions } from '../utils.js';
import { logToObserver } from '../utils.js';

/**
 * Helper function for gene mutation
 * @param {number} geneValue - Current gene value
 * @param {number} mutationRate - Rate of mutation (0-1)
 * @returns {number} - Mutated gene value
 */
function mutateGene(geneValue, mutationRate) {
    const mutationAmount = (Math.random() * 2 - 1) * mutationRate; // Random value between -mutationRate and +mutationRate
    return Math.max(0, geneValue + mutationAmount); // Ensure gene value doesn't go below zero
}

/**
 * Creature element class
 * Represents creatures in the ecosystem
 */
export class CreatureElement extends BaseElement {
    /**
     * Create a new creature element
     * @param {number} id - Unique identifier for the element
     * @param {number} x - X coordinate in the 2D ecosystem space
     * @param {number} y - Y coordinate in the 2D ecosystem space
     * @param {Object} parentGenes - Genes inherited from parent (optional)
     */
    constructor(id, x, y, parentGenes = {}) {
        super(id, x, y, 'creature');
        
        // Add creature-specific tags
        this.addTag('mobile');
        this.addTag('consumer');
        
        // Store preferred biome as an attribute instead of a direct property
        this.setAttribute('preferredBiome', elementDefinitions.creature.preferredBiome);
        
        // Store targeting information as attributes
        this.setAttribute('target', null);
        this.setAttribute('fleeingFrom', null);

        // Genetic properties stored as attributes
        this.setAttribute('geneSpeed', parentGenes.geneSpeed !== undefined ? 
            mutateGene(parentGenes.geneSpeed, 0.1) : 
            elementDefinitions.creature.speed);
            
        this.setAttribute('geneSize', parentGenes.geneSize !== undefined ? 
            mutateGene(parentGenes.geneSize, 0.1) : 
            elementDefinitions.creature.size);
            
        this.setAttribute('geneReproductionChance', parentGenes.geneReproductionChance !== undefined ? 
            mutateGene(parentGenes.geneReproductionChance, 0.1) : 
            elementDefinitions.creature.reproductionChance);

        // Apply genetic properties to actual stats
        this.speed = this.getAttribute('geneSpeed');
        this.size = this.getAttribute('geneSize');
        this.reproductionChance = this.getAttribute('geneReproductionChance');
    }

    /**
     * Update the creature's state based on simulation conditions
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @param {Object} weather - Current weather conditions
     * @param {Object} activeTechEffects - Active technology effects
     */
    update(simulationState, config, weather, activeTechEffects) {
        super.update(simulationState, config, weather, activeTechEffects);

        // Update movement and targeting
        this.updateTargeting(simulationState);
        
        // Move based on targets and environment
        this.updateMovement(config);
        
        // Update energy consumption
        this.updateEnergyConsumption(config, weather, activeTechEffects);
        
        // Update biome effects
        this.updateBiomeEffects(config);
        
        // Interact with food sources
        this.findAndConsumeFood(simulationState);
        
        // Attempt reproduction
        this.reproduce(simulationState, config);
    }
    
    /**
     * Update targeting for predator avoidance and food seeking
     * @param {Object} simulationState - Current state of the simulation
     */
    updateTargeting(simulationState) {
        // Fleeing logic
        const nearbyPredators = simulationState.elements.filter(el =>
            el.type === 'predator' && el.health > 0 && this.distanceTo(el) < 150 // Flee radius
        );

        if (nearbyPredators.length > 0) {
            // Prioritize fleeing from the closest predator
            this.setAttribute('fleeingFrom', nearbyPredators.reduce((prev, curr) => {
                const distPrev = this.distanceTo(prev);
                const distCurr = this.distanceTo(curr);
                return (distPrev < distCurr) ? prev : curr;
            }));
            this.setAttribute('target', null); // Clear plant target when fleeing
        } else {
            this.setAttribute('fleeingFrom', null); // No predators to flee from
            
            // Find nearest plant if no target or target is dead
            const currentTarget = this.getAttribute('target');
            if (!currentTarget || currentTarget.health <= 0) {
                const plants = simulationState.elements.filter(el => el.type === 'plant' && el.health > 0);
                if (plants.length > 0) {
                    this.setAttribute('target', plants.reduce((prev, curr) => {
                        const distPrev = this.distanceTo(prev);
                        const distCurr = this.distanceTo(curr);
                        return (distPrev < distCurr) ? prev : curr;
                    }));
                } else {
                    this.setAttribute('target', null);
                }
            }
        }
    }
    
    /**
     * Update creature movement based on targets and environment
     * @param {Object} config - Configuration settings for the simulation
     */
    updateMovement(config) {
        const geneSpeed = this.getAttribute('geneSpeed');
        const fleeingFrom = this.getAttribute('fleeingFrom');
        const target = this.getAttribute('target');
        
        // Movement influenced by gravity and target/fleeing, based on geneSpeed
        let moveX = (Math.random() - 0.5) * geneSpeed / config.gravity;
        let moveY = (Math.random() - 0.5) * geneSpeed / config.gravity;

        if (fleeingFrom) {
            const angle = Math.atan2(fleeingFrom.y - this.y, fleeingFrom.x - this.x); // Angle towards predator
            moveX = -Math.cos(angle) * geneSpeed * 1.5 / config.gravity; // Move away faster
            moveY = -Math.sin(angle) * geneSpeed * 1.5 / config.gravity;
        } else if (target) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            moveX = Math.cos(angle) * geneSpeed / config.gravity;
            moveY = Math.sin(angle) * geneSpeed / config.gravity;
        }

        this.x += moveX;
        this.y += moveY;
    }
    
    /**
     * Update energy consumption based on environment
     * @param {Object} config - Configuration settings for the simulation
     * @param {Object} weather - Current weather conditions
     * @param {Object} activeTechEffects - Active technology effects
     */
    updateEnergyConsumption(config, weather, activeTechEffects) {
        // Energy consumption influenced by temperature and water
        let energyConsumption = 0.1;
        
        // Apply attribute-based modifiers
        const metabolismRate = this.getAttribute('metabolismRate', 1.0);
        energyConsumption *= metabolismRate;
        
        if (config.temperature > 30 || config.temperature < 0) {
            energyConsumption *= 1.5; // More energy consumed in extreme temperatures
        }
        if (config.waterPresence < 30) {
            energyConsumption *= 1.2; // More energy consumed with less water
        }

        // Apply technology effects
        if (activeTechEffects && activeTechEffects.creature_energy_reduction) {
            energyConsumption *= (1 - activeTechEffects.creature_energy_reduction);
        }

        // Weather effects on creatures
        if (weather.type === 'rainy') {
            energyConsumption *= 1.2; // Creatures might struggle in heavy rain
        } else if (weather.type === 'dry') {
            energyConsumption *= 1.5; // Dry weather makes creatures thirsty
        } else if (weather.type === 'snowy') {
            energyConsumption *= 1.8; // Cold weather consumes more energy
        }

        this.energy -= energyConsumption;
        
        // Health decreases if energy is depleted
        if(this.energy <= 0) this.health -= 0.5;
    }
    
    /**
     * Update effects based on biome suitability
     * @param {Object} config - Configuration settings for the simulation
     */
    updateBiomeEffects(config) {
        // Biome suitability
        let biomeSuitability = 1.0;
        const preferredBiome = this.getAttribute('preferredBiome');
        
        if (preferredBiome === 'aquatic' && config.waterPresence < 50) {
            biomeSuitability *= 0.5;
        } else if (preferredBiome === 'desert' && config.waterPresence > 50) {
            biomeSuitability *= 0.5;
        } else if (preferredBiome === 'forest' && config.vegetation < 40) {
            biomeSuitability *= 0.7;
        } else if (preferredBiome === 'mountain' && config.elevation < 50) {
            biomeSuitability *= 0.8;
        }

        // Store biome suitability as an attribute for other methods to use
        this.setAttribute('biomeSuitability', biomeSuitability);
        
        // Health degrades if not in preferred biome
        this.health *= biomeSuitability;
    }
    
    /**
     * Find and consume food in the environment
     * @param {Object} simulationState - Current state of the simulation
     */
    findAndConsumeFood(simulationState) {
        // Interaction with plants (food source)
        simulationState.elements.forEach(el => {
            if (el.type === 'plant' && this.distanceTo(el) < 20) {
                this.consume('plant', el);
            }
        });
    }
    
    /**
     * Consume a resource
     * @param {string} resourceType - Type of resource to consume
     * @param {BaseElement} resourceElement - The element to consume
     * @returns {boolean} - True if resource was consumed successfully
     */
    consume(resourceType, resourceElement) {
        if (resourceType === 'plant' && resourceElement && resourceElement.health > 0) {
            const consumptionAmount = 1;
            resourceElement.health -= consumptionAmount;
            this.energy += consumptionAmount * 0.5;
            
            // Track consumption in attributes
            const foodConsumed = this.getAttribute('foodConsumed', {});
            foodConsumed[resourceType] = (foodConsumed[resourceType] || 0) + consumptionAmount;
            this.setAttribute('foodConsumed', foodConsumed);
            
            return true;
        }
        return false;
    }
    
    /**
     * Attempt to reproduce
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @returns {boolean} - True if reproduction was successful
     */
    reproduce(simulationState, config) {
        const biomeSuitability = this.getAttribute('biomeSuitability', 1.0);
        const geneReproductionChance = this.getAttribute('geneReproductionChance');
        
        if (this.health > 70 && this.energy > 50 && Math.random() < geneReproductionChance / config.gravity * biomeSuitability) {
            // Create offspring with inherited genes
            const offspring = new CreatureElement(
                Date.now() + Math.random(), 
                this.x + (Math.random() - 0.5) * 50, 
                this.y + (Math.random() - 0.5) * 50, 
                {
                    geneSpeed: this.getAttribute('geneSpeed'),
                    geneSize: this.getAttribute('geneSize'),
                    geneReproductionChance: this.getAttribute('geneReproductionChance')
                }
            );
            
            // Transfer tags to offspring
            this.getTags().forEach(tag => offspring.addTag(tag));
            
            // Transfer other attributes that should be inherited
            const attributesToInherit = ['preferredBiome', 'metabolismRate'];
            attributesToInherit.forEach(attr => {
                const value = this.getAttribute(attr);
                if (value !== null && value !== undefined) {
                    offspring.setAttribute(attr, value);
                }
            });
            
            simulationState.newElements.push(offspring);
            
            // Log reproduction if creature is being observed
            if (this.hasTag('observed')) {
                logToObserver(`Criatura em ${this.x.toFixed(0)},${this.y.toFixed(0)} se reproduziu.`);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Apply mutations to the creature's genes
     * @param {number} mutationRate - Rate of mutation (0-1)
     * @returns {Object} - Object containing mutated genes
     */
    mutate(mutationRate = 0.1) {
        const mutatedGenes = {
            geneSpeed: mutateGene(this.getAttribute('geneSpeed'), mutationRate),
            geneSize: mutateGene(this.getAttribute('geneSize'), mutationRate),
            geneReproductionChance: mutateGene(this.getAttribute('geneReproductionChance'), mutationRate)
        };
        
        // Apply mutations to attributes
        for (const [gene, value] of Object.entries(mutatedGenes)) {
            this.setAttribute(gene, value);
        }
        
        // Update actual stats based on genes
        this.speed = mutatedGenes.geneSpeed;
        this.size = mutatedGenes.geneSize;
        this.reproductionChance = mutatedGenes.geneReproductionChance;
        
        return mutatedGenes;
    }
    
    /**
     * Interact with another element
     * @param {BaseElement} element - Element to interact with
     * @param {Object} simulationState - Current state of the simulation
     */
    interact(element, simulationState) {
        super.interact(element, simulationState);
        
        // Creatures can interact with water to drink
        if (element.type === 'water' && this.isCollidingWith(element)) {
            const waterDrunk = Math.min(0.3, element.amount || 0);
            if (waterDrunk > 0) {
                element.amount -= waterDrunk;
                this.energy += waterDrunk * 0.3;
                
                // Store consumed water as an attribute
                const waterConsumed = this.getAttribute('waterConsumed', 0);
                this.setAttribute('waterConsumed', waterConsumed + waterDrunk);
            }
        }
    }
    
    /**
     * Handle death of the creature
     * @param {Object} simulationState - Current state of the simulation
     */
    die(simulationState) {
        super.die(simulationState);
        
        // Creatures may leave remains when they die
        if (Math.random() < 0.5) {
            // This would be handled by the simulation system to create a new element
            if (simulationState.newElements && typeof simulationState.newElements.push === 'function') {
                // This is a placeholder for a potential remains element
                // simulationState.newElements.push(new RemainsElement(Date.now(), this.x, this.y));
            }
        }
    }
}
