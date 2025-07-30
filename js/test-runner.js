/**
 * Test Runner for Comprehensive Layout System Tests - Task 14
 * 
 * Centralized test runner that executes all test suites and provides
 * comprehensive reporting for the layout system testing.
 * 
 * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3
 */

// Import all test modules
import { runComprehensiveLayoutTests, runLayoutSmokeTest } from './test-layout-system-comprehensive.js';
import { runLayoutManagerUnitTests } from './test-layout-manager-unit.js';
import { runResponsiveCanvasUnitTests } from './test-responsive-canvas-unit.js';
import { runPanelIntegrationTests } from './test-integration-panels.js';
import { runCanvasIntegrationTests } from './test-integration-canvas.js';
import { runVisualRegressionTests, generateVisualRegressionReport } from './test-visual-regression.js';

/**
 * Main test runner - executes all test suites
 */
export function runAllLayoutTests() {
    console.log('🚀 Starting Comprehensive Layout System Test Suite');
    console.log('='.repeat(60));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    const startTime = performance.now();
    const testResults = [];
    
    // Test execution order (from unit tests to integration tests)
    const testSuites = [
        {
            name: 'Smoke Test',
            description: 'Quick validation of core functionality',
            runner: runLayoutSmokeTest,
            critical: true
        },
        {
            name: 'LayoutManager Unit Tests',
            description: 'Unit tests for LayoutManager class',
            runner: runLayoutManagerUnitTests,
            critical: true
        },
        {
            name: 'ResponsiveCanvasContainer Unit Tests',
            description: 'Unit tests for ResponsiveCanvasContainer class',
            runner: runResponsiveCanvasUnitTests,
            critical: true
        },
        {
            name: 'Panel Integration Tests',
            description: 'Integration tests for panel interactions',
            runner: runPanelIntegrationTests,
            critical: false
        },
        {
            name: 'Canvas Integration Tests',
            description: 'Integration tests for canvas resizing',
            runner: runCanvasIntegrationTests,
            critical: false
        },
        {
            name: 'Visual Regression Tests',
            description: 'Visual consistency tests across viewports',
            runner: runVisualRegressionTests,
            critical: false
        },
        {
            name: 'Comprehensive Layout Tests',
            description: 'Full comprehensive test suite',
            runner: runComprehensiveLayoutTests,
            critical: false
        }
    ];
    
    let criticalFailures = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    
    // Execute each test suite
    for (const suite of testSuites) {
        console.log(`\n🔍 Running ${suite.name}`);
        console.log(`📝 ${suite.description}`);
        console.log('-'.repeat(50));
        
        try {
            const suiteStartTime = performance.now();
            const result = suite.runner();
            const suiteEndTime = performance.now();
            const suiteDuration = suiteEndTime - suiteStartTime;
            
            // Handle different result formats
            let suiteResult;
            if (typeof result === 'boolean') {
                // Smoke test returns boolean
                suiteResult = {
                    passed: result ? 1 : 0,
                    failed: result ? 0 : 1,
                    total: 1,
                    success: result,
                    duration: suiteDuration
                };
            } else if (result && typeof result === 'object') {
                // Other tests return objects
                suiteResult = {
                    ...result,
                    duration: suiteDuration
                };
            } else {
                // Fallback for unexpected result format
                suiteResult = {
                    passed: 0,
                    failed: 1,
                    total: 1,
                    success: false,
                    duration: suiteDuration,
                    error: 'Unexpected result format'
                };
            }
            
            testResults.push({
                name: suite.name,
                description: suite.description,
                critical: suite.critical,
                ...suiteResult
            });
            
            // Update totals
            totalPassed += suiteResult.passed || 0;
            totalFailed += suiteResult.failed || 0;
            totalTests += suiteResult.total || 0;
            
            // Track critical failures
            if (suite.critical && !suiteResult.success) {
                criticalFailures++;
            }
            
            // Print suite summary
            const status = suiteResult.success ? '✅ PASSED' : '❌ FAILED';
            const passRate = suiteResult.total > 0 ? 
                ((suiteResult.passed / suiteResult.total) * 100).toFixed(1) : '0.0';
            
            console.log(`${status} - ${suiteResult.passed}/${suiteResult.total} tests passed (${passRate}%) in ${suiteDuration.toFixed(2)}ms`);
            
            // Stop execution if critical test fails
            if (suite.critical && !suiteResult.success) {
                console.log(`\n⚠️ Critical test suite failed: ${suite.name}`);
                console.log('Stopping execution due to critical failure.');
                break;
            }
            
        } catch (error) {
            console.error(`💥 Test suite ${suite.name} crashed:`, error);
            
            const crashedResult = {
                name: suite.name,
                description: suite.description,
                critical: suite.critical,
                passed: 0,
                failed: 1,
                total: 1,
                success: false,
                error: error.message,
                duration: 0
            };
            
            testResults.push(crashedResult);
            totalFailed += 1;
            totalTests += 1;
            
            if (suite.critical) {
                criticalFailures++;
                console.log(`\n⚠️ Critical test suite crashed: ${suite.name}`);
                console.log('Stopping execution due to critical failure.');
                break;
            }
        }
    }
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    // Generate comprehensive report
    const report = generateTestReport(testResults, {
        totalPassed,
        totalFailed,
        totalTests,
        criticalFailures,
        totalDuration,
        startTime: new Date(Date.now() - totalDuration)
    });
    
    // Print final summary
    printFinalSummary(report);
    
    return report;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(testResults, summary) {
    const report = {
        summary: {
            ...summary,
            passRate: summary.totalTests > 0 ? 
                (summary.totalPassed / summary.totalTests * 100).toFixed(2) : '0.00',
            overallSuccess: summary.criticalFailures === 0 && summary.totalFailed === 0
        },
        testResults,
        systemInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            },
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : null
            }
        },
        recommendations: generateRecommendations(testResults, summary)
    };
    
    return report;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(testResults, summary) {
    const recommendations = [];
    
    // Critical failures
    if (summary.criticalFailures > 0) {
        recommendations.push({
            priority: 'HIGH',
            category: 'Critical',
            message: `${summary.criticalFailures} critical test suite(s) failed. These must be fixed before deployment.`,
            action: 'Review and fix critical test failures immediately.'
        });
    }
    
    // High failure rate
    const failureRate = summary.totalTests > 0 ? (summary.totalFailed / summary.totalTests) : 0;
    if (failureRate > 0.2) {
        recommendations.push({
            priority: 'HIGH',
            category: 'Quality',
            message: `High failure rate: ${(failureRate * 100).toFixed(1)}% of tests failed.`,
            action: 'Review implementation and test coverage.'
        });
    }
    
    // Performance issues
    const slowSuites = testResults.filter(result => result.duration > 5000);
    if (slowSuites.length > 0) {
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Performance',
            message: `${slowSuites.length} test suite(s) took longer than 5 seconds to execute.`,
            action: 'Optimize slow test suites: ' + slowSuites.map(s => s.name).join(', ')
        });
    }
    
    // Memory usage
    if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Memory',
            message: `High memory usage detected: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`,
            action: 'Review memory usage and potential leaks in layout system.'
        });
    }
    
    // Success message
    if (summary.criticalFailures === 0 && failureRate < 0.1) {
        recommendations.push({
            priority: 'INFO',
            category: 'Success',
            message: 'Layout system tests are passing with good coverage.',
            action: 'Continue monitoring test results in CI/CD pipeline.'
        });
    }
    
    return recommendations;
}

/**
 * Print final summary
 */
function printFinalSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    const { summary } = report;
    
    // Overall status
    const overallStatus = summary.overallSuccess ? '✅ PASSED' : '❌ FAILED';
    console.log(`Overall Status: ${overallStatus}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.totalPassed}`);
    console.log(`Failed: ${summary.totalFailed}`);
    console.log(`Pass Rate: ${summary.passRate}%`);
    console.log(`Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    
    if (summary.criticalFailures > 0) {
        console.log(`Critical Failures: ${summary.criticalFailures} ⚠️`);
    }
    
    // Test suite breakdown
    console.log('\n📋 Test Suite Breakdown:');
    report.testResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const critical = result.critical ? ' (CRITICAL)' : '';
        const duration = result.duration ? ` - ${result.duration.toFixed(0)}ms` : '';
        console.log(`  ${status} ${result.name}${critical}: ${result.passed}/${result.total}${duration}`);
    });
    
    // Recommendations
    if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
            const priority = rec.priority === 'HIGH' ? '🔴' : 
                           rec.priority === 'MEDIUM' ? '🟡' : '🔵';
            console.log(`  ${priority} [${rec.category}] ${rec.message}`);
            console.log(`     Action: ${rec.action}`);
        });
    }
    
    // System info
    console.log('\n🖥️ System Information:');
    console.log(`  Browser: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
    console.log(`  Viewport: ${report.systemInfo.viewport.width}x${report.systemInfo.viewport.height}`);
    console.log(`  Screen: ${report.systemInfo.screen.width}x${report.systemInfo.screen.height} (${report.systemInfo.screen.pixelRatio}x)`);
    
    if (report.systemInfo.performance.memory) {
        const mem = report.systemInfo.performance.memory;
        console.log(`  Memory: ${mem.used}MB used / ${mem.total}MB total`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (summary.overallSuccess) {
        console.log('🎉 All layout system tests completed successfully!');
    } else {
        console.log('⚠️ Some tests failed. Please review the results above.');
    }
    
    console.log('='.repeat(60));
}

/**
 * Run specific test suite by name
 */
export function runSpecificTest(testName) {
    const testMap = {
        'smoke': runLayoutSmokeTest,
        'layout-manager': runLayoutManagerUnitTests,
        'responsive-canvas': runResponsiveCanvasUnitTests,
        'panel-integration': runPanelIntegrationTests,
        'canvas-integration': runCanvasIntegrationTests,
        'visual-regression': runVisualRegressionTests,
        'comprehensive': runComprehensiveLayoutTests
    };
    
    const testRunner = testMap[testName.toLowerCase()];
    
    if (!testRunner) {
        console.error(`❌ Unknown test: ${testName}`);
        console.log('Available tests:', Object.keys(testMap).join(', '));
        return null;
    }
    
    console.log(`🔍 Running specific test: ${testName}`);
    console.log('-'.repeat(40));
    
    const startTime = performance.now();
    const result = testRunner();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`\n⏱️ Test completed in ${duration.toFixed(2)}ms`);
    
    return result;
}

/**
 * Run tests with specific configuration
 */
export function runTestsWithConfig(config = {}) {
    const defaultConfig = {
        skipSmokeTest: false,
        skipUnitTests: false,
        skipIntegrationTests: false,
        skipVisualTests: false,
        stopOnCriticalFailure: true,
        generateReport: true,
        verbose: true
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    console.log('🔧 Running tests with custom configuration:');
    console.log(JSON.stringify(finalConfig, null, 2));
    
    // This would implement custom test execution based on config
    // For now, just run all tests
    return runAllLayoutTests();
}

/**
 * Export test report to JSON
 */
export function exportTestReport(report, filename = 'layout-test-report.json') {
    try {
        const jsonReport = JSON.stringify(report, null, 2);
        
        // Create downloadable blob
        const blob = new Blob([jsonReport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        console.log(`📄 Test report exported as ${filename}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to export test report:', error);
        return false;
    }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.runAllLayoutTests = runAllLayoutTests;
    window.runSpecificTest = runSpecificTest;
    window.runTestsWithConfig = runTestsWithConfig;
    window.exportTestReport = exportTestReport;
    
    console.log('🧪 Layout Test Runner available globally:');
    console.log('  - runAllLayoutTests() - Run complete test suite');
    console.log('  - runSpecificTest(name) - Run specific test suite');
    console.log('  - runTestsWithConfig(config) - Run with custom config');
    console.log('  - exportTestReport(report) - Export results to JSON');
    console.log('\nAvailable specific tests:');
    console.log('  smoke, layout-manager, responsive-canvas, panel-integration,');
    console.log('  canvas-integration, visual-regression, comprehensive');
}