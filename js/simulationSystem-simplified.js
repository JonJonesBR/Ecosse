/**
 * Sistema de Simulação Simplificado
 * Responsável pela lógica principal da simulação do ecossistema
 */

import eventSystem from './eventSystem-simplified.js';

class SimulationSystem {
    constructor() {
        // Estado da simulação
        this.isRunning = false;
        this.isPaused = false;
        this.simulationSpeed = 1.0;
        this.elapsedTime = 0;
        this.frameCount = 0;
        
        // Configuração do planeta
        this.planetConfig = {
            type: 'terrestrial',
            gravity: 1.0,
            atmosphere: 'oxygenated',
            luminosity: 1.0,
            waterCoverage: 0.7,
            temperature: 0.5
        };
        
        // Elementos do ecossistema
        this.ecosystemElements = [];
        
        // Referência ao loop de animação
        this.animationFrameId = null;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa o sistema de simulação
     */
    init() {
        // Configurar manipuladores de eventos
        this.setupEventListeners();
        
        console.log('Sistema de simulação inicializado');
    }
    
    /**
     * Configura os ouvintes de eventos
     */
    setupEventListeners() {
        // Eventos de controle da simulação
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_START, this.start.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_STOP, this.stop.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_RESET, this.reset.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_PAUSE, this.pause.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_RESUME, this.resume.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_SPEED_CHANGE, this.setSpeed.bind(this));
        
        // Eventos de geração de planeta
        eventSystem.subscribe(eventSystem.EVENTS.PLANET_GENERATED, this.generatePlanet.bind(this));
        
        // Eventos de adição de elementos
        eventSystem.subscribe(eventSystem.EVENTS.ELEMENT_ADDED, this.addElement.bind(this));
        
        // Eventos de carregamento de estado
        eventSystem.subscribe(eventSystem.EVENTS.STATE_LOADED, this.loadState.bind(this));
    }
    
    /**
     * Inicia a simulação
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Iniciar loop de simulação
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        
        // Publicar evento de início da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_STARTED);
        
        console.log('Simulação iniciada');
    }
    
    /**
     * Para a simulação
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        
        // Parar loop de simulação
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Publicar evento de parada da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_STOPPED);
        
        console.log('Simulação parada');
    }
    
    /**
     * Pausa a simulação
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        
        // Parar loop de simulação
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Publicar evento de pausa da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_PAUSED);
        
        console.log('Simulação pausada');
    }
    
    /**
     * Retoma a simulação
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        
        // Reiniciar loop de simulação
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
        
        // Publicar evento de retomada da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_RESUMED);
        
        console.log('Simulação retomada');
    }
    
    /**
     * Reinicia a simulação
     */
    reset() {
        // Parar a simulação atual
        this.stop();
        
        // Reiniciar estado
        this.elapsedTime = 0;
        this.frameCount = 0;
        this.ecosystemElements = [];
        
        // Regenerar planeta com configuração atual
        this.generatePlanet(this.planetConfig);
        
        // Publicar evento de reinício da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_RESET_COMPLETE);
        
        console.log('Simulação reiniciada');
    }
    
    /**
     * Define a velocidade da simulação
     * @param {Object} data - Dados do evento
     * @param {number} data.speed - Nova velocidade da simulação
     */
    setSpeed(data) {
        if (!data || typeof data.speed !== 'number') return;
        
        this.simulationSpeed = data.speed;
        
        // Publicar evento de mudança de velocidade
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_SPEED_CHANGED, {
            speed: this.simulationSpeed
        });
        
        console.log(`Velocidade da simulação alterada para ${this.simulationSpeed}x`);
    }
    
    /**
     * Gera um novo planeta com base na configuração
     * @param {Object} config - Configuração do planeta
     */
    generatePlanet(config) {
        // Atualizar configuração do planeta
        this.planetConfig = {
            ...this.planetConfig,
            ...config
        };
        
        // Limpar elementos existentes
        this.ecosystemElements = [];
        
        // Publicar evento de planeta gerado
        eventSystem.publish(eventSystem.EVENTS.PLANET_GENERATION_COMPLETE, {
            config: this.planetConfig
        });
        
        console.log('Planeta gerado:', this.planetConfig);
    }
    
    /**
     * Adiciona um elemento ao ecossistema
     * @param {Object} data - Dados do elemento
     */
    addElement(data) {
        if (!data || !data.element) return;
        
        // Adicionar elemento ao ecossistema
        this.ecosystemElements.push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: data.element.type,
            position: data.element.position || { x: 0, y: 0, z: 0 },
            properties: data.element.properties || {},
            createdAt: this.elapsedTime
        });
        
        // Publicar evento de elemento adicionado
        eventSystem.publish(eventSystem.EVENTS.ELEMENT_ADDED_COMPLETE, {
            element: this.ecosystemElements[this.ecosystemElements.length - 1]
        });
    }
    
    /**
     * Carrega um estado salvo da simulação
     * @param {Object} state - Estado da simulação
     */
    loadState(state) {
        if (!state) return;
        
        // Parar simulação atual
        this.stop();
        
        // Carregar configuração do planeta
        if (state.planetConfig) {
            this.planetConfig = state.planetConfig;
        }
        
        // Carregar elementos do ecossistema
        if (state.ecosystemElements) {
            this.ecosystemElements = state.ecosystemElements;
        }
        
        // Carregar tempo decorrido
        if (typeof state.elapsedTime === 'number') {
            this.elapsedTime = state.elapsedTime;
        }
        
        // Publicar evento de estado carregado
        eventSystem.publish(eventSystem.EVENTS.STATE_LOAD_COMPLETE, {
            planetConfig: this.planetConfig,
            elementsCount: this.ecosystemElements.length
        });
        
        console.log('Estado da simulação carregado');
    }
    
    /**
     * Atualiza a simulação a cada quadro
     * @param {number} timestamp - Timestamp atual
     */
    update(timestamp) {
        if (!this.isRunning || this.isPaused) return;
        
        // Calcular delta time
        const deltaTime = (timestamp - this.lastFrameTime) / 1000; // em segundos
        this.lastFrameTime = timestamp;
        
        // Atualizar tempo decorrido
        this.elapsedTime += deltaTime * this.simulationSpeed;
        this.frameCount++;
        
        // Atualizar elementos do ecossistema
        this.updateEcosystemElements(deltaTime * this.simulationSpeed);
        
        // Verificar interações entre elementos
        this.checkElementInteractions();
        
        // Publicar evento de atualização da simulação
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_UPDATED, {
            deltaTime: deltaTime * this.simulationSpeed,
            elapsedTime: this.elapsedTime,
            frameCount: this.frameCount
        });
        
        // Continuar loop de simulação
        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    }
    
    /**
     * Atualiza os elementos do ecossistema
     * @param {number} deltaTime - Tempo decorrido desde o último quadro
     */
    updateEcosystemElements(deltaTime) {
        // Implementação simplificada da atualização dos elementos
        for (let i = 0; i < this.ecosystemElements.length; i++) {
            const element = this.ecosystemElements[i];
            
            // Atualizar posição (exemplo simplificado)
            if (element.position) {
                // Movimento aleatório simples
                element.position.x += (Math.random() - 0.5) * deltaTime * 0.1;
                element.position.y += (Math.random() - 0.5) * deltaTime * 0.1;
                element.position.z += (Math.random() - 0.5) * deltaTime * 0.1;
            }
            
            // Atualizar propriedades específicas do tipo de elemento
            switch (element.type) {
                case 'plant':
                    // Crescimento de plantas
                    if (!element.properties.size) element.properties.size = 1.0;
                    element.properties.size += deltaTime * 0.05;
                    break;
                    
                case 'herbivore':
                    // Movimento de herbívoros
                    // Implementação simplificada
                    break;
                    
                case 'carnivore':
                    // Movimento de carnívoros
                    // Implementação simplificada
                    break;
                    
                default:
                    // Outros tipos de elementos
                    break;
            }
        }
    }
    
    /**
     * Verifica interações entre elementos do ecossistema
     */
    checkElementInteractions() {
        // Implementação simplificada das interações entre elementos
        // Exemplo: verificar proximidade entre elementos para interações
        
        // Esta é uma implementação básica que pode ser expandida conforme necessário
    }
    
    /**
     * Retorna o estado atual da simulação
     * @returns {Object} Estado da simulação
     */
    getCurrentState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            simulationSpeed: this.simulationSpeed,
            elapsedTime: this.elapsedTime,
            frameCount: this.frameCount,
            planetConfig: { ...this.planetConfig },
            ecosystemElements: [...this.ecosystemElements]
        };
    }
}

// Exportar uma instância única do sistema de simulação
const simulationSystem = new SimulationSystem();
export default simulationSystem;