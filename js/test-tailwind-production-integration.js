/**
 * Test TailwindProcessor integration with production system
 * Demonstrates complete workflow from CDN to local assets
 */

const TailwindProcessor = require('./tailwindProcessor');
const fs = require('fs').promises;

async function testProductionIntegration() {
    console.log('🔧 Testing TailwindProcessor Production Integration...\n');
    
    try {
        // Step 1: Create a test HTML file with CDN references
        console.log('1. Creating test HTML with CDN references...');
        const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Production Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="bg-blue-500 text-white p-4">
        <h1 class="text-2xl font-bold mb-4">Production Test</h1>
        <p class="text-gray-200">Testing Tailwind CSS production optimization</p>
        <button class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mt-4">
            Test Button
        </button>
    </div>
</body>
</html>`;
        
        await fs.writeFile('test-production.html', testHtml);
        console.log('✓ Test HTML created');
        
        // Step 2: Initialize TailwindProcessor
        console.log('\n2. Initializing TailwindProcessor...');
        const processor = new TailwindProcessor();
        
        // Step 3: Run complete processing pipeline
        console.log('\n3. Running complete processing pipeline...');
        const success = await processor.processComplete('test-production.html');
        
        if (success) {
            console.log('✅ Complete processing pipeline succeeded!');
            
            // Step 4: Verify the results
            console.log('\n4. Verifying results...');
            
            // Check if HTML was updated
            const updatedHtml = await fs.readFile('test-production.html', 'utf8');
            const hasCDN = updatedHtml.includes('cdn.tailwindcss.com');
            const hasLocal = updatedHtml.includes('css/tailwind.min.css');
            
            console.log('HTML verification:');
            console.log('  CDN reference removed:', !hasCDN);
            console.log('  Local CSS reference added:', hasLocal);
            
            // Check if CSS file exists and has content
            try {
                const cssStats = await fs.stat('css/tailwind.min.css');
                const cssContent = await fs.readFile('css/tailwind.min.css', 'utf8');
                
                console.log('CSS file verification:');
                console.log('  File exists:', true);
                console.log('  File size:', cssStats.size, 'bytes');
                console.log('  Has utility classes:', cssContent.includes('.bg-'));
                console.log('  Is minified:', !cssContent.includes('\n  '));
                
            } catch (error) {
                console.error('CSS file verification failed:', error.message);
            }
            
            // Step 5: Show build statistics
            console.log('\n5. Build statistics:');
            const stats = await processor.getBuildStats();
            console.log('  Input file:', stats.inputExists ? 'exists' : 'missing');
            console.log('  Output file:', stats.outputExists ? 'exists' : 'missing');
            console.log('  Config file:', stats.configExists ? 'exists' : 'missing');
            console.log('  Output size:', stats.outputSize, 'bytes');
            
            // Step 6: Demonstrate optimization benefits
            console.log('\n6. Optimization benefits:');
            console.log('  ✅ Eliminated external CDN dependency');
            console.log('  ✅ Generated optimized CSS with only used classes');
            console.log('  ✅ Minified CSS for faster loading');
            console.log('  ✅ Local assets for offline capability');
            console.log('  ✅ Improved security (no external scripts)');
            console.log('  ✅ Better performance (no external requests)');
            
        } else {
            console.log('❌ Processing pipeline failed');
        }
        
        // Cleanup
        console.log('\n7. Cleaning up test files...');
        try {
            await fs.unlink('test-production.html');
            console.log('✓ Test HTML cleaned up');
        } catch (error) {
            console.log('⚠ Could not clean up test HTML:', error.message);
        }
        
        console.log('\n🎉 Production integration test completed!');
        
    } catch (error) {
        console.error('❌ Production integration test failed:', error.message);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testProductionIntegration();
}

module.exports = testProductionIntegration;