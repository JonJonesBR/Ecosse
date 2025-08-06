/**
 * Sistema de Eventos Simplificado
 * Responsável por gerenciar a comunicação entre os diferentes componentes do aplicativo
 */

class EventSystem {
    constructor() {
        // Mapa de eventos e seus assinantes
        this.subscribers = new Map();
        
        // Lista de eventos recentes para depuração
        this.recentEvents = [];
        this.maxRecentEvents = 50;
        
        // Constantes para eventos comuns
        this.EVENTS = {
            // Eventos do Canvas
            CANVAS_INITIALIZED: 'canvas:initialized',
            CANVAS_RESIZE: 'canvas:resize',
            CANVAS_ERROR: 'canvas:error',
            
            // Eventos de UI
            UI_PANEL_TOGGLE: 'ui:panel:toggle',
            UI_ELEMENT_SELECTED: 'ui:element:selected',
            UI_SLIDER_CHANGED: 'ui:slider:changed',
            
            // Eventos de Simulação
            SIMULATION_START: 'simulation:start',
            SIMULATION_STOP: 'simulation:stop',
            SIMULATION_RESET: 'simulation:reset',
            SIMULATION_TICK: 'simulation:tick',
            SIMULATION_STARTED: 'simulation:started',
            SIMULATION_STOPPED: 'simulation:stopped',
            SIMULATION_PAUSED: 'simulation:paused',
            SIMULATION_RESUMED: 'simulation:resumed',
            SIMULATION_RESET_COMPLETE: 'simulation:reset:complete',
            SIMULATION_SPEED_CHANGE: 'simulation:speed:change',
            SIMULATION_SPEED_CHANGED: 'simulation:speed:changed',
            SIMULATION_UPDATED: 'simulation:updated',
            SIMULATION_PAUSE: 'simulation:pause',
            SIMULATION_RESUME: 'simulation:resume',
            
            // Eventos de Planeta
            PLANET_GENERATED: 'planet:generated',
            PLANET_PROPERTY_CHANGED: 'planet:property:changed',
            PLANET_GENERATION_COMPLETE: 'planet:generation:complete',
            PLANET_CREATED: 'planet:created',
            
            // Eventos de Elementos
            ELEMENT_ADDED: 'element:added',
            ELEMENT_ADDED_COMPLETE: 'element:added:complete',
            
            // Eventos de Persistência
            SAVE_STATE: 'persistence:save',
            LOAD_STATE: 'persistence:load',
            STATE_LOADED: 'state:loaded',
            STATE_LOAD_COMPLETE: 'state:load:complete',
            
            // Eventos de Sistema
            SYSTEM_ERROR: 'system:error',
            SYSTEM_WARNING: 'system:warning',
            SYSTEM_INFO: 'system:info',
            
            // Eventos de Three.js
            THREEJS_INITIALIZED: 'threejs:initialized'
        };
    }
    
    /**
     * Assina um evento
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função a ser chamada quando o evento for publicado
     * @param {Object} context - Contexto opcional para a função de callback
     * @returns {Object} Objeto de assinatura para cancelamento
     */
    subscribe(eventName, callback, context = null) {
        if (!eventName || typeof callback !== 'function') {
            console.error('EventSystem: Nome do evento e callback são obrigatórios');
            return { unsubscribe: () => {} };
        }
        
        // Criar array de assinantes para este evento se não existir
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, []);
        }
        
        // Criar objeto de assinatura
        const subscriber = {
            callback,
            context,
            timestamp: Date.now()
        };
        
        // Adicionar à lista de assinantes
        this.subscribers.get(eventName).push(subscriber);
        
        // Retornar objeto com método para cancelar assinatura
        return {
            unsubscribe: () => this.unsubscribe(eventName, callback, context)
        };
    }
    
    /**
     * Cancela a assinatura de um evento
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função de callback original
     * @param {Object} context - Contexto original
     * @returns {boolean} Verdadeiro se a assinatura foi cancelada com sucesso
     */
    unsubscribe(eventName, callback, context = null) {
        if (!this.subscribers.has(eventName)) return false;
        
        const subscribers = this.subscribers.get(eventName);
        const initialLength = subscribers.length;
        
        // Filtrar assinantes, removendo o que corresponde ao callback e contexto
        const filteredSubscribers = subscribers.filter(subscriber => {
            return subscriber.callback !== callback || subscriber.context !== context;
        });
        
        this.subscribers.set(eventName, filteredSubscribers);
        
        // Retornar verdadeiro se algum assinante foi removido
        return filteredSubscribers.length < initialLength;
    }
    
    /**
     * Publica um evento para todos os assinantes
     * @param {string} eventName - Nome do evento
     * @param {Object} data - Dados a serem passados para os assinantes
     * @returns {number} Número de assinantes notificados
     */
    publish(eventName, data = {}) {
        if (!eventName) {
            console.error('EventSystem: Nome do evento é obrigatório');
            return 0;
        }
        
        // Se não houver assinantes, retornar 0
        if (!this.subscribers.has(eventName)) return 0;
        
        const subscribers = this.subscribers.get(eventName);
        const eventObject = {
            name: eventName,
            data,
            timestamp: Date.now()
        };
        
        // Adicionar à lista de eventos recentes
        this.addToRecentEvents(eventObject);
        
        // Notificar todos os assinantes
        subscribers.forEach(subscriber => {
            try {
                subscriber.callback.call(subscriber.context, data);
            } catch (error) {
                console.error(`Erro ao processar evento ${eventName}:`, error);
                // Publicar erro do sistema
                if (eventName !== this.EVENTS.SYSTEM_ERROR) {
                    this.publish(this.EVENTS.SYSTEM_ERROR, {
                        source: 'EventSystem',
                        originalEvent: eventName,
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
        });
        
        return subscribers.length;
    }
    
    /**
     * Adiciona um evento à lista de eventos recentes
     * @param {Object} eventObject - Objeto do evento
     * @private
     */
    addToRecentEvents(eventObject) {
        this.recentEvents.unshift(eventObject);
        
        // Limitar o número de eventos recentes
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents.pop();
        }
    }
    
    /**
     * Obtém a lista de eventos recentes
     * @returns {Array} Lista de eventos recentes
     */
    getRecentEvents() {
        return [...this.recentEvents];
    }
    
    /**
     * Limpa todos os assinantes de um evento específico
     * @param {string} eventName - Nome do evento
     * @returns {boolean} Verdadeiro se os assinantes foram limpos
     */
    clearEventSubscribers(eventName) {
        if (!eventName || !this.subscribers.has(eventName)) return false;
        
        this.subscribers.set(eventName, []);
        return true;
    }
    
    /**
     * Limpa todos os assinantes de todos os eventos
     */
    clearAllSubscribers() {
        this.subscribers.clear();
    }
    
    /**
     * Verifica se um evento tem assinantes
     * @param {string} eventName - Nome do evento
     * @returns {boolean} Verdadeiro se o evento tem assinantes
     */
    hasSubscribers(eventName) {
        return this.subscribers.has(eventName) && this.subscribers.get(eventName).length > 0;
    }
    
    /**
     * Obtém o número de assinantes para um evento
     * @param {string} eventName - Nome do evento
     * @returns {number} Número de assinantes
     */
    getSubscriberCount(eventName) {
        if (!this.subscribers.has(eventName)) return 0;
        return this.subscribers.get(eventName).length;
    }
}

// Exportar uma instância única do sistema de eventos
const eventSystem = new EventSystem();
export default eventSystem;