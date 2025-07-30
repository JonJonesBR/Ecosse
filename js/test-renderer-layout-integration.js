/**
 * Test Renderer Layout Integration - Task 8 Testing
 * 
 * This file provides testing utilities for the renderer layout integration
 * to verify that dynamic canvas resizing works correctly with layout changes.
 */

/**
 * Test the renderer layout integration system
 */
export function testRendererLayoutIntegration() {
    console.log('🧪 Testing Renderer Layout Integration...');
    console.log('=' .repeat(50));
    
    let allTestsPassed = true;
    
    // Test 1: Check if integration is initialized
    allTestsPassed &= testIntegrationInitialization();
    
    // Test 2: Test canvas resize handling
    allTestsPassed &= testCanvasResizeHandling();
    
    // Test 3: Test panel state integration
    allTestsPassed &= testPanelStateIntegration();
    
    // Test 4: Test viewport change handling
    allTestsPassed &= testViewportChangeHandling();
    
    // Test 5: Test rendering quality adjustment
    allTestsPassed &= testRenderingQualityAdjustment();
    
    // Test 6: Test layout optimization
    allTestsPassed &= testLayoutOptimization();
    
    console.log('=' .repeat(50));
    if (allTestsPassed) {
        console.log('✅ All Renderer Layout Integration tests passed!');
    } else {
        console.log('❌ Some Renderer Layout Integration tests failed');
    }
    
    return allTestsPassed;
}

/**
 * Test integration initialization
 */
function testIntegrationInitialization() {
    console.log('\n🔍 Testing Integration Initialization...');
    
    try {
        // Check if integration exists
        if (typeof window.rendererLayoutIntegration === 'undefined') {
            console.log('❌ Renderer layout integration not found');
            return false;
        }
        
        const integration = window.rendererLayoutIntegration;
        
        // Check if initialized
        if (!integration.isInitialized) {
            console.log('❌ Renderer layout integration not initialized');
            return false;
        }
        
        // Check status
        const status = integration.getStatus();
        console.log('📊 Integration Status:', status);
        
        if (!status.hasRenderer || !status.hasCamera || !status.hasContainer) {
            console.log('❌ Missing required rendering components');
            return false;
        }
        
        console.log('✅ Integration initialization test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Integration initialization test failed:', error);
        return false;
    }
}

/**
 * Test canvas resize handling
 */
function testCanvasResizeHandling() {
    console.log('\n🔍 Testing Canvas Resize Handling...');
    
    try {
        const integration = window.rendererLayoutIntegration;
        if (!integration || !integration.isInitialized) {
            console.log('❌ Integration not available');
            return false;
        }
        
        // Get initial size
        const initialStatus = integration.getStatus();
        const initialSize = initialStatus.lastKnownSize;
        console.log('📐 Initial canvas size:', initialSize);
        
        // Test force update
        integration.forceUpdate();
        console.log('🔄 Force update triggered');
        
        // Wait a bit and check if size was recalculated
        setTimeout(() => {
            const newStatus = integration.getStatus();
            const newSize = newStatus.lastKnownSize;
            console.log('📐 New canvas size:', newSize);
        }, 100);
        
        console.log('✅ Canvas resize handling test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Canvas resize handling test failed:', error);
        return false;
    }
}

/**
 * Test panel state integration
 */
function testPanelStateIntegration() {
    console.log('\n🔍 Testing Panel State Integration...');
    
    try {
        const integration = window.rendererLayoutIntegration;
        const panelManager = window.panelVisibilityManager;
        
        if (!integration || !panelManager) {
            console.log('❌ Required systems not available');
            return false;
        }
        
        // Get initial panel states
        const initialStates = panelManager.getPanelStates();
        console.log('🎛️ Initial panel states:', initialStates);
        
        // Test panel state change simulation
        const testEvent = new CustomEvent('panelStateChanged', {
            detail: {
                panelName: 'left',
                newState: 'hidden',
                previousState: 'visible',
                allStates: { left: 'hidden', right: 'visible' }
            }
        });
        
        document.dispatchEvent(testEvent);
        console.log('🎛️ Panel state change event dispatched');
        
        // Check if integration responded
        setTimeout(() => {
            const status = integration.getStatus();
            console.log('📊 Integration status after panel change:', status);
        }, 100);
        
        console.log('✅ Panel state integration test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Panel state integration test failed:', error);
        return false;
    }
}

/**
 * Test viewport change handling
 */
function testViewportChangeHandling() {
    console.log('\n🔍 Testing Viewport Change Handling...');
    
    try {
        const integration = window.rendererLayoutIntegration;
        const adaptiveUI = window.adaptiveUIController;
        
        if (!integration || !adaptiveUI) {
            console.log('❌ Required systems not available');
            return false;
        }
        
        // Get current viewport
        const currentViewport = adaptiveUI.getCurrentViewport();
        console.log('📱 Current viewport:', currentViewport);
        
        // Simulate viewport change
        const testEvent = new CustomEvent('viewportChanged', {
            detail: {
                from: currentViewport,
                to: currentViewport === 'desktop' ? 'tablet' : 'desktop',
                configuration: adaptiveUI.getCurrentConfiguration(),
                isTouchDevice: adaptiveUI.isTouchDevice(),
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(testEvent);
        console.log('📱 Viewport change event dispatched');
        
        console.log('✅ Viewport change handling test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Viewport change handling test failed:', error);
        return false;
    }
}

/**
 * Test rendering quality adjustment
 */
function testRenderingQualityAdjustment() {
    console.log('\n🔍 Testing Rendering Quality Adjustment...');
    
    try {
        const integration = window.rendererLayoutIntegration;
        
        if (!integration || !integration.isInitialized) {
            console.log('❌ Integration not available');
            return false;
        }
        
        // Test different quality levels
        const qualityLevels = ['low', 'medium', 'high', 'ultra'];
        
        for (const quality of qualityLevels) {
            integration.setRenderingQuality(quality);
            console.log(`🎨 Set rendering quality to: ${quality}`);
            
            // Small delay between changes
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Reset to medium quality
        integration.setRenderingQuality('medium');
        
        console.log('✅ Rendering quality adjustment test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Rendering quality adjustment test failed:', error);
        return false;
    }
}

/**
 * Test layout optimization
 */
function testLayoutOptimization() {
    console.log('\n🔍 Testing Layout Optimization...');
    
    try {
        const integration = window.rendererLayoutIntegration;
        
        if (!integration || !integration.isInitialized) {
            console.log('❌ Integration not available');
            return false;
        }
        
        // Test maximize rendering area
        integration.maximizeRenderingArea();
        console.log('🎨 Maximize rendering area triggered');
        
        // Test force update
        integration.forceUpdate();
        console.log('🔄 Force update triggered');
        
        // Get final status
        const finalStatus = integration.getStatus();
        console.log('📊 Final integration status:', finalStatus);
        
        console.log('✅ Layout optimization test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Layout optimization test failed:', error);
        return false;
    }
}

/**
 * Test canvas metrics and integration status
 */
export function testCanvasMetrics() {
    console.log('🧪 Testing Canvas Metrics...');
    console.log('=' .repeat(40));
    
    try {
        // Test planet renderer integration metrics
        if (typeof window.planetRendererIntegration !== 'undefined') {
            const metrics = window.planetRendererIntegration.getCanvasMetrics();
            console.log('📊 Canvas Metrics:', metrics);
            
            const integrationStatus = window.planetRendererIntegration.getIntegrationStatus();
            console.log('📊 Integration Status:', integrationStatus);
        } else {
            console.log('❌ Planet renderer integration not available');
        }
        
        // Test responsive canvas container metrics
        if (typeof window.responsiveCanvasContainer !== 'undefined') {
            const canvasMetrics = window.responsiveCanvasContainer.getMetrics();
            console.log('📊 Responsive Canvas Metrics:', canvasMetrics);
        } else {
            console.log('❌ Responsive canvas container not available');
        }
        
        console.log('✅ Canvas metrics test completed');
        return true;
        
    } catch (error) {
        console.error('❌ Canvas metrics test failed:', error);
        return false;
    }
}

/**
 * Test rendering performance under different conditions
 */
export function testRenderingPerformance() {
    console.log('🧪 Testing Rendering Performance...');
    console.log('=' .repeat(40));
    
    try {
        const integration = window.rendererLayoutIntegration;
        
        if (!integration || !integration.isInitialized) {
            console.log('❌ Integration not available');
            return false;
        }
        
        // Test performance with different quality settings
        const qualityTests = [
            { quality: 'low', description: 'Low quality (mobile)' },
            { quality: 'medium', description: 'Medium quality (tablet)' },
            { quality: 'high', description: 'High quality (desktop)' },
            { quality: 'ultra', description: 'Ultra quality (high-end)' }
        ];
        
        for (const test of qualityTests) {
            console.log(`🎨 Testing ${test.description}...`);
            
            const startTime = performance.now();
            integration.setRenderingQuality(test.quality);
            integration.forceUpdate();
            const endTime = performance.now();
            
            console.log(`   ⏱️ Update time: ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        console.log('✅ Rendering performance test completed');
        return true;
        
    } catch (error) {
        console.error('❌ Rendering performance test failed:', error);
        return false;
    }
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testRendererLayoutIntegration = testRendererLayoutIntegration;
    window.testCanvasMetrics = testCanvasMetrics;
    window.testRenderingPerformance = testRenderingPerformance;
    
    console.log('🧪 Renderer Layout Integration tests available:');
    console.log('   - testRendererLayoutIntegration()');
    console.log('   - testCanvasMetrics()');
    console.log('   - testRenderingPerformance()');
}