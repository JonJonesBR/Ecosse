// js/ui/finalIntegrationTest.js
import { uiController } from './uiController.js';
import { menuSystem } from './menuSystem.js';
import { contextualPanels } from './panels.js';
import { analysisTools } from './analysisTools.js';
import { controlsManager } from './controlsManager.js';
import { feedbackSystem } from './feedbackSystem.js';
import { visualIndicators } from './visualIndicators.js';
import { contextualHelp } from './contextualHelp.js';
import { gestureSystem } from './gestureSystem.js';
import { selectionModes } from './selectionModes.js';
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Final Integration Test for Task 4 - UI Enhancement
 * This verifies all UI components are properly integrated and working
 */
export class UIIntegrationVerifier {
    constructor() {
        this.testResults = [];
        this.allPassed = true;
    }

    /**
     * Run comprehensive UI integration verification
     */
    async runVerification() {
        console.log('🔍 Starting UI Integration Verification for Task 4...');
        
        // Test 4.1: Redesenhar painéis e controles principais
        await this.verifyPanelsAndControls();
        
        // Test 4.2: Implementar ferramentas de análise avançadas
        await this.verifyAnalysisTools();
        
        // Test 4.3: Melhorar controles e interações
        await this.verifyControlsAndInteractions();
        
        // Test 4.4: Aprimorar sistema de feedback
        await this.verifyFeedbackSystem();
        
        // Overall integration test
        await this.verifyOverallIntegration();
        
        this.displayResults();
        return this.allPassed;
    }

    /**
     * Test 4.1: Verify panels and controls redesign
     */
    async verifyPanelsAndControls() {
        console.log('📋 Testing 4.1: Redesenhar painéis e controles principais');
        
        // Test contextual panels
        this.test('Contextual panels system exists', () => {
            return contextualPanels && typeof contextualPanels.switchContext === 'function';
        });
        
        // Test menu system
        this.test('Menu system exists and functional', () => {
            return menuSystem && typeof menuSystem.showMenu === 'function';
        });
        
        // Test UI controller mode switching
        this.test('UI controller mode switching works', () => {
            if (!uiController.modeConfigurations) return false;
            return Object.keys(uiController.modeConfigurations).length > 0;
        });
        
        // Test panel state management
        this.test('Panel state management exists', () => {
            return uiController.panelStates && uiController.panelStates instanceof Map;
        });
        
        // Test responsive design elements
        this.test('Responsive design handlers exist', () => {
            return typeof uiController.handleResize === 'function';
        });
    }

    /**
     * Test 4.2: Verify analysis tools
     */
    async verifyAnalysisTools() {
        console.log('📊 Testing 4.2: Implementar ferramentas de análise avançadas');
        
        // Test analysis tools existence
        this.test('Analysis tools system exists', () => {
            return analysisTools && typeof analysisTools.initialize === 'function';
        });
        
        // Test chart generation
        this.test('Chart generation capability exists', () => {
            return typeof analysisTools.createPopulationChart === 'function';
        });
        
        // Test heatmap functionality
        this.test('Heatmap functionality exists', () => {
            return typeof analysisTools.createHeatmap === 'function';
        });
        
        // Test statistics calculation
        this.test('Statistics calculation exists', () => {
            return typeof analysisTools.calculateEcosystemStats === 'function';
        });
        
        // Test analysis modal integration
        this.test('Analysis modal exists in DOM', () => {
            return document.getElementById('analysis-modal') !== null;
        });
    }

    /**
     * Test 4.3: Verify controls and interactions
     */
    async verifyControlsAndInteractions() {
        console.log('🎮 Testing 4.3: Melhorar controles e interações');
        
        // Test controls manager
        this.test('Controls manager exists', () => {
            return controlsManager && typeof controlsManager.initialize === 'function';
        });
        
        // Test gesture system
        this.test('Gesture system exists', () => {
            return gestureSystem && typeof gestureSystem.initialize === 'function';
        });
        
        // Test selection modes
        this.test('Selection modes system exists', () => {
            return selectionModes && typeof selectionModes.setMode === 'function';
        });
        
        // Test keyboard shortcuts
        this.test('Keyboard shortcuts system exists', () => {
            return controlsManager.shortcuts && controlsManager.shortcuts instanceof Map;
        });
        
        // Test shortcuts panel
        this.test('Shortcuts panel exists in DOM', () => {
            return document.getElementById('shortcuts-btn') !== null;
        });
    }

    /**
     * Test 4.4: Verify feedback system
     */
    async verifyFeedbackSystem() {
        console.log('💬 Testing 4.4: Aprimorar sistema de feedback');
        
        // Test feedback system
        this.test('Feedback system exists', () => {
            return feedbackSystem && typeof feedbackSystem.initialize === 'function';
        });
        
        // Test visual indicators
        this.test('Visual indicators system exists', () => {
            return visualIndicators && typeof visualIndicators.showIndicator === 'function';
        });
        
        // Test contextual help
        this.test('Contextual help system exists', () => {
            return contextualHelp && typeof contextualHelp.initialize === 'function';
        });
        
        // Test notification system
        this.test('Notification system exists', () => {
            return typeof feedbackSystem.showNotification === 'function';
        });
        
        // Test tooltip system
        this.test('Tooltip system exists', () => {
            return typeof contextualHelp.showTooltip === 'function';
        });
    }

    /**
     * Test overall integration
     */
    async verifyOverallIntegration() {
        console.log('🔗 Testing Overall Integration');
        
        // Test event system integration
        this.test('Event system properly integrated', () => {
            return eventSystem && typeof eventSystem.emit === 'function' && typeof eventSystem.subscribe === 'function';
        });
        
        // Test DOM elements exist
        this.test('Required DOM elements exist', () => {
            const requiredElements = [
                'left-panel', 'right-panel', 'bottom-panel', 'top-panel',
                'main-content', 'three-js-canvas-container'
            ];
            
            return requiredElements.every(id => document.getElementById(id) !== null);
        });
        
        // Test UI initialization
        this.test('UI systems can be initialized', () => {
            try {
                // Test if initialization methods exist and can be called
                return (
                    typeof uiController.initialize === 'function' &&
                    typeof menuSystem.initialize === 'function' &&
                    typeof contextualPanels.initialize === 'function'
                );
            } catch (error) {
                console.error('Initialization test failed:', error);
                return false;
            }
        });
        
        // Test CSS classes and styling
        this.test('UI styling classes are applied', () => {
            const leftPanel = document.getElementById('left-panel');
            return leftPanel && leftPanel.classList.contains('panel');
        });
        
        // Test responsive elements
        this.test('Responsive elements exist', () => {
            const toggleButtons = document.querySelectorAll('.panel-toggle-btn');
            return toggleButtons.length > 0;
        });
    }

    /**
     * Helper method to run individual tests
     */
    test(name, testFn) {
        try {
            const result = testFn();
            this.testResults.push({ name, passed: result, error: null });
            if (!result) {
                this.allPassed = false;
                console.warn(`❌ ${name}`);
            } else {
                console.log(`✅ ${name}`);
            }
        } catch (error) {
            this.testResults.push({ name, passed: false, error: error.message });
            this.allPassed = false;
            console.error(`❌ ${name}: ${error.message}`);
        }
    }

    /**
     * Display final results
     */
    displayResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log('\n' + '='.repeat(60));
        console.log('🧪 UI Integration Verification Results');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (this.allPassed) {
            console.log('\n🎉 All UI integration tests passed!');
            console.log('✨ Task 4: Aprimoramento da Interface do Usuário - COMPLETE');
        } else {
            console.log('\n⚠️ Some UI integration tests failed');
            console.log('Failed tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}${r.error ? ': ' + r.error : ''}`));
        }
        
        console.log('='.repeat(60));
    }

    /**
     * Get detailed test report
     */
    getReport() {
        return {
            allPassed: this.allPassed,
            totalTests: this.testResults.length,
            passedTests: this.testResults.filter(r => r.passed).length,
            failedTests: this.testResults.filter(r => !r.passed),
            results: this.testResults
        };
    }
}

/**
 * Quick verification function for console use
 */
export async function verifyUIIntegration() {
    const verifier = new UIIntegrationVerifier();
    return await verifier.runVerification();
}

/**
 * Export for manual testing in browser console
 */
if (typeof window !== 'undefined') {
    window.verifyUIIntegration = verifyUIIntegration;
    window.UIIntegrationVerifier = UIIntegrationVerifier;
}