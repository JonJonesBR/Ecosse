/**
 * Logging System - Enhanced logging system that integrates with the event system
 * Provides structured logging with different log levels and formatting
 */

import { eventSystem, EventTypes } from './eventSystem.js';

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Log level names for display
export const LogLevelNames = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

/**
 * LoggingSystem class implementing an enhanced logging system
 */
class LoggingSystem {
  constructor() {
    // Current log level - only logs at this level or higher will be displayed
    this.currentLogLevel = LogLevel.INFO;
    
    // Log storage
    this.logEntries = [];
    this.MAX_LOG_ENTRIES = 1000;
    
    // DOM references
    this.observerLogDiv = null;
    
    // Subscribers
    this.subscribers = [];
    
    // Whether to automatically publish events for logs
    this.publishEvents = true;
  }

  /**
   * Initialize the logging system with DOM references
   * @param {HTMLElement} logDiv - The DOM element to display logs in
   */
  init(logDiv) {
    this.observerLogDiv = logDiv;
    
    // Subscribe to events that should be logged
    this.subscribeToEvents();
    
    this.debug('Sistema de logging inicializado');
  }

  /**
   * Subscribe to events that should be logged
   */
  subscribeToEvents() {
    eventSystem.subscribe(EventTypes.ELEMENT_CREATED, data => {
      this.info(`${data.emoji || ''} ${data.type} criado em ${data.x.toFixed(0)},${data.y.toFixed(0)}`);
    });
    
    eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, data => {
      this.info(`${data.emoji || ''} ${data.type} removido em ${data.x.toFixed(0)},${data.y.toFixed(0)}`);
    });
    
    eventSystem.subscribe(EventTypes.WEATHER_CHANGED, data => {
      this.info(`${data.emoji || ''} Clima mudou para ${data.type}`);
    });
    
    eventSystem.subscribe(EventTypes.SEASON_CHANGED, data => {
      this.info(`Estação mudou para ${data.season}`);
    });
    
    eventSystem.subscribe(EventTypes.TECHNOLOGY_UNLOCKED, data => {
      this.info(`Tecnologia desbloqueada: ${data.name}`);
    });
    
    eventSystem.subscribe(EventTypes.ACHIEVEMENT_UNLOCKED, data => {
      this.info(`Conquista desbloqueada: ${data.name}`);
    });
    
    eventSystem.subscribe(EventTypes.ELEMENT_INTERACTION, data => {
      if (data.interaction === 'predation') {
        this.info(`${data.predator.emoji || ''} ${data.predator.type} devorou ${data.prey.emoji || ''} ${data.prey.type} em ${data.x.toFixed(0)},${data.y.toFixed(0)}`);
      }
    });
    
    eventSystem.subscribe(EventTypes.SIMULATION_RESET, () => {
      this.info('Simulação reiniciada');
    });
    
    eventSystem.subscribe(EventTypes.ERROR_OCCURRED, data => {
      this.error(`Erro: ${data.message}`, data);
    });
    
    eventSystem.subscribe(EventTypes.WARNING_OCCURRED, data => {
      this.warning(`Aviso: ${data.message}`, data);
    });
    
    eventSystem.subscribe(EventTypes.PERFORMANCE_ISSUE, data => {
      this.warning(`Problema de desempenho: ${data.message}`, data);
    });
  }

  /**
   * Log a message with a specific log level
   * @param {string} message - The message to log
   * @param {number} level - The log level (from LogLevel enum)
   * @param {Object} metadata - Additional metadata to include with the log
   */
  log(message, level = LogLevel.INFO, metadata = {}) {
    // Only log if the level is high enough
    if (level < this.currentLogLevel) return;
    
    const timestamp = new Date();
    const entry = {
      message,
      level,
      timestamp,
      metadata,
      formattedTime: timestamp.toLocaleTimeString()
    };
    
    // Add to log storage
    this.logEntries.unshift(entry);
    if (this.logEntries.length > this.MAX_LOG_ENTRIES) {
      this.logEntries.pop();
    }
    
    // Display in UI if available
    this.displayLogInUI(entry);
    
    // Also log to console for debugging
    console.log(`[${LogLevelNames[level]}] ${message}`, metadata);
    
    // Notify subscribers
    this.notifySubscribers(entry);
    
    // Publish event if enabled
    if (this.publishEvents) {
      const eventType = this.getEventTypeForLogLevel(level);
      if (eventType) {
        // Avoid infinite loops by temporarily disabling event publishing
        const wasPublishing = this.publishEvents;
        this.publishEvents = false;
        eventSystem.publish(eventType, { message, metadata });
        this.publishEvents = wasPublishing;
      }
    }
    
    return entry;
  }

  /**
   * Get the event type for a log level
   * @param {number} level - The log level
   * @returns {string|null} - The event type or null
   */
  getEventTypeForLogLevel(level) {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return EventTypes.ERROR_OCCURRED;
      case LogLevel.WARNING:
        return EventTypes.WARNING_OCCURRED;
      default:
        return null;
    }
  }

  /**
   * Display a log entry in the UI
   * @param {Object} entry - The log entry to display
   */
  displayLogInUI(entry) {
    if (!this.observerLogDiv) return;
    
    const p = document.createElement('p');
    
    // Add class based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        p.classList.add('log-debug');
        break;
      case LogLevel.INFO:
        p.classList.add('log-info');
        break;
      case LogLevel.WARNING:
        p.classList.add('log-warning');
        break;
      case LogLevel.ERROR:
        p.classList.add('log-error');
        break;
      case LogLevel.CRITICAL:
        p.classList.add('log-critical');
        break;
    }
    
    p.textContent = `[${entry.formattedTime}] ${entry.message}`;
    this.observerLogDiv.prepend(p);
    
    // Limit the number of displayed log entries
    if (this.observerLogDiv.children.length > 50) {
      this.observerLogDiv.removeChild(this.observerLogDiv.lastChild);
    }
  }

  /**
   * Subscribe to log entries
   * @param {Function} callback - Function to call with new log entries
   * @returns {Object} - Object with unsubscribe method
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    return {
      unsubscribe: () => {
        const index = this.subscribers.indexOf(callback);
        if (index !== -1) {
          this.subscribers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify subscribers of a new log entry
   * @param {Object} entry - The log entry
   */
  notifySubscribers(entry) {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Error in log subscriber:', error);
      }
    });
  }

  /**
   * Set the current log level
   * @param {number} level - The new log level
   */
  setLogLevel(level) {
    this.currentLogLevel = level;
    this.debug(`Log level set to ${level}`);
  }

  /**
   * Get all log entries
   * @returns {Array} - Array of log entries
   */
  getLogEntries() {
    return [...this.logEntries];
  }

  /**
   * Clear all log entries
   */
  clearLogs() {
    this.logEntries.length = 0;
    if (this.observerLogDiv) {
      this.observerLogDiv.innerHTML = '';
    }
    this.debug('Logs cleared');
  }

  /**
   * Filter logs by level
   * @param {number} level - The minimum log level to include
   * @returns {Array} - Filtered log entries
   */
  filterByLevel(level) {
    return this.logEntries.filter(entry => entry.level >= level);
  }

  /**
   * Search logs by text
   * @param {string} text - The text to search for
   * @returns {Array} - Matching log entries
   */
  search(text) {
    const searchLower = text.toLowerCase();
    return this.logEntries.filter(entry => 
      entry.message.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Export logs to JSON
   * @returns {string} - JSON string of logs
   */
  exportToJson() {
    return JSON.stringify(this.logEntries);
  }

  // Convenience methods for different log levels
  debug(message, metadata = {}) {
    return this.log(message, LogLevel.DEBUG, metadata);
  }

  info(message, metadata = {}) {
    return this.log(message, LogLevel.INFO, metadata);
  }

  warning(message, metadata = {}) {
    return this.log(message, LogLevel.WARNING, metadata);
  }

  error(message, metadata = {}) {
    return this.log(message, LogLevel.ERROR, metadata);
  }

  critical(message, metadata = {}) {
    return this.log(message, LogLevel.CRITICAL, metadata);
  }
}

// Create and export a singleton instance
export const loggingSystem = new LoggingSystem();

// For backward compatibility, export the functions directly
export function initLoggingSystem(logDiv) {
  return loggingSystem.init(logDiv);
}

export function log(message, level = LogLevel.INFO, metadata = {}) {
  return loggingSystem.log(message, level, metadata);
}

export function setLogLevel(level) {
  return loggingSystem.setLogLevel(level);
}

export function getLogEntries() {
  return loggingSystem.getLogEntries();
}

export function clearLogs() {
  return loggingSystem.clearLogs();
}

export function debug(message, metadata = {}) {
  return loggingSystem.debug(message, metadata);
}

export function info(message, metadata = {}) {
  return loggingSystem.info(message, metadata);
}

export function warning(message, metadata = {}) {
  return loggingSystem.warning(message, metadata);
}

export function error(message, metadata = {}) {
  return loggingSystem.error(message, metadata);
}

export function critical(message, metadata = {}) {
  return loggingSystem.critical(message, metadata);
}