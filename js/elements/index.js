// js/elements/index.js
import { BaseElement } from './baseElement.js';
import { PlantElement } from './plant.js';
import { CreatureElement } from './creature.js';
import { elementDefinitions } from '../utils.js';

/**
 * Element factory class for creating ecosystem elements
 * Implements the Factory pattern for element creation
 */
class ElementFactory {
    /**
     * Create a new element of the specified type
     * @param {string} type - Type of element to create
     * @param {number} id - Unique identifier for the element
     * @param {number} x - X coordinate in the 2D ecosystem space
     * @param {number} y - Y coordinate in the 2D ecosystem space
     * @param {Object} options - Additional options for element creation
     * @returns {BaseElement} - New element instance
     */
    static createElement(type, id, x, y, options = {}) {
        // Use specialized classes for complex elements
        switch (type) {
            case 'plant':
                return new PlantElement(id, x, y);
            case 'creature':
                return new CreatureElement(id, x, y, options.parentGenes || {});
            default:
                // Create a base element with appropriate tags and attributes
                const element = new BaseElement(id, x, y, type);
                
                // Add type-specific tags
                switch (type) {
                    case 'water':
                        element.addTag('liquid');
                        element.setAttribute('amount', 100);
                        element.setAttribute('lastSpreadTick', 0);
                        break;
                    case 'rock':
                        element.addTag('solid');
                        element.addTag('mineral');
                        element.setAttribute('height', Math.random() * 50 + 10);
                        element.setAttribute('currentMinerals', { ...elementDefinitions.rock.minerals });
                        break;
                    case 'sun':
                        element.addTag('energy');
                        element.addTag('light');
                        break;
                    case 'rain':
                        element.addTag('liquid');
                        element.addTag('weather');
                        element.setAttribute('duration', 100);
                        break;
                    case 'fungus':
                        element.addTag('decomposer');
                        element.addTag('organism');
                        break;
                    case 'meteor':
                        element.addTag('celestial');
                        element.addTag('destructive');
                        element.setAttribute('impacted', false);
                        element.setAttribute('progress', 0);
                        break;
                    case 'volcano':
                        element.addTag('geological');
                        element.addTag('destructive');
                        element.setAttribute('eruptionCooldown', 0);
                        break;
                    case 'extractionProbe':
                        element.addTag('artificial');
                        element.addTag('technological');
                        element.setAttribute('extractedMinerals', { iron: 0, silicon: 0, carbon: 0 });
                        break;
                    case 'predator':
                        element.addTag('mobile');
                        element.addTag('carnivore');
                        element.addTag('hunter');
                        element.setAttribute('target', null);
                        element.setAttribute('preferredPrey', elementDefinitions.predator.preferredPrey);
                        break;
                    case 'tribe':
                        element.addTag('intelligent');
                        element.addTag('social');
                        element.setAttribute('population', options.population || 10);
                        element.setAttribute('technologyLevel', elementDefinitions.tribe.technologyLevel);
                        break;
                    case 'eraser':
                        element.addTag('tool');
                        break;
                }
                
                return element;
        }
    }
}

// Export all element classes and factory functions
export const elementClasses = {
    // Base elements using the factory pattern
    water: (id, x, y) => ElementFactory.createElement('water', id, x, y),
    rock: (id, x, y) => ElementFactory.createElement('rock', id, x, y),
    sun: (id, x, y) => ElementFactory.createElement('sun', id, x, y),
    rain: (id, x, y) => ElementFactory.createElement('rain', id, x, y),
    fungus: (id, x, y) => ElementFactory.createElement('fungus', id, x, y),
    meteor: (id, x, y) => ElementFactory.createElement('meteor', id, x, y),
    volcano: (id, x, y) => ElementFactory.createElement('volcano', id, x, y),
    extractionProbe: (id, x, y) => ElementFactory.createElement('extractionProbe', id, x, y),
    eraser: (id, x, y) => ElementFactory.createElement('eraser', id, x, y),
    
    // Complex elements with their own classes
    plant: PlantElement,
    creature: CreatureElement,
    
    // Elements that use the factory but with specialized configuration
    predator: (id, x, y) => ElementFactory.createElement('predator', id, x, y),
    tribe: (id, x, y, population) => ElementFactory.createElement('tribe', id, x, y, { population }),
};

// Export the base element class and factory for extension
export { BaseElement, ElementFactory };
