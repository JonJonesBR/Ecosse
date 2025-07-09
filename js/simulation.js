import { elementClasses, logToObserver, ecosystemSizes, showMessage, EcosystemElement } from './utils.js';
import { askGeminiForElementInsight, askGeminiForEcosystemAnalysis } from './geminiApi.js';
import { askGeminiForNarrativeEvent } from './geminiApi.js'; // NEW IMPORT
import { getActiveTechnologyEffects } from './techTree.js'; // NEW IMPORT
import { updateElements3D, convert3DTo2DCoordinates, get3DIntersectionPoint } from './planetRenderer.js';
import { trackElementCreated, trackSimulationCycle, checkStabilityAchievement, resetAchievementProgress } from './achievements.js'; // NEW IMPORT
import { updateWeatherDisplay } from './main.js'; // NEW IMPORT

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

// Referências da UI
let ecosystemStabilitySpan, ecosystemBiodiversitySpan, ecosystemResourcesSpan, geminiInsightsDiv;

export function initSimulationUIReferences(stability, biodiversity, resources, insights) {
    ecosystemStabilitySpan = stability;
    ecosystemBiodiversitySpan = biodiversity;
    ecosystemResourcesSpan = resources;
    geminiInsightsDiv = insights;
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

    // Dynamic Weather Logic
    const weatherChangeChance = 0.005; // 0.5% chance per simulation tick
    if (Math.random() < weatherChangeChance) {
        const possibleWeather = [];

        // Sunny/Clear is always an option
        possibleWeather.push({ type: 'sunny', emoji: '☀️', effect: 1.0 });

        // Rain/Cloudy based on water presence and temperature
        if (simulationConfig.waterPresence > 40 && simulationConfig.temperature < 25) {
            possibleWeather.push({ type: 'rainy', emoji: '🌧️', effect: 0.8 }); // Plants thrive, creatures suffer
            possibleWeather.push({ type: 'cloudy', emoji: '☁️', effect: 0.9 }); // Reduced light
        }

        // Hot/Dry based on temperature and water presence
        if (simulationConfig.temperature > 30 && simulationConfig.waterPresence < 30) {
            possibleWeather.push({ type: 'dry', emoji: '🔥', effect: 1.2 }); // Increased decay for water/plants
        }

        // Cold/Snowy based on temperature
        if (simulationConfig.temperature < 0) {
            possibleWeather.push({ type: 'snowy', emoji: '❄️', effect: 0.7 }); // Reduced growth, increased decay
        }

        // Choose a random weather from possible options
        const newWeather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];
        if (newWeather.type !== currentWeather.type) {
            currentWeather = newWeather;
            logToObserver(`O clima mudou para: ${currentWeather.emoji} ${currentWeather.type}`);
            updateWeatherDisplay(currentWeather); // Update UI for weather
        }
    }

    const simulationState = {
        config: simulationConfig,
        elements: ecosystemElements,
        newElements: [],
        canvasWidth: ecosystemSizes[simulationConfig.ecosystemSize].width,
        canvasHeight: ecosystemSizes[simulationConfig.ecosystemSize].height,
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

export function resetSimulation() {
    pauseSimulationLoop();
    ecosystemElements = [];
    // Reinitialize planet appearance after reset
    const currentConfig = getSimulationConfig();
    updatePlanetAppearance(currentConfig);
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

export function handleCanvasInteraction(event, isClick, useGemini, geminiApiKey, showDetailsCallback, canvas) {
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
                    if (showDetailsCallback) {
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
