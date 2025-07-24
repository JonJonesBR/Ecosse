/**
 * Enhanced Feedback System for Ecosse™
 * Provides visual indicators, contextual notifications, and improved tooltips
 */

class FeedbackSystem {
    constructor() {
        this.notifications = [];
        this.activeIndicators = new Map();
        this.tooltips = new Map();
        this.initialized = false;
        this.notificationQueue = [];
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        
        // Feedback types and their configurations
        this.feedbackTypes = {
            success: { color: '#10b981', icon: '✅', sound: 'success' },
            warning: { color: '#f59e0b', icon: '⚠️', sound: 'warning' },
            error: { color: '#ef4444', icon: '❌', sound: 'error' },
            info: { color: '#3b82f6', icon: 'ℹ️', sound: 'info' },
            achievement: { color: '#8b5cf6', icon: '🏆', sound: 'achievement' },
            action: { color: '#6366f1', icon: '⚡', sound: 'action' }
        };
    }

    /**
     * Initialize the feedback system
     */
    initialize() {
        if (this.initialized) return;
        
        this.createNotificationContainer();
        this.createIndicatorContainer();
        this.createTooltipContainer();
        this.setupEventListeners();
        this.initialized = true;
        
        console.log('Feedback system initialized');
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.innerHTML = `
            <style>
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    pointer-events: none;
                    max-width: 400px;
                }
                
                .notification {
                    background-color: rgba(30, 41, 59, 0.95);
                    border-radius: 0.75rem;
                    padding: 1rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(8px);
                    border-left: 4px solid var(--notification-color);
                    transform: translateX(100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: all;
                    position: relative;
                    overflow: hidden;
                }
                
                .notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .notification.hide {
                    transform: translateX(100%);
                    opacity: 0;
                }
                
                .notification-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .notification-icon {
                    font-size: 1.2rem;
                }
                
                .notification-title {
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0;
                    flex-grow: 1;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    transition: all 0.2s ease;
                }
                
                .notification-close:hover {
                    background-color: rgba(71, 85, 105, 0.3);
                    color: #e2e8f0;
                }
                
                .notification-message {
                    color: #cbd5e1;
                    margin: 0;
                    line-height: 1.4;
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background-color: var(--notification-color);
                    transition: width linear;
                    opacity: 0.7;
                }
                
                .notification-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                }
                
                .notification-action {
                    background-color: var(--notification-color);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }
                
                .notification-action:hover {
                    opacity: 0.8;
                    transform: translateY(-1px);
                }
                
                .notification-action.secondary {
                    background-color: transparent;
                    border: 1px solid var(--notification-color);
                    color: var(--notification-color);
                }
                
                @media (max-width: 768px) {
                    .notification-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            </style>
        `;
        
        document.body.appendChild(container);
        this.notificationContainer = container;
    }

    /**
     * Create visual indicator container
     */
    createIndicatorContainer() {
        const container = document.createElement('div');
        container.id = 'indicator-container';
        container.className = 'indicator-container';
        container.innerHTML = `
            <style>
                .indicator-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1500;
                }
                
                .visual-indicator {
                    position: absolute;
                    pointer-events: none;
                    z-index: 1500;
                }
                
                .indicator-pulse {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: var(--indicator-color);
                    opacity: 0.8;
                    animation: pulse 1s ease-out;
                }
                
                .indicator-ripple {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--indicator-color);
                    border-radius: 50%;
                    animation: ripple 0.8s ease-out;
                }
                
                .indicator-spark {
                    width: 8px;
                    height: 8px;
                    background-color: var(--indicator-color);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--indicator-color);
                    animation: spark 0.6s ease-out;
                }
                
                .indicator-glow {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: radial-gradient(circle, var(--indicator-color) 0%, transparent 70%);
                    animation: glow 1.2s ease-out;
                }
                
                @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                
                @keyframes ripple {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                
                @keyframes spark {
                    0% { transform: scale(1) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
                    100% { transform: scale(0.5) rotate(360deg); opacity: 0; }
                }
                
                @keyframes glow {
                    0% { transform: scale(0.3); opacity: 0.8; }
                    50% { transform: scale(1.2); opacity: 0.4; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
            </style>
        `;
        
        document.body.appendChild(container);
        this.indicatorContainer = container;
    }

    /**
     * Create tooltip container
     */
    createTooltipContainer() {
        const container = document.createElement('div');
        container.id = 'tooltip-container';
        container.className = 'tooltip-container';
        container.innerHTML = `
            <style>
                .tooltip-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 3000;
                }
                
                .enhanced-tooltip {
                    position: absolute;
                    background-color: rgba(15, 23, 42, 0.98);
                    border: 1px solid rgba(71, 85, 105, 0.5);
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    max-width: 300px;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.2s ease;
                    pointer-events: none;
                    z-index: 3000;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                .enhanced-tooltip.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .tooltip-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
                }
                
                .tooltip-icon {
                    font-size: 1.1rem;
                }
                
                .tooltip-title {
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0;
                    font-size: 0.9rem;
                }
                
                .tooltip-content {
                    color: #cbd5e1;
                    font-size: 0.85rem;
                    line-height: 1.4;
                    margin: 0;
                }
                
                .tooltip-shortcut {
                    display: inline-block;
                    background-color: rgba(71, 85, 105, 0.5);
                    color: #cbd5e1;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    font-size: 0.75rem;
                    margin: 0.25rem 0.25rem 0 0;
                }
                
                .tooltip-arrow {
                    position: absolute;
                    width: 0;
                    height: 0;
                    border-style: solid;
                }
                
                .tooltip-arrow.top {
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 8px 8px 0 8px;
                    border-color: rgba(15, 23, 42, 0.95) transparent transparent transparent;
                }
                
                .tooltip-arrow.bottom {
                    top: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 0 8px 8px 8px;
                    border-color: transparent transparent rgba(15, 23, 42, 0.95) transparent;
                }
                
                .tooltip-arrow.left {
                    right: -8px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-width: 8px 0 8px 8px;
                    border-color: transparent transparent transparent rgba(15, 23, 42, 0.95);
                }
                
                .tooltip-arrow.right {
                    left: -8px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-width: 8px 8px 8px 0;
                    border-color: transparent rgba(15, 23, 42, 0.95) transparent transparent;
                }
            </style>
        `;
        
        document.body.appendChild(container);
        this.tooltipContainer = container;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for tooltip events
        document.addEventListener('mouseover', this.handleTooltipShow.bind(this));
        document.addEventListener('mouseout', this.handleTooltipHide.bind(this));
        document.addEventListener('mouseleave', this.handleTooltipHide.bind(this));
        document.addEventListener('mousemove', this.handleTooltipMove.bind(this));
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Clear tooltips on scroll or resize
        document.addEventListener('scroll', this.clearAllTooltips.bind(this));
        window.addEventListener('resize', this.clearAllTooltips.bind(this));
        
        // Clear tooltips when clicking elsewhere
        document.addEventListener('click', (event) => {
            const tooltipElement = event.target.closest('[data-tooltip]');
            if (!tooltipElement) {
                this.clearAllTooltips();
            }
        });
        
        // Clear tooltips when focus changes
        document.addEventListener('focusin', this.clearAllTooltips.bind(this));
    }

    /**
     * Show a notification
     */
    showNotification(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.defaultDuration,
            actions = [],
            persistent = false
        } = options;

        const config = this.feedbackTypes[type] || this.feedbackTypes.info;
        const id = Date.now() + Math.random();

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.setProperty('--notification-color', config.color);
        notification.dataset.id = id;

        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="notification-actions">
                    ${actions.map((action, index) => `
                        <button class="notification-action ${action.secondary ? 'secondary' : ''}" 
                                data-action="${index}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${config.icon}</span>
                <h4 class="notification-title">${title}</h4>
                ${!persistent ? '<button class="notification-close">×</button>' : ''}
            </div>
            <p class="notification-message">${message}</p>
            ${actionsHtml}
            ${!persistent ? '<div class="notification-progress"></div>' : ''}
        `;

        // Add event listeners
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideNotification(id));
        }

        // Add action listeners
        actions.forEach((action, index) => {
            const actionBtn = notification.querySelector(`[data-action="${index}"]`);
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    if (action.callback) action.callback();
                    if (action.closeOnClick !== false) this.hideNotification(id);
                });
            }
        });

        this.notificationContainer.appendChild(notification);

        // Trigger show animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-hide if not persistent
        if (!persistent && duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transitionDuration = `${duration}ms`;
                requestAnimationFrame(() => {
                    progressBar.style.width = '0%';
                });
            }

            setTimeout(() => {
                this.hideNotification(id);
            }, duration);
        }

        // Play sound if available
        this.playFeedbackSound(config.sound);

        // Store notification
        this.notifications.push({ id, element: notification, type, persistent });

        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.hideNotification(oldest.id);
        }

        return id;
    }

    /**
     * Hide a notification
     */
    hideNotification(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        notification.element.classList.add('hide');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * Show visual indicator at position
     */
    showVisualIndicator(x, y, type = 'pulse', color = '#6366f1', duration = 1000) {
        const indicator = document.createElement('div');
        indicator.className = `visual-indicator indicator-${type}`;
        indicator.style.setProperty('--indicator-color', color);
        indicator.style.left = `${x - 20}px`;
        indicator.style.top = `${y - 20}px`;

        this.indicatorContainer.appendChild(indicator);

        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, duration);

        return indicator;
    }

    /**
     * Show contextual tooltip
     */
    showTooltip(element, options) {
        const {
            title = '',
            content = '',
            icon = '',
            shortcuts = [],
            position = 'auto',
            delay = 500
        } = options;

        // Generate unique tooltip ID
        const tooltipId = element.dataset.tooltipId || `tooltip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        element.dataset.tooltipId = tooltipId;

        // Clear existing tooltip for this element
        if (this.tooltips.has(tooltipId)) {
            const existingData = this.tooltips.get(tooltipId);
            if (existingData.timeout) {
                clearTimeout(existingData.timeout);
            }
            if (existingData.element && existingData.element.parentNode) {
                existingData.element.parentNode.removeChild(existingData.element);
            }
        }

        const timeout = setTimeout(() => {
            // Double-check that we should still show this tooltip
            if (!element.matches(':hover')) {
                this.tooltips.delete(tooltipId);
                return;
            }
            
            const tooltip = document.createElement('div');
            tooltip.className = 'enhanced-tooltip';
            tooltip.dataset.id = tooltipId;

            let shortcutsHtml = '';
            if (shortcuts.length > 0) {
                shortcutsHtml = shortcuts.map(shortcut => 
                    `<span class="tooltip-shortcut">${shortcut}</span>`
                ).join('');
            }

            tooltip.innerHTML = `
                ${title || icon ? `
                    <div class="tooltip-header">
                        ${icon ? `<span class="tooltip-icon">${icon}</span>` : ''}
                        ${title ? `<h5 class="tooltip-title">${title}</h5>` : ''}
                    </div>
                ` : ''}
                <div class="tooltip-content">
                    ${content}
                    ${shortcutsHtml ? `<div style="margin-top: 0.5rem;">${shortcutsHtml}</div>` : ''}
                </div>
                <div class="tooltip-arrow"></div>
            `;

            this.tooltipContainer.appendChild(tooltip);
            this.positionTooltip(tooltip, element, position);

            requestAnimationFrame(() => {
                tooltip.classList.add('show');
            });

            this.tooltips.set(tooltipId, { element: tooltip, timeout: null });
        }, delay);

        this.tooltips.set(tooltipId, { element: null, timeout });
    }

    /**
     * Hide tooltip
     */
    hideTooltip(element) {
        const tooltipId = element.dataset.tooltipId;
        if (!tooltipId) return;

        if (this.tooltips.has(tooltipId)) {
            const tooltipData = this.tooltips.get(tooltipId);
            
            if (tooltipData.timeout) {
                clearTimeout(tooltipData.timeout);
            }

            if (tooltipData.element) {
                tooltipData.element.classList.remove('show');
                setTimeout(() => {
                    if (tooltipData.element && tooltipData.element.parentNode) {
                        tooltipData.element.parentNode.removeChild(tooltipData.element);
                    }
                }, 200);
            }

            this.tooltips.delete(tooltipId);
        }

        // Clean up the tooltip ID from the element
        delete element.dataset.tooltipId;
    }

    /**
     * Position tooltip relative to element
     */
    positionTooltip(tooltip, element, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const arrow = tooltip.querySelector('.tooltip-arrow');
        
        let left, top, arrowClass;

        switch (position) {
            case 'top':
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.top - tooltipRect.height - 10;
                arrowClass = 'bottom';
                break;
            case 'bottom':
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                top = rect.bottom + 10;
                arrowClass = 'top';
                break;
            case 'left':
                left = rect.left - tooltipRect.width - 10;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                arrowClass = 'right';
                break;
            case 'right':
                left = rect.right + 10;
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                arrowClass = 'left';
                break;
            default: // auto
                // Choose best position based on available space
                const spaceTop = rect.top;
                const spaceBottom = window.innerHeight - rect.bottom;
                const spaceLeft = rect.left;
                const spaceRight = window.innerWidth - rect.right;

                if (spaceBottom >= tooltipRect.height + 10) {
                    left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                    top = rect.bottom + 10;
                    arrowClass = 'top';
                } else if (spaceTop >= tooltipRect.height + 10) {
                    left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                    top = rect.top - tooltipRect.height - 10;
                    arrowClass = 'bottom';
                } else if (spaceRight >= tooltipRect.width + 10) {
                    left = rect.right + 10;
                    top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                    arrowClass = 'left';
                } else {
                    left = rect.left - tooltipRect.width - 10;
                    top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                    arrowClass = 'right';
                }
        }

        // Ensure tooltip stays within viewport
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        arrow.className = `tooltip-arrow ${arrowClass}`;
    }

    /**
     * Handle tooltip show on mouseover
     */
    handleTooltipShow(event) {
        const element = event.target.closest('[data-tooltip]');
        if (!element) return;

        // Prevent showing tooltip if already showing for this element
        const tooltipId = element.dataset.tooltipId;
        if (tooltipId && this.tooltips.has(tooltipId)) {
            const tooltipData = this.tooltips.get(tooltipId);
            if (tooltipData.element && tooltipData.element.classList.contains('show')) {
                return; // Tooltip already visible
            }
        }

        const tooltipData = element.dataset.tooltip;
        let options;

        try {
            options = JSON.parse(tooltipData);
        } catch (e) {
            options = { content: tooltipData };
        }

        this.showTooltip(element, options);
    }

    /**
     * Handle tooltip hide on mouseout
     */
    handleTooltipHide(event) {
        const element = event.target.closest('[data-tooltip]');
        if (!element) return;

        // Check if mouse is actually leaving the element (not just moving to a child)
        const relatedTarget = event.relatedTarget;
        if (relatedTarget && element.contains(relatedTarget)) {
            return; // Mouse moved to child element, don't hide tooltip
        }

        this.hideTooltip(element);
    }

    /**
     * Handle tooltip position update on mouse move
     */
    handleTooltipMove(event) {
        // Update tooltip position if needed for dynamic tooltips
    }

    /**
     * Handle keyboard shortcuts for feedback
     */
    handleKeyboardShortcuts(event) {
        // ESC to close all notifications and tooltips
        if (event.key === 'Escape') {
            this.clearAllNotifications();
            this.clearAllTooltips();
        }
    }

    /**
     * Play feedback sound
     */
    playFeedbackSound(soundType) {
        // This would integrate with the audio manager
        try {
            if (window.audioManager && window.audioManager.playSFX) {
                window.audioManager.playSFX(`feedback_${soundType}`);
            }
        } catch (e) {
            // Silently fail if audio manager is not available
        }
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        this.notifications.forEach(notification => {
            this.hideNotification(notification.id);
        });
    }

    /**
     * Clear all active tooltips
     */
    clearAllTooltips() {
        this.tooltips.forEach((tooltipData, tooltipId) => {
            if (tooltipData.timeout) {
                clearTimeout(tooltipData.timeout);
            }
            
            if (tooltipData.element && tooltipData.element.parentNode) {
                tooltipData.element.parentNode.removeChild(tooltipData.element);
            }
        });
        
        this.tooltips.clear();
        
        // Clean up tooltip IDs from all elements
        document.querySelectorAll('[data-tooltip-id]').forEach(element => {
            delete element.dataset.tooltipId;
        });
    }

    /**
     * Show action feedback (for user actions)
     */
    showActionFeedback(action, success = true, details = '') {
        const type = success ? 'success' : 'error';
        const title = success ? 'Ação Realizada' : 'Erro na Ação';
        const message = `${action}${details ? ': ' + details : ''}`;

        this.showNotification({
            type,
            title,
            message,
            duration: 3000
        });
    }

    /**
     * Show contextual help
     */
    showContextualHelp(context, element) {
        const helpContent = this.getContextualHelpContent(context);
        
        this.showTooltip(element, {
            title: helpContent.title,
            content: helpContent.content,
            icon: '💡',
            shortcuts: helpContent.shortcuts,
            delay: 100
        });
    }

    /**
     * Get contextual help content
     */
    getContextualHelpContent(context) {
        const helpData = {
            'element-placement': {
                title: 'Colocação de Elementos',
                content: 'Clique para colocar o elemento selecionado. Use o multiplicador para colocar vários de uma vez.',
                shortcuts: ['Click', 'Shift+Click']
            },
            'simulation-controls': {
                title: 'Controles de Simulação',
                content: 'Controle o tempo da simulação. Use o time-lapse para acelerar o processo.',
                shortcuts: ['Space', 'T']
            },
            'element-selection': {
                title: 'Seleção de Elementos',
                content: 'Escolha diferentes elementos para colocar no ecossistema. Cada um tem características únicas.',
                shortcuts: ['1-9']
            }
        };

        return helpData[context] || {
            title: 'Ajuda',
            content: 'Informações contextuais não disponíveis.',
            shortcuts: []
        };
    }
}

// Create and export singleton instance
export const feedbackSystem = new FeedbackSystem();
export default feedbackSystem;