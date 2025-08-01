/**
 * Integration Test for TailwindProcessor
 * Tests the processor with actual project files
 */

const TailwindProcessor = require('./tailwindProcessor');

async function runIntegrationTest() {
    console.log('🔧 Running TailwindProcessor Integration Test...\n');
    
    try {
        // Create processor instance
        const processor = new TailwindProcessor();
        
        // Test 1: Check current build stats
        console.log('1. Checking current build status...');
        const initialStats = await processor.getBuildStats();
        console.log('Initial stats:', {
            inputExists: initialStats.inputExists,
            outputExists: initialStats.outputExists,
            configExists: initialStats.configExists
        });
        
        // Test 2: Ensure input file exists
        console.log('\n2. Ensuring input file exists...');
        await processor.ensureInputFile();
        
        // Test 3: Build CSS
        console.log('\n3. Building Tailwind CSS...');
        const buildSuccess = await processor.buildCSS();
        console.log('Build success:', buildSuccess);
        
        // Test 4: Check final stats
        console.log('\n4. Checking final build status...');
        const finalStats = await processor.getBuildStats();
        console.log('Final stats:', {
            inputExists: finalStats.inputExists,
            outputExists: finalStats.outputExists,
            configExists: finalStats.configExists,
            inputSize: finalStats.inputSize,
            outputSize: finalStats.outputSize,
            compressionRatio: finalStats.compressionRatio + '%'
        });
        
        // Test 5: Verify CSS content
        console.log('\n5. Verifying generated CSS...');
        const fs = require('fs').promises;
        try {
            const cssContent = await fs.readFile('css/tailwind.min.css', 'utf8');
            const hasBaseStyles = cssContent.includes('*,::before,::after') || cssContent.includes('*,*::before,*::after');
            const hasUtilities = cssContent.includes('.bg-') || cssContent.includes('.text-');
            
            console.log('CSS verification:', {
                fileSize: cssContent.length + ' characters',
                hasBaseStyles,
                hasUtilities,
                isMinified: !cssContent.includes('\n  ') // Check if properly minified
            });
            
        } catch (error) {
            console.error('Could not verify CSS content:', error.message);
        }
        
        console.log('\n✅ Integration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        process.exit(1);
    }
}

// Run integration test if this file is executed directly
if (require.main === module) {
    runIntegrationTest();
}

module.exports = runIntegrationTest;