// js/utils.js
let messageBox, messageText, observerLogDiv;

export function initUIDomReferences(msgBox, msgText, obsLog, okBtn) {
    messageBox = msgBox;
    messageText = msgText;
    observerLogDiv = obsLog;
    if (okBtn) {
        okBtn.addEventListener('click', hideMessageBox);
    }
}

export function showMessage(message) {
    if (messageText && messageBox) {
        messageText.textContent = message;
        messageBox.style.display = 'block';
    }
}

export function hideMessageBox() {
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

export function logToObserver(message) {
    if (observerLogDiv) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        observerLogDiv.prepend(p);
        if (observerLogDiv.children.length > 50) {
            observerLogDiv.removeChild(observerLogDiv.lastChild);
        }
    }
}

export function showModal(modalElement) {
    if (modalElement) modalElement.style.display = 'flex';
}

export function hideModal(modalElement) {
    if (modalElement) modalElement.style.display = 'none';
}

export function updateSliderValue(slider, span, suffix = '') {
    if (span && slider) {
        span.textContent = slider.value + suffix;
    }
}

export const ecosystemSizes = {
    small: { width: 500, height: 300, radius: 100 },
    medium: { width: 800, height: 450, radius: 150 },
    large: { width: 1200, height: 675, radius: 200 },
};

export const elementDefinitions = {
    water: { emoji: '💧', color: 'rgba(0, 191, 255, 0.7)', baseHealth: 100, size: 20, decayRate: 0.01 },
    rock: { emoji: '🪨', color: 'rgba(100, 100, 100, 0.9)', baseHealth: 100, size: 30, decayRate: 0 },
    plant: { emoji: '🌿', color: 'rgba(0, 200, 0, 0.9)', baseHealth: 100, energy: 50, size: 25, decayRate: 0.2, reproductionChance: 0.005 },
    creature: { emoji: '🐛', color: 'rgba(255, 165, 0, 0.9)', baseHealth: 100, energy: 100, size: 18, decayRate: 0.3, reproductionChance: 0.002, speed: 2 },
    sun: { emoji: '☀️', color: 'rgba(255, 255, 0, 0.8)', baseHealth: 100, size: 30, decayRate: 0.05 },
    rain: { emoji: '🌧️', color: 'rgba(100, 149, 237, 0.6)', baseHealth: 100, size: 35, decayRate: 1.5 },
    fungus: { emoji: '🍄', color: 'rgba(150, 75, 0, 0.9)', baseHealth: 80, energy: 30, size: 22, decayRate: 0.15, reproductionChance: 0.003 },
    meteor: { emoji: '☄️', color: 'rgba(180, 180, 180, 0.9)', baseHealth: 50, size: 40, decayRate: 100 },
    volcano: { emoji: '🌋', color: 'rgba(100, 0, 0, 0.9)', baseHealth: 200, size: 45, decayRate: 0.05, eruptionChance: 0.001 },
    eraser: { emoji: '🚫', color: 'rgba(255, 0, 0, 0.5)', size: 30, decayRate: 0 }
};

export class EcosystemElement {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        const def = elementDefinitions[type];
        this.health = def.baseHealth;
        this.energy = def.energy || 0;
        this.size = def.size;
        this.emoji = def.emoji;
        this.decayRate = def.decayRate;
        this.reproductionChance = def.reproductionChance;
        this.speed = def.speed || 0;
        this.age = 0;
    }

    update(simulationState, config) {
        this.age++;
        let decay = this.decayRate;

        // General decay influenced by gravity
        decay *= config.gravity; 

        this.health -= decay;
    }
}

class PlantElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'plant'); }
    update(simulationState, config) {
        super.update(simulationState, config);

        // Plants need water and light to thrive
        const waterFactor = config.waterPresence / 100; // 0 to 1
        const luminosityFactor = config.luminosity / 2.0; // 0 to 1
        const temperatureFactor = 1 - Math.abs(config.temperature - 20) / 50; // Optimal at 20C, drops off

        let growthRate = 0.1 * waterFactor * luminosityFactor * temperatureFactor;

        // Soil type influence
        if (config.soilType === 'fertile') {
            growthRate *= 1.5;
        } else if (config.soilType === 'sandy' || config.soilType === 'rocky') {
            growthRate *= 0.5;
        }

        this.health += growthRate;

        // Reproduction based on health and conditions
        if (this.health > 80 && Math.random() < this.reproductionChance * waterFactor * luminosityFactor) {
            simulationState.newElements.push(new PlantElement(Date.now() + Math.random(), this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50));
        }
    }
}

class CreatureElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'creature'); }
    update(simulationState, config) {
        super.update(simulationState, config);

        // Movement influenced by gravity
        this.x += (Math.random() - 0.5) * this.speed / config.gravity;
        this.y += (Math.random() - 0.5) * this.speed / config.gravity;

        // Energy consumption influenced by temperature and water
        let energyConsumption = 0.1;
        if (config.temperature > 30 || config.temperature < 0) {
            energyConsumption *= 1.5; // More energy consumed in extreme temperatures
        }
        if (config.waterPresence < 30) {
            energyConsumption *= 1.2; // More energy consumed with less water
        }
        this.energy -= energyConsumption;

        if(this.energy <= 0) this.health -= 0.5;

        // Interaction with plants (food source)
        simulationState.elements.forEach(el => {
            if (el.type === 'plant' && Math.hypot(this.x - el.x, this.y - el.y) < 20) {
                el.health -= 1;
                this.energy += 0.5;
            }
        });

        // Reproduction influenced by health and environment
        if (this.health > 70 && this.energy > 50 && Math.random() < this.reproductionChance / config.gravity) {
            simulationState.newElements.push(new CreatureElement(Date.now() + Math.random(), this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50));
        }
    }
}

export const elementClasses = {
    water: (id, x, y) => new EcosystemElement(id, x, y, 'water'),
    rock: (id, x, y) => new EcosystemElement(id, x, y, 'rock'),
    plant: PlantElement,
    creature: CreatureElement,
    sun: (id, x, y) => new EcosystemElement(id, x, y, 'sun'),
    rain: (id, x, y) => new EcosystemElement(id, x, y, 'rain'),
    fungus: (id, x, y) => new EcosystemElement(id, x, y, 'fungus'),
    meteor: (id, x, y) => new EcosystemElement(id, x, y, 'meteor'),
    volcano: (id, x, y) => new EcosystemElement(id, x, y, 'volcano'),
    eraser: (id, x, y) => new EcosystemElement(id, x, y, 'eraser'),
};