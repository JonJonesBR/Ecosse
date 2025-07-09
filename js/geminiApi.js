import { logToObserver } from './utils.js';

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=";

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
    const elementSummary = elements.map(el => el.type).join(', ') || 'nenhum';
    const prompt = `Você é um especialista em ecossistemas planetários. Analise o seguinte ecossistema e forneça uma breve análise da sua tendência atual (crescimento, declínio, estabilidade) e, o mais importante, **sugira uma ação proativa específica** para melhorar a saúde ou a biodiversidade do ecossistema. A sugestão deve ser concisa e direta.

Detalhes do Ecossistema:
- Planeta: ${config.planetType}
- Temperatura: ${config.temperature}°C
- Presença de Água: ${config.waterPresence}%
- Luminosidade: ${config.luminosity}x
- Gravidade: ${config.gravity}x
- Atmosfera: ${config.atmosphere}
- Tipo de Solo: ${config.soilType}
- Minerais: ${config.minerals}
- Elementos Presentes: ${elementSummary} (${elements.length} no total)

Exemplo de Sugestão: "Adicione 5 plantas para aumentar a biomassa." ou "Reduza a temperatura em 5°C para otimizar o crescimento."`;
    
    if (insightsDiv) insightsDiv.innerHTML = `<p>Analisando...</p>`;
    const insight = await askGemini(prompt, apiKey);
    if (insightsDiv && insight) insightsDiv.innerHTML = `<p>${insight}</p>`;
    logFn("Gemini: Análise de ecossistema atualizada.");
}

export async function askGeminiForElementInsight(elementType, config, apiKey, logFn) {
    const prompt = `Adicionei '${elementType}' a um planeta ${config.planetType}. Que impacto imediato ou desafio pode surgir? Responda em uma frase.`;
    const insight = await askGemini(prompt, apiKey);
    if(insight) logFn(`Gemini: ${insight}`);
}

export async function askGeminiForNarrativeEvent(config, elements, apiKey, logFn) {
    const elementSummary = elements.map(el => el.type).join(', ') || 'nenhum';
    const prompt = `Crie um evento narrativo raro e inesperado para o seguinte ecossistema em uma única frase. O evento deve ser conciso e impactante, como "Uma chuva de meteoros atinge o lado norte do planeta, causando crateras e incêndios." ou "Uma nova espécie de criatura bioluminescente é descoberta nas profundezas oceânicas."

Detalhes do Ecossistema:
- Planeta: ${config.planetType}
- Temperatura: ${config.temperature}°C
- Presença de Água: ${config.waterPresence}%
- Luminosidade: ${config.luminosity}x
- Gravidade: ${config.gravity}x
- Atmosfera: ${config.atmosphere}
- Tipo de Solo: ${config.soilType}
- Minerais: ${config.minerals}
- Elementos Presentes: ${elementSummary} (${elements.length} no total})

Evento Narrativo:`;

    const event = await askGemini(prompt, apiKey);
    if (event) logFn(`Evento Narrativo: ${event}`);
}