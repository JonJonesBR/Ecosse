import { elementClasses, logToObserver, ecosystemSizes, showMessage, EcosystemElement } from './utils.js';
import { askGeminiForElementInsight, askGeminiForEcosystemAnalysis } from './geminiApi.js';
import { askGeminiForNarrativeEvent } from './geminiApi.js'; // NEW IMPORT
import { getActiveTechnologyEffects } from './techTree.js'; // NEW IMPORT
import { updateElements3D, convert3DTo2DCoordinates, get3DIntersectionPoint } from './planetRenderer.js';
import { trackElementCreated, trackSimulationCycle, checkStabilityAchievement, resetAchievementProgress } from './achievements.js'; // NEW IMPORT
import { updateWeatherDisplay } from './main.js'; // NEW IMPORT
import { playSFX } from './audioManager.js'; // NEW IMPORT
import { getScenarioById } from './scenarios.js'; // NEW IMPORT

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
let playerEnergy = 100; // NEW: Player energy
let annualCycleTime = 0; // NEW: Tracks progress through the year (0 to 1)
let currentSeason = 'spring'; // NEW: Current season
let simulationCycles = 0; // NEW: Track simulation cycles for scenarios
let currentScenario = null; // NEW: Stores the active scenario

// Referências da UI
let ecosystemStabilitySpan, ecosystemBiodiversitySpan, ecosystemResourcesSpan, geminiInsightsDiv, playerEnergyDisplaySpan, currentSeasonDisplaySpan;
let showModalFn, hideModalFn; // NEW: Store modal functions

export function initSimulationUIReferences(stability, biodiversity, resources, insights, playerEnergyDisplay, seasonDisplay, showModalCallback, hideModalCallback) {
    ecosystemStabilitySpan = stability;
    ecosystemBiodiversitySpan = biodiversity;
    ecosystemResourcesSpan = resources;
    geminiInsightsDiv = insights;
    playerEnergyDisplaySpan = playerEnergyDisplay;
    currentSeasonDisplaySpan = seasonDisplay;
    showModalFn = showModalCallback; // Store the callback
    hideModalFn = hideModalCallback; // Store the callback
    updatePlayerEnergyDisplay();
    updateSeasonDisplay();
}

function updateSeasonDisplay() {
    if (currentSeasonDisplaySpan) {
        currentSeasonDisplaySpan.textContent = currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1);
    }
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

    // NEW: Annual Cycle and Seasons (more dynamic)
    annualCycleTime = (annualCycleTime + 0.0001) % 1; // Increment and loop from 0 to 1

    // Calculate seasonal temperature effect using a sine wave
    // Peaks in summer (annualCycleTime = 0.25) and troughs in winter (annualCycleTime = 0.75)
    const temperatureAmplitude = 20; // Max temperature variation (e.g., +/- 20 degrees from base)
    const seasonalTemperatureEffect = temperatureAmplitude * Math.sin(2 * Math.PI * (annualCycleTime - 0.25));

    // Calculate seasonal growth effect (e.g., plants grow more in spring/summer)
    const growthAmplitude = 0.5; // Max growth variation (e.g., +/- 0.5 from base 1.0)
    const seasonalGrowthEffect = 1.0 + growthAmplitude * Math.sin(2 * Math.PI * (annualCycleTime - 0.25));

    // Determine current season for display/logging
    let newSeason;
    if (annualCycleTime >= 0 && annualCycleTime < 0.25) {
        newSeason = 'spring';
    } else if (annualCycleTime >= 0.25 && annualCycleTime < 0.5) {
        newSeason = 'summer';
    } else if (annualCycleTime >= 0.5 && annualCycleTime < 0.75) {
        newSeason = 'autumn';
    } else {
        newSeason = 'winter';
    }

    if (newSeason !== currentSeason) {
        currentSeason = newSeason;
        logToObserver(`A estação mudou para: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`);
        showMessage(`A estação mudou para: ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}`);
    }

    // Apply seasonal effects to simulation config (or a temporary config for this tick)
    const effectiveSimulationConfig = {
        ...simulationConfig,
        temperature: simulationConfig.temperature + seasonalTemperatureEffect,
        // Luminosity is handled by the 3D renderer based on day/night cycle and base config
        // Water presence could also be influenced by seasons, e.g., more rain in spring/autumn
        waterPresence: simulationConfig.waterPresence + (currentSeason === 'spring' || currentSeason === 'autumn' ? 5 : currentSeason === 'winter' ? -10 : 0)
    };

    // Dynamic Weather Logic
    const weatherChangeChance = 0.005; // 0.5% chance per simulation tick
    if (Math.random() < weatherChangeChance) {
        const possibleWeather = [];

        // Sunny/Clear is always an option
        possibleWeather.push({ type: 'sunny', emoji: '☀️', effect: 1.0 });

        // Rain/Cloudy based on water presence and temperature
        if (effectiveSimulationConfig.waterPresence > 40 && effectiveSimulationConfig.temperature < 25) {
            possibleWeather.push({ type: 'rainy', emoji: '🌧️', effect: 0.8 }); // Plants thrive, creatures suffer
            possibleWeather.push({ type: 'cloudy', emoji: '☁️', effect: 0.9 }); // Reduced light
        }

        // Hot/Dry based on temperature and water presence
        if (effectiveSimulationConfig.temperature > 30 && effectiveSimulationConfig.waterPresence < 30) {
            possibleWeather.push({ type: 'dry', emoji: '🔥', effect: 1.2 }); // Increased decay for water/plants
        }

        // Cold/Snowy based on temperature
        if (effectiveSimulationConfig.temperature < 0) {
            possibleWeather.push({ type: 'snowy', emoji: '❄️', effect: 0.7 }); // Reduced growth, increased decay
        }

        // Choose a random weather from possible options
        const newWeather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];
        if (newWeather.type !== currentWeather.type) {
            currentWeather = newWeather;
            logToObserver(`O clima mudou para: ${currentWeather.emoji} ${currentWeather.type}`);
            updateWeatherDisplay(currentWeather); // Update UI for weather
            playSFX('weatherChange'); // Play SFX for weather change
        }
    }

    const simulationState = {
        config: effectiveSimulationConfig, // Use effective config here
        elements: ecosystemElements,
        newElements: [],
        canvasWidth: ecosystemSizes[simulationConfig.ecosystemSize].width,
        canvasHeight: ecosystemSizes[simulationConfig.ecosystemSize].height,
        seasonalGrowthEffect: seasonalGrowthEffect, // Pass seasonal growth effect
    };

    // Atualiza cada elemento
    let hasChanges = false;
    if (simulationState.newElements.length > 0) hasChanges = true;

    const originalLength = ecosystemElements.length;
    ecosystemElements.forEach(element => {
        const healthBefore = element.health;
        element.update(simulationState, simulationConfig, currentWeather, activeTechEffects); // Pass activeTechEffects
        if(element.health !== healthBefore) hasChanges = true;
    });
    
    // Adiciona novos elementos e remove os mortos
    if (simulationState.newElements.length > 0) {
        ecosystemElements.push(...simulationState.newElements);
        hasChanges = true;
    }
    const newLength = ecosystemElements.length;
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
    
    // Redesenha a cena e atualiza a UI se houver mudanças
    if(hasChanges) {
        drawEcosystem();
        updateSimulationInfo();
        checkStabilityAchievement(parseFloat(ecosystemStabilitySpan.textContent)); // NEW: Check stability achievement
    }

    // Interação opcional com a IA
    if (useGemini && geminiApiKey && Math.random() < 0.01) {
        askGeminiForEcosystemAnalysis(simulationConfig, ecosystemElements, geminiApiKey, geminiInsightsDiv, logToObserver);
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
        showMessage("O Sol só pode ser colocado no espaço sideral.");
        return;
    }

    const { x, y } = convert3DTo2DCoordinates(point3D, simulationConfig);
    const ElementClass = elementClasses[type];
    if (!ElementClass) return;

    logToObserver(`Adicionando ${multiplier}x ${type}...`);
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
        trackElementCreated(type); // NEW: Track element creation
        playSFX('elementPlace'); // Play SFX for placing an element
    }
    drawEcosystem(); // Redesenha para mostrar o novo elemento
    
    if (useGemini && geminiApiKey) {
        askGeminiForElementInsight(type, simulationConfig, geminiApiKey, logToObserver);
    }
}

export function removeElementAtPoint(point3D) {
    const elementToRemove = getElementAtPoint3D(point3D);
    if (elementToRemove) {
        ecosystemElements = ecosystemElements.filter(el => el.id !== elementToRemove.id);
        logToObserver(`Elemento ${elementToRemove.type} removido.`);
        drawEcosystem(); // Redesenha para remover o elemento
    }
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
            if (placingElement === 'eraser') {
                removeElementAtPoint(point3D);
            } else if (placingElement) {
                addElementAtPoint(point3D, placingElement, elementMultiplier, useGemini, geminiApiKey);
            } else {
                // Se nenhum elemento estiver selecionado, talvez inspecionar o elemento existente
                const elementAtPoint = getElementAtPoint3D(point3D);
                if (elementAtPoint) {
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
    }
}

function updatePlayerEnergyDisplay() {
    if (playerEnergyDisplaySpan) {
        playerEnergyDisplaySpan.textContent = playerEnergy;
    }
}

export function blessTribe(tribe) {
    const cost = 10;
    if (playerEnergy >= cost) {
        playerEnergy -= cost;
        updatePlayerEnergyDisplay();
        tribe.reproductionChance *= 2; // Temporarily double reproduction chance
        tribe.resourceCollectionRate *= 2; // Temporarily double resource collection
        logToObserver(`Tribo ${tribe.id.toFixed(0)} abençoada! Taxa de reprodução e coleta dobradas.`);
        showMessage(`Tribo ${tribe.id.toFixed(0)} abençoada!`, 'success');
        playSFX('bless'); // Play SFX for blessing
        // Revert effect after some time (e.g., 10 simulation cycles)
        setTimeout(() => {
            tribe.reproductionChance /= 2;
            tribe.resourceCollectionRate /= 2;
            logToObserver(`Efeito da bênção na tribo ${tribe.id.toFixed(0)} terminou.`);
        }, 10 * 100); // Assuming 100ms per cycle
    } else {
        showMessage(`Energia insuficiente para abençoar a tribo. Necessário: ${cost}, Atual: ${playerEnergy}`, 'error');
    }
}

export function curseTribe(tribe) {
    const cost = 15;
    if (playerEnergy >= cost) {
        playerEnergy -= cost;
        updatePlayerEnergyDisplay();
        tribe.health *= 0.5; // Reduce health by half
        logToObserver(`Tribo ${tribe.id.toFixed(0)} amaldiçoada! Saúde reduzida e desastre localizado.`);
        showMessage(`Tribo ${tribe.id.toFixed(0)} amaldiçoada!`, 'error');
        playSFX('curse'); // Play SFX for cursing
        // Potentially add a localized disaster effect here (e.g., remove nearby plants)
        ecosystemElements = ecosystemElements.filter(el => 
            !(el.type === 'plant' && Math.hypot(tribe.x - el.x, tribe.y - el.y) < 100) // Remove plants within 100 units
        );
        drawEcosystem();
    } else {
        showMessage(`Energia insuficiente para amaldiçoar a tribo. Necessário: ${cost}, Atual: ${playerEnergy}`, 'error');
    }
}
