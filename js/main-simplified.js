/**
 * Arquivo principal simplificado
 * Responsável pela inicialização e coordenação dos sistemas da aplicação
 */

// Importar sistemas simplificados
import eventSystem from './eventSystem-simplified.js';
import uiSystem from './uiSystem-simplified.js';
import simulationSystem from './simulationSystem-simplified.js';
import renderingSystem from './renderingSystem-simplified.js';
import persistenceSystem from './persistenceSystem-simplified.js';

// Configuração inicial do planeta
const initialPlanetConfig = {
    type: 'terrestrial',
    gravity: 1.0,
    atmosphere: 'oxygenated',
    luminosity: 1.0,
    waterCoverage: 0.7,
    temperature: 0.5
};

// Estado da aplicação
const appState = {
    isInitialized: false,
    isLoading: true,
    activeElement: null,
    errorState: null
};

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    console.log('Inicializando aplicação...');
    
    try {
        // Inicializar canvas
        initializeCanvas();
        
        // Configurar manipuladores de eventos
        setupEventListeners();
        
        // Marcar como inicializado
        appState.isInitialized = true;
        appState.isLoading = false;
        
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        appState.errorState = {
            message: 'Falha ao inicializar a aplicação',
            details: error.message,
            timestamp: new Date().toISOString()
        };
        
        // Exibir mensagem de erro
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = `Erro: ${error.message}`;
            errorMessage.classList.remove('hidden');
        }
    }
}

/**
 * Inicializa o canvas e o sistema de renderização
 */
function initializeCanvas() {
    console.log('Inicializando canvas...');
    
    // Obter referência ao canvas
    const canvas = document.getElementById('threejs-canvas');
    
    if (!canvas) {
        throw new Error('Canvas não encontrado');
    }
    
    // Verificar suporte a WebGL
    if (!isWebGLSupported()) {
        throw new Error('WebGL não é suportado neste navegador');
    }
    
    // Publicar evento de inicialização do canvas
    eventSystem.publish(eventSystem.EVENTS.CANVAS_INITIALIZED, { canvas });
    
    console.log('Canvas inicializado');
}

/**
 * Verifica se o WebGL é suportado
 * @returns {boolean} Verdadeiro se o WebGL for suportado
 */
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

/**
 * Configura os ouvintes de eventos
 */
function setupEventListeners() {
    console.log('Configurando ouvintes de eventos...');
    
    // Evento de carregamento da página
    window.addEventListener('load', () => {
        appState.isLoading = false;
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    });
    
    // Evento de erro
    window.addEventListener('error', (event) => {
        console.error('Erro global:', event.error);
        appState.errorState = {
            message: 'Ocorreu um erro na aplicação',
            details: event.error?.message || 'Erro desconhecido',
            timestamp: new Date().toISOString()
        };
    });
    
    // Eventos de perda de contexto WebGL
    const canvas = document.getElementById('threejs-canvas');
    if (canvas) {
        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('Contexto WebGL perdido');
            appState.isLoading = true;
            
            // Tentar recuperar após um breve atraso
            setTimeout(() => {
                initializeCanvas();
            }, 1000);
        });
        
        canvas.addEventListener('webglcontextrestored', () => {
            console.log('Contexto WebGL restaurado');
            appState.isLoading = false;
        });
    }
    
    // Eventos de clique no canvas para adicionar elementos
    canvas?.addEventListener('click', (event) => {
        if (!appState.activeElement) return;
        
        // Obter posição do clique
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        
        // Publicar evento de adição de elemento
        eventSystem.publish(eventSystem.EVENTS.ELEMENT_ADDED, {
            element: {
                type: appState.activeElement,
                position: { x, y, z: 0 },
                properties: {}
            }
        });
    });
    
    // Eventos de teclas para controles
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case ' ':
                // Espaço - Iniciar/Parar simulação
                if (simulationSystem.isRunning) {
                    eventSystem.publish(eventSystem.EVENTS.SIMULATION_STOP);
                } else {
                    eventSystem.publish(eventSystem.EVENTS.SIMULATION_START);
                }
                break;
                
            case 'r':
                // R - Reiniciar simulação
                eventSystem.publish(eventSystem.EVENTS.SIMULATION_RESET);
                break;
                
            case 's':
                // S - Salvar simulação
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    eventSystem.publish(eventSystem.EVENTS.SAVE_STATE);
                }
                break;
                
            case 'l':
                // L - Carregar simulação
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    eventSystem.publish(eventSystem.EVENTS.LOAD_STATE);
                }
                break;
        }
    });
    
    // Eventos de seleção de elemento
    eventSystem.subscribe(eventSystem.EVENTS.UI_ELEMENT_SELECTED, (data) => {
        appState.activeElement = data.element;
    });
    
    console.log('Ouvintes de eventos configurados');
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initializeApp);

// Exportar funções e objetos públicos
export {
    initializeApp,
    appState,
    initialPlanetConfig
};