/**
 * State Manager implementing the State pattern
 * Manages application state and transitions
 */
import { eventSystem, EventTypes } from './eventSystem.js';
import { loggingSystem, LogLevel } from './loggingSystem.js';

/**
 * StateManager class implementing the State pattern
 * Manages application state and transitions
 */
class StateManager {
  constructor() {
    this.states = {};
    this.currentState = null;
    this.stateHistory = [];
    this.maxHistorySize = 10;
    this.observers = [];
  }

  /**
   * Register a new state
   * @param {string} stateName - Name of the state
   * @param {Object} stateDefinition - State definition object
   */
  registerState(stateName, stateDefinition) {
    this.states[stateName] = {
      ...stateDefinition,
      name: stateName
    };
    
    loggingSystem.debug(`State registered: ${stateName}`);
    return this;
  }

  /**
   * Transition to a new state
   * @param {string} stateName - Name of the state to transition to
   * @param {Object} data - Data to pass to the state
   */
  transitionTo(stateName, data = {}) {
    if (!this.states[stateName]) {
      loggingSystem.error(`State '${stateName}' is not registered`);
      return false;
    }

    const prevState = this.currentState;
    const nextState = this.states[stateName];

    // Exit previous state if exists
    if (prevState && prevState.onExit) {
      try {
        prevState.onExit(data);
      } catch (error) {
        loggingSystem.error(`Error exiting state ${prevState.name}:`, { error });
      }
    }

    // Update state history
    this.stateHistory.push({
      from: prevState ? prevState.name : null,
      to: stateName,
      timestamp: Date.now(),
      data: data
    });

    // Trim history if needed
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    // Set new state
    this.currentState = nextState;

    // Enter new state
    if (nextState.onEnter) {
      try {
        nextState.onEnter(data);
      } catch (error) {
        loggingSystem.error(`Error entering state ${nextState.name}:`, { error });
      }
    }

    // Notify observers
    this.notifyObservers({
      from: prevState ? prevState.name : null,
      to: stateName,
      data: data
    });

    // Publish state change event
    eventSystem.publish(EventTypes.STATE_CHANGED, {
      from: prevState ? prevState.name : null,
      to: stateName,
      data: data
    });
    
    loggingSystem.info(`State changed: ${prevState ? prevState.name : 'none'} -> ${stateName}`);
    return true;
  }

  /**
   * Add an observer to be notified of state changes
   * @param {Function} observer - Function to call on state change
   * @returns {Object} - Object with unsubscribe method
   */
  addObserver(observer) {
    this.observers.push(observer);
    
    return {
      unsubscribe: () => {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
          this.observers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify all observers of a state change
   * @param {Object} stateChange - State change information
   */
  notifyObservers(stateChange) {
    this.observers.forEach(observer => {
      try {
        observer(stateChange);
      } catch (error) {
        loggingSystem.error('Error in state observer:', { error });
      }
    });
  }

  /**
   * Get the current state
   * @returns {Object} - Current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get state history
   * @returns {Array} - State transition history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * Check if a state is registered
   * @param {string} stateName - Name of the state to check
   * @returns {boolean} - True if state is registered
   */
  hasState(stateName) {
    return !!this.states[stateName];
  }
  
  /**
   * Get all registered states
   * @returns {Array} - Array of state names
   */
  getRegisteredStates() {
    return Object.keys(this.states);
  }
  
  /**
   * Clear state history
   */
  clearHistory() {
    this.stateHistory = [];
    loggingSystem.debug('State history cleared');
  }
}

// Create and export a singleton instance
export const stateManager = new StateManager();

// Register common application states
stateManager.registerState('initializing', {
  onEnter: () => loggingSystem.info('Application initializing...'),
  onExit: () => loggingSystem.info('Initialization complete')
});

stateManager.registerState('running', {
  onEnter: () => loggingSystem.info('Simulation running'),
  onExit: () => loggingSystem.info('Simulation stopped')
});

stateManager.registerState('paused', {
  onEnter: () => loggingSystem.info('Simulation paused'),
  onExit: () => loggingSystem.info('Resuming simulation')
});

stateManager.registerState('configuring', {
  onEnter: () => loggingSystem.info('Configuring simulation'),
  onExit: () => loggingSystem.info('Configuration complete')
});

stateManager.registerState('error', {
  onEnter: (data) => loggingSystem.error('Error state:', data),
  onExit: () => loggingSystem.info('Recovering from error')
});

// Export the class for testing or if multiple instances are needed
export const StateManagerClass = StateManager;