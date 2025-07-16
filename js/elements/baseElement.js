// js/elements/baseElement.js
import { elementDefinitions } from '../utils.js';
import { logToObserver } from '../utils.js';

/**
 * Base class for all ecosystem elements
 * Implements common properties and methods used by all elements
 */
export class BaseElement {
    /**
     * Create a new ecosystem element
     * @param {number} id - Unique identifier for the element
     * @param {number} x - X coordinate in the 2D ecosystem space
     * @param {number} y - Y coordinate in the 2D ecosystem space
     * @param {string} type - Type of element (water, rock, plant, etc.)
     */
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Get properties from element definitions
        const def = elementDefinitions[type];
        this.health = def.baseHealth;
        this.energy = def.energy || 0;
        this.size = def.size;
        this.emoji = def.emoji;
        this.decayRate = def.decayRate;
        this.reproductionChance = def.reproductionChance || 0;
        this.speed = def.speed || 0;
        
        // New properties
        this.age = 0;
        this.tags = new Set(); // For categorization and filtering
        this.attributes = {}; // For dynamic attributes
    }
    
    /**
     * Update the element's state based on simulation conditions
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @param {Object} weather - Current weather conditions
     * @param {Object} activeTechEffects - Active technology effects
     */
    update(simulationState, config, weather, activeTechEffects) {
        this.age++;
        let decay = this.decayRate;

        // Apply tag-based effects
        if (this.hasTag('resistant')) {
            decay *= 0.8; // Resistant elements decay slower
        }
        
        if (this.hasTag('fragile')) {
            decay *= 1.5; // Fragile elements decay faster
        }
        
        // Apply attribute-based effects
        if (this.getAttribute('decayModifier')) {
            decay *= this.getAttribute('decayModifier');
        }

        // General decay influenced by gravity
        decay *= config.gravity; 

        // General weather effect
        this.health -= decay * weather.effect; // Apply weather effect to decay
        
        // Apply tech effects that affect all elements
        if (activeTechEffects && activeTechEffects.global_health_regeneration) {
            this.health += activeTechEffects.global_health_regeneration;
        }
        
        // Cap health at maximum
        const maxHealth = elementDefinitions[this.type].baseHealth;
        if (this.health > maxHealth) {
            this.health = maxHealth;
        }
    }
    
    /**
     * Add a tag to the element
     * @param {string} tag - Tag to add
     * @returns {BaseElement} - Returns this for method chaining
     */
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }
    
    /**
     * Remove a tag from the element
     * @param {string} tag - Tag to remove
     * @returns {BaseElement} - Returns this for method chaining
     */
    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }
    
    /**
     * Check if the element has a specific tag
     * @param {string} tag - Tag to check
     * @returns {boolean} - True if the element has the tag
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }
    
    /**
     * Get all tags for this element
     * @returns {Array<string>} - Array of tags
     */
    getTags() {
        return Array.from(this.tags);
    }
    
    /**
     * Set a dynamic attribute
     * @param {string} name - Attribute name
     * @param {*} value - Attribute value
     * @returns {BaseElement} - Returns this for method chaining
     */
    setAttribute(name, value) {
        this.attributes[name] = value;
        return this;
    }
    
    /**
     * Get a dynamic attribute
     * @param {string} name - Attribute name
     * @param {*} defaultValue - Default value if attribute doesn't exist
     * @returns {*} - Attribute value or default value
     */
    getAttribute(name, defaultValue = null) {
        return this.attributes.hasOwnProperty(name) ? this.attributes[name] : defaultValue;
    }
    
    /**
     * Remove an attribute
     * @param {string} name - Attribute name to remove
     * @returns {BaseElement} - Returns this for method chaining
     */
    removeAttribute(name) {
        delete this.attributes[name];
        return this;
    }
    
    /**
     * Get all attributes for this element
     * @returns {Object} - Object containing all attributes
     */
    getAttributes() {
        return { ...this.attributes };
    }
    
    /**
     * Calculate distance to another element
     * @param {BaseElement} element - Element to calculate distance to
     * @returns {number} - Distance between elements
     */
    distanceTo(element) {
        return Math.hypot(this.x - element.x, this.y - element.y);
    }
    
    /**
     * Check if this element is colliding with another element
     * @param {BaseElement} element - Element to check collision with
     * @returns {boolean} - True if elements are colliding
     */
    isCollidingWith(element) {
        return this.distanceTo(element) < (this.size + element.size) / 2;
    }
    
    /**
     * Interact with another element
     * @param {BaseElement} element - Element to interact with
     * @param {Object} simulationState - Current state of the simulation
     */
    interact(element, simulationState) {
        // Base implementation - override in subclasses
        if (this.isCollidingWith(element)) {
            // Log interaction if debug tag is present
            if (this.hasTag('debug') || element.hasTag('debug')) {
                logToObserver(`${this.type} interagiu com ${element.type}`);
            }
        }
    }
    
    /**
     * Consume a resource
     * @param {string} resourceType - Type of resource to consume
     * @param {number} amount - Amount to consume
     * @returns {boolean} - True if resource was consumed successfully
     */
    consume(resourceType, amount) {
        // Base implementation - override in subclasses
        return false;
    }
    
    /**
     * Attempt to reproduce
     * @param {Object} simulationState - Current state of the simulation
     * @param {Object} config - Configuration settings for the simulation
     * @returns {boolean} - True if reproduction was successful
     */
    reproduce(simulationState, config) {
        // Base implementation - override in subclasses
        return false;
    }
    
    /**
     * Handle death of the element
     * @param {Object} simulationState - Current state of the simulation
     */
    die(simulationState) {
        // Base implementation - override in subclasses
        this.health = 0;
        
        // Trigger death event if there are observers
        if (this.hasTag('observed')) {
            logToObserver(`${this.type} em ${this.x.toFixed(0)},${this.y.toFixed(0)} morreu.`);
        }
    }
    
    /**
     * Apply mutations to the element
     * @param {number} mutationRate - Rate of mutation (0-1)
     * @returns {Object} - Object containing mutated properties
     */
    mutate(mutationRate = 0.1) {
        // Base implementation - override in subclasses
        return {};
    }
    
    /**
     * Convert the element to a string representation
     * @returns {string} - String representation of the element
     */
    toString() {
        return `${this.type}(id: ${this.id.toFixed(0)}, health: ${this.health.toFixed(1)}, pos: ${this.x.toFixed(1)},${this.y.toFixed(1)})`;
    }
}
