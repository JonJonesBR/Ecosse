/**
 * Layout Fixes Verification Test - Task 4
 * 
 * This test verifies that the layout system fixes are working correctly:
 * - Main content structure uses proper flex column layout
 * - Floating panel positioning with fixed positioning
 * - App container structure maintains proper flex layout
 * - Canvas area maximization achieves proper height utilization
 */

export function testLayoutFixes() {
    console.log('🧪 Testing Layout System Fixes...');
    
    const tests = [];
    
    // Test 1: App container has proper flex layout structure
    tests.push({
        name: 'App Container Flex Layout Structure',
        test: () => {
            const appContainer = document.getElementById('app-container');
            if (!appContainer) return false;
            
            const styles = window.getComputedStyle(appContainer);
            return styles.display === 'flex' && 
                   styles.flexDirection === 'row' &&
                   styles.position === 'relative';
        }
    });
    
    // Test 2: Main content has proper flex column layout
    tests.push({
        name: 'Main Content Flex Column Layout',
        test: () => {
            const mainContent = document.getElementById('main-content');
            if (!mainContent) return false;
            
            const styles = window.getComputedStyle(mainContent);
            return styles.display === 'flex' && 
                   styles.flexDirection === 'column' &&
                   styles.flex.includes('1');
        }
    });
    
    // Test 3: Canvas container maximizes available space
    tests.push({
        name: 'Canvas Container Space Maximization',
        test: () => {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) return false;
            
            const styles = window.getComputedStyle(canvasContainer);
            return styles.flex.includes('1') &&
                   styles.position === 'relative';
        }
    });
    
    // Test 4: Bottom panel uses fixed positioning (floating)
    tests.push({
        name: 'Bottom Panel Fixed Positioning',
        test: () => {
            const bottomPanel = document.getElementById('bottom-panel');
            if (!bottomPanel) return false;
            
            const styles = window.getComputedStyle(bottomPanel);
            return styles.position === 'fixed' &&
                   parseInt(styles.zIndex) >= 100;
        }
    });
    
    // Test 5: Canvas achieves proper height utilization (>70%)
    tests.push({
        name: 'Canvas Height Utilization (>70%)',
        test: () => {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) return false;
            
            const canvasHeight = canvasContainer.offsetHeight;
            const viewportHeight = window.innerHeight;
            const heightUtilization = (canvasHeight / viewportHeight) * 100;
            
            console.log(`Canvas height utilization: ${heightUtilization.toFixed(1)}%`);
            return heightUtilization >= 70;
        }
    });
    
    // Test 6: Layout optimization classes are applied
    tests.push({
        name: 'Layout Optimization Classes Applied',
        test: () => {
            const appContainer = document.getElementById('app-container');
            if (!appContainer) return false;
            
            return appContainer.classList.contains('layout-optimized') ||
                   appContainer.classList.contains('desktop-layout') ||
                   appContainer.classList.contains('tablet-layout') ||
                   appContainer.classList.contains('mobile-layout');
        }
    });
    
    // Test 7: Panels maintain proper flex shrink behavior
    tests.push({
        name: 'Panels Flex Shrink Behavior',
        test: () => {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            
            if (!leftPanel || !rightPanel) return false;
            
            const leftStyles = window.getComputedStyle(leftPanel);
            const rightStyles = window.getComputedStyle(rightPanel);
            
            return leftStyles.flexShrink === '0' && rightStyles.flexShrink === '0';
        }
    });
    
    // Test 8: Canvas container has minimum height constraints
    tests.push({
        name: 'Canvas Minimum Height Constraints',
        test: () => {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) return false;
            
            const styles = window.getComputedStyle(canvasContainer);
            const minHeight = parseInt(styles.minHeight);
            
            return minHeight >= 300; // Should have at least 300px minimum height
        }
    });
    
    // Run all tests
    let passedTests = 0;
    const results = tests.map(test => {
        try {
            const passed = test.test();
            if (passed) passedTests++;
            
            console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
            
            return {
                name: test.name,
                passed,
                error: null
            };
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED (${error.message})`);
            
            return {
                name: test.name,
                passed: false,
                error: error.message
            };
        }
    });
    
    // Summary
    const totalTests = tests.length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`\n📊 Layout Fixes Test Results: ${passedTests}/${totalTests} tests passed (${passRate}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All layout fixes tests passed!');
    } else {
        console.log('⚠️ Some layout fixes tests failed. Check the implementation.');
    }
    
    return {
        totalTests,
        passedTests,
        passRate: parseFloat(passRate),
        results,
        allPassed: passedTests === totalTests
    };
}

/**
 * Test responsive layout behavior
 */
export function testResponsiveLayoutBehavior() {
    console.log('📱 Testing Responsive Layout Behavior...');
    
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    const viewportTests = [
        { width: 320, height: 568, name: 'Mobile Portrait', expectedType: 'mobile' },
        { width: 768, height: 1024, name: 'Tablet Portrait', expectedType: 'tablet' },
        { width: 1920, height: 1080, name: 'Desktop', expectedType: 'desktop' }
    ];
    
    const results = [];
    
    viewportTests.forEach(viewport => {
        console.log(`\n🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        // Mock viewport size change
        if (window.layoutManager) {
            window.layoutManager.viewportSize = { 
                width: viewport.width, 
                height: viewport.height 
            };
            
            const detectedType = window.layoutManager.getViewportType();
            const typeCorrect = detectedType === viewport.expectedType;
            
            console.log(`  Detected type: ${detectedType} (expected: ${viewport.expectedType})`);
            
            // Test canvas height utilization for this viewport
            const canvasContainer = document.getElementById('three-js-canvas-container');
            let heightUtilization = 0;
            
            if (canvasContainer) {
                const canvasHeight = canvasContainer.offsetHeight;
                heightUtilization = (canvasHeight / viewport.height) * 100;
                console.log(`  Canvas height utilization: ${heightUtilization.toFixed(1)}%`);
            }
            
            results.push({
                viewport: viewport.name,
                typeCorrect,
                heightUtilization,
                passed: typeCorrect && heightUtilization >= 60 // Lower threshold for responsive
            });
        }
    });
    
    // Restore original viewport size
    if (window.layoutManager) {
        window.layoutManager.viewportSize = { 
            width: originalWidth, 
            height: originalHeight 
        };
    }
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`\n📊 Responsive Layout Tests: ${passedTests}/${totalTests} passed (${passRate}%)`);
    
    return {
        totalTests,
        passedTests,
        passRate: parseFloat(passRate),
        results,
        allPassed: passedTests === totalTests
    };
}

/**
 * Run all layout fixes tests
 */
export function runAllLayoutFixesTests() {
    console.log('🚀 Running All Layout Fixes Tests...\n');
    
    const fixesResult = testLayoutFixes();
    const responsiveResult = testResponsiveLayoutBehavior();
    
    const totalTests = fixesResult.totalTests + responsiveResult.totalTests;
    const totalPassed = fixesResult.passedTests + responsiveResult.passedTests;
    const overallPassRate = (totalPassed / totalTests * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 OVERALL LAYOUT FIXES TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Layout Structure Tests: ${fixesResult.passedTests}/${fixesResult.totalTests} passed`);
    console.log(`Responsive Layout Tests: ${responsiveResult.passedTests}/${responsiveResult.totalTests} passed`);
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`);
    
    if (totalPassed === totalTests) {
        console.log('🎉 All layout fixes tests passed!');
    } else {
        console.log(`⚠️ ${totalTests - totalPassed} tests failed. Review implementation.`);
    }
    
    return {
        totalTests,
        totalPassed,
        overallPassRate: parseFloat(overallPassRate),
        fixesResult,
        responsiveResult,
        allPassed: totalPassed === totalTests
    };
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testLayoutFixes = testLayoutFixes;
    window.testResponsiveLayoutBehavior = testResponsiveLayoutBehavior;
    window.runAllLayoutFixesTests = runAllLayoutFixesTests;
    
    console.log('🧪 Layout fixes tests available:');
    console.log('  - testLayoutFixes() - Test layout structure fixes');
    console.log('  - testResponsiveLayoutBehavior() - Test responsive behavior');
    console.log('  - runAllLayoutFixesTests() - Run all layout fixes tests');
}