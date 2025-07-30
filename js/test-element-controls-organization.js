/**
 * Test file for Element Controls Organization functionality
 * Tests category expansion/collapse, compact mode, and space utilization
 */

class ElementControlsOrganizationTest {
    constructor() {
        this.testResults = [];
        this.organizer = null;
    }
    
    async runTests() {
        console.log('🧪 Starting Element Controls Organization Tests...');
        
        // Wait for organizer to initialize
        await this.waitForOrganizer();
        
        // Run test suite
        this.testCategoryStructure();
        this.testCategoryToggling();
        this.testCompactMode();
        this.testResponsiveLayout();
        this.testSmartLayout();
        this.testKeyboardShortcuts();
        this.testStatePersistence();
        
        // Display results
        this.displayResults();
    }
    
    async waitForOrganizer() {
        return new Promise((resolve) => {
            const checkOrganizer = () => {
                if (window.elementControlsOrganizer) {
                    this.organizer = window.elementControlsOrganizer;
                    resolve();
                } else {
                    setTimeout(checkOrganizer, 100);
                }
            };
            checkOrganizer();
        });
    }
    
    testCategoryStructure() {
        console.log('📋 Testing category structure...');
        
        try {
            // Test that all expected categories exist
            const expectedCategories = ['basic', 'plants', 'animals', 'civilization', 'special', 'events'];
            const actualCategories = Array.from(this.organizer.categories.keys());
            
            const hasAllCategories = expectedCategories.every(cat => actualCategories.includes(cat));
            this.addResult('Category Structure', hasAllCategories, 
                hasAllCategories ? 'All categories present' : 'Missing categories');
            
            // Test category DOM elements
            const categoryElements = document.querySelectorAll('.element-category');
            this.addResult('Category DOM Elements', categoryElements.length === expectedCategories.length,
                `Found ${categoryElements.length} category elements`);
            
            // Test category headers
            const categoryHeaders = document.querySelectorAll('.category-header');
            this.addResult('Category Headers', categoryHeaders.length === expectedCategories.length,
                `Found ${categoryHeaders.length} category headers`);
                
        } catch (error) {
            this.addResult('Category Structure', false, `Error: ${error.message}`);
        }
    }
    
    testCategoryToggling() {
        console.log('🔄 Testing category toggling...');
        
        try {
            // Test expanding/collapsing a category
            const testCategory = 'plants';
            const initialState = this.organizer.categories.get(testCategory).expanded;
            
            // Toggle category
            this.organizer.setCategoryExpanded(testCategory, !initialState);
            const newState = this.organizer.categories.get(testCategory).expanded;
            
            this.addResult('Category Toggle', newState !== initialState,
                `Category ${testCategory} toggled from ${initialState} to ${newState}`);
            
            // Test DOM update
            const categoryElement = document.querySelector(`[data-category-id="${testCategory}"]`);
            const contentElement = categoryElement?.querySelector('.category-content');
            const isVisible = contentElement?.style.display !== 'none';
            
            this.addResult('Category DOM Update', isVisible === newState,
                `DOM visibility matches state: ${isVisible}`);
            
            // Restore original state
            this.organizer.setCategoryExpanded(testCategory, initialState);
            
        } catch (error) {
            this.addResult('Category Toggling', false, `Error: ${error.message}`);
        }
    }
    
    testCompactMode() {
        console.log('📱 Testing compact mode...');
        
        try {
            const initialCompactMode = this.organizer.isCompactMode;
            
            // Toggle compact mode
            this.organizer.setCompactMode(!initialCompactMode);
            const newCompactMode = this.organizer.isCompactMode;
            
            this.addResult('Compact Mode Toggle', newCompactMode !== initialCompactMode,
                `Compact mode toggled from ${initialCompactMode} to ${newCompactMode}`);
            
            // Test DOM changes
            const bottomPanel = document.getElementById('bottom-panel');
            const hasCompactClass = bottomPanel?.classList.contains('compact-mode');
            
            this.addResult('Compact Mode DOM', hasCompactClass === newCompactMode,
                `DOM compact class matches state: ${hasCompactClass}`);
            
            // Test element size changes
            const elementItems = document.querySelectorAll('.element-item');
            const hasCompactElements = Array.from(elementItems).some(el => el.classList.contains('compact'));
            
            this.addResult('Compact Elements', hasCompactElements === newCompactMode,
                `Element compact classes match state: ${hasCompactElements}`);
            
            // Restore original state
            this.organizer.setCompactMode(initialCompactMode);
            
        } catch (error) {
            this.addResult('Compact Mode', false, `Error: ${error.message}`);
        }
    }
    
    testResponsiveLayout() {
        console.log('📐 Testing responsive layout...');
        
        try {
            // Simulate mobile viewport
            const originalWidth = window.innerWidth;
            Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
            
            // Trigger responsive handling
            this.organizer.handleResponsiveLayout();
            
            // Check if compact mode was enabled
            const isCompactAfterMobile = this.organizer.isCompactMode;
            this.addResult('Mobile Responsive', isCompactAfterMobile,
                `Compact mode enabled on mobile: ${isCompactAfterMobile}`);
            
            // Simulate desktop viewport
            Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
            this.organizer.handleResponsiveLayout();
            
            // Check grid columns
            const grids = document.querySelectorAll('.element-grid');
            const hasCorrectColumns = Array.from(grids).every(grid => 
                grid.style.gridTemplateColumns.includes('4')
            );
            
            this.addResult('Desktop Grid Columns', hasCorrectColumns,
                `Desktop grid has 4 columns: ${hasCorrectColumns}`);
            
            // Restore original width
            Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
            
        } catch (error) {
            this.addResult('Responsive Layout', false, `Error: ${error.message}`);
        }
    }
    
    testSmartLayout() {
        console.log('🧠 Testing smart layout...');
        
        try {
            // Mock some usage data
            const mockUsage = {
                'water': 10,
                'plant': 8,
                'creature': 6,
                'rock': 4,
                'energy_crystal': 2
            };
            
            localStorage.setItem('elementUsageStats', JSON.stringify(mockUsage));
            
            // Apply smart layout
            this.organizer.applySmartLayout();
            
            // Check if frequently used categories are expanded
            const plantsCategory = this.organizer.categories.get('plants');
            const basicCategory = this.organizer.categories.get('basic');
            
            this.addResult('Smart Layout - Basic Category', basicCategory.expanded,
                `Basic category expanded: ${basicCategory.expanded}`);
            
            this.addResult('Smart Layout - Plants Category', plantsCategory.expanded,
                `Plants category expanded: ${plantsCategory.expanded}`);
            
            // Clean up mock data
            localStorage.removeItem('elementUsageStats');
            
        } catch (error) {
            this.addResult('Smart Layout', false, `Error: ${error.message}`);
        }
    }
    
    testKeyboardShortcuts() {
        console.log('⌨️ Testing keyboard shortcuts...');
        
        try {
            const initialCompactMode = this.organizer.isCompactMode;
            
            // Simulate Ctrl+M keypress
            const event = new KeyboardEvent('keydown', {
                key: 'm',
                ctrlKey: true,
                bubbles: true
            });
            
            document.dispatchEvent(event);
            
            // Check if compact mode toggled
            const newCompactMode = this.organizer.isCompactMode;
            this.addResult('Keyboard Shortcut Ctrl+M', newCompactMode !== initialCompactMode,
                `Compact mode toggled via keyboard: ${newCompactMode}`);
            
            // Restore state
            this.organizer.setCompactMode(initialCompactMode);
            
        } catch (error) {
            this.addResult('Keyboard Shortcuts', false, `Error: ${error.message}`);
        }
    }
    
    testStatePersistence() {
        console.log('💾 Testing state persistence...');
        
        try {
            // Change some state
            this.organizer.setCompactMode(true);
            this.organizer.setCategoryExpanded('special', false);
            
            // Save state
            this.organizer.saveState();
            
            // Check if state was saved to localStorage
            const savedState = localStorage.getItem('elementControlsOrganizerState');
            const hasState = savedState !== null;
            
            this.addResult('State Persistence - Save', hasState,
                `State saved to localStorage: ${hasState}`);
            
            if (hasState) {
                const parsedState = JSON.parse(savedState);
                const hasCompactMode = parsedState.isCompactMode === true;
                const hasCollapsedSpecial = parsedState.collapsedCategories.includes('special');
                
                this.addResult('State Persistence - Compact Mode', hasCompactMode,
                    `Compact mode saved: ${hasCompactMode}`);
                
                this.addResult('State Persistence - Collapsed Categories', hasCollapsedSpecial,
                    `Collapsed categories saved: ${hasCollapsedSpecial}`);
            }
            
            // Clean up
            localStorage.removeItem('elementControlsOrganizerState');
            
        } catch (error) {
            this.addResult('State Persistence', false, `Error: ${error.message}`);
        }
    }
    
    addResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }
    
    displayResults() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`- ${result.name}: ${result.details}`);
            });
        }
        
        // Create visual test results in DOM
        this.createTestResultsDisplay();
    }
    
    createTestResultsDisplay() {
        const existingResults = document.getElementById('test-results-display');
        if (existingResults) {
            existingResults.remove();
        }
        
        const resultsDiv = document.createElement('div');
        resultsDiv.id = 'test-results-display';
        resultsDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 0.75rem;
            padding: 1rem;
            color: #e2e8f0;
            font-family: monospace;
            font-size: 0.8rem;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        
        resultsDiv.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0; color: #60a5fa;">🧪 Element Controls Tests</h3>
            <div style="margin-bottom: 0.5rem;">
                <strong>Results:</strong> ${passedTests}/${totalTests} passed 
                (${((passedTests / totalTests) * 100).toFixed(1)}%)
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
                ${this.testResults.map(result => `
                    <div style="margin-bottom: 0.25rem; padding: 0.25rem; border-radius: 0.25rem; 
                                background: ${result.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};">
                        ${result.passed ? '✅' : '❌'} ${result.name}
                        <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.125rem;">
                            ${result.details}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: rgba(59, 130, 246, 0.3); 
                           border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 0.25rem; 
                           color: #e2e8f0; cursor: pointer; font-size: 0.7rem;">
                Close
            </button>
        `;
        
        document.body.appendChild(resultsDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (resultsDiv.parentElement) {
                resultsDiv.remove();
            }
        }, 10000);
    }
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for everything to initialize
    setTimeout(() => {
        const tester = new ElementControlsOrganizationTest();
        tester.runTests();
    }, 1000);
});

// Export for manual testing
window.ElementControlsOrganizationTest = ElementControlsOrganizationTest;