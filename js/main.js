import { initUIDomReferences, showMessage, hideMessageBox, logToObserver, showModal, hideModal } from './utils.js';
import { init3DScene, updatePlanetAppearance, get3DIntersectionPoint, getCameraState, setCameraState, resetCamera } from './planetRenderer.js';
import { initSimulationUIReferences, setSimulationConfig, setEcosystemElements, getEcosystemElements, getSimulationConfig, drawEcosystem, startSimulationLoop, pauseSimulationLoop, toggleTimeLapse, setPlacingElement, setElementMultiplier, setCurrentMouse3DPoint, addElementAtPoint, removeElementAtPoint, getElementAtPoint3D, resetSimulation, handleCanvasInteraction, blessTribe, curseTribe } from './simulation.js';
import { saveSimulation, loadSimulation, generateSeed, loadSimulationFromSeed } from './persistence.js';
import { setupConfigPanelListeners, getCurrentConfig, populateConfigForm } from './config.js';
import { askGeminiForEcosystemAnalysis, askGeminiForPlanetStory } from './geminiApi.js';
import { getAchievements } from './achievements.js'; // NEW IMPORT
import { getTechnologies, unlockTechnology, getUnlockedTechnologies } from './techTree.js'; // NEW IMPORT
import { loadAudio, playBackgroundMusic, pauseBackgroundMusic, playSFX } from './audioManager.js'; // NEW IMPORT
import { scenarios, getScenarioById } from './scenarios.js'; // NEW IMPORT

let leftPanel, rightPanel;
let useGemini = true;
let geminiApiKey = "";
let currentScenario = null; // NEW: Global variable to store the active scenario

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
        'gemini-api-close-btn', 'gemini-api-key-input', 'save-gemini-key-btn',
        'achievements-btn', 'achievements-modal', 'achievements-close-btn', 'achievements-list',
        'current-weather', 'current-season-display', // NEW ID
        'tech-tree-btn', 'tech-tree-modal', 'tech-tree-close-btn', 'tech-tree-list',
        'history-btn', 'history-modal', 'history-close-btn', 'history-log', // NEW IDs
        'scenarios-btn', 'scenarios-modal', 'scenarios-close-btn', 'scenarios-list', // NEW Scenario IDs
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

    const canvas = init3DScene(refs.threeJsCanvasContainer, initialConfig);
    if (loadedCameraState) setCameraState(loadedCameraState); else resetCamera(initialConfig);
    
    drawEcosystem();
    loadAudio(); // Load all audio files
    startSimulationLoop(useGemini, geminiApiKey);
    playBackgroundMusic(); // Start background music
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

        if (element.type === 'creature' && element.geneSpeed !== undefined) {
            contentHtml += `<p><strong>Genes:</strong></p><ul>
                               <li>Velocidade: ${element.geneSpeed.toFixed(2)}</li>
                               <li>Tamanho: ${element.geneSize.toFixed(2)}</li>
                               <li>Reprodução: ${(element.geneReproductionChance * 100).toFixed(3)}%</li>
                           </ul>`;
        }

        refs.elementDetailContent.innerHTML = contentHtml;
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
    if (currentWeatherSpan) {
        currentWeatherSpan.textContent = `${weather.emoji} ${weather.type.charAt(0).toUpperCase() + weather.type.slice(1)}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired.');
    initializeApp();
    // Assign the span reference after initUIDomReferences is called
    currentWeatherSpan = document.getElementById('current-weather');
});