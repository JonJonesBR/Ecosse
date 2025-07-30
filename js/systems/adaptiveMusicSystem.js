/**
 * Adaptive Music System - Dynamically changes music based on ecosystem state
 * This system analyzes the current ecosystem conditions and selects appropriate music
 */

import { playMusicTrack, stopCurrentMusic, setMusicVolume, getAudioConfig } from '../audioManager.js';
import { getEcosystemElements, getSimulationConfig } from '../simulation.js';
import { eventSystem, EventTypes } from './eventSystem.js';

class AdaptiveMusicSystem {
    constructor() {
        this.currentTrack = null;
        this.currentMood = 'peaceful';
        this.transitionInProgress = false;
        this.analysisInterval = null;
        this.moodHistory = [];
        this.maxMoodHistory = 10;
        this.isInitialized = false;
        
        // Music mood definitions with triggers
        this.musicMoods = {
            peaceful: {
                triggers: {
                    healthRange: [70, 100],
                    biodiversityRange: [3, Infinity],
                    stabilityRange: [70, 100],
                    eventTypes: ['growth', 'harmony', 'prosperity']
                },
                priority: 1,
                description: 'Calm, harmonious ecosystem'
            },
            
            mysterious: {
                triggers: {
                    healthRange: [50, 80],
                    biodiversityRange: [2, 4],
                    stabilityRange: [40, 70],
                    eventTypes: ['discovery', 'evolution', 'unknown']
                },
                priority: 2,
                description: 'Ecosystem in transition or discovery'
            },
            
            dramatic: {
                triggers: {
                    healthRange: [30, 60],
                    biodiversityRange: [1, 3],
                    stabilityRange: [20, 50],
                    eventTypes: ['conflict', 'competition', 'struggle']
                },
                priority: 3,
                description: 'Ecosystem under stress or conflict'
            },
            
            tension: {
                triggers: {
                    healthRange: [10, 40],
                    biodiversityRange: [1, 2],
                    stabilityRange: [10, 30],
                    eventTypes: ['crisis', 'extinction', 'collapse']
                },
                priority: 4,
                description: 'Ecosystem in crisis'
            },
            
            triumphant: {
                triggers: {
                    healthRange: [80, 100],
                    biodiversityRange: [5, Infinity],
                    stabilityRange: [80, 100],
                    eventTypes: ['achievement', 'milestone', 'success']
                },
                priority: 5,
                description: 'Ecosystem thriving and successful'
            },
            
            melancholic: {
                triggers: {
                    healthRange: [0, 30],
                    biodiversityRange: [0, 2],
                    stabilityRange: [0, 20],
                    eventTypes: ['death', 'extinction', 'loss']
                },
                priority: 6,
                description: 'Ecosystem in decline or mourning'
            },
            
            epic: {
                triggers: {
                    healthRange: [60, 100],
                    biodiversityRange: [4, Infinity],
                    stabilityRange: [50, 100],
                    eventTypes: ['evolution', 'expansion', 'transformation']
                },
                priority: 7,
                description: 'Major ecosystem transformation'
            },
            
            ambient: {
                triggers: {
                    healthRange: [40, 70],
                    biodiversityRange: [2, 5],
                    stabilityRange: [30, 70],
                    eventTypes: ['neutral', 'observation', 'contemplation']
                },
                priority: 0,
                description: 'Default atmospheric music'
            }
        };
        
        // Transition rules between moods
        this.transitionRules = {
            peaceful: ['mysterious', 'triumphant', 'ambient'],
            mysterious: ['dramatic', 'peaceful', 'epic'],
            dramatic: ['tension', 'mysterious', 'melancholic'],
            tension: ['melancholic', 'dramatic', 'triumphant'],
            triumphant: ['peaceful', 'epic', 'mysterious'],
            melancholic: ['ambient', 'peaceful', 'mysterious'],
            epic: ['triumphant', 'dramatic', 'peaceful'],
            ambient: ['peaceful', 'mysterious', 'dramatic']
        };
        
        // Music layers for dynamic mixing
        this.musicLayers = {
            base: null,      // Base atmospheric layer
            melody: null,    // Main melody layer
            percussion: null, // Rhythm layer
            harmony: null    // Harmonic layer
        };
        
        // Dynamic music parameters
        this.musicParameters = {
            tempo: 1.0,      // Playback speed multiplier
            volume: 1.0,     // Volume multiplier
            intensity: 0.5,  // Overall intensity (0-1)
            complexity: 0.5  // Musical complexity (0-1)
        };
    }
    
    /**
     * Initialize the adaptive music system
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Adaptive Music System...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start periodic analysis
        this.startPeriodicAnalysis();
        
        // Initialize with ambient music
        this.currentMood = 'ambient';
        this.playCurrentMood();
        
        this.isInitialized = true;
        console.log('✅ Adaptive Music System initialized');
    }
    
    /**
     * Set up event listeners for ecosystem changes
     */
    setupEventListeners() {
        // Listen for significant ecosystem events
        eventSystem.subscribe(EventTypes.ELEMENT_CREATED, (data) => {
            this.handleEcosystemEvent('growth', data);
        });
        
        eventSystem.subscribe(EventTypes.ELEMENT_REMOVED, (data) => {
            this.handleEcosystemEvent('loss', data);
        });
        
        eventSystem.subscribe(EventTypes.WEATHER_CHANGED, (data) => {
            this.handleWeatherEvent(data);
        });
        
        eventSystem.subscribe(EventTypes.POPULATION_CHANGE, (data) => {
            this.handlePopulationEvent(data);
        });
        
        eventSystem.subscribe(EventTypes.ACHIEVEMENT_UNLOCKED, (data) => {
            this.handleEcosystemEvent('achievement', data);
        });
        
        eventSystem.subscribe(EventTypes.ECOSYSTEM_CRISIS, (data) => {
            this.handleEcosystemEvent('crisis', data);
        });
    }
    
    /**
     * Start periodic ecosystem analysis for music adaptation
     */
    startPeriodicAnalysis() {
        // Analyze ecosystem every 10 seconds
        this.analysisInterval = setInterval(() => {
            this.analyzeEcosystemAndAdaptMusic();
        }, 10000);
    }
    
    /**
     * Stop periodic analysis
     */
    stopPeriodicAnalysis() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }
    
    /**
     * Analyze current ecosystem state and adapt music accordingly
     */
    analyzeEcosystemAndAdaptMusic() {
        try {
            const elements = getEcosystemElements();
            const config = getSimulationConfig();
            
            if (!elements || elements.length === 0) {
                this.transitionToMood('ambient');
                return;
            }
            
            // Calculate ecosystem metrics
            const metrics = this.calculateEcosystemMetrics(elements, config);
            
            // Determine appropriate mood
            const newMood = this.determineMoodFromMetrics(metrics);
            
            // Update music parameters based on metrics
            this.updateMusicParameters(metrics);
            
            // Transition to new mood if different
            if (newMood !== this.currentMood) {
                this.transitionToMood(newMood);
            }
            
            // Log analysis for debugging
            console.log(`Music Analysis: Health=${metrics.health.toFixed(1)}%, Biodiversity=${metrics.biodiversity}, Mood=${newMood}`);
            
        } catch (error) {
            console.warn('Error in music analysis:', error);
        }
    }
    
    /**
     * Calculate ecosystem metrics for music adaptation
     */
    calculateEcosystemMetrics(elements, config) {
        const totalElements = elements.length;
        const speciesCount = new Set(elements.map(el => el.type)).size;
        
        // Calculate average health
        const avgHealth = elements.reduce((sum, el) => sum + (el.health || 100), 0) / totalElements;
        
        // Calculate stability (based on health variance)
        const healthVariance = elements.reduce((sum, el) => 
            sum + Math.pow((el.health || 100) - avgHealth, 2), 0) / totalElements;
        const stability = Math.max(0, 100 - Math.sqrt(healthVariance));
        
        // Calculate activity level (based on recent changes)
        const youngElements = elements.filter(el => (el.age || 0) < 10).length;
        const activityLevel = (youngElements / totalElements) * 100;
        
        // Calculate environmental stress
        const tempStress = Math.abs((config.temperature || 25) - 25) / 25;
        const waterStress = Math.abs((config.waterPresence || 50) - 50) / 50;
        const environmentalStress = (tempStress + waterStress) * 50;
        
        // Calculate population density
        const density = totalElements / 1000; // Assuming 1000 unit area
        
        return {
            health: avgHealth,
            biodiversity: speciesCount,
            stability: stability,
            activity: activityLevel,
            environmentalStress: environmentalStress,
            density: density,
            totalPopulation: totalElements
        };
    }
    
    /**
     * Determine appropriate mood based on ecosystem metrics
     */
    determineMoodFromMetrics(metrics) {
        const candidates = [];
        
        // Check each mood against its triggers
        Object.entries(this.musicMoods).forEach(([mood, config]) => {
            const triggers = config.triggers;
            let score = 0;
            
            // Check health range
            if (metrics.health >= triggers.healthRange[0] && 
                metrics.health <= triggers.healthRange[1]) {
                score += 3;
            }
            
            // Check biodiversity range
            if (metrics.biodiversity >= triggers.biodiversityRange[0] && 
                metrics.biodiversity <= triggers.biodiversityRange[1]) {
                score += 2;
            }
            
            // Check stability range
            if (metrics.stability >= triggers.stabilityRange[0] && 
                metrics.stability <= triggers.stabilityRange[1]) {
                score += 2;
            }
            
            // Add environmental factors
            if (metrics.environmentalStress < 20) score += 1;
            if (metrics.activity > 50) score += 1;
            
            if (score > 0) {
                candidates.push({
                    mood: mood,
                    score: score,
                    priority: config.priority
                });
            }
        });
        
        // Sort by score and priority
        candidates.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return b.priority - a.priority;
        });
        
        // Return best candidate or current mood if no good match
        return candidates.length > 0 ? candidates[0].mood : this.currentMood;
    }
    
    /**
     * Update music parameters based on ecosystem metrics
     */
    updateMusicParameters(metrics) {
        // Adjust tempo based on activity level
        this.musicParameters.tempo = 0.8 + (metrics.activity / 100) * 0.4; // 0.8 to 1.2
        
        // Adjust volume based on population density
        this.musicParameters.volume = Math.min(1.0, 0.6 + (metrics.density * 0.4));
        
        // Adjust intensity based on environmental stress
        this.musicParameters.intensity = Math.min(1.0, 0.3 + (metrics.environmentalStress / 100) * 0.7);
        
        // Adjust complexity based on biodiversity
        this.musicParameters.complexity = Math.min(1.0, metrics.biodiversity / 10);
        
        // Apply parameters to current music
        this.applyMusicParameters();
    }
    
    /**
     * Apply current music parameters to playing tracks
     */
    applyMusicParameters() {
        const audioConfig = getAudioConfig();
        const adjustedVolume = audioConfig.musicVolume * this.musicParameters.volume;
        
        setMusicVolume(adjustedVolume);
        
        // Note: Tempo and other parameters would require Web Audio API implementation
        // This is a simplified version focusing on volume adjustment
    }
    
    /**
     * Handle ecosystem events that should trigger immediate music changes
     */
    handleEcosystemEvent(eventType, data) {
        const eventMoodMap = {
            growth: 'peaceful',
            loss: 'melancholic',
            achievement: 'triumphant',
            crisis: 'tension',
            discovery: 'mysterious',
            evolution: 'epic'
        };
        
        const suggestedMood = eventMoodMap[eventType];
        if (suggestedMood && this.canTransitionTo(suggestedMood)) {
            this.transitionToMood(suggestedMood);
        }
    }
    
    /**
     * Handle weather events
     */
    handleWeatherEvent(data) {
        const weatherMoodMap = {
            storm: 'dramatic',
            rain: 'melancholic',
            sunshine: 'peaceful',
            wind: 'mysterious'
        };
        
        const suggestedMood = weatherMoodMap[data.type];
        if (suggestedMood && this.canTransitionTo(suggestedMood)) {
            this.transitionToMood(suggestedMood);
        }
    }
    
    /**
     * Handle population change events
     */
    handlePopulationEvent(data) {
        if (data.change > 10) {
            this.transitionToMood('triumphant');
        } else if (data.change < -10) {
            this.transitionToMood('melancholic');
        }
    }
    
    /**
     * Check if transition to a mood is allowed
     */
    canTransitionTo(targetMood) {
        const allowedTransitions = this.transitionRules[this.currentMood] || [];
        return allowedTransitions.includes(targetMood) || targetMood === this.currentMood;
    }
    
    /**
     * Transition to a new mood
     */
    transitionToMood(newMood, forceTransition = false) {
        if (this.transitionInProgress) return;
        if (!forceTransition && !this.canTransitionTo(newMood)) return;
        if (newMood === this.currentMood) return;
        
        console.log(`Music transition: ${this.currentMood} → ${newMood}`);
        
        this.transitionInProgress = true;
        
        // Add to mood history
        this.moodHistory.push({
            mood: this.currentMood,
            timestamp: Date.now(),
            reason: 'ecosystem_analysis'
        });
        
        // Limit history size
        if (this.moodHistory.length > this.maxMoodHistory) {
            this.moodHistory.shift();
        }
        
        // Perform transition
        this.performMoodTransition(newMood);
    }
    
    /**
     * Perform the actual mood transition
     */
    performMoodTransition(newMood) {
        // Stop current music with fade out
        stopCurrentMusic(true);
        
        // Wait for fade out, then start new music
        setTimeout(() => {
            this.currentMood = newMood;
            this.playCurrentMood();
            this.transitionInProgress = false;
        }, 2000); // Wait for fade out to complete
    }
    
    /**
     * Play music for current mood
     */
    playCurrentMood() {
        playMusicTrack(this.currentMood, true);
        this.applyMusicParameters();
    }
    
    /**
     * Force a specific mood (for testing or special events)
     */
    forceMood(mood, duration = null) {
        if (!this.musicMoods[mood]) {
            console.warn(`Unknown mood: ${mood}`);
            return;
        }
        
        this.transitionToMood(mood, true);
        
        if (duration) {
            setTimeout(() => {
                this.analyzeEcosystemAndAdaptMusic();
            }, duration);
        }
    }
    
    /**
     * Get current music state
     */
    getCurrentState() {
        return {
            currentMood: this.currentMood,
            parameters: { ...this.musicParameters },
            moodHistory: [...this.moodHistory],
            transitionInProgress: this.transitionInProgress
        };
    }
    
    /**
     * Get available moods and their descriptions
     */
    getAvailableMoods() {
        const moods = {};
        Object.entries(this.musicMoods).forEach(([mood, config]) => {
            moods[mood] = config.description;
        });
        return moods;
    }
    
    /**
     * Cleanup and stop the adaptive music system
     */
    cleanup() {
        this.stopPeriodicAnalysis();
        stopCurrentMusic(true);
        this.isInitialized = false;
        console.log('Adaptive Music System cleaned up');
    }
}

// Create and export singleton instance
export const adaptiveMusicSystem = new AdaptiveMusicSystem();

// Export for debugging and testing
export { AdaptiveMusicSystem };