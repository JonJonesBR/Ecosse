/**
 * Contextual Help System
 * Provides intelligent, context-aware help and tooltips
 */

class ContextualHelp {
    constructor() {
        this.helpDatabase = new Map();
        this.activeHelp = new Map();
        this.userProgress = new Map();
        this.initialized = false;
        this.currentContext = null;
        
        // Help content database
        this.initializeHelpDatabase();
    }

    /**
     * Initialize the contextual help system
     */
    initialize() {
        if (this.initialized) return;
        
        this.setupHelpTriggers();
        this.loadUserProgress();
        this.initialized = true;
        
        console.log('Contextual help system initialized');
    }

    /**
     * Initialize help content database
     */
    initializeHelpDatabase() {
        // Element placement help
        this.helpDatabase.set('element-placement', {
            title: 'Colocação de Elementos',
            content: 'Selecione um elemento na paleta e clique no planeta para colocá-lo. Use o multiplicador para colocar vários elementos de uma vez.',
            shortcuts: ['Click para colocar', 'Shift+Click para colocar múltiplos'],
            tips: [
                'Elementos próximos interagem entre si',
                'Considere o ambiente ao colocar elementos',
                'Use água perto de plantas para melhor crescimento'
            ],
            relatedActions: ['element-selection', 'multiplier-usage'],
            difficulty: 'beginner',
            category: 'placement'
        });

        this.helpDatabase.set('element-selection', {
            title: 'Seleção de Elementos',
            content: 'Cada elemento tem características únicas. Plantas precisam de água e luz, criaturas se alimentam de plantas, e rochas fornecem minerais.',
            shortcuts: ['1-9 para seleção rápida', 'Tab para navegar'],
            tips: [
                'Comece com elementos básicos: água, plantas, sol',
                'Adicione criaturas depois que as plantas estiverem estabelecidas',
                'Rochas fornecem minerais essenciais para o crescimento'
            ],
            relatedActions: ['element-placement', 'ecosystem-balance'],
            difficulty: 'beginner',
            category: 'elements'
        });

        this.helpDatabase.set('simulation-controls', {
            title: 'Controles de Simulação',
            content: 'Controle o tempo da simulação para observar a evolução do ecossistema. Use pausa para analisar detalhadamente.',
            shortcuts: ['Space para pausar/continuar', 'T para time-lapse'],
            tips: [
                'Use pausa para planejar suas próximas ações',
                'Time-lapse acelera a observação de mudanças lentas',
                'Observe os ciclos naturais do ecossistema'
            ],
            relatedActions: ['ecosystem-analysis', 'time-management'],
            difficulty: 'beginner',
            category: 'controls'
        });

        this.helpDatabase.set('ecosystem-balance', {
            title: 'Equilíbrio do Ecossistema',
            content: 'Um ecossistema saudável precisa de produtores (plantas), consumidores (criaturas) e decompositores (fungos) em proporções adequadas.',
            shortcuts: ['R para análise rápida', 'G para gráficos'],
            tips: [
                'Muitas criaturas podem esgotar as plantas',
                'Poucas criaturas podem levar ao supercrescimento de plantas',
                'Diversidade é chave para estabilidade'
            ],
            relatedActions: ['population-management', 'resource-monitoring'],
            difficulty: 'intermediate',
            category: 'ecology'
        });

        this.helpDatabase.set('advanced-interactions', {
            title: 'Interações Avançadas',
            content: 'Elementos interagem de formas complexas. Predadores controlam populações, clima afeta crescimento, e tecnologias modificam comportamentos.',
            shortcuts: ['Alt+Click para detalhes', 'Ctrl+Click para interagir'],
            tips: [
                'Observe as cadeias alimentares que se formam',
                'Clima extremo pode causar extinções',
                'Tecnologias podem salvar ecossistemas em crise'
            ],
            relatedActions: ['predator-prey', 'climate-effects', 'technology-tree'],
            difficulty: 'advanced',
            category: 'interactions'
        });

        this.helpDatabase.set('technology-tree', {
            title: 'Árvore Tecnológica',
            content: 'Desbloqueie tecnologias usando recursos minerais. Cada tecnologia oferece novas capacidades e modificações no ecossistema.',
            shortcuts: ['F para abrir árvore', 'Enter para desbloquear'],
            tips: [
                'Colete minerais de rochas para desbloquear tecnologias',
                'Algumas tecnologias têm pré-requisitos',
                'Tecnologias podem alterar fundamentalmente o ecossistema'
            ],
            relatedActions: ['resource-collection', 'tech-unlocking'],
            difficulty: 'intermediate',
            category: 'progression'
        });

        this.helpDatabase.set('achievements', {
            title: 'Sistema de Conquistas',
            content: 'Complete desafios para desbloquear conquistas. Cada conquista oferece recompensas e reconhecimento do seu progresso.',
            shortcuts: ['A para ver conquistas', 'H para histórico'],
            tips: [
                'Algumas conquistas são secretas',
                'Conquistas oferecem bônus permanentes',
                'Tente diferentes estratégias para conquistar todas'
            ],
            relatedActions: ['challenge-completion', 'progress-tracking'],
            difficulty: 'intermediate',
            category: 'progression'
        });

        this.helpDatabase.set('camera-controls', {
            title: 'Controles de Câmera',
            content: 'Navegue pelo mundo 3D usando mouse e teclado. Aproxime-se para ver detalhes ou afaste-se para visão geral.',
            shortcuts: ['Mouse para rotacionar', 'Scroll para zoom', 'WASD para mover'],
            tips: [
                'Use zoom para inspecionar elementos individuais',
                'Rotação ajuda a ver o ecossistema de diferentes ângulos',
                'Botão de reset restaura a visão padrão'
            ],
            relatedActions: ['element-inspection', 'overview-analysis'],
            difficulty: 'beginner',
            category: 'navigation'
        });

        this.helpDatabase.set('save-load', {
            title: 'Salvar e Carregar',
            content: 'Salve seu progresso para continuar depois ou compartilhe seus ecossistemas com outros jogadores.',
            shortcuts: ['Ctrl+S para salvar', 'Ctrl+L para carregar'],
            tips: [
                'Salvamentos automáticos protegem seu progresso',
                'Compartilhe ecossistemas interessantes com amigos',
                'Carregue salvamentos antigos para comparar evolução'
            ],
            relatedActions: ['progress-saving', 'sharing'],
            difficulty: 'beginner',
            category: 'management'
        });
    }

    /**
     * Setup help triggers and event listeners
     */
    setupHelpTriggers() {
        // Help button triggers
        document.addEventListener('click', (event) => {
            const helpTrigger = event.target.closest('[data-help]');
            if (helpTrigger) {
                event.preventDefault();
                this.showContextualHelp(helpTrigger.dataset.help, helpTrigger);
            }
        });

        // Keyboard shortcuts for help
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F1' || (event.key === '?' && event.shiftKey)) {
                event.preventDefault();
                this.showGeneralHelp();
            }
            
            if (event.key === 'Escape') {
                this.hideAllHelp();
            }
        });

        // Context-sensitive help triggers
        this.setupContextSensitiveHelp();
    }

    /**
     * Setup context-sensitive help based on user actions
     */
    setupContextSensitiveHelp() {
        // Show help for first-time users
        setTimeout(() => {
            if (!this.getUserProgress('tutorial_completed')) {
                this.startGuidedTutorial();
            }
        }, 2000);

        // Monitor user actions for contextual help opportunities
        this.monitorUserActions();
    }

    /**
     * Show contextual help for a specific topic
     */
    showContextualHelp(topic, element = null) {
        const helpData = this.helpDatabase.get(topic);
        if (!helpData) {
            console.warn(`Help topic not found: ${topic}`);
            return;
        }

        // Track help usage
        this.trackHelpUsage(topic);

        // Create help content
        const helpContent = this.createHelpContent(helpData, topic);
        
        if (element) {
            this.showTooltipHelp(element, helpContent);
        } else {
            this.showModalHelp(helpContent);
        }
    }

    /**
     * Create help content HTML
     */
    createHelpContent(helpData, topic) {
        const difficulty = helpData.difficulty || 'beginner';
        const difficultyColors = {
            beginner: '#10b981',
            intermediate: '#f59e0b',
            advanced: '#ef4444'
        };

        let shortcutsHtml = '';
        if (helpData.shortcuts && helpData.shortcuts.length > 0) {
            shortcutsHtml = `
                <div class="help-shortcuts">
                    <h5>Atalhos:</h5>
                    ${helpData.shortcuts.map(shortcut => 
                        `<span class="help-shortcut">${shortcut}</span>`
                    ).join('')}
                </div>
            `;
        }

        let tipsHtml = '';
        if (helpData.tips && helpData.tips.length > 0) {
            tipsHtml = `
                <div class="help-tips">
                    <h5>💡 Dicas:</h5>
                    <ul>
                        ${helpData.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        let relatedHtml = '';
        if (helpData.relatedActions && helpData.relatedActions.length > 0) {
            relatedHtml = `
                <div class="help-related">
                    <h5>Tópicos Relacionados:</h5>
                    <div class="help-related-links">
                        ${helpData.relatedActions.map(action => 
                            `<button class="help-link" data-help="${action}">${this.getTopicTitle(action)}</button>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="contextual-help-content">
                <div class="help-header">
                    <h4>${helpData.title}</h4>
                    <span class="help-difficulty" style="color: ${difficultyColors[difficulty]}">
                        ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                </div>
                <div class="help-body">
                    <p>${helpData.content}</p>
                    ${shortcutsHtml}
                    ${tipsHtml}
                    ${relatedHtml}
                </div>
                <div class="help-actions">
                    <button class="help-action-btn" onclick="contextualHelp.markAsHelpful('${topic}')">
                        👍 Útil
                    </button>
                    <button class="help-action-btn" onclick="contextualHelp.requestMoreHelp('${topic}')">
                        ❓ Mais Ajuda
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show tooltip-style help
     */
    showTooltipHelp(element, content) {
        // Use the feedback system's tooltip if available
        if (window.feedbackSystem) {
            window.feedbackSystem.showTooltip(element, {
                title: '',
                content: content,
                delay: 100
            });
        } else {
            // Fallback to simple tooltip
            this.showSimpleTooltip(element, content);
        }
    }

    /**
     * Show modal-style help
     */
    showModalHelp(content) {
        const modal = document.createElement('div');
        modal.className = 'help-modal-overlay';
        modal.innerHTML = `
            <div class="help-modal">
                <div class="help-modal-header">
                    <h3>Ajuda Contextual</h3>
                    <button class="help-modal-close">×</button>
                </div>
                <div class="help-modal-content">
                    ${content}
                </div>
            </div>
            <style>
                .help-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 3000;
                    backdrop-filter: blur(4px);
                }
                
                .help-modal {
                    background-color: #1e293b;
                    border-radius: 1rem;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .help-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #334155;
                    background-color: #0f172a;
                    border-radius: 1rem 1rem 0 0;
                }
                
                .help-modal-header h3 {
                    margin: 0;
                    color: #e2e8f0;
                }
                
                .help-modal-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    transition: all 0.2s ease;
                }
                
                .help-modal-close:hover {
                    background-color: #334155;
                    color: #e2e8f0;
                }
                
                .help-modal-content {
                    padding: 1.5rem;
                }
                
                .contextual-help-content {
                    color: #e2e8f0;
                }
                
                .help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #334155;
                }
                
                .help-header h4 {
                    margin: 0;
                    color: #e2e8f0;
                }
                
                .help-difficulty {
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                .help-body p {
                    line-height: 1.6;
                    margin-bottom: 1rem;
                    color: #cbd5e1;
                }
                
                .help-shortcuts {
                    margin-bottom: 1rem;
                }
                
                .help-shortcuts h5 {
                    margin: 0 0 0.5rem 0;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                }
                
                .help-shortcut {
                    display: inline-block;
                    background-color: #475569;
                    color: #cbd5e1;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    font-size: 0.8rem;
                    margin: 0.25rem 0.25rem 0 0;
                }
                
                .help-tips {
                    margin-bottom: 1rem;
                }
                
                .help-tips h5 {
                    margin: 0 0 0.5rem 0;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                }
                
                .help-tips ul {
                    margin: 0;
                    padding-left: 1.5rem;
                    color: #94a3b8;
                }
                
                .help-tips li {
                    margin-bottom: 0.25rem;
                    line-height: 1.4;
                }
                
                .help-related {
                    margin-bottom: 1rem;
                }
                
                .help-related h5 {
                    margin: 0 0 0.5rem 0;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                }
                
                .help-related-links {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                
                .help-link {
                    background-color: #334155;
                    color: #e2e8f0;
                    border: none;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                }
                
                .help-link:hover {
                    background-color: #475569;
                    transform: translateY(-1px);
                }
                
                .help-actions {
                    display: flex;
                    gap: 0.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #334155;
                }
                
                .help-action-btn {
                    background-color: #6366f1;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }
                
                .help-action-btn:hover {
                    background-color: #4f46e5;
                    transform: translateY(-1px);
                }
            </style>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.help-modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on overlay click
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Handle related topic links
        modal.addEventListener('click', (event) => {
            const helpLink = event.target.closest('.help-link');
            if (helpLink) {
                event.preventDefault();
                document.body.removeChild(modal);
                this.showContextualHelp(helpLink.dataset.help);
            }
        });

        document.body.appendChild(modal);
    }

    /**
     * Start guided tutorial for new users
     */
    startGuidedTutorial() {
        const tutorialSteps = [
            {
                element: '.element-grid',
                topic: 'element-selection',
                message: 'Bem-vindo ao Ecosse™! Comece selecionando um elemento aqui.'
            },
            {
                element: '#three-js-canvas-container',
                topic: 'element-placement',
                message: 'Agora clique no planeta para colocar o elemento selecionado.'
            },
            {
                element: '.multiplier-buttons',
                topic: 'multiplier-usage',
                message: 'Use estes botões para colocar múltiplos elementos de uma vez.'
            },
            {
                element: '#play-pause-btn',
                topic: 'simulation-controls',
                message: 'Controle o tempo da simulação com estes botões.'
            }
        ];

        this.runTutorial(tutorialSteps);
    }

    /**
     * Run interactive tutorial
     */
    runTutorial(steps, currentStep = 0) {
        if (currentStep >= steps.length) {
            this.setUserProgress('tutorial_completed', true);
            this.showNotification('Tutorial concluído! Explore e divirta-se criando ecossistemas.', 'success');
            return;
        }

        const step = steps[currentStep];
        const element = document.querySelector(step.element);
        
        if (!element) {
            // Skip this step if element not found
            this.runTutorial(steps, currentStep + 1);
            return;
        }

        // Highlight element
        this.highlightElement(element);

        // Show tutorial tooltip
        this.showTutorialTooltip(element, step.message, () => {
            this.removeHighlight(element);
            this.runTutorial(steps, currentStep + 1);
        });
    }

    /**
     * Monitor user actions for contextual help opportunities
     */
    monitorUserActions() {
        // Monitor element placement attempts
        document.addEventListener('click', (event) => {
            if (event.target.closest('#three-js-canvas-container')) {
                this.trackAction('element-placement-attempt');
            }
        });

        // Monitor element selection
        document.addEventListener('click', (event) => {
            if (event.target.closest('.element-item')) {
                this.trackAction('element-selection');
            }
        });

        // Monitor simulation controls usage
        document.addEventListener('click', (event) => {
            if (event.target.closest('#play-pause-btn, #time-lapse-btn')) {
                this.trackAction('simulation-control-usage');
            }
        });
    }

    /**
     * Track user actions and provide contextual help
     */
    trackAction(action) {
        const actionCount = this.getUserProgress(action) || 0;
        this.setUserProgress(action, actionCount + 1);

        // Provide help based on action patterns
        if (action === 'element-placement-attempt' && actionCount === 0) {
            setTimeout(() => {
                this.showContextualHelp('element-placement');
            }, 1000);
        }
    }

    /**
     * Get topic title by ID
     */
    getTopicTitle(topicId) {
        const helpData = this.helpDatabase.get(topicId);
        return helpData ? helpData.title : topicId;
    }

    /**
     * Track help usage for analytics
     */
    trackHelpUsage(topic) {
        const usage = this.getUserProgress(`help_${topic}`) || 0;
        this.setUserProgress(`help_${topic}`, usage + 1);
    }

    /**
     * Mark help as helpful
     */
    markAsHelpful(topic) {
        this.setUserProgress(`helpful_${topic}`, true);
        this.showNotification('Obrigado pelo feedback!', 'success');
    }

    /**
     * Request more help
     */
    requestMoreHelp(topic) {
        // This could open a more detailed help or contact form
        this.showNotification('Mais recursos de ajuda em breve!', 'info');
    }

    /**
     * User progress management
     */
    getUserProgress(key) {
        return this.userProgress.get(key);
    }

    setUserProgress(key, value) {
        this.userProgress.set(key, value);
        this.saveUserProgress();
    }

    loadUserProgress() {
        try {
            const saved = localStorage.getItem('ecosse_help_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.userProgress = new Map(Object.entries(data));
            }
        } catch (e) {
            console.warn('Failed to load user progress:', e);
        }
    }

    saveUserProgress() {
        try {
            const data = Object.fromEntries(this.userProgress);
            localStorage.setItem('ecosse_help_progress', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save user progress:', e);
        }
    }

    /**
     * Utility methods
     */
    showNotification(message, type = 'info') {
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification({
                type,
                title: 'Ajuda',
                message,
                duration: 3000
            });
        }
    }

    highlightElement(element) {
        element.classList.add('help-highlight');
        element.style.cssText += `
            position: relative;
            z-index: 1600;
            box-shadow: 0 0 0 3px #6366f1, 0 0 20px rgba(99, 102, 241, 0.5);
            border-radius: 0.5rem;
        `;
    }

    removeHighlight(element) {
        element.classList.remove('help-highlight');
        element.style.boxShadow = '';
        element.style.zIndex = '';
    }

    showTutorialTooltip(element, message, onNext) {
        // Implementation would depend on available tooltip system
        console.log(`Tutorial: ${message}`);
        setTimeout(onNext, 3000); // Auto-advance for now
    }

    hideAllHelp() {
        // Close all open help modals and tooltips
        document.querySelectorAll('.help-modal-overlay').forEach(modal => {
            modal.remove();
        });
    }

    showGeneralHelp() {
        this.showModalHelp(`
            <div class="general-help">
                <h4>Ajuda Geral - Ecosse™</h4>
                <p>Bem-vindo ao Ecosse™, seu sandbox planetário 3D!</p>
                
                <div class="help-categories">
                    <button class="help-category-btn" data-help="element-selection">
                        🧩 Elementos
                    </button>
                    <button class="help-category-btn" data-help="simulation-controls">
                        ⏯️ Controles
                    </button>
                    <button class="help-category-btn" data-help="ecosystem-balance">
                        🌱 Ecossistema
                    </button>
                    <button class="help-category-btn" data-help="technology-tree">
                        🔬 Tecnologia
                    </button>
                </div>
                
                <div class="help-quick-tips">
                    <h5>Dicas Rápidas:</h5>
                    <ul>
                        <li>Pressione F1 para ajuda contextual</li>
                        <li>Use ? para dicas sobre elementos</li>
                        <li>Pressione Esc para fechar ajuda</li>
                    </ul>
                </div>
            </div>
        `);
    }
}

// Create and export singleton instance
export const contextualHelp = new ContextualHelp();
export default contextualHelp;

// Make it globally available for inline event handlers
window.contextualHelp = contextualHelp;