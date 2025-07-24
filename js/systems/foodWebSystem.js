/**
 * Food Web System - Implements complex food web relationships between ecosystem elements
 * This system manages predator-prey dynamics, trophic levels, and cascade effects
 */

import { publish, subscribe, EventTypes } from './eventSystem.js';
import { info, warning } from './loggingSystem.js';

// Trophic levels definition
export const TrophicLevels = {
  PRODUCER: 0,       // Plants, algae - produce their own energy
  PRIMARY: 1,        // Herbivores - eat producers
  SECONDARY: 2,      // Carnivores - eat primary consumers
  TERTIARY: 3,       // Apex predators - eat secondary consumers
  DECOMPOSER: 4      // Decomposers - break down dead organisms
};

// Food web configuration
const foodWebConfig = {
  // Base energy transfer efficiency between trophic levels (typically 10%)
  energyTransferEfficiency: 0.1,
  
  // Predation success rates based on relative attributes
  predationFactors: {
    speedFactor: 0.4,       // How much speed affects predation success
    sizeFactor: 0.3,        // How much size affects predation success
    healthFactor: 0.2,      // How much health affects predation success
    intelligenceFactor: 0.1 // How much intelligence affects predation success
  },
  
  // Cascade effect configuration
  cascadeEffects: {
    enabled: true,
    maxDepth: 3,            // Maximum depth of cascade effects
    strengthDecay: 0.7      // How much effect strength decays at each level
  }
};

// Map of element types to their trophic levels
const trophicLevelMap = {
  'plant': TrophicLevels.PRODUCER,
  'creature': TrophicLevels.PRIMARY,
  'predator': TrophicLevels.SECONDARY,
  'tribe': TrophicLevels.TERTIARY,
  'fungus': TrophicLevels.DECOMPOSER
};

// Map of predator types to their preferred prey
const predatorPreyMap = {
  'creature': ['plant'],
  'predator': ['creature'],
  'tribe': ['creature', 'plant']
};

// Track population counts by type for cascade effect calculations
let populationCounts = {};

/**
 * Initialize the food web system
 * @param {Array} initialElements - Initial ecosystem elements
 */
export function initFoodWebSystem(initialElements = []) {
  // Reset population counts
  resetPopulationCounts();
  
  // Count initial populations
  updatePopulationCounts(initialElements);
  
  // Subscribe to relevant events
  subscribe(EventTypes.ELEMENT_CREATED, handleElementCreated);
  subscribe(EventTypes.ELEMENT_REMOVED, handleElementRemoved);
  
  info('Food Web System initialized');
}

/**
 * Reset population counts
 */
function resetPopulationCounts() {
  populationCounts = {
    'plant': 0,
    'creature': 0,
    'predator': 0,
    'tribe': 0,
    'fungus': 0
  };
}

/**
 * Update population counts based on current elements
 * @param {Array} elements - Current ecosystem elements
 */
export function updatePopulationCounts(elements) {
  // Reset counts
  resetPopulationCounts();
  
  // Count elements by type
  elements.forEach(element => {
    if (populationCounts[element.type] !== undefined) {
      populationCounts[element.type]++;
    }
  });
}

/**
 * Handle element created event
 * @param {Object} data - Event data
 */
function handleElementCreated(data) {
  if (populationCounts[data.type] !== undefined) {
    populationCounts[data.type]++;
  }
}

/**
 * Handle element removed event
 * @param {Object} data - Event data
 */
function handleElementRemoved(data) {
  if (populationCounts[data.type] !== undefined) {
    populationCounts[data.type] = Math.max(0, populationCounts[data.type] - 1);
    
    // Check for cascade effects when elements are removed
    if (foodWebConfig.cascadeEffects.enabled) {
      processCascadeEffects(data.type, data.cause);
    }
  }
}

/**
 * Process cascade effects when population changes significantly
 * @param {string} elementType - Type of element that changed
 * @param {string} cause - Cause of the change
 * @param {number} depth - Current depth of cascade effect (for recursion)
 */
function processCascadeEffects(elementType, cause, depth = 0) {
  // Stop if we've reached max depth
  if (depth >= foodWebConfig.cascadeEffects.maxDepth) return;
  
  // Calculate effect strength based on depth
  const effectStrength = Math.pow(foodWebConfig.cascadeEffects.strengthDecay, depth);
  
  // Find affected types based on food web relationships
  const affectedTypes = [];
  
  // Producers affect primary consumers
  if (elementType === 'plant') {
    affectedTypes.push({
      type: 'creature',
      effect: -effectStrength, // Negative effect on herbivores if plants decrease
      reason: 'food_source_change'
    });
  }
  
  // Primary consumers affect secondary consumers
  else if (elementType === 'creature') {
    affectedTypes.push({
      type: 'predator',
      effect: -effectStrength, // Negative effect on predators if creatures decrease
      reason: 'food_source_change'
    });
    
    affectedTypes.push({
      type: 'plant',
      effect: effectStrength, // Positive effect on plants if creatures decrease
      reason: 'predation_pressure_change'
    });
  }
  
  // Secondary consumers affect primary consumers and tertiary consumers
  else if (elementType === 'predator') {
    affectedTypes.push({
      type: 'creature',
      effect: effectStrength, // Positive effect on creatures if predators decrease
      reason: 'predation_pressure_change'
    });
    
    affectedTypes.push({
      type: 'tribe',
      effect: -effectStrength * 0.5, // Small negative effect on tribes if predators decrease
      reason: 'food_source_change'
    });
  }
  
  // Publish cascade effect events
  affectedTypes.forEach(affected => {
    publish(EventTypes.ELEMENT_INTERACTION, {
      sourceType: elementType,
      targetType: affected.type,
      interactionType: 'cascade_effect',
      effect: affected.effect,
      reason: affected.reason,
      cause: cause
    });
    
    // Recursively process next level of cascade effects
    processCascadeEffects(affected.type, 'cascade_from_' + elementType, depth + 1);
  });
}

/**
 * Calculate predation success chance between a predator and prey
 * @param {Object} predator - Predator element
 * @param {Object} prey - Prey element
 * @returns {number} Success chance between 0 and 1
 */
export function calculatePredationSuccess(predator, prey) {
  // Check if this is a valid predator-prey relationship
  if (!isPredatorPreyRelationship(predator.type, prey.type)) {
    return 0;
  }
  
  // Base success chance
  let successChance = 0.5;
  
  // Adjust based on relative attributes
  const { speedFactor, sizeFactor, healthFactor, intelligenceFactor } = foodWebConfig.predationFactors;
  
  // Speed comparison (faster predator = higher success)
  if (predator.speed && prey.speed) {
    const speedRatio = predator.speed / prey.speed;
    successChance += speedFactor * (speedRatio - 1);
  }
  
  // Size comparison (larger predator = higher success)
  if (predator.size && prey.size) {
    const sizeRatio = predator.size / prey.size;
    successChance += sizeFactor * (sizeRatio - 1);
  }
  
  // Health comparison (healthier predator = higher success)
  if (predator.health && prey.health) {
    const healthRatio = predator.health / prey.health;
    successChance += healthFactor * (healthRatio - 1);
  }
  
  // Intelligence comparison if available (smarter predator = higher success)
  if (predator.genome && prey.genome) {
    const predatorIntelligence = predator.genome.expressTraits().intelligence || 0.5;
    const preyIntelligence = prey.genome.expressTraits().intelligence || 0.5;
    const intelligenceRatio = predatorIntelligence / preyIntelligence;
    successChance += intelligenceFactor * (intelligenceRatio - 1);
  }
  
  // Clamp success chance between 0.1 and 0.9
  return Math.max(0.1, Math.min(0.9, successChance));
}

/**
 * Check if a predator-prey relationship exists between two element types
 * @param {string} predatorType - Type of potential predator
 * @param {string} preyType - Type of potential prey
 * @returns {boolean} True if valid predator-prey relationship
 */
export function isPredatorPreyRelationship(predatorType, preyType) {
  return predatorPreyMap[predatorType] && predatorPreyMap[predatorType].includes(preyType);
}

/**
 * Get the trophic level of an element type
 * @param {string} elementType - Type of element
 * @returns {number} Trophic level or -1 if unknown
 */
export function getTrophicLevel(elementType) {
  return trophicLevelMap[elementType] !== undefined ? trophicLevelMap[elementType] : -1;
}

/**
 * Calculate energy transfer between trophic levels
 * @param {number} energyAmount - Amount of energy to transfer
 * @param {number} sourceTrophicLevel - Source trophic level
 * @param {number} targetTrophicLevel - Target trophic level
 * @returns {number} Amount of energy transferred
 */
export function calculateEnergyTransfer(energyAmount, sourceTrophicLevel, targetTrophicLevel) {
  // Energy can only flow up the food chain
  if (targetTrophicLevel <= sourceTrophicLevel && targetTrophicLevel !== TrophicLevels.DECOMPOSER) {
    return 0;
  }
  
  // Calculate energy loss based on trophic level difference
  const levelDifference = targetTrophicLevel === TrophicLevels.DECOMPOSER ? 
    1 : targetTrophicLevel - sourceTrophicLevel;
  
  // Apply energy transfer efficiency for each level
  return energyAmount * Math.pow(foodWebConfig.energyTransferEfficiency, levelDifference);
}

/**
 * Get current population counts
 * @returns {Object} Population counts by element type
 */
export function getPopulationCounts() {
  return { ...populationCounts };
}

/**
 * Update food web configuration
 * @param {Object} newConfig - New configuration values
 */
export function updateFoodWebConfig(newConfig) {
  Object.assign(foodWebConfig, newConfig);
}

/**
 * Register a new element type in the food web
 * @param {string} elementType - Type of element
 * @param {number} trophicLevel - Trophic level of the element
 * @param {Array} preyTypes - Types of elements this element preys on
 */
export function registerElementType(elementType, trophicLevel, preyTypes = []) {
  // Add to trophic level map
  trophicLevelMap[elementType] = trophicLevel;
  
  // Add to population counts
  populationCounts[elementType] = 0;
  
  // Add to predator-prey map if it has prey
  if (preyTypes.length > 0) {
    predatorPreyMap[elementType] = [...preyTypes];
  }
  
  info(`Registered new element type in food web: ${elementType} (trophic level: ${trophicLevel})`);
}

/**
 * Process predator-prey interaction
 * @param {Object} predator - Predator element
 * @param {Object} prey - Prey element
 * @returns {Object} Result of the interaction
 */
export function processPredatorPreyInteraction(predator, prey) {
  // Calculate success chance
  const successChance = calculatePredationSuccess(predator, prey);
  
  // Determine if predation is successful
  const isSuccessful = Math.random() < successChance;
  
  // Calculate energy transfer if successful
  let energyGained = 0;
  if (isSuccessful) {
    const predatorLevel = getTrophicLevel(predator.type);
    const preyLevel = getTrophicLevel(prey.type);
    energyGained = calculateEnergyTransfer(prey.energy || 10, preyLevel, predatorLevel);
  }
  
  // Return interaction result
  return {
    success: isSuccessful,
    energyGained,
    predator: {
      id: predator.id,
      type: predator.type
    },
    prey: {
      id: prey.id,
      type: prey.type
    }
  };
}

/**
 * Get all potential prey for a predator in the ecosystem
 * @param {Object} predator - Predator element
 * @param {Array} elements - All ecosystem elements
 * @param {number} maxDistance - Maximum distance to consider
 * @returns {Array} Array of potential prey elements
 */
export function getPotentialPrey(predator, elements, maxDistance = Infinity) {
  // Get prey types for this predator
  const preyTypes = predatorPreyMap[predator.type] || [];
  if (preyTypes.length === 0) return [];
  
  // Filter elements by type and distance
  return elements.filter(element => {
    // Check if element type is in prey types
    if (!preyTypes.includes(element.type)) return false;
    
    // Check distance if coordinates are available
    if (predator.x !== undefined && predator.y !== undefined && 
        element.x !== undefined && element.y !== undefined) {
      const distance = Math.hypot(predator.x - element.x, predator.y - element.y);
      return distance <= maxDistance;
    }
    
    return true;
  });
}

/**
 * Get all potential predators for a prey in the ecosystem
 * @param {Object} prey - Prey element
 * @param {Array} elements - All ecosystem elements
 * @param {number} maxDistance - Maximum distance to consider
 * @returns {Array} Array of potential predator elements
 */
export function getPotentialPredators(prey, elements, maxDistance = Infinity) {
  // Find all predator types that can prey on this element
  const predatorTypes = Object.keys(predatorPreyMap).filter(predType => 
    predatorPreyMap[predType].includes(prey.type)
  );
  
  // Filter elements by type and distance
  return elements.filter(element => {
    // Check if element type is in predator types
    if (!predatorTypes.includes(element.type)) return false;
    
    // Check distance if coordinates are available
    if (prey.x !== undefined && prey.y !== undefined && 
        element.x !== undefined && element.y !== undefined) {
      const distance = Math.hypot(prey.x - element.x, prey.y - element.y);
      return distance <= maxDistance;
    }
    
    return true;
  });
}