// js/test-genetics.js
// Script para testar o sistema de genética expandido

import { Genome, createRandomGenome, calculateGeneticColor } from './systems/geneticsSystem.js';

/**
 * Função para testar o sistema de genética expandido
 */
export function testGeneticsSystem() {
    console.log("Iniciando teste do sistema de genética expandido...");
    
    // Teste 1: Criação de genomas aleatórios
    console.log("\n--- Teste 1: Criação de genomas aleatórios ---");
    const plantGenome = createRandomGenome('plant');
    const creatureGenome = createRandomGenome('creature');
    const predatorGenome = createRandomGenome('predator');
    
    console.log("Genoma de planta:", plantGenome);
    console.log("Genoma de criatura:", creatureGenome);
    console.log("Genoma de predador:", predatorGenome);
    
    // Teste 2: Expressão de traços
    console.log("\n--- Teste 2: Expressão de traços ---");
    const plantPhenotype = plantGenome.expressTraits();
    const creaturePhenotype = creatureGenome.expressTraits();
    const predatorPhenotype = predatorGenome.expressTraits();
    
    console.log("Fenótipo de planta:", plantPhenotype);
    console.log("Fenótipo de criatura:", creaturePhenotype);
    console.log("Fenótipo de predador:", predatorPhenotype);
    
    // Teste 3: Cores genéticas
    console.log("\n--- Teste 3: Cores genéticas ---");
    const plantColor = calculateGeneticColor(plantGenome, 'plant');
    const creatureColor = calculateGeneticColor(creatureGenome, 'creature');
    const predatorColor = calculateGeneticColor(predatorGenome, 'predator');
    
    console.log("Cor de planta:", plantColor);
    console.log("Cor de criatura:", creatureColor);
    console.log("Cor de predador:", predatorColor);
    
    // Teste 4: Mutações
    console.log("\n--- Teste 4: Mutações ---");
    const mutationEvents = plantGenome.mutate();
    console.log("Eventos de mutação:", mutationEvents);
    console.log("Genoma após mutação:", plantGenome);
    
    // Teste 5: Combinação de genomas (reprodução)
    console.log("\n--- Teste 5: Combinação de genomas (reprodução) ---");
    const childGenome = plantGenome.combine(createRandomGenome('plant'));
    console.log("Genoma filho:", childGenome);
    console.log("Geração do filho:", childGenome.generation);
    console.log("Histórico de mutações do filho:", childGenome.mutationHistory);
    
    // Teste 6: Compatibilidade genética
    console.log("\n--- Teste 6: Compatibilidade genética ---");
    const genome1 = createRandomGenome('creature');
    const genome2 = createRandomGenome('creature');
    const genome3 = genome1.combine(genome2); // Descendente de genome1 e genome2
    
    const compatibility12 = genome1.calculateCompatibility(genome2);
    const compatibility13 = genome1.calculateCompatibility(genome3);
    
    console.log("Compatibilidade entre genomas não relacionados:", compatibility12);
    console.log("Compatibilidade entre genoma pai e filho:", compatibility13);
    
    console.log("\nTeste do sistema de genética concluído!");
    
    return {
        plantGenome,
        creatureGenome,
        predatorGenome,
        childGenome
    };
}

// Executa o teste se este arquivo for executado diretamente
if (typeof window !== 'undefined' && window.document) {
    window.testGeneticsSystem = testGeneticsSystem;
    console.log("Função de teste disponível como window.testGeneticsSystem()");
}