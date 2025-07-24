// js/ui/geneticsPanel.js
// Painel de visualização de genética para o Ecosse

/**
 * Inicializa o painel de genética na interface do usuário
 * @param {HTMLElement} container - O elemento HTML que conterá o painel
 */
export function initGeneticsPanel(container) {
    if (!container) return;
    
    // Cria o painel de genética
    const panel = document.createElement('div');
    panel.id = 'genetics-panel';
    panel.className = 'info-panel';
    panel.style.display = 'none';
    
    // Adiciona o título
    const title = document.createElement('h3');
    title.textContent = 'Informações Genéticas';
    panel.appendChild(title);
    
    // Adiciona o conteúdo
    const content = document.createElement('div');
    content.id = 'genetics-content';
    panel.appendChild(content);
    
    // Adiciona abas para diferentes categorias de traços
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'genetics-tabs';
    
    const tabs = [
        { id: 'physical', label: 'Físicos' },
        { id: 'behavioral', label: 'Comportamentais' },
        { id: 'survival', label: 'Sobrevivência' },
        { id: 'adaptation', label: 'Adaptação' },
        { id: 'special', label: 'Especiais' }
    ];
    
    tabs.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.className = 'genetics-tab';
        tabButton.dataset.tabId = tab.id;
        tabButton.textContent = tab.label;
        tabButton.addEventListener('click', () => switchGeneticsTab(tab.id));
        tabsContainer.appendChild(tabButton);
    });
    
    content.appendChild(tabsContainer);
    
    // Adiciona containers para cada categoria de traços
    tabs.forEach(tab => {
        const tabContent = document.createElement('div');
        tabContent.id = `genetics-${tab.id}`;
        tabContent.className = 'genetics-tab-content';
        tabContent.style.display = 'none';
        content.appendChild(tabContent);
    });
    
    // Adiciona seção para histórico de mutações
    const mutationHistorySection = document.createElement('div');
    mutationHistorySection.id = 'mutation-history';
    mutationHistorySection.className = 'mutation-history';
    mutationHistorySection.innerHTML = '<h4>Histórico de Mutações</h4><div id="mutation-history-content"></div>';
    content.appendChild(mutationHistorySection);
    
    // Adiciona o painel ao container
    container.appendChild(panel);
}

/**
 * Exibe informações genéticas de um elemento
 * @param {Object} element - O elemento do ecossistema
 */
export function showGeneticsInfo(element) {
    const panel = document.getElementById('genetics-panel');
    const content = document.getElementById('genetics-content');
    
    if (!panel || !content) return;
    
    // Limpa o conteúdo anterior
    content.innerHTML = '';
    
    // Verifica se o elemento tem genoma
    if (!element || !element.genome) {
        content.innerHTML = '<p>Sem informações genéticas disponíveis.</p>';
        panel.style.display = 'block';
        return;
    }
    
    // Cria a visualização do genoma
    const phenotype = element.genome.expressTraits();
    
    // Adiciona informações básicas
    const basicInfo = document.createElement('div');
    basicInfo.className = 'genetics-basic-info';
    basicInfo.innerHTML = `
        <p><strong>Tipo:</strong> ${element.type}</p>
        <p><strong>Idade:</strong> ${element.age} ciclos</p>
        <p><strong>Geração:</strong> ${element.genome.generation || 1}</p>
        <p><strong>Taxa de Mutação:</strong> ${(element.genome.baseMutationRate * 100).toFixed(1)}%</p>
        <p><strong>Intensidade de Mutação:</strong> ${(element.genome.mutationIntensity * 100).toFixed(1)}%</p>
    `;
    content.appendChild(basicInfo);
    
    // Adiciona abas para diferentes categorias de traços
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'genetics-tabs';
    
    const tabs = [
        { id: 'physical', label: 'Físicos' },
        { id: 'behavioral', label: 'Comportamentais' },
        { id: 'survival', label: 'Sobrevivência' },
        { id: 'adaptation', label: 'Adaptação' },
        { id: 'special', label: 'Especiais' }
    ];
    
    tabs.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.className = 'genetics-tab';
        tabButton.dataset.tabId = tab.id;
        tabButton.textContent = tab.label;
        tabButton.addEventListener('click', () => switchGeneticsTab(tab.id));
        tabsContainer.appendChild(tabButton);
    });
    
    content.appendChild(tabsContainer);
    
    // Função para criar uma barra de visualização para um traço
    const createTraitBar = (name, value, maxValue = 2.0) => {
        const traitDiv = document.createElement('div');
        traitDiv.className = 'trait-item';
        
        const label = document.createElement('span');
        label.className = 'trait-label';
        label.textContent = name;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'trait-value';
        valueSpan.textContent = value.toFixed(2);
        
        const barContainer = document.createElement('div');
        barContainer.className = 'trait-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'trait-bar';
        bar.style.width = `${(value / maxValue) * 100}%`;
        
        // Cor da barra baseada no valor (verde para alto, vermelho para baixo)
        const hue = (value / maxValue) * 120; // 0 = vermelho, 120 = verde
        bar.style.backgroundColor = `hsl(${hue}, 80%, 50%)`;
        
        barContainer.appendChild(bar);
        traitDiv.appendChild(label);
        traitDiv.appendChild(barContainer);
        traitDiv.appendChild(valueSpan);
        
        return traitDiv;
    };
    
    // Organiza os traços por categoria
    const traitCategories = {
        physical: ['size', 'color', 'bodyShape', 'skinTexture'],
        behavioral: ['speed', 'aggressiveness', 'intelligence', 'socialBehavior'],
        survival: ['metabolismRate', 'reproductionChance', 'lifespan', 'immuneSystem'],
        adaptation: ['temperatureTolerance', 'waterDependency', 'radiationResistance', 'toxinResistance'],
        special: ['camouflage', 'nightVision', 'regeneration', 'specialAbility']
    };
    
    // Cria containers para cada categoria
    tabs.forEach(tab => {
        const tabContent = document.createElement('div');
        tabContent.id = `genetics-${tab.id}`;
        tabContent.className = 'genetics-tab-content';
        tabContent.style.display = tab.id === 'physical' ? 'block' : 'none'; // Mostra a primeira aba por padrão
        
        const traitsContainer = document.createElement('div');
        traitsContainer.className = 'traits-container';
        
        // Adiciona barras para cada traço desta categoria
        traitCategories[tab.id].forEach(traitName => {
            if (phenotype[traitName] !== undefined) {
                // Ajusta o valor máximo para diferentes tipos de traços
                let maxValue = 2.0;
                if (traitName === 'reproductionChance') maxValue = 0.01;
                if (traitName === 'speed') maxValue = 4.0;
                
                traitsContainer.appendChild(createTraitBar(traitNameToDisplay(traitName), phenotype[traitName], maxValue));
            }
        });
        
        tabContent.appendChild(traitsContainer);
        content.appendChild(tabContent);
    });
    
    // Adiciona informações sobre os alelos (dominante/recessivo)
    const allelesInfo = document.createElement('div');
    allelesInfo.className = 'alleles-info';
    allelesInfo.innerHTML = '<h4>Alelos (Dominante/Recessivo)</h4>';
    
    const allelesTable = document.createElement('table');
    allelesTable.className = 'alleles-table';
    
    // Cabeçalho da tabela
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Traço</th>
            <th>Dominante</th>
            <th>Recessivo</th>
        </tr>
    `;
    allelesTable.appendChild(thead);
    
    // Corpo da tabela
    const tbody = document.createElement('tbody');
    
    // Agrupa os traços por categoria para a tabela
    const allTraits = [];
    for (const category in traitCategories) {
        traitCategories[category].forEach(traitName => {
            if (element.genome.traits[traitName] !== undefined) {
                allTraits.push(traitName);
            }
        });
    }
    
    // Adiciona linhas para cada traço
    allTraits.forEach(traitName => {
        const trait = element.genome.traits[traitName];
        if (typeof trait.dominant === 'number' && typeof trait.recessive === 'number') {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${traitNameToDisplay(traitName)}</td>
                <td>${trait.dominant.toFixed(2)}</td>
                <td>${trait.recessive.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        }
    });
    
    allelesTable.appendChild(tbody);
    allelesInfo.appendChild(allelesTable);
    content.appendChild(allelesInfo);
    
    // Adiciona histórico de mutações se disponível
    if (element.genome.mutationHistory && element.genome.mutationHistory.length > 0) {
        const mutationHistorySection = document.createElement('div');
        mutationHistorySection.id = 'mutation-history';
        mutationHistorySection.className = 'mutation-history';
        
        const historyTitle = document.createElement('h4');
        historyTitle.textContent = 'Histórico de Mutações';
        mutationHistorySection.appendChild(historyTitle);
        
        const historyContent = document.createElement('div');
        historyContent.id = 'mutation-history-content';
        
        // Mostra as últimas 5 mutações
        const recentMutations = element.genome.mutationHistory.slice(-5);
        if (recentMutations.length > 0) {
            const mutationsList = document.createElement('ul');
            recentMutations.forEach(mutation => {
                const mutationItem = document.createElement('li');
                mutationItem.textContent = `${traitNameToDisplay(mutation.trait)} (${mutation.allele}): ${mutation.oldValue ? mutation.oldValue.toFixed(2) : '0.00'} → ${mutation.newValue ? mutation.newValue.toFixed(2) : '0.00'}`;
                mutationsList.appendChild(mutationItem);
            });
            historyContent.appendChild(mutationsList);
        } else {
            historyContent.textContent = 'Nenhuma mutação registrada.';
        }
        
        mutationHistorySection.appendChild(historyContent);
        content.appendChild(mutationHistorySection);
    }
    
    // Exibe o painel
    panel.style.display = 'block';
}

/**
 * Oculta o painel de genética
 */
export function hideGeneticsPanel() {
    const panel = document.getElementById('genetics-panel');
    if (panel) panel.style.display = 'none';
}

/**
 * Alterna entre as abas do painel de genética
 * @param {string} tabId - ID da aba a ser exibida
 */
function switchGeneticsTab(tabId) {
    // Oculta todos os conteúdos de abas
    document.querySelectorAll('.genetics-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove a classe 'active' de todos os botões de aba
    document.querySelectorAll('.genetics-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Exibe o conteúdo da aba selecionada
    const selectedTab = document.getElementById(`genetics-${tabId}`);
    if (selectedTab) selectedTab.style.display = 'block';
    
    // Adiciona a classe 'active' ao botão da aba selecionada
    const selectedButton = document.querySelector(`.genetics-tab[data-tab-id="${tabId}"]`);
    if (selectedButton) selectedButton.classList.add('active');
}

/**
 * Converte o nome interno do traço para um nome de exibição mais amigável
 * @param {string} traitName - Nome interno do traço
 * @returns {string} Nome de exibição
 */
function traitNameToDisplay(traitName) {
    const nameMap = {
        // Traços físicos
        'size': 'Tamanho',
        'color': 'Cor',
        'bodyShape': 'Forma do Corpo',
        'skinTexture': 'Textura da Pele',
        
        // Traços comportamentais
        'speed': 'Velocidade',
        'aggressiveness': 'Agressividade',
        'intelligence': 'Inteligência',
        'socialBehavior': 'Comportamento Social',
        
        // Traços de sobrevivência
        'metabolismRate': 'Taxa Metabólica',
        'reproductionChance': 'Taxa de Reprodução',
        'lifespan': 'Longevidade',
        'immuneSystem': 'Sistema Imunológico',
        
        // Traços de adaptação
        'temperatureTolerance': 'Tolerância à Temperatura',
        'waterDependency': 'Dependência de Água',
        'radiationResistance': 'Resistência à Radiação',
        'toxinResistance': 'Resistência a Toxinas',
        
        // Traços especiais
        'camouflage': 'Camuflagem',
        'nightVision': 'Visão Noturna',
        'regeneration': 'Regeneração',
        'specialAbility': 'Habilidade Especial'
    };
    
    return nameMap[traitName] || traitName;
}

/**
 * Adiciona estilos CSS para o painel de genética
 */
export function addGeneticsPanelStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #genetics-panel {
            background-color: rgba(30, 30, 30, 0.9);
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
            color: #f0f0f0;
            max-width: 450px;
        }
        
        #genetics-panel h3 {
            margin-top: 0;
            border-bottom: 1px solid #555;
            padding-bottom: 8px;
        }
        
        #genetics-panel h4 {
            margin: 12px 0 8px;
            color: #ccc;
            border-bottom: 1px dotted #555;
            padding-bottom: 4px;
        }
        
        .genetics-basic-info {
            margin-bottom: 15px;
            padding: 8px;
            background-color: rgba(50, 50, 50, 0.5);
            border-radius: 4px;
        }
        
        .genetics-basic-info p {
            margin: 4px 0;
        }
        
        .genetics-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 10px;
            border-bottom: 1px solid #444;
            padding-bottom: 8px;
        }
        
        .genetics-tab {
            background-color: #333;
            border: none;
            color: #ccc;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .genetics-tab:hover {
            background-color: #444;
        }
        
        .genetics-tab.active {
            background-color: #4a6;
            color: #fff;
            font-weight: bold;
        }
        
        .genetics-tab-content {
            margin-bottom: 15px;
        }
        
        .traits-container {
            margin: 10px 0;
        }
        
        .trait-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .trait-label {
            width: 150px;
            font-weight: bold;
        }
        
        .trait-bar-container {
            flex-grow: 1;
            height: 12px;
            background-color: #333;
            border-radius: 6px;
            margin: 0 10px;
            overflow: hidden;
        }
        
        .trait-bar {
            height: 100%;
            border-radius: 6px;
            transition: width 0.3s ease;
        }
        
        .trait-value {
            width: 50px;
            text-align: right;
        }
        
        .alleles-info h4 {
            margin-bottom: 8px;
        }
        
        .alleles-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .alleles-table th, .alleles-table td {
            padding: 6px;
            text-align: center;
            border-bottom: 1px solid #444;
        }
        
        .alleles-table th {
            background-color: #333;
        }
        
        .alleles-table td:first-child {
            text-align: left;
        }
        
        .mutation-history {
            margin-top: 15px;
            padding: 8px;
            background-color: rgba(50, 50, 50, 0.5);
            border-radius: 4px;
        }
        
        .mutation-history h4 {
            margin-top: 0;
            border-bottom: 1px dotted #555;
            padding-bottom: 4px;
        }
        
        #mutation-history-content ul {
            margin: 0;
            padding-left: 20px;
        }
        
        #mutation-history-content li {
            margin-bottom: 4px;
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(style);
}