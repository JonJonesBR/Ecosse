import { LoadingDebugger } from './debug-loading.js';
import { initUIDomReferences, showMessage, hideMessageBox, logToObserver, showModal, hideModal } from './utils.js';
import { domErrorHandler } from './utils/domErrorHandler.js';
import { get3DIntersectionPoint, getCameraState, setCameraState } from './planetRenderer.js';
import { enhancedInit3DScene as init3DScene, enhancedUpdatePlanetAppearance as updatePlanetAppearance, enhancedResetCamera as resetCamera } from './planet-renderer-integration.js';
import { coreLayoutSystem } from './systems/coreLayoutSystem.js';
import { initSimulationUIReferences, setSimulationConfig, setEcosystemElements, getEcosystemElements, getSimulationConfig, drawEcosystem, startSimulationLoop, pauseSimulationLoop, toggleTimeLapse, setPlacingElement, setElementMultiplier, setCurrentMouse3DPoint, addElementAtPoint, removeElementAtPoint, getElementAtPoint3D, resetSimulation, handleCanvasInteraction, blessTribe, curseTribe } from './simulation.js';
import { saveSimulation, loadSimulation, generateSeed, loadSimulationFromSeed } from './persistence.js';
import { setupConfigPanelListeners, getCurrentConfig, populateConfigForm } from './config.js';
import { askGeminiForEcosystemAnalysis, askGeminiForPlanetStory, initializeEnhancedAnalysis } from './geminiApi.js';
import { getAchievements } from './achievements.js'; // NEW IMPORT
import { getTechnologies, unlockTechnology, getUnlockedTechnologies } from './techTree.js'; // NEW IMPORT
import { initEnergySystem, initEnergyDisplay, getPlayerEnergy, getPlayerResources, performIntervention, canAffordIntervention } from './energySystem.js'; // NEW IMPORT
import { loadAudio, playBackgroundMusic, pauseBackgroundMusic, playSFX } from './audioManager.js'; // NEW IMPORT
import { adaptiveMusicSystem } from './systems/adaptiveMusicSystem.js'; // NEW: Adaptive music system
import { spatialAudioSystem } from './systems/spatialAudioSystem.js'; // NEW: Spatial audio system
import { testSpatialAudioSystem } from './test-spatial-audio.js'; // NEW: Spatial audio tests
import { scenarios, getScenarioById } from './scenarios.js'; // NEW IMPORT
import { subscribe, EventTypes } from './systems/eventSystem.js'; // NEW: Event system
import { initLoggingSystem, info, warning } from './systems/loggingSystem.js'; // NEW: Enhanced logging
import { initGeneticsPanel, showGeneticsInfo, hideGeneticsPanel, addGeneticsPanelStyles } from './ui/geneticsPanel.js'; // NEW: Genetics panel
import { uiController } from './ui/uiController.js'; // NEW: Enhanced UI system
import { analysisTools } from './ui/analysisTools.js'; // NEW: Analysis tools
import { controlsManager } from './ui/controlsManager.js'; // NEW: Enhanced controls
import { gestureSystem } from './ui/gestureSystem.js'; // NEW: Gesture recognition
// import { selectionModes } from './ui/selectionModes.js'; // NEW: Selection modes - Temporarily disabled
import { shortcutsPanel } from './ui/shortcutsPanel.js'; // NEW: Shortcuts panel
import { feedbackSystem } from './ui/feedbackSystem.js'; // NEW: Enhanced feedback system
// import { visualIndicators } from './ui/visualIndicators.js'; // NEW: Visual indicators - Temporarily disabled
// import { contextualHelp } from './ui/contextualHelp.js'; // NEW: Contextual help - Temporarily disabled
import { verifyTask4Completion } from './ui/task4-completion-verification.js'; // NEW: Task 4 verification
import { tooltipDebugger } from './ui/tooltip-debug.js'; // NEW: Tooltip debugging utilities
import { floatingControlsPanel } from './ui/floatingControlsPanel.js'; // NEW: Floating controls panel
import { adaptiveUIController } from './ui/adaptiveUIController.js'; // NEW: Adaptive UI controller
import { panelVisibilityManager } from './ui/panelVisibilityManager.js'; // NEW: Panel visibility manager
import { rendererLayoutIntegration } from './ui/rendererLayoutIntegration.js'; // NEW: Renderer layout integration
import { animationController } from './ui/animationController.js'; // NEW: Animation controller
import { layoutErrorHandler } from './ui/layoutErrorHandler.js'; // NEW: Layout error handler
import './ui/layoutConfigurationIntegration.js'; // NEW: Layout configuration system
import { testLayoutRestructure } from './test-layout-restructure.js'; // NEW: Layout restructure tests
import { verifyTask2Completion } from './verify-task2-completion.js'; // NEW: Task 2 verification
import { narrativeSystem } from './systems/narrativeSystem.js'; // NEW: Narrative system
import { tribalCultureSystem } from './systems/tribalCultureSystem.js'; // NEW: Tribal culture system
import { eventSystem } from './systems/eventSystem.js'; // NEW: Event system reference
import { performanceMonitor } from './ui/performanceMonitor.js'; // NEW: Performance monitoring system
import { performanceOptimizer } from './performanceOptimizer.js'; // NEW: Performance optimization system
import './ui/elementControlsOrganizer.js'; // NEW: Element controls organization system

let leftPanel, rightPanel;
let useGemini = true;
let geminiApiKey = "";
let currentScenario = null; // NEW: Global variable to store the active scenario

/**
 * Set up event subscriptions for the UI
 * This function subscribes to events from the event system
 */
function setupEventSubscriptions() {
    console.log('Setting up event subscriptions...');
    
    // Subscribe to weather change events to update the UI
    subscribe(EventTypes.WEATHER_CHANGED, (data) => {
        updateWeatherDisplay(data);
    });
    
    // Subscribe to time of day change events to update the UI
    subscribe(EventTypes.TIME_OF_DAY_CHANGED, (data) => {
        updateTimeOfDayDisplay(data);
    });
    
    // Subscribe to other events as needed
    subscribe(EventTypes.ELEMENT_CREATED, (data) => {
        console.log(`Element created: ${data.type}`);
    });
    
    subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
        console.log(`Element removed: ${data.type}`);
    });
    
    subscribe(EventTypes.STATE_CHANGED, (data) => {
        console.log(`State changed from ${data.from} to ${data.to}`);
    });
}

function initializeApp() {
    console.log('initializeApp started.');
    
    // Start loading debug
    window.loadingDebugger.logStep('Application Initialization', 'started');
    window.loadingDebugger.checkForInfiniteLoops();
    
    // Initialize DOM Error Handler first to prevent DOM-related errors
    window.loadingDebugger.logStep('DOM Error Handler', 'started');
    try {
        domErrorHandler.initialize();
        // Run auto-fix for common issues
        domErrorHandler.autoFixCommonIssues();
        window.loadingDebugger.logStep('DOM Error Handler', 'completed');
    } catch (error) {
        console.error('❌ DOM Error Handler initialization failed:', error);
        window.loadingDebugger.logError('DOM Error Handler', error);
    }
    
    // Initialize core layout system first
    window.loadingDebugger.logStep('Core Layout System', 'started');
    coreLayoutSystem.initialize().then(() => {
        console.log('✅ Core layout system ready');
        window.loadingDebugger.logStep('Core Layout System', 'completed');
    }).catch(error => {
        console.error('❌ Core layout system initialization failed:', error);
        window.loadingDebugger.logError('Core Layout System', error);
    });
    
    // Initialize enhanced UI system
    uiController.initialize();
    
    // Initialize adaptive UI controller
    window.loadingDebugger.logStep('Adaptive UI Controller', 'started');
    try {
        adaptiveUIController.initialize();
        window.loadingDebugger.logStep('Adaptive UI Controller', 'completed');
    } catch (error) {
        console.warn('⚠️ Adaptive UI controller initialization failed:', error);
        window.loadingDebugger.logError('Adaptive UI Controller', error);
    }
    
    // Initialize analysis tools
    analysisTools.initialize();
    
    // Initialize enhanced controls system
    controlsManager.initialize();
    
    // Initialize gesture recognition
    gestureSystem.initialize();
    
    // Initialize selection modes
    // selectionModes.initialize(); // Temporarily disabled to fix rendering issue
    
    // Initialize shortcuts panel
    shortcutsPanel.initialize();
    
    // Initialize enhanced feedback system
    feedbackSystem.initialize();
    
    // Initialize floating controls panel (simplified)
    window.loadingDebugger.logStep('Floating Controls Panel', 'started');
    try {
        floatingControlsPanel.init();
        window.loadingDebugger.logStep('Floating Controls Panel', 'completed');
    } catch (error) {
        console.warn('⚠️ Floating controls panel initialization failed, using fallback:', error);
        window.loadingDebugger.logError('Floating Controls Panel', error);
        // Continue without floating controls panel
    }
    
    // Initialize panel visibility manager
    window.loadingDebugger.logStep('Panel Visibility Manager', 'started');
    try {
        panelVisibilityManager.initialize();
        window.loadingDebugger.logStep('Panel Visibility Manager', 'completed');
    } catch (error) {
        console.warn('⚠️ Panel visibility manager initialization failed:', error);
        window.loadingDebugger.logError('Panel Visibility Manager', error);
    }
    
    // Initialize animation controller
    window.loadingDebugger.logStep('Animation Controller', 'started');
    try {
        animationController.initialize();
        window.loadingDebugger.logStep('Animation Controller', 'completed');
    } catch (error) {
        console.warn('⚠️ Animation controller initialization failed:', error);
        window.loadingDebugger.logError('Animation Controller', error);
    }
    
    // Make feedbackSystem globally available for debugging
    window.feedbackSystem = feedbackSystem;
    
    // Initialize narrative system
    narrativeSystem.initialize();
    
    // Initialize tribal culture system
    tribalCultureSystem.initialize();
    
    // Initialize adaptive music system
    adaptiveMusicSystem.initialize();
    
    // Initialize performance optimizer
    window.loadingDebugger.logStep('Performance Optimizer', 'started');
    try {
        performanceOptimizer.initialize();
        window.loadingDebugger.logStep('Performance Optimizer', 'completed');
    } catch (error) {
        console.warn('⚠️ Performance optimizer initialization failed:', error);
        window.loadingDebugger.logError('Performance Optimizer', error);
    }
    
    // Make systems globally available for debugging and integration
    window.narrativeSystem = narrativeSystem;
    window.tribalCultureSystem = tribalCultureSystem;
    window.eventSystem = eventSystem;
    window.adaptiveMusicSystem = adaptiveMusicSystem;
    window.adaptiveUIController = adaptiveUIController;
    window.panelVisibilityManager = panelVisibilityManager;
    window.rendererLayoutIntegration = rendererLayoutIntegration;
    window.animationController = animationController;
    window.layoutErrorHandler = layoutErrorHandler;
    window.performanceOptimizer = performanceOptimizer;
    
    // Import and make special events system available for debugging
    import('./systems/specialEventsSystem.js').then(module => {
        window.specialEventsSystem = module.specialEventsSystem;
        console.log('🌟 Special Events System available: Use specialEventsSystem.forceEvent("event_type", simulationState) to trigger events');
        console.log('Available events:', Object.keys(module.specialEventsSystem.eventDefinitions));
    });
    
    // Import and make seasonal events system available for debugging
    import('./systems/seasonalEventsSystem.js').then(module => {
        window.seasonalEventsSystem = module.seasonalEventsSystem;
        console.log('🍂 Seasonal Events System available: Use seasonalEventsSystem.forceSeasonalEvent("planet_type", "season", "event_name", simulationState) to trigger seasonal events');
        console.log('Available biomes:', Object.keys(module.seasonalEventsSystem.biomeSeasonalEvents));
    });
    
    // Initialize visual indicators
    // visualIndicators.initialize(); // Temporarily disabled to fix rendering issue
    
    // Initialize contextual help
    // contextualHelp.initialize(); // Temporarily disabled to fix rendering issue
    
    // Set up event subscriptions for the UI
    setupEventSubscriptions();
    
    const refs = {};
    const ids = [
        'app-container', 'three-js-canvas-container', 'message-box', 'message-text', 'message-ok-btn',
        'observer-log', 'top-panel', 'use-gemini-toggle', 'gemini-api-key-btn', 'open-left-panel-btn',
        'open-right-panel-btn', 'left-panel', 'toggle-left-panel', 'planet-type', 'gravity',
        'gravity-value', 'atmosphere', 'luminosity', 'luminosity-value', 'temperature',
        'temperature-value', 'water-presence', 'water-presence-value', 'soil-type', 'minerals',
        'ecosystem-size', 'randomize-config-btn', 'preset-sandbox', 'apply-config-btn', 'right-panel',
        'toggle-right-panel', 'ecosystem-stability', 'ecosystem-biodiversity', 'ecosystem-resources',
        'gemini-insights', 'trigger-enhanced-analysis', 'bottom-panel', 'play-pause-btn', 'time-lapse-btn', 'save-sim-btn',
        'load-sim-btn', 'share-sim-btn', 'reset-sim-btn', 'reset-camera-btn', 'element-detail-modal',
        'element-detail-close-btn', 'element-detail-title', 'element-detail-content', 'gemini-api-modal',
        'gemini-api-close-btn', 'gemini-api-key-input', 'save-gemini-key-btn',
        'achievements-btn', 'achievements-modal', 'achievements-close-btn', 'achievements-list',
        'current-weather', 'current-season-display', // NEW ID
        'tech-tree-btn', 'tech-tree-modal', 'tech-tree-close-btn', 'tech-tree-list',
        'history-btn', 'history-modal', 'history-close-btn', 'history-log', // NEW IDs
        'scenarios-btn', 'scenarios-modal', 'scenarios-close-btn', 'scenarios-list', // NEW Scenario IDs
        'analysis-btn', // NEW Analysis button
        'analysis-modal', 'analysis-close-btn', // NEW Analysis modal
        'shortcuts-btn', // NEW Shortcuts button
        'tribe-interaction-modal', 'tribe-interaction-close-btn', 'tribe-interaction-title',
        'bless-tribe-btn', 'curse-tribe-btn', // NEW Tribe Interaction IDs
        'player-energy-display', // NEW: Player energy display
        'planet-story', // NEW: Planet story display
        'victory-modal', 'victory-title', 'victory-message', 'victory-restart-btn', 'victory-main-menu-btn', // NEW Victory Modal IDs
        'failure-modal', 'failure-title', 'failure-message', 'failure-restart-btn', 'failure-main-menu-btn' // NEW Failure Modal IDs
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
    
    initSimulationUIReferences(refs.ecosystemStability, refs.ecosystemBiodiversity, refs.ecosystemResources, refs.geminiInsights, refs.playerEnergyDisplay, refs.currentSeasonDisplay, showModal, hideModal);
    
    // Initialize energy system
    initEnergySystem();
    initEnergyDisplay(refs.playerEnergyDisplay);

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

    // Generate and display planet story
    if (useGemini && geminiApiKey) {
        refs.planetStory.textContent = 'Gerando história...';
        askGeminiForPlanetStory(initialConfig, geminiApiKey, logToObserver)
            .then(story => {
                if (story) {
                    refs.planetStory.textContent = story;
                } else {
                    refs.planetStory.textContent = 'Não foi possível gerar a história do planeta.';
                }
            });
    } else {
        refs.planetStory.textContent = 'Conecte-se ao Gemini para gerar a história do planeta.';
    }

    // Add a small delay to ensure container is properly sized
    setTimeout(async () => {
        try {
            window.loadingDebugger.logStep('3D Scene Initialization', 'started');
            const canvas = await init3DScene(refs.threeJsCanvasContainer, initialConfig);
            window.loadingDebugger.logStep('3D Scene Initialization', 'completed');
            
            window.loadingDebugger.logStep('Camera Setup', 'started');
            if (loadedCameraState) setCameraState(loadedCameraState); else resetCamera(initialConfig);
            window.loadingDebugger.logStep('Camera Setup', 'completed');
            
            window.loadingDebugger.logStep('Ecosystem Drawing', 'started');
            drawEcosystem();
            window.loadingDebugger.logStep('Ecosystem Drawing', 'completed');
            
            window.loadingDebugger.logStep('Event Listeners Setup', 'started');
            setupEventListeners(refs, canvas);
            window.loadingDebugger.logStep('Event Listeners Setup', 'completed');
        } catch (error) {
            console.error('Failed to initialize 3D scene:', error);
            window.loadingDebugger.logError('3D Scene Initialization', error);
            // Show error message to user
            refs.threeJsCanvasContainer.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #1e293b;
                    color: white;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h3>🚫 Erro na Renderização 3D</h3>
                        <p>Não foi possível inicializar o renderizador do planeta.</p>
                        <button onclick="location.reload()" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">Recarregar</button>
                    </div>
                </div>
            `;
        }
    }, 100);
    
    loadAudio(); // Load all audio files
    
    // Initialize spatial audio system
    spatialAudioSystem.initialize().then(() => {
        console.log('✅ Spatial audio system initialized');
    }).catch(error => {
        console.warn('⚠️ Spatial audio system initialization failed:', error);
    });
    
    window.loadingDebugger.logStep('Simulation Loop', 'started');
    startSimulationLoop(useGemini, geminiApiKey);
    window.loadingDebugger.logStep('Simulation Loop', 'completed');
    
    // Start adaptive music instead of basic background music
    // playBackgroundMusic(); // Replaced by adaptive music system
    
    // Make Task 4 verification available in console for testing
    window.verifyTask4Completion = verifyTask4Completion;
    console.log('✅ Task 4 verification available: Run verifyTask4Completion() in console');
    
    // Make tooltip debugger available
    window.tooltipDebugger = tooltipDebugger;
    console.log('🔍 Tooltip debugging available: Run debugTooltips(), testTooltips(), clearTooltips(), fixTooltips(), or tooltipStats() in console');
    
    // Make spatial audio test available
    window.testSpatialAudio = testSpatialAudioSystem;
    console.log('🔊 Spatial audio testing available: Run testSpatialAudio() in console');
    
    // Load quick planet tests
    import('./quick-planet-test.js').then(() => {
        console.log('🧪 Quick planet tests loaded: Run quickPlanetTest() or forceReloadPlanet() in console');
    });
    
    // Load layout system tests
    import('./test-layout-system.js').then(() => {
        console.log('🧪 Layout system tests loaded: Run testLayoutSystem() in console');
    });
    
    // Load responsive canvas tests
    import('./test-responsive-canvas.js').then(() => {
        console.log('🧪 Responsive canvas tests loaded: Run testResponsiveCanvas(), testCanvasResizeIntegration(), or testViewportSizes() in console');
    });
    
    // Load Task 4 verification
    import('./verify-task4-completion.js').then(() => {
        console.log('🔍 Task 4 verification loaded: Run verifyTask4Completion() in console');
    });
    
    // Load Panel Visibility System tests
    import('./test-panel-visibility-system.js').then(() => {
        console.log('🧪 Panel Visibility System tests loaded: Run testPanelVisibilitySystem() in console');
    });
    
    // Load Renderer Layout Integration tests
    import('./test-renderer-layout-integration.js').then(() => {
        console.log('🧪 Renderer Layout Integration tests loaded: Run testRendererLayoutIntegration() in console');
    });
    
    // Load Adaptive UI tests
    import('./test-adaptive-ui.js').then(() => {
        console.log('🧪 Adaptive UI tests loaded: Run testAdaptiveUI(), testTouchControls(), testViewportChanges(), or getAdaptiveUIMetrics() in console');
    });
    
    // Load Enhanced Responsive Layout tests
    import('./test-enhanced-responsive-layout.js').then(() => {
        console.log('🧪 Enhanced Responsive Layout tests loaded: Run testEnhancedResponsiveLayout() or getEnhancedResponsiveLayoutMetrics() in console');
    });
    
    // Load DOM fix tests
    import('./test-dom-fixes.js').then(() => {
        console.log('🧪 DOM fix tests loaded: Run testDOMFixes(), testSpecificErrorScenarios(), or validateDOMFixes() in console');
    });
    
    // Load Performance Optimizer tests
    import('./test-performance-optimizer.js').then(() => {
        console.log('🧪 Performance Optimizer tests loaded: Run testPerformanceOptimizer() in console');
    });
    
    // Load Performance Optimization verification
    import('./verify-performance-optimization.js').then(() => {
        console.log('🔍 Performance Optimization verification loaded: Run verifyPerformanceOptimization() in console');
    });
    
    // Load Layout Performance Optimization tests
    import('./test-layout-performance-optimization.js').then(() => {
        console.log('🧪 Layout Performance Optimization tests loaded: Run testLayoutPerformanceOptimization() in console');
    });
    
    // Load Layout Performance Optimization verification
    import('./verify-layout-performance-optimization.js').then(() => {
        console.log('🔍 Layout Performance Optimization verification loaded: Run verifyLayoutPerformanceOptimization() in console');
    });
    
    // Add helper function for testing special events
    window.triggerRandomEvent = function() {
        if (window.specialEventsSystem) {
            const eventTypes = Object.keys(window.specialEventsSystem.eventDefinitions);
            const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const simulationState = {
                elements: getEcosystemElements(),
                newElements: [],
                config: getSimulationConfig(),
                canvasWidth: 800,
                canvasHeight: 450
            };
            window.specialEventsSystem.forceEvent(randomEvent, simulationState);
            console.log(`🌟 Triggered random event: ${randomEvent}`);
        }
    };
    
    console.log('🎲 Special Events Testing: Run triggerRandomEvent() to test random events');
    
    // Mark initialization as complete
    window.loadingDebugger.complete();
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

    // Enhanced Analysis Button
    refs.triggerEnhancedAnalysis.addEventListener('click', () => {
        if (!geminiApiKey) {
            showModal(refs.geminiApiModal);
            return;
        }
        
        const currentConfig = getSimulationConfig();
        const currentElements = getEcosystemElements();
        initializeEnhancedAnalysis(currentConfig, currentElements, geminiApiKey, refs.geminiInsights, logToObserver);
        console.log('Enhanced analysis triggered.');
    });

    // Configurações
    setupConfigPanelListeners(refs, () => {
        const newConfig = getCurrentConfig(refs);
        setSimulationConfig(newConfig);
        updatePlanetAppearance(newConfig);
        drawEcosystem();
        // Use enhanced feedback system
        feedbackSystem.showNotification({
            type: 'success',
            title: 'Configuração Aplicada',
            message: 'As novas configurações foram aplicadas ao planeta.',
            duration: 3000
        });
        
        populateConfigForm(refs, newConfig); // Use newConfig here
        
        // Dispatch config applied event for panel manager
        document.dispatchEvent(new CustomEvent('configApplied', {
            detail: { config: newConfig }
        }));
        
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
    refs.timeLapseBtn.addEventListener('click', () => {
        toggleTimeLapse();
        console.log('Time-lapse toggled.');
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

    // NEW: Achievements Button and Modal
    refs.achievementsBtn.addEventListener('click', () => {
        populateAchievementsModal(refs.achievementsList);
        showModal(refs.achievementsModal);
        console.log('Achievements modal opened.');
    });
    refs.achievementsCloseBtn.addEventListener('click', () => {
        hideModal(refs.achievementsModal);
        console.log('Achievements modal closed.');
    });

    // NEW: Tech Tree Button and Modal
    refs.techTreeBtn.addEventListener('click', () => {
        populateTechTreeModal(refs.techTreeList);
        showModal(refs.techTreeModal);
        console.log('Tech Tree modal opened.');
    });
    refs.techTreeCloseBtn.addEventListener('click', () => {
        hideModal(refs.techTreeModal);
        console.log('Tech Tree modal closed.');
    });

    // NEW: History Button and Modal
    refs.historyBtn.addEventListener('click', () => {
        populateHistoryModal(refs.historyLog);
        showModal(refs.historyModal);
        console.log('History modal opened.');
    });
    refs.historyCloseBtn.addEventListener('click', () => {
        hideModal(refs.historyModal);
        console.log('History modal closed.');
    });

    // NEW: Scenarios Button and Modal
    refs.scenariosBtn.addEventListener('click', () => {
        populateScenariosModal(refs.scenariosList);
        showModal(refs.scenariosModal);
        console.log('Scenarios modal opened.');
    });
    refs.scenariosCloseBtn.addEventListener('click', () => {
        hideModal(refs.scenariosModal);
        console.log('Scenarios modal closed.');
    });

    // NEW: Analysis Button
    refs.analysisBtn.addEventListener('click', () => {
        analysisTools.showAnalysisModal();
        console.log('Analysis modal opened.');
    });

    // NEW: Analysis Modal
    refs.analysisCloseBtn.addEventListener('click', () => {
        analysisTools.hideAnalysisModal();
        console.log('Analysis modal closed.');
    });

    // NEW: Shortcuts Button
    refs.shortcutsBtn.addEventListener('click', () => {
        shortcutsPanel.show();
        console.log('Shortcuts panel opened.');
    });

    // Element Detail Modal
    refs.elementDetailCloseBtn.addEventListener('click', () => {
        hideModal(refs.elementDetailModal);
        console.log('Element detail modal closed.');
    });

    // NEW: Tribe Interaction Modal
    refs.tribeInteractionCloseBtn.addEventListener('click', () => {
        hideModal(refs.tribeInteractionModal);
        console.log('Tribe interaction modal closed.');
    });

    let selectedTribe = null; // To store the tribe being interacted with

    refs.blessTribeBtn.addEventListener('click', () => {
        if (selectedTribe) {
            blessTribe(selectedTribe);
            hideModal(refs.tribeInteractionModal);
        }
    });

    refs.curseTribeBtn.addEventListener('click', () => {
        if (selectedTribe) {
            curseTribe(selectedTribe);
            hideModal(refs.tribeInteractionModal);
        }
    });

    // Interação com o Canvas
    
    if(canvas){
        console.log('Canvas element right before addEventListener calls:', canvas);
        canvas.addEventListener('mousemove', (e) => handleCanvasInteraction(e, false, useGemini, geminiApiKey, showElementDetails, showTribeInteractionModal, canvas));
        canvas.addEventListener('mousedown', (e) => handleCanvasInteraction(e, true, useGemini, geminiApiKey, showElementDetails, showTribeInteractionModal, canvas));
        canvas.addEventListener('mouseleave', () => setCurrentMouse3DPoint(null));
        console.log('Canvas event listeners attached.');
    }

    function showElementDetails(element) {
        refs.elementDetailTitle.textContent = `${element.emoji} Detalhes do ${element.type}`;
        let contentHtml = `<p><strong>ID:</strong> ${element.id.toFixed(0)}</p>
                           <p><strong>Saúde:</strong> ${element.health.toFixed(1)}</p>
                           <p><strong>Energia:</strong> ${element.energy !== undefined ? element.energy.toFixed(1) : 'N/A'}</p>
                           <p><strong>Tamanho:</strong> ${element.size.toFixed(1)}</p>
                           <p><strong>Velocidade:</strong> ${element.speed !== undefined ? element.speed.toFixed(1) : 'N/A'}</p>
                           <p><strong>Chance de Reprodução:</strong> ${element.reproductionChance !== undefined ? (element.reproductionChance * 100).toFixed(3) + '%' : 'N/A'}</p>
                           <p><strong>Idade:</strong> ${element.age}</p>`;

        if (element.type === 'rock' && element.currentMinerals) {
            contentHtml += `<p><strong>Minerais:</strong></p><ul>`;
            for (const mineral in element.currentMinerals) {
                contentHtml += `<li>${mineral.charAt(0).toUpperCase() + mineral.slice(1)}: ${element.currentMinerals[mineral].toFixed(2)}</li>`;
            }
            contentHtml += `</ul>`;
        }

        // Check if the element has the old gene system
        if (element.type === 'creature' && element.geneSpeed !== undefined && !element.genome) {
            contentHtml += `<p><strong>Genes:</strong></p><ul>
                               <li>Velocidade: ${element.geneSpeed.toFixed(2)}</li>
                               <li>Tamanho: ${element.geneSize.toFixed(2)}</li>
                               <li>Reprodução: ${(element.geneReproductionChance * 100).toFixed(3)}%</li>
                           </ul>`;
        }

        refs.elementDetailContent.innerHTML = contentHtml;
        
        // Initialize genetics panel if it doesn't exist yet
        if (!document.getElementById('genetics-panel')) {
            initGeneticsPanel(refs.elementDetailContent);
            addGeneticsPanelStyles();
        }
        
        // Show genetics info if the element has a genome
        if (element.genome) {
            showGeneticsInfo(element);
        } else {
            hideGeneticsPanel();
        }
        
        showModal(refs.elementDetailModal);
    }

    function showTribeInteractionModal(tribe) {
        selectedTribe = tribe;
        refs.tribeInteractionTitle.textContent = `Interagir com Tribo (ID: ${tribe.id.toFixed(0)})`;
        showModal(refs.tribeInteractionModal);
    }

    function blessTribe(tribe) {
        // This will be implemented in simulation.js
        console.log(`Blessing tribe ${tribe.id}`);
    }

    function curseTribe(tribe) {
        // This will be implemented in simulation.js
        console.log(`Cursing tribe ${tribe.id}`);
    }

    // NEW: Victory/Failure Modals
    refs.victoryRestartBtn.addEventListener('click', () => {
        hideModal(refs.victoryModal);
        resetSimulation(currentScenario ? currentScenario.id : null); // Restart current scenario or default sandbox
    });

    refs.victoryMainMenuBtn.addEventListener('click', () => {
        hideModal(refs.victoryModal);
        window.location.reload(); // Reload to go back to main menu/default sandbox
    });

    refs.failureRestartBtn.addEventListener('click', () => {
        hideModal(refs.failureModal);
        resetSimulation(currentScenario ? currentScenario.id : null); // Restart current scenario or default sandbox
    });

    refs.failureMainMenuBtn.addEventListener('click', () => {
        hideModal(refs.failureModal);
        window.location.reload(); // Reload to go back to main menu/default sandbox
    });

}

function populateAchievementsModal(achievementsListElement) {
    achievementsListElement.innerHTML = ''; // Clear previous list
    const achievements = getAchievements();
    for (const key in achievements) {
        const achievement = achievements[key];
        const achievementDiv = document.createElement('div');
        achievementDiv.classList.add('achievement-item');
        if (achievement.unlocked) {
            achievementDiv.classList.add('unlocked');
        }

        achievementDiv.innerHTML = `
            <h3>${achievement.name} ${achievement.unlocked ? '✅' : '🔒'}</h3>
            <p>${achievement.description}</p>
            ${achievement.criteria ? `<p class="progress">Progresso: ${getAchievementProgressText(achievement)}</p>` : ''}
        `;
        achievementsListElement.appendChild(achievementDiv);
    }
}

function populateTechTreeModal(techTreeListElement) {
    techTreeListElement.innerHTML = ''; // Clear previous list
    const techs = getTechnologies();
    const unlocked = getUnlockedTechnologies();
    const currentMinerals = { iron: 100, silicon: 100, carbon: 100 }; // Placeholder: get actual mineral counts

    for (const techId in techs) {
        const tech = techs[techId];
        const techDiv = document.createElement('div');
        techDiv.classList.add('tech-item');
        if (tech.unlocked) {
            techDiv.classList.add('unlocked');
        }

        let costHtml = '';
        for (const mineral in tech.cost) {
            costHtml += `<span class="mineral-cost">${tech.cost[mineral]} ${mineral}</span>`;
        }

        let prereqHtml = '';
        if (tech.prerequisites.length > 0) {
            prereqHtml = '<p class="prerequisites">Requisitos: ';
            tech.prerequisites.forEach(prereqId => {
                prereqHtml += `<span class="prereq-item ${unlocked[prereqId] ? 'unlocked' : 'locked'}">${techs[prereqId].name}</span>`;
            });
            prereqHtml += '</p>';
        }

        techDiv.innerHTML = `
            <h3>${tech.name} ${tech.unlocked ? '✅' : '🔒'}</h3>
            <p>${tech.description}</p>
            <p class="cost">Custo: ${costHtml}</p>
            ${prereqHtml}
            <button class="unlock-tech-btn" data-tech-id="${techId}" ${tech.unlocked ? 'disabled' : ''}>Desbloquear</button>
        `;
        techTreeListElement.appendChild(techDiv);
    }

    // Add event listeners to unlock buttons
    techTreeListElement.querySelectorAll('.unlock-tech-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const techId = event.target.dataset.techId;
            // Need to pass actual current minerals here
            if (unlockTechnology(techId, currentMinerals)) {
                populateTechTreeModal(techTreeListElement); // Re-populate to update state
            }
        });
    });
}

function populateHistoryModal(historyLogElement) {
    historyLogElement.innerHTML = ''; // Clear previous content
    const logHistory = getLogHistory();
    logHistory.forEach(logEntry => {
        const p = document.createElement('p');
        p.textContent = logEntry;
        historyLogElement.appendChild(p);
    });
    historyLogElement.scrollTop = historyLogElement.scrollHeight; // Scroll to bottom
}

function getAchievementProgressText(achievement) {
    switch (achievement.id) {
        case 'first_plant':
            return `${achievement.criteria.plantsCreated}/1`;
        case 'ecosystem_builder':
            return `${achievement.criteria.totalElementsCreated}/100`;
        case 'stable_ecosystem':
            return `${achievement.criteria.stableCycles}/${achievement.criteria.requiredStableCycles} ciclos estáveis`;
        case 'survivalist':
            return `${achievement.criteria.simulationCycles}/${achievement.criteria.requiredCycles} ciclos`;
        default:
            return '';
    }
}

function populateScenariosModal(scenariosListElement) {
    scenariosListElement.innerHTML = ''; // Clear previous list
    scenarios.forEach(scenario => {
        const scenarioDiv = document.createElement('div');
        scenarioDiv.classList.add('scenario-item');
        scenarioDiv.innerHTML = `
            <h3>${scenario.name}</h3>
            <p>${scenario.description}</p>
            <button class="start-scenario-btn" data-scenario-id="${scenario.id}">Iniciar Cenário</button>
        `;
        scenariosListElement.appendChild(scenarioDiv);
    });

    scenariosListElement.querySelectorAll('.start-scenario-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const scenarioId = event.target.dataset.scenarioId;
            hideModal(refs.scenariosModal);
            currentScenario = getScenarioById(scenarioId); // Set the global currentScenario
            resetSimulation(scenarioId); // Pass scenarioId to resetSimulation
        });
    });
}

let currentWeatherSpan; // Declare a variable to hold the span reference

export function updateWeatherDisplay(weather) {
    if (currentWeatherSpan && weather) {
        const weatherName = weather.name || (weather.type ? weather.type.charAt(0).toUpperCase() + weather.type.slice(1) : 'Unknown');
        const weatherEmoji = weather.emoji || '☁️';
        currentWeatherSpan.textContent = `${weatherEmoji} ${weatherName}`;
        
        // Add weather intensity indicator for extreme weather
        if (weather.isExtreme) {
            currentWeatherSpan.style.color = '#ff4444';
            currentWeatherSpan.style.fontWeight = 'bold';
        } else {
            currentWeatherSpan.style.color = '';
            currentWeatherSpan.style.fontWeight = '';
        }
    }
}

// Time of day display with appropriate emoji
let currentTimeOfDaySpan;

export function updateTimeOfDayDisplay(data) {
    if (!currentTimeOfDaySpan) {
        currentTimeOfDaySpan = document.getElementById('current-time-of-day');
        if (!currentTimeOfDaySpan) return;
    }
    
    // Get emoji based on time of day
    let emoji = '';
    switch (data.timeOfDay) {
        case 'dawn':
            emoji = '🌅'; // Sunrise
            break;
        case 'day':
            emoji = '☀️'; // Sun
            break;
        case 'dusk':
            emoji = '🌇'; // Sunset
            break;
        case 'night':
            emoji = '🌙'; // Moon
            break;
        default:
            emoji = '⏱️'; // Clock as fallback
    }
    
    // Update the display
    currentTimeOfDaySpan.textContent = `${emoji} ${data.timeOfDay.charAt(0).toUpperCase() + data.timeOfDay.slice(1)}`;
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired.');
    initializeApp();
    // Assign the span reference after initUIDomReferences is called
    currentWeatherSpan = document.getElementById('current-weather');
});