import { logToObserver } from './utils.js';

// Analysis types configuration
const ANALYSIS_TYPES = {
    basic: {
        name: 'Análise Básica',
        icon: '🔍',
        description: 'Análise geral do ecossistema com recomendações',
        color: 'blue'
    },
    comprehensive: {
        name: 'Análise Abrangente',
        icon: '📊',
        description: 'Relatório completo: biodiversidade, recursos e evolução',
        color: 'purple'
    },
    biodiversity: {
        name: 'Biodiversidade',
        icon: '🌿',
        description: 'Foco na diversidade de espécies e genética',
        color: 'green'
    },
    resources: {
        name: 'Recursos',
        icon: '💧',
        description: 'Análise de sustentabilidade e capacidade de suporte',
        color: 'blue'
    },
    evolution: {
        name: 'Evolução',
        icon: '🧬',
        description: 'Previsões evolutivas e adaptações futuras',
        color: 'orange'
    }
};

function createAnalysisSelector(insightsDiv, config, elements, apiKey, logFn) {
    const selectorHTML = `
        <div class="analysis-selector mb-4">
            <div class="text-sm font-semibold text-gray-300 mb-3">Escolha o tipo de análise:</div>
            <div class="analysis-options grid grid-cols-1 gap-2">
                ${Object.entries(ANALYSIS_TYPES).map(([key, type]) => `
                    <button class="analysis-option-btn" data-analysis-type="${key}">
                        <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-600 hover:border-${type.color}-500">
                            <span class="text-lg">${type.icon}</span>
                            <div class="text-left flex-1">
                                <div class="text-sm font-medium text-${type.color}-400">${type.name}</div>
                                <div class="text-xs text-gray-400">${type.description}</div>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    insightsDiv.innerHTML = selectorHTML;
    
    // Add event listeners
    insightsDiv.querySelectorAll('.analysis-option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const analysisType = btn.dataset.analysisType;
            await executeAnalysis(analysisType, config, elements, apiKey, insightsDiv, logFn);
        });
    });
}

async function executeAnalysis(type, config, elements, apiKey, insightsDiv, logFn) {
    switch (type) {
        case 'basic':
            await askGeminiForEcosystemAnalysis(config, elements, apiKey, insightsDiv, logFn);
            break;
        case 'comprehensive':
            await askGeminiForComprehensiveAnalysis(config, elements, apiKey, insightsDiv, logFn);
            break;
        case 'biodiversity':
            const biodiversityResult = await askGeminiForBiodiversityAnalysis(config, elements, apiKey, logFn);
            displaySingleAnalysis(insightsDiv, 'Análise de Biodiversidade', '🌿', biodiversityResult, 'green');
            break;
        case 'resources':
            const resourceResult = await askGeminiForResourceAnalysis(config, elements, apiKey, logFn);
            displaySingleAnalysis(insightsDiv, 'Análise de Recursos', '💧', resourceResult, 'blue');
            break;
        case 'evolution':
            const evolutionResult = await askGeminiForEvolutionPrediction(config, elements, apiKey, logFn);
            displaySingleAnalysis(insightsDiv, 'Previsão Evolutiva', '🧬', evolutionResult, 'orange');
            break;
    }
}

function displaySingleAnalysis(insightsDiv, title, icon, content, color) {
    insightsDiv.innerHTML = `
        <div class="single-analysis-result">
            <div class="analysis-header mb-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold text-${color}-400">${icon} ${title}</span>
                    <span class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="analysis-content text-sm text-gray-300 leading-relaxed mb-4">
                ${content ? content.replace(/\n/g, '<br>') : 'Análise não disponível'}
            </div>
            
            <div class="analysis-footer pt-3 border-t border-gray-700">
                <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500">Powered by Gemini AI</span>
                    <button id="back-to-selector" class="text-${color}-400 hover:text-${color}-300 transition-colors">
                        ← Outras Análises
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add back button functionality
    const backBtn = insightsDiv.querySelector('#back-to-selector');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // This would need to be called with the current config, elements, etc.
            // For now, we'll just show a simple message
            insightsDiv.innerHTML = `
                <div class="text-center text-gray-400 text-sm">
                    <p>Clique em "Insights Gemini" novamente para ver as opções de análise.</p>
                </div>
            `;
        });
    }
}

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=";

// Main function to initialize enhanced ecosystem analysis
export function initializeEnhancedAnalysis(config, elements, apiKey, insightsDiv, logFn) {
    if (!apiKey) {
        insightsDiv.innerHTML = `
            <div class="text-center text-gray-400 text-sm">
                <p>Configure sua chave API do Gemini para usar as análises avançadas.</p>
            </div>
        `;
        return;
    }
    
    createAnalysisSelector(insightsDiv, config, elements, apiKey, logFn);
}

async function askGemini(prompt, apiKey) {
    if (!apiKey) return null;
    try {
        const response = await fetch(`${API_URL}${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Erro na API Gemini:", error);
        return "Erro ao comunicar com a IA.";
    }
}

export async function askGeminiForEcosystemAnalysis(config, elements, apiKey, insightsDiv, logFn) {
    const elementCounts = {};
    const elementAges = {};
    const elementHealths = {};
    
    elements.forEach(el => {
        elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
        if (!elementAges[el.type]) elementAges[el.type] = [];
        if (!elementHealths[el.type]) elementHealths[el.type] = [];
        elementAges[el.type].push(el.age || 0);
        elementHealths[el.type].push(el.health || 100);
    });
    
    const elementSummary = Object.entries(elementCounts)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ') || 'nenhum';
    
    const totalElements = elements.length;
    const biodiversityIndex = Object.keys(elementCounts).length;
    
    // Calculate ecosystem health indicators
    const plantCount = (elementCounts['Planta'] || 0) + (elementCounts['Árvore'] || 0);
    const animalCount = (elementCounts['Criatura'] || 0) + (elementCounts['Predador'] || 0);
    const waterCount = elementCounts['Água'] || 0;
    const tribeCount = elementCounts['Tribo'] || 0;
    
    // Calculate average ages and health by type
    const avgStats = {};
    Object.keys(elementCounts).forEach(type => {
        const ages = elementAges[type] || [];
        const healths = elementHealths[type] || [];
        avgStats[type] = {
            avgAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0,
            avgHealth: healths.length > 0 ? healths.reduce((a, b) => a + b, 0) / healths.length : 0
        };
    });
    
    // Calculate ecosystem stability metrics
    const totalHealth = elements.reduce((sum, el) => sum + (el.health || 100), 0);
    const avgEcosystemHealth = totalElements > 0 ? totalHealth / totalElements : 0;
    const healthVariance = elements.length > 1 ? 
        elements.reduce((sum, el) => sum + Math.pow((el.health || 100) - avgEcosystemHealth, 2), 0) / elements.length : 0;
    const stabilityIndex = Math.max(0, 100 - Math.sqrt(healthVariance));
    
    // Calculate carrying capacity ratio
    const estimatedCarryingCapacity = Math.floor((config.waterPresence || 50) * (config.temperature > 0 && config.temperature < 40 ? 1 : 0.5) * 10);
    const capacityRatio = estimatedCarryingCapacity > 0 ? (totalElements / estimatedCarryingCapacity) * 100 : 0;
    
    const prompt = `Você é um especialista em ecossistemas planetários com conhecimento avançado em ecologia, biologia e ciências ambientais. Analise detalhadamente o seguinte ecossistema e forneça insights específicos e acionáveis baseados em dados científicos.

**DADOS AMBIENTAIS:**
- Planeta: ${config.planetType}
- Temperatura: ${config.temperature}°C
- Presença de Água: ${config.waterPresence}%
- Luminosidade: ${config.luminosity}x (relativa ao Sol)
- Gravidade: ${config.gravity}x (relativa à Terra)
- Atmosfera: ${config.atmosphere}
- Tipo de Solo: ${config.soilType}
- Minerais: ${config.minerals}

**COMPOSIÇÃO BIOLÓGICA:**
- Total de Elementos: ${totalElements}
- Índice de Biodiversidade: ${biodiversityIndex} espécies diferentes
- Distribuição: ${elementSummary}
- Produtores Primários: ${plantCount} (plantas/árvores)
- Consumidores: ${animalCount} (criaturas/predadores)
- Recursos Hídricos: ${waterCount}
- Civilizações: ${tribeCount} tribos

**MÉTRICAS DE SAÚDE:**
- Saúde Média do Ecossistema: ${avgEcosystemHealth.toFixed(1)}%
- Índice de Estabilidade: ${stabilityIndex.toFixed(1)}%
- Taxa de Ocupação da Capacidade: ${capacityRatio.toFixed(1)}%
- Estatísticas por Espécie: ${Object.entries(avgStats).map(([type, stats]) => 
    `${type} (idade média: ${stats.avgAge.toFixed(1)}, saúde: ${stats.avgHealth.toFixed(1)}%)`).join(', ')}

**ANÁLISE SOLICITADA:**
Forneça uma análise científica detalhada seguindo este formato EXATO:

🔍 **Status Geral**: [Excelente/Boa/Regular/Crítica] - [Justificativa baseada nos dados]

📈 **Tendência Populacional**: [Crescimento Acelerado/Crescimento Estável/Estagnação/Declínio Gradual/Colapso Iminente] - [Análise das métricas]

⚖️ **Equilíbrio Ecológico**: [Análise das relações predador-presa, produtores-consumidores, e disponibilidade de recursos]

⚠️ **Problema Crítico**: [Identifique o desequilíbrio mais urgente com dados específicos]

💡 **Intervenção Recomendada**: [Ação específica com números exatos - ex: "Adicionar 3-5 plantas na região central"]

🔮 **Previsão (próximos 50 ciclos)**: [Cenário mais provável baseado nas tendências atuais]

🎯 **Meta de Otimização**: [Objetivo específico para melhorar o ecossistema]

Seja científico, preciso e baseie todas as recomendações nos dados fornecidos.`;
    
    if (insightsDiv) {
        insightsDiv.innerHTML = `
            <div class="enhanced-analysis-loading">
                <div class="flex items-center gap-2 mb-3">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <span class="text-blue-400 font-semibold">Executando Análise Científica Avançada...</span>
                </div>
                <div class="analysis-progress-bar">
                    <div class="progress-fill animate-pulse" style="width: 60%; background: linear-gradient(90deg, #3b82f6, #1d4ed8);"></div>
                </div>
                <div class="text-xs text-gray-400 mt-2">Processando ${totalElements} elementos em ${biodiversityIndex} espécies...</div>
            </div>
        `;
    }
    
    const insight = await askGemini(prompt, apiKey);
    if (insightsDiv && insight) {
        // Create enhanced visualization with metrics
        const metricsHtml = `
            <div class="ecosystem-metrics-grid mb-4">
                <div class="metric-card">
                    <div class="metric-value">${avgEcosystemHealth.toFixed(1)}%</div>
                    <div class="metric-label">Saúde Média</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${stabilityIndex.toFixed(1)}%</div>
                    <div class="metric-label">Estabilidade</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${biodiversityIndex}</div>
                    <div class="metric-label">Espécies</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${capacityRatio.toFixed(0)}%</div>
                    <div class="metric-label">Capacidade</div>
                </div>
            </div>
        `;
        
        insightsDiv.innerHTML = `
            <div class="enhanced-ecosystem-analysis">
                <div class="analysis-header mb-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-green-400">🔬 Análise Científica Completa</span>
                        <span class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div class="text-xs text-gray-400">Baseada em ${totalElements} elementos analisados</div>
                </div>
                
                ${metricsHtml}
                
                <div class="analysis-content text-sm leading-relaxed mb-4">
                    ${insight ? insight.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : 'Análise não disponível'}
                </div>
                
                <div class="analysis-actions">
                    <button id="refresh-analysis" class="action-btn primary">🔄 Atualizar Análise</button>
                    <button id="export-analysis" class="action-btn secondary">📊 Exportar Dados</button>
                    <button id="detailed-breakdown" class="action-btn secondary">🔍 Análise Detalhada</button>
                </div>
                
                <div class="analysis-footer mt-3 pt-2 border-t border-gray-700">
                    <div class="text-xs text-gray-500">
                        Powered by Gemini AI • Análise baseada em dados científicos
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for action buttons
        const refreshBtn = insightsDiv.querySelector('#refresh-analysis');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                askGeminiForEcosystemAnalysis(config, elements, apiKey, insightsDiv, logFn);
            });
        }
        
        const exportBtn = insightsDiv.querySelector('#export-analysis');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportAnalysisData(config, elements, insight, avgStats);
            });
        }
        
        const detailedBtn = insightsDiv.querySelector('#detailed-breakdown');
        if (detailedBtn) {
            detailedBtn.addEventListener('click', () => {
                showDetailedBreakdown(config, elements, avgStats, insightsDiv);
            });
        }
    }
    logFn("Gemini: Análise científica avançada concluída com métricas detalhadas.");
}

export async function askGeminiForElementInsight(elementType, config, apiKey, logFn) {
    const prompt = `Adicionei '${elementType}' a um planeta ${config.planetType}. Que impacto imediato ou desafio pode surgir? Responda em uma frase.`;
    const insight = await askGemini(prompt, apiKey);
    if(insight) logFn(`Gemini: ${insight}`);
}

export async function askGeminiForNarrativeEvent(config, elements, apiKey, logFn) {
    const elementCounts = {};
    const dominantElements = [];
    const recentEvents = []; // This would be populated from game history
    
    elements.forEach(el => {
        elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
    });
    
    // Get dominant species for narrative context
    Object.entries(elementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([type, count]) => {
            dominantElements.push(`${count} ${type}`);
        });
    
    const elementSummary = dominantElements.join(', ') || 'nenhum';
    
    // Calculate ecosystem maturity
    const avgAge = elements.reduce((sum, el) => sum + (el.age || 0), 0) / elements.length || 0;
    const maturityLevel = avgAge < 10 ? 'jovem' : avgAge < 50 ? 'em desenvolvimento' : 'maduro';
    
    // Determine narrative tone based on ecosystem health
    const avgHealth = elements.reduce((sum, el) => sum + (el.health || 100), 0) / elements.length || 0;
    const narrativeTone = avgHealth > 80 ? 'próspero' : avgHealth > 60 ? 'estável' : avgHealth > 40 ? 'em crise' : 'em colapso';
    
    const prompt = `Você é um narrador especialista em ficção científica e ecologia. Crie um evento narrativo envolvente e contextualizado para este ecossistema planetário. O evento deve ser apropriado para o estado atual do ecossistema e criar oportunidades para desenvolvimento futuro.

**CONTEXTO DO ECOSSISTEMA:**
- Planeta: ${config.planetType} (${maturityLevel}, ${narrativeTone})
- Condições: ${config.temperature}°C, ${config.waterPresence}% umidade, gravidade ${config.gravity}x
- Ambiente: Atmosfera ${config.atmosphere}, solo ${config.soilType}, minerais ${config.minerals}
- Biodiversidade: ${Object.keys(elementCounts).length} espécies, ${elements.length} indivíduos totais
- Espécies Dominantes: ${elementSummary}
- Idade Média do Ecossistema: ${avgAge.toFixed(1)} ciclos

**TIPOS DE EVENTOS POSSÍVEIS:**
1. **Descobertas Científicas**: Novas espécies, fenômenos únicos, recursos ocultos
2. **Eventos Cósmicos**: Meteoros, auroras, alinhamentos planetários, tempestades solares
3. **Evolução Biológica**: Mutações, adaptações, comportamentos emergentes
4. **Fenômenos Geológicos**: Erupções, terremotos, formação de novos habitats
5. **Interações Ecológicas**: Migrações, simbioses, competições territoriais
6. **Eventos Climáticos**: Mudanças sazonais extremas, microclimas únicos

**DIRETRIZES NARRATIVAS:**
- O evento deve ser apropriado para um ecossistema ${narrativeTone}
- Considere as espécies dominantes: ${elementSummary}
- O tom deve refletir a maturidade ${maturityLevel} do ecossistema
- Inclua consequências potenciais para o desenvolvimento futuro
- Use linguagem científica mas acessível
- Mantenha o mistério e senso de descoberta

**FORMATO DE RESPOSTA:**
Forneça um evento narrativo em 2-3 frases que inclua:
1. O evento principal
2. Suas implicações imediatas
3. Potencial impacto futuro

Evento Narrativo:`;

    const event = await askGemini(prompt, apiKey);
    if (event) {
        logFn(`🌟 Evento Narrativo Gerado: ${event}`);
        return event;
    }
    return null;
}

// New function for generating personalized narratives based on player actions
export async function askGeminiForPersonalizedNarrative(config, elements, playerActions, apiKey, logFn) {
    const recentActions = playerActions.slice(-5); // Last 5 actions
    const actionSummary = recentActions.map(action => 
        `${action.type} (${action.element || 'N/A'}) - ${action.timestamp}`
    ).join(', ');
    
    const ecosystemState = analyzeEcosystemState(elements);
    
    const prompt = `Como narrador especializado em storytelling interativo, crie uma narrativa personalizada que reflita as ações recentes do jogador e o estado atual do ecossistema.

**AÇÕES RECENTES DO JOGADOR:**
${actionSummary || 'Nenhuma ação recente registrada'}

**ESTADO DO ECOSSISTEMA:**
- Saúde Geral: ${ecosystemState.avgHealth.toFixed(1)}%
- Biodiversidade: ${ecosystemState.speciesCount} espécies
- População Total: ${ecosystemState.totalPopulation}
- Tendência: ${ecosystemState.trend}

**CONTEXTO PLANETÁRIO:**
- Planeta: ${config.planetType}
- Condições: ${config.temperature}°C, ${config.waterPresence}% água
- Ambiente: ${config.atmosphere}, solo ${config.soilType}

**NARRATIVA SOLICITADA:**
Crie uma narrativa em primeira pessoa (perspectiva do jogador como entidade divina/criadora) que:
1. Reconheça as ações recentes do jogador
2. Descreva como essas ações afetaram o ecossistema
3. Sugira consequências futuras ou oportunidades
4. Mantenha tom épico mas pessoal

Limite: 3-4 frases, tom inspirador e envolvente.

Narrativa Personalizada:`;

    const narrative = await askGemini(prompt, apiKey);
    if (narrative) {
        logFn(`📖 Narrativa Personalizada: ${narrative}`);
        return narrative;
    }
    return null;
}

// New function for generating tribal dialogues and cultural narratives
export async function askGeminiForTribalDialogue(tribe, ecosystemContext, interactionType, apiKey, logFn) {
    const tribeAge = tribe.age || 0;
    const tribeHealth = tribe.health || 100;
    const culturalStage = tribeAge < 20 ? 'primitiva' : tribeAge < 100 ? 'em desenvolvimento' : 'avançada';
    
    const prompt = `Como especialista em antropologia e narrativa cultural, crie um diálogo autêntico para uma tribo alienígena baseado em seu contexto cultural e situação atual.

**DADOS DA TRIBO:**
- Idade: ${tribeAge} ciclos (civilização ${culturalStage})
- Saúde/Moral: ${tribeHealth.toFixed(1)}%
- Posição: (${tribe.x.toFixed(0)}, ${tribe.y.toFixed(0)})
- Tipo de Interação: ${interactionType}

**CONTEXTO ECOLÓGICO:**
- Planeta: ${ecosystemContext.planetType}
- Recursos Próximos: ${ecosystemContext.nearbyResources || 'Desconhecidos'}
- Ameaças Locais: ${ecosystemContext.threats || 'Nenhuma identificada'}
- Clima Atual: ${ecosystemContext.weather || 'Estável'}

**TIPOS DE DIÁLOGO:**
- "blessing": Gratidão por intervenção divina positiva
- "curse": Lamentação por intervenção negativa
- "discovery": Reação a novos elementos no ambiente
- "celebration": Comemoração de marcos culturais
- "warning": Alerta sobre perigos iminentes
- "request": Pedido de ajuda ou recursos

**DIRETRIZES CULTURAIS:**
- Civilização ${culturalStage} deve refletir no vocabulário e conceitos
- Incluir referências ao ambiente planetário específico
- Manter consistência com a saúde/moral atual da tribo
- Usar linguagem que sugere cultura alienígena mas compreensível

**FORMATO:**
Forneça um diálogo de 2-3 frases que inclua:
1. Reação emocional apropriada
2. Referência ao contexto específico
3. Elemento cultural único da tribo

Diálogo da Tribo:`;

    const dialogue = await askGemini(prompt, apiKey);
    if (dialogue) {
        logFn(`💬 Diálogo Tribal (${interactionType}): ${dialogue}`);
        return dialogue;
    }
    return null;
}

// Helper function to analyze ecosystem state for narratives
function analyzeEcosystemState(elements) {
    const totalPopulation = elements.length;
    const speciesCount = new Set(elements.map(el => el.type)).size;
    const avgHealth = elements.reduce((sum, el) => sum + (el.health || 100), 0) / totalPopulation || 0;
    
    let trend = 'estável';
    if (avgHealth > 80) trend = 'próspero';
    else if (avgHealth < 40) trend = 'em declínio';
    
    return {
        totalPopulation,
        speciesCount,
        avgHealth,
        trend
    };
}

export async function askGeminiForBiodiversityAnalysis(config, elements, apiKey, logFn) {
    const elementCounts = {};
    const geneticDiversity = {};
    const spatialDistribution = {};
    
    elements.forEach(el => {
        elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
        
        // Analyze genetic diversity if genome exists
        if (el.genome && el.genome.traits) {
            if (!geneticDiversity[el.type]) geneticDiversity[el.type] = [];
            geneticDiversity[el.type].push(el.genome.traits);
        }
        
        // Analyze spatial distribution
        const region = `${Math.floor(el.x / 100)}-${Math.floor(el.y / 100)}`;
        if (!spatialDistribution[region]) spatialDistribution[region] = {};
        spatialDistribution[region][el.type] = (spatialDistribution[region][el.type] || 0) + 1;
    });
    
    const speciesCount = Object.keys(elementCounts).length;
    const totalPopulation = elements.length;
    const dominantSpecies = Object.entries(elementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
    
    // Calculate Shannon diversity index
    let shannonIndex = 0;
    Object.values(elementCounts).forEach(count => {
        const proportion = count / totalPopulation;
        if (proportion > 0) {
            shannonIndex -= proportion * Math.log2(proportion);
        }
    });
    
    // Calculate Simpson's diversity index
    let simpsonIndex = 0;
    Object.values(elementCounts).forEach(count => {
        const proportion = count / totalPopulation;
        simpsonIndex += proportion * proportion;
    });
    simpsonIndex = 1 - simpsonIndex;
    
    // Calculate evenness (Pielou's evenness index)
    const maxDiversity = Math.log2(speciesCount);
    const evenness = maxDiversity > 0 ? shannonIndex / maxDiversity : 0;
    
    // Analyze genetic diversity
    const geneticAnalysis = Object.entries(geneticDiversity).map(([species, genomes]) => {
        const uniqueTraits = new Set();
        genomes.forEach(traits => {
            Object.entries(traits).forEach(([trait, value]) => {
                uniqueTraits.add(`${trait}:${Math.floor(value * 10)}`);
            });
        });
        return `${species}: ${uniqueTraits.size} variações genéticas`;
    }).join(', ');
    
    // Analyze spatial clustering
    const regionCount = Object.keys(spatialDistribution).length;
    const avgSpeciesPerRegion = regionCount > 0 ? 
        Object.values(spatialDistribution).reduce((sum, region) => sum + Object.keys(region).length, 0) / regionCount : 0;
    
    const prompt = `Como especialista em biodiversidade e ecologia molecular, analise a diversidade biológica deste ecossistema usando índices científicos avançados:

**DADOS QUANTITATIVOS DE BIODIVERSIDADE:**
- Riqueza de Espécies (S): ${speciesCount}
- População Total (N): ${totalPopulation}
- Índice de Shannon (H'): ${shannonIndex.toFixed(3)}
- Índice de Simpson (D): ${simpsonIndex.toFixed(3)}
- Índice de Equitabilidade de Pielou (J'): ${evenness.toFixed(3)}

**DISTRIBUIÇÃO POPULACIONAL:**
- Espécies Dominantes: ${dominantSpecies.map(([species, count]) => `${species} (${count} indivíduos, ${((count/totalPopulation)*100).toFixed(1)}%)`).join(', ')}
- Distribuição Espacial: ${regionCount} regiões ocupadas, média de ${avgSpeciesPerRegion.toFixed(1)} espécies por região

**DIVERSIDADE GENÉTICA:**
${geneticAnalysis || 'Dados genéticos não disponíveis para análise'}

**CONDIÇÕES AMBIENTAIS:**
- Planeta: ${config.planetType}
- Temperatura: ${config.temperature}°C (${config.temperature < 0 ? 'Extremo frio' : config.temperature > 40 ? 'Extremo quente' : 'Moderada'})
- Disponibilidade Hídrica: ${config.waterPresence}% (${config.waterPresence < 30 ? 'Árido' : config.waterPresence > 70 ? 'Úmido' : 'Moderado'})
- Luminosidade: ${config.luminosity}x (${config.luminosity < 0.5 ? 'Baixa' : config.luminosity > 1.5 ? 'Alta' : 'Normal'})

**ANÁLISE CIENTÍFICA SOLICITADA:**
Forneça uma avaliação detalhada seguindo este formato:

🌿 **Classificação da Biodiversidade**: [Muito Alta (H'>3.0)/Alta (H'>2.0)/Moderada (H'>1.0)/Baixa (H'<1.0)] - Justificativa baseada nos índices

📊 **Análise dos Índices**:
- Shannon: [Interpretação do valor ${shannonIndex.toFixed(3)}]
- Simpson: [Interpretação do valor ${simpsonIndex.toFixed(3)}]
- Equitabilidade: [Interpretação do valor ${evenness.toFixed(3)}]

⚠️ **Riscos de Extinção**: [Identifique espécies vulneráveis baseado na distribuição populacional]

🧬 **Diversidade Genética**: [Avalie a variabilidade genética e riscos de endogamia]

🗺️ **Distribuição Espacial**: [Analise padrões de distribuição e fragmentação de habitat]

🎯 **Estratégias de Conservação**: [3 ações específicas para aumentar biodiversidade]

🔮 **Previsão Evolutiva**: [Como a biodiversidade pode evoluir nas condições atuais]

💡 **Intervenção Prioritária**: [Ação mais urgente com justificativa científica]

Base sua análise nos índices calculados e forneça recomendações quantificadas.`;

    const analysis = await askGemini(prompt, apiKey);
    if (analysis) logFn(`Análise Avançada de Biodiversidade: Índices calculados - Shannon: ${shannonIndex.toFixed(3)}, Simpson: ${simpsonIndex.toFixed(3)}, Equitabilidade: ${evenness.toFixed(3)}`);
    return analysis;
}

export async function askGeminiForResourceAnalysis(config, elements, apiKey, logFn) {
    const waterElements = elements.filter(el => el.type === 'Água').length;
    const plantElements = elements.filter(el => el.type === 'Planta' || el.type === 'Árvore').length;
    const animalElements = elements.filter(el => el.type === 'Criatura' || el.type === 'Predador').length;
    const rockElements = elements.filter(el => el.type === 'Rocha').length;
    const tribeElements = elements.filter(el => el.type === 'Tribo').length;
    
    // Calculate resource ratios and carrying capacity
    const producerConsumerRatio = animalElements > 0 ? plantElements / animalElements : plantElements > 0 ? Infinity : 0;
    const waterPerElement = elements.length > 0 ? waterElements / elements.length : 0;
    
    // Estimate carrying capacity based on environmental factors
    const temperatureFactor = config.temperature >= 15 && config.temperature <= 30 ? 1.0 : 
                             config.temperature >= 5 && config.temperature <= 40 ? 0.7 : 0.3;
    const waterFactor = config.waterPresence / 100;
    const luminosityFactor = config.luminosity >= 0.5 && config.luminosity <= 2.0 ? 1.0 : 0.6;
    const gravityFactor = config.gravity >= 0.5 && config.gravity <= 2.0 ? 1.0 : 0.7;
    
    const baseCarryingCapacity = 100; // Base capacity for medium ecosystem
    const estimatedCarryingCapacity = Math.floor(baseCarryingCapacity * temperatureFactor * waterFactor * luminosityFactor * gravityFactor);
    const currentOccupancy = (elements.length / estimatedCarryingCapacity) * 100;
    
    // Calculate resource efficiency
    const waterEfficiency = waterElements > 0 ? Math.min((plantElements + animalElements) / waterElements, 10) : 0;
    const energyFlow = plantElements * 10; // Plants produce energy
    const energyConsumption = animalElements * 8 + tribeElements * 5; // Animals and tribes consume energy
    const energyBalance = energyFlow - energyConsumption;
    
    // Analyze mineral resources
    const mineralAnalysis = rockElements > 0 ? 
        `${rockElements} fontes minerais (${config.minerals}) disponíveis` : 
        'Recursos minerais limitados';
    
    // Calculate sustainability metrics
    const sustainabilityIndex = Math.min(
        (waterElements / Math.max(elements.length * 0.1, 1)) * 100,
        (plantElements / Math.max(animalElements * 2, 1)) * 100,
        100
    );
    
    // Identify resource bottlenecks
    const bottlenecks = [];
    if (waterPerElement < 0.05) bottlenecks.push('Água');
    if (producerConsumerRatio < 2) bottlenecks.push('Produtores Primários');
    if (energyBalance < 0) bottlenecks.push('Energia');
    if (currentOccupancy > 90) bottlenecks.push('Espaço');
    
    const prompt = `Como especialista em recursos ecológicos e sustentabilidade ambiental, analise a disponibilidade e gestão de recursos neste ecossistema:

**INVENTÁRIO DE RECURSOS:**
- Recursos Hídricos: ${waterElements} fontes (${(waterPerElement * 100).toFixed(2)} fontes por 100 elementos)
- Produtores Primários: ${plantElements} plantas/árvores
- Consumidores Primários/Secundários: ${animalElements} criaturas
- Recursos Minerais: ${rockElements} depósitos de ${config.minerals}
- Civilizações: ${tribeElements} tribos

**MÉTRICAS DE SUSTENTABILIDADE:**
- Razão Produtor/Consumidor: ${producerConsumerRatio === Infinity ? '∞' : producerConsumerRatio.toFixed(2)}:1 (ideal: >3:1)
- Capacidade de Suporte Estimada: ${estimatedCarryingCapacity} elementos
- Ocupação Atual: ${currentOccupancy.toFixed(1)}% da capacidade
- Índice de Sustentabilidade: ${sustainabilityIndex.toFixed(1)}%
- Balanço Energético: ${energyBalance > 0 ? '+' : ''}${energyBalance} unidades

**FATORES AMBIENTAIS:**
- Temperatura: ${config.temperature}°C (fator: ${(temperatureFactor * 100).toFixed(0)}%)
- Disponibilidade Hídrica: ${config.waterPresence}% (fator: ${(waterFactor * 100).toFixed(0)}%)
- Luminosidade Solar: ${config.luminosity}x (fator: ${(luminosityFactor * 100).toFixed(0)}%)
- Gravidade: ${config.gravity}x (fator: ${(gravityFactor * 100).toFixed(0)}%)
- Tipo de Solo: ${config.soilType}
- Minerais Dominantes: ${config.minerals}

**GARGALOS IDENTIFICADOS:**
${bottlenecks.length > 0 ? bottlenecks.join(', ') : 'Nenhum gargalo crítico identificado'}

**ANÁLISE DETALHADA SOLICITADA:**

💧 **Recursos Hídricos**: [Avalie disponibilidade baseada em ${waterElements} fontes para ${elements.length} elementos]

🌱 **Capacidade Produtiva**: [Analise ${plantElements} produtores vs ${animalElements} consumidores - razão ${producerConsumerRatio.toFixed(2)}:1]

⚖️ **Equilíbrio Trófico**: [Avalie o balanço energético de ${energyBalance} unidades]

📊 **Capacidade de Suporte**: [Ocupação atual: ${currentOccupancy.toFixed(1)}% de ${estimatedCarryingCapacity} elementos máximo]

🚨 **Alertas de Escassez**: [Identifique recursos em risco baseado nos gargalos: ${bottlenecks.join(', ') || 'Nenhum'}]

⛏️ **Recursos Minerais**: [Analise ${rockElements} depósitos de ${config.minerals} para sustentabilidade]

🎯 **Otimização de Recursos**: [Sugira 3 ações específicas para melhorar eficiência]

📈 **Previsão de Demanda**: [Projete necessidades futuras baseado no crescimento atual]

💡 **Intervenção Urgente**: [Ação mais crítica com números específicos]

Base sua análise nos cálculos de capacidade de suporte e métricas de sustentabilidade fornecidas.`;

    const analysis = await askGemini(prompt, apiKey);
    if (analysis) logFn(`Análise de Recursos: Capacidade ${currentOccupancy.toFixed(1)}% ocupada, Sustentabilidade ${sustainabilityIndex.toFixed(1)}%, Balanço energético ${energyBalance}`);
    return analysis;
}

export async function askGeminiForEvolutionPrediction(config, elements, apiKey, logFn) {
    const elementHistory = elements.map(el => ({
        type: el.type,
        age: el.age || 0,
        health: el.health || 100,
        energy: el.energy || 0,
        size: el.size || 1,
        genome: el.genome
    }));
    
    const avgAge = elementHistory.reduce((sum, el) => sum + el.age, 0) / elementHistory.length || 0;
    const avgHealth = elementHistory.reduce((sum, el) => sum + el.health, 0) / elementHistory.length || 0;
    const avgEnergy = elementHistory.reduce((sum, el) => sum + el.energy, 0) / elementHistory.length || 0;
    
    // Analyze genetic diversity and mutation potential
    const geneticAnalysis = {};
    const mutationRates = {};
    elements.forEach(el => {
        if (el.genome && el.genome.traits) {
            if (!geneticAnalysis[el.type]) {
                geneticAnalysis[el.type] = {
                    traits: [],
                    mutationRate: el.genome.mutationRate || 0.01
                };
            }
            geneticAnalysis[el.type].traits.push(el.genome.traits);
            mutationRates[el.type] = el.genome.mutationRate || 0.01;
        }
    });
    
    // Calculate selection pressures
    const temperaturePressure = Math.abs(config.temperature - 25) / 25; // Deviation from optimal 25°C
    const waterPressure = Math.abs(config.waterPresence - 60) / 60; // Deviation from optimal 60%
    const gravityPressure = Math.abs(config.gravity - 1) / 1; // Deviation from Earth gravity
    const luminosityPressure = Math.abs(config.luminosity - 1) / 1; // Deviation from Earth luminosity
    
    const totalSelectionPressure = (temperaturePressure + waterPressure + gravityPressure + luminosityPressure) / 4;
    
    // Analyze population dynamics
    const populationByType = {};
    const ageDistribution = {};
    elements.forEach(el => {
        populationByType[el.type] = (populationByType[el.type] || 0) + 1;
        const ageGroup = Math.floor((el.age || 0) / 10) * 10;
        if (!ageDistribution[el.type]) ageDistribution[el.type] = {};
        ageDistribution[el.type][ageGroup] = (ageDistribution[el.type][ageGroup] || 0) + 1;
    });
    
    // Calculate reproductive potential
    const reproductiveElements = elements.filter(el => 
        (el.age || 0) > 5 && (el.health || 0) > 50 && (el.energy || 0) > 30
    ).length;
    const reproductivePotential = elements.length > 0 ? (reproductiveElements / elements.length) * 100 : 0;
    
    // Identify evolutionary bottlenecks
    const bottlenecks = [];
    if (avgHealth < 60) bottlenecks.push('Baixa aptidão geral');
    if (reproductivePotential < 30) bottlenecks.push('Baixo potencial reprodutivo');
    if (totalSelectionPressure > 0.5) bottlenecks.push('Alta pressão seletiva');
    if (Object.keys(populationByType).length < 3) bottlenecks.push('Baixa diversidade de espécies');
    
    // Calculate expected evolutionary rate
    const baseEvolutionRate = 0.1; // Base rate per 100 cycles
    const pressureMultiplier = 1 + totalSelectionPressure;
    const diversityMultiplier = Math.min(Object.keys(populationByType).length / 5, 1);
    const expectedEvolutionRate = baseEvolutionRate * pressureMultiplier * diversityMultiplier;
    
    const prompt = `Como especialista em biologia evolutiva e genética populacional, analise as tendências evolutivas deste ecossistema usando dados quantitativos:

**DADOS POPULACIONAIS:**
- Idade Média: ${avgAge.toFixed(1)} ciclos
- Saúde Média: ${avgHealth.toFixed(1)}%
- Energia Média: ${avgEnergy.toFixed(1)} unidades
- Potencial Reprodutivo: ${reproductivePotential.toFixed(1)}% da população
- Distribuição por Espécie: ${Object.entries(populationByType).map(([type, count]) => `${type} (${count})`).join(', ')}

**PRESSÕES SELETIVAS QUANTIFICADAS:**
- Pressão Térmica: ${(temperaturePressure * 100).toFixed(1)}% (temperatura ${config.temperature}°C vs ótimo 25°C)
- Pressão Hídrica: ${(waterPressure * 100).toFixed(1)}% (umidade ${config.waterPresence}% vs ótimo 60%)
- Pressão Gravitacional: ${(gravityPressure * 100).toFixed(1)}% (gravidade ${config.gravity}x vs ótimo 1x)
- Pressão Luminosa: ${(luminosityPressure * 100).toFixed(1)}% (luminosidade ${config.luminosity}x vs ótimo 1x)
- **Pressão Seletiva Total: ${(totalSelectionPressure * 100).toFixed(1)}%**

**ANÁLISE GENÉTICA:**
${Object.entries(geneticAnalysis).map(([type, data]) => 
    `${type}: ${data.traits.length} genomas analisados, taxa de mutação ${(data.mutationRate * 100).toFixed(2)}%`
).join('\n') || 'Dados genéticos limitados disponíveis'}

**CONDIÇÕES AMBIENTAIS:**
- Planeta: ${config.planetType}
- Atmosfera: ${config.atmosphere}
- Solo: ${config.soilType} com minerais ${config.minerals}
- Taxa de Evolução Estimada: ${(expectedEvolutionRate * 100).toFixed(2)}% por 100 ciclos

**GARGALOS EVOLUTIVOS:**
${bottlenecks.length > 0 ? bottlenecks.join(', ') : 'Nenhum gargalo crítico identificado'}

**PREVISÃO EVOLUTIVA DETALHADA:**

🧬 **Pressões Seletivas Dominantes**: [Analise as pressões de ${(totalSelectionPressure * 100).toFixed(1)}% e seus efeitos]

📊 **Dinâmica Populacional**: [Preveja mudanças baseadas em ${reproductivePotential.toFixed(1)}% de potencial reprodutivo]

🔄 **Adaptações Esperadas**: [Especifique adaptações para cada pressão seletiva identificada]

⏰ **Cronograma Evolutivo**: 
- Próximos 25 ciclos: [Mudanças de curto prazo]
- 25-75 ciclos: [Adaptações intermediárias]
- 75-100 ciclos: [Mudanças de longo prazo]

🎯 **Traços Sob Seleção**: [Identifique características que serão favorecidas/desfavorecidas]

🌱 **Especiação Potencial**: [Avalie probabilidade de surgimento de novas espécies]

⚠️ **Riscos Evolutivos**: [Identifique ameaças à diversidade genética]

💡 **Intervenções Evolutivas**: [3 ações específicas para guiar a evolução positivamente]

🔮 **Cenário Mais Provável**: [Descreva o estado esperado do ecossistema em 100 ciclos]

Base sua análise na taxa de evolução estimada de ${(expectedEvolutionRate * 100).toFixed(2)}% e nas pressões seletivas quantificadas.`;

    const prediction = await askGemini(prompt, apiKey);
    if (prediction) logFn(`Previsão Evolutiva Avançada: Taxa estimada ${(expectedEvolutionRate * 100).toFixed(2)}%/100 ciclos, Pressão seletiva ${(totalSelectionPressure * 100).toFixed(1)}%, Potencial reprodutivo ${reproductivePotential.toFixed(1)}%`);
    return prediction;
}

// New function for generating detailed event descriptions
export async function askGeminiForEventDescription(eventType, eventData, config, elements, apiKey, logFn) {
    const ecosystemContext = {
        totalElements: elements.length,
        speciesCount: new Set(elements.map(el => el.type)).size,
        avgHealth: elements.reduce((sum, el) => sum + (el.health || 100), 0) / elements.length || 0,
        dominantSpecies: getDominantSpecies(elements)
    };
    
    const prompt = `Como especialista em narrativa científica e worldbuilding, crie uma descrição detalhada e imersiva para este evento no ecossistema planetário.

**TIPO DE EVENTO:** ${eventType}

**DADOS DO EVENTO:**
${JSON.stringify(eventData, null, 2)}

**CONTEXTO DO ECOSSISTEMA:**
- Planeta: ${config.planetType}
- Condições: ${config.temperature}°C, ${config.waterPresence}% água, gravidade ${config.gravity}x
- Ambiente: Atmosfera ${config.atmosphere}, solo ${config.soilType}
- Biodiversidade: ${ecosystemContext.speciesCount} espécies, ${ecosystemContext.totalElements} indivíduos
- Saúde Média: ${ecosystemContext.avgHealth.toFixed(1)}%
- Espécies Dominantes: ${ecosystemContext.dominantSpecies}

**DESCRIÇÃO SOLICITADA:**
Crie uma descrição narrativa que inclua:

1. **Descrição Sensorial**: Como o evento se manifesta visualmente, sonoramente, etc.
2. **Impacto Imediato**: Efeitos diretos no ambiente e nas espécies
3. **Reações das Espécies**: Como diferentes formas de vida respondem
4. **Significado Científico**: Explicação dos processos por trás do evento
5. **Consequências Futuras**: Possíveis desdobramentos de longo prazo

**ESTILO NARRATIVO:**
- Tom científico mas acessível
- Linguagem evocativa e imersiva
- Perspectiva de observador científico
- 4-6 frases bem estruturadas

Descrição do Evento:`;

    const description = await askGemini(prompt, apiKey);
    if (description) {
        logFn(`📝 Descrição de Evento (${eventType}): ${description}`);
        return description;
    }
    return null;
}

// New function for generating adaptive storylines based on ecosystem evolution
export async function askGeminiForAdaptiveStoryline(ecosystemHistory, currentState, config, apiKey, logFn) {
    const historyAnalysis = analyzeEcosystemHistory(ecosystemHistory);
    
    const prompt = `Como especialista em narrativa adaptativa e storytelling procedural, crie uma storyline que evolua baseada na história única deste ecossistema.

**ANÁLISE HISTÓRICA:**
- Duração Total: ${historyAnalysis.totalCycles} ciclos
- Marcos Principais: ${historyAnalysis.majorEvents.join(', ')}
- Tendência de Biodiversidade: ${historyAnalysis.biodiversityTrend}
- Eventos Críticos: ${historyAnalysis.criticalEvents.length}
- Padrão de Crescimento: ${historyAnalysis.growthPattern}

**ESTADO ATUAL:**
- Espécies Ativas: ${currentState.speciesCount}
- População Total: ${currentState.totalPopulation}
- Saúde do Ecossistema: ${currentState.avgHealth.toFixed(1)}%
- Estágio de Desenvolvimento: ${currentState.developmentStage}

**CONTEXTO PLANETÁRIO:**
- Tipo: ${config.planetType}
- Condições: ${config.temperature}°C, ${config.waterPresence}% água
- Características Únicas: ${config.atmosphere}, ${config.soilType}, ${config.minerals}

**STORYLINE ADAPTATIVA SOLICITADA:**
Baseado na história única deste ecossistema, crie uma narrativa que:

1. **Reconheça a Jornada**: Referencie eventos passados significativos
2. **Identifique Temas**: Encontre padrões narrativos emergentes
3. **Projete o Futuro**: Sugira direções narrativas baseadas na trajetória
4. **Crie Tensão**: Identifique conflitos ou desafios emergentes
5. **Ofereça Esperança**: Apresente possibilidades de crescimento

**FORMATO:**
- Título da Storyline
- Narrativa principal (5-7 frases)
- 3 possíveis desenvolvimentos futuros
- Elemento de mistério ou descoberta

Storyline Adaptativa:`;

    const storyline = await askGemini(prompt, apiKey);
    if (storyline) {
        logFn(`📚 Storyline Adaptativa Gerada: ${storyline.split('\n')[0]}`);
        return storyline;
    }
    return null;
}

// Helper function to get dominant species
function getDominantSpecies(elements) {
    const counts = {};
    elements.forEach(el => {
        counts[el.type] = (counts[el.type] || 0) + 1;
    });
    
    return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => `${type} (${count})`)
        .join(', ');
}

// Helper function to analyze ecosystem history
function analyzeEcosystemHistory(history) {
    if (!history || history.length === 0) {
        return {
            totalCycles: 0,
            majorEvents: ['Início da simulação'],
            biodiversityTrend: 'estável',
            criticalEvents: [],
            growthPattern: 'inicial'
        };
    }
    
    const totalCycles = history.length;
    const majorEvents = history.filter(event => event.significance === 'major').map(e => e.description);
    const criticalEvents = history.filter(event => event.type === 'critical');
    
    // Analyze biodiversity trend
    const earlyBiodiversity = history.slice(0, Math.floor(totalCycles * 0.3)).reduce((sum, h) => sum + (h.speciesCount || 0), 0);
    const lateBiodiversity = history.slice(-Math.floor(totalCycles * 0.3)).reduce((sum, h) => sum + (h.speciesCount || 0), 0);
    
    let biodiversityTrend = 'estável';
    if (lateBiodiversity > earlyBiodiversity * 1.2) biodiversityTrend = 'crescente';
    else if (lateBiodiversity < earlyBiodiversity * 0.8) biodiversityTrend = 'declinante';
    
    // Analyze growth pattern
    const growthPattern = totalCycles < 50 ? 'inicial' : totalCycles < 200 ? 'desenvolvimento' : 'maduro';
    
    return {
        totalCycles,
        majorEvents: majorEvents.length > 0 ? majorEvents : ['Evolução natural'],
        biodiversityTrend,
        criticalEvents,
        growthPattern
    };
}

// Integration function for narrative system
export async function generateAINarrativeForEvent(eventType, eventData, config, elements, apiKey) {
    try {
        switch (eventType) {
            case 'element_created':
            case 'element_removed':
                return await askGeminiForEventDescription(eventType, eventData, config, elements, apiKey, console.log);
            
            case 'tribal_interaction':
                return await askGeminiForTribalDialogue(eventData.tribe, {
                    planetType: config.planetType,
                    nearbyResources: eventData.nearbyResources,
                    threats: eventData.threats,
                    weather: eventData.weather
                }, eventData.interactionType, apiKey, console.log);
            
            case 'ecosystem_milestone':
                return await askGeminiForPersonalizedNarrative(config, elements, eventData.playerActions || [], apiKey, console.log);
            
            case 'random_event':
                return await askGeminiForNarrativeEvent(config, elements, apiKey, console.log);
            
            default:
                return await askGeminiForEventDescription(eventType, eventData, config, elements, apiKey, console.log);
        }
    } catch (error) {
        console.error('Error generating AI narrative:', error);
        return null;
    }
}

// Function to create narrative display in UI
export function displayAINarrative(narrative, type = 'event', container = null) {
    if (!narrative) return;
    
    const narrativeElement = document.createElement('div');
    narrativeElement.className = `ai-narrative ai-narrative-${type}`;
    
    const typeIcons = {
        event: '🌟',
        tribal: '🏛️',
        milestone: '🎯',
        discovery: '🔍',
        warning: '⚠️'
    };
    
    narrativeElement.innerHTML = `
        <div class="narrative-header">
            <span class="narrative-icon">${typeIcons[type] || '📖'}</span>
            <span class="narrative-type">${type.charAt(0).toUpperCase() + type.slice(1)} Narrativo</span>
            <span class="narrative-timestamp">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="narrative-content">
            ${narrative.replace(/\n/g, '<br>')}
        </div>
        <div class="narrative-footer">
            <span class="narrative-source">Gerado por IA</span>
        </div>
    `;
    
    // Add to container or default location
    const targetContainer = container || document.getElementById('observer-log') || document.body;
    targetContainer.appendChild(narrativeElement);
    
    // Auto-remove after 30 seconds if in observer log
    if (!container) {
        setTimeout(() => {
            if (narrativeElement.parentNode) {
                narrativeElement.remove();
            }
        }, 30000);
    }
    
    return narrativeElement;
}

// Function to create narrative history panel
export function createNarrativeHistoryPanel() {
    const panel = document.createElement('div');
    panel.id = 'narrative-history-panel';
    panel.className = 'narrative-history-panel';
    
    panel.innerHTML = `
        <div class="narrative-history-header">
            <h3>📚 Crônicas do Ecossistema</h3>
            <button id="close-narrative-history" class="close-btn">×</button>
        </div>
        <div class="narrative-history-content">
            <div class="narrative-filters">
                <button class="filter-btn active" data-filter="all">Todos</button>
                <button class="filter-btn" data-filter="event">Eventos</button>
                <button class="filter-btn" data-filter="tribal">Tribais</button>
                <button class="filter-btn" data-filter="milestone">Marcos</button>
            </div>
            <div id="narrative-history-list" class="narrative-history-list">
                <!-- Narratives will be populated here -->
            </div>
        </div>
    `;
    
    // Add event listeners
    panel.querySelector('#close-narrative-history').addEventListener('click', () => {
        panel.remove();
    });
    
    panel.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            panel.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterNarrativeHistory(e.target.dataset.filter);
        });
    });
    
    return panel;
}

// Function to filter narrative history
function filterNarrativeHistory(filter) {
    const narratives = document.querySelectorAll('.narrative-history-item');
    narratives.forEach(narrative => {
        if (filter === 'all' || narrative.dataset.type === filter) {
            narrative.style.display = 'block';
        } else {
            narrative.style.display = 'none';
        }
    });
}

// INTELLIGENT SUGGESTIONS SYSTEM

/**
 * Generate contextual suggestions based on current ecosystem state
 */
export async function askGeminiForContextualSuggestions(config, elements, playerHistory, apiKey, logFn) {
    const ecosystemAnalysis = analyzeCurrentEcosystem(elements);
    const playerBehavior = analyzePlayerBehavior(playerHistory);
    const urgentIssues = identifyUrgentIssues(ecosystemAnalysis);
    
    const prompt = `Como consultor especialista em ecossistemas e gameplay, forneça sugestões inteligentes e contextuais para otimizar este ecossistema baseado no estado atual e comportamento do jogador.

**ANÁLISE DO ECOSSISTEMA:**
- Saúde Geral: ${ecosystemAnalysis.avgHealth.toFixed(1)}%
- Biodiversidade: ${ecosystemAnalysis.speciesCount} espécies
- População Total: ${ecosystemAnalysis.totalPopulation}
- Densidade: ${ecosystemAnalysis.density.toFixed(2)} elementos/área
- Estabilidade: ${ecosystemAnalysis.stability}
- Recursos Críticos: ${ecosystemAnalysis.criticalResources.join(', ') || 'Nenhum'}

**CONDIÇÕES PLANETÁRIAS:**
- Planeta: ${config.planetType}
- Temperatura: ${config.temperature}°C
- Água: ${config.waterPresence}%
- Gravidade: ${config.gravity}x
- Atmosfera: ${config.atmosphere}

**PADRÃO DE COMPORTAMENTO DO JOGADOR:**
- Estilo de Jogo: ${playerBehavior.playStyle}
- Elementos Favoritos: ${playerBehavior.favoriteElements.join(', ') || 'Variado'}
- Frequência de Intervenção: ${playerBehavior.interventionFrequency}
- Foco Principal: ${playerBehavior.primaryFocus}

**PROBLEMAS URGENTES IDENTIFICADOS:**
${urgentIssues.length > 0 ? urgentIssues.join(', ') : 'Nenhum problema crítico'}

**SUGESTÕES SOLICITADAS:**
Forneça 5 sugestões específicas e acionáveis no seguinte formato:

🎯 **Sugestão Prioritária**: [Ação mais urgente com justificativa]

🌱 **Melhoria de Biodiversidade**: [Como aumentar diversidade de espécies]

⚖️ **Equilíbrio Ecológico**: [Como melhorar estabilidade do ecossistema]

🔧 **Otimização de Recursos**: [Como melhorar eficiência de recursos]

🎮 **Dica de Gameplay**: [Sugestão baseada no estilo do jogador]

Cada sugestão deve incluir:
- Ação específica com números
- Justificativa científica
- Resultado esperado
- Dificuldade de implementação (Fácil/Médio/Difícil)

Base suas recomendações nos dados fornecidos e no comportamento observado do jogador.`;

    const suggestions = await askGemini(prompt, apiKey);
    if (suggestions) {
        logFn(`🧠 Sugestões Inteligentes Geradas: ${suggestions.split('\n')[0]}`);
        return suggestions;
    }
    return null;
}

/**
 * Generate predictive recommendations based on ecosystem trends
 */
export async function askGeminiForPredictiveRecommendations(ecosystemHistory, currentState, config, apiKey, logFn) {
    const trends = analyzeTrends(ecosystemHistory);
    const futureRisks = predictFutureRisks(trends, currentState);
    
    const prompt = `Como especialista em modelagem preditiva e ecologia, analise as tendências históricas deste ecossistema e forneça recomendações preventivas para otimizar seu desenvolvimento futuro.

**ANÁLISE DE TENDÊNCIAS (últimos ${ecosystemHistory.length} ciclos):**
- Tendência Populacional: ${trends.populationTrend}
- Tendência de Biodiversidade: ${trends.biodiversityTrend}
- Tendência de Saúde: ${trends.healthTrend}
- Taxa de Crescimento: ${trends.growthRate.toFixed(2)}%/ciclo
- Volatilidade: ${trends.volatility}

**ESTADO ATUAL:**
- População: ${currentState.totalPopulation}
- Espécies: ${currentState.speciesCount}
- Saúde Média: ${currentState.avgHealth.toFixed(1)}%
- Estágio de Desenvolvimento: ${currentState.developmentStage}

**RISCOS FUTUROS IDENTIFICADOS:**
${futureRisks.length > 0 ? futureRisks.map(risk => `- ${risk.type}: ${risk.probability}% probabilidade em ${risk.timeframe} ciclos`).join('\n') : 'Nenhum risco crítico identificado'}

**CONDIÇÕES AMBIENTAIS:**
- Planeta: ${config.planetType} (${config.temperature}°C, ${config.waterPresence}% água)
- Fatores Limitantes: ${identifyLimitingFactors(config).join(', ')}

**RECOMENDAÇÕES PREDITIVAS SOLICITADAS:**

📈 **Prevenção de Colapso**: [Ações para evitar declínio populacional]

🔮 **Preparação para Crescimento**: [Como se preparar para expansão futura]

⚠️ **Mitigação de Riscos**: [Estratégias para reduzir riscos identificados]

🎯 **Otimização de Longo Prazo**: [Mudanças para sustentabilidade de longo prazo]

📊 **Marcos de Monitoramento**: [Indicadores-chave para acompanhar]

Para cada recomendação, inclua:
- Cronograma de implementação
- Indicadores de sucesso
- Recursos necessários
- Impacto esperado

Base suas previsões nas tendências históricas observadas.`;

    const recommendations = await askGemini(prompt, apiKey);
    if (recommendations) {
        logFn(`🔮 Recomendações Preditivas: ${recommendations.split('\n')[0]}`);
        return recommendations;
    }
    return null;
}

/**
 * Generate adaptive tips based on player skill level and progress
 */
export async function askGeminiForAdaptiveTips(playerStats, ecosystemAchievements, currentChallenges, apiKey, logFn) {
    const skillLevel = assessPlayerSkillLevel(playerStats);
    const learningAreas = identifyLearningAreas(playerStats, ecosystemAchievements);
    
    const prompt = `Como tutor especializado em ecossistemas e game design educacional, forneça dicas adaptativas personalizadas para este jogador baseado em seu nível de habilidade e progresso.

**PERFIL DO JOGADOR:**
- Nível de Habilidade: ${skillLevel.level} (${skillLevel.score}/100)
- Tempo de Jogo: ${playerStats.totalPlayTime || 0} minutos
- Ecossistemas Criados: ${playerStats.ecosystemsCreated || 0}
- Taxa de Sucesso: ${playerStats.successRate || 0}%
- Conquistas Desbloqueadas: ${ecosystemAchievements.length}

**ÁREAS DE DESENVOLVIMENTO:**
${learningAreas.map(area => `- ${area.name}: ${area.proficiency}% proficiência`).join('\n')}

**DESAFIOS ATUAIS:**
${currentChallenges.map(challenge => `- ${challenge.name}: ${challenge.difficulty} (${challenge.progress}% completo)`).join('\n')}

**PONTOS FORTES IDENTIFICADOS:**
${skillLevel.strengths.join(', ')}

**ÁREAS PARA MELHORIA:**
${skillLevel.weaknesses.join(', ')}

**DICAS ADAPTATIVAS SOLICITADAS:**

🎓 **Dica de Aprendizado**: [Conceito educacional apropriado para o nível]

🎮 **Dica de Gameplay**: [Mecânica específica para melhorar performance]

🧪 **Experimento Sugerido**: [Teste prático para desenvolver habilidades]

🏆 **Próximo Objetivo**: [Meta alcançável baseada no progresso atual]

💡 **Insight Avançado**: [Conhecimento mais profundo quando apropriado]

Para cada dica:
- Adapte a complexidade ao nível do jogador
- Inclua passos específicos e mensuráveis
- Conecte com conhecimentos já adquiridos
- Sugira como medir o progresso

Personalize as dicas para um jogador de nível ${skillLevel.level}.`;

    const tips = await askGemini(prompt, apiKey);
    if (tips) {
        logFn(`💡 Dicas Adaptativas (Nível ${skillLevel.level}): ${tips.split('\n')[0]}`);
        return tips;
    }
    return null;
}

/**
 * Generate real-time intervention suggestions during gameplay
 */
export async function askGeminiForRealTimeSuggestions(currentAction, ecosystemState, recentEvents, apiKey, logFn) {
    const actionContext = analyzeCurrentAction(currentAction, ecosystemState);
    const immediateRisks = identifyImmediateRisks(ecosystemState, recentEvents);
    
    const prompt = `Como assistente de gameplay em tempo real, forneça sugestões imediatas e contextuais baseadas na ação atual do jogador e estado do ecossistema.

**AÇÃO ATUAL DO JOGADOR:**
- Tipo: ${currentAction.type}
- Elemento: ${currentAction.element || 'N/A'}
- Localização: (${currentAction.x || 0}, ${currentAction.y || 0})
- Contexto: ${actionContext.description}

**ESTADO IMEDIATO DO ECOSSISTEMA:**
- Elementos Próximos: ${actionContext.nearbyElements.join(', ') || 'Nenhum'}
- Densidade Local: ${actionContext.localDensity}
- Recursos Locais: ${actionContext.localResources.join(', ') || 'Limitados'}
- Saúde da Região: ${actionContext.regionalHealth.toFixed(1)}%

**EVENTOS RECENTES (últimos 5 ciclos):**
${recentEvents.map(event => `- ${event.type}: ${event.description}`).join('\n') || 'Nenhum evento significativo'}

**RISCOS IMEDIATOS:**
${immediateRisks.map(risk => `- ${risk.type}: ${risk.severity} (${risk.timeToImpact} ciclos)`).join('\n') || 'Nenhum risco imediato'}

**SUGESTÕES EM TEMPO REAL:**

⚡ **Sugestão Imediata**: [Ação específica para otimizar a ação atual]

🎯 **Posicionamento**: [Melhor localização para a ação]

⚠️ **Alerta**: [Aviso sobre consequências potenciais]

🔄 **Alternativa**: [Ação alternativa se apropriado]

✨ **Oportunidade**: [Como maximizar o benefício da ação]

Cada sugestão deve ser:
- Acionável imediatamente
- Específica para a situação atual
- Focada em resultados de curto prazo
- Fácil de entender e implementar

Responda rapidamente com sugestões práticas para a situação atual.`;

    const suggestions = await askGemini(prompt, apiKey);
    if (suggestions) {
        logFn(`⚡ Sugestão em Tempo Real: ${suggestions.split('\n')[0]}`);
        return suggestions;
    }
    return null;
}

// Helper functions for the suggestions system

function analyzeCurrentEcosystem(elements) {
    const totalPopulation = elements.length;
    const speciesCount = new Set(elements.map(el => el.type)).size;
    const avgHealth = elements.reduce((sum, el) => sum + (el.health || 100), 0) / totalPopulation || 0;
    
    // Calculate density (simplified)
    const density = totalPopulation / 1000; // Assuming 1000 unit area
    
    // Determine stability
    const healthVariance = elements.reduce((sum, el) => 
        sum + Math.pow((el.health || 100) - avgHealth, 2), 0) / totalPopulation || 0;
    const stability = healthVariance < 100 ? 'Alta' : healthVariance < 400 ? 'Média' : 'Baixa';
    
    // Identify critical resources
    const waterCount = elements.filter(el => el.type === 'Água').length;
    const plantCount = elements.filter(el => el.type === 'Planta' || el.type === 'Árvore').length;
    const criticalResources = [];
    
    if (waterCount < totalPopulation * 0.1) criticalResources.push('Água');
    if (plantCount < totalPopulation * 0.3) criticalResources.push('Produtores Primários');
    
    return {
        totalPopulation,
        speciesCount,
        avgHealth,
        density,
        stability,
        criticalResources
    };
}

function analyzePlayerBehavior(playerHistory) {
    if (!playerHistory || playerHistory.length === 0) {
        return {
            playStyle: 'Iniciante',
            favoriteElements: [],
            interventionFrequency: 'Baixa',
            primaryFocus: 'Exploração'
        };
    }
    
    const elementCounts = {};
    playerHistory.forEach(action => {
        if (action.element) {
            elementCounts[action.element] = (elementCounts[action.element] || 0) + 1;
        }
    });
    
    const favoriteElements = Object.entries(elementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([element]) => element);
    
    const interventionFrequency = playerHistory.length > 100 ? 'Alta' : 
                                 playerHistory.length > 30 ? 'Média' : 'Baixa';
    
    // Determine play style based on actions
    const creationActions = playerHistory.filter(a => a.type === 'create').length;
    const removalActions = playerHistory.filter(a => a.type === 'remove').length;
    
    let playStyle = 'Equilibrado';
    if (creationActions > removalActions * 3) playStyle = 'Criativo';
    else if (removalActions > creationActions * 2) playStyle = 'Controlador';
    
    return {
        playStyle,
        favoriteElements,
        interventionFrequency,
        primaryFocus: creationActions > removalActions ? 'Crescimento' : 'Controle'
    };
}

function identifyUrgentIssues(ecosystemAnalysis) {
    const issues = [];
    
    if (ecosystemAnalysis.avgHealth < 50) {
        issues.push('Saúde crítica do ecossistema');
    }
    
    if (ecosystemAnalysis.speciesCount < 3) {
        issues.push('Baixa biodiversidade');
    }
    
    if (ecosystemAnalysis.stability === 'Baixa') {
        issues.push('Instabilidade ecológica');
    }
    
    if (ecosystemAnalysis.criticalResources.length > 0) {
        issues.push(`Escassez de recursos: ${ecosystemAnalysis.criticalResources.join(', ')}`);
    }
    
    return issues;
}

function analyzeTrends(history) {
    if (!history || history.length < 3) {
        return {
            populationTrend: 'Estável',
            biodiversityTrend: 'Estável',
            healthTrend: 'Estável',
            growthRate: 0,
            volatility: 'Baixa'
        };
    }
    
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    
    const recentAvgPop = recent.reduce((sum, h) => sum + (h.population || 0), 0) / recent.length;
    const olderAvgPop = older.reduce((sum, h) => sum + (h.population || 0), 0) / older.length || recentAvgPop;
    
    const populationTrend = recentAvgPop > olderAvgPop * 1.1 ? 'Crescente' : 
                           recentAvgPop < olderAvgPop * 0.9 ? 'Declinante' : 'Estável';
    
    const growthRate = olderAvgPop > 0 ? ((recentAvgPop - olderAvgPop) / olderAvgPop) * 100 : 0;
    
    return {
        populationTrend,
        biodiversityTrend: 'Estável', // Simplified
        healthTrend: 'Estável', // Simplified
        growthRate,
        volatility: Math.abs(growthRate) > 10 ? 'Alta' : 'Baixa'
    };
}

function predictFutureRisks(trends, currentState) {
    const risks = [];
    
    if (trends.populationTrend === 'Declinante') {
        risks.push({
            type: 'Colapso populacional',
            probability: 70,
            timeframe: 20
        });
    }
    
    if (currentState.speciesCount < 3) {
        risks.push({
            type: 'Perda de biodiversidade',
            probability: 60,
            timeframe: 15
        });
    }
    
    if (trends.volatility === 'Alta') {
        risks.push({
            type: 'Instabilidade sistêmica',
            probability: 50,
            timeframe: 10
        });
    }
    
    return risks;
}

function identifyLimitingFactors(config) {
    const factors = [];
    
    if (config.temperature < 0 || config.temperature > 40) {
        factors.push('Temperatura extrema');
    }
    
    if (config.waterPresence < 30) {
        factors.push('Baixa disponibilidade hídrica');
    }
    
    if (config.gravity < 0.5 || config.gravity > 2) {
        factors.push('Gravidade não-padrão');
    }
    
    return factors.length > 0 ? factors : ['Nenhum fator limitante crítico'];
}

function assessPlayerSkillLevel(playerStats) {
    let score = 0;
    const strengths = [];
    const weaknesses = [];
    
    // Assess based on various metrics
    if (playerStats.successRate > 80) {
        score += 30;
        strengths.push('Alta taxa de sucesso');
    } else if (playerStats.successRate < 50) {
        weaknesses.push('Baixa taxa de sucesso');
    }
    
    if (playerStats.ecosystemsCreated > 10) {
        score += 25;
        strengths.push('Experiência diversificada');
    } else if (playerStats.ecosystemsCreated < 3) {
        weaknesses.push('Pouca experiência');
    }
    
    if (playerStats.totalPlayTime > 120) {
        score += 20;
        strengths.push('Dedicação ao jogo');
    }
    
    // Determine level
    let level = 'Iniciante';
    if (score > 70) level = 'Avançado';
    else if (score > 40) level = 'Intermediário';
    
    return {
        level,
        score,
        strengths: strengths.length > 0 ? strengths : ['Potencial para crescimento'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Desenvolvimento equilibrado']
    };
}

function identifyLearningAreas(playerStats, achievements) {
    const areas = [
        { name: 'Gestão de Recursos', proficiency: Math.min(playerStats.resourceManagement || 0, 100) },
        { name: 'Biodiversidade', proficiency: Math.min(achievements.length * 10, 100) },
        { name: 'Estabilidade Ecológica', proficiency: Math.min(playerStats.stabilityScore || 0, 100) },
        { name: 'Planejamento Estratégico', proficiency: Math.min(playerStats.planningScore || 0, 100) }
    ];
    
    return areas;
}

function analyzeCurrentAction(currentAction, ecosystemState) {
    // Simplified analysis of current action context
    return {
        description: `Tentativa de ${currentAction.type} ${currentAction.element || 'elemento'}`,
        nearbyElements: [], // Would be calculated based on position
        localDensity: 'Média',
        localResources: ['Água', 'Solo'],
        regionalHealth: 75
    };
}

function identifyImmediateRisks(ecosystemState, recentEvents) {
    const risks = [];
    
    if (ecosystemState.avgHealth < 30) {
        risks.push({
            type: 'Colapso iminente',
            severity: 'Crítico',
            timeToImpact: 3
        });
    }
    
    return risks;
}

// INTELLIGENT SUGGESTIONS UI SYSTEM

/**
 * Create and display the intelligent suggestions panel
 */
export function createIntelligentSuggestionsPanel(config, elements, apiKey) {
    const panel = document.createElement('div');
    panel.id = 'intelligent-suggestions-panel';
    panel.className = 'intelligent-suggestions-panel';
    
    panel.innerHTML = `
        <div class="suggestions-header">
            <div class="suggestions-title">
                <span class="suggestions-icon">🧠</span>
                <h3>Assistente Inteligente</h3>
            </div>
            <div class="suggestions-controls">
                <button id="refresh-suggestions" class="control-btn" title="Atualizar Sugestões">🔄</button>
                <button id="toggle-suggestions" class="control-btn" title="Minimizar/Expandir">📌</button>
                <button id="close-suggestions" class="control-btn" title="Fechar">×</button>
            </div>
        </div>
        
        <div class="suggestions-content">
            <div class="suggestions-tabs">
                <button class="tab-btn active" data-tab="contextual">Contextuais</button>
                <button class="tab-btn" data-tab="predictive">Preditivas</button>
                <button class="tab-btn" data-tab="adaptive">Adaptativas</button>
                <button class="tab-btn" data-tab="realtime">Tempo Real</button>
            </div>
            
            <div class="suggestions-body">
                <div id="contextual-suggestions" class="suggestions-tab-content active">
                    <div class="loading-suggestions">
                        <div class="loading-spinner"></div>
                        <span>Analisando ecossistema...</span>
                    </div>
                </div>
                
                <div id="predictive-suggestions" class="suggestions-tab-content">
                    <div class="loading-suggestions">
                        <div class="loading-spinner"></div>
                        <span>Gerando previsões...</span>
                    </div>
                </div>
                
                <div id="adaptive-suggestions" class="suggestions-tab-content">
                    <div class="loading-suggestions">
                        <div class="loading-spinner"></div>
                        <span>Personalizando dicas...</span>
                    </div>
                </div>
                
                <div id="realtime-suggestions" class="suggestions-tab-content">
                    <div class="realtime-status">
                        <span class="status-indicator active"></span>
                        <span>Monitoramento ativo</span>
                    </div>
                    <div id="realtime-content">
                        <p class="no-suggestions">Nenhuma sugestão em tempo real no momento.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="suggestions-footer">
            <div class="suggestions-stats">
                <span class="stat-item">
                    <span class="stat-label">Sugestões hoje:</span>
                    <span class="stat-value" id="daily-suggestions-count">0</span>
                </span>
                <span class="stat-item">
                    <span class="stat-label">Implementadas:</span>
                    <span class="stat-value" id="implemented-suggestions-count">0</span>
                </span>
            </div>
        </div>
    `;
    
    // Add event listeners
    setupSuggestionsEventListeners(panel, config, elements, apiKey);
    
    // Position panel
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.zIndex = '1000';
    
    document.body.appendChild(panel);
    
    // Load initial suggestions
    loadContextualSuggestions(config, elements, apiKey);
    
    return panel;
}

/**
 * Setup event listeners for the suggestions panel
 */
function setupSuggestionsEventListeners(panel, config, elements, apiKey) {
    // Tab switching
    panel.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchSuggestionsTab(panel, tabName, config, elements, apiKey);
        });
    });
    
    // Control buttons
    panel.querySelector('#refresh-suggestions').addEventListener('click', () => {
        refreshCurrentSuggestions(panel, config, elements, apiKey);
    });
    
    panel.querySelector('#toggle-suggestions').addEventListener('click', () => {
        toggleSuggestionsPanel(panel);
    });
    
    panel.querySelector('#close-suggestions').addEventListener('click', () => {
        panel.remove();
    });
}

/**
 * Switch between suggestion tabs
 */
function switchSuggestionsTab(panel, tabName, config, elements, apiKey) {
    // Update tab buttons
    panel.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    panel.querySelectorAll('.suggestions-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-suggestions`);
    });
    
    // Load content for the selected tab
    switch (tabName) {
        case 'contextual':
            loadContextualSuggestions(config, elements, apiKey);
            break;
        case 'predictive':
            loadPredictiveSuggestions(config, elements, apiKey);
            break;
        case 'adaptive':
            loadAdaptiveSuggestions(config, elements, apiKey);
            break;
        case 'realtime':
            // Real-time suggestions are updated automatically
            break;
    }
}

/**
 * Load contextual suggestions
 */
async function loadContextualSuggestions(config, elements, apiKey) {
    const container = document.getElementById('contextual-suggestions');
    if (!container) return;
    
    try {
        const playerHistory = JSON.parse(localStorage.getItem('playerHistory') || '[]');
        const suggestions = await askGeminiForContextualSuggestions(config, elements, playerHistory, apiKey, console.log);
        
        if (suggestions) {
            container.innerHTML = formatSuggestions(suggestions, 'contextual');
        } else {
            container.innerHTML = '<p class="no-suggestions">Não foi possível gerar sugestões contextuais.</p>';
        }
    } catch (error) {
        console.error('Error loading contextual suggestions:', error);
        container.innerHTML = '<p class="error-suggestions">Erro ao carregar sugestões.</p>';
    }
}

/**
 * Load predictive suggestions
 */
async function loadPredictiveSuggestions(config, elements, apiKey) {
    const container = document.getElementById('predictive-suggestions');
    if (!container) return;
    
    try {
        const ecosystemHistory = JSON.parse(localStorage.getItem('ecosystemHistory') || '[]');
        const currentState = analyzeCurrentEcosystem(elements);
        const recommendations = await askGeminiForPredictiveRecommendations(ecosystemHistory, currentState, config, apiKey, console.log);
        
        if (recommendations) {
            container.innerHTML = formatSuggestions(recommendations, 'predictive');
        } else {
            container.innerHTML = '<p class="no-suggestions">Não foi possível gerar recomendações preditivas.</p>';
        }
    } catch (error) {
        console.error('Error loading predictive suggestions:', error);
        container.innerHTML = '<p class="error-suggestions">Erro ao carregar previsões.</p>';
    }
}

/**
 * Load adaptive suggestions
 */
async function loadAdaptiveSuggestions(config, elements, apiKey) {
    const container = document.getElementById('adaptive-suggestions');
    if (!container) return;
    
    try {
        const playerStats = JSON.parse(localStorage.getItem('playerStats') || '{}');
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        const challenges = JSON.parse(localStorage.getItem('currentChallenges') || '[]');
        
        const tips = await askGeminiForAdaptiveTips(playerStats, achievements, challenges, apiKey, console.log);
        
        if (tips) {
            container.innerHTML = formatSuggestions(tips, 'adaptive');
        } else {
            container.innerHTML = '<p class="no-suggestions">Não foi possível gerar dicas adaptativas.</p>';
        }
    } catch (error) {
        console.error('Error loading adaptive suggestions:', error);
        container.innerHTML = '<p class="error-suggestions">Erro ao carregar dicas.</p>';
    }
}

/**
 * Format suggestions for display
 */
function formatSuggestions(suggestions, type) {
    const lines = suggestions.split('\n').filter(line => line.trim());
    let formattedHtml = '';
    
    lines.forEach(line => {
        if (line.includes('**') && line.includes('**:')) {
            // This is a suggestion header
            const title = line.replace(/\*\*/g, '').replace(/🎯|🌱|⚖️|🔧|🎮|📈|🔮|⚠️|📊|🎓|🧪|🏆|💡|⚡/g, '').trim();
            const icon = line.match(/🎯|🌱|⚖️|🔧|🎮|📈|🔮|⚠️|📊|🎓|🧪|🏆|💡|⚡/)?.[0] || '💡';
            
            formattedHtml += `
                <div class="suggestion-item ${type}">
                    <div class="suggestion-header">
                        <span class="suggestion-icon">${icon}</span>
                        <span class="suggestion-title">${title}</span>
                    </div>
            `;
        } else if (line.trim() && !line.includes('**')) {
            // This is suggestion content
            formattedHtml += `
                    <div class="suggestion-content">
                        ${line.trim()}
                    </div>
                    <div class="suggestion-actions">
                        <button class="action-btn implement-btn" onclick="implementSuggestion('${type}', this)">
                            ✅ Implementar
                        </button>
                        <button class="action-btn dismiss-btn" onclick="dismissSuggestion(this)">
                            ❌ Dispensar
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    return formattedHtml || '<p class="no-suggestions">Nenhuma sugestão disponível.</p>';
}

/**
 * Refresh current suggestions
 */
function refreshCurrentSuggestions(panel, config, elements, apiKey) {
    const activeTab = panel.querySelector('.tab-btn.active').dataset.tab;
    switchSuggestionsTab(panel, activeTab, config, elements, apiKey);
}

/**
 * Toggle suggestions panel visibility
 */
function toggleSuggestionsPanel(panel) {
    const content = panel.querySelector('.suggestions-content');
    const isMinimized = content.style.display === 'none';
    
    content.style.display = isMinimized ? 'block' : 'none';
    
    const toggleBtn = panel.querySelector('#toggle-suggestions');
    toggleBtn.textContent = isMinimized ? '📌' : '📋';
}

/**
 * Update real-time suggestions
 */
export function updateRealTimeSuggestions(currentAction, ecosystemState, recentEvents, apiKey) {
    const container = document.getElementById('realtime-content');
    if (!container) return;
    
    // Only update if real-time tab is active
    const realtimeTab = document.getElementById('realtime-suggestions');
    if (!realtimeTab || !realtimeTab.classList.contains('active')) return;
    
    askGeminiForRealTimeSuggestions(currentAction, ecosystemState, recentEvents, apiKey, console.log)
        .then(suggestions => {
            if (suggestions) {
                container.innerHTML = formatSuggestions(suggestions, 'realtime');
            }
        })
        .catch(error => {
            console.error('Error updating real-time suggestions:', error);
        });
}

// Global functions for suggestion actions
window.implementSuggestion = function(type, button) {
    const suggestionItem = button.closest('.suggestion-item');
    const title = suggestionItem.querySelector('.suggestion-title').textContent;
    
    // Mark as implemented
    suggestionItem.classList.add('implemented');
    button.textContent = '✅ Implementado';
    button.disabled = true;
    
    // Update stats
    const implementedCount = document.getElementById('implemented-suggestions-count');
    if (implementedCount) {
        implementedCount.textContent = parseInt(implementedCount.textContent) + 1;
    }
    
    // Log implementation
    console.log(`Sugestão implementada: ${title}`);
    
    // Store in localStorage for tracking
    const implementedSuggestions = JSON.parse(localStorage.getItem('implementedSuggestions') || '[]');
    implementedSuggestions.push({
        type,
        title,
        timestamp: Date.now()
    });
    localStorage.setItem('implementedSuggestions', JSON.stringify(implementedSuggestions));
};

window.dismissSuggestion = function(button) {
    const suggestionItem = button.closest('.suggestion-item');
    suggestionItem.style.opacity = '0.5';
    suggestionItem.style.pointerEvents = 'none';
    
    setTimeout(() => {
        suggestionItem.remove();
    }, 500);
};

export async function askGeminiForPlanetStory(config, apiKey, logFn) {
    // Determine planet characteristics for narrative context
    const planetAge = Math.random() * 10 + 1; // Random age between 1-11 billion years
    const stellarClass = config.luminosity > 1.5 ? 'gigante azul' : config.luminosity < 0.5 ? 'anã vermelha' : 'similar ao Sol';
    const habitabilityZone = config.temperature >= 0 && config.temperature <= 40 && config.waterPresence > 30 ? 'zona habitável' : 'zona extrema';
    
    // Determine geological activity based on gravity and temperature
    const geologicalActivity = config.gravity > 1.2 && config.temperature > 20 ? 'geologicamente ativo' : 'geologicamente estável';
    
    const prompt = `Como especialista em astrobiologia e worldbuilding científico, crie uma história de origem épica e cientificamente plausível para este mundo alienígena.

**CARACTERÍSTICAS PLANETÁRIAS:**
- Classificação: ${config.planetType} na ${habitabilityZone}
- Idade Estimada: ${planetAge.toFixed(1)} bilhões de anos
- Estrela Hospedeira: ${stellarClass} (luminosidade ${config.luminosity}x)
- Condições Atuais: ${config.temperature}°C, ${config.waterPresence}% água superficial
- Gravidade: ${config.gravity}x Terra
- Composição Atmosférica: ${config.atmosphere}
- Geologia: ${config.soilType} com depósitos de ${config.minerals}
- Status Geológico: ${geologicalActivity}

**ELEMENTOS NARRATIVOS SOLICITADOS:**
1. **Origem Cósmica**: Como este planeta se formou (evento único, colisão, migração orbital)
2. **Evento Definidor**: Um momento crucial que moldou suas características atuais
3. **Evolução Ambiental**: Como chegou às condições presentes
4. **Mistério Científico**: Algo intrigante sobre sua formação ou evolução
5. **Potencial Futuro**: Sugestão do que este mundo pode se tornar

**ESTILO NARRATIVO:**
- Tom épico mas científico
- Linguagem evocativa e inspiradora
- Perspectiva de descoberta científica
- Foco em processos únicos que criaram este mundo específico
- 4-6 frases bem estruturadas

**TEMAS POSSÍVEIS:**
- Mundos nascidos de colisões cósmicas
- Planetas que migraram entre órbitas
- Mundos moldados por eventos estelares únicos
- Planetas com histórias geológicas extraordinárias
- Mundos que sobreviveram a catástrofes cósmicas

História Épica do Planeta:`;

    const story = await askGemini(prompt, apiKey);
    if (story) {
        logFn(`🌍 História Épica do Planeta: ${story}`);
        return story;
    }
    return null;
}

// New function for generating dynamic lore based on ecosystem development
export async function askGeminiForEcosystemLore(ecosystemAge, majorEvents, currentSpecies, config, apiKey, logFn) {
    const loreDepth = ecosystemAge < 50 ? 'lendas iniciais' : ecosystemAge < 200 ? 'mitologia desenvolvida' : 'épicos ancestrais';
    
    const prompt = `Como especialista em mitologia e narrativa evolutiva, crie lore dinâmico que reflita a história natural deste ecossistema.

**CONTEXTO EVOLUTIVO:**
- Idade do Ecossistema: ${ecosystemAge} ciclos (${loreDepth})
- Eventos Marcantes: ${majorEvents.join(', ') || 'Evolução natural'}
- Espécies Atuais: ${currentSpecies.join(', ')}
- Planeta: ${config.planetType} (${config.temperature}°C, ${config.waterPresence}% água)

**LORE SOLICITADO:**
Baseado na história evolutiva real, crie:

1. **Mito de Origem**: Como as primeiras formas de vida surgiram
2. **Lenda dos Ancestrais**: História das espécies que moldaram o ecossistema
3. **Profecia Natural**: Previsão sobre o futuro evolutivo
4. **Mistério Ecológico**: Algo inexplicado sobre a evolução local

**ESTILO:**
- Tom mítico mas baseado em eventos reais
- Linguagem poética e evocativa
- Referências às condições planetárias específicas
- 5-7 frases estruturadas como lore épico

Lore do Ecossistema:`;

    const lore = await askGemini(prompt, apiKey);
    if (lore) {
        logFn(`📜 Lore do Ecossistema: ${lore.split('.')[0]}...`);
        return lore;
    }
    return null;
}

// Helper function to export analysis data
function exportAnalysisData(config, elements, insight, avgStats) {
    const data = {
        timestamp: new Date().toISOString(),
        planetConfig: config,
        ecosystemData: {
            totalElements: elements.length,
            elementCounts: elements.reduce((counts, el) => {
                counts[el.type] = (counts[el.type] || 0) + 1;
                return counts;
            }, {}),
            averageStats: avgStats,
            healthMetrics: {
                avgHealth: elements.reduce((sum, el) => sum + (el.health || 100), 0) / elements.length,
                totalEnergy: elements.reduce((sum, el) => sum + (el.energy || 0), 0)
            }
        },
        aiAnalysis: insight
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosystem-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Análise exportada com sucesso');
}

// Helper function to show detailed breakdown
function showDetailedBreakdown(config, elements, avgStats, container) {
    const detailedHtml = `
        <div class="detailed-breakdown">
            <div class="breakdown-header mb-3">
                <h4 class="text-sm font-semibold text-blue-400">📋 Análise Detalhada por Espécie</h4>
            </div>
            
            <div class="species-breakdown">
                ${Object.entries(avgStats).map(([type, stats]) => {
                    const count = elements.filter(el => el.type === type).length;
                    const healthStatus = stats.avgHealth > 80 ? 'excellent' : stats.avgHealth > 60 ? 'good' : stats.avgHealth > 40 ? 'warning' : 'critical';
                    
                    return `
                        <div class="species-card ${healthStatus}">
                            <div class="species-header">
                                <span class="species-name">${type}</span>
                                <span class="species-count">${count} indivíduos</span>
                            </div>
                            <div class="species-stats">
                                <div class="stat-row">
                                    <span>Idade Média:</span>
                                    <span>${stats.avgAge.toFixed(1)} ciclos</span>
                                </div>
                                <div class="stat-row">
                                    <span>Saúde Média:</span>
                                    <span>${stats.avgHealth.toFixed(1)}%</span>
                                </div>
                                <div class="stat-row">
                                    <span>Status:</span>
                                    <span class="status-${healthStatus}">${getHealthStatusText(healthStatus)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="breakdown-actions mt-3">
                <button id="back-to-analysis" class="action-btn secondary">← Voltar à Análise</button>
            </div>
        </div>
    `;
    
    container.innerHTML = detailedHtml;
    
    // Add back button functionality
    const backBtn = container.querySelector('#back-to-analysis');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Trigger a new analysis to go back
            const currentConfig = getSimulationConfig ? getSimulationConfig() : config;
            const currentElements = getEcosystemElements ? getEcosystemElements() : elements;
            askGeminiForEcosystemAnalysis(currentConfig, currentElements, localStorage.getItem('geminiApiKey'), container, console.log);
        });
    }
}

// Helper function to get health status text
function getHealthStatusText(status) {
    const statusMap = {
        excellent: 'Excelente',
        good: 'Boa',
        warning: 'Atenção',
        critical: 'Crítica'
    };
    return statusMap[status] || 'Desconhecido';
}

export async function askGeminiForComprehensiveAnalysis(config, elements, apiKey, insightsDiv, logFn) {
    if (insightsDiv) {
        insightsDiv.innerHTML = `
            <div class="comprehensive-analysis-loading">
                <div class="flex items-center gap-2 mb-3">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                    <span class="text-purple-400 font-semibold">Executando Análise Abrangente...</span>
                </div>
                <div class="analysis-progress">
                    <div class="text-xs text-gray-400 mb-1">Coletando dados do ecossistema...</div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-purple-600 h-2 rounded-full animate-pulse" style="width: 25%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    try {
        // Update progress
        if (insightsDiv) {
            insightsDiv.querySelector('.analysis-progress .text-xs').textContent = 'Analisando biodiversidade...';
            insightsDiv.querySelector('.bg-purple-600').style.width = '50%';
        }
        
        const biodiversityAnalysis = await askGeminiForBiodiversityAnalysis(config, elements, apiKey, logFn);
        
        // Update progress
        if (insightsDiv) {
            insightsDiv.querySelector('.analysis-progress .text-xs').textContent = 'Avaliando recursos...';
            insightsDiv.querySelector('.bg-purple-600').style.width = '75%';
        }
        
        const resourceAnalysis = await askGeminiForResourceAnalysis(config, elements, apiKey, logFn);
        
        // Update progress
        if (insightsDiv) {
            insightsDiv.querySelector('.analysis-progress .text-xs').textContent = 'Gerando previsões...';
            insightsDiv.querySelector('.bg-purple-600').style.width = '100%';
        }
        
        const evolutionPrediction = await askGeminiForEvolutionPrediction(config, elements, apiKey, logFn);
        
        // Display comprehensive results
        if (insightsDiv) {
            insightsDiv.innerHTML = `
                <div class="comprehensive-analysis-results">
                    <div class="analysis-header mb-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-semibold text-purple-400">📊 Relatório Abrangente</span>
                            <span class="text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                        </div>
                        <div class="text-xs text-gray-400">Análise multi-dimensional do ecossistema</div>
                    </div>
                    
                    <div class="analysis-sections space-y-4">
                        <div class="analysis-section">
                            <div class="section-header text-xs font-semibold text-green-400 mb-2">🌿 BIODIVERSIDADE</div>
                            <div class="section-content text-xs text-gray-300 leading-relaxed">
                                ${biodiversityAnalysis ? biodiversityAnalysis.replace(/\n/g, '<br>') : 'Análise não disponível'}
                            </div>
                        </div>
                        
                        <div class="analysis-section">
                            <div class="section-header text-xs font-semibold text-blue-400 mb-2">💧 RECURSOS</div>
                            <div class="section-content text-xs text-gray-300 leading-relaxed">
                                ${resourceAnalysis ? resourceAnalysis.replace(/\n/g, '<br>') : 'Análise não disponível'}
                            </div>
                        </div>
                        
                        <div class="analysis-section">
                            <div class="section-header text-xs font-semibold text-orange-400 mb-2">🧬 EVOLUÇÃO</div>
                            <div class="section-content text-xs text-gray-300 leading-relaxed">
                                ${evolutionPrediction ? evolutionPrediction.replace(/\n/g, '<br>') : 'Previsão não disponível'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-footer mt-4 pt-3 border-t border-gray-700">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-gray-500">Powered by Gemini AI</span>
                            <button id="refresh-comprehensive-analysis" class="text-purple-400 hover:text-purple-300 transition-colors">
                                🔄 Atualizar Análise
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listener for refresh button
            const refreshBtn = insightsDiv.querySelector('#refresh-comprehensive-analysis');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    askGeminiForComprehensiveAnalysis(config, elements, apiKey, insightsDiv, logFn);
                });
            }
        }
        
        logFn("Gemini: Análise abrangente concluída com sucesso.");
        
    } catch (error) {
        console.error('Erro na análise abrangente:', error);
        if (insightsDiv) {
            insightsDiv.innerHTML = `
                <div class="analysis-error">
                    <div class="text-red-400 text-sm mb-2">❌ Erro na Análise</div>
                    <div class="text-xs text-gray-400">
                        Não foi possível completar a análise abrangente. Tente novamente.
                    </div>
                    <button id="retry-analysis" class="mt-2 text-xs text-blue-400 hover:text-blue-300">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
            
            const retryBtn = insightsDiv.querySelector('#retry-analysis');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    askGeminiForComprehensiveAnalysis(config, elements, apiKey, insightsDiv, logFn);
                });
            }
        }
        logFn("Gemini: Erro na análise abrangente.");
    }
}