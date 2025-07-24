// js/systems/geneticsSystem.js
// Sistema de genética expandido para o Ecosse

import { publish, EventTypes } from './eventSystem.js';
import { info, warning } from './loggingSystem.js';

/**
 * Classe Genome - Representa o genoma de um elemento do ecossistema
 * Implementa um sistema de genética com múltiplos traços, herança e mutação
 */
export class Genome {
    /**
     * Cria um novo genoma
     * @param {Object} traits - Objeto com os traços genéticos iniciais
     * @param {Object} options - Opções de configuração do genoma
     */
    constructor(traits = {}, options = {}) {
        // Traços genéticos (pares de alelos)
        this.traits = {
            // Traços físicos
            size: traits.size || { dominant: 1.0, recessive: 0.8 },
            color: traits.color || { dominant: 1.0, recessive: 0.8 },
            bodyShape: traits.bodyShape || { dominant: 1.0, recessive: 0.8 }, // Novo: forma do corpo
            skinTexture: traits.skinTexture || { dominant: 1.0, recessive: 0.8 }, // Novo: textura da pele/superfície
            
            // Traços comportamentais
            speed: traits.speed || { dominant: 1.0, recessive: 0.8 },
            aggressiveness: traits.aggressiveness || { dominant: 0.5, recessive: 0.3 },
            intelligence: traits.intelligence || { dominant: 0.5, recessive: 0.3 }, // Novo: inteligência
            socialBehavior: traits.socialBehavior || { dominant: 0.5, recessive: 0.3 }, // Novo: comportamento social
            
            // Traços de sobrevivência
            metabolismRate: traits.metabolismRate || { dominant: 1.0, recessive: 0.8 },
            reproductionChance: traits.reproductionChance || { dominant: 1.0, recessive: 0.8 },
            lifespan: traits.lifespan || { dominant: 1.0, recessive: 0.8 }, // Novo: expectativa de vida
            immuneSystem: traits.immuneSystem || { dominant: 1.0, recessive: 0.8 }, // Novo: sistema imunológico
            
            // Traços de adaptação
            temperatureTolerance: traits.temperatureTolerance || { dominant: 1.0, recessive: 0.8 },
            waterDependency: traits.waterDependency || { dominant: 1.0, recessive: 0.8 },
            radiationResistance: traits.radiationResistance || { dominant: 0.5, recessive: 0.3 }, // Novo: resistência à radiação
            toxinResistance: traits.toxinResistance || { dominant: 0.5, recessive: 0.3 }, // Novo: resistência a toxinas
            
            // Traços especiais
            specialAbility: traits.specialAbility || { dominant: null, recessive: null },
            camouflage: traits.camouflage || { dominant: 0.0, recessive: 0.0 }, // Novo: camuflagem
            nightVision: traits.nightVision || { dominant: 0.0, recessive: 0.0 }, // Novo: visão noturna
            regeneration: traits.regeneration || { dominant: 0.0, recessive: 0.0 } // Novo: regeneração
        };
        
        // Configurações do genoma
        this.baseMutationRate = options.mutationRate || 0.05; // Taxa base de mutação (5%)
        this.mutationIntensity = options.mutationIntensity || 0.2; // Intensidade da mutação (20%)
        this.expressionStrength = options.expressionStrength || 1.0; // Força de expressão dos genes
        
        // Novo: Histórico de mutações para rastreamento de linhagem
        this.mutationHistory = options.mutationHistory || [];
        
        // Novo: Geração do organismo (para rastreamento evolutivo)
        this.generation = options.generation || 1;
    }
    
    /**
     * Combina este genoma com outro para criar um descendente
     * @param {Genome} otherGenome - O genoma do outro progenitor
     * @returns {Genome} Um novo genoma resultante da combinação
     */
    combine(otherGenome) {
        const childTraits = {};
        const mutationEvents = [];
        
        // Para cada traço, seleciona aleatoriamente entre dominante e recessivo de cada progenitor
        for (const traitName in this.traits) {
            if (!otherGenome.traits[traitName]) continue;
            
            // Seleciona aleatoriamente um alelo de cada progenitor
            // Implementação melhorada de herança mendeliana
            const thisAllele = Math.random() < 0.5 ? 'dominant' : 'recessive';
            const otherAllele = Math.random() < 0.5 ? 'dominant' : 'recessive';
            
            // Cria o par de alelos para o filho
            childTraits[traitName] = {
                dominant: this.traits[traitName][thisAllele],
                recessive: otherGenome.traits[traitName][otherAllele]
            };
            
            // Chance de crossover (recombinação genética) - 10%
            if (Math.random() < 0.1) {
                // Troca parcial de informação genética entre alelos
                const crossoverAmount = Math.random() * 0.3; // 0-30% de mistura
                const originalDominant = childTraits[traitName].dominant;
                const originalRecessive = childTraits[traitName].recessive;
                
                if (typeof originalDominant === 'number' && typeof originalRecessive === 'number') {
                    childTraits[traitName].dominant = originalDominant * (1 - crossoverAmount) + originalRecessive * crossoverAmount;
                    childTraits[traitName].recessive = originalRecessive * (1 - crossoverAmount) + originalDominant * crossoverAmount;
                    
                    // Registra evento de crossover
                    mutationEvents.push({
                        type: 'crossover',
                        trait: traitName,
                        amount: crossoverAmount
                    });
                }
            }
            
            // Se o alelo dominante for menor que o recessivo, inverte-os
            // (por convenção, o dominante deve ter valor maior ou igual)
            if (typeof childTraits[traitName].dominant === 'number' && 
                typeof childTraits[traitName].recessive === 'number' &&
                childTraits[traitName].dominant < childTraits[traitName].recessive) {
                const temp = childTraits[traitName].dominant;
                childTraits[traitName].dominant = childTraits[traitName].recessive;
                childTraits[traitName].recessive = temp;
            }
        }
        
        // Cria um novo genoma com os traços combinados
        const childGenome = new Genome(childTraits, {
            mutationRate: (this.baseMutationRate + otherGenome.baseMutationRate) / 2,
            mutationIntensity: (this.mutationIntensity + otherGenome.mutationIntensity) / 2,
            expressionStrength: (this.expressionStrength + otherGenome.expressionStrength) / 2,
            generation: Math.max(this.generation, otherGenome.generation) + 1, // Incrementa a geração
            mutationHistory: [...this.mutationHistory] // Copia o histórico de mutações do primeiro progenitor
        });
        
        // Adiciona eventos de crossover ao histórico de mutações
        childGenome.mutationHistory = [...childGenome.mutationHistory, ...mutationEvents];
        
        // Aplica mutações ao genoma do filho
        childGenome.mutate();
        
        // Publica evento de reprodução
        publish(EventTypes.GENETIC_REPRODUCTION, {
            parent1Traits: this.traits,
            parent2Traits: otherGenome.traits,
            childTraits: childGenome.traits,
            crossoverEvents: mutationEvents,
            generation: childGenome.generation
        });
        
        return childGenome;
    }
    
    /**
     * Aplica mutações aleatórias ao genoma
     */
    mutate() {
        const mutationEvents = [];
        
        for (const traitName in this.traits) {
            // Tipos de mutação possíveis
            const mutationTypes = {
                POINT: 0.85,    // Mutação pontual - pequena alteração no valor
                JUMP: 0.10,     // Mutação de salto - alteração maior no valor
                ACTIVATION: 0.03, // Ativação de gene inativo (para traços especiais)
                DEACTIVATION: 0.02 // Desativação de gene ativo (raro)
            };
            
            // Chance de mutação para o alelo dominante
            if (Math.random() < this.baseMutationRate) {
                // Determina o tipo de mutação
                const mutationType = this.determineMutationType(mutationTypes);
                let mutationAmount = 0;
                let oldValue = this.traits[traitName].dominant;
                
                // Aplica a mutação com base no tipo
                if (typeof oldValue === 'number') {
                    switch (mutationType) {
                        case 'POINT':
                            // Mutação pontual - pequena alteração
                            mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                            this.traits[traitName].dominant = Math.max(0.1, oldValue + mutationAmount);
                            break;
                            
                        case 'JUMP':
                            // Mutação de salto - alteração maior
                            mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity * 3;
                            this.traits[traitName].dominant = Math.max(0.1, oldValue + mutationAmount);
                            break;
                            
                        case 'ACTIVATION':
                            // Ativação de gene inativo (principalmente para traços especiais)
                            if (oldValue === 0 && ['camouflage', 'nightVision', 'regeneration'].includes(traitName)) {
                                this.traits[traitName].dominant = 0.3 + Math.random() * 0.7;
                                mutationAmount = this.traits[traitName].dominant;
                            } else {
                                // Aplica mutação pontual se não for um traço especial
                                mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                                this.traits[traitName].dominant = Math.max(0.1, oldValue + mutationAmount);
                            }
                            break;
                            
                        case 'DEACTIVATION':
                            // Desativação de gene ativo (principalmente para traços especiais)
                            if (oldValue > 0 && ['camouflage', 'nightVision', 'regeneration'].includes(traitName)) {
                                mutationAmount = -oldValue;
                                this.traits[traitName].dominant = 0;
                            } else {
                                // Aplica mutação pontual se não for um traço especial
                                mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                                this.traits[traitName].dominant = Math.max(0.1, oldValue + mutationAmount);
                            }
                            break;
                    }
                    
                    // Registra o evento de mutação
                    const mutationEvent = {
                        trait: traitName,
                        allele: 'dominant',
                        oldValue: oldValue,
                        newValue: this.traits[traitName].dominant,
                        mutationAmount: mutationAmount,
                        mutationType: mutationType,
                        generation: this.generation
                    };
                    
                    mutationEvents.push(mutationEvent);
                    
                    // Publica evento de mutação
                    publish(EventTypes.MUTATION_OCCURRED, mutationEvent);
                }
            }
            
            // Chance de mutação para o alelo recessivo
            if (Math.random() < this.baseMutationRate) {
                // Determina o tipo de mutação
                const mutationType = this.determineMutationType(mutationTypes);
                let mutationAmount = 0;
                let oldValue = this.traits[traitName].recessive;
                
                // Aplica a mutação com base no tipo
                if (typeof oldValue === 'number') {
                    switch (mutationType) {
                        case 'POINT':
                            // Mutação pontual - pequena alteração
                            mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                            this.traits[traitName].recessive = Math.max(0.1, oldValue + mutationAmount);
                            break;
                            
                        case 'JUMP':
                            // Mutação de salto - alteração maior
                            mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity * 3;
                            this.traits[traitName].recessive = Math.max(0.1, oldValue + mutationAmount);
                            break;
                            
                        case 'ACTIVATION':
                            // Ativação de gene inativo (principalmente para traços especiais)
                            if (oldValue === 0 && ['camouflage', 'nightVision', 'regeneration'].includes(traitName)) {
                                this.traits[traitName].recessive = 0.2 + Math.random() * 0.5;
                                mutationAmount = this.traits[traitName].recessive;
                            } else {
                                // Aplica mutação pontual se não for um traço especial
                                mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                                this.traits[traitName].recessive = Math.max(0.1, oldValue + mutationAmount);
                            }
                            break;
                            
                        case 'DEACTIVATION':
                            // Desativação de gene ativo (principalmente para traços especiais)
                            if (oldValue > 0 && ['camouflage', 'nightVision', 'regeneration'].includes(traitName)) {
                                mutationAmount = -oldValue;
                                this.traits[traitName].recessive = 0;
                            } else {
                                // Aplica mutação pontual se não for um traço especial
                                mutationAmount = (Math.random() * 2 - 1) * this.mutationIntensity;
                                this.traits[traitName].recessive = Math.max(0.1, oldValue + mutationAmount);
                            }
                            break;
                    }
                    
                    // Registra o evento de mutação
                    const mutationEvent = {
                        trait: traitName,
                        allele: 'recessive',
                        oldValue: oldValue,
                        newValue: this.traits[traitName].recessive,
                        mutationAmount: mutationAmount,
                        mutationType: mutationType,
                        generation: this.generation
                    };
                    
                    mutationEvents.push(mutationEvent);
                    
                    // Publica evento de mutação
                    publish(EventTypes.MUTATION_OCCURRED, mutationEvent);
                }
            }
            
            // Garante que o alelo dominante seja sempre maior ou igual ao recessivo
            if (typeof this.traits[traitName].dominant === 'number' && 
                typeof this.traits[traitName].recessive === 'number' &&
                this.traits[traitName].dominant < this.traits[traitName].recessive) {
                const temp = this.traits[traitName].dominant;
                this.traits[traitName].dominant = this.traits[traitName].recessive;
                this.traits[traitName].recessive = temp;
            }
        }
        
        // Adiciona os eventos de mutação ao histórico
        this.mutationHistory = [...this.mutationHistory, ...mutationEvents];
        
        return mutationEvents;
    }
    
    /**
     * Determina o tipo de mutação com base nas probabilidades
     * @param {Object} mutationTypes - Objeto com tipos de mutação e suas probabilidades
     * @returns {string} O tipo de mutação selecionado
     */
    determineMutationType(mutationTypes) {
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const type in mutationTypes) {
            cumulativeProbability += mutationTypes[type];
            if (random < cumulativeProbability) {
                return type;
            }
        }
        
        // Fallback para mutação pontual
        return 'POINT';
    }
    
    /**
     * Expressa os genes em características fenotípicas
     * @returns {Object} Objeto com os traços fenotípicos expressos
     */
    expressTraits() {
        const phenotype = {};
        
        for (const traitName in this.traits) {
            // Calcula o valor expresso com base nos alelos e na força de expressão
            if (typeof this.traits[traitName].dominant === 'number' && 
                typeof this.traits[traitName].recessive === 'number') {
                // Expressão ponderada: 70% do dominante + 30% do recessivo
                phenotype[traitName] = (
                    this.traits[traitName].dominant * 0.7 + 
                    this.traits[traitName].recessive * 0.3
                ) * this.expressionStrength;
            } 
            // Para traços não numéricos (como habilidades especiais), usa o dominante
            else if (this.traits[traitName].dominant !== null) {
                phenotype[traitName] = this.traits[traitName].dominant;
            }
            // Se ambos forem null, não expressa o traço
        }
        
        return phenotype;
    }
    
    /**
     * Calcula a compatibilidade genética com outro genoma
     * Útil para determinar a viabilidade da reprodução
     * @param {Genome} otherGenome - O genoma para comparar
     * @returns {number} Valor de 0 a 1 representando a compatibilidade
     */
    calculateCompatibility(otherGenome) {
        if (!otherGenome || !otherGenome.traits) return 0;
        
        let totalDifference = 0;
        let traitCount = 0;
        
        for (const traitName in this.traits) {
            if (!otherGenome.traits[traitName]) continue;
            
            if (typeof this.traits[traitName].dominant === 'number' && 
                typeof otherGenome.traits[traitName].dominant === 'number') {
                // Calcula a diferença média entre os alelos
                const diff1 = Math.abs(this.traits[traitName].dominant - otherGenome.traits[traitName].dominant);
                const diff2 = Math.abs(this.traits[traitName].recessive - otherGenome.traits[traitName].recessive);
                totalDifference += (diff1 + diff2) / 2;
                traitCount++;
            }
        }
        
        if (traitCount === 0) return 0.5; // Valor padrão se não houver traços comparáveis
        
        // Converte a diferença em compatibilidade (menor diferença = maior compatibilidade)
        const avgDifference = totalDifference / traitCount;
        return Math.max(0, 1 - avgDifference);
    }
    
    /**
     * Cria uma representação visual do genoma para depuração
     * @returns {string} Representação em string do genoma
     */
    toString() {
        let result = "Genome:\n";
        for (const traitName in this.traits) {
            result += `  ${traitName}: D=${this.traits[traitName].dominant}, R=${this.traits[traitName].recessive}\n`;
        }
        return result;
    }
}

/**
 * Cria um genoma aleatório para um tipo específico de elemento
 * @param {string} elementType - O tipo de elemento ('plant', 'creature', etc.)
 * @returns {Genome} Um novo genoma com valores apropriados para o tipo
 */
export function createRandomGenome(elementType) {
    switch (elementType) {
        case 'plant':
            return new Genome({
                // Traços físicos
                size: { dominant: 0.8 + Math.random() * 0.4, recessive: 0.6 + Math.random() * 0.4 },
                color: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.5 },
                bodyShape: { dominant: 0.3 + Math.random() * 0.7, recessive: 0.2 + Math.random() * 0.5 }, // Forma da planta (0=compacta, 1=espalhada)
                skinTexture: { dominant: 0.2 + Math.random() * 0.8, recessive: 0.1 + Math.random() * 0.6 }, // Textura da folha (0=lisa, 1=rugosa)
                
                // Traços de sobrevivência
                reproductionChance: { dominant: 0.004 + Math.random() * 0.003, recessive: 0.002 + Math.random() * 0.002 },
                lifespan: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.4 }, // Longevidade
                immuneSystem: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 }, // Resistência a doenças
                
                // Traços de adaptação
                waterDependency: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.4 },
                temperatureTolerance: { dominant: 0.6 + Math.random() * 0.8, recessive: 0.4 + Math.random() * 0.6 },
                radiationResistance: { dominant: 0.4 + Math.random() * 0.6, recessive: 0.2 + Math.random() * 0.4 },
                toxinResistance: { dominant: 0.5 + Math.random() * 0.5, recessive: 0.3 + Math.random() * 0.4 },
                
                // Traços especiais (chance pequena de ter)
                camouflage: { dominant: Math.random() < 0.1 ? 0.5 + Math.random() * 0.5 : 0, recessive: 0 }, // Camuflagem
                regeneration: { dominant: Math.random() < 0.05 ? 0.3 + Math.random() * 0.7 : 0, recessive: 0 } // Regeneração rápida
            }, {
                mutationRate: 0.05 + Math.random() * 0.03, // Taxa de mutação variável
                mutationIntensity: 0.15 + Math.random() * 0.15 // Intensidade de mutação variável
            });
            
        case 'creature':
            return new Genome({
                // Traços físicos
                size: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.4 },
                color: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.5 },
                bodyShape: { dominant: 0.4 + Math.random() * 0.6, recessive: 0.3 + Math.random() * 0.4 }, // Forma do corpo
                skinTexture: { dominant: 0.3 + Math.random() * 0.7, recessive: 0.2 + Math.random() * 0.5 }, // Textura da pele
                
                // Traços comportamentais
                speed: { dominant: 1.5 + Math.random() * 1.0, recessive: 1.0 + Math.random() * 0.8 },
                aggressiveness: { dominant: 0.3 + Math.random() * 0.4, recessive: 0.1 + Math.random() * 0.3 },
                intelligence: { dominant: 0.4 + Math.random() * 0.4, recessive: 0.2 + Math.random() * 0.3 }, // Inteligência
                socialBehavior: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 }, // Comportamento social
                
                // Traços de sobrevivência
                metabolismRate: { dominant: 0.8 + Math.random() * 0.4, recessive: 0.6 + Math.random() * 0.3 },
                reproductionChance: { dominant: 0.002 + Math.random() * 0.001, recessive: 0.001 + Math.random() * 0.001 },
                lifespan: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 }, // Longevidade
                immuneSystem: { dominant: 0.5 + Math.random() * 0.5, recessive: 0.3 + Math.random() * 0.4 }, // Sistema imunológico
                
                // Traços de adaptação
                waterDependency: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 },
                temperatureTolerance: { dominant: 0.7 + Math.random() * 0.6, recessive: 0.5 + Math.random() * 0.4 },
                radiationResistance: { dominant: 0.3 + Math.random() * 0.4, recessive: 0.2 + Math.random() * 0.3 },
                toxinResistance: { dominant: 0.4 + Math.random() * 0.4, recessive: 0.2 + Math.random() * 0.3 },
                
                // Traços especiais (chance pequena de ter)
                camouflage: { dominant: Math.random() < 0.08 ? 0.4 + Math.random() * 0.6 : 0, recessive: 0 }, // Camuflagem
                nightVision: { dominant: Math.random() < 0.1 ? 0.5 + Math.random() * 0.5 : 0, recessive: 0 }, // Visão noturna
                regeneration: { dominant: Math.random() < 0.03 ? 0.3 + Math.random() * 0.5 : 0, recessive: 0 } // Regeneração
            }, {
                mutationRate: 0.04 + Math.random() * 0.04, // Taxa de mutação variável
                mutationIntensity: 0.18 + Math.random() * 0.12 // Intensidade de mutação variável
            });
            
        case 'predator':
            return new Genome({
                // Traços físicos
                size: { dominant: 1.0 + Math.random() * 0.5, recessive: 0.8 + Math.random() * 0.4 },
                color: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 },
                bodyShape: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 }, // Forma do corpo (mais musculoso)
                skinTexture: { dominant: 0.5 + Math.random() * 0.5, recessive: 0.3 + Math.random() * 0.4 }, // Textura da pele (mais resistente)
                
                // Traços comportamentais
                speed: { dominant: 2.0 + Math.random() * 1.5, recessive: 1.5 + Math.random() * 1.0 },
                aggressiveness: { dominant: 0.7 + Math.random() * 0.3, recessive: 0.5 + Math.random() * 0.3 },
                intelligence: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 }, // Inteligência (maior para caça)
                socialBehavior: { dominant: 0.4 + Math.random() * 0.6, recessive: 0.2 + Math.random() * 0.4 }, // Comportamento social (varia entre solitário e em grupo)
                
                // Traços de sobrevivência
                metabolismRate: { dominant: 1.0 + Math.random() * 0.5, recessive: 0.8 + Math.random() * 0.4 },
                reproductionChance: { dominant: 0.001 + Math.random() * 0.0005, recessive: 0.0005 + Math.random() * 0.0005 },
                lifespan: { dominant: 0.7 + Math.random() * 0.3, recessive: 0.5 + Math.random() * 0.3 }, // Longevidade
                immuneSystem: { dominant: 0.7 + Math.random() * 0.3, recessive: 0.5 + Math.random() * 0.3 }, // Sistema imunológico forte
                
                // Traços de adaptação
                waterDependency: { dominant: 0.5 + Math.random() * 0.3, recessive: 0.3 + Math.random() * 0.3 },
                temperatureTolerance: { dominant: 0.8 + Math.random() * 0.4, recessive: 0.6 + Math.random() * 0.3 },
                radiationResistance: { dominant: 0.4 + Math.random() * 0.3, recessive: 0.3 + Math.random() * 0.2 },
                toxinResistance: { dominant: 0.6 + Math.random() * 0.4, recessive: 0.4 + Math.random() * 0.3 },
                
                // Traços especiais (chance maior de ter)
                camouflage: { dominant: Math.random() < 0.15 ? 0.6 + Math.random() * 0.4 : 0, recessive: 0 }, // Camuflagem para caça
                nightVision: { dominant: Math.random() < 0.25 ? 0.7 + Math.random() * 0.3 : 0, recessive: 0 }, // Visão noturna para caça
                regeneration: { dominant: Math.random() < 0.05 ? 0.4 + Math.random() * 0.4 : 0, recessive: 0 } // Regeneração
            }, {
                mutationRate: 0.03 + Math.random() * 0.03, // Taxa de mutação variável
                mutationIntensity: 0.15 + Math.random() * 0.1 // Intensidade de mutação variável
            });
            
        default:
            // Genoma genérico para outros tipos
            return new Genome();
    }
}

/**
 * Calcula a cor visual baseada no genoma
 * @param {Genome} genome - O genoma do elemento
 * @param {string} elementType - O tipo de elemento
 * @returns {string} Código de cor em formato rgba
 */
export function calculateGeneticColor(genome, elementType) {
    if (!genome || !genome.traits) return null;
    
    const phenotype = genome.expressTraits();
    
    // Função para aplicar variação de cor baseada em traços especiais
    const applySpecialTraits = (baseColor) => {
        // Converte a cor base para componentes RGB
        const rgbMatch = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (!rgbMatch) return baseColor;
        
        let [_, r, g, b, a] = rgbMatch.map(Number);
        
        // Aplica efeitos de camuflagem (torna a cor mais próxima do ambiente)
        if (phenotype.camouflage && phenotype.camouflage > 0) {
            // Efeito de camuflagem: mistura com tons de verde/marrom
            const camouflageStrength = phenotype.camouflage;
            const envR = elementType === 'plant' ? 30 : 80; // Tom de ambiente (marrom)
            const envG = elementType === 'plant' ? 100 : 70; // Tom de ambiente (verde)
            const envB = elementType === 'plant' ? 10 : 30; // Tom de ambiente (marrom)
            
            r = Math.floor(r * (1 - camouflageStrength) + envR * camouflageStrength);
            g = Math.floor(g * (1 - camouflageStrength) + envG * camouflageStrength);
            b = Math.floor(b * (1 - camouflageStrength) + envB * camouflageStrength);
        }
        
        // Aplica efeitos de visão noturna (tons mais escuros com toques de azul)
        if (phenotype.nightVision && phenotype.nightVision > 0) {
            const nightVisionStrength = phenotype.nightVision;
            b = Math.min(255, b + Math.floor(nightVisionStrength * 40)); // Aumenta o azul
            r = Math.max(0, r - Math.floor(nightVisionStrength * 20)); // Reduz o vermelho
        }
        
        // Aplica efeitos de regeneração (tons mais vibrantes)
        if (phenotype.regeneration && phenotype.regeneration > 0) {
            const regenStrength = phenotype.regeneration;
            const saturationBoost = 1 + regenStrength * 0.3;
            
            // Aumenta a saturação (torna as cores mais vibrantes)
            r = Math.min(255, Math.floor(r * saturationBoost));
            g = Math.min(255, Math.floor(g * saturationBoost));
            b = Math.min(255, Math.floor(b * saturationBoost));
        }
        
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
    
    let baseColor;
    
    switch (elementType) {
        case 'plant':
            // Plantas com variação baseada em múltiplos traços
            const baseGreen = Math.floor(100 + phenotype.color * 155);
            const redTint = Math.floor(phenotype.toxinResistance * 50); // Plantas tóxicas têm tons avermelhados
            const blueTint = Math.floor(phenotype.waterDependency * 30); // Plantas aquáticas têm tons azulados
            
            // Forma do corpo afeta a saturação
            const saturation = 0.7 + phenotype.bodyShape * 0.3;
            
            // Textura da pele afeta a transparência
            const alpha = 0.8 + phenotype.skinTexture * 0.2;
            
            baseColor = `rgba(${redTint}, ${Math.floor(baseGreen * saturation)}, ${blueTint}, ${alpha})`;
            break;
            
        case 'creature':
            // Criaturas com cores mais variadas baseadas em múltiplos traços
            const redBase = Math.floor(150 + phenotype.color * 105);
            const greenBase = Math.floor(100 + phenotype.metabolismRate * 100);
            const blueBase = Math.floor(phenotype.waterDependency * 100); // Criaturas aquáticas são mais azuladas
            
            // Inteligência afeta a saturação
            const intSaturation = 0.8 + phenotype.intelligence * 0.2;
            
            // Comportamento social afeta a transparência (mais sociais são mais visíveis)
            const socialAlpha = 0.7 + phenotype.socialBehavior * 0.3;
            
            baseColor = `rgba(${Math.floor(redBase * intSaturation)}, ${greenBase}, ${blueBase}, ${socialAlpha})`;
            break;
            
        case 'predator':
            // Predadores com cores baseadas em agressividade e outros traços
            const redAggr = Math.floor(100 + phenotype.aggressiveness * 155);
            const greenHunt = Math.floor(30 + phenotype.intelligence * 70); // Predadores mais inteligentes têm mais verde
            const blueSpeed = Math.floor(10 + phenotype.speed * 40); // Predadores mais rápidos têm mais azul
            
            // Forma do corpo afeta a saturação (mais musculosos são mais saturados)
            const bodySaturation = 0.7 + phenotype.bodyShape * 0.3;
            
            baseColor = `rgba(${redAggr}, ${Math.floor(greenHunt * bodySaturation)}, ${blueSpeed}, 0.9)`;
            break;
            
        default:
            return null;
    }
    
    // Aplica efeitos de traços especiais à cor base
    return applySpecialTraits(baseColor);
}
}

/**
 * Registra os tipos de eventos relacionados à genética no sistema de eventos
 */
export function registerGeneticEvents() {
    // Adiciona tipos de eventos relacionados à genética
    EventTypes.MUTATION_OCCURRED = 'mutation_occurred';
    EventTypes.GENETIC_TRAIT_EXPRESSED = 'genetic_trait_expressed';
    EventTypes.GENETIC_COMPATIBILITY_CALCULATED = 'genetic_compatibility_calculated';
    
    // Novos tipos de eventos
    EventTypes.GENETIC_REPRODUCTION = 'genetic_reproduction';
    EventTypes.GENETIC_CROSSOVER = 'genetic_crossover';
    EventTypes.GENETIC_ADAPTATION = 'genetic_adaptation';
    EventTypes.GENETIC_SPECIAL_TRAIT_ACTIVATED = 'genetic_special_trait_activated';
    EventTypes.GENETIC_LINEAGE_TRACKED = 'genetic_lineage_tracked';
}

// Inicializa o sistema de eventos genéticos
registerGeneticEvents();