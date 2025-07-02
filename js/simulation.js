import { elementClasses, logToObserver, ecosystemSizes, showMessage, EcosystemElement } from './utils.js';
import { askGeminiForElementInsight, askGeminiForEcosystemAnalysis } from './geminiApi.js';
import { updateElements3D, convert3DTo2DCoordinates, get3DIntersectionPoint } from './planetRenderer.js';

// Variáveis de estado do módulo
let ecosystemElements = [];
let simulationConfig = {};
let simulationInterval;
let isSimulationRunning = false;
let placingElement = null;
let elementMultiplier = 1;
let currentMouse3DPoint = null;

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
        element.update(simulationState)
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
    }

    // Interação opcional com a IA
    if (useGemini && geminiApiKey && Math.random() < 0.01) {
        askGeminiForEcosystemAnalysis(simulationConfig, ecosystemElements, geminiApiKey, geminiInsightsDiv, logToObserver);
    }
}

export function startSimulationLoop(useGemini, geminiApiKey) {
    if (isSimulationRunning) return;
    isSimulationRunning = true;
    clearInterval(simulationInterval); // Limpa qualquer intervalo anterior
    simulationInterval = setInterval(() => updateSimulation(useGemini, geminiApiKey), 100);
    logToObserver("Simulação iniciada.");
}

export function pauseSimulationLoop() {
    isSimulationRunning = false;
    clearInterval(simulationInterval);
    logToObserver("Simulação pausada.");
}

export function addElementAtPoint(point3D, type, multiplier, useGemini, geminiApiKey) {
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
    drawEcosystem();
    updateSimulationInfo();
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

// Esta função não é exportada pois é chamada por main.js, que já tem acesso ao toggleTimeLapse
export function toggleTimeLapse() {
    // A lógica de lapso de tempo pode ser mais complexa,
    // por enquanto, vamos apenas logar a chamada.
    logToObserver("Função de lapso de tempo acionada.");
    showMessage("O lapso de tempo ainda não foi implementado nesta versão.");
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
