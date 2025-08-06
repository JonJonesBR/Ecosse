/**
 * Sistema de UI Simplificado
 * Responsável por gerenciar as interações do usuário com a interface
 */

import eventSystem from './eventSystem-simplified.js';

class UISystem {
    constructor() {
        // Referências aos elementos da UI
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        this.toggleLeftPanelBtn = document.getElementById('toggle-left-panel');
        this.toggleRightPanelBtn = document.getElementById('toggle-right-panel');
        this.startStopBtn = document.getElementById('start-stop');
        this.resetBtn = document.getElementById('reset');
        this.saveBtn = document.getElementById('save');
        this.loadBtn = document.getElementById('load');
        this.generatePlanetBtn = document.getElementById('generate-planet');
        this.elementBtns = document.querySelectorAll('.element-btn');
        
        // Estado da UI
        this.activeElement = null;
        this.isMobile = window.innerWidth <= 768;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa o sistema de UI
     */
    init() {
        // Configurar manipuladores de eventos
        this.setupEventListeners();
        
        // Configurar estado inicial dos painéis em dispositivos móveis
        if (this.isMobile) {
            this.leftPanel?.classList.remove('open');
            this.rightPanel?.classList.remove('open');
        }
        
        // Configurar sliders
        this.setupSliders();
        
        console.log('Sistema de UI inicializado');
    }
    
    /**
     * Configura os ouvintes de eventos
     */
    setupEventListeners() {
        // Eventos de redimensionamento da janela
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Eventos de toggle dos painéis
        this.toggleLeftPanelBtn?.addEventListener('click', () => this.togglePanel('left'));
        this.toggleRightPanelBtn?.addEventListener('click', () => this.togglePanel('right'));
        
        // Eventos de botões de controle
        this.startStopBtn?.addEventListener('click', this.handleStartStop.bind(this));
        this.resetBtn?.addEventListener('click', this.handleReset.bind(this));
        this.saveBtn?.addEventListener('click', this.handleSave.bind(this));
        this.loadBtn?.addEventListener('click', this.handleLoad.bind(this));
        this.generatePlanetBtn?.addEventListener('click', this.handleGeneratePlanet.bind(this));
        
        // Eventos de botões de elementos
        this.elementBtns?.forEach(btn => {
            btn.addEventListener('click', () => this.handleElementSelect(btn));
        });
        
        // Eventos de sliders e selects
        document.querySelectorAll('input[type="range"], select').forEach(input => {
            input.addEventListener('change', () => this.handleInputChange(input));
            input.addEventListener('input', () => this.handleInputChange(input));
        });
        
        // Eventos de modal
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        modalClose?.addEventListener('click', this.closeModal.bind(this));
        modalOverlay?.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Configura os sliders e seus valores iniciais
     */
    setupSliders() {
        // Configurar slider de gravidade
        const gravitySlider = document.getElementById('gravity');
        const gravityValue = document.getElementById('gravity-value');
        
        if (gravitySlider && gravityValue) {
            gravityValue.textContent = `${gravitySlider.value}x`;
            gravitySlider.addEventListener('input', () => {
                gravityValue.textContent = `${gravitySlider.value}x`;
            });
        }
        
        // Configurar slider de luminosidade
        const luminositySlider = document.getElementById('luminosity');
        const luminosityValue = document.getElementById('luminosity-value');
        
        if (luminositySlider && luminosityValue) {
            luminosityValue.textContent = `${luminositySlider.value}x`;
            luminositySlider.addEventListener('input', () => {
                luminosityValue.textContent = `${luminositySlider.value}x`;
            });
        }
        
        // Configurar slider de cobertura de água
        const waterCoverageSlider = document.getElementById('water-coverage');
        const waterCoverageValue = document.getElementById('water-coverage-value');
        
        if (waterCoverageSlider && waterCoverageValue) {
            waterCoverageValue.textContent = `${Math.round(waterCoverageSlider.value * 100)}%`;
            waterCoverageSlider.addEventListener('input', () => {
                waterCoverageValue.textContent = `${Math.round(waterCoverageSlider.value * 100)}%`;
            });
        }
        
        // Configurar slider de temperatura
        const temperatureSlider = document.getElementById('temperature');
        const temperatureValue = document.getElementById('temperature-value');
        
        if (temperatureSlider && temperatureValue) {
            // Definir texto inicial da temperatura
            this.updateTemperatureText(temperatureSlider.value, temperatureValue);
            
            temperatureSlider.addEventListener('input', () => {
                this.updateTemperatureText(temperatureSlider.value, temperatureValue);
            });
        }
    }
    
    /**
     * Atualiza o texto da temperatura com base no valor do slider
     * @param {number} value - Valor do slider (0-1)
     * @param {HTMLElement} element - Elemento para exibir o texto
     */
    updateTemperatureText(value, element) {
        let text = 'Moderada';
        
        if (value < 0.3) {
            text = 'Fria';
        } else if (value > 0.7) {
            text = 'Quente';
        }
        
        element.textContent = text;
    }
    
    /**
     * Manipula o redimensionamento da janela
     */
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // Ajustar painéis se o estado de mobilidade mudou
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                // Mudar para layout móvel
                this.leftPanel?.classList.remove('open');
                this.rightPanel?.classList.remove('open');
            } else {
                // Mudar para layout desktop
                this.leftPanel?.classList.remove('collapsed');
                this.rightPanel?.classList.remove('collapsed');
            }
        }
        
        // Publicar evento de redimensionamento
        eventSystem.publish(eventSystem.EVENTS.CANVAS_RESIZE, {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: this.isMobile
        });
    }
    
    /**
     * Alterna a visibilidade de um painel
     * @param {string} panelSide - 'left' ou 'right'
     */
    togglePanel(panelSide) {
        const panel = panelSide === 'left' ? this.leftPanel : this.rightPanel;
        
        if (!panel) return;
        
        if (this.isMobile) {
            // Em dispositivos móveis, alternar classe 'open'
            panel.classList.toggle('open');
        } else {
            // Em desktop, alternar classe 'collapsed'
            panel.classList.toggle('collapsed');
        }
        
        // Publicar evento de toggle do painel
        eventSystem.publish(eventSystem.EVENTS.UI_PANEL_TOGGLE, {
            panel: panelSide,
            isOpen: this.isMobile ? panel.classList.contains('open') : !panel.classList.contains('collapsed')
        });
    }
    
    /**
     * Manipula o clique no botão iniciar/parar
     */
    handleStartStop() {
        const isRunning = this.startStopBtn.textContent === 'Parar';
        
        if (isRunning) {
            // Parar simulação
            this.startStopBtn.textContent = 'Iniciar';
            eventSystem.publish(eventSystem.EVENTS.SIMULATION_STOP);
        } else {
            // Iniciar simulação
            this.startStopBtn.textContent = 'Parar';
            eventSystem.publish(eventSystem.EVENTS.SIMULATION_START);
        }
    }
    
    /**
     * Manipula o clique no botão reiniciar
     */
    handleReset() {
        // Reiniciar simulação
        this.startStopBtn.textContent = 'Iniciar';
        eventSystem.publish(eventSystem.EVENTS.SIMULATION_RESET);
    }
    
    /**
     * Manipula o clique no botão salvar
     */
    handleSave() {
        eventSystem.publish(eventSystem.EVENTS.SAVE_STATE);
    }
    
    /**
     * Manipula o clique no botão carregar
     */
    handleLoad() {
        eventSystem.publish(eventSystem.EVENTS.LOAD_STATE);
    }
    
    /**
     * Manipula o clique no botão gerar planeta
     */
    handleGeneratePlanet() {
        // Coletar valores dos controles
        const planetType = document.getElementById('planet-type')?.value || 'terrestrial';
        const gravity = parseFloat(document.getElementById('gravity')?.value || 1.0);
        const atmosphere = document.getElementById('atmosphere')?.value || 'oxygenated';
        const luminosity = parseFloat(document.getElementById('luminosity')?.value || 1.0);
        const waterCoverage = parseFloat(document.getElementById('water-coverage')?.value || 0.7);
        const temperature = parseFloat(document.getElementById('temperature')?.value || 0.5);
        
        // Criar objeto de configuração do planeta
        const planetConfig = {
            type: planetType,
            gravity,
            atmosphere,
            luminosity,
            waterCoverage,
            temperature
        };
        
        // Publicar evento de geração de planeta
        eventSystem.publish(eventSystem.EVENTS.PLANET_GENERATED, planetConfig);
    }
    
    /**
     * Manipula a seleção de um elemento
     * @param {HTMLElement} button - O botão do elemento clicado
     */
    handleElementSelect(button) {
        // Remover classe ativa de todos os botões
        this.elementBtns.forEach(btn => btn.classList.remove('active'));
        
        // Adicionar classe ativa ao botão clicado
        button.classList.add('active');
        
        // Armazenar elemento ativo
        this.activeElement = button.dataset.element;
        
        // Publicar evento de seleção de elemento
        eventSystem.publish(eventSystem.EVENTS.UI_ELEMENT_SELECTED, {
            element: this.activeElement
        });
    }
    
    /**
     * Manipula mudanças em inputs (sliders e selects)
     * @param {HTMLElement} input - O input que mudou
     */
    handleInputChange(input) {
        // Publicar evento de mudança de slider/select
        eventSystem.publish(eventSystem.EVENTS.UI_SLIDER_CHANGED, {
            id: input.id,
            value: input.value,
            type: input.type
        });
    }
    
    /**
     * Abre um modal com conteúdo específico
     * @param {string} title - Título do modal
     * @param {string|HTMLElement} content - Conteúdo do modal (string HTML ou elemento)
     */
    openModal(title, content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalOverlay || !modalTitle || !modalContent) return;
        
        // Definir título
        modalTitle.textContent = title;
        
        // Definir conteúdo
        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalContent.innerHTML = '';
            modalContent.appendChild(content);
        }
        
        // Mostrar modal
        modalOverlay.classList.remove('hidden');
    }
    
    /**
     * Fecha o modal
     */
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Exibe uma mensagem para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem (success, error, warning, info)
     * @param {number} duration - Duração em milissegundos (padrão: 5000)
     */
    showMessage(message, type = 'info', duration = 5000) {
        const messageBox = document.getElementById('message-box');
        const messageContent = document.getElementById('message-content');
        
        if (!messageBox || !messageContent) return;
        
        // Definir classe baseada no tipo
        messageBox.className = 'message-box';
        messageBox.classList.add(`message-${type}`);
        messageBox.classList.remove('hidden');
        
        // Definir conteúdo
        messageContent.textContent = message;
        
        // Ocultar após a duração especificada
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, duration);
    }
}

// Exportar uma instância única do sistema de UI
const uiSystem = new UISystem();
export default uiSystem;