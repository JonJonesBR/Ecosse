// Enhanced Weather System with Seasonal Cycles, Extreme Events, and Microclimates
import { publish, EventTypes } from './eventSystem.js';
import { info, warning, error } from './loggingSystem.js';

// Weather types with enhanced properties
const WEATHER_TYPES = {
    sunny: {
        emoji: '☀️',
        name: 'Ensolarado',
        baseEffect: 1.0,
        temperatureModifier: 5,
        humidityModifier: -10,
        windModifier: 0.3,
        visibility: 1.0,
        duration: { min: 50, max: 200 }
    },
    cloudy: {
        emoji: '☁️',
        name: 'Nublado',
        baseEffect: 0.9,
        temperatureModifier: -2,
        humidityModifier: 5,
        windModifier: 0.5,
        visibility: 0.8,
        duration: { min: 30, max: 150 }
    },
    rainy: {
        emoji: '🌧️',
        name: 'Chuvoso',
        baseEffect: 0.8,
        temperatureModifier: -5,
        humidityModifier: 30,
        windModifier: 0.7,
        visibility: 0.6,
        duration: { min: 20, max: 100 }
    },
    stormy: {
        emoji: '⛈️',
        name: 'Tempestade',
        baseEffect: 0.6,
        temperatureModifier: -8,
        humidityModifier: 40,
        windModifier: 1.5,
        visibility: 0.4,
        duration: { min: 10, max: 50 },
        isExtreme: true
    },
    snowy: {
        emoji: '❄️',
        name: 'Nevando',
        baseEffect: 0.7,
        temperatureModifier: -15,
        humidityModifier: 20,
        windModifier: 0.8,
        visibility: 0.5,
        duration: { min: 30, max: 120 }
    },
    blizzard: {
        emoji: '🌨️',
        name: 'Nevasca',
        baseEffect: 0.4,
        temperatureModifier: -25,
        humidityModifier: 35,
        windModifier: 2.0,
        visibility: 0.2,
        duration: { min: 15, max: 60 },
        isExtreme: true
    },
    drought: {
        emoji: '🔥',
        name: 'Seca',
        baseEffect: 1.2,
        temperatureModifier: 15,
        humidityModifier: -40,
        windModifier: 0.2,
        visibility: 0.9,
        duration: { min: 100, max: 300 },
        isExtreme: true
    },
    heatwave: {
        emoji: '🌡️',
        name: 'Onda de Calor',
        baseEffect: 1.3,
        temperatureModifier: 20,
        humidityModifier: -30,
        windModifier: 0.1,
        visibility: 0.8,
        duration: { min: 80, max: 200 },
        isExtreme: true
    },
    fog: {
        emoji: '🌫️',
        name: 'Neblina',
        baseEffect: 0.85,
        temperatureModifier: -3,
        humidityModifier: 25,
        windModifier: 0.1,
        visibility: 0.3,
        duration: { min: 20, max: 80 }
    }
};

// Seasonal weather probabilities
const SEASONAL_WEATHER_PROBABILITIES = {
    spring: {
        sunny: 0.4,
        cloudy: 0.25,
        rainy: 0.25,
        stormy: 0.05,
        fog: 0.05
    },
    summer: {
        sunny: 0.6,
        cloudy: 0.15,
        rainy: 0.1,
        stormy: 0.05,
        drought: 0.05,
        heatwave: 0.05
    },
    autumn: {
        sunny: 0.3,
        cloudy: 0.3,
        rainy: 0.25,
        stormy: 0.1,
        fog: 0.05
    },
    winter: {
        sunny: 0.2,
        cloudy: 0.3,
        snowy: 0.3,
        blizzard: 0.1,
        fog: 0.1
    }
};

class WeatherSystem {
    constructor() {
        this.currentWeather = WEATHER_TYPES.sunny;
        this.weatherDuration = 100;
        this.weatherTimer = 0;
        this.annualCycleTime = 0;
        this.currentSeason = 'spring';
        this.extremeWeatherCooldown = 0;
        this.microclimates = new Map();
        this.weatherHistory = [];
        this.climateStability = 1.0;
    }

    update(simulationConfig, ecosystemElements) {
        this.updateAnnualCycle();
        this.updateWeatherTimer();
        this.updateMicroclimates(simulationConfig, ecosystemElements);
        this.checkExtremeWeatherEvents(simulationConfig);
        
        if (this.weatherTimer <= 0) {
            this.transitionWeather(simulationConfig);
        }

        return this.getWeatherEffects(simulationConfig);
    }

    updateAnnualCycle() {
        this.annualCycleTime = (this.annualCycleTime + 0.0001) % 1;
        
        const newSeason = this.calculateSeason();
        if (newSeason !== this.currentSeason) {
            const previousSeason = this.currentSeason;
            this.currentSeason = newSeason;
            
            publish(EventTypes.SEASON_CHANGED, {
                season: this.currentSeason,
                previousSeason: previousSeason,
                annualCycleTime: this.annualCycleTime
            });
            
            info(`Estação mudou para: ${this.currentSeason}`);
        }
    }

    calculateSeason() {
        if (this.annualCycleTime >= 0 && this.annualCycleTime < 0.25) return 'spring';
        if (this.annualCycleTime >= 0.25 && this.annualCycleTime < 0.5) return 'summer';
        if (this.annualCycleTime >= 0.5 && this.annualCycleTime < 0.75) return 'autumn';
        return 'winter';
    }

    updateWeatherTimer() {
        this.weatherTimer--;
        if (this.extremeWeatherCooldown > 0) {
            this.extremeWeatherCooldown--;
        }
    }

    transitionWeather(simulationConfig) {
        const seasonalProbs = SEASONAL_WEATHER_PROBABILITIES[this.currentSeason];
        const newWeatherType = this.selectWeatherByProbability(seasonalProbs, simulationConfig);
        
        if (newWeatherType !== this.currentWeather.type) {
            const previousWeather = this.currentWeather;
            this.currentWeather = { ...WEATHER_TYPES[newWeatherType], type: newWeatherType };
            
            // Set duration
            const duration = this.currentWeather.duration;
            this.weatherDuration = Math.floor(Math.random() * (duration.max - duration.min) + duration.min);
            this.weatherTimer = this.weatherDuration;
            
            // Add to history
            this.weatherHistory.push({
                weather: newWeatherType,
                season: this.currentSeason,
                duration: this.weatherDuration,
                timestamp: Date.now()
            });
            
            // Keep only last 50 weather events
            if (this.weatherHistory.length > 50) {
                this.weatherHistory.shift();
            }
            
            publish(EventTypes.WEATHER_CHANGED, {
                currentWeather: this.currentWeather,
                previousWeather: previousWeather,
                season: this.currentSeason
            });
            
            info(`Clima mudou para: ${this.currentWeather.name} ${this.currentWeather.emoji}`);
        }
    }

    selectWeatherByProbability(probabilities, simulationConfig) {
        // Modify probabilities based on config
        const modifiedProbs = { ...probabilities };
        
        // Temperature influences
        if (simulationConfig.temperature > 35) {
            modifiedProbs.heatwave = (modifiedProbs.heatwave || 0) + 0.1;
            modifiedProbs.drought = (modifiedProbs.drought || 0) + 0.05;
            modifiedProbs.rainy = Math.max(0, (modifiedProbs.rainy || 0) - 0.1);
        }
        
        if (simulationConfig.temperature < -10) {
            modifiedProbs.blizzard = (modifiedProbs.blizzard || 0) + 0.1;
            modifiedProbs.snowy = (modifiedProbs.snowy || 0) + 0.1;
            modifiedProbs.sunny = Math.max(0, (modifiedProbs.sunny || 0) - 0.1);
        }
        
        // Water presence influences
        if (simulationConfig.waterPresence > 70) {
            modifiedProbs.rainy = (modifiedProbs.rainy || 0) + 0.1;
            modifiedProbs.stormy = (modifiedProbs.stormy || 0) + 0.05;
            modifiedProbs.drought = Math.max(0, (modifiedProbs.drought || 0) - 0.1);
        }
        
        if (simulationConfig.waterPresence < 30) {
            modifiedProbs.drought = (modifiedProbs.drought || 0) + 0.1;
            modifiedProbs.sunny = (modifiedProbs.sunny || 0) + 0.05;
            modifiedProbs.rainy = Math.max(0, (modifiedProbs.rainy || 0) - 0.1);
        }
        
        // Normalize probabilities
        const total = Object.values(modifiedProbs).reduce((sum, prob) => sum + prob, 0);
        Object.keys(modifiedProbs).forEach(key => {
            modifiedProbs[key] /= total;
        });
        
        // Select weather based on probabilities
        const random = Math.random();
        let cumulative = 0;
        
        for (const [weatherType, probability] of Object.entries(modifiedProbs)) {
            cumulative += probability;
            if (random <= cumulative) {
                return weatherType;
            }
        }
        
        return 'sunny'; // Fallback
    }

    checkExtremeWeatherEvents(simulationConfig) {
        if (this.extremeWeatherCooldown > 0) return;
        
        const extremeChance = this.calculateExtremeWeatherChance(simulationConfig);
        
        if (Math.random() < extremeChance) {
            this.triggerExtremeWeatherEvent(simulationConfig);
            this.extremeWeatherCooldown = 200; // Cooldown period
        }
    }

    calculateExtremeWeatherChance(simulationConfig) {
        let baseChance = 0.001; // 0.1% base chance
        
        // Climate instability increases extreme weather
        baseChance *= (2 - this.climateStability);
        
        // Temperature extremes increase chance
        if (Math.abs(simulationConfig.temperature) > 40) {
            baseChance *= 2;
        }
        
        // Water imbalance increases chance
        if (simulationConfig.waterPresence < 20 || simulationConfig.waterPresence > 80) {
            baseChance *= 1.5;
        }
        
        return Math.min(baseChance, 0.01); // Cap at 1%
    }

    triggerExtremeWeatherEvent(simulationConfig) {
        const extremeWeatherTypes = Object.keys(WEATHER_TYPES).filter(
            type => WEATHER_TYPES[type].isExtreme
        );
        
        if (extremeWeatherTypes.length === 0) return;
        
        // Filter by season and conditions
        let availableExtreme = extremeWeatherTypes.filter(type => {
            if (type === 'blizzard' && simulationConfig.temperature > 10) return false;
            if (type === 'heatwave' && simulationConfig.temperature < 20) return false;
            if (type === 'drought' && simulationConfig.waterPresence > 60) return false;
            return true;
        });
        
        if (availableExtreme.length === 0) {
            availableExtreme = extremeWeatherTypes;
        }
        
        const selectedExtreme = availableExtreme[Math.floor(Math.random() * availableExtreme.length)];
        
        this.currentWeather = { ...WEATHER_TYPES[selectedExtreme], type: selectedExtreme };
        this.weatherTimer = Math.floor(Math.random() * 50) + 20; // Shorter duration for extreme events
        
        publish(EventTypes.EXTREME_WEATHER, {
            weatherType: selectedExtreme,
            weather: this.currentWeather,
            season: this.currentSeason
        });
        
        warning(`Evento climático extremo: ${this.currentWeather.name}!`);
    }

    updateMicroclimates(simulationConfig, ecosystemElements) {
        this.microclimates.clear();
        
        // Create microclimates based on element density and types
        const gridSize = 100;
        const grid = new Map();
        
        // Group elements by grid cells
        ecosystemElements.forEach(element => {
            const gridX = Math.floor(element.x / gridSize);
            const gridY = Math.floor(element.y / gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!grid.has(key)) {
                grid.set(key, { elements: [], x: gridX * gridSize, y: gridY * gridSize });
            }
            grid.get(key).elements.push(element);
        });
        
        // Calculate microclimate for each grid cell
        grid.forEach((cell, key) => {
            const microclimate = this.calculateMicroclimate(cell, simulationConfig);
            if (microclimate) {
                this.microclimates.set(key, microclimate);
            }
        });
    }

    calculateMicroclimate(cell, simulationConfig) {
        const elements = cell.elements;
        if (elements.length === 0) return null;
        
        const plantCount = elements.filter(e => e.type === 'plant').length;
        const waterCount = elements.filter(e => e.type === 'water').length;
        const rockCount = elements.filter(e => e.type === 'rock').length;
        
        let temperatureModifier = 0;
        let humidityModifier = 0;
        let windModifier = 1.0;
        
        // Forest microclimate (many plants)
        if (plantCount > 5) {
            temperatureModifier -= 3; // Cooler
            humidityModifier += 10; // More humid
            windModifier *= 0.7; // Less windy
        }
        
        // Water body microclimate
        if (waterCount > 3) {
            temperatureModifier -= 2; // Cooler
            humidityModifier += 20; // Much more humid
            windModifier *= 1.1; // Slightly more windy
        }
        
        // Rocky area microclimate
        if (rockCount > 4) {
            temperatureModifier += 5; // Warmer (heat absorption)
            humidityModifier -= 5; // Drier
            windModifier *= 1.2; // More windy
        }
        
        // Only create microclimate if there's a significant difference
        if (Math.abs(temperatureModifier) > 1 || Math.abs(humidityModifier) > 5) {
            return {
                x: cell.x,
                y: cell.y,
                size: 100,
                temperatureModifier,
                humidityModifier,
                windModifier,
                type: this.determineMicroclimateType(plantCount, waterCount, rockCount)
            };
        }
        
        return null;
    }

    determineMicroclimateType(plantCount, waterCount, rockCount) {
        if (plantCount > 5) return 'forest';
        if (waterCount > 3) return 'wetland';
        if (rockCount > 4) return 'rocky';
        return 'mixed';
    }

    getWeatherEffects(simulationConfig) {
        const baseTemperature = simulationConfig.temperature;
        const seasonalEffect = this.getSeasonalTemperatureEffect();
        
        return {
            weather: this.currentWeather,
            season: this.currentSeason,
            annualCycleTime: this.annualCycleTime,
            effectiveTemperature: baseTemperature + seasonalEffect + this.currentWeather.temperatureModifier,
            effectiveHumidity: Math.max(0, Math.min(100, 
                simulationConfig.waterPresence + this.currentWeather.humidityModifier
            )),
            windStrength: this.currentWeather.windModifier,
            visibility: this.currentWeather.visibility,
            seasonalGrowthEffect: this.getSeasonalGrowthEffect(),
            microclimates: this.microclimates
        };
    }

    getSeasonalTemperatureEffect() {
        const amplitude = 20;
        return amplitude * Math.sin(2 * Math.PI * (this.annualCycleTime - 0.25));
    }

    getSeasonalGrowthEffect() {
        const amplitude = 0.5;
        return 1.0 + amplitude * Math.sin(2 * Math.PI * (this.annualCycleTime - 0.25));
    }

    getMicroclimateAt(x, y) {
        const gridX = Math.floor(x / 100);
        const gridY = Math.floor(y / 100);
        const key = `${gridX},${gridY}`;
        return this.microclimates.get(key) || null;
    }

    getWeatherHistory() {
        return [...this.weatherHistory];
    }

    setClimateStability(stability) {
        this.climateStability = Math.max(0, Math.min(2, stability));
    }
}

// Create singleton instance
const weatherSystem = new WeatherSystem();

export { weatherSystem, WEATHER_TYPES, SEASONAL_WEATHER_PROBABILITIES };