export const scenarios = [
    {
        id: 'first_colony',
        name: 'Primeira Colônia',
        description: 'Estabeleça uma colônia próspera de criaturas e garanta sua sobrevivência a longo prazo.',
        initialConfig: {
            planetType: 'terrestrial',
            gravity: 1.0,
            atmosphere: 'oxygenated',
            luminosity: 1.0,
            temperature: 20,
            waterPresence: 70,
            soilType: 'fertile',
            minerals: 'none',
            ecosystemSize: 'medium'
        },
        initialElements: [
            { type: 'plant', x: 400, y: 200, health: 100, energy: 50, size: 10, reproductionChance: 0.1 },
            { type: 'plant', x: 450, y: 250, health: 100, energy: 50, size: 10, reproductionChance: 0.1 },
            { type: 'creature', x: 300, y: 300, health: 100, energy: 50, size: 5, speed: 1, reproductionChance: 0.05, geneSpeed: 1, geneSize: 1, geneReproductionChance: 0.05, preferredBiome: 'terrestrial' }
        ],
        victoryConditions: [
            { type: 'population', element_type: 'creature', operator: '>=', target: 50 },
            { type: 'cycles', operator: '>=', target: 5000 }
        ],
        failureConditions: [
            { type: 'population', element_type: 'creature', operator: '<=', target: 0 }
        ]
    }
    // Add more scenarios here
];

export function getScenarioById(id) {
    return scenarios.find(scenario => scenario.id === id);
}
