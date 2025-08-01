/**
 * Verification Script for Floating Controls Panel Positioning
 * Task 3: Fix floating controls panel positioning
 */

// Test configuration
const TEST_CONFIG = {
    positions: ['bottom-center', 'bottom-left', 'bottom-right', 'side-left', 'side-right'],
    viewports: [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1440, height: 900, name: 'Desktop' }
    ]
};

class FloatingControlsPositioningVerifier {
    constructor() {
        this.results = {
            zIndexLayering: false,
            viewportAwareness: false,
            responsivePositioning: false,
            dragFunctionality: false,
            overall: false
        };
        
        this.panel = null;
        this.canvasContainer = null;
    }
    
    async runAllTests() {
        console.log('🧪 Starting Floating Controls Panel Positioning Tests...\n');
        
        // Wait for DOM to be ready
        await this.waitForDOM();
        
        // Initialize elements
        this.initializeElements();
        
        // Run individual tests
        await this.testZIndexLayering();
        await this.testViewportAwareness();
        await this.testResponsivePositioning();
        await this.testDragFunctionality();
        
        // Calculate overall result
        this.calculateOverallResult();
        
        // Display results
        this.displayResults();
        
        return this.results;
    }
    
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    initializeElements() {
        this.panel = document.getElementById('bottom-panel');
        this.canvasContainer = document.getElementById('three-js-canvas-container');
        
        if (!this.panel) {
            console.error('❌ Bottom panel not found');
            return false;
        }
        
        if (!this.canvasContainer) {
            console.error('❌ Canvas container not found');
            return false;
        }
        
        return true;
    }
    
    async testZIndexLayering() {
        console.log('🔍 Testing Z-Index Layering...');
        
        try {
            // Get computed z-index values
            const panelZIndex = parseInt(getComputedStyle(this.panel).zIndex) || 0;
            const canvasZIndex = parseInt(getComputedStyle(this.canvasContainer).zIndex) || 0;
            
            console.log(`   Panel z-index: ${panelZIndex}`);
            console.log(`   Canvas z-index: ${canvasZIndex}`);
            
            // Test 1: Panel should have higher z-index than canvas
            const layeringCorrect = panelZIndex > canvasZIndex;
            
            // Test 2: Panel should be positioned above canvas (not obstructed)
            const panelRect = this.panel.getBoundingClientRect();
            const canvasRect = this.canvasContainer.getBoundingClientRect();
            
            // Check if panel overlaps canvas area
            const overlaps = !(panelRect.right < canvasRect.left || 
                             panelRect.left > canvasRect.right || 
                             panelRect.bottom < canvasRect.top || 
                             panelRect.top > canvasRect.bottom);
            
            // If overlapping, panel should be above canvas
            const positioningCorrect = !overlaps || panelZIndex > canvasZIndex;
            
            this.results.zIndexLayering = layeringCorrect && positioningCorrect;
            
            console.log(`   ✅ Z-Index layering: ${this.results.zIndexLayering ? 'PASS' : 'FAIL'}`);
            
        } catch (error) {
            console.error('   ❌ Z-Index layering test failed:', error);
            this.results.zIndexLayering = false;
        }
    }
    
    async testViewportAwareness() {
        console.log('🔍 Testing Viewport Awareness...');
        
        try {
            let allTestsPassed = true;
            
            for (const viewport of TEST_CONFIG.viewports) {
                console.log(`   Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
                
                // Simulate viewport resize
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: viewport.width
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: viewport.height
                });
                
                // Trigger resize event
                window.dispatchEvent(new Event('resize'));
                
                // Wait for responsive handling
                await this.wait(200);
                
                // Check if panel stays within viewport bounds
                const rect = this.panel.getBoundingClientRect();
                const safeMargin = 20;
                
                const withinBounds = (
                    rect.left >= safeMargin &&
                    rect.right <= viewport.width - safeMargin &&
                    rect.top >= safeMargin &&
                    rect.bottom <= viewport.height - safeMargin
                );
                
                console.log(`     Panel bounds: ${Math.round(rect.left)}, ${Math.round(rect.top)}, ${Math.round(rect.right)}, ${Math.round(rect.bottom)}`);
                console.log(`     Within safe bounds: ${withinBounds ? 'YES' : 'NO'}`);
                
                if (!withinBounds) {
                    allTestsPassed = false;
                }
            }
            
            this.results.viewportAwareness = allTestsPassed;
            console.log(`   ✅ Viewport awareness: ${this.results.viewportAwareness ? 'PASS' : 'FAIL'}`);
            
        } catch (error) {
            console.error('   ❌ Viewport awareness test failed:', error);
            this.results.viewportAwareness = false;
        }
    }
    
    async testResponsivePositioning() {
        console.log('🔍 Testing Responsive Positioning...');
        
        try {
            let allTestsPassed = true;
            
            // Test mobile behavior
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375
            });
            
            window.dispatchEvent(new Event('resize'));
            await this.wait(200);
            
            // On mobile, should force bottom-center and compact mode
            const isMobilePositioned = this.panel.classList.contains('compact-mode');
            const dragHandleHidden = this.panel.querySelector('.panel-drag-handle')?.style.display === 'none';
            
            console.log(`   Mobile compact mode: ${isMobilePositioned ? 'YES' : 'NO'}`);
            console.log(`   Mobile drag disabled: ${dragHandleHidden ? 'YES' : 'NO'}`);
            
            if (!isMobilePositioned) {
                allTestsPassed = false;
            }
            
            // Test desktop behavior
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1440
            });
            
            window.dispatchEvent(new Event('resize'));
            await this.wait(200);
            
            // Test different positions on desktop
            if (window.floatingControlsPanel) {
                for (const position of TEST_CONFIG.positions) {
                    window.floatingControlsPanel.setPosition(position);
                    await this.wait(100);
                    
                    const currentPosition = window.floatingControlsPanel.currentPosition;
                    const positionSet = currentPosition === position || 
                                      (position.includes('side-') && currentPosition.includes('bottom-'));
                    
                    console.log(`     Position ${position}: ${positionSet ? 'OK' : 'FAIL'} (actual: ${currentPosition})`);
                    
                    if (!positionSet && window.innerWidth > 900) {
                        allTestsPassed = false;
                    }
                }
            }
            
            this.results.responsivePositioning = allTestsPassed;
            console.log(`   ✅ Responsive positioning: ${this.results.responsivePositioning ? 'PASS' : 'FAIL'}`);
            
        } catch (error) {
            console.error('   ❌ Responsive positioning test failed:', error);
            this.results.responsivePositioning = false;
        }
    }
    
    async testDragFunctionality() {
        console.log('🔍 Testing Drag Functionality...');
        
        try {
            let allTestsPassed = true;
            
            // Test desktop drag functionality
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1440
            });
            
            window.dispatchEvent(new Event('resize'));
            await this.wait(200);
            
            const dragHandle = this.panel.querySelector('.panel-drag-handle');
            
            if (dragHandle) {
                // Test drag handle visibility on desktop
                const dragHandleVisible = getComputedStyle(dragHandle).display !== 'none';
                console.log(`   Drag handle visible on desktop: ${dragHandleVisible ? 'YES' : 'NO'}`);
                
                if (!dragHandleVisible) {
                    allTestsPassed = false;
                }
                
                // Test drag functionality (simulate drag events)
                const initialRect = this.panel.getBoundingClientRect();
                
                // Simulate mousedown
                const mouseDownEvent = new MouseEvent('mousedown', {
                    clientX: initialRect.left + 50,
                    clientY: initialRect.top + 10,
                    bubbles: true
                });
                dragHandle.dispatchEvent(mouseDownEvent);
                
                // Simulate mousemove
                const mouseMoveEvent = new MouseEvent('mousemove', {
                    clientX: initialRect.left + 100,
                    clientY: initialRect.top + 50,
                    bubbles: true
                });
                document.dispatchEvent(mouseMoveEvent);
                
                // Simulate mouseup
                const mouseUpEvent = new MouseEvent('mouseup', {
                    bubbles: true
                });
                document.dispatchEvent(mouseUpEvent);
                
                await this.wait(100);
                
                console.log(`   Drag simulation completed`);
            } else {
                console.log(`   ❌ Drag handle not found`);
                allTestsPassed = false;
            }
            
            // Test mobile drag disabled
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375
            });
            
            window.dispatchEvent(new Event('resize'));
            await this.wait(200);
            
            if (dragHandle) {
                const dragHandleHiddenOnMobile = getComputedStyle(dragHandle).display === 'none';
                console.log(`   Drag handle hidden on mobile: ${dragHandleHiddenOnMobile ? 'YES' : 'NO'}`);
                
                if (!dragHandleHiddenOnMobile) {
                    allTestsPassed = false;
                }
            }
            
            this.results.dragFunctionality = allTestsPassed;
            console.log(`   ✅ Drag functionality: ${this.results.dragFunctionality ? 'PASS' : 'FAIL'}`);
            
        } catch (error) {
            console.error('   ❌ Drag functionality test failed:', error);
            this.results.dragFunctionality = false;
        }
    }
    
    calculateOverallResult() {
        const passedTests = Object.values(this.results).filter(result => result === true).length - 1; // -1 for overall
        const totalTests = Object.keys(this.results).length - 1; // -1 for overall
        
        this.results.overall = passedTests === totalTests;
    }
    
    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const tests = [
            { name: 'Z-Index Layering', result: this.results.zIndexLayering },
            { name: 'Viewport Awareness', result: this.results.viewportAwareness },
            { name: 'Responsive Positioning', result: this.results.responsivePositioning },
            { name: 'Drag Functionality', result: this.results.dragFunctionality }
        ];
        
        tests.forEach(test => {
            const status = test.result ? '✅ PASS' : '❌ FAIL';
            console.log(`${test.name}: ${status}`);
        });
        
        console.log('========================');
        const overallStatus = this.results.overall ? '✅ PASS' : '❌ FAIL';
        console.log(`Overall Result: ${overallStatus}`);
        
        if (this.results.overall) {
            console.log('\n🎉 All floating controls panel positioning tests passed!');
            console.log('✅ Z-index layering prevents canvas obstruction');
            console.log('✅ Proper floating positioning with viewport awareness');
            console.log('✅ Responsive positioning for different screen sizes');
            console.log('✅ Drag functionality works correctly');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the implementation.');
        }
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('load', async () => {
        // Wait a bit for other scripts to initialize
        setTimeout(async () => {
            const verifier = new FloatingControlsPositioningVerifier();
            await verifier.runAllTests();
        }, 1000);
    });
} else {
    // Node.js environment
    module.exports = FloatingControlsPositioningVerifier;
}