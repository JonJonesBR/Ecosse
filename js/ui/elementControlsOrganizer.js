/**
 * Element Controls Organizer - Enhanced organization for Ecosse™ Planetary Sandbox
 * Provides category expansion/collapse, compact mode, and better space utilization
 */

class ElementControlsOrganizer {
    constructor() {
        this.categories = new Map();
        this.isCompactMode = false;
        this.collapsedCategories = new Set();
        this.priorityCategories = ['basic', 'plants', 'animals']; // Always visible categories
        
        // Lazy loading and performance optimization properties
        this.intersectionObserver = null;
        this.lazyLoadedCategories = new Set();
        this.visibilityCache = new Map();
        this.performanceMetrics = {
            layoutCalculations: 0,
            domUpdates: 0,
            lazyLoads: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            console.log('🔧 Initializing Element Controls Organizer...');
            
            // Wait for DOM to be ready
            if (!this.validateDOMStructure()) {
                console.warn('⚠️ DOM structure not ready, retrying in 100ms...');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            this.setupCategoryStructure();
            this.createCategoryControls();
            this.setupEventListeners();
            this.setupResponsiveHandling();
            this.setupLazyLoading();
            this.loadSavedState();
            this.applyInitialLayout();
            console.log('✅ Element Controls Organizer initialization complete');
        } catch (error) {
            console.error('❌ Error during Element Controls Organizer initialization:', error);
            throw error;
        }
    }
    
    validateDOMStructure() {
        const categoriesContainer = document.querySelector('.element-categories');
        const bottomPanel = document.getElementById('bottom-panel');
        const existingCategories = document.querySelectorAll('.element-category');
        
        if (!categoriesContainer) {
            console.warn('⚠️ Element categories container not found');
            return false;
        }
        
        if (!bottomPanel) {
            console.warn('⚠️ Bottom panel not found');
            return false;
        }
        
        if (existingCategories.length === 0) {
            console.warn('⚠️ No existing categories found');
            return false;
        }
        
        console.log(`✅ DOM structure validated: ${existingCategories.length} categories found`);
        return true;
    }
    
    setupCategoryStructure() {
        // Define category metadata
        this.categoryConfig = {
            basic: {
                title: '🌍 Elementos Básicos',
                priority: 1,
                collapsible: false, // Always expanded
                elements: ['water', 'rock', 'sun', 'rain']
            },
            plants: {
                title: '🌱 Vida Vegetal', 
                priority: 2,
                collapsible: true,
                elements: ['plant', 'carnivorous_plant', 'crystal_tree', 'spore_moss', 'fire_flower', 'fungus']
            },
            animals: {
                title: '🐾 Vida Animal',
                priority: 3,
                collapsible: true,
                elements: ['creature', 'aquatic_creature', 'flying_creature', 'burrowing_creature', 'symbiotic_creature', 'predator']
            },
            civilization: {
                title: '🏛️ Civilização & Tecnologia',
                priority: 4,
                collapsible: true,
                elements: ['tribe', 'extractionProbe']
            },
            special: {
                title: '✨ Elementos Especiais',
                priority: 5,
                collapsible: true,
                elements: ['energy_crystal', 'time_anomaly', 'portal_stone', 'life_spring']
            },
            events: {
                title: '🌪️ Eventos & Ferramentas',
                priority: 6,
                collapsible: true,
                elements: ['meteor', 'volcano', 'eraser']
            }
        };
        
        // Initialize category states
        Object.keys(this.categoryConfig).forEach(categoryId => {
            this.categories.set(categoryId, {
                ...this.categoryConfig[categoryId],
                expanded: !this.categoryConfig[categoryId].collapsible || this.priorityCategories.includes(categoryId),
                visible: true
            });
        });
    }
    
    createCategoryControls() {
        const categoriesContainer = document.querySelector('.element-categories');
        if (!categoriesContainer) {
            console.error('❌ Element categories container not found');
            return;
        }
        
        console.log('🔧 Enhancing existing categories...');
        
        // Work with existing categories instead of clearing them
        this.enhanceExistingCategories();
        
        // Add category management controls
        this.createCategoryManagementControls(categoriesContainer);
        
        // Apply initial state to DOM
        this.updateAllCategoryVisibility();
        
        // Apply compact mode if enabled
        if (this.isCompactMode) {
            const bottomPanel = document.getElementById('bottom-panel');
            if (bottomPanel) {
                bottomPanel.classList.add('compact-mode');
            }
            this.updateLayoutForCompactMode();
        }
        
        console.log('✅ Category controls created successfully');
    }
    
    enhanceExistingCategories() {
        const existingCategories = document.querySelectorAll('.element-category');
        const categoryIds = Object.keys(this.categoryConfig);
        
        console.log(`🔧 Found ${existingCategories.length} existing categories, expecting ${categoryIds.length}`);
        
        existingCategories.forEach((categoryElement, index) => {
            const categoryId = categoryIds[index];
            const categoryData = this.categoryConfig[categoryId];
            
            if (!categoryData) {
                console.warn(`⚠️ No category data found for index ${index}, categoryId: ${categoryId}`);
                return;
            }
            
            console.log(`🔧 Enhancing category: ${categoryId} - ${categoryData.title}`);
            
            // Add data attribute for identification
            categoryElement.dataset.categoryId = categoryId;
            categoryElement.className = `element-category category-${categoryId}`;
            
            // Enhance the header
            this.enhanceCategoryHeader(categoryElement, categoryId, categoryData);
            
            // Find or create content wrapper
            let contentElement = categoryElement.querySelector('.category-content');
            if (!contentElement) {
                // Create content wrapper around the element grid
                const elementGrid = categoryElement.querySelector('.element-grid');
                if (elementGrid) {
                    contentElement = document.createElement('div');
                    contentElement.className = 'category-content';
                    
                    // Move the grid into the content wrapper
                    elementGrid.parentNode.insertBefore(contentElement, elementGrid);
                    contentElement.appendChild(elementGrid);
                } else {
                    console.warn(`⚠️ No element grid found in category ${categoryId}`);
                    return;
                }
            }
            
            // Set initial visibility based on saved state
            const category = this.categories.get(categoryId);
            const isExpanded = category ? category.expanded : !categoryData.collapsible;
            contentElement.style.display = isExpanded ? 'block' : 'none';
            
            // Update category state to match DOM
            if (category) {
                category.expanded = isExpanded;
            }
            
            console.log(`✅ Enhanced category ${categoryId}, expanded: ${isExpanded}`);
        });
    }
    
    enhanceCategoryHeader(categoryElement, categoryId, categoryData) {
        let headerElement = categoryElement.querySelector('h4');
        if (!headerElement) {
            console.warn(`⚠️ No h4 header found in category ${categoryId}`);
            return;
        }
        
        // Check if already enhanced
        if (headerElement.parentElement && headerElement.parentElement.classList.contains('category-header')) {
            console.log(`ℹ️ Category ${categoryId} header already enhanced`);
            return;
        }
        
        // Create header wrapper
        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';
        
        // Clone and enhance the existing header
        const titleElement = headerElement.cloneNode(true);
        titleElement.className = 'category-title';
        headerDiv.appendChild(titleElement);
        
        // Add collapse/expand button if collapsible
        if (categoryData.collapsible) {
            const category = this.categories.get(categoryId);
            const isExpanded = category ? category.expanded : true;
            
            const toggleButton = document.createElement('button');
            toggleButton.className = 'category-toggle-btn';
            toggleButton.innerHTML = isExpanded ? 
                '<i class="fas fa-chevron-up"></i>' : 
                '<i class="fas fa-chevron-down"></i>';
            toggleButton.title = isExpanded ? 'Colapsar categoria' : 'Expandir categoria';
            toggleButton.setAttribute('aria-label', isExpanded ? 'Colapsar categoria' : 'Expandir categoria');
            toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCategory(categoryId);
            });
            
            headerDiv.appendChild(toggleButton);
        }
        
        // Replace the original header
        headerElement.parentNode.replaceChild(headerDiv, headerElement);
        
        console.log(`✅ Enhanced header for category ${categoryId}`);
    }
    

    
    createCategoryManagementControls(container) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'category-management-controls';
        
        // Compact mode toggle
        const compactToggle = document.createElement('button');
        compactToggle.className = 'category-control-btn compact-mode-btn';
        compactToggle.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
        compactToggle.title = 'Alternar modo compacto';
        compactToggle.addEventListener('click', () => this.toggleCompactMode());
        
        // Expand all button
        const expandAllBtn = document.createElement('button');
        expandAllBtn.className = 'category-control-btn expand-all-btn';
        expandAllBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
        expandAllBtn.title = 'Expandir todas as categorias';
        expandAllBtn.addEventListener('click', () => this.expandAllCategories());
        
        // Collapse all button
        const collapseAllBtn = document.createElement('button');
        collapseAllBtn.className = 'category-control-btn collapse-all-btn';
        collapseAllBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
        collapseAllBtn.title = 'Colapsar categorias não essenciais';
        collapseAllBtn.addEventListener('click', () => this.collapseNonEssentialCategories());
        
        // Smart layout button
        const smartLayoutBtn = document.createElement('button');
        smartLayoutBtn.className = 'category-control-btn smart-layout-btn';
        smartLayoutBtn.innerHTML = '<i class="fas fa-magic"></i>';
        smartLayoutBtn.title = 'Layout inteligente baseado no uso';
        smartLayoutBtn.addEventListener('click', () => this.applySmartLayout());
        
        controlsDiv.appendChild(compactToggle);
        controlsDiv.appendChild(expandAllBtn);
        controlsDiv.appendChild(collapseAllBtn);
        controlsDiv.appendChild(smartLayoutBtn);
        
        container.appendChild(controlsDiv);
    }
    
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault();
                this.toggleCompactMode();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.expandAllCategories();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.collapseNonEssentialCategories();
            }
        });
        
        // Track element usage for smart layout
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('element-item')) {
                const elementId = e.target.dataset.element;
                if (elementId) {
                    this.trackElementUsage(elementId);
                }
            }
        });
        
        // Responsive handling
        window.addEventListener('resize', () => {
            this.handleResponsiveLayout();
        });
    }
    
    setupResponsiveHandling() {
        const mediaQueries = {
            mobile: window.matchMedia('(max-width: 768px)'),
            tablet: window.matchMedia('(max-width: 1024px)'),
            desktop: window.matchMedia('(min-width: 1025px)')
        };
        
        // Debounce responsive layout changes
        let responsiveTimeout;
        const debouncedResponsiveHandler = () => {
            if (responsiveTimeout) {
                clearTimeout(responsiveTimeout);
            }
            responsiveTimeout = setTimeout(() => {
                this.handleResponsiveLayout();
            }, 100);
        };
        
        Object.entries(mediaQueries).forEach(([breakpoint, mq]) => {
            mq.addListener(debouncedResponsiveHandler);
        });
        
        this.handleResponsiveLayout();
    }
    
    /**
     * Set up lazy loading for non-visible panel content
     */
    setupLazyLoading() {
        // Only set up intersection observer if supported
        if (typeof window.IntersectionObserver === 'undefined') {
            console.warn('IntersectionObserver not supported, skipping lazy loading');
            return;
        }
        
        this.intersectionObserver = new window.IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.lazyLoadCategoryContent(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '50px', // Load content 50px before it becomes visible
            threshold: 0.1
        });
        
        // Observe all category content elements
        this.observeCategoryElements();
    }
    
    /**
     * Observe category elements for lazy loading
     */
    observeCategoryElements() {
        const categoryElements = document.querySelectorAll('.element-category');
        categoryElements.forEach(categoryElement => {
            const categoryId = categoryElement.dataset.categoryId;
            
            // Only observe non-priority categories for lazy loading
            if (!this.priorityCategories.includes(categoryId)) {
                this.intersectionObserver.observe(categoryElement);
            }
        });
    }
    
    /**
     * Lazy load category content when it becomes visible
     * @param {Element} categoryElement - The category element that became visible
     */
    lazyLoadCategoryContent(categoryElement) {
        const categoryId = categoryElement.dataset.categoryId;
        
        if (this.lazyLoadedCategories.has(categoryId)) {
            return; // Already loaded
        }
        
        console.log(`🔄 Lazy loading category: ${categoryId}`);
        
        // Mark as loaded
        this.lazyLoadedCategories.add(categoryId);
        this.performanceMetrics.lazyLoads++;
        
        // Load category-specific enhancements
        this.loadCategoryEnhancements(categoryElement, categoryId);
        
        // Stop observing this element
        this.intersectionObserver.unobserve(categoryElement);
    }
    
    /**
     * Load enhancements for a specific category
     * @param {Element} categoryElement - The category element
     * @param {string} categoryId - The category identifier
     */
    loadCategoryEnhancements(categoryElement, categoryId) {
        const contentElement = categoryElement.querySelector('.category-content');
        if (!contentElement) return;
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'category-loading';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
        contentElement.appendChild(loadingIndicator);
        
        // Simulate loading delay for demonstration (remove in production)
        setTimeout(() => {
            // Remove loading indicator
            loadingIndicator.remove();
            
            // Add enhanced functionality
            this.addCategoryEnhancements(categoryElement, categoryId);
            
            // Mark as fully loaded
            categoryElement.classList.add('lazy-loaded');
            
        }, 100); // Minimal delay for smooth UX
    }
    
    /**
     * Add enhanced functionality to a category
     * @param {Element} categoryElement - The category element
     * @param {string} categoryId - The category identifier
     */
    addCategoryEnhancements(categoryElement, categoryId) {
        const elements = categoryElement.querySelectorAll('.element-item');
        
        // Add enhanced tooltips and interactions
        elements.forEach(element => {
            // Add hover effects
            element.addEventListener('mouseenter', () => {
                this.showEnhancedTooltip(element);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideEnhancedTooltip();
            });
            
            // Add usage tracking
            element.addEventListener('click', () => {
                this.trackElementUsage(element.dataset.element);
            });
        });
        
        console.log(`✅ Enhanced category ${categoryId} with ${elements.length} elements`);
    }
    
    /**
     * Show enhanced tooltip for an element
     * @param {Element} element - The element to show tooltip for
     */
    showEnhancedTooltip(element) {
        // Implementation for enhanced tooltips
        // This would be expanded based on specific requirements
        const tooltip = document.createElement('div');
        tooltip.className = 'enhanced-tooltip';
        tooltip.textContent = `Enhanced info for ${element.textContent}`;
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
        
        this._currentTooltip = tooltip;
    }
    
    /**
     * Hide enhanced tooltip
     */
    hideEnhancedTooltip() {
        if (this._currentTooltip) {
            this._currentTooltip.remove();
            this._currentTooltip = null;
        }
    }
    
    handleResponsiveLayout() {
        this.performanceMetrics.layoutCalculations++;
        
        const currentWidth = window.innerWidth;
        const isMobile = currentWidth <= 768;
        const isTablet = currentWidth <= 1024;
        
        // Cache viewport state to avoid redundant calculations
        const viewportKey = `${currentWidth}x${window.innerHeight}`;
        if (this.visibilityCache.has(viewportKey)) {
            const cachedLayout = this.visibilityCache.get(viewportKey);
            this.applyCachedLayout(cachedLayout);
            return;
        }
        
        // Calculate new layout
        let layoutConfig;
        if (isMobile) {
            layoutConfig = {
                compactMode: true,
                collapseNonEssential: true,
                gridColumns: 2
            };
            this.enableCompactMode();
            this.collapseNonEssentialCategories();
            this.adjustGridColumns(2);
        } else if (isTablet) {
            layoutConfig = {
                compactMode: false,
                collapseNonEssential: false,
                gridColumns: 3
            };
            this.adjustGridColumns(3);
        } else {
            layoutConfig = {
                compactMode: false,
                collapseNonEssential: false,
                gridColumns: 4
            };
            this.adjustGridColumns(4);
        }
        
        // Cache the layout configuration
        this.visibilityCache.set(viewportKey, layoutConfig);
        
        // Limit cache size to prevent memory leaks
        if (this.visibilityCache.size > 10) {
            const firstKey = this.visibilityCache.keys().next().value;
            this.visibilityCache.delete(firstKey);
        }
    }
    
    /**
     * Apply cached layout configuration for performance
     * @param {Object} layoutConfig - Cached layout configuration
     */
    applyCachedLayout(layoutConfig) {
        if (layoutConfig.compactMode && !this.isCompactMode) {
            this.enableCompactMode();
        } else if (!layoutConfig.compactMode && this.isCompactMode) {
            this.toggleCompactMode();
        }
        
        if (layoutConfig.collapseNonEssential) {
            this.collapseNonEssentialCategories();
        }
        
        this.adjustGridColumns(layoutConfig.gridColumns);
    }
    
    adjustGridColumns(columns) {
        const grids = document.querySelectorAll('.element-grid');
        grids.forEach(grid => {
            grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        });
    }
    
    toggleCategory(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category || !category.collapsible) {
            console.warn(`⚠️ Cannot toggle category ${categoryId}: not found or not collapsible`);
            return;
        }
        
        console.log(`🔄 Toggling category ${categoryId} from ${category.expanded} to ${!category.expanded}`);
        
        category.expanded = !category.expanded;
        
        const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (!categoryElement) {
            console.error(`❌ Category element not found for ${categoryId}`);
            return;
        }
        
        const contentElement = categoryElement.querySelector('.category-content');
        const toggleButton = categoryElement.querySelector('.category-toggle-btn');
        
        if (category.expanded) {
            if (contentElement) {
                contentElement.style.display = 'block';
                contentElement.setAttribute('aria-hidden', 'false');
            }
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
                toggleButton.title = 'Colapsar categoria';
                toggleButton.setAttribute('aria-label', 'Colapsar categoria');
                toggleButton.setAttribute('aria-expanded', 'true');
            }
            this.collapsedCategories.delete(categoryId);
            console.log(`✅ Expanded category ${categoryId}`);
        } else {
            if (contentElement) {
                contentElement.style.display = 'none';
                contentElement.setAttribute('aria-hidden', 'true');
            }
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
                toggleButton.title = 'Expandir categoria';
                toggleButton.setAttribute('aria-label', 'Expandir categoria');
                toggleButton.setAttribute('aria-expanded', 'false');
            }
            this.collapsedCategories.add(categoryId);
            console.log(`✅ Collapsed category ${categoryId}`);
        }
        
        this.saveState();
        this.updateCategoryVisibility();
    }
    
    toggleCompactMode() {
        this.isCompactMode = !this.isCompactMode;
        
        console.log(`🔄 Toggling compact mode to: ${this.isCompactMode}`);
        
        const bottomPanel = document.getElementById('bottom-panel');
        const compactBtn = document.querySelector('.compact-mode-btn');
        
        if (!bottomPanel) {
            console.error('❌ Bottom panel not found');
            return;
        }
        
        if (this.isCompactMode) {
            bottomPanel.classList.add('compact-mode');
            if (compactBtn) {
                compactBtn.classList.add('active');
                compactBtn.title = 'Desativar modo compacto';
                compactBtn.setAttribute('aria-pressed', 'true');
            }
            console.log('✅ Enabled compact mode');
        } else {
            bottomPanel.classList.remove('compact-mode');
            if (compactBtn) {
                compactBtn.classList.remove('active');
                compactBtn.title = 'Ativar modo compacto';
                compactBtn.setAttribute('aria-pressed', 'false');
            }
            console.log('✅ Disabled compact mode');
        }
        
        this.saveState();
        this.updateLayoutForCompactMode();
    }
    
    updateLayoutForCompactMode() {
        console.log(`🔧 Updating layout for compact mode: ${this.isCompactMode}`);
        
        const categories = document.querySelectorAll('.element-category');
        
        categories.forEach(category => {
            const grid = category.querySelector('.element-grid');
            if (!grid) {
                console.warn('⚠️ No element grid found in category');
                return;
            }
            
            const elements = grid.querySelectorAll('.element-item');
            
            if (this.isCompactMode) {
                // Compact mode: smaller elements, abbreviated text
                elements.forEach(element => {
                    element.classList.add('compact');
                    const text = element.textContent;
                    if (text.length > 10 && !element.dataset.fullText) {
                        element.dataset.fullText = text;
                        element.textContent = text.substring(0, 8) + '...';
                    }
                });
                console.log(`✅ Applied compact mode to ${elements.length} elements`);
            } else {
                // Normal mode: restore full text
                elements.forEach(element => {
                    element.classList.remove('compact');
                    if (element.dataset.fullText) {
                        element.textContent = element.dataset.fullText;
                        delete element.dataset.fullText;
                    }
                });
                console.log(`✅ Removed compact mode from ${elements.length} elements`);
            }
        });
    }
    
    expandAllCategories() {
        this.categories.forEach((category, categoryId) => {
            if (category.collapsible) {
                category.expanded = true;
                this.collapsedCategories.delete(categoryId);
            }
        });
        
        this.updateAllCategoryVisibility();
        this.saveState();
    }
    
    collapseNonEssentialCategories() {
        this.categories.forEach((category, categoryId) => {
            if (category.collapsible && !this.priorityCategories.includes(categoryId)) {
                category.expanded = false;
                this.collapsedCategories.add(categoryId);
            }
        });
        
        this.updateAllCategoryVisibility();
        this.saveState();
    }
    
    updateAllCategoryVisibility() {
        console.log('🔄 Updating visibility for all categories');
        
        this.categories.forEach((category, categoryId) => {
            const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
            if (!categoryElement) {
                console.warn(`⚠️ Category element not found for ${categoryId}`);
                return;
            }
            
            const contentElement = categoryElement.querySelector('.category-content');
            const toggleButton = categoryElement.querySelector('.category-toggle-btn');
            
            if (category.expanded) {
                if (contentElement) {
                    contentElement.style.display = 'block';
                    contentElement.setAttribute('aria-hidden', 'false');
                }
                if (toggleButton) {
                    toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
                    toggleButton.title = 'Colapsar categoria';
                    toggleButton.setAttribute('aria-label', 'Colapsar categoria');
                    toggleButton.setAttribute('aria-expanded', 'true');
                }
            } else {
                if (contentElement) {
                    contentElement.style.display = 'none';
                    contentElement.setAttribute('aria-hidden', 'true');
                }
                if (toggleButton) {
                    toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    toggleButton.title = 'Expandir categoria';
                    toggleButton.setAttribute('aria-label', 'Expandir categoria');
                    toggleButton.setAttribute('aria-expanded', 'false');
                }
            }
            
            console.log(`✅ Updated visibility for ${categoryId}: ${category.expanded ? 'expanded' : 'collapsed'}`);
        });
    }
    
    updateCategoryVisibility() {
        this.performanceMetrics.domUpdates++;
        
        // Batch DOM updates for better performance
        window.requestAnimationFrame(() => {
            // Trigger layout recalculation for floating panel
            const bottomPanel = document.getElementById('bottom-panel');
            if (bottomPanel) {
                bottomPanel.dispatchEvent(new CustomEvent('categoryToggle', {
                    detail: { 
                        collapsedCategories: Array.from(this.collapsedCategories),
                        compactMode: this.isCompactMode,
                        timestamp: performance.now()
                    }
                }));
            }
        });
    }
    
    applySmartLayout() {
        // Get usage statistics
        const usageStats = this.getElementUsageStats();
        
        // Reorganize categories based on usage
        const sortedCategories = Array.from(this.categories.entries())
            .sort(([,a], [,b]) => {
                const aUsage = this.getCategoryUsage(a.elements, usageStats);
                const bUsage = this.getCategoryUsage(b.elements, usageStats);
                return bUsage - aUsage; // Most used first
            });
        
        // Expand frequently used categories, collapse rarely used ones
        sortedCategories.forEach(([categoryId, category], index) => {
            if (category.collapsible) {
                const usage = this.getCategoryUsage(category.elements, usageStats);
                category.expanded = index < 3 || usage > 5; // Top 3 or frequently used
                
                if (category.expanded) {
                    this.collapsedCategories.delete(categoryId);
                } else {
                    this.collapsedCategories.add(categoryId);
                }
            }
        });
        
        this.updateAllCategoryVisibility();
        this.saveState();
        
        // Show feedback
        this.showSmartLayoutFeedback(sortedCategories, usageStats);
    }
    
    getCategoryUsage(elements, usageStats) {
        return elements.reduce((total, elementId) => {
            return total + (usageStats[elementId] || 0);
        }, 0);
    }
    
    trackElementUsage(elementId) {
        const usage = this.getElementUsageStats();
        usage[elementId] = (usage[elementId] || 0) + 1;
        window.localStorage.setItem('elementUsageStats', JSON.stringify(usage));
    }
    
    getElementUsageStats() {
        try {
            return JSON.parse(window.localStorage.getItem('elementUsageStats') || '{}');
        } catch {
            return {};
        }
    }
    
    showSmartLayoutFeedback(sortedCategories, usageStats) {
        const feedback = document.createElement('div');
        feedback.className = 'smart-layout-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <h4><i class="fas fa-magic"></i> Layout Inteligente Aplicado</h4>
                <p>Categorias reorganizadas baseadas no seu uso:</p>
                <ul>
                    ${sortedCategories.slice(0, 3).map(([id, cat]) => 
                        `<li>${cat.title} - ${this.getCategoryUsage(cat.elements, usageStats)} usos</li>`
                    ).join('')}
                </ul>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }
    
    enableCompactMode() {
        if (!this.isCompactMode) {
            this.toggleCompactMode();
        }
    }
    
    applyInitialLayout() {
        // Apply saved state or smart defaults
        if (window.innerWidth <= 768) {
            this.enableCompactMode();
            this.collapseNonEssentialCategories();
        }
    }
    
    saveState() {
        const state = {
            collapsedCategories: Array.from(this.collapsedCategories),
            isCompactMode: this.isCompactMode,
            categoryStates: Object.fromEntries(this.categories)
        };
        
        window.localStorage.setItem('elementControlsOrganizerState', JSON.stringify(state));
    }
    
    loadSavedState() {
        try {
            const savedState = window.localStorage.getItem('elementControlsOrganizerState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                this.collapsedCategories = new Set(state.collapsedCategories || []);
                this.isCompactMode = state.isCompactMode || false;
                
                // Restore category states
                if (state.categoryStates) {
                    Object.entries(state.categoryStates).forEach(([categoryId, categoryData]) => {
                        if (this.categories.has(categoryId)) {
                            this.categories.set(categoryId, {
                                ...this.categories.get(categoryId),
                                expanded: categoryData.expanded
                            });
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to load element controls organizer state:', error);
        }
    }
    
    // Public API methods
    getState() {
        return {
            collapsedCategories: Array.from(this.collapsedCategories),
            isCompactMode: this.isCompactMode,
            categories: Object.fromEntries(this.categories)
        };
    }
    
    // Force re-initialization (useful for testing)
    reinitialize() {
        console.log('🔄 Reinitializing Element Controls Organizer...');
        this.dispose();
        this.init();
    }
    
    setCategoryExpanded(categoryId, expanded) {
        if (this.categories.has(categoryId)) {
            const category = this.categories.get(categoryId);
            if (category.collapsible) {
                category.expanded = expanded;
                if (expanded) {
                    this.collapsedCategories.delete(categoryId);
                } else {
                    this.collapsedCategories.add(categoryId);
                }
                
                // Update the DOM immediately
                const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
                if (categoryElement) {
                    const contentElement = categoryElement.querySelector('.category-content');
                    const toggleButton = categoryElement.querySelector('.category-toggle-btn');
                    
                    if (contentElement) {
                        contentElement.style.display = expanded ? 'block' : 'none';
                    }
                    
                    if (toggleButton) {
                        toggleButton.innerHTML = expanded ? 
                            '<i class="fas fa-chevron-up"></i>' : 
                            '<i class="fas fa-chevron-down"></i>';
                        toggleButton.title = expanded ? 'Colapsar categoria' : 'Expandir categoria';
                    }
                }
                
                this.updateCategoryVisibility();
                this.saveState();
            }
        }
    }
    
    setCompactMode(enabled) {
        if (this.isCompactMode !== enabled) {
            this.toggleCompactMode();
        }
    }
    
    /**
     * Get performance metrics for debugging and optimization
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.visibilityCache.size,
            lazyLoadedCount: this.lazyLoadedCategories.size,
            collapsedCount: this.collapsedCategories.size,
            totalCategories: this.categories.size
        };
    }
    
    /**
     * Clear performance caches to free memory
     */
    clearPerformanceCaches() {
        this.visibilityCache.clear();
        console.log('🧹 Performance caches cleared');
    }
    
    /**
     * Optimize performance by cleaning up unused resources
     */
    optimizePerformance() {
        // Clear old cache entries
        if (this.visibilityCache.size > 5) {
            const entries = Array.from(this.visibilityCache.entries());
            const keepEntries = entries.slice(-3); // Keep last 3 entries
            this.visibilityCache.clear();
            keepEntries.forEach(([key, value]) => {
                this.visibilityCache.set(key, value);
            });
        }
        
        // Remove unused event listeners from lazy-loaded content
        const unusedElements = document.querySelectorAll('.element-item:not(.recently-used)');
        unusedElements.forEach(element => {
            // Remove non-essential event listeners to reduce memory usage
            element.removeEventListener('mouseenter', this.showEnhancedTooltip);
            element.removeEventListener('mouseleave', this.hideEnhancedTooltip);
        });
        
        console.log('⚡ Performance optimization completed');
    }
    
    /**
     * Dispose of resources and clean up
     */
    dispose() {
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Clear caches
        this.visibilityCache.clear();
        this.lazyLoadedCategories.clear();
        this.collapsedCategories.clear();
        this.categories.clear();
        
        // Hide any active tooltips
        this.hideEnhancedTooltip();
        
        console.log('🧹 ElementControlsOrganizer disposed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for floating controls panel to initialize first
    setTimeout(() => {
        try {
            window.elementControlsOrganizer = new ElementControlsOrganizer();
            console.log('✅ Element Controls Organizer initialized successfully');
            
            // Add to global scope for debugging
            if (window.DEBUG) {
                console.log('Element Controls Organizer initialized:', window.elementControlsOrganizer);
            }
        } catch (error) {
            console.error('❌ Failed to initialize Element Controls Organizer:', error);
        }
    }, 500); // Increased timeout to ensure DOM is fully ready
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementControlsOrganizer;
}