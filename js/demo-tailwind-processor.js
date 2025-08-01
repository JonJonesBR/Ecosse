/**
 * Demonstration of TailwindProcessor Usage
 * Shows how to use the processor to replace CDN dependencies
 */

const TailwindProcessor = require('./tailwindProcessor');

async function demonstrateTailwindProcessor() {
    console.log('🎯 TailwindProcessor Demonstration\n');
    
    try {
        // Create processor instance
        const processor = new TailwindProcessor();
        
        console.log('📋 Current Configuration:');
        console.log('  Input Path:', processor.options.inputPath);
        console.log('  Output Path:', processor.options.outputPath);
        console.log('  Config Path:', processor.options.configPath);
        console.log('  Minify:', processor.options.minify);
        console.log('  Purge:', processor.options.purge);
        
        console.log('\n🔍 Analyzing current state...');
        const stats = await processor.getBuildStats();
        console.log('  Input file exists:', stats.inputExists);
        console.log('  Output file exists:', stats.outputExists);
        console.log('  Config file exists:', stats.configExists);
        
        if (stats.outputExists) {
            console.log('  Output file size:', stats.outputSize, 'bytes');
        }
        
        console.log('\n🏗️  Building optimized CSS...');
        const buildSuccess = await processor.optimizeForProduction();
        
        if (buildSuccess) {
            console.log('✅ CSS optimization completed successfully!');
            
            const newStats = await processor.getBuildStats();
            console.log('  Final output size:', newStats.outputSize, 'bytes');
            
            // Show how to replace CDN references (demo only - not actually modifying index.html)
            console.log('\n🔄 CDN Replacement Demo:');
            console.log('  To replace CDN references in your HTML:');
            console.log('  processor.replaceCDNReferences("index.html")');
            console.log('  This will replace:');
            console.log('    <script src="https://cdn.tailwindcss.com"></script>');
            console.log('  With:');
            console.log('    <link rel="stylesheet" href="css/tailwind.min.css">');
            
        } else {
            console.log('❌ CSS optimization failed');
        }
        
        console.log('\n📊 Available Methods:');
        console.log('  • installTailwind() - Install Tailwind CSS locally');
        console.log('  • generateConfig() - Generate tailwind.config.js');
        console.log('  • buildCSS() - Build CSS from source');
        console.log('  • optimizeForProduction() - Build optimized CSS');
        console.log('  • replaceCDNReferences(htmlPath) - Replace CDN with local files');
        console.log('  • processComplete(htmlPath) - Run complete pipeline');
        console.log('  • getBuildStats() - Get build statistics');
        
        console.log('\n🎉 Demonstration completed!');
        
    } catch (error) {
        console.error('❌ Demonstration failed:', error.message);
    }
}

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateTailwindProcessor();
}

module.exports = demonstrateTailwindProcessor;