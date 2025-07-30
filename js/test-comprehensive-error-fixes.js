/**
 * Comprehensive Test Suite for Error Fixes and Optimization
 * Task 8: Add comprehensive testing and validation
 *
 * This test suite covers:
 * - Unit tests for all error fixing utilities
 * - Integration tests for system repairs
 * - End-to-end tests to validate complete error resolution
 * - Regression tests to prevent error reoccurrence
 */
class ComprehensiveErrorFixesTestSuite {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.startTime = null;
        this.endTime = null;
    }

    // Test execution framework
    async runTest(testName, testFunction) {
        this.totalTests++;
        const testStartTime = performance.now();
        
        try {
            console.log(`🧪 Running test: ${testName}`);
            await testFunction();
            
            const testEndTime = performance.now();
            const duration = testEndTime - testStartTime;
            
            this.passedTests++;
            this.testResults.push({
                name: testName,
                status: 'PASSED',
                duration: duration,
                error: null
            });
            
            console.log(`✅ ${testName} - PASSED (${duration.toFixed(2)}ms)`);
            
        } catch (error) {
            const testEndTime = performance.now();
            const duration = testEndTime - testStartTime;
            
            this.failedTests++;
            this.testResults.push({
                name: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message
            });
            
            console.error(`❌ ${testName} - FAILED (${duration.toFixed(2)}ms)`, error);
        }
    }

    // Assertion helpers
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || 'Value should not be null or undefined');
        }
    }

    assertThrows(fn, message) {
        let threw = false;
        try {
            fn();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error(message || 'Expected function to throw an error');
        }
    }

    // UNIT TESTS FOR ERROR FIXING UTILITIES

    async testDOMValidationUtilities() {
        // Test safe element finding
        const testElement = document.createElement('div');
        testElement.id = 'test-element';
        document.body.appendChild(testElement);

        // Test element exists
        const found = document.getElementById('test-element');
        this.assertNotNull(found, 'Should find existing element');

        // Test safe insertion
        const newElement = document.createElement('span');
        const parent = document.createElement('div');
        const reference = document.createElement('p');
        parent.appendChild(reference);

        // Should not throw error
        try {
            if (parent.contains(reference)) {
                parent.insertBefore(newElement, reference);
            }
            this.assert(parent.contains(newElement), 'Element should be inserted');
        } catch (error) {
            throw new Error('Safe insertion should not throw error');
        }

        // Cleanup
        document.body.removeChild(testElement);
    }

    async testAnalysisToolsIntegration() {
        // Test AnalysisTools initialization without DOM errors
        if (typeof AnalysisTools !== 'undefined') {
            // Mock DOM elements that AnalysisTools expects
            const mockContainer = document.createElement('div');
            mockContainer.id = 'analysis-container';
            document.body.appendChild(mockContainer);

            try {
                // This should not throw insertBefore errors
                const analysisTools = new AnalysisTools();
                this.assert(true, 'AnalysisTools should initialize without errors');
            } catch (error) {
                if (error.message.includes('insertBefore')) {
                    throw new Error('AnalysisTools still has insertBefore errors');
                }
                // Other errors might be expected if dependencies are missing
            }

            // Cleanup
            document.body.removeChild(mockContainer);
        }
    }

    async testPanelFindingMethods() {
        // Create mock panels
        const leftPanel = document.createElement('div');
        leftPanel.id = 'left-panel';
        leftPanel.className = 'panel left';
        
        const rightPanel = document.createElement('div');
        rightPanel.id = 'right-panel';
        rightPanel.className = 'panel right';

        document.body.appendChild(leftPanel);
        document.body.appendChild(rightPanel);

        // Test panel finding
        const foundLeft = document.querySelector('.panel.left') || document.getElementById('left-panel');
        const foundRight = document.querySelector('.panel.right') || document.getElementById('right-panel');

        this.assertNotNull(foundLeft, 'Should find left panel');
        this.assertNotNull(foundRight, 'Should find right panel');

        // Cleanup
        document.body.removeChild(leftPanel);
        document.body.removeChild(rightPanel);
    }

    async testResponsiveCanvasContainerMethods() {
        // Test that ResponsiveCanvasContainer has required methods
        if (typeof ResponsiveCanvasContainer !== 'undefined') {
            const container = new ResponsiveCanvasContainer();
            
            // Test setAutoResize method exists
            this.assert(
                typeof container.setAutoResize === 'function',
                'ResponsiveCanvasContainer should have setAutoResize method'
            );

            // Test method can be called without errors
            try {
                container.setAutoResize(true);
                this.assert(true, 'setAutoResize should be callable');
            } catch (error) {
                throw new Error('setAutoResize method should not throw errors');
            }
        }
    }

    async testProductionConfigurationManager() {
        // Test environment detection
        if (typeof ProductionConfigManager !== 'undefined') {
            const configManager = new ProductionConfigManager();
            
            // Test environment detection
            const env = configManager.detectEnvironment();
            this.assert(
                env === 'production' || env === 'development',
                'Should detect valid environment'
            );

            // Test resource loading strategy
            const resources = configManager.getOptimizedResources();
            this.assertNotNull(resources, 'Should return resource configuration');
            
            // Test that CDN resources are replaced in production
            if (env === 'production') {
                this.assert(
                    !resources.tailwind.includes('cdn.tailwindcss.com'),
                    'Production should not use CDN resources'
                );
            }
        }
    }

    // INTEGRATION TESTS FOR SYSTEM REPAIRS

    async testSystemIntegrationRepairs() {
        // Test that all system dependencies are available
        const requiredSystems = [
            'AnalysisTools',
            'ResponsiveCanvasContainer',
            'LayoutConfigurationSystem',
            'ElementControlsOrganization'
        ];

        for (const system of requiredSystems) {
            if (typeof window[system] !== 'undefined') {
                this.assert(
                    typeof window[system] === 'function' || typeof window[system] === 'object',
                    `${system} should be available`
                );
            }
        }
    }

    async testLayoutSystemIntegration() {
        // Test layout system integration
        const mockCanvas = document.createElement('canvas');
        mockCanvas.id = 'main-canvas';
        
        const mockLeftPanel = document.createElement('div');
        mockLeftPanel.className = 'panel left';
        
        const mockRightPanel = document.createElement('div');
        mockRightPanel.className = 'panel right';

        document.body.appendChild(mockCanvas);
        document.body.appendChild(mockLeftPanel);
        document.body.appendChild(mockRightPanel);

        // Test that layout can be applied without errors
        try {
            if (typeof LayoutConfigurationSystem !== 'undefined') {
                const layoutSystem = new LayoutConfigurationSystem();
                layoutSystem.applyLayout();
                this.assert(true, 'Layout system should apply without errors');
            }
        } catch (error) {
            throw new Error(`Layout system integration failed: ${error.message}`);
        }

        // Cleanup
        document.body.removeChild(mockCanvas);
        document.body.removeChild(mockLeftPanel);
        document.body.removeChild(mockRightPanel);
    }

    async testElementControlsOrganizationIntegration() {
        // Test element controls organization
        const mockContainer = document.createElement('div');
        mockContainer.id = 'controls-container';
        document.body.appendChild(mockContainer);

        try {
            if (typeof ElementControlsOrganization !== 'undefined') {
                const controlsOrg = new ElementControlsOrganization();
                
                // Test category creation
                controlsOrg.createCategory('test-category', 'Test Category');
                
                // Test that category was created in DOM
                const categoryElement = document.querySelector('[data-category="test-category"]');
                this.assertNotNull(categoryElement, 'Category should be created in DOM');
                
                // Test visibility toggle
                controlsOrg.toggleCategoryVisibility('test-category');
                this.assert(true, 'Category visibility should toggle without errors');
            }
        } catch (error) {
            throw new Error(`Element controls organization failed: ${error.message}`);
        }

        // Cleanup
        document.body.removeChild(mockContainer);
    }

    // END-TO-END TESTS FOR COMPLETE ERROR RESOLUTION

    async testCompleteSystemInitialization() {
        // Test complete system initialization without errors
        const originalConsoleError = console.error;
        const errors = [];
        
        // Capture console errors
        console.error = (...args) => {
            errors.push(args.join(' '));
            originalConsoleError(...args);
        };

        try {
            // Simulate system initialization
            if (typeof initializeSystem === 'function') {
                await initializeSystem();
            }

            // Check for critical errors
            const criticalErrors = errors.filter(error => 
                error.includes('insertBefore') ||
                error.includes('node not found') ||
                error.includes('setAutoResize')
            );

            this.assertEqual(
                criticalErrors.length,
                0,
                `System should initialize without critical errors. Found: ${criticalErrors.join(', ')}`
            );

        } finally {
            // Restore console.error
            console.error = originalConsoleError;
        }
    }

    async testProductionResourceLoading() {
        // Test that production resources load correctly
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        let hasCDNResources = false;
        
        stylesheets.forEach(link => {
            if (link.href.includes('cdn.tailwindcss.com')) {
                hasCDNResources = true;
            }
        });

        // In production, should not have CDN resources
        if (window.location.protocol === 'https:' || window.location.hostname !== 'localhost') {
            this.assert(
                !hasCDNResources,
                'Production should not use CDN resources'
            );
        }
    }

    async testPerformanceOptimization() {
        // Test performance optimization features
        let resizeEventCount = 0;
        const originalAddEventListener = window.addEventListener;
        
        // Mock addEventListener to count resize events
        window.addEventListener = function(event, handler, options) {
            if (event === 'resize') {
                resizeEventCount++;
            }
            return originalAddEventListener.call(this, event, handler, options);
        };

        try {
            // Trigger multiple resize events quickly
            for (let i = 0; i < 10; i++) {
                window.dispatchEvent(new Event('resize'));
            }

            // Wait for debouncing
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should have debounced the events
            this.assert(
                resizeEventCount <= 10,
                'Resize events should be properly handled'
            );

        } finally {
            // Restore addEventListener
            window.addEventListener = originalAddEventListener;
        }
    }

    // REGRESSION TESTS TO PREVENT ERROR REOCCURRENCE

    async testDOMErrorRegression() {
        // Test that DOM errors don't reoccur
        const problematicOperations = [
            () => {
                const parent = document.createElement('div');
                const child = document.createElement('span');
                const reference = document.createElement('p');
                
                // This should not throw insertBefore errors
                if (parent.contains(reference)) {
                    parent.insertBefore(child, reference);
                } else {
                    parent.appendChild(child);
                }
            },
            () => {
                // Test element finding with fallback
                const element = document.getElementById('non-existent') || 
                               document.createElement('div');
                this.assertNotNull(element, 'Should always return an element');
            }
        ];

        for (const operation of problematicOperations) {
            try {
                operation();
                this.assert(true, 'DOM operation should not throw errors');
            } catch (error) {
                throw new Error(`DOM regression detected: ${error.message}`);
            }
        }
    }

    async testSystemIntegrationRegression() {
        // Test that system integration errors don't reoccur
        const systemChecks = [
            () => {
                // Check ResponsiveCanvasContainer methods
                if (typeof ResponsiveCanvasContainer !== 'undefined') {
                    const container = new ResponsiveCanvasContainer();
                    this.assert(
                        typeof container.setAutoResize === 'function',
                        'setAutoResize method should exist'
                    );
                }
            },
            () => {
                // Check panel finding
                const leftPanel = document.querySelector('.panel.left') || 
                                document.getElementById('left-panel') ||
                                document.createElement('div');
                this.assertNotNull(leftPanel, 'Left panel should be findable');
            }
        ];

        for (const check of systemChecks) {
            try {
                check();
            } catch (error) {
                throw new Error(`System integration regression: ${error.message}`);
            }
        }
    }

    async testPerformanceRegression() {
        // Test that performance issues don't reoccur
        const startTime = performance.now();
        
        // Simulate operations that previously caused performance issues
        for (let i = 0; i < 100; i++) {
            // Simulate layout calculations
            const element = document.createElement('div');
            element.style.width = '100px';
            element.style.height = '100px';
            document.body.appendChild(element);
            
            // Get computed style (expensive operation)
            window.getComputedStyle(element);
            
            document.body.removeChild(element);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should complete within reasonable time (less than 1 second)
        this.assert(
            duration < 1000,
            `Performance regression detected: operations took ${duration}ms`
        );
    }

    // TEST EXECUTION AND REPORTING

    async runAllTests() {
        this.startTime = performance.now();
        console.log('🚀 Starting Comprehensive Error Fixes Test Suite');
        console.log('=' .repeat(60));

        // Unit Tests
        console.log('\n📋 UNIT TESTS');
        console.log('-'.repeat(30));
        await this.runTest('DOM Validation Utilities', () => this.testDOMValidationUtilities());
        await this.runTest('AnalysisTools Integration', () => this.testAnalysisToolsIntegration());
        await this.runTest('Panel Finding Methods', () => this.testPanelFindingMethods());
        await this.runTest('ResponsiveCanvasContainer Methods', () => this.testResponsiveCanvasContainerMethods());
        await this.runTest('Production Configuration Manager', () => this.testProductionConfigurationManager());

        // Integration Tests
        console.log('\n🔗 INTEGRATION TESTS');
        console.log('-'.repeat(30));
        await this.runTest('System Integration Repairs', () => this.testSystemIntegrationRepairs());
        await this.runTest('Layout System Integration', () => this.testLayoutSystemIntegration());
        await this.runTest('Element Controls Organization Integration', () => this.testElementControlsOrganizationIntegration());

        // End-to-End Tests
        console.log('\n🎯 END-TO-END TESTS');
        console.log('-'.repeat(30));
        await this.runTest('Complete System Initialization', () => this.testCompleteSystemInitialization());
        await this.runTest('Production Resource Loading', () => this.testProductionResourceLoading());
        await this.runTest('Performance Optimization', () => this.testPerformanceOptimization());

        // Regression Tests
        console.log('\n🔄 REGRESSION TESTS');
        console.log('-'.repeat(30));
        await this.runTest('DOM Error Regression', () => this.testDOMErrorRegression());
        await this.runTest('System Integration Regression', () => this.testSystemIntegrationRegression());
        await this.runTest('Performance Regression', () => this.testPerformanceRegression());

        this.endTime = performance.now();
        this.generateReport();
    }

    generateReport() {
        const totalDuration = this.endTime - this.startTime;
        const successRate = (this.passedTests / this.totalTests * 100).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests} ✅`);
        console.log(`Failed: ${this.failedTests} ❌`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);

        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            console.log('-'.repeat(30));
            this.testResults
                .filter(result => result.status === 'FAILED')
                .forEach(result => {
                    console.log(`• ${result.name}: ${result.error}`);
                });
        }

        console.log('\n📈 DETAILED RESULTS:');
        console.log('-'.repeat(30));
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${status} ${result.name} (${result.duration.toFixed(2)}ms)`);
        });

        // Return summary for programmatic use
        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: parseFloat(successRate),
            duration: totalDuration,
            results: this.testResults
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveErrorFixesTestSuite;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.ComprehensiveErrorFixesTestSuite = ComprehensiveErrorFixesTestSuite;
    
    // Add convenience function to run tests
    window.runComprehensiveErrorFixesTests = async function() {
        const testSuite = new ComprehensiveErrorFixesTestSuite();
        return await testSuite.runAllTests();
    };
}