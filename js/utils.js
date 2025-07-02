import { get3DPositionOnPlanet, triggerVolcanoEruption, triggerMeteorImpact } from './planetRenderer.js';
import * as THREE from 'three';

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
    creature: { emoji: '🐛', color: 'rgba(255, 165, 0, 0.9)', baseHealth: 100, energy: 100, size: 18, decayRate: 0.3, reproductionChance: 0.002, speed: 2, preferredBiome: 'terrestrial' },
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
    constructor(id, x, y) { super(id, x, y, 'creature'); this.preferredBiome = elementDefinitions.creature.preferredBiome; this.target = null; }
    update(simulationState, config) {
        super.update(simulationState, config);

        // Find nearest plant if no target or target is dead
        if (!this.target || this.target.health <= 0) {
            const plants = simulationState.elements.filter(el => el.type === 'plant' && el.health > 0);
            if (plants.length > 0) {
                this.target = plants.reduce((prev, curr) => {
                    const distPrev = Math.hypot(this.x - prev.x, this.y - prev.y);
                    const distCurr = Math.hypot(this.x - curr.x, this.y - curr.y);
                    return (distPrev < distCurr) ? prev : curr;
                });
            } else {
                this.target = null;
            }
        }

        // Movement influenced by gravity and target
        let moveX = (Math.random() - 0.5) * this.speed / config.gravity;
        let moveY = (Math.random() - 0.5) * this.speed / config.gravity;

        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            moveX = Math.cos(angle) * this.speed / config.gravity;
            moveY = Math.sin(angle) * this.speed / config.gravity;
        }

        this.x += moveX;
        this.y += moveY;

        // Energy consumption influenced by temperature and water
        let energyConsumption = 0.1;
        if (config.temperature > 30 || config.temperature < 0) {
            energyConsumption *= 1.5; // More energy consumed in extreme temperatures
        }
        if (config.waterPresence < 30) {
            energyConsumption *= 1.2; // More energy consumed with less water
        }
        this.energy -= energyConsumption;

        // Biome suitability
        let biomeSuitability = 1.0;
        if (this.preferredBiome === 'aquatic' && config.waterPresence < 50) {
            biomeSuitability *= 0.5;
        } else if (this.preferredBiome === 'desert' && config.waterPresence > 50) {
            biomeSuitability *= 0.5;
        } // Add more biome checks as needed

        this.health *= biomeSuitability; // Health degrades if not in preferred biome

        if(this.energy <= 0) this.health -= 0.5;

        // Interaction with plants (food source)
        simulationState.elements.forEach(el => {
            if (el.type === 'plant' && Math.hypot(this.x - el.x, this.y - el.y) < 20) {
                el.health -= 1;
                this.energy += 0.5;
            }
        });

        // Reproduction influenced by health and environment
        if (this.health > 70 && this.energy > 50 && Math.random() < this.reproductionChance / config.gravity * biomeSuitability) {
            simulationState.newElements.push(new CreatureElement(Date.now() + Math.random(), this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50));
        }
    }
}

class WaterElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'water'); this.amount = 100; this.lastSpreadTick = 0; }
    update(simulationState, config) {
        super.update(simulationState, config);

        // Only spread every 10 ticks to reduce overhead
        if (this.health > 0 && this.amount > 10 && simulationState.age - this.lastSpreadTick > 10) {
            const spreadAmount = this.amount * 0.05; // Reduced spread amount
            this.amount -= spreadAmount;
            this.lastSpreadTick = simulationState.age;

            const neighbors = [
                { x: this.x + this.size, y: this.y },
                { x: this.x - this.size, y: this.y },
                { x: this.x, y: this.y + this.size },
                { x: this.x, y: this.y - this.size },
            ];

            neighbors.forEach(n => {
                let existingWater = simulationState.elements.find(el => el.type === 'water' && Math.hypot(el.x - n.x, el.y - n.y) < this.size * 2); // Larger search radius
                if (existingWater) {
                    existingWater.amount += spreadAmount / neighbors.length;
                } else if (Math.random() < 0.2) { // Reduced chance to create new element
                    simulationState.newElements.push(new WaterElement(Date.now() + Math.random(), n.x, n.y));
                }
            });
        }
        if (this.amount <= 0) this.health = 0; // No more water, element dies
    }
}

class RockElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'rock'); this.height = Math.random() * 50 + 10; } // Random height
    update(simulationState, config) {
        super.update(simulationState, config);
        // Rocks are mostly static, but might erode over time
        this.height -= 0.01 * config.waterPresence / 100; // Erosion by water
        if (this.height < 5) this.health = 0; // Eroded away
    }
}

class SunElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'sun'); }
    update(simulationState, config) {
        super.update(simulationState, config);
        // Sun provides luminosity, which is handled by the renderer
        // No direct health impact on itself, but influences others
    }
}

class RainElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'rain'); this.duration = 100; } // Rain lasts for a duration
    update(simulationState, config) {
        super.update(simulationState, config);
        this.duration--;
        if (this.duration <= 0) this.health = 0; // Rain stops

        // Increase water presence in the area
        simulationState.elements.forEach(el => {
            if (el.type === 'water' && Math.hypot(this.x - el.x, el.y - el.y) < 100) {
                el.amount += 1; // Add water to existing water bodies
            }
        });
    }
}

class VolcanoElement extends EcosystemElement {
    constructor(id, x, y) { super(id, x, y, 'volcano'); this.eruptionCooldown = 0; }
    update(simulationState, config) {
        super.update(simulationState, config);

        if (this.eruptionCooldown > 0) {
            this.eruptionCooldown--;
        } else if (Math.random() < elementDefinitions.volcano.eruptionChance) {
            // Trigger eruption
            this.eruptionCooldown = 100; // Cooldown for 100 ticks
            logToObserver(`Vulcão em ${this.x.toFixed(0)},${this.y.toFixed(0)} entrou em erupção!`);
            const volcano3DPos = get3DPositionOnPlanet(this.x, this.y, simulationState.config, this.type);
            triggerVolcanoEruption(volcano3DPos);

            // Impact nearby elements
            simulationState.elements.forEach(el => {
                const distance = Math.hypot(this.x - el.x, this.y - el.y);
                if (distance < 100) { // Area of effect
                    el.health -= 50; // Damage
                    if (el.health <= 0) {
                        logToObserver(`${el.type} em ${el.x.toFixed(0)},${el.y.toFixed(0)} foi destruído pela erupção.`);
                    }
                }
            });
        }
    }
}

class MeteorElement extends EcosystemElement {
    constructor(id, x, y) {
        super(id, x, y, 'meteor');
        this.impacted = false;
        // Define a random start position far above the planet
        const startDistance = 500; // Fixed distance for now
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI / 4; // Some elevation
        this.startPos = new THREE.Vector3(
            startDistance * Math.cos(angle) * Math.cos(elevation),
            startDistance * Math.sin(elevation),
            startDistance * Math.sin(angle) * Math.cos(elevation)
        );
        this.targetPos = get3DPositionOnPlanet(x, y, { ecosystemSize: 'medium' }, 'meteor'); // Target on planet surface
        this.progress = 0; // 0 to 1, 1 means impact
    }

    update(simulationState, config) {
        super.update(simulationState, config);

        if (!this.impacted) {
            this.progress += 0.01; // Meteor moves towards the planet
            if (this.progress >= 1) {
                this.impacted = true;
                logToObserver(`Meteoro impactou em ${this.x.toFixed(0)},${this.y.toFixed(0)}!`);
                triggerMeteorImpact(this.targetPos);

                // Impact nearby elements
                simulationState.elements.forEach(el => {
                    const distance = Math.hypot(this.x - el.x, this.y - el.y);
                    if (distance < 150) { // Larger area of effect
                        el.health -= 80; // More damage
                        if (el.health <= 0) {
                            logToObserver(`${el.type} em ${el.x.toFixed(0)},${el.y.toFixed(0)} foi destruído pelo impacto do meteoro.`);
                        }
                    }
                });
                this.health = 0; // Meteor is destroyed after impact
            } else {
                // Update current 3D position based on progress
                const current3DPos = new THREE.Vector3().lerpVectors(this.startPos, this.targetPos, this.progress);
                this.x = current3DPos.x; // Update x and y for 2D simulation logic
                this.y = current3DPos.y;
                this.z = current3DPos.z; // Store z for 3D rendering
            }
        }
    }
}

export const elementClasses = {
    water: WaterElement,
    rock: RockElement,
    plant: PlantElement,
    creature: CreatureElement,
    sun: SunElement,
    rain: RainElement,
    fungus: (id, x, y) => new EcosystemElement(id, x, y, 'fungus'),
    meteor: MeteorElement,
    volcano: VolcanoElement,
    eraser: (id, x, y) => new EcosystemElement(id, x, y, 'eraser'),
};