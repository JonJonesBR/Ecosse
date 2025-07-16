/**
 * Notification System - Provides user-facing notifications for important events
 * This module handles displaying notifications to the user in a non-intrusive way
 */

import { loggingSystem } from './loggingSystem.js';

/**
 * Class for managing user notifications
 */
class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 3;
    this.autoHideDelay = 5000; // 5 seconds
    this.initialized = false;
  }
  
  /**
   * Initialize the notification system
   */
  init() {
    if (this.initialized) return;
    
    // Create notification container
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 300px;
    `;
    document.body.appendChild(this.container);
    
    this.initialized = true;
    loggingSystem.info('Notification system initialized');
  }
  
  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, warning, error, success)
   * @param {number} duration - How long to show the notification (ms)
   */
  show(message, type = 'info', duration = this.autoHideDelay) {
    if (!this.initialized) {
      this.init();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background-color: ${this.getBackgroundColor(type)};
      color: ${this.getTextColor(type)};
      padding: 12px 16px;
      margin-top: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      font-family: Arial, sans-serif;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
      position: relative;
    `;
    
    // Add message
    notification.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: none;
      border: none;
      color: inherit;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.addEventListener('click', () => {
      this.hideNotification(notification);
    });
    notification.appendChild(closeButton);
    
    // Add to container
    this.container.appendChild(notification);
    this.notifications.push(notification);
    
    // Limit number of notifications
    if (this.notifications.length > this.maxNotifications) {
      this.hideNotification(this.notifications[0]);
    }
    
    // Show notification with animation
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification);
      }, duration);
    }
    
    return notification;
  }
  
  /**
   * Hide a notification
   * @param {HTMLElement} notification - The notification element to hide
   */
  hideNotification(notification) {
    if (!notification) return;
    
    // Fade out
    notification.style.opacity = '0';
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode === this.container) {
        this.container.removeChild(notification);
      }
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }
  
  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {number} duration - How long to show the notification (ms)
   */
  info(message, duration = this.autoHideDelay) {
    return this.show(message, 'info', duration);
  }
  
  /**
   * Show a success notification
   * @param {string} message - Notification message
   * @param {number} duration - How long to show the notification (ms)
   */
  success(message, duration = this.autoHideDelay) {
    return this.show(message, 'success', duration);
  }
  
  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {number} duration - How long to show the notification (ms)
   */
  warning(message, duration = this.autoHideDelay) {
    return this.show(message, 'warning', duration);
  }
  
  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {number} duration - How long to show the notification (ms)
   */
  error(message, duration = this.autoHideDelay) {
    return this.show(message, 'error', duration);
  }
  
  /**
   * Get background color for notification type
   * @param {string} type - Notification type
   * @returns {string} - CSS color
   */
  getBackgroundColor(type) {
    switch (type) {
      case 'info': return 'rgba(33, 150, 243, 0.9)';
      case 'success': return 'rgba(76, 175, 80, 0.9)';
      case 'warning': return 'rgba(255, 152, 0, 0.9)';
      case 'error': return 'rgba(244, 67, 54, 0.9)';
      default: return 'rgba(33, 150, 243, 0.9)';
    }
  }
  
  /**
   * Get text color for notification type
   * @param {string} type - Notification type
   * @returns {string} - CSS color
   */
  getTextColor(type) {
    return 'white';
  }
  
  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach(notification => {
      this.hideNotification(notification);
    });
  }
}

// Create and export a singleton instance
export const notificationSystem = new NotificationSystem();