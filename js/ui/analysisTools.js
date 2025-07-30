// js/ui/analysisTools.js
import { getEcosystemElements, getSimulationConfig } from '../simulation.js';
import { domErrorHandler } from '../utils/domErrorHandler.js';

/**
 * Advanced Analysis Tools for Ecosystem Visualization
 * Implements population graphs, heat maps, and detailed statistics
 */
export class AnalysisTools {
    constructor() {
        this.isInitialized = false;
        this.charts = new Map();
        this.heatMaps = new Map();
        this.updateInterval = null;
        this.historicalData = {
            population: [],
            resources: [],
            stability: [],
            biodiversity: [],
            timestamps: []
        };
        this.maxHistoryLength = 100; // Keep last 100 data points
    }

    /**
     * Initialize the analysis tools
     */
    initialize() {
        if (this.isInitialized) return;

        this.createAnalysisPanel();
        this.setupEventListeners();
        this.startDataCollection();
        
        this.isInitialized = true;
        console.log('Analysis tools initialized');
    }

    /**
     * Create the analysis panel in the UI
     */
    createAnalysisPanel() {
        // Use DOM Error Handler to safely find or create the right panel
        const rightPanel = domErrorHandler.findOrCreatePanel('right-panel');
        if (!rightPanel) {
            console.error('Failed to find or create right panel for analysis tools');
            return;
        }

        // Ensure simulation info panel exists and is properly positioned
        const simInfoPanel = domErrorHandler.fixAnalysisToolsDOM(rightPanel);

        // Create analysis section
        const analysisSection = document.createElement('div');
        analysisSection.id = 'analysis-section';
        analysisSection.className = 'analysis-section';
        analysisSection.innerHTML = `
            <div class="analysis-header">
                <h3 class="text-lg font-semibold text-gray-200 mb-3">📊 Análise Avançada</h3>
                <div class="analysis-controls">
                    <button id="toggle-analysis" class="btn-small">Mostrar/Ocultar</button>
                    <button id="export-data" class="btn-small">Exportar Dados</button>
                </div>
            </div>
            
            <div id="analysis-content" class="analysis-content">
                <!-- Population Graph -->
                <div class="analysis-widget">
                    <h4 class="widget-title">População ao Longo do Tempo</h4>
                    <div class="chart-container">
                        <canvas id="population-chart" width="300" height="150"></canvas>
                    </div>
                    <div class="chart-legend" id="population-legend"></div>
                </div>

                <!-- Resource Graph -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Recursos do Ecossistema</h4>
                    <div class="chart-container">
                        <canvas id="resource-chart" width="300" height="150"></canvas>
                    </div>
                    <div class="chart-legend" id="resource-legend"></div>
                </div>

                <!-- Heat Map -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Mapa de Calor - Densidade</h4>
                    <div class="heatmap-controls">
                        <select id="heatmap-type" class="input-field-small">
                            <option value="population">Densidade Populacional</option>
                            <option value="health">Saúde Média</option>
                            <option value="energy">Energia Média</option>
                            <option value="biodiversity">Biodiversidade</option>
                        </select>
                    </div>
                    <div class="heatmap-container">
                        <canvas id="heatmap-canvas" width="280" height="160"></canvas>
                    </div>
                    <div class="heatmap-scale">
                        <span class="scale-label">Baixo</span>
                        <div class="scale-gradient"></div>
                        <span class="scale-label">Alto</span>
                    </div>
                </div>

                <!-- Detailed Statistics -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Estatísticas Detalhadas</h4>
                    <div id="detailed-stats" class="stats-grid">
                        <!-- Stats will be populated dynamically -->
                    </div>
                </div>

                <!-- Ecosystem Health Indicators -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Indicadores de Saúde</h4>
                    <div id="health-indicators" class="health-indicators">
                        <!-- Health indicators will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        // Use safe insertion method from DOM Error Handler
        try {
            const panelContent = rightPanel.querySelector('.panel-content');
            if (panelContent && simInfoPanel && panelContent.contains(simInfoPanel)) {
                // Use the safe insertBefore method
                domErrorHandler.safeInsertBefore(analysisSection, simInfoPanel, panelContent);
                console.log('✅ Analysis section inserted safely before simulation info panel');
            } else {
                // Fallback: append to panel content or right panel
                const targetParent = panelContent || rightPanel;
                targetParent.appendChild(analysisSection);
                console.log('✅ Analysis section appended to panel (fallback method)');
            }
        } catch (error) {
            console.error('Error inserting analysis section:', error);
            // Final fallback: append to right panel
            rightPanel.appendChild(analysisSection);
            console.log('✅ Analysis section appended to right panel (final fallback)');
        }
    }

    /**
     * Setup event listeners for analysis tools
     */
    setupEventListeners() {
        // Toggle analysis panel
        const toggleBtn = document.getElementById('toggle-analysis');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleAnalysisPanel();
            });
        }

        // Export data
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Heat map type change
        const heatmapSelect = document.getElementById('heatmap-type');
        if (heatmapSelect) {
            heatmapSelect.addEventListener('change', (e) => {
                this.updateHeatMap(e.target.value);
            });
        }
    }

    /**
     * Start collecting data for analysis
     */
    startDataCollection() {
        // Collect data every 2 seconds
        this.updateInterval = setInterval(() => {
            this.collectData();
            this.updateCharts();
            this.updateStatistics();
            this.updateHeatMap();
            
            // Update modal if it's visible
            const modal = document.getElementById('analysis-modal');
            if (modal && modal.style.display === 'flex') {
                this.updateModalCharts();
                this.updateModalStatistics();
                this.updateModalHeatMap();
            }
        }, 2000);
    }

    /**
     * Collect current ecosystem data
     */
    collectData() {
        const elements = getEcosystemElements();
        const config = getSimulationConfig();
        const timestamp = Date.now();

        // Count populations by type
        const populationCounts = {};
        let totalHealth = 0;
        let totalEnergy = 0;
        let elementCount = 0;

        elements.forEach(element => {
            const type = element.type;
            populationCounts[type] = (populationCounts[type] || 0) + 1;
            
            totalHealth += element.health || 0;
            totalEnergy += element.energy || 0;
            elementCount++;
        });

        // Calculate averages
        const avgHealth = elementCount > 0 ? totalHealth / elementCount : 0;
        const avgEnergy = elementCount > 0 ? totalEnergy / elementCount : 0;
        const biodiversity = Object.keys(populationCounts).length;

        // Add to historical data
        this.historicalData.population.push(populationCounts);
        this.historicalData.resources.push({
            water: config.waterPresence || 0,
            temperature: config.temperature || 20,
            avgHealth: avgHealth,
            avgEnergy: avgEnergy
        });
        this.historicalData.stability.push(avgHealth);
        this.historicalData.biodiversity.push(biodiversity);
        this.historicalData.timestamps.push(timestamp);

        // Limit history length
        if (this.historicalData.timestamps.length > this.maxHistoryLength) {
            Object.keys(this.historicalData).forEach(key => {
                this.historicalData[key].shift();
            });
        }
    }

    /**
     * Update population and resource charts
     */
    updateCharts() {
        this.updatePopulationChart();
        this.updateResourceChart();
    }

    /**
     * Update population chart
     */
    updatePopulationChart() {
        const canvas = document.getElementById('population-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.historicalData.population.length === 0) return;

        // Get all unique element types
        const allTypes = new Set();
        this.historicalData.population.forEach(data => {
            Object.keys(data).forEach(type => allTypes.add(type));
        });

        const types = Array.from(allTypes);
        const colors = this.generateColors(types.length);

        // Draw background grid
        this.drawGrid(ctx, width, height);

        // Calculate scales
        const maxPopulation = Math.max(...this.historicalData.population.map(data => 
            Math.max(...Object.values(data))
        ));
        const scaleY = (height - 40) / (maxPopulation || 1);
        const scaleX = (width - 40) / Math.max(this.historicalData.population.length - 1, 1);

        // Draw lines for each element type
        types.forEach((type, typeIndex) => {
            ctx.strokeStyle = colors[typeIndex];
            ctx.lineWidth = 2;
            ctx.beginPath();

            let hasStarted = false;
            this.historicalData.population.forEach((data, index) => {
                const count = data[type] || 0;
                const x = 20 + index * scaleX;
                const y = height - 20 - count * scaleY;

                if (!hasStarted) {
                    ctx.moveTo(x, y);
                    hasStarted = true;
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        // Update legend
        this.updateChartLegend('population-legend', types, colors);
    }

    /**
     * Update resource chart
     */
    updateResourceChart() {
        const canvas = document.getElementById('resource-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.historicalData.resources.length === 0) return;

        // Draw background grid
        this.drawGrid(ctx, width, height);

        const resources = ['water', 'avgHealth', 'avgEnergy'];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        const labels = ['Água (%)', 'Saúde Média', 'Energia Média'];

        // Calculate scales
        const scaleX = (width - 40) / Math.max(this.historicalData.resources.length - 1, 1);

        resources.forEach((resource, resourceIndex) => {
            const values = this.historicalData.resources.map(data => data[resource] || 0);
            const maxValue = Math.max(...values);
            const scaleY = (height - 40) / (maxValue || 1);

            ctx.strokeStyle = colors[resourceIndex];
            ctx.lineWidth = 2;
            ctx.beginPath();

            values.forEach((value, index) => {
                const x = 20 + index * scaleX;
                const y = height - 20 - value * scaleY;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        // Update legend
        this.updateChartLegend('resource-legend', labels, colors);
    }

    /**
     * Draw grid background for charts
     */
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 20; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, height - 20);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 20; y < height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
        }
    }

    /**
     * Update chart legend
     */
    updateChartLegend(legendId, labels, colors) {
        const legend = document.getElementById(legendId);
        if (!legend) return;

        legend.innerHTML = '';
        labels.forEach((label, index) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[index]}"></span>
                <span class="legend-label">${label}</span>
            `;
            legend.appendChild(item);
        });
    }

    /**
     * Update heat map
     */
    updateHeatMap(type = 'population') {
        const canvas = document.getElementById('heatmap-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const elements = getEcosystemElements();
        const config = getSimulationConfig();

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (elements.length === 0) return;

        // Create grid for heat map
        const gridSize = 20;
        const gridWidth = Math.ceil(width / gridSize);
        const gridHeight = Math.ceil(height / gridSize);
        const heatGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));

        // Map ecosystem coordinates to canvas coordinates
        const ecosystemSize = this.getEcosystemSize(config);
        const scaleX = width / ecosystemSize.width;
        const scaleY = height / ecosystemSize.height;

        // Populate heat grid based on type
        elements.forEach(element => {
            const canvasX = Math.floor(element.x * scaleX);
            const canvasY = Math.floor(element.y * scaleY);
            const gridX = Math.floor(canvasX / gridSize);
            const gridY = Math.floor(canvasY / gridSize);

            if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                let value = 1;
                
                switch (type) {
                    case 'population':
                        value = 1;
                        break;
                    case 'health':
                        value = (element.health || 0) / 100;
                        break;
                    case 'energy':
                        value = (element.energy || 0) / 100;
                        break;
                    case 'biodiversity':
                        // Count unique types in this grid cell
                        value = 0.2; // Base value for any element
                        break;
                }
                
                heatGrid[gridY][gridX] += value;
            }
        });

        // Find max value for normalization
        const maxValue = Math.max(...heatGrid.flat());

        // Draw heat map
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const value = heatGrid[y][x];
                if (value > 0) {
                    const intensity = Math.min(value / (maxValue || 1), 1);
                    const color = this.getHeatMapColor(intensity);
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                }
            }
        }
    }

    /**
     * Get heat map color based on intensity
     */
    getHeatMapColor(intensity) {
        // Create a color gradient from blue (low) to red (high)
        const r = Math.floor(intensity * 255);
        const g = Math.floor((1 - intensity) * 100);
        const b = Math.floor((1 - intensity) * 255);
        
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    }

    /**
     * Update detailed statistics
     */
    updateStatistics() {
        const statsContainer = document.getElementById('detailed-stats');
        if (!statsContainer) return;

        const elements = getEcosystemElements();
        const config = getSimulationConfig();

        // Calculate statistics
        const stats = this.calculateDetailedStats(elements, config);

        // Update display
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total de Elementos:</span>
                <span class="stat-value">${stats.totalElements}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tipos Únicos:</span>
                <span class="stat-value">${stats.uniqueTypes}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Saúde Média:</span>
                <span class="stat-value">${stats.avgHealth.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Energia Média:</span>
                <span class="stat-value">${stats.avgEnergy.toFixed(1)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Densidade:</span>
                <span class="stat-value">${stats.density.toFixed(3)}/km²</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Taxa de Crescimento:</span>
                <span class="stat-value">${stats.growthRate.toFixed(2)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Estabilidade:</span>
                <span class="stat-value">${stats.stability.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Índice de Diversidade:</span>
                <span class="stat-value">${stats.diversityIndex.toFixed(2)}</span>
            </div>
        `;

        // Update health indicators
        this.updateHealthIndicators(stats);
    }

    /**
     * Calculate detailed statistics
     */
    calculateDetailedStats(elements, config) {
        const totalElements = elements.length;
        const uniqueTypes = new Set(elements.map(e => e.type)).size;
        
        let totalHealth = 0;
        let totalEnergy = 0;
        const typeCounts = {};

        elements.forEach(element => {
            totalHealth += element.health || 0;
            totalEnergy += element.energy || 0;
            typeCounts[element.type] = (typeCounts[element.type] || 0) + 1;
        });

        const avgHealth = totalElements > 0 ? totalHealth / totalElements : 0;
        const avgEnergy = totalElements > 0 ? totalEnergy / totalElements : 0;

        // Calculate ecosystem area
        const ecosystemSize = this.getEcosystemSize(config);
        const area = (ecosystemSize.width * ecosystemSize.height) / 1000000; // Convert to km²
        const density = totalElements / area;

        // Calculate growth rate (based on recent history)
        let growthRate = 0;
        if (this.historicalData.population.length >= 2) {
            const recent = this.historicalData.population.slice(-2);
            const oldTotal = Object.values(recent[0]).reduce((sum, count) => sum + count, 0);
            const newTotal = Object.values(recent[1]).reduce((sum, count) => sum + count, 0);
            growthRate = oldTotal > 0 ? ((newTotal - oldTotal) / oldTotal) * 100 : 0;
        }

        // Calculate stability (based on health variance)
        const stability = Math.min(avgHealth, 100);

        // Calculate Shannon diversity index
        let diversityIndex = 0;
        if (totalElements > 0) {
            Object.values(typeCounts).forEach(count => {
                const proportion = count / totalElements;
                if (proportion > 0) {
                    diversityIndex -= proportion * Math.log2(proportion);
                }
            });
        }

        return {
            totalElements,
            uniqueTypes,
            avgHealth,
            avgEnergy,
            density,
            growthRate,
            stability,
            diversityIndex,
            typeCounts
        };
    }

    /**
     * Update health indicators
     */
    updateHealthIndicators(stats) {
        const container = document.getElementById('health-indicators');
        if (!container) return;

        const indicators = [
            {
                name: 'Estabilidade do Ecossistema',
                value: stats.stability,
                threshold: { good: 80, warning: 50 },
                unit: '%'
            },
            {
                name: 'Diversidade Biológica',
                value: stats.diversityIndex * 20, // Scale to 0-100
                threshold: { good: 60, warning: 30 },
                unit: '%'
            },
            {
                name: 'Saúde Geral',
                value: stats.avgHealth,
                threshold: { good: 70, warning: 40 },
                unit: '%'
            },
            {
                name: 'Densidade Populacional',
                value: Math.min(stats.density * 10, 100), // Scale and cap at 100
                threshold: { good: 30, warning: 70 },
                unit: '%'
            }
        ];

        container.innerHTML = indicators.map(indicator => {
            const status = this.getIndicatorStatus(indicator.value, indicator.threshold);
            return `
                <div class="health-indicator ${status}">
                    <div class="indicator-header">
                        <span class="indicator-name">${indicator.name}</span>
                        <span class="indicator-value">${indicator.value.toFixed(1)}${indicator.unit}</span>
                    </div>
                    <div class="indicator-bar">
                        <div class="indicator-fill" style="width: ${Math.min(indicator.value, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get indicator status based on thresholds
     */
    getIndicatorStatus(value, threshold) {
        if (value >= threshold.good) return 'good';
        if (value >= threshold.warning) return 'warning';
        return 'critical';
    }

    /**
     * Get ecosystem size from config
     */
    getEcosystemSize(config) {
        const sizes = {
            small: { width: 500, height: 300 },
            medium: { width: 800, height: 450 },
            large: { width: 1200, height: 675 }
        };
        return sizes[config.ecosystemSize] || sizes.medium;
    }

    /**
     * Generate colors for chart lines
     */
    generateColors(count) {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
        
        // If we need more colors, generate them
        while (colors.length < count) {
            const hue = (colors.length * 137.508) % 360; // Golden angle
            colors.push(`hsl(${hue}, 70%, 50%)`);
        }
        
        return colors.slice(0, count);
    }

    /**
     * Toggle analysis panel visibility
     */
    toggleAnalysisPanel() {
        const content = document.getElementById('analysis-content');
        if (content) {
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            
            const toggleBtn = document.getElementById('toggle-analysis');
            if (toggleBtn) {
                toggleBtn.textContent = isVisible ? 'Mostrar' : 'Ocultar';
            }
        } else {
            // If panel doesn't exist, show modal instead
            this.showAnalysisModal();
        }
    }

    /**
     * Show analysis modal
     */
    showAnalysisModal() {
        const modal = document.getElementById('analysis-modal');
        const modalContent = document.getElementById('analysis-modal-content');
        
        if (!modal || !modalContent) return;

        // Create analysis content for modal
        modalContent.innerHTML = `
            <div class="analysis-content">
                <!-- Population Graph -->
                <div class="analysis-widget">
                    <h4 class="widget-title">População ao Longo do Tempo</h4>
                    <div class="chart-container">
                        <canvas id="modal-population-chart" width="600" height="200"></canvas>
                    </div>
                    <div class="chart-legend" id="modal-population-legend"></div>
                </div>

                <!-- Resource Graph -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Recursos do Ecossistema</h4>
                    <div class="chart-container">
                        <canvas id="modal-resource-chart" width="600" height="200"></canvas>
                    </div>
                    <div class="chart-legend" id="modal-resource-legend"></div>
                </div>

                <!-- Heat Map -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Mapa de Calor - Densidade</h4>
                    <div class="heatmap-controls">
                        <select id="modal-heatmap-type" class="input-field-small">
                            <option value="population">Densidade Populacional</option>
                            <option value="health">Saúde Média</option>
                            <option value="energy">Energia Média</option>
                            <option value="biodiversity">Biodiversidade</option>
                        </select>
                    </div>
                    <div class="heatmap-container">
                        <canvas id="modal-heatmap-canvas" width="600" height="200"></canvas>
                    </div>
                    <div class="heatmap-scale">
                        <span class="scale-label">Baixo</span>
                        <div class="scale-gradient"></div>
                        <span class="scale-label">Alto</span>
                    </div>
                </div>

                <!-- Detailed Statistics -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Estatísticas Detalhadas</h4>
                    <div id="modal-detailed-stats" class="stats-grid">
                        <!-- Stats will be populated dynamically -->
                    </div>
                </div>

                <!-- Ecosystem Health Indicators -->
                <div class="analysis-widget">
                    <h4 class="widget-title">Indicadores de Saúde</h4>
                    <div id="modal-health-indicators" class="health-indicators">
                        <!-- Health indicators will be populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        // Setup modal event listeners
        this.setupModalEventListeners();

        // Update modal content
        this.updateModalCharts();
        this.updateModalStatistics();
        this.updateModalHeatMap();

        // Show modal
        modal.style.display = 'flex';
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners() {
        // Close modal
        const closeBtn = document.getElementById('analysis-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideAnalysisModal();
            });
        }

        // Heat map type change
        const heatmapSelect = document.getElementById('modal-heatmap-type');
        if (heatmapSelect) {
            heatmapSelect.addEventListener('change', (e) => {
                this.updateModalHeatMap(e.target.value);
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('analysis-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAnalysisModal();
                }
            });
        }
    }

    /**
     * Hide analysis modal
     */
    hideAnalysisModal() {
        const modal = document.getElementById('analysis-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Update modal charts
     */
    updateModalCharts() {
        this.updateModalPopulationChart();
        this.updateModalResourceChart();
    }

    /**
     * Update modal population chart
     */
    updateModalPopulationChart() {
        const canvas = document.getElementById('modal-population-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.historicalData.population.length === 0) return;

        // Get all unique element types
        const allTypes = new Set();
        this.historicalData.population.forEach(data => {
            Object.keys(data).forEach(type => allTypes.add(type));
        });

        const types = Array.from(allTypes);
        const colors = this.generateColors(types.length);

        // Draw background grid
        this.drawGrid(ctx, width, height);

        // Calculate scales
        const maxPopulation = Math.max(...this.historicalData.population.map(data => 
            Math.max(...Object.values(data))
        ));
        const scaleY = (height - 40) / (maxPopulation || 1);
        const scaleX = (width - 40) / Math.max(this.historicalData.population.length - 1, 1);

        // Draw lines for each element type
        types.forEach((type, typeIndex) => {
            ctx.strokeStyle = colors[typeIndex];
            ctx.lineWidth = 2;
            ctx.beginPath();

            let hasStarted = false;
            this.historicalData.population.forEach((data, index) => {
                const count = data[type] || 0;
                const x = 20 + index * scaleX;
                const y = height - 20 - count * scaleY;

                if (!hasStarted) {
                    ctx.moveTo(x, y);
                    hasStarted = true;
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        // Update legend
        this.updateChartLegend('modal-population-legend', types, colors);
    }

    /**
     * Update modal resource chart
     */
    updateModalResourceChart() {
        const canvas = document.getElementById('modal-resource-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.historicalData.resources.length === 0) return;

        // Draw background grid
        this.drawGrid(ctx, width, height);

        const resources = ['water', 'avgHealth', 'avgEnergy'];
        const colors = ['#3b82f6', '#10b981', '#f59e0b'];
        const labels = ['Água (%)', 'Saúde Média', 'Energia Média'];

        // Calculate scales
        const scaleX = (width - 40) / Math.max(this.historicalData.resources.length - 1, 1);

        resources.forEach((resource, resourceIndex) => {
            const values = this.historicalData.resources.map(data => data[resource] || 0);
            const maxValue = Math.max(...values);
            const scaleY = (height - 40) / (maxValue || 1);

            ctx.strokeStyle = colors[resourceIndex];
            ctx.lineWidth = 2;
            ctx.beginPath();

            values.forEach((value, index) => {
                const x = 20 + index * scaleX;
                const y = height - 20 - value * scaleY;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        // Update legend
        this.updateChartLegend('modal-resource-legend', labels, colors);
    }

    /**
     * Update modal heat map
     */
    updateModalHeatMap(type = 'population') {
        const canvas = document.getElementById('modal-heatmap-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const elements = getEcosystemElements();
        const config = getSimulationConfig();

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (elements.length === 0) return;

        // Create grid for heat map
        const gridSize = 30;
        const gridWidth = Math.ceil(width / gridSize);
        const gridHeight = Math.ceil(height / gridSize);
        const heatGrid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(0));

        // Map ecosystem coordinates to canvas coordinates
        const ecosystemSize = this.getEcosystemSize(config);
        const scaleX = width / ecosystemSize.width;
        const scaleY = height / ecosystemSize.height;

        // Populate heat grid based on type
        elements.forEach(element => {
            const canvasX = Math.floor(element.x * scaleX);
            const canvasY = Math.floor(element.y * scaleY);
            const gridX = Math.floor(canvasX / gridSize);
            const gridY = Math.floor(canvasY / gridSize);

            if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
                let value = 1;
                
                switch (type) {
                    case 'population':
                        value = 1;
                        break;
                    case 'health':
                        value = (element.health || 0) / 100;
                        break;
                    case 'energy':
                        value = (element.energy || 0) / 100;
                        break;
                    case 'biodiversity':
                        value = 0.2;
                        break;
                }
                
                heatGrid[gridY][gridX] += value;
            }
        });

        // Find max value for normalization
        const maxValue = Math.max(...heatGrid.flat());

        // Draw heat map
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const value = heatGrid[y][x];
                if (value > 0) {
                    const intensity = Math.min(value / (maxValue || 1), 1);
                    const color = this.getHeatMapColor(intensity);
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
                }
            }
        }
    }

    /**
     * Update modal statistics
     */
    updateModalStatistics() {
        const statsContainer = document.getElementById('modal-detailed-stats');
        const healthContainer = document.getElementById('modal-health-indicators');
        
        if (!statsContainer || !healthContainer) return;

        const elements = getEcosystemElements();
        const config = getSimulationConfig();
        const stats = this.calculateDetailedStats(elements, config);

        // Update detailed stats
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total de Elementos:</span>
                <span class="stat-value">${stats.totalElements}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Tipos Únicos:</span>
                <span class="stat-value">${stats.uniqueTypes}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Saúde Média:</span>
                <span class="stat-value">${stats.avgHealth.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Energia Média:</span>
                <span class="stat-value">${stats.avgEnergy.toFixed(1)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Densidade:</span>
                <span class="stat-value">${stats.density.toFixed(3)}/km²</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Taxa de Crescimento:</span>
                <span class="stat-value">${stats.growthRate.toFixed(2)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Estabilidade:</span>
                <span class="stat-value">${stats.stability.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Índice de Diversidade:</span>
                <span class="stat-value">${stats.diversityIndex.toFixed(2)}</span>
            </div>
        `;

        // Update health indicators
        const indicators = [
            {
                name: 'Estabilidade do Ecossistema',
                value: stats.stability,
                threshold: { good: 80, warning: 50 },
                unit: '%'
            },
            {
                name: 'Diversidade Biológica',
                value: stats.diversityIndex * 20,
                threshold: { good: 60, warning: 30 },
                unit: '%'
            },
            {
                name: 'Saúde Geral',
                value: stats.avgHealth,
                threshold: { good: 70, warning: 40 },
                unit: '%'
            },
            {
                name: 'Densidade Populacional',
                value: Math.min(stats.density * 10, 100),
                threshold: { good: 30, warning: 70 },
                unit: '%'
            }
        ];

        healthContainer.innerHTML = indicators.map(indicator => {
            const status = this.getIndicatorStatus(indicator.value, indicator.threshold);
            return `
                <div class="health-indicator ${status}">
                    <div class="indicator-header">
                        <span class="indicator-name">${indicator.name}</span>
                        <span class="indicator-value">${indicator.value.toFixed(1)}${indicator.unit}</span>
                    </div>
                    <div class="indicator-bar">
                        <div class="indicator-fill" style="width: ${Math.min(indicator.value, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Export analysis data
     */
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            historicalData: this.historicalData,
            currentStats: this.calculateDetailedStats(getEcosystemElements(), getSimulationConfig())
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecosse-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('Analysis data exported');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.charts.clear();
        this.heatMaps.clear();
        this.historicalData = {
            population: [],
            resources: [],
            stability: [],
            biodiversity: [],
            timestamps: []
        };
        
        this.isInitialized = false;
    }
}

// Create and export singleton instance
export const analysisTools = new AnalysisTools();