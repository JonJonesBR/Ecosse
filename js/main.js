import { initUIDomReferences, showMessage, hideMessageBox, logToObserver, showModal, hideModal } from './utils.js';
import { init3DScene, updatePlanetAppearance, get3DIntersectionPoint, getCameraState, setCameraState, resetCamera } from './planetRenderer.js';
import { initSimulationUIReferences, setSimulationConfig, setEcosystemElements, getEcosystemElements, getSimulationConfig, drawEcosystem, startSimulationLoop, pauseSimulationLoop, toggleTimeLapse, setPlacingElement, setElementMultiplier, setCurrentMouse3DPoint, addElementAtPoint, removeElementAtPoint, getElementAtPoint3D, resetSimulation, handleCanvasInteraction } from './simulation.js';
import { saveSimulation, loadSimulation, generateSeed, loadSimulationFromSeed } from './persistence.js';
import { setupConfigPanelListeners, getCurrentConfig, populateConfigForm } from './config.js';
import { askGeminiForEcosystemAnalysis } from './geminiApi.js';

let leftPanel, rightPanel;
let useGemini = true;
let geminiApiKey = "";

function initializeApp() {
    console.log('initializeApp started.');
    const refs = {};
    const ids = [
        'app-container', 'three-js-canvas-container', 'message-box', 'message-text', 'message-ok-btn',
        'observer-log', 'top-panel', 'use-gemini-toggle', 'gemini-api-key-btn', 'open-left-panel-btn',
        'open-right-panel-btn', 'left-panel', 'toggle-left-panel', 'planet-type', 'gravity',
        'gravity-value', 'atmosphere', 'luminosity', 'luminosity-value', 'temperature',
        'temperature-value', 'water-presence', 'water-presence-value', 'soil-type', 'minerals',
        'ecosystem-size', 'randomize-config-btn', 'preset-sandbox', 'apply-config-btn', 'right-panel',
        'toggle-right-panel', 'ecosystem-stability', 'ecosystem-biodiversity', 'ecosystem-resources',
        'gemini-insights', 'bottom-panel', 'play-pause-btn', 'time-lapse-btn', 'save-sim-btn',
        'load-sim-btn', 'share-sim-btn', 'reset-sim-btn', 'reset-camera-btn', 'element-detail-modal',
        'element-detail-close-btn', 'element-detail-title', 'element-detail-content', 'gemini-api-modal',
        'gemini-api-close-btn', 'gemini-api-key-input', 'save-gemini-key-btn'
    ];
    ids.forEach(id => {
        const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
        refs[camelCaseId] = document.getElementById(id);
        console.log(`Element ${id}:`, refs[camelCaseId]);
    });
    refs.elementPaletteContainer = document.querySelector('.element-grid');
    console.log('elementPaletteContainer:', refs.elementPaletteContainer);
    refs.multiplierButtons = document.querySelectorAll('.multiplier-btn');
    console.log('multiplierButtons:', refs.multiplierButtons);

    leftPanel = refs.leftPanel;
    rightPanel = refs.rightPanel;

    initUIDomReferences(refs.messageBox, refs.messageText, refs.observerLog, refs.messageOkBtn);
    
    initSimulationUIReferences(refs.ecosystemStability, refs.ecosystemBiodiversity, refs.ecosystemResources, refs.geminiInsights);

    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (refs.geminiApiKeyInput && savedApiKey) {
        refs.geminiApiKeyInput.value = savedApiKey;
        geminiApiKey = savedApiKey;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const seed = urlParams.get('seed');
    let initialConfig;
    let loadedElements = [];
    let loadedCameraState = null;

    if (seed) {
        const loadedSeed = loadSimulationFromSeed(seed);
        if (loadedSeed) {
            initialConfig = loadedSeed.config;
            loadedElements = loadedSeed.elements;
            loadedCameraState = loadedSeed.cameraState;
        }
    } else {
         const loadedData = loadSimulation();
         if (loadedData) {
            initialConfig = loadedData.config;
            loadedElements = loadedData.elements;
            loadedCameraState = loadedData.cameraState;
            geminiApiKey = loadedData.geminiKey || "";
         }
    }

    if (!initialConfig) {
        initialConfig = getCurrentConfig(refs);
    }

    populateConfigForm(refs, initialConfig);
    if(refs.geminiApiKeyInput) refs.geminiApiKeyInput.value = geminiApiKey;

    setSimulationConfig(initialConfig);
    setEcosystemElements(loadedElements);

    const canvas = init3DScene(refs.threeJsCanvasContainer, initialConfig);
    if (loadedCameraState) setCameraState(loadedCameraState); else resetCamera(initialConfig);
    
    drawEcosystem();
    startSimulationLoop(useGemini, geminiApiKey);
    setupEventListeners(refs, canvas);
}



function setupEventListeners(refs, canvas) {
    console.log('Setting up event listeners...');
    let currentPlacingElement = null;
    let currentElementMultiplier = 1;

    // Painéis
    refs.openLeftPanelBtn.addEventListener('click', () => {
        refs.leftPanel.classList.add('active');
        console.log('Left panel opened.');
    });
    refs.toggleLeftPanel.addEventListener('click', () => {
        refs.leftPanel.classList.remove('active');
        console.log('Left panel closed.');
    });
    refs.openRightPanelBtn.addEventListener('click', () => {
        refs.rightPanel.classList.add('active');
        console.log('Right panel opened.');
    });
    refs.toggleRightPanel.addEventListener('click', () => {
        refs.rightPanel.classList.remove('active');
        console.log('Right panel closed.');
    });

    // Gemini API Key Modal
    refs.geminiApiKeyBtn.addEventListener('click', () => {
        showModal(refs.geminiApiModal);
        console.log('Gemini API modal opened.');
    });
    refs.geminiApiCloseBtn.addEventListener('click', () => {
        hideModal(refs.geminiApiModal);
        console.log('Gemini API modal closed.');
    });
    refs.saveGeminiKeyBtn.addEventListener('click', () => {
        geminiApiKey = refs.geminiApiKeyInput.value;
        localStorage.setItem('geminiApiKey', geminiApiKey);
        hideModal(refs.geminiApiModal);
        showMessage('Chave API Gemini salva!');
        console.log('Gemini API key saved.');
    });

    // Configurações
    setupConfigPanelListeners(refs, () => {
        const newConfig = getCurrentConfig(refs);
        setSimulationConfig(newConfig);
        updatePlanetAppearance(newConfig);
        drawEcosystem();
        showMessage('Configuração aplicada!');
        populateConfigForm(refs, newConfig); // Use newConfig here
        if (window.innerWidth <= 1024) refs.leftPanel.classList.remove('active');
        console.log('Config applied.');
    });

    // Multiplier Buttons
    refs.multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.multiplier-btn.selected').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentElementMultiplier = parseInt(button.dataset.multiplier);
            setElementMultiplier(currentElementMultiplier);
            console.log(`Multiplier set to ${currentElementMultiplier}`);
        });
    });

    // Paleta de Elementos
    refs.elementPaletteContainer.addEventListener('click', (event) => {
        const target = event.target.closest('.element-item');
        if (target) {
            document.querySelectorAll('.element-item.selected').forEach(item => item.classList.remove('selected'));
            target.classList.add('selected');
            currentPlacingElement = target.dataset.element;
            setPlacingElement(currentPlacingElement);
            drawEcosystem(); // Para atualizar o fantasma
            console.log(`Element selected: ${currentPlacingElement}`);
        }
    });

    // Controles da Simulação
    refs.playPauseBtn.addEventListener('click', () => {
        const isPlaying = refs.playPauseBtn.textContent.includes('▶️');
        if (isPlaying) {
            startSimulationLoop(useGemini, geminiApiKey);
            refs.playPauseBtn.innerHTML = '⏸️ Pausar';
            console.log('Simulation started.');
        } else {
            pauseSimulationLoop();
            refs.playPauseBtn.innerHTML = '▶️ Play';
            console.log('Simulation paused.');
        }
    });
    refs.resetSimBtn.addEventListener('click', () => {
        const currentConfig = getSimulationConfig();
        resetSimulation();
        populateConfigForm(refs, currentConfig);
        updatePlanetAppearance(currentConfig);
        drawEcosystem();
        console.log('Simulation reset.');
    });
    refs.saveSimBtn.addEventListener('click', () => {
        saveSimulation(getSimulationConfig(), getEcosystemElements(), geminiApiKey, useGemini, getCameraState());
        console.log('Simulation saved.');
    });
    refs.loadSimBtn.addEventListener('click', () => {
        window.location.reload();
        console.log('Simulation loaded.');
    });
    refs.shareSimBtn.addEventListener('click', () => {
        generateSeed(getSimulationConfig(), getEcosystemElements(), getCameraState());
        console.log('Share link generated.');
    });
    refs.resetCameraBtn.addEventListener('click', () => {
        resetCamera(getSimulationConfig());
        console.log('Camera reset.');
    });

    // Element Detail Modal
    refs.elementDetailCloseBtn.addEventListener('click', () => {
        hideModal(refs.elementDetailModal);
        console.log('Element detail modal closed.');
    });

    // Interação com o Canvas
    
    if(canvas){
        console.log('Canvas element right before addEventListener calls:', canvas);
        canvas.addEventListener('mousemove', (e) => handleCanvasInteraction(e, false, useGemini, geminiApiKey, showElementDetails, canvas));
        canvas.addEventListener('mousedown', (e) => handleCanvasInteraction(e, true, useGemini, geminiApiKey, showElementDetails, canvas));
        canvas.addEventListener('mouseleave', () => setCurrentMouse3DPoint(null));
        console.log('Canvas event listeners attached.');
    }

    function showElementDetails(element) {
        refs.elementDetailTitle.textContent = `${element.emoji} Detalhes do ${element.type}`;
        refs.elementDetailContent.innerHTML = `<p>ID: ${element.id.toFixed(0)}</p><p>Saúde: ${element.health.toFixed(1)}</p>`;
        showModal(refs.elementDetailModal);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired.');
    initializeApp();
});