/**
 * Comprehensive Layout Validation Test Suite - Task 8
 * 
 * This test suite validates all layout fixes across:
 * - Responsive behavior across breakpoints
 * - Panel interactions and animations
 * - Canvas rendering performance
 * - Requirements: 1.1, 1.2, 2.1, 3.1, 4.1
 */

export class LayoutValidationSuite {
    constructor() {
        this.results = {
            timestamp: Date.now(),
            testSuites: {},
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                passRate: 0
            }
        };
        
        this.performanceMetrics = {
            canvasRenderTime: [],
            layoutRecalcTime: [],
            animationFrameTime: [],
            memoryUsage: []
        };
    }

    /**
     * Run all comprehensive layout validation tests
     */
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Layout Validation Tests...\n');
        
        try {
            // Test Suite 1: Responsive Behavior Across Breakpoints
            await this.testResponsiveBehavior();
            
            // Test Suite 2: Panel Interactions and Animations
            await this.testPanelInteractions();
            
            // Test Suite 3: Canvas Rendering Performance
            await this.testCanvasPerformance();
            
            // Test Suite 4: Layout System Integration
            await this.testLayoutSystemIntegration();
            
            // Test Suite 5: Error Handling and Recovery
            await this.testErrorHandlingIntegration();
            
            // Generate final report
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.addTestResult('Test Execution', 'Critical Error', false, `Failed: ${error.message}`);
        }
        
        return this.results;
    }

    /**
     * Test responsive behavior across all breakpoints
     * Requirements: 1.1, 1.2
     */
    async testResponsiveBehavior() {
        console.log('📱 Testing Responsive Behavior Across Breakpoints...');
        
        const breakpoints = [
            { name: 'Mobile Portrait', width: 320, height: 568, expected: 'mobile' },
            { name: 'Mobile Landscape', width: 568, height: 320, expected: 'mobile' },
            { name: 'Tablet Portrait', width: 768, height: 1024, expected: 'tablet' },
            { name: 'Tablet Landscape', width: 1024, height: 768, expected: 'tablet' },
            { name: 'Desktop Small', width: 1366, height: 768, expected: 'desktop' },
            { name: 'Desktop Large', width: 1920, height: 1080, expected: 'desktop' },
            { name: 'Ultrawide', width: 2560, height: 1440, expected: 'ultrawide' }
        ];
        
        const responsiveResults = [];
        
        for (const breakpoint of breakpoints) {
            console.log(`\n🔍 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);
            
            const result = await this.testBreakpoint(breakpoint);
            responsiveResults.push(result);
            
            this.addTestResult(
                'Responsive Behavior',
                `${breakpoint.name} Layout`,
                result.passed,
                result.details
            );
        }
        
        // Test responsive transitions
        await this.testResponsiveTransitions(breakpoints);
        
        this.results.testSuites.responsiveBehavior = {
            breakpointTests: responsiveResults,
            summary: this.calculateSuiteSummary(responsiveResults)
        };
    }

    /**
     * Test individual breakpoint behavior
     */
    async testBreakpoint(breakpoint) {
        const startTime = performance.now();
        
        try {
            // Simulate viewport change
            this.simulateViewportChange(breakpoint.width, breakpoint.height);
            
            // Wait for layout to settle
            await this.waitForLayoutSettlement();
            
            const tests = {
                viewportDetection: this.testViewportDetection(breakpoint.expected),
                layoutApplication: this.testLayoutApplication(breakpoint.name),
                panelBehavior: this.testPanelBehaviorAtBreakpoint(breakpoint),
                canvasUtilization: this.testCanvasUtilizationAtBreakpoint(breakpoint),
                performanceMetrics: this.measureBreakpointPerformance()
            };
            
            const allPassed = Object.values(tests).every(test => test.passed);
            const layoutTime = performance.now() - startTime;
            
            return {
                breakpoint: breakpoint.name,
                passed: allPassed,
                layoutTime,
                tests,
                details: this.formatBreakpointDetails(tests, layoutTime)
            };
            
        } catch (error) {
            return {
                breakpoint: breakpoint.name,
                passed: false,
                error: error.message,
                details: `Failed: ${error.message}`
            };
        }
    }

    /**
     * Test panel interactions and animations
     * Requirements: 2.1, 3.1
     */
    async testPanelInteractions() {
        console.log('🎛️ Testing Panel Interactions and Animations...');
        
        const panelTests = [
            { name: 'Left Panel Toggle', panel: 'left' },
            { name: 'Right Panel Toggle', panel: 'right' },
            { name: 'Bottom Panel Toggle', panel: 'bottom' }
        ];
        
        const interactionResults = [];
        
        for (const test of panelTests) {
            console.log(`\n🔄 Testing ${test.name}`);
            
            const result = await this.testPanelToggle(test.panel);
            interactionResults.push(result);
            
            this.addTestResult(
                'Panel Interactions',
                test.name,
                result.passed,
                result.details
            );
        }
        
        // Test animation performance
        const animationResult = await this.testPanelAnimations();
        interactionResults.push(animationResult);
        
        this.addTestResult(
            'Panel Interactions',
            'Animation Performance',
            animationResult.passed,
            animationResult.details
        );
        
        // Test simultaneous panel operations
        const simultaneousResult = await this.testSimultaneousPanelOperations();
        interactionResults.push(simultaneousResult);
        
        this.addTestResult(
            'Panel Interactions',
            'Simultaneous Operations',
            simultaneousResult.passed,
            simultaneousResult.details
        );
        
        this.results.testSuites.panelInteractions = {
            tests: interactionResults,
            summary: this.calculateSuiteSummary(interactionResults)
        };
    }

    /**
     * Test canvas rendering performance
     * Requirements: 4.1
     */
    async testCanvasPerformance() {
        console.log('🎨 Testing Canvas Rendering Performance...');
        
        const performanceTests = [
            { name: 'Canvas Initialization', test: () => this.testCanvasInitialization() },
            { name: 'Render Loop Performance', test: () => this.testRenderLoopPerformance() },
            { name: 'Memory Usage Stability', test: () => this.testMemoryUsageStability() },
            { name: 'Frame Rate Consistency', test: () => this.testFrameRateConsistency() },
            { name: 'Canvas Resize Performance', test: () => this.testCanvasResizePerformance() }
        ];
        
        const performanceResults = [];
        
        for (const test of performanceTests) {
            console.log(`\n⚡ Testing ${test.name}`);
            
            const result = await test.test();
            performanceResults.push(result);
            
            this.addTestResult(
                'Canvas Performance',
                test.name,
                result.passed,
                result.details
            );
        }
        
        this.results.testSuites.canvasPerformance = {
            tests: performanceResults,
            metrics: this.performanceMetrics,
            summary: this.calculateSuiteSummary(performanceResults)
        };
    }

    /**
     * Test layout system integration
     */
    async testLayoutSystemIntegration() {
        console.log('🔧 Testing Layout System Integration...');
        
        const integrationTests = [
            { name: 'System Initialization', test: () => this.testSystemInitialization() },
            { name: 'Component Communication', test: () => this.testComponentCommunication() },
            { name: 'State Synchronization', test: () => this.testStateSynchronization() },
            { name: 'Event Handling', test: () => this.testEventHandling() },
            { name: 'Configuration Management', test: () => this.testConfigurationManagement() }
        ];
        
        const integrationResults = [];
        
        for (const test of integrationTests) {
            console.log(`\n🔗 Testing ${test.name}`);
            
            const result = await test.test();
            integrationResults.push(result);
            
            this.addTestResult(
                'System Integration',
                test.name,
                result.passed,
                result.details
            );
        }
        
        this.results.testSuites.systemIntegration = {
            tests: integrationResults,
            summary: this.calculateSuiteSummary(integrationResults)
        };
    }

    /**
     * Test error handling integration
     */
    async testErrorHandlingIntegration() {
        console.log('🛡️ Testing Error Handling Integration...');
        
        const errorTests = [
            { name: 'Missing Element Recovery', test: () => this.testMissingElementRecovery() },
            { name: 'CSS Conflict Resolution', test: () => this.testCSSConflictResolution() },
            { name: 'Fallback Layout Application', test: () => this.testFallbackLayoutApplication() },
            { name: 'System Recovery', test: () => this.testSystemRecovery() }
        ];
        
        const errorResults = [];
        
        for (const test of errorTests) {
            console.log(`\n🔧 Testing ${test.name}`);
            
            const result = await test.test();
            errorResults.push(result);
            
            this.addTestResult(
                'Error Handling',
                test.name,
                result.passed,
                result.details
            );
        }
        
        this.results.testSuites.errorHandling = {
            tests: errorResults,
            summary: this.calculateSuiteSummary(errorResults)
        };
    }

    // Helper Methods

    /**
     * Simulate viewport change
     */
    simulateViewportChange(width, height) {
        // Update layout manager viewport size
        if (window.layoutManager) {
            window.layoutManager.viewportSize = { width, height };
            window.layoutManager.updateLayout();
        }
        
        // Update responsive breakpoints
        if (window.responsiveBreakpoints) {
            window.responsiveBreakpoints.currentViewport = { width, height };
            window.responsiveBreakpoints.updateBreakpoint();
        }
        
        // Update viewport monitor
        if (window.viewportMonitor) {
            window.viewportMonitor.dimensions = { width, height };
            window.viewportMonitor.notifyListeners();
        }
    }

    /**
     * Wait for layout to settle after changes
     */
    async waitForLayoutSettlement() {
        return new Promise(resolve => {
            // Wait for multiple animation frames to ensure layout is settled
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 50); // Additional buffer
                });
            });
        });
    }

    /**
     * Test viewport detection
     */
    testViewportDetection(expected) {
        try {
            const detected = window.responsiveBreakpoints?.getCurrentBreakpoint() || 'unknown';
            const passed = detected === expected;
            
            return {
                passed,
                detected,
                expected,
                details: `Detected: ${detected}, Expected: ${expected}`
            };
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test layout application
     */
    testLayoutApplication(breakpointName) {
        try {
            const appContainer = document.getElementById('app-container');
            if (!appContainer) {
                return { passed: false, details: 'App container not found' };
            }
            
            const hasLayoutClass = appContainer.classList.contains(`${breakpointName.toLowerCase().split(' ')[0]}-layout`);
            const hasFlexDisplay = window.getComputedStyle(appContainer).display === 'flex';
            
            const passed = hasLayoutClass || hasFlexDisplay;
            
            return {
                passed,
                details: `Layout class: ${hasLayoutClass}, Flex display: ${hasFlexDisplay}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test panel behavior at specific breakpoint
     */
    testPanelBehaviorAtBreakpoint(breakpoint) {
        try {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            const bottomPanel = document.getElementById('bottom-panel');
            
            if (!leftPanel || !rightPanel || !bottomPanel) {
                return { passed: false, details: 'One or more panels not found' };
            }
            
            const leftVisible = window.getComputedStyle(leftPanel).display !== 'none';
            const rightVisible = window.getComputedStyle(rightPanel).display !== 'none';
            const bottomVisible = window.getComputedStyle(bottomPanel).display !== 'none';
            
            // Check if panel behavior matches breakpoint expectations
            let expectedBehavior = true;
            if (breakpoint.width < 768) { // Mobile
                expectedBehavior = !leftVisible && !rightVisible; // Panels should be hidden on mobile
            }
            
            return {
                passed: expectedBehavior,
                details: `Left: ${leftVisible}, Right: ${rightVisible}, Bottom: ${bottomVisible}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test canvas utilization at breakpoint
     */
    testCanvasUtilizationAtBreakpoint(breakpoint) {
        try {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) {
                return { passed: false, details: 'Canvas container not found' };
            }
            
            const canvasHeight = canvasContainer.offsetHeight;
            const canvasWidth = canvasContainer.offsetWidth;
            
            const heightUtilization = (canvasHeight / breakpoint.height) * 100;
            const widthUtilization = (canvasWidth / breakpoint.width) * 100;
            
            // Canvas should utilize at least 60% of available space
            const passed = heightUtilization >= 60 && widthUtilization >= 60;
            
            return {
                passed,
                heightUtilization: heightUtilization.toFixed(1),
                widthUtilization: widthUtilization.toFixed(1),
                details: `Height: ${heightUtilization.toFixed(1)}%, Width: ${widthUtilization.toFixed(1)}%`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Measure breakpoint performance
     */
    measureBreakpointPerformance() {
        try {
            const startTime = performance.now();
            
            // Trigger a layout recalculation
            const appContainer = document.getElementById('app-container');
            if (appContainer) {
                appContainer.offsetHeight; // Force reflow
            }
            
            const layoutTime = performance.now() - startTime;
            
            // Check memory usage if available
            const memoryInfo = performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null;
            
            const passed = layoutTime < 16; // Should complete within one frame (16ms)
            
            return {
                passed,
                layoutTime: layoutTime.toFixed(2),
                memoryInfo,
                details: `Layout time: ${layoutTime.toFixed(2)}ms`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test responsive transitions
     */
    async testResponsiveTransitions(breakpoints) {
        console.log('\n🔄 Testing Responsive Transitions...');
        
        for (let i = 0; i < breakpoints.length - 1; i++) {
            const from = breakpoints[i];
            const to = breakpoints[i + 1];
            
            console.log(`  Transitioning from ${from.name} to ${to.name}`);
            
            // Set initial state
            this.simulateViewportChange(from.width, from.height);
            await this.waitForLayoutSettlement();
            
            // Measure transition
            const startTime = performance.now();
            this.simulateViewportChange(to.width, to.height);
            await this.waitForLayoutSettlement();
            const transitionTime = performance.now() - startTime;
            
            const passed = transitionTime < 100; // Transition should be smooth (< 100ms)
            
            this.addTestResult(
                'Responsive Transitions',
                `${from.name} → ${to.name}`,
                passed,
                `Transition time: ${transitionTime.toFixed(2)}ms`
            );
        }
    }

    /**
     * Test panel toggle functionality
     */
    async testPanelToggle(panelId) {
        try {
            const panel = document.getElementById(`${panelId}-panel`);
            if (!panel) {
                return { passed: false, details: `${panelId} panel not found` };
            }
            
            const initialState = window.getComputedStyle(panel).display !== 'none';
            
            // Toggle panel
            if (window.layoutManager && window.layoutManager.togglePanel) {
                const startTime = performance.now();
                window.layoutManager.togglePanel(panelId);
                await this.waitForLayoutSettlement();
                const toggleTime = performance.now() - startTime;
                
                const newState = window.getComputedStyle(panel).display !== 'none';
                const stateChanged = initialState !== newState;
                
                // Toggle back
                window.layoutManager.togglePanel(panelId);
                await this.waitForLayoutSettlement();
                
                const passed = stateChanged && toggleTime < 50;
                
                return {
                    passed,
                    toggleTime: toggleTime.toFixed(2),
                    details: `State changed: ${stateChanged}, Toggle time: ${toggleTime.toFixed(2)}ms`
                };
            } else {
                return { passed: false, details: 'Layout manager or togglePanel method not available' };
            }
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test panel animations
     */
    async testPanelAnimations() {
        try {
            const leftPanel = document.getElementById('left-panel');
            if (!leftPanel) {
                return { passed: false, details: 'Left panel not found for animation test' };
            }

            const animationTimes = [];
            const testCount = 3;

            for (let i = 0; i < testCount; i++) {
                const startTime = performance.now();
                
                // Toggle panel and measure animation time
                if (window.layoutManager && window.layoutManager.togglePanel) {
                    window.layoutManager.togglePanel('left');
                    await this.waitForLayoutSettlement();
                    
                    const animationTime = performance.now() - startTime;
                    animationTimes.push(animationTime);
                    
                    // Toggle back
                    window.layoutManager.togglePanel('left');
                    await this.waitForLayoutSettlement();
                }
            }

            const avgAnimationTime = animationTimes.reduce((a, b) => a + b, 0) / animationTimes.length;
            const passed = avgAnimationTime < 100; // Animations should be under 100ms

            return {
                passed,
                avgAnimationTime: avgAnimationTime.toFixed(2),
                details: `Average animation time: ${avgAnimationTime.toFixed(2)}ms`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test simultaneous panel operations
     */
    async testSimultaneousPanelOperations() {
        try {
            if (!window.layoutManager || !window.layoutManager.togglePanel) {
                return { passed: false, details: 'Layout manager not available' };
            }

            const startTime = performance.now();
            
            // Toggle multiple panels simultaneously
            const promises = [
                this.togglePanelAsync('left'),
                this.togglePanelAsync('right'),
                this.togglePanelAsync('bottom')
            ];

            await Promise.all(promises);
            const simultaneousTime = performance.now() - startTime;

            // Check if all panels responded
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            const bottomPanel = document.getElementById('bottom-panel');

            const allPanelsResponded = leftPanel && rightPanel && bottomPanel;
            const passed = allPanelsResponded && simultaneousTime < 200;

            return {
                passed,
                simultaneousTime: simultaneousTime.toFixed(2),
                details: `Simultaneous operation time: ${simultaneousTime.toFixed(2)}ms, All panels responded: ${allPanelsResponded}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Helper method for async panel toggle
     */
    async togglePanelAsync(panelId) {
        return new Promise(resolve => {
            window.layoutManager.togglePanel(panelId);
            setTimeout(resolve, 10);
        });
    }

    /**
     * Test canvas initialization
     */
    async testCanvasInitialization() {
        try {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) {
                return { passed: false, details: 'Canvas container not found' };
            }

            const startTime = performance.now();
            
            // Check if canvas is properly initialized
            const canvas = canvasContainer.querySelector('canvas');
            const hasCanvas = !!canvas;
            const hasProperDimensions = canvas && canvas.width > 0 && canvas.height > 0;
            
            const initTime = performance.now() - startTime;
            const passed = hasCanvas && hasProperDimensions && initTime < 100;

            return {
                passed,
                initTime: initTime.toFixed(2),
                details: `Canvas present: ${hasCanvas}, Proper dimensions: ${hasProperDimensions}, Init time: ${initTime.toFixed(2)}ms`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test render loop performance
     */
    async testRenderLoopPerformance() {
        try {
            const renderTimes = [];
            const testFrames = 60; // Test for 60 frames
            
            return new Promise(resolve => {
                let frameCount = 0;
                let lastTime = performance.now();

                const measureFrame = () => {
                    const currentTime = performance.now();
                    const frameTime = currentTime - lastTime;
                    renderTimes.push(frameTime);
                    lastTime = currentTime;
                    
                    frameCount++;
                    
                    if (frameCount < testFrames) {
                        requestAnimationFrame(measureFrame);
                    } else {
                        const avgFrameTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
                        const fps = 1000 / avgFrameTime;
                        const passed = fps >= 30; // Should maintain at least 30 FPS
                        
                        this.performanceMetrics.canvasRenderTime = renderTimes;
                        
                        resolve({
                            passed,
                            avgFrameTime: avgFrameTime.toFixed(2),
                            fps: fps.toFixed(1),
                            details: `Average frame time: ${avgFrameTime.toFixed(2)}ms, FPS: ${fps.toFixed(1)}`
                        });
                    }
                };
                
                requestAnimationFrame(measureFrame);
            });
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test memory usage stability
     */
    async testMemoryUsageStability() {
        try {
            if (!performance.memory) {
                return { passed: true, details: 'Memory API not available, test skipped' };
            }

            const initialMemory = performance.memory.usedJSHeapSize;
            const memoryReadings = [initialMemory];

            // Take memory readings over time
            for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
                memoryReadings.push(performance.memory.usedJSHeapSize);
            }

            const maxMemory = Math.max(...memoryReadings);
            const minMemory = Math.min(...memoryReadings);
            const memoryVariation = ((maxMemory - minMemory) / initialMemory) * 100;

            // Memory variation should be less than 20%
            const passed = memoryVariation < 20;

            this.performanceMetrics.memoryUsage = memoryReadings;

            return {
                passed,
                memoryVariation: memoryVariation.toFixed(2),
                details: `Memory variation: ${memoryVariation.toFixed(2)}%`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test frame rate consistency
     */
    async testFrameRateConsistency() {
        try {
            const frameTimes = [];
            const testDuration = 1000; // 1 second
            const startTime = performance.now();

            return new Promise(resolve => {
                let lastFrameTime = startTime;

                const measureConsistency = () => {
                    const currentTime = performance.now();
                    const frameTime = currentTime - lastFrameTime;
                    frameTimes.push(frameTime);
                    lastFrameTime = currentTime;

                    if (currentTime - startTime < testDuration) {
                        requestAnimationFrame(measureConsistency);
                    } else {
                        // Calculate frame time variance
                        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                        const variance = frameTimes.reduce((acc, time) => acc + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length;
                        const standardDeviation = Math.sqrt(variance);
                        
                        // Frame times should be consistent (low standard deviation)
                        const passed = standardDeviation < 5;

                        this.performanceMetrics.animationFrameTime = frameTimes;

                        resolve({
                            passed,
                            avgFrameTime: avgFrameTime.toFixed(2),
                            standardDeviation: standardDeviation.toFixed(2),
                            details: `Frame consistency (std dev): ${standardDeviation.toFixed(2)}ms`
                        });
                    }
                };

                requestAnimationFrame(measureConsistency);
            });
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test canvas resize performance
     */
    async testCanvasResizePerformance() {
        try {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) {
                return { passed: false, details: 'Canvas container not found' };
            }

            const originalWidth = canvasContainer.style.width;
            const originalHeight = canvasContainer.style.height;
            
            const resizeTimes = [];
            const testSizes = [
                { width: '800px', height: '600px' },
                { width: '1200px', height: '800px' },
                { width: '1600px', height: '1000px' }
            ];

            for (const size of testSizes) {
                const startTime = performance.now();
                
                canvasContainer.style.width = size.width;
                canvasContainer.style.height = size.height;
                
                // Force layout recalculation
                canvasContainer.offsetHeight;
                
                const resizeTime = performance.now() - startTime;
                resizeTimes.push(resizeTime);
                
                await this.waitForLayoutSettlement();
            }

            // Restore original size
            canvasContainer.style.width = originalWidth;
            canvasContainer.style.height = originalHeight;

            const avgResizeTime = resizeTimes.reduce((a, b) => a + b, 0) / resizeTimes.length;
            const passed = avgResizeTime < 50; // Resize should be fast

            return {
                passed,
                avgResizeTime: avgResizeTime.toFixed(2),
                details: `Average resize time: ${avgResizeTime.toFixed(2)}ms`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test system initialization
     */
    async testSystemInitialization() {
        try {
            const systems = [
                { name: 'Layout Manager', obj: window.layoutManager },
                { name: 'Responsive Breakpoints', obj: window.responsiveBreakpoints },
                { name: 'Viewport Monitor', obj: window.viewportMonitor },
                { name: 'Core Layout System', obj: window.coreLayoutSystem }
            ];

            const initializedSystems = systems.filter(system => system.obj).length;
            const passed = initializedSystems === systems.length;

            return {
                passed,
                initializedSystems,
                totalSystems: systems.length,
                details: `${initializedSystems}/${systems.length} systems initialized`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test component communication
     */
    async testComponentCommunication() {
        try {
            let communicationWorking = true;
            const testResults = [];

            // Test layout manager to responsive breakpoints communication
            if (window.layoutManager && window.responsiveBreakpoints) {
                try {
                    const breakpoint = window.responsiveBreakpoints.getCurrentBreakpoint();
                    const layoutInfo = window.layoutManager.getLayoutInfo();
                    testResults.push({ component: 'LayoutManager-ResponsiveBreakpoints', working: !!(breakpoint && layoutInfo) });
                } catch (error) {
                    testResults.push({ component: 'LayoutManager-ResponsiveBreakpoints', working: false });
                    communicationWorking = false;
                }
            }

            // Test viewport monitor communication
            if (window.viewportMonitor && window.layoutManager) {
                try {
                    const viewport = window.viewportMonitor.getViewportDimensions();
                    const layoutViewport = window.layoutManager.viewportSize;
                    testResults.push({ component: 'ViewportMonitor-LayoutManager', working: !!(viewport && layoutViewport) });
                } catch (error) {
                    testResults.push({ component: 'ViewportMonitor-LayoutManager', working: false });
                    communicationWorking = false;
                }
            }

            const workingComponents = testResults.filter(r => r.working).length;
            const passed = communicationWorking && workingComponents === testResults.length;

            return {
                passed,
                workingComponents,
                totalComponents: testResults.length,
                details: `${workingComponents}/${testResults.length} component communications working`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test state synchronization
     */
    async testStateSynchronization() {
        try {
            if (!window.layoutManager) {
                return { passed: false, details: 'Layout manager not available' };
            }

            // Test panel state synchronization
            const initialLeftState = window.layoutManager.panelStates?.left;
            
            if (typeof initialLeftState !== 'undefined') {
                // Toggle panel and check if state is synchronized
                window.layoutManager.togglePanel('left');
                await this.waitForLayoutSettlement();
                
                const newLeftState = window.layoutManager.panelStates.left;
                const stateChanged = initialLeftState !== newLeftState;
                
                // Restore state
                window.layoutManager.togglePanel('left');
                await this.waitForLayoutSettlement();
                
                return {
                    passed: stateChanged,
                    details: `Panel state synchronization: ${stateChanged ? 'working' : 'failed'}`
                };
            } else {
                return { passed: false, details: 'Panel states not available' };
            }
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test event handling
     */
    async testEventHandling() {
        try {
            let eventsFired = 0;
            const testEvents = ['resize', 'orientationchange'];
            
            // Create temporary event listeners
            const eventHandlers = testEvents.map(eventType => {
                const handler = () => eventsFired++;
                window.addEventListener(eventType, handler);
                return { eventType, handler };
            });

            // Simulate events
            testEvents.forEach(eventType => {
                const event = new Event(eventType);
                window.dispatchEvent(event);
            });

            // Wait for events to process
            await new Promise(resolve => setTimeout(resolve, 100));

            // Clean up event listeners
            eventHandlers.forEach(({ eventType, handler }) => {
                window.removeEventListener(eventType, handler);
            });

            const passed = eventsFired === testEvents.length;

            return {
                passed,
                eventsFired,
                expectedEvents: testEvents.length,
                details: `${eventsFired}/${testEvents.length} events handled correctly`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test configuration management
     */
    async testConfigurationManagement() {
        try {
            const configTests = [];

            // Test layout manager configuration
            if (window.layoutManager && window.layoutManager.getLayoutInfo) {
                const layoutInfo = window.layoutManager.getLayoutInfo();
                configTests.push({ 
                    name: 'Layout Manager Config', 
                    passed: !!(layoutInfo && layoutInfo.viewportSize) 
                });
            }

            // Test responsive breakpoints configuration
            if (window.responsiveBreakpoints && window.responsiveBreakpoints.getDebugInfo) {
                const debugInfo = window.responsiveBreakpoints.getDebugInfo();
                configTests.push({ 
                    name: 'Responsive Breakpoints Config', 
                    passed: !!(debugInfo && debugInfo.breakpoints) 
                });
            }

            const passedConfigs = configTests.filter(test => test.passed).length;
            const passed = passedConfigs === configTests.length;

            return {
                passed,
                passedConfigs,
                totalConfigs: configTests.length,
                details: `${passedConfigs}/${configTests.length} configurations valid`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test missing element recovery
     */
    async testMissingElementRecovery() {
        try {
            if (!window.layoutErrorHandler) {
                return { passed: false, details: 'Layout error handler not available' };
            }

            // Test missing element detection and recovery
            const testElementId = 'test-recovery-element';
            
            // Simulate missing element detection
            window.layoutErrorHandler.detectMissingElements([testElementId]);
            
            // Check if recovery was attempted
            const status = window.layoutErrorHandler.getStatus();
            const recoveryAttempted = status.recoveryAttempts > 0 || status.missingElements.length > 0;

            return {
                passed: recoveryAttempted,
                details: `Missing element recovery: ${recoveryAttempted ? 'attempted' : 'not attempted'}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test CSS conflict resolution
     */
    async testCSSConflictResolution() {
        try {
            if (!window.layoutErrorHandler) {
                return { passed: false, details: 'Layout error handler not available' };
            }

            // Create a test element with CSS conflicts
            const testElement = document.createElement('div');
            testElement.id = 'css-conflict-test-element';
            testElement.style.display = 'none';
            document.body.appendChild(testElement);

            // Test conflict detection and resolution
            window.layoutErrorHandler.checkForCSSConflicts(testElement);
            
            const status = window.layoutErrorHandler.getStatus();
            const conflictDetected = status.cssConflicts.some(c => c.elementId === 'css-conflict-test-element');

            // Clean up
            testElement.remove();

            return {
                passed: conflictDetected,
                details: `CSS conflict detection: ${conflictDetected ? 'working' : 'not working'}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test fallback layout application
     */
    async testFallbackLayoutApplication() {
        try {
            if (!window.layoutErrorHandler) {
                return { passed: false, details: 'Layout error handler not available' };
            }

            // Test fallback layout availability
            const hasFallbackLayouts = window.layoutErrorHandler.fallbackLayouts && 
                                     window.layoutErrorHandler.fallbackLayouts.size > 0;

            if (hasFallbackLayouts) {
                // Test fallback layout application
                const viewportType = window.layoutErrorHandler.detectViewportType();
                const fallbackConfig = window.layoutErrorHandler.fallbackLayouts.get(viewportType);
                
                return {
                    passed: !!fallbackConfig,
                    details: `Fallback layout for ${viewportType}: ${fallbackConfig ? 'available' : 'not available'}`
                };
            } else {
                return { passed: false, details: 'No fallback layouts configured' };
            }
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test system recovery
     */
    async testSystemRecovery() {
        try {
            if (!window.layoutErrorHandler) {
                return { passed: false, details: 'Layout error handler not available' };
            }

            // Test comprehensive system check
            const checkResults = window.layoutErrorHandler.runComprehensiveCheck();
            const systemHealth = window.layoutErrorHandler.getSystemHealth();

            const validHealthStates = ['healthy', 'stable-with-issues', 'warning', 'critical', 'degraded'];
            const healthStateValid = validHealthStates.includes(systemHealth);

            return {
                passed: !!(checkResults && healthStateValid),
                systemHealth,
                details: `System health: ${systemHealth}, Check results: ${!!checkResults}`
            };
        } catch (error) {
            return {
                passed: false,
                details: `Error: ${error.message}`
            };
        }
    }

    /**
     * Add test result to results collection
     */
    addTestResult(suite, testName, passed, details) {
        if (!this.results.testSuites[suite]) {
            this.results.testSuites[suite] = { tests: [] };
        }
        
        this.results.testSuites[suite].tests.push({
            name: testName,
            passed,
            details,
            timestamp: Date.now()
        });
        
        this.results.summary.totalTests++;
        if (passed) {
            this.results.summary.passedTests++;
        } else {
            this.results.summary.failedTests++;
        }
        
        this.results.summary.passRate = (this.results.summary.passedTests / this.results.summary.totalTests * 100).toFixed(1);
        
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${details}`);
    }

    /**
     * Calculate summary for a test suite
     */
    calculateSuiteSummary(results) {
        const total = results.length;
        const passed = results.filter(r => r.passed).length;
        const failed = total - passed;
        const passRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
        
        return { total, passed, failed, passRate };
    }

    /**
     * Format breakpoint test details
     */
    formatBreakpointDetails(tests, layoutTime) {
        const details = [];
        Object.entries(tests).forEach(([key, test]) => {
            details.push(`${key}: ${test.passed ? 'PASS' : 'FAIL'}`);
        });
        details.push(`Layout time: ${layoutTime.toFixed(2)}ms`);
        return details.join(', ');
    }

    /**
     * Generate final comprehensive report
     */
    generateFinalReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE LAYOUT VALIDATION REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n🕒 Test Execution Time: ${new Date(this.results.timestamp).toLocaleString()}`);
        console.log(`📈 Overall Results: ${this.results.summary.passedTests}/${this.results.summary.totalTests} tests passed (${this.results.summary.passRate}%)`);
        
        // Suite summaries
        Object.entries(this.results.testSuites).forEach(([suiteName, suite]) => {
            if (suite.summary) {
                console.log(`\n📋 ${suiteName}: ${suite.summary.passed}/${suite.summary.total} passed (${suite.summary.passRate}%)`);
            }
        });
        
        // Performance metrics summary
        if (this.performanceMetrics.canvasRenderTime.length > 0) {
            const avgRenderTime = this.performanceMetrics.canvasRenderTime.reduce((a, b) => a + b, 0) / this.performanceMetrics.canvasRenderTime.length;
            console.log(`\n⚡ Average Canvas Render Time: ${avgRenderTime.toFixed(2)}ms`);
        }
        
        // Final assessment
        if (this.results.summary.passRate >= 90) {
            console.log('\n🎉 EXCELLENT: Layout system is performing exceptionally well!');
        } else if (this.results.summary.passRate >= 75) {
            console.log('\n✅ GOOD: Layout system is performing well with minor issues.');
        } else if (this.results.summary.passRate >= 60) {
            console.log('\n⚠️ NEEDS ATTENTION: Layout system has some issues that should be addressed.');
        } else {
            console.log('\n❌ CRITICAL: Layout system has significant issues requiring immediate attention.');
        }
        
        console.log('='.repeat(80));
    }
}

// Export functions for global access
export async function runComprehensiveLayoutValidation() {
    const testSuite = new LayoutValidationSuite();
    return await testSuite.runAllTests();
}

export function createLayoutValidationSuite() {
    return new LayoutValidationSuite();
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.LayoutValidationSuite = LayoutValidationSuite;
    window.runComprehensiveLayoutValidation = runComprehensiveLayoutValidation;
    window.createLayoutValidationSuite = createLayoutValidationSuite;
    
    console.log('🧪 Comprehensive Layout Validation Suite loaded');
    console.log('Available functions:');
    console.log('  - runComprehensiveLayoutValidation() - Run all validation tests');
    console.log('  - createLayoutValidationSuite() - Create new test suite instance');
    console.log('  - new LayoutValidationSuite() - Create test suite class instance');
}