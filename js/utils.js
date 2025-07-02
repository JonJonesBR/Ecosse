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

    update(simulationState) {
        this.age++;
        this.health -= this.decayRate;
    }
}

class PlantElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'plant'); }
    update(simulationState) {
        super.update(simulationState);
        const hasWater = simulationState.config.waterPresence > 20;
        if (hasWater && simulationState.config.luminosity > 0.5) {
            this.health += 0.1;
        }
        if (this.health > 80 && Math.random() < this.reproductionChance) {
            simulationState.newElements.push(new PlantElement(Date.now() + Math.random(), this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50));
        }
    }
}

class CreatureElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'creature'); }
    update(simulationState) {
        super.update(simulationState);
        this.x += (Math.random() - 0.5) * this.speed;
        this.y += (Math.random() - 0.5) * this.speed;
        this.energy -= 0.1;
        if(this.energy <= 0) this.health -= 0.5;

        simulationState.elements.forEach(el => {
            if (el.type === 'plant' && Math.hypot(this.x - el.x, this.y - el.y) < 20) {
                el.health -= 1;
                this.energy += 0.5;
            }
        });
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