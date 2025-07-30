/**
 * Event System - Implements the Observer pattern for communication between systems
 * This system allows components to subscribe to events and be notified when they occur
 */

// Map of event types to arrays of subscribers
const subscribers = new Map();

// Event history for logging and debugging
const eventHistory = [];
const MAX_EVENT_HISTORY = 100;

/**
 * EventSystem class implementing the Observer pattern
 */
class EventSystem {
  constructor() {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.MAX_EVENT_HISTORY = 100;
    this.debugMode = false;
  }

  /**
   * Subscribe to an event
   * @param {string} eventType - The type of event to subscribe to
   * @param {Function} callback - The function to call when the event occurs
   * @returns {Object} - An object with an unsubscribe method
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    const eventSubscribers = this.subscribers.get(eventType);
    eventSubscribers.push(callback);
    
    // Return an object that allows unsubscribing
    return {
      unsubscribe: () => {
        const index = eventSubscribers.indexOf(callback);
        if (index !== -1) {
          eventSubscribers.splice(index, 1);
          if (this.debugMode) {
            console.debug(`Unsubscribed from ${eventType}, remaining subscribers: ${eventSubscribers.length}`);
          }
        }
      }
    };
  }

  /**
   * Subscribe to an event once - automatically unsubscribes after first trigger
   * @param {string} eventType - The type of event to subscribe to
   * @param {Function} callback - The function to call when the event occurs
   * @returns {Object} - An object with an unsubscribe method
   */
  subscribeOnce(eventType, callback) {
    const subscription = this.subscribe(eventType, (data) => {
      callback(data);
      subscription.unsubscribe();
    });
    
    return subscription;
  }

  /**
   * Publish an event to all subscribers
   * @param {string} eventType - The type of event to publish
   * @param {Object} data - The data to pass to subscribers
   * @returns {Object} - The event object that was published
   */
  publish(eventType, data = {}) {
    // Add timestamp to the event
    const event = {
      type: eventType,
      data,
      timestamp: Date.now()
    };
    
    // Store in history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.MAX_EVENT_HISTORY) {
      this.eventHistory.pop();
    }
    
    // Notify subscribers
    if (this.subscribers.has(eventType)) {
      // Create a copy of the subscribers array to avoid issues if callbacks modify the array
      const currentSubscribers = [...this.subscribers.get(eventType)];
      
      currentSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event subscriber for ${eventType}:`, error);
        }
      });
    }
    
    if (this.debugMode) {
      console.debug(`Event published: ${eventType}`, data);
    }
    
    return event;
  }

  /**
   * Get the event history
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of events
   */
  getEventHistory(limit = this.MAX_EVENT_HISTORY) {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Clear all subscribers for testing or resets
   */
  clearAllSubscribers() {
    this.subscribers.clear();
    if (this.debugMode) {
      console.debug('All subscribers cleared');
    }
  }

  /**
   * Clear subscribers for a specific event type
   * @param {string} eventType - The event type to clear subscribers for
   */
  clearSubscribers(eventType) {
    if (this.subscribers.has(eventType)) {
      this.subscribers.delete(eventType);
      if (this.debugMode) {
        console.debug(`Subscribers cleared for ${eventType}`);
      }
    }
  }

  /**
   * Get the number of subscribers for a specific event type
   * @param {string} eventType - The event type to check
   * @returns {number} - Number of subscribers
   */
  getSubscriberCount(eventType) {
    return this.subscribers.has(eventType) ? this.subscribers.get(eventType).length : 0;
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  /**
   * Clear event history
   */
  clearEventHistory() {
    this.eventHistory = [];
    if (this.debugMode) {
      console.debug('Event history cleared');
    }
  }
  
  /**
   * Alias for publish method to maintain compatibility
   * @param {string} eventType - The type of event to publish
   * @param {Object} data - The data to pass to subscribers
   * @returns {Object} - The event object that was published
   */
  emit(eventType, data = {}) {
    return this.publish(eventType, data);
  }
}

// Create a singleton instance
export const eventSystem = new EventSystem();

// Export the class for testing or if multiple instances are needed
export const EventSystemClass = EventSystem;

// Common event types as constants
export const EventTypes = {
  // Simulation events
  SIMULATION_STARTED: 'simulation:started',
  SIMULATION_PAUSED: 'simulation:paused',
  SIMULATION_RESET: 'simulation:reset',
  SIMULATION_CYCLE_COMPLETED: 'simulation:cycle_completed',
  
  // Element events
  ELEMENT_CREATED: 'element:created',
  ELEMENT_REMOVED: 'element:removed',
  ELEMENT_UPDATED: 'element:updated',
  ELEMENT_INTERACTION: 'element:interaction',
  
  // Environment events
  WEATHER_CHANGED: 'environment:weather_changed',
  SEASON_CHANGED: 'environment:season_changed',
  TIME_OF_DAY_CHANGED: 'environment:time_of_day_changed',
  EXTREME_WEATHER: 'environment:extreme_weather',
  MICROCLIMATE_CHANGED: 'environment:microclimate_changed',
  
  // Player events
  PLAYER_ENERGY_CHANGED: 'player:energy_changed',
  TECHNOLOGY_UNLOCKED: 'player:technology_unlocked',
  ACHIEVEMENT_UNLOCKED: 'player:achievement_unlocked',
  
  // UI events
  UI_ELEMENT_SELECTED: 'ui:element_selected',
  UI_PANEL_OPENED: 'ui:panel_opened',
  UI_PANEL_CLOSED: 'ui:panel_closed',
  CAMERA_MOVED: 'ui:camera_moved',
  
  // Game events
  SCENARIO_STARTED: 'game:scenario_started',
  SCENARIO_COMPLETED: 'game:scenario_completed',
  VICTORY_CONDITION_MET: 'game:victory_condition_met',
  FAILURE_CONDITION_MET: 'game:failure_condition_met',
  
  // System events
  ERROR_OCCURRED: 'system:error_occurred',
  WARNING_OCCURRED: 'system:warning_occurred',
  STATE_CHANGED: 'system:state_changed',
  RESOURCE_LOADED: 'system:resource_loaded',
  PERFORMANCE_ISSUE: 'system:performance_issue',
  
  // Food web events
  PREDATION_ATTEMPT: 'foodweb:predation_attempt',
  PREDATION_SUCCESS: 'foodweb:predation_success',
  PREDATION_FAILURE: 'foodweb:predation_failure',
  POPULATION_CHANGE: 'foodweb:population_change',
  TROPHIC_CASCADE: 'foodweb:trophic_cascade',
  GENETIC_REPRODUCTION: 'genetics:reproduction',
  MUTATION_OCCURRED: 'genetics:mutation',
  
  // Social behavior events
  GROUP_FORMED: 'social:group_formed',
  GROUP_DISBANDED: 'social:group_disbanded',
  TERRITORY_ESTABLISHED: 'social:territory_established',
  TERRITORIAL_CONFLICT: 'social:territorial_conflict',
  TERRITORY_INTRUSION: 'social:territory_intrusion',
  COOPERATION_EVENT: 'social:cooperation_event',
  LEADERSHIP_CHANGE: 'social:leadership_change'
};

// For backward compatibility, export the functions directly
export const subscribe = eventSystem.subscribe.bind(eventSystem);
export const publish = eventSystem.publish.bind(eventSystem);
export const getEventHistory = eventSystem.getEventHistory.bind(eventSystem);
export const clearAllSubscribers = eventSystem.clearAllSubscribers.bind(eventSystem);
export const getSubscriberCount = eventSystem.getSubscriberCount.bind(eventSystem);
