/**
 * Systems module - Exports all system components
 * This module serves as the central point for accessing all system functionality
 */

// Import systems
import { eventSystem, EventTypes } from './eventSystem.js';
import { loggingSystem, LogLevel } from './loggingSystem.js';
import { stateManager } from './stateManager.js';
import { lightingSystem } from './lightingSystem.js';
import { particleSystem } from './particleSystem.js';

// Initialize systems
function initSystems(config = {}) {
  // Set up event system debug mode if specified
  if (config.debugEvents) {
    eventSystem.setDebugMode(true);
  }
  
  // Set log level if specified
  if (config.logLevel !== undefined) {
    loggingSystem.setLogLevel(config.logLevel);
  }
  
  // Initialize logging UI if element provided
  if (config.logElement) {
    loggingSystem.init(config.logElement);
  }
  
  // Set initial state if specified
  if (config.initialState && stateManager.hasState(config.initialState)) {
    stateManager.transitionTo(config.initialState);
  }
  
  // Initialize lighting system if scene provided
  if (config.scene) {
    lightingSystem.init(config.scene, config.lighting);
    particleSystem.init(config.scene);
  }
  
  // Log initialization
  loggingSystem.info('Systems initialized');
  
  return {
    eventSystem,
    loggingSystem,
    stateManager,
    lightingSystem,
    particleSystem
  };
}

// Export all systems and utilities
export {
  eventSystem,
  EventTypes,
  loggingSystem,
  LogLevel,
  stateManager,
  lightingSystem,
  particleSystem,
  initSystems
};