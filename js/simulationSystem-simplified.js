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

        // Referência à criatura do jogador
        this.playerCreature = null;
        
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

        // Eventos de movimento do jogador
        eventSystem.subscribe(eventSystem.EVENTS.PLAYER_MOVE, this.movePlayer.bind(this));
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

        const isPlayer = data.element.isPlayer || false;
        
        const newElement = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            type: data.element.type,
            position: data.element.position || { x: 0, y: 0, z: 0 },
            properties: data.element.properties || {},
            createdAt: this.elapsedTime,
            isPlayer: isPlayer
        };

        // Adicionar propriedades iniciais com base no tipo
        switch (newElement.type) {
            case 'herbivore':
            case 'carnivore':
                newElement.properties.energy = 100; // Energia inicial
                newElement.properties.maxEnergy = 100;
                newElement.properties.energyConsumption = 2; // Energia gasta por segundo
                newElement.properties.isHungry = false;
                break;
            case 'plant':
                newElement.properties.size = 1.0;
                newElement.properties.growthRate = 0.05;
                break;
        }

        this.ecosystemElements.push(newElement);

        if (isPlayer) {
            this.playerCreature = newElement;
        }
        
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
            frameCount: this.frameCount,
            simulationState: this.getCurrentState() // Enviar estado atual
        });
        
        // Continuar loop de simulação
        this.animationFrameId = requestAnimationFrame(this.update.bind(this));
    }

    /**
     * Move a criatura do jogador
     * @param {Object} data - Dados do evento de movimento
     */
    movePlayer(data) {
        if (!this.playerCreature || !data || !data.direction) return;

        const moveSpeed = 0.1;
        const { x, y, z } = data.direction;

        this.playerCreature.position.x += x * moveSpeed;
        this.playerCreature.position.y += y * moveSpeed;
        this.playerCreature.position.z += z * moveSpeed;
    }
    
    /**
     * Atualiza os elementos do ecossistema
     * @param {number} deltaTime - Tempo decorrido desde o último quadro
     */
    updateEcosystemElements(deltaTime) {
        // Itera de trás para frente para permitir a remoção segura de elementos
        for (let i = this.ecosystemElements.length - 1; i >= 0; i--) {
            const element = this.ecosystemElements[i];
            
            // Atualizar propriedades específicas do tipo de elemento
            switch (element.type) {
                case 'plant':
                    this.updatePlant(element, deltaTime);
                    break;
                case 'herbivore':
                    this.updateCreature(element, deltaTime, 'plant');
                    break;
                case 'carnivore':
                    this.updateCreature(element, deltaTime, 'herbivore');
                    break;
            }

            // Remover elementos que morreram
            if (element.properties.energy <= 0) {
                this.ecosystemElements.splice(i, 1);
                eventSystem.publish(eventSystem.EVENTS.ELEMENT_REMOVED, { id: element.id });
            }
        }
    }

    updatePlant(plant, deltaTime) {
        // Crescimento de plantas
        if (!plant.properties.size) plant.properties.size = 1.0;
        plant.properties.size += (plant.properties.growthRate || 0.05) * deltaTime;
    }

    updateCreature(creature, deltaTime, foodSourceType) {
        // Consumir energia
        creature.properties.energy -= (creature.properties.energyConsumption || 2) * deltaTime;
        creature.properties.isHungry = creature.properties.energy < 50; // Considera faminto com menos de 50% de energia

        if (creature.isPlayer) {
            // A lógica de movimento do jogador será controlada por eventos de teclado
            return;
        }

        if (creature.properties.isHungry) {
            const nearestFood = this.findNearestElement(creature, foodSourceType);
            if (nearestFood) {
                // Mover em direção à comida
                const direction = {
                    x: nearestFood.position.x - creature.position.x,
                    y: nearestFood.position.y - creature.position.y,
                    z: nearestFood.position.z - creature.position.z,
                };
                const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
                const moveSpeed = 0.2;

                if (distance > 0.1) { // Distância para parar de se mover
                    creature.position.x += (direction.x / distance) * moveSpeed * deltaTime;
                    creature.position.y += (direction.y / distance) * moveSpeed * deltaTime;
                    creature.position.z += (direction.z / distance) * moveSpeed * deltaTime;
                }
            }
        } else {
            // Movimento aleatório simples quando não está com fome
            if (creature.position) {
                creature.position.x += (Math.random() - 0.5) * deltaTime * 0.1;
                creature.position.y += (Math.random() - 0.5) * deltaTime * 0.1;
                creature.position.z += (Math.random() - 0.5) * deltaTime * 0.1;
            }
        }
    }
    
    /**
     * Verifica interações entre elementos do ecossistema
     */
    checkElementInteractions() {
        const creatures = this.ecosystemElements.filter(e => e.type === 'herbivore' || e.type === 'carnivore');
        const plants = this.ecosystemElements.filter(e => e.type === 'plant');
        const herbivores = this.ecosystemElements.filter(e => e.type === 'herbivore');

        for (const creature of creatures) {
            if (!creature.properties.isHungry) continue;

            const foodSourceType = creature.type === 'herbivore' ? 'plant' : 'herbivore';
            const foodSources = creature.type === 'herbivore' ? plants : herbivores;

            for (let i = foodSources.length - 1; i >= 0; i--) {
                const food = foodSources[i];
                if (food.id === creature.id) continue; // Não pode comer a si mesmo

                const distance = this.calculateDistance(creature.position, food.position);
                
                if (distance < 0.2) { // Distância para "comer"
                    creature.properties.energy = Math.min(creature.properties.maxEnergy, creature.properties.energy + 50);
                    
                    if (foodSourceType === 'plant') {
                        food.properties.size -= 0.5;
                        if (food.properties.size <= 0) {
                            this.removeElementById(food.id);
                        }
                    } else {
                        this.removeElementById(food.id);
                    }
                    break; // Para de procurar comida depois de comer
                }
            }
        }
    }

    findNearestElement(sourceElement, targetType) {
        let nearest = null;
        let minDistance = Infinity;

        for (const targetElement of this.ecosystemElements) {
            if (targetElement.type === targetType && targetElement.id !== sourceElement.id) {
                const distance = this.calculateDistance(sourceElement.position, targetElement.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = targetElement;
                }
            }
        }
        return nearest;
    }

    calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return Infinity;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    removeElementById(id) {
        const index = this.ecosystemElements.findIndex(e => e.id === id);
        if (index !== -1) {
            const removedElement = this.ecosystemElements.splice(index, 1)[0];
            eventSystem.publish(eventSystem.EVENTS.ELEMENT_REMOVED, { id: removedElement.id });
        }
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
