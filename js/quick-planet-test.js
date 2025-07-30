/**
 * Quick test for planet renderer fixes
 * Run this in the browser console to test the fixes
 */

export function quickPlanetTest() {
    console.log('🧪 Starting quick planet renderer test...');
    
    // Test 1: Check if integration system is available
    if (window.planetRendererIntegration) {
        console.log('✅ Integration system available');
        console.log('Current status:', window.planetRendererIntegration.getSystemStatus());
    } else {
        console.log('❌ Integration system not available');
        return false;
    }
    
    // Test 2: Check container
    const container = document.getElementById('three-js-canvas-container');
    if (container) {
        console.log('✅ Container found');
        console.log(`Container dimensions: ${container.clientWidth}x${container.clientHeight}`);
        
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            console.log('⚠️ Container has zero dimensions, this might cause issues');
        }
    } else {
        console.log('❌ Container not found');
        return false;
    }
    
    // Test 3: Check if planet is visible
    const canvas = container.querySelector('canvas');
    if (canvas) {
        console.log('✅ Canvas found');
        console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
    } else {
        console.log('❌ Canvas not found');
    }
    
    // Test 4: Force enable fixes and test
    console.log('🔧 Testing with fixes enabled...');
    window.planetRendererIntegration.enableFixes();
    
    // Test 5: Check WebGL support
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (gl) {
        console.log('✅ WebGL is supported');
    } else {
        console.log('❌ WebGL is not supported - this will cause rendering issues');
    }
    
    console.log('🧪 Quick test completed');
    return true;
}

/**
 * Force reload the planet renderer with fixes
 */
export function forceReloadPlanet() {
    console.log('🔄 Force reloading planet renderer...');
    
    const container = document.getElementById('three-js-canvas-container');
    if (!container) {
        console.log('❌ Container not found');
        return;
    }
    
    // Enable fixes
    if (window.planetRendererIntegration) {
        window.planetRendererIntegration.enableFixes();
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get current config (assuming it's available globally)
    const config = {
        planetType: 'terrestrial',
        ecosystemSize: 'medium',
        atmosphere: 'oxygenated',
        luminosity: 1.0
    };
    
    // Try to reinitialize
    import('./planet-renderer-integration.js').then(integration => {
        integration.enhancedInit3DScene(container, config).then(result => {
            if (result) {
                console.log('✅ Planet renderer reloaded successfully');
            } else {
                console.log('❌ Failed to reload planet renderer');
            }
        });
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.quickPlanetTest = quickPlanetTest;
    window.forceReloadPlanet = forceReloadPlanet;
    
    console.log('🧪 Quick planet tests available:');
    console.log('- quickPlanetTest() - Run diagnostic tests');
    console.log('- forceReloadPlanet() - Force reload with fixes');
}