/**
 * Sistema de Persistência Simplificado
 * Responsável por salvar e carregar o estado da simulação
 */

import eventSystem from './eventSystem-simplified.js';

class PersistenceSystem {
    constructor() {
        this.storageKey = 'ecosse-simulation-state';
        this.autoSaveEnabled = false;
        this.autoSaveInterval = null;
        this.autoSaveIntervalTime = 5 * 60 * 1000; // 5 minutos
        
        // Registrar manipuladores de eventos
        this.registerEventHandlers();
    }
    
    /**
     * Registra manipuladores de eventos
     */
    registerEventHandlers() {
        // Escutar eventos de salvar e carregar
        eventSystem.subscribe(eventSystem.EVENTS.SAVE_STATE, this.saveState.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.LOAD_STATE, this.loadState.bind(this));
    }
    
    /**
     * Salva o estado atual da simulação
     * @param {Object} data - Dados opcionais para sobrescrever o estado atual
     * @returns {boolean} Verdadeiro se o estado foi salvo com sucesso
     */
    saveState(data = null) {
        try {
            // Se não houver dados fornecidos, coletar o estado atual
            const stateToSave = data || this.collectCurrentState();
            
            // Adicionar metadados
            stateToSave.metadata = {
                timestamp: Date.now(),
                version: '1.0.0',
                appName: 'Ecosse Simplified'
            };
            
            // Salvar no armazenamento local
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
            
            console.log('Estado salvo com sucesso:', stateToSave.metadata.timestamp);
            this.showMessage('Estado salvo com sucesso!', 'success');
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
            this.showMessage('Erro ao salvar estado: ' + error.message, 'error');
            
            // Publicar erro
            eventSystem.publish(eventSystem.EVENTS.SYSTEM_ERROR, {
                source: 'PersistenceSystem',
                action: 'saveState',
                error: error.message
            });
            
            return false;
        }
    }
    
    /**
     * Carrega o estado salvo da simulação
     * @returns {Object|null} O estado carregado ou null se falhar
     */
    loadState() {
        try {
            // Obter dados do armazenamento local
            const savedStateJson = localStorage.getItem(this.storageKey);
            
            if (!savedStateJson) {
                this.showMessage('Nenhum estado salvo encontrado.', 'warning');
                return null;
            }
            
            // Analisar o JSON
            const savedState = JSON.parse(savedStateJson);
            
            // Verificar metadados
            if (!savedState.metadata) {
                throw new Error('Formato de estado inválido.');
            }
            
            console.log('Estado carregado com sucesso:', savedState.metadata.timestamp);
            this.showMessage('Estado carregado com sucesso!', 'success');
            
            // Aplicar o estado carregado
            this.applyLoadedState(savedState);
            
            return savedState;
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
            this.showMessage('Erro ao carregar estado: ' + error.message, 'error');
            
            // Publicar erro
            eventSystem.publish(eventSystem.EVENTS.SYSTEM_ERROR, {
                source: 'PersistenceSystem',
                action: 'loadState',
                error: error.message
            });
            
            return null;
        }
    }
    
    /**
     * Coleta o estado atual da simulação
     * @returns {Object} O estado atual
     */
    collectCurrentState() {
        // Obter valores dos controles de UI
        const planetType = document.getElementById('planet-type')?.value || 'terrestrial';
        const gravity = parseFloat(document.getElementById('gravity')?.value || 1.0);
        const atmosphere = document.getElementById('atmosphere')?.value || 'oxygenated';
        const luminosity = parseFloat(document.getElementById('luminosity')?.value || 1.0);
        const waterCoverage = parseFloat(document.getElementById('water-coverage')?.value || 0.7);
        const temperature = parseFloat(document.getElementById('temperature')?.value || 0.5);
        
        // Criar objeto de estado
        return {
            planetConfig: {
                type: planetType,
                gravity,
                atmosphere,
                luminosity,
                waterCoverage,
                temperature
            },
            simulationState: {
                isRunning: window.simulationRunning || false,
                elapsedTime: window.simulationTime || 0,
                entities: window.simulationEntities || []
            },
            cameraPosition: window.cameraPosition || { x: 0, y: 5, z: 10 }
        };
    }
    
    /**
     * Aplica o estado carregado à simulação
     * @param {Object} state - O estado a ser aplicado
     */
    applyLoadedState(state) {
        try {
            // Aplicar configurações do planeta
            if (state.planetConfig) {
                const { type, gravity, atmosphere, luminosity, waterCoverage, temperature } = state.planetConfig;
                
                // Atualizar controles de UI
                if (document.getElementById('planet-type')) {
                    document.getElementById('planet-type').value = type || 'terrestrial';
                }
                
                if (document.getElementById('gravity')) {
                    document.getElementById('gravity').value = gravity || 1.0;
                    document.getElementById('gravity-value').textContent = `${gravity || 1.0}x`;
                }
                
                if (document.getElementById('atmosphere')) {
                    document.getElementById('atmosphere').value = atmosphere || 'oxygenated';
                }
                
                if (document.getElementById('luminosity')) {
                    document.getElementById('luminosity').value = luminosity || 1.0;
                    document.getElementById('luminosity-value').textContent = `${luminosity || 1.0}x`;
                }
                
                if (document.getElementById('water-coverage')) {
                    document.getElementById('water-coverage').value = waterCoverage || 0.7;
                    document.getElementById('water-coverage-value').textContent = `${Math.round((waterCoverage || 0.7) * 100)}%`;
                }
                
                if (document.getElementById('temperature')) {
                    document.getElementById('temperature').value = temperature || 0.5;
                    
                    // Atualizar texto da temperatura
                    let tempText = 'Moderada';
                    if (temperature < 0.3) tempText = 'Fria';
                    else if (temperature > 0.7) tempText = 'Quente';
                    document.getElementById('temperature-value').textContent = tempText;
                }
                
                // Publicar evento de mudança de propriedade do planeta
                eventSystem.publish(eventSystem.EVENTS.PLANET_PROPERTY_CHANGED, state.planetConfig);
            }
            
            // Aplicar estado da simulação
            if (state.simulationState) {
                window.simulationRunning = state.simulationState.isRunning || false;
                window.simulationTime = state.simulationState.elapsedTime || 0;
                window.simulationEntities = state.simulationState.entities || [];
                
                // Atualizar botão de iniciar/parar
                const startStopButton = document.getElementById('start-stop');
                if (startStopButton) {
                    startStopButton.textContent = window.simulationRunning ? 'Parar' : 'Iniciar';
                }
                
                // Publicar evento de simulação
                if (window.simulationRunning) {
                    eventSystem.publish(eventSystem.EVENTS.SIMULATION_START);
                } else {
                    eventSystem.publish(eventSystem.EVENTS.SIMULATION_STOP);
                }
            }
            
            // Aplicar posição da câmera
            if (state.cameraPosition && window.camera) {
                window.camera.position.set(
                    state.cameraPosition.x || 0,
                    state.cameraPosition.y || 5,
                    state.cameraPosition.z || 10
                );
            }
            
            // Publicar evento de carregamento concluído
            eventSystem.publish(eventSystem.EVENTS.STATE_LOADED, state);
            
        } catch (error) {
            console.error('Erro ao aplicar estado carregado:', error);
            this.showMessage('Erro ao aplicar estado: ' + error.message, 'error');
            
            // Publicar erro
            eventSystem.publish(eventSystem.EVENTS.SYSTEM_ERROR, {
                source: 'PersistenceSystem',
                action: 'applyLoadedState',
                error: error.message
            });
        }
    }
    
    /**
     * Ativa ou desativa o salvamento automático
     * @param {boolean} enable - Verdadeiro para ativar, falso para desativar
     * @param {number} intervalMs - Intervalo em milissegundos (opcional)
     */
    toggleAutoSave(enable, intervalMs = null) {
        this.autoSaveEnabled = enable;
        
        // Limpar intervalo existente
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        // Configurar novo intervalo se ativado
        if (enable) {
            if (intervalMs) {
                this.autoSaveIntervalTime = intervalMs;
            }
            
            this.autoSaveInterval = setInterval(() => {
                if (this.autoSaveEnabled) {
                    this.saveState();
                }
            }, this.autoSaveIntervalTime);
            
            console.log(`Salvamento automático ativado (intervalo: ${this.autoSaveIntervalTime / 1000}s)`);
        } else {
            console.log('Salvamento automático desativado');
        }
    }
    
    /**
     * Exibe uma mensagem para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        const messageBox = document.getElementById('message-box');
        const messageContent = document.getElementById('message-content');
        
        if (!messageBox || !messageContent) return;
        
        // Definir classe baseada no tipo
        messageBox.className = 'message-box';
        messageBox.classList.add(`message-${type}`);
        messageBox.classList.remove('hidden');
        
        // Definir conteúdo
        messageContent.textContent = message;
        
        // Ocultar após 5 segundos
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
    
    /**
     * Limpa todos os dados salvos
     * @returns {boolean} Verdadeiro se os dados foram limpos com sucesso
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Todos os dados salvos foram limpos');
            this.showMessage('Todos os dados salvos foram limpos.', 'info');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            this.showMessage('Erro ao limpar dados: ' + error.message, 'error');
            return false;
        }
    }
}

// Exportar uma instância única do sistema de persistência
const persistenceSystem = new PersistenceSystem();
export default persistenceSystem;