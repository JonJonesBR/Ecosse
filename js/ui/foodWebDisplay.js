/**
 * Food Web Display UI Component
 * Displays food web statistics and relationships in the ecosystem
 */

import { getPopulationCounts, getTrophicLevel, TrophicLevels } from '../systems/foodWebSystem.js';
import { subscribe, EventTypes } from '../systems/eventSystem.js';

let foodWebContainer = null;
let isDisplayVisible = false;

/**
 * Initialize the food web display UI
 * @param {HTMLElement} container - Container element for the food web display
 */
export function initFoodWebDisplay(container) {
    foodWebContainer = container;
    
    // Subscribe to relevant events
    subscribe(EventTypes.ELEMENT_CREATED, updateFoodWebDisplay);
    subscribe(EventTypes.ELEMENT_REMOVED, updateFoodWebDisplay);
    subscribe(EventTypes.ELEMENT_INTERACTION, handleFoodWebInteraction);
    
    // Create the initial display
    createFoodWebDisplay();
    
    console.log('Food Web Display initialized');
}

/**
 * Create the food web display structure
 */
function createFoodWebDisplay() {
    if (!foodWebContainer) return;
    
    foodWebContainer.innerHTML = `
        <div class="food-web-panel">
            <div class="food-web-header">
                <h3>🕸️ Rede Alimentar</h3>
                <button id="toggle-food-web" class="toggle-btn">👁️</button>
            </div>
            <div id="food-web-content" class="food-web-content" style="display: none;">
                <div class="trophic-levels">
                    <div class="trophic-level" data-level="3">
                        <h4>🦅 Consumidores Terciários</h4>
                        <div class="population-count" id="tertiary-count">0</div>
                        <div class="element-types" id="tertiary-types"></div>
                    </div>
                    <div class="trophic-level" data-level="2">
                        <h4>🐺 Consumidores Secundários</h4>
                        <div class="population-count" id="secondary-count">0</div>
                        <div class="element-types" id="secondary-types"></div>
                    </div>
                    <div class="trophic-level" data-level="1">
                        <h4>🐛 Consumidores Primários</h4>
                        <div class="population-count" id="primary-count">0</div>
                        <div class="element-types" id="primary-types"></div>
                    </div>
                    <div class="trophic-level" data-level="0">
                        <h4>🌿 Produtores</h4>
                        <div class="population-count" id="producer-count">0</div>
                        <div class="element-types" id="producer-types"></div>
                    </div>
                    <div class="trophic-level" data-level="4">
                        <h4>🍄 Decompositores</h4>
                        <div class="population-count" id="decomposer-count">0</div>
                        <div class="element-types" id="decomposer-types"></div>
                    </div>
                </div>
                <div class="food-web-stats">
                    <div class="stat-item">
                        <span class="stat-label">Estabilidade da Rede:</span>
                        <span class="stat-value" id="web-stability">100%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Diversidade Trófica:</span>
                        <span class="stat-value" id="trophic-diversity">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Interações Recentes:</span>
                        <span class="stat-value" id="recent-interactions">0</span>
                    </div>
                </div>
                <div class="interaction-log" id="interaction-log">
                    <h4>📊 Log de Interações</h4>
                    <div class="log-entries" id="log-entries"></div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for toggle button
    const toggleBtn = document.getElementById('toggle-food-web');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleFoodWebDisplay);
    }
    
    // Initial update
    updateFoodWebDisplay();
}

/**
 * Toggle the visibility of the food web display
 */
function toggleFoodWebDisplay() {
    const content = document.getElementById('food-web-content');
    const toggleBtn = document.getElementById('toggle-food-web');
    
    if (content && toggleBtn) {
        isDisplayVisible = !isDisplayVisible;
        content.style.display = isDisplayVisible ? 'block' : 'none';
        toggleBtn.textContent = isDisplayVisible ? '👁️' : '👁️‍🗨️';
    }
}

/**
 * Update the food web display with current data
 */
function updateFoodWebDisplay() {
    if (!isDisplayVisible) return;
    
    const populations = getPopulationCounts();
    
    // Update population counts by trophic level
    updateTrophicLevelDisplay(TrophicLevels.PRODUCER, populations.plant, ['plant']);
    updateTrophicLevelDisplay(TrophicLevels.PRIMARY, populations.creature, ['creature']);
    updateTrophicLevelDisplay(TrophicLevels.SECONDARY, populations.predator, ['predator']);
    updateTrophicLevelDisplay(TrophicLevels.TERTIARY, populations.tribe, ['tribe']);
    updateTrophicLevelDisplay(TrophicLevels.DECOMPOSER, populations.fungus, ['fungus']);
    
    // Update overall statistics
    updateFoodWebStats(populations);
}

/**
 * Update display for a specific trophic level
 * @param {number} level - Trophic level
 * @param {number} count - Population count
 * @param {Array} types - Element types in this level
 */
function updateTrophicLevelDisplay(level, count, types) {
    const levelNames = {
        [TrophicLevels.PRODUCER]: 'producer',
        [TrophicLevels.PRIMARY]: 'primary',
        [TrophicLevels.SECONDARY]: 'secondary',
        [TrophicLevels.TERTIARY]: 'tertiary',
        [TrophicLevels.DECOMPOSER]: 'decomposer'
    };
    
    const levelName = levelNames[level];
    if (!levelName) return;
    
    const countElement = document.getElementById(`${levelName}-count`);
    const typesElement = document.getElementById(`${levelName}-types`);
    
    if (countElement) {
        countElement.textContent = count;
        countElement.className = `population-count ${count > 0 ? 'active' : 'inactive'}`;
    }
    
    if (typesElement) {
        typesElement.innerHTML = types.map(type => 
            `<span class="element-type ${count > 0 ? 'active' : 'inactive'}">${getElementEmoji(type)}</span>`
        ).join('');
    }
}

/**
 * Update overall food web statistics
 * @param {Object} populations - Population counts by type
 */
function updateFoodWebStats(populations) {
    // Calculate web stability (based on population balance)
    const totalPopulation = Object.values(populations).reduce((sum, count) => sum + count, 0);
    const activeLevels = Object.values(populations).filter(count => count > 0).length;
    const stability = totalPopulation > 0 ? Math.min(100, (activeLevels / 5) * 100) : 0;
    
    const stabilityElement = document.getElementById('web-stability');
    if (stabilityElement) {
        stabilityElement.textContent = `${stability.toFixed(0)}%`;
        stabilityElement.className = `stat-value ${stability > 60 ? 'good' : stability > 30 ? 'warning' : 'danger'}`;
    }
    
    // Update trophic diversity
    const diversityElement = document.getElementById('trophic-diversity');
    if (diversityElement) {
        diversityElement.textContent = activeLevels;
        diversityElement.className = `stat-value ${activeLevels >= 3 ? 'good' : activeLevels >= 2 ? 'warning' : 'danger'}`;
    }
}

/**
 * Handle food web interaction events
 * @param {Object} data - Interaction event data
 */
function handleFoodWebInteraction(data) {
    if (!isDisplayVisible) return;
    
    // Update recent interactions count
    const interactionsElement = document.getElementById('recent-interactions');
    if (interactionsElement) {
        const currentCount = parseInt(interactionsElement.textContent) || 0;
        interactionsElement.textContent = currentCount + 1;
    }
    
    // Add to interaction log
    addInteractionToLog(data);
}

/**
 * Add an interaction to the log display
 * @param {Object} interaction - Interaction data
 */
function addInteractionToLog(interaction) {
    const logEntries = document.getElementById('log-entries');
    if (!logEntries) return;
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    let message = '';
    const timestamp = new Date().toLocaleTimeString();
    
    switch (interaction.interactionType) {
        case 'predation':
            const result = interaction.success ? '✅ Sucesso' : '❌ Falhou';
            message = `[${timestamp}] ${getElementEmoji(interaction.predator?.type)} → ${getElementEmoji(interaction.prey?.type)} ${result}`;
            break;
        case 'cascade_effect':
            message = `[${timestamp}] 🌊 Efeito cascata: ${interaction.sourceType} → ${interaction.targetType}`;
            break;
        default:
            message = `[${timestamp}] 🔄 ${interaction.interactionType}`;
    }
    
    entry.textContent = message;
    entry.className = `log-entry ${interaction.success ? 'success' : 'failure'}`;
    
    // Add to top of log
    logEntries.insertBefore(entry, logEntries.firstChild);
    
    // Keep only last 10 entries
    while (logEntries.children.length > 10) {
        logEntries.removeChild(logEntries.lastChild);
    }
}

/**
 * Get emoji representation for element types
 * @param {string} type - Element type
 * @returns {string} Emoji representation
 */
function getElementEmoji(type) {
    const emojiMap = {
        'plant': '🌿',
        'creature': '🐛',
        'predator': '🐺',
        'tribe': '🛖',
        'fungus': '🍄',
        'water': '💧',
        'rock': '🪨',
        'sun': '☀️'
    };
    
    return emojiMap[type] || '❓';
}

/**
 * Show the food web display
 */
export function showFoodWebDisplay() {
    if (!isDisplayVisible) {
        toggleFoodWebDisplay();
    }
}

/**
 * Hide the food web display
 */
export function hideFoodWebDisplay() {
    if (isDisplayVisible) {
        toggleFoodWebDisplay();
    }
}

/**
 * Get current food web display state
 * @returns {boolean} Whether the display is visible
 */
export function isFoodWebDisplayVisible() {
    return isDisplayVisible;
}