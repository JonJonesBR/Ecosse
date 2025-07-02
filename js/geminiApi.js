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
    const prompt = `Análise de ecossistema: Planeta ${config.planetType}, temperatura ${config.temperature}°C, ${elements.length} elementos (${elementSummary}). Qual a tendência e uma sugestão curta?`;
    
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