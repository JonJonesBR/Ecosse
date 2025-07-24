/**
 * Integration test for the enhanced feedback system
 * Tests visual indicators, notifications, and contextual help
 */

import { feedbackSystem } from './feedbackSystem.js';
import { visualIndicators } from './visualIndicators.js';
import { contextualHelp } from './contextualHelp.js';

class FeedbackIntegrationTest {
    constructor() {
        this.testResults = [];
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    /**
     * Run all feedback system tests
     */
    async runAllTests() {
        console.log('🧪 Starting Feedback System Integration Tests...');
        
        try {
            await this.testFeedbackSystemInitialization();
            await this.testNotificationSystem();
            await this.testVisualIndicators();
            await this.testContextualHelp();
            await this.testTooltipSystem();
            await this.testActionFeedback();
            
            this.displayResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    /**
     * Test feedback system initialization
     */
    async testFeedbackSystemInitialization() {
        console.log('Testing feedback system initialization...');
        
        try {
            feedbackSystem.initialize();
            visualIndicators.initialize();
            contextualHelp.initialize();
            
            this.assert(
                feedbackSystem.initialized === true,
                'Feedback system should be initialized'
            );
            
            this.assert(
                visualIndicators.initialized === true,
                'Visual indicators should be initialized'
            );
            
            this.assert(
                contextualHelp.initialized === true,
                'Contextual help should be initialized'
            );
            
            this.assert(
                document.getElementById('notification-container') !== null,
                'Notification container should be created'
            );
            
            this.assert(
                document.getElementById('visual-indicators-container') !== null,
                'Visual indicators container should be created'
            );
            
            console.log('✅ Initialization tests passed');
        } catch (error) {
            console.error('❌ Initialization tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test notification system
     */
    async testNotificationSystem() {
        console.log('Testing notification system...');
        
        try {
            // Test basic notification
            const notificationId = feedbackSystem.showNotification({
                type: 'success',
                title: 'Test Notification',
                message: 'This is a test notification',
                duration: 1000
            });
            
            this.assert(
                typeof notificationId === 'number',
                'Notification should return an ID'
            );
            
            // Wait for notification to appear
            await this.wait(100);
            
            const notification = document.querySelector(`[data-id="${notificationId}"]`);
            this.assert(
                notification !== null,
                'Notification element should be created'
            );
            
            this.assert(
                notification.classList.contains('show'),
                'Notification should have show class'
            );
            
            // Test notification with actions
            const actionNotificationId = feedbackSystem.showNotification({
                type: 'info',
                title: 'Action Test',
                message: 'Test with actions',
                duration: 2000,
                actions: [
                    { label: 'OK', callback: () => console.log('OK clicked') },
                    { label: 'Cancel', secondary: true }
                ]
            });
            
            await this.wait(100);
            
            const actionNotification = document.querySelector(`[data-id="${actionNotificationId}"]`);
            const actionButtons = actionNotification.querySelectorAll('.notification-action');
            
            this.assert(
                actionButtons.length === 2,
                'Notification should have action buttons'
            );
            
            console.log('✅ Notification tests passed');
        } catch (error) {
            console.error('❌ Notification tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test visual indicators
     */
    async testVisualIndicators() {
        console.log('Testing visual indicators...');
        
        try {
            // Test placement indicator
            const indicatorId = visualIndicators.show('placement', 'success', 100, 100);
            
            this.assert(
                typeof indicatorId === 'number',
                'Visual indicator should return an ID'
            );
            
            await this.wait(100);
            
            const indicator = visualIndicators.activeIndicators.get(indicatorId);
            this.assert(
                indicator !== undefined,
                'Visual indicator should be tracked'
            );
            
            // Test indicator removal
            visualIndicators.remove(indicatorId);
            await this.wait(100);
            
            this.assert(
                !visualIndicators.activeIndicators.has(indicatorId),
                'Visual indicator should be removed from tracking'
            );
            
            // Test different indicator types
            const pulseId = visualIndicators.show('action', 'boost', 200, 200);
            const sparkId = visualIndicators.show('event', 'achievement', 300, 300);
            
            this.assert(
                visualIndicators.activeIndicators.size >= 2,
                'Multiple indicators should be tracked'
            );
            
            console.log('✅ Visual indicator tests passed');
        } catch (error) {
            console.error('❌ Visual indicator tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test contextual help system
     */
    async testContextualHelp() {
        console.log('Testing contextual help system...');
        
        try {
            // Test help database
            this.assert(
                contextualHelp.helpDatabase.size > 0,
                'Help database should contain entries'
            );
            
            this.assert(
                contextualHelp.helpDatabase.has('element-placement'),
                'Help database should contain element-placement help'
            );
            
            // Test user progress tracking
            contextualHelp.setUserProgress('test_action', 5);
            const progress = contextualHelp.getUserProgress('test_action');
            
            this.assert(
                progress === 5,
                'User progress should be tracked correctly'
            );
            
            // Test help content generation
            const helpData = contextualHelp.helpDatabase.get('element-placement');
            const content = contextualHelp.createHelpContent(helpData, 'element-placement');
            
            this.assert(
                typeof content === 'string' && content.length > 0,
                'Help content should be generated'
            );
            
            this.assert(
                content.includes(helpData.title),
                'Help content should include title'
            );
            
            console.log('✅ Contextual help tests passed');
        } catch (error) {
            console.error('❌ Contextual help tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test tooltip system
     */
    async testTooltipSystem() {
        console.log('Testing tooltip system...');
        
        try {
            // Create a test element
            const testElement = document.createElement('div');
            testElement.setAttribute('data-tooltip', JSON.stringify({
                title: 'Test Tooltip',
                content: 'This is a test tooltip',
                shortcuts: ['Ctrl+T']
            }));
            document.body.appendChild(testElement);
            
            // Test tooltip show
            feedbackSystem.showTooltip(testElement, {
                title: 'Test Tooltip',
                content: 'This is a test tooltip',
                shortcuts: ['Ctrl+T']
            });
            
            await this.wait(100);
            
            const tooltip = document.querySelector('.enhanced-tooltip');
            this.assert(
                tooltip !== null,
                'Tooltip should be created'
            );
            
            // Test tooltip hide
            feedbackSystem.hideTooltip(testElement);
            await this.wait(300);
            
            const hiddenTooltip = document.querySelector('.enhanced-tooltip.show');
            this.assert(
                hiddenTooltip === null,
                'Tooltip should be hidden'
            );
            
            // Clean up
            document.body.removeChild(testElement);
            
            console.log('✅ Tooltip tests passed');
        } catch (error) {
            console.error('❌ Tooltip tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test action feedback
     */
    async testActionFeedback() {
        console.log('Testing action feedback...');
        
        try {
            // Test success feedback
            feedbackSystem.showActionFeedback('Test Action', true, 'Success details');
            
            await this.wait(100);
            
            const successNotification = document.querySelector('.notification');
            this.assert(
                successNotification !== null,
                'Success feedback should create notification'
            );
            
            // Test error feedback
            feedbackSystem.showActionFeedback('Failed Action', false, 'Error details');
            
            await this.wait(100);
            
            const notifications = document.querySelectorAll('.notification');
            this.assert(
                notifications.length >= 2,
                'Error feedback should create additional notification'
            );
            
            console.log('✅ Action feedback tests passed');
        } catch (error) {
            console.error('❌ Action feedback tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Test integration with game elements
     */
    async testGameIntegration() {
        console.log('Testing game integration...');
        
        try {
            // Test element placement feedback
            const canvas = document.querySelector('#three-js-canvas-container canvas');
            if (canvas) {
                // Simulate element placement
                const mockEvent = {
                    clientX: 100,
                    clientY: 100
                };
                
                // This would normally be called from the game's interaction handler
                visualIndicators.showPlacementResult(100, 100, true, 'plant');
                
                await this.wait(100);
                
                this.assert(
                    visualIndicators.activeIndicators.size > 0,
                    'Game integration should create visual indicators'
                );
            }
            
            console.log('✅ Game integration tests passed');
        } catch (error) {
            console.error('❌ Game integration tests failed:', error);
            this.testsFailed++;
        }
    }

    /**
     * Assert helper function
     */
    assert(condition, message) {
        if (condition) {
            this.testsPassed++;
            this.testResults.push({ status: 'PASS', message });
        } else {
            this.testsFailed++;
            this.testResults.push({ status: 'FAIL', message });
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Wait helper function
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n📊 Feedback System Test Results:');
        console.log(`✅ Tests Passed: ${this.testsPassed}`);
        console.log(`❌ Tests Failed: ${this.testsFailed}`);
        console.log(`📈 Success Rate: ${((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100).toFixed(1)}%`);
        
        if (this.testsFailed === 0) {
            console.log('🎉 All feedback system tests passed!');
            
            // Show success notification
            if (feedbackSystem.initialized) {
                feedbackSystem.showNotification({
                    type: 'achievement',
                    title: 'Testes Concluídos',
                    message: 'Sistema de feedback funcionando perfeitamente!',
                    duration: 5000
                });
            }
        } else {
            console.log('⚠️ Some tests failed. Check the logs above for details.');
        }
        
        // Detailed results
        console.log('\nDetailed Results:');
        this.testResults.forEach((result, index) => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${index + 1}. ${result.message}`);
        });
    }

    /**
     * Run a quick demo of the feedback system
     */
    runDemo() {
        console.log('🎬 Running feedback system demo...');
        
        setTimeout(() => {
            feedbackSystem.showNotification({
                type: 'info',
                title: 'Demo Iniciado',
                message: 'Demonstração do sistema de feedback',
                duration: 3000
            });
        }, 500);
        
        setTimeout(() => {
            visualIndicators.show('placement', 'success', 200, 200);
        }, 1000);
        
        setTimeout(() => {
            visualIndicators.show('action', 'boost', 300, 300);
        }, 1500);
        
        setTimeout(() => {
            feedbackSystem.showNotification({
                type: 'achievement',
                title: 'Conquista Desbloqueada!',
                message: 'Você testou o sistema de feedback com sucesso!',
                duration: 4000
            });
        }, 2000);
        
        setTimeout(() => {
            visualIndicators.show('event', 'achievement', 400, 400);
        }, 2500);
    }
}

// Export for use in other modules
export const feedbackIntegrationTest = new FeedbackIntegrationTest();

// Auto-run tests if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Run tests after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            feedbackIntegrationTest.runAllTests();
        }, 2000);
    });
}

// Make available globally for manual testing
window.feedbackTest = feedbackIntegrationTest;