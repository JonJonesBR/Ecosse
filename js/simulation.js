import { elementClasses, logToObserver, ecosystemSizes, showMessage, EcosystemElement } from './utils.js';
import { askGeminiForElementInsight, askGeminiForEcosystemAnalysis } from './geminiApi.js';
import { askGeminiForNarrativeEvent } from './geminiApi.js'; // NEW IMPORT
import { getActiveTechnologyEffects } from './techTree.js'; // NEW IMPORT
import { updateElements3D, convert3DTo2DCoordinates, get3DIntersectionPoint } from './planetRenderer.js';
import { trackElementCreated, trackSimulationCycle, checkStabilityAchievement, resetAchievementProgress, trackInteraction, trackReproduction, trackWeatherEvent } from './achievements.js'; // NEW IMPORT
import { getPlayerEnergy, spendEnergy, addEnergy, performIntervention, canAffordIntervention, regenerateEnergy, addResource, generateEventResources } from './energySystem.js'; // NEW IMPORT
import { updateWeatherDisplay } from './main.js'; // NEW IMPORT
import { playSFX } from './audioManager.js'; // NEW IMPORT
import { getScenarioById } from './scenarios.js'; // NEW IMPORT
import { publish, subscribe, EventTypes } from './systems/eventSystem.js'; // NEW: Event system
import { info, warning, error } from './systems/loggingSystem.js'; // NEW: Enhanced logging
import { initFoodWebSystem, updatePopulationCounts } from './systems/foodWebSystem.js'; // NEW: Food web system
import { weatherSystem } from './systems/weatherSystem.js'; // NEW: Enhanced weather system
import { socialBehaviorSystem } from './systems/socialBehaviorSystem.js'; // NEW: Social behavior system
import { specialEventsSystem } from './systems/specialEventsSystem.js'; // NEW: Special events system
import { seasonalEventsSystem } from './systems/seasonalEventsSystem.js'; // NEW: Seasonal events system

// Variáveis de estado do módulo
let ecosystemElements = [];
let simulationConfig = {};
let simulationInterval;
let isSimulationRunning = false;
let isTimeLapseActive = false;
let placingElement = null;
let elementMultiplier = 1;
let currentMouse3DPoint = null;
let currentUseGemini = false; // New state variable
let currentGeminiApiKey = ""; // New state variable
let currentWeather = { type: 'sunny', emoji: '☀️', effect: 1.0 }; // NEW: Current weather state
// Player energy is now managed by energySystem.js
let annualCycleTime = 0; // NEW: Tracks progress through the year (0 to 1)
let currentSeason = 'spring'; // NEW: Current season
let simulationCycles = 0; // NEW: Track simulation cycles for scenarios
let currentScenario = null; // NEW: Stores the active scenario

// Referências da UI
let ecosystemStabilitySpan, ecosystemBiodiversitySpan, ecosystemResourcesSpan, geminiInsightsDiv, playerEnergyDisplaySpan, currentSeasonDisplaySpan, activeEventsListDiv;
let showModalFn, hideModalFn; // NEW: Store modal functions

export function initSimulationUIReferences(stability, biodiversity, resources, insights, playerEnergyDisplay, seasonDisplay, showModalCallback, hideModalCallback) {
    ecosystemStabilitySpan = stability;
    ecosystemBiodiversitySpan = biodiversity;
    ecosystemResourcesSpan = resources;
    geminiInsightsDiv = insights;
    playerEnergyDisplaySpan = playerEnergyDisplay;
    currentSeasonDisplaySpan = seasonDisplay;
    activeEventsListDiv = document.getElementById('active-events-list');
    showModalFn = showModalCallback; // Store the callback
    hideModalFn = hideModalCallback; // Store the callback
    updatePlayerEnergyDisplay();
    updateSeasonDisplay();
    updateActiveEventsDisplay();
}

function updateSeasonDisplay() {
    if (currentSeasonDisplaySpan) {
        currentSeasonDisplaySpan.textContent = currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1);
    }
}

function updateActiveEventsDisplay() {
    if (!activeEventsListDiv) return;
    
    const activeEvents = specialEventsSystem.getActiveEvents();
    const activeSeasonalEvents = seasonalEventsSystem.getActiveSeasonalEvents();
    const allEvents = [...activeEvents, ...activeSeasonalEvents];
    
    if (allEvents.length === 0) {
        activeEventsListDiv.innerHTML = '<p class="italic">Nenhum evento ativo</p>';
        return;
    }
    
    let eventsHtml = '';
    allEvents.forEach(event => {
        const remainingTime = Math.ceil(event.remainingDuration / 10); // Convert to seconds (assuming 100ms per cycle)
        const progressPercent = ((event.duration - event.remainingDuration) / event.duration) * 100;
        
        // Different border colors for different event types
        const borderColor = event.season ? 'border-green-500' : 'border-yellow-500';
        const eventType = event.season ? `(${event.season})` : '(especial)';
        
        eventsHtml += `
            <div class="active-event-item mb-2 p-2 bg-gray-800 rounded border-l-4 ${borderColor}">
                <div class="flex justify-between items-center">
                    <span class="font-semibold">${event.emoji} ${event.name}</span>
                    <span class="text-xs text-gray-400">${remainingTime}s</span>
                </div>
                <p class="text-xs text-gray-300 mt-1">${event.description}</p>
                <p class="text-xs text-gray-500 mt-1">${eventType}</p>
                <div class="w-full bg-gray-700 rounded-full h-1 mt-2">
                    <div class="${event.season ? 'bg-green-500' : 'bg-yellow-500'} h-1 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
    });
    
    activeEventsListDiv.innerHTML = eventsHtml;
}

// Funções de Get/Set para o estado
export function setSimulationConfig(config) { simulationConfig = config; }
export function getSimulationConfig() { return simulationConfig; }
export function setEcosystemElements(elements) { ecosystemElements = elements; }
export function getEcosystemElements() { return ecosystemElements; }
export function setPlacingElement(element) { placingElement = element; }
export function setElementMultiplier(multiplier) { elementMultiplier = multiplier; }
export function setCurrentMouse3DPoint(point) { 
    currentMouse3DPoint = point;
    drawEcosystem(); // Redesenha para mostrar o fantasma na nova posição
}

// Função para desenhar o estado atual na cena 3D
export function drawEcosystem() {
    updateElements3D(ecosystemElements, simulationConfig, currentMouse3DPoint, placingElement);
}

// O loop principal da simulação
function updateSimulation(useGemini, geminiApiKey) {
    if (!isSimulationRunning) return;

    trackSimulationCycle(); // NEW: Track simulation cycles

    const activeTechEffects = getActiveTechnologyEffects(); // Get active technology effects

    // NEW: Enhanced Weather System with Seasonal Cycles and Extreme Events
    const weatherEffects = weatherSystem.update(simulationConfig, ecosystemElements);
    
    // Update current season and weather from weather system
    if (weatherEffects.season !== currentSeason) {
        currentSeason = weatherEffects.season;
        logToObserver(`A estação mudou para: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`);
        showMessage(`A estação mudou para: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`);
        updateSeasonDisplay();
    }
    
    // Update current weather if it changed
    if (weatherEffects.weather.type !== currentWeather.type) {
        currentWeather = weatherEffects.weather;
        logToObserver(`O clima mudou para: ${currentWeather.emoji} ${currentWeather.name}`);
        updateWeatherDisplay(currentWeather);
        playSFX('weatherChange');
    }

    // Apply weather effects to simulation config
    const effectiveSimulationConfig = {
        ...simulationConfig,
        temperature: weatherEffects.effectiveTemperature,
        waterPresence: weatherEffects.effectiveHumidity
    };

    const simulationState = {
        config: effectiveSimulationConfig, // Use effective config here
        elements: ecosystemElements,
        newElements: [],
        canvasWidth: ecosystemSizes[simulationConfig.ecosystemSize].width,
        canvasHeight: ecosystemSizes[simulationConfig.ecosystemSize].height,
        seasonalGrowthEffect: weatherEffects.seasonalGrowthEffect, // Pass seasonal growth effect from weather system
        weatherEffects: weatherEffects, // Pass all weather effects
    };

    // Atualiza cada elemento
    let hasChanges = false;
    if (simulationState.newElements.length > 0) hasChanges = true;

    const originalLength = ecosystemElements.length;
    ecosystemElements.forEach(element => {
        const healthBefore = element.health;
        element.update(simulationState, simulationConfig, currentWeather, activeTechEffects, weatherEffects); // Pass weather effects
        if(element.health !== healthBefore) hasChanges = true;
    });
    
    // Adiciona novos elementos e remove os mortos
    if (simulationState.newElements.length > 0) {
        // Publish events for each new element
        simulationState.newElements.forEach(element => {
            publish(EventTypes.ELEMENT_CREATED, {
                element: element, // Include full element for spatial audio
                id: element.id,
                type: element.type,
                x: element.x,
                y: element.y,
                emoji: element.emoji,
                size: element.size
            });
        });
        
        ecosystemElements.push(...simulationState.newElements);
        hasChanges = true;
    }
    
    const newLength = ecosystemElements.length;
    
    // Track elements that will be removed
    const elementsToRemove = ecosystemElements.filter(el => el.health <= 0);
    
    // Publish events for each removed element
    elementsToRemove.forEach(element => {
        publish(EventTypes.ELEMENT_REMOVED, {
            element: element, // Include full element for spatial audio
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            emoji: element.emoji,
            cause: 'health_depleted'
        });
    });
    
    ecosystemElements = ecosystemElements.filter(el => el.health > 0);
    if(newLength !== ecosystemElements.length) hasChanges = true;
    
    // Check for Creature Evolution to Tribe
    const creatures = ecosystemElements.filter(el => el.type === 'creature');
    const evolutionThreshold = 10; // Minimum creatures in a cluster to evolve
    const evolutionRadius = 100; // Max distance for creatures to be considered in a cluster

    const visitedCreatures = new Set();
    for (const creature of creatures) {
        if (visitedCreatures.has(creature.id)) continue;

        const nearbyCreatures = creatures.filter(c =>
            !visitedCreatures.has(c.id) && Math.hypot(creature.x - c.x, creature.y - c.y) < evolutionRadius
        );

        if (nearbyCreatures.length >= evolutionThreshold) {
            // Calculate average position of the cluster
            const avgX = nearbyCreatures.reduce((sum, c) => sum + c.x, 0) / nearbyCreatures.length;
            const avgY = nearbyCreatures.reduce((sum, c) => sum + c.y, 0) / nearbyCreatures.length;

            // Check for resource availability (e.g., nearby plants)
            const nearbyPlants = ecosystemElements.filter(el =>
                el.type === 'plant' && Math.hypot(avgX - el.x, avgY - el.y) < evolutionRadius * 1.5
            );
            if (nearbyPlants.length > evolutionThreshold / 2) { // Enough plants to sustain a tribe
                // Evolve to Tribe
                logToObserver(`Um grupo de ${nearbyCreatures.length} criaturas evoluiu para uma tribo inteligente em ${avgX.toFixed(0)},${avgY.toFixed(0)}!`);
                showMessage(`Uma nova tribo inteligente surgiu!`, 'success');
                playSFX('tribeEvolution'); // Play SFX for tribe evolution

                // Remove evolved creatures
                ecosystemElements = ecosystemElements.filter(el => !nearbyCreatures.some(nc => nc.id === el.id));

                // Add new TribeElement
                simulationState.newElements.push(new elementClasses.tribe(Date.now() + Math.random(), avgX, avgY, nearbyCreatures.length));
                hasChanges = true;

                // Mark creatures as visited so they don't form multiple tribes
                nearbyCreatures.forEach(c => visitedCreatures.add(c.id));
            }
        }
    }
    
    // Update population counts for food web system
    if(hasChanges) {
        updatePopulationCounts(ecosystemElements);
    }
    
    // Update social behavior system
    socialBehaviorSystem.update(ecosystemElements);
    
    // Update special events system
    specialEventsSystem.update(simulationState, simulationConfig, currentWeather);
    
    // Update seasonal events system
    seasonalEventsSystem.update(currentSeason, simulationConfig.planetType, simulationState);
    
    // Update active events display
    updateActiveEventsDisplay();
    
    // Redesenha a cena e atualiza a UI se houver mudanças
    if(hasChanges) {
        drawEcosystem();
        updateSimulationInfo();
        checkStabilityAchievement(parseFloat(ecosystemStabilitySpan.textContent)); // NEW: Check stability achievement
    }
    
    // Regenerate energy every simulation cycle
    regenerateEnergy();
    
    // Generate resources from rare events
    if (weatherEffects && weatherEffects.weather && weatherEffects.weather.isExtreme) {
        generateEventResources(weatherEffects.weather.type, weatherEffects.weather.intensity || 1);
        trackWeatherEvent('extreme');
    }

    // Interação opcional com a IA
    if (useGemini && geminiApiKey && Math.random() < 0.01) {
        // 30% chance of using comprehensive analysis, 70% basic analysis
        if (Math.random() < 0.3) {
            import('./geminiApi.js').then(module => {
                module.askGeminiForComprehensiveAnalysis(simulationConfig, ecosystemElements, geminiApiKey, geminiInsightsDiv, logToObserver);
            });
        } else {
            askGeminiForEcosystemAnalysis(simulationConfig, ecosystemElements, geminiApiKey, geminiInsightsDiv, logToObserver);
        }
    }

    // Trigger narrative event with low probability
    if (useGemini && geminiApiKey && Math.random() < 0.001) { // 0.1% chance per tick
        askGeminiForNarrativeEvent(simulationConfig, ecosystemElements, geminiApiKey, logToObserver);
    }

    // NEW: Check scenario conditions
    if (currentScenario) {
        checkScenarioConditions();
    }
}

function checkScenarioConditions() {
    if (!currentScenario) return;

    const currentCreatureCount = ecosystemElements.filter(el => el.type === 'creature').length;

    // Check Victory Conditions
    for (const condition of currentScenario.victoryConditions) {
        let conditionMet = false;
        switch (condition.type) {
            case 'population':
                if (condition.element_type === 'creature') {
                    if (condition.operator === '>=' && currentCreatureCount >= condition.target) {
                        conditionMet = true;
                    }
                }
                break;
            case 'cycles':
                if (condition.operator === '>=' && simulationCycles >= condition.target) {
                    conditionMet = true;
                }
                break;
            // Add more condition types here (e.g., 'techUnlocked', 'resourceAmount')
        }

        if (conditionMet) {
            displayVictory(currentScenario.name);
            currentScenario = null; // End scenario
            return;
        }
    }

    // Check Failure Conditions
    for (const condition of currentScenario.failureConditions) {
        let conditionMet = false;
        switch (condition.type) {
            case 'population':
                if (condition.element_type === 'creature') {
                    if (condition.operator === '<=' && currentCreatureCount <= condition.target) {
                        conditionMet = true;
                    }
                }
                break;
            // Add more failure condition types here
        }

        if (conditionMet) {
            displayFailure(currentScenario.name);
            currentScenario = null; // End scenario
            return;
        }
    }
}

function displayVictory(scenarioName) {
    pauseSimulationLoop();
    const victoryModal = document.getElementById('victory-modal');
    const victoryTitle = document.getElementById('victory-title');
    const victoryMessage = document.getElementById('victory-message');

    if (victoryTitle) victoryTitle.textContent = `Vitória! Cenário: ${scenarioName}`;
    if (victoryMessage) victoryMessage.textContent = `Você completou o cenário "${scenarioName}" com sucesso!`;
    if (showModalFn && victoryModal) showModalFn(victoryModal);
    logToObserver(`Cenário ${scenarioName} concluído com sucesso!`);
}

function displayFailure(scenarioName) {
    pauseSimulationLoop();
    const failureModal = document.getElementById('failure-modal');
    const failureTitle = document.getElementById('failure-title');
    const failureMessage = document.getElementById('failure-message');

    if (failureTitle) failureTitle.textContent = `Derrota! Cenário: ${scenarioName}`;
    if (failureMessage) failureMessage.textContent = `Você falhou em completar o cenário "${scenarioName}".`;
    if (showModalFn && failureModal) showModalFn(failureModal);
    logToObserver(`Cenário ${scenarioName} falhou.`);
}

export function startSimulationLoop(useGemini, geminiApiKey) {
    if (isSimulationRunning) return;
    isSimulationRunning = true;
    currentUseGemini = useGemini; // Store the value
    currentGeminiApiKey = geminiApiKey; // Store the value
    clearInterval(simulationInterval); // Limpa qualquer intervalo anterior
    const intervalTime = isTimeLapseActive ? 50 : 100; // Faster for time-lapse
    simulationInterval = setInterval(() => updateSimulation(useGemini, geminiApiKey), intervalTime);
    logToObserver("Simulação iniciada." + (isTimeLapseActive ? " (Lapso de tempo ativo)" : ""));
}

export function pauseSimulationLoop() {
    isSimulationRunning = false;
    clearInterval(simulationInterval);
    logToObserver("Simulação pausada.");
}

export function addElementAtPoint(point3D, type, multiplier, useGemini, geminiApiKey) {
    // Prevent placing sun on the planet surface
    if (type === 'sun') {
        logToObserver("O Sol só pode ser colocado no espaço sideral.");
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification({
                type: 'warning',
                title: 'Posicionamento Inválido',
                message: 'O Sol só pode ser colocado no espaço sideral.',
                duration: 3000
            });
        }
        return false;
    }

    // Check energy cost for creating elements
    const totalCost = multiplier * 10; // 10 energy per element
    if (!canAffordIntervention('create_element') || !performIntervention('create_element', totalCost)) {
        return false;
    }

    const { x, y } = convert3DTo2DCoordinates(point3D, simulationConfig);
    const ElementClass = elementClasses[type];
    if (!ElementClass) {
        logToObserver(`Tipo de elemento desconhecido: ${type}`);
        return false;
    }

    logToObserver(`Adicionando ${multiplier}x ${type}...`);
    try {
        for (let i = 0; i < multiplier; i++) {
            const newX = x + (Math.random() - 0.5) * 50; // Adiciona um pouco de dispersão
            const newY = y + (Math.random() - 0.5) * 50;
            const id = Date.now() + Math.random();
            let newElement;
            // Verifica se é uma classe (tem protótipo) ou uma função fábrica (arrow function, sem protótipo)
            if (ElementClass.prototype) {
                newElement = new ElementClass(id, newX, newY);
            } else {
                newElement = ElementClass(id, newX, newY);
            }
            ecosystemElements.push(newElement);
            trackElementCreated(type, { elements: ecosystemElements }); // NEW: Track element creation with ecosystem context
            playSFX('elementPlace'); // Play SFX for placing an element
        }
        drawEcosystem(); // Redesenha para mostrar o novo elemento
        
        if (useGemini && geminiApiKey) {
            askGeminiForElementInsight(type, simulationConfig, geminiApiKey, logToObserver);
        }
        
        return true;
    } catch (error) {
        logToObserver(`Erro ao adicionar elemento: ${error.message}`);
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification({
                type: 'error',
                title: 'Erro na Colocação',
                message: 'Não foi possível colocar o elemento.',
                duration: 3000
            });
        }
        return false;
    }
}

export function removeElementAtPoint(point3D) {
    const elementToRemove = getElementAtPoint3D(point3D);
    if (elementToRemove) {
        // Check energy cost for removing elements
        if (!performIntervention('remove_element')) {
            return false;
        }
        
        ecosystemElements = ecosystemElements.filter(el => el.id !== elementToRemove.id);
        logToObserver(`Elemento ${elementToRemove.type} removido.`);
        drawEcosystem(); // Redesenha para remover o elemento
        playSFX('elementRemove'); // Play SFX for removing an element
        return elementToRemove;
    }
    return null;
}

export function getElementAtPoint3D(point3D) {
    if (!point3D || !simulationConfig.ecosystemSize) return null;
    const { x, y } = convert3DTo2DCoordinates(point3D, simulationConfig);
    // Encontra o elemento mais próximo no espaço 2D mapeado
    let closestElement = null;
    let minDistance = Infinity;
    for (const el of ecosystemElements) {
        const distance = Math.hypot(el.x - x, el.y - y);
        if (distance < el.size && distance < minDistance) {
            minDistance = distance;
            closestElement = el;
        }
    }
    return closestElement;
}

export function resetSimulation(scenarioId = null) {
    pauseSimulationLoop();
    ecosystemElements = [];
    simulationCycles = 0; // Reset simulation cycles

    if (scenarioId) {
        currentScenario = getScenarioById(scenarioId);
        if (currentScenario) {
            setSimulationConfig(currentScenario.initialConfig);
            // Deep copy initialElements to avoid modifying the scenario definition
            setEcosystemElements(currentScenario.initialElements.map(el => ({ ...el })));
            logToObserver(`Cenário "${currentScenario.name}" iniciado.`);
            showMessage(`Cenário: ${currentScenario.name}`, 'info');
        } else {
            logToObserver(`Cenário com ID ${scenarioId} não encontrado. Iniciando sandbox padrão.`);
            currentScenario = null; // Fallback to default sandbox
            const currentConfig = getSimulationConfig(); // Get current config if no scenario
            updatePlanetAppearance(currentConfig);
        }
    } else {
        currentScenario = null; // No active scenario
        const currentConfig = getSimulationConfig(); // Get current config if no scenario
        updatePlanetAppearance(currentConfig);
    }

    // Initialize food web system with current elements
    initFoodWebSystem(ecosystemElements);

    drawEcosystem();
    updateSimulationInfo();
    resetAchievementProgress(); // NEW: Reset achievement progress on simulation reset
    logToObserver("Simulação reiniciada por completo.");
}

function updateSimulationInfo() {
    if (!ecosystemStabilitySpan) return; // Se a UI não estiver pronta, não faz nada

    const totalHealth = ecosystemElements.reduce((sum, el) => sum + el.health, 0);
    const maxHealth = ecosystemElements.length * 100;
    const stability = maxHealth > 0 ? (totalHealth / maxHealth) * 100 : 100;
    const uniqueTypes = new Set(ecosystemElements.map(el => el.type)).size;

    ecosystemStabilitySpan.textContent = `${stability.toFixed(0)}%`;
    ecosystemBiodiversitySpan.textContent = `${uniqueTypes} tipos`;
    ecosystemResourcesSpan.textContent = `${simulationConfig.waterPresence || 0}% Água`;
}

export function toggleTimeLapse() {
    isTimeLapseActive = !isTimeLapseActive;
    if (isSimulationRunning) {
        // If simulation is running, restart it with the new speed
        pauseSimulationLoop();
        startSimulationLoop(currentUseGemini, currentGeminiApiKey); // Use stored values
    }
    logToObserver("Lapso de tempo " + (isTimeLapseActive ? "ativado." : "desativado."));
    showMessage("Lapso de tempo " + (isTimeLapseActive ? "ativado." : "desativado."));
}

export function handleCanvasInteraction(event, isClick, useGemini, geminiApiKey, showDetailsCallback, showTribeInteractionCallback, canvas) {
    const point3D = get3DIntersectionPoint(event, canvas);

    if (isClick) {
        if (point3D) {
            // Convert 3D point to screen coordinates for visual indicators
            const rect = canvas.getBoundingClientRect();
            const screenX = rect.left + (event.clientX - rect.left);
            const screenY = rect.top + (event.clientY - rect.top);

            if (placingElement === 'eraser') {
                const removed = removeElementAtPoint(point3D);
                
                // Show visual feedback for removal
                if (window.visualIndicators) {
                    if (removed) {
                        window.visualIndicators.showActionFeedback(screenX, screenY, 'damage');
                        window.feedbackSystem?.showNotification({
                            type: 'info',
                            title: 'Elemento Removido',
                            message: `${removed.type} foi removido do ecossistema`,
                            duration: 2000
                        });
                    } else {
                        window.visualIndicators.showPlacementResult(screenX, screenY, false, 'eraser');
                    }
                }
            } else if (placingElement) {
                const success = addElementAtPoint(point3D, placingElement, elementMultiplier, useGemini, geminiApiKey);
                
                // Show visual feedback for placement
                if (window.visualIndicators) {
                    window.visualIndicators.showPlacementResult(screenX, screenY, success, placingElement);
                    
                    if (success && window.feedbackSystem) {
                        const count = elementMultiplier > 1 ? ` (${elementMultiplier}x)` : '';
                        window.feedbackSystem.showActionFeedback(
                            `${placingElement} colocado${count}`, 
                            true, 
                            'Elemento adicionado ao ecossistema'
                        );
                    }
                }
            } else {
                // Se nenhum elemento estiver selecionado, talvez inspecionar o elemento existente
                const elementAtPoint = getElementAtPoint3D(point3D);
                if (elementAtPoint) {
                    // Show selection indicator
                    if (window.visualIndicators) {
                        window.visualIndicators.showSelectionIndicator(screenX, screenY, 40, 40);
                    }
                    
                    // Publish element interaction event for spatial audio
                    publish(EventTypes.ELEMENT_INTERACTION, {
                        element: elementAtPoint,
                        interactionType: 'click',
                        x: elementAtPoint.x,
                        y: elementAtPoint.y
                    });
                    
                    if (elementAtPoint.type === 'tribe') {
                        if (showTribeInteractionCallback) {
                            showTribeInteractionCallback(elementAtPoint);
                        }
                    } else if (showDetailsCallback) {
                        showDetailsCallback(elementAtPoint);
                    } else {
                        logToObserver(`Clicou em ${elementAtPoint.type} (ID: ${elementAtPoint.id.toFixed(0)})`);
                    }
                }
            }
        }
    } else { // Mouse move
        setCurrentMouse3DPoint(point3D);
        
        // Show placement preview if placing element
        if (point3D && placingElement && placingElement !== 'eraser') {
            const rect = canvas.getBoundingClientRect();
            const screenX = rect.left + (event.clientX - rect.left);
            const screenY = rect.top + (event.clientY - rect.top);
            
            if (window.visualIndicators) {
                window.visualIndicators.showPlacementPreview(screenX, screenY, placingElement);
            }
        } else if (window.visualIndicators) {
            window.visualIndicators.removePlacementPreview();
        }
        
        // Show hover indicator for existing elements
        if (point3D) {
            const elementAtPoint = getElementAtPoint3D(point3D);
            if (elementAtPoint) {
                const rect = canvas.getBoundingClientRect();
                const screenX = rect.left + (event.clientX - rect.left);
                const screenY = rect.top + (event.clientY - rect.top);
                
                if (window.visualIndicators) {
                    window.visualIndicators.showHoverIndicator(screenX, screenY, 35, 35);
                }
            } else if (window.visualIndicators) {
                window.visualIndicators.removeHoverIndicator();
            }
        }
    }
}

function updatePlayerEnergyDisplay() {
    // Energy display is now handled by energySystem.js
    // This function is kept for compatibility but does nothing
}

export function blessTribe(tribe) {
    const cost = 10;
    if (performIntervention('divine_intervention', cost)) {
        tribe.reproductionChance *= 2; // Temporarily double reproduction chance
        tribe.resourceCollectionRate *= 2; // Temporarily double resource collection
        logToObserver(`Tribo ${tribe.id.toFixed(0)} abençoada! Taxa de reprodução e coleta dobradas.`);
        showMessage(`Tribo ${tribe.id.toFixed(0)} abençoada!`, 'success');
        playSFX('bless'); // Play SFX for blessing
        
        // Add special resource as reward for blessing
        addResource('harmony_crystals', 1, 'bênção tribal');
        
        // Revert effect after some time (e.g., 10 simulation cycles)
        setTimeout(() => {
            tribe.reproductionChance /= 2;
            tribe.resourceCollectionRate /= 2;
            logToObserver(`Efeito da bênção na tribo ${tribe.id.toFixed(0)} terminou.`);
        }, 10 * 100); // Assuming 100ms per cycle
    }
}

export function curseTribe(tribe) {
    const cost = 15;
    if (performIntervention('divine_intervention', cost)) {
        tribe.health *= 0.5; // Reduce health by half
        logToObserver(`Tribo ${tribe.id.toFixed(0)} amaldiçoada! Saúde reduzida e desastre localizado.`);
        showMessage(`Tribo ${tribe.id.toFixed(0)} amaldiçoada!`, 'error');
        playSFX('curse'); // Play SFX for cursing
        
        // Add dark resource as consequence of cursing
        addResource('storm_essence', 1, 'maldição tribal');
        
        // Potentially add a localized disaster effect here (e.g., remove nearby plants)
        ecosystemElements = ecosystemElements.filter(el => 
            !(el.type === 'plant' && Math.hypot(tribe.x - el.x, tribe.y - el.y) < 100) // Remove plants within 100 units
        );
        drawEcosystem();
    }
}
