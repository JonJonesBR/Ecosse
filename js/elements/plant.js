// js/elements/plant.js
import { BaseElement } from './baseElement.js';
import { elementDefinitions } from '../utils.js';
import { logToObserver } from '../utils.js';

/**
 * Plant element class
 * Represents plants in the ecosystem
 */
export class PlantElement extends BaseElement {
    /**
     * Create a new plant element
     * @param {number} id - Unique identifier for the element
     * @param {number} x - X coordinate in the 2D ecosystem space
     * @param {number} y - Y coordinate in the 2D ecosystem space
     */
    constructor(id, x, y) { 
        super(id, x, y, 'plant');
        
        // Add plant-specific tags
        this.addTag('photosynthetic');
        this.addTag('stationary');
        
        // Add plant-specific attributes
        this.setAttribute('growthRate', 1.0);
        this.setAttribute('waterRequirement', 1.0);
        this.setAttribute('lightRequirement', 1.0);
    }

    /**
     * Update the plant's state based on simulation conditions
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @param {Object} weather - Current weather conditions
     * @param {Object} activeTechEffects - Active technology effects
     */
    update(simulationState, config, weather, activeTechEffects) {
        super.update(simulationState, config, weather, activeTechEffects);

        // Plants need water and light to thrive
        const waterFactor = config.waterPresence / 100; // 0 to 1
        const luminosityFactor = config.luminosity / 2.0; // 0 to 1
        const temperatureFactor = 1 - Math.abs(config.temperature - 20) / 50; // Optimal at 20C, drops off

        // Use attributes for customization
        const baseGrowthRate = 0.1;
        let growthRate = baseGrowthRate * 
                         this.getAttribute('growthRate', 1.0) * 
                         Math.pow(waterFactor, this.getAttribute('waterRequirement', 1.0)) * 
                         Math.pow(luminosityFactor, this.getAttribute('lightRequirement', 1.0)) * 
                         temperatureFactor;

        // Apply seasonal growth effect if provided
        if (simulationState.seasonalGrowthEffect) {
            growthRate *= simulationState.seasonalGrowthEffect;
        }

        // Apply technology effects
        if (activeTechEffects && activeTechEffects.plant_growth_multiplier) {
            growthRate *= activeTechEffects.plant_growth_multiplier;
        }

        // Weather effects on plants
        if (weather.type === 'rainy') {
            growthRate *= 1.5; // Rain helps plants grow
        } else if (weather.type === 'dry') {
            growthRate *= 0.5; // Dry weather hinders growth
        } else if (weather.type === 'snowy') {
            growthRate *= 0.2; // Snow hinders growth significantly
        } else if (weather.type === 'cloudy') {
            growthRate *= 0.8; // Cloudy reduces light
        }

        // Soil type influence
        if (config.soilType === 'fertile') {
            growthRate *= 1.5;
        } else if (config.soilType === 'sandy' || config.soilType === 'rocky') {
            growthRate *= 0.5;
        }

        this.health += growthRate;

        // Consume minerals from nearby rocks
        this.consumeMineralsFromRocks(simulationState, activeTechEffects);

        // Attempt reproduction
        this.reproduce(simulationState, config, waterFactor, luminosityFactor);
    }
    
    /**
     * Consume minerals from nearby rocks
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} activeTechEffects - Active technology effects
     */
    consumeMineralsFromRocks(simulationState, activeTechEffects) {
        const nearbyRocks = simulationState.elements.filter(el =>
            el.type === 'rock' && this.distanceTo(el) < 50 && el.currentMinerals
        );

        if (nearbyRocks.length > 0) {
            const targetRock = nearbyRocks[0]; // Just take the first one for simplicity
            const mineralToConsume = 'iron'; // Example: plants consume iron
            let consumptionRate = 0.1; // How much mineral to consume per tick

            // Apply mineral extraction bonus from technology
            if (activeTechEffects && activeTechEffects.mineral_extraction_bonus) {
                consumptionRate *= (1 + activeTechEffects.mineral_extraction_bonus);
            }

            if (targetRock.currentMinerals[mineralToConsume] > consumptionRate) {
                targetRock.currentMinerals[mineralToConsume] -= consumptionRate;
                this.health += consumptionRate * 0.5; // Plants gain health from minerals
                
                // Store consumed minerals as an attribute
                const consumedMinerals = this.getAttribute('consumedMinerals', {});
                consumedMinerals[mineralToConsume] = (consumedMinerals[mineralToConsume] || 0) + consumptionRate;
                this.setAttribute('consumedMinerals', consumedMinerals);
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Attempt to reproduce
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @param {number} waterFactor - Water availability factor (0-1)
     * @param {number} luminosityFactor - Light availability factor (0-1)
     * @returns {boolean} - True if reproduction was successful
     */
    reproduce(simulationState, config, waterFactor, luminosityFactor) {
        if (this.health > 80 && Math.random() < this.reproductionChance * waterFactor * luminosityFactor) {
            // Create offspring with potential mutations
            const offspring = new PlantElement(
                Date.now() + Math.random(), 
                this.x + (Math.random() - 0.5) * 50, 
                this.y + (Math.random() - 0.5) * 50
            );
            
            // Transfer tags and attributes with potential mutations
            this.getTags().forEach(tag => offspring.addTag(tag));
            
            // Transfer and potentially mutate attributes
            const attributes = this.getAttributes();
            for (const [key, value] of Object.entries(attributes)) {
                if (typeof value === 'number') {
                    // Apply small random mutation to numeric attributes
                    const mutationRate = 0.1;
                    const mutationAmount = (Math.random() * 2 - 1) * mutationRate;
                    offspring.setAttribute(key, Math.max(0, value * (1 + mutationAmount)));
                } else {
                    // Non-numeric attributes are copied directly
                    offspring.setAttribute(key, value);
                }
            }
            
            simulationState.newElements.push(offspring);
            
            // Log reproduction if plant is being observed
            if (this.hasTag('observed')) {
                logToObserver(`Planta em ${this.x.toFixed(0)},${this.y.toFixed(0)} se reproduziu.`);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Interact with another element
     * @param {BaseElement} element - Element to interact with
     * @param {Object} simulationState - Current state of the simulation
     */
    interact(element, simulationState) {
        super.interact(element, simulationState);
        
        // Plants can interact with water to absorb it
        if (element.type === 'water' && this.isCollidingWith(element)) {
            const waterAbsorbed = Math.min(0.5, element.amount || 0);
            if (waterAbsorbed > 0) {
                element.amount -= waterAbsorbed;
                this.health += waterAbsorbed * 0.2;
                
                // Store absorbed water as an attribute
                const absorbedWater = this.getAttribute('absorbedWater', 0);
                this.setAttribute('absorbedWater', absorbedWater + waterAbsorbed);
            }
        }
    }
    
    /**
     * Handle death of the plant
     * @param {Object} simulationState - Current state of the simulation
     */
    die(simulationState) {
        super.die(simulationState);
        
        // Plants may leave nutrients when they die
        if (Math.random() < 0.3) {
            // Create a small amount of nutrients at the plant's location
            // This would be handled by the simulation system to create a new element
            if (simulationState.newElements && typeof simulationState.newElements.push === 'function') {
                // This is a placeholder for a potential nutrient element
                // simulationState.newElements.push(new NutrientElement(Date.now(), this.x, this.y));
            }
        }
    }
}
