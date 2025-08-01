/**
 * Unit Tests for TailwindProcessor Class
 */

const fs = require('fs').promises;
const path = require('path');
const TailwindProcessor = require('./tailwindProcessor');

class TailwindProcessorTests {
    constructor() {
        this.testResults = [];
        this.tempFiles = [];
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Running TailwindProcessor Tests...\n');
        
        try {
            await this.testConstructor();
            await this.testOptimizeCSSContent();
            await this.testEnsureInputFile();
            await this.testReplaceCDNReferences();
            await this.testGetBuildStats();
            await this.testGenerateConfig();
            
            this.printResults();
            
        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Test constructor and options
     */
    async testConstructor() {
        console.log('Testing constructor...');
        
        // Test default options
        const processor1 = new TailwindProcessor();
        this.assert(
            processor1.options.inputPath === 'css/tailwind-src.css',
            'Default input path should be css/tailwind-src.css'
        );
        this.assert(
            processor1.options.outputPath === 'css/tailwind.min.css',
            'Default output path should be css/tailwind.min.css'
        );
        this.assert(
            processor1.options.minify === true,
            'Minify should be true by default'
        );
        
        // Test custom options
        const customOptions = {
            inputPath: 'custom/input.css',
            outputPath: 'custom/output.css',
            minify: false
        };
        const processor2 = new TailwindProcessor(customOptions);
        this.assert(
            processor2.options.inputPath === 'custom/input.css',
            'Custom input path should be set correctly'
        );
        this.assert(
            processor2.options.minify === false,
            'Custom minify option should be set correctly'
        );
        
        console.log('✓ Constructor tests passed\n');
    }

    /**
     * Test CSS content optimization
     */
    async testOptimizeCSSContent() {
        console.log('Testing CSS content optimization...');
        
        const processor = new TailwindProcessor();
        
        const testCSS = `
        /* This is a comment */
        .test-class {
            color: red;
            margin: 10px;
        }
        
        .another-class    {
            background-color   :   blue   ;
            padding  :  5px  ;
        }
        `;
        
        const optimized = processor.optimizeCSSContent(testCSS);
        
        this.assert(
            !optimized.includes('/* This is a comment */'),
            'Comments should be removed'
        );
        this.assert(
            !optimized.includes('    '),
            'Extra whitespace should be removed'
        );
        this.assert(
            optimized.includes('.test-class{color:red;margin:10px}'),
            'CSS should be properly minified'
        );
        
        console.log('✓ CSS optimization tests passed\n');
    }

    /**
     * Test input file creation
     */
    async testEnsureInputFile() {
        console.log('Testing input file creation...');
        
        const testInputPath = 'test-tailwind-input.css';
        const processor = new TailwindProcessor({ inputPath: testInputPath });
        this.tempFiles.push(testInputPath);
        
        // Ensure file doesn't exist
        try {
            await fs.unlink(testInputPath);
        } catch {}
        
        await processor.ensureInputFile();
        
        // Check if file was created
        const fileExists = await this.fileExists(testInputPath);
        this.assert(fileExists, 'Input file should be created');
        
        // Check file content
        const content = await fs.readFile(testInputPath, 'utf8');
        this.assert(
            content.includes('@tailwind base'),
            'Input file should contain Tailwind directives'
        );
        
        console.log('✓ Input file creation tests passed\n');
    }

    /**
     * Test CDN reference replacement
     */
    async testReplaceCDNReferences() {
        console.log('Testing CDN reference replacement...');
        
        const testHtmlPath = 'test-index.html';
        const processor = new TailwindProcessor();
        this.tempFiles.push(testHtmlPath);
        
        const htmlWithCDN = `<!DOCTYPE html>
<html>
<head>
    <title>Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="bg-blue-500">Test</div>
</body>
</html>`;
        
        await fs.writeFile(testHtmlPath, htmlWithCDN);
        
        const success = await processor.replaceCDNReferences(testHtmlPath);
        this.assert(success, 'CDN replacement should succeed');
        
        const updatedContent = await fs.readFile(testHtmlPath, 'utf8');
        this.assert(
            !updatedContent.includes('cdn.tailwindcss.com'),
            'CDN reference should be removed'
        );
        this.assert(
            updatedContent.includes('css/tailwind.min.css'),
            'Local CSS reference should be added'
        );
        
        console.log('✓ CDN replacement tests passed\n');
    }

    /**
     * Test build statistics
     */
    async testGetBuildStats() {
        console.log('Testing build statistics...');
        
        const testInputPath = 'test-stats-input.css';
        const testOutputPath = 'test-stats-output.css';
        const testConfigPath = 'test-stats-config.js';
        
        const processor = new TailwindProcessor({
            inputPath: testInputPath,
            outputPath: testOutputPath,
            configPath: testConfigPath
        });
        
        this.tempFiles.push(testInputPath, testOutputPath, testConfigPath);
        
        // Create test files
        await fs.writeFile(testInputPath, 'input content here');
        await fs.writeFile(testOutputPath, 'output');
        await fs.writeFile(testConfigPath, 'config');
        
        const stats = await processor.getBuildStats();
        
        this.assert(stats !== null, 'Stats should be returned');
        this.assert(stats.inputExists === true, 'Input file should exist');
        this.assert(stats.outputExists === true, 'Output file should exist');
        this.assert(stats.configExists === true, 'Config file should exist');
        this.assert(stats.inputSize > 0, 'Input size should be greater than 0');
        this.assert(stats.outputSize > 0, 'Output size should be greater than 0');
        
        console.log('✓ Build statistics tests passed\n');
    }

    /**
     * Test config generation
     */
    async testGenerateConfig() {
        console.log('Testing config generation...');
        
        const testConfigPath = 'test-tailwind-config.js';
        const processor = new TailwindProcessor({ configPath: testConfigPath });
        this.tempFiles.push(testConfigPath);
        
        // Ensure config doesn't exist
        try {
            await fs.unlink(testConfigPath);
        } catch {}
        
        const success = await processor.generateConfig();
        this.assert(success, 'Config generation should succeed');
        
        const configExists = await this.fileExists(testConfigPath);
        this.assert(configExists, 'Config file should be created');
        
        const configContent = await fs.readFile(testConfigPath, 'utf8');
        this.assert(
            configContent.includes('module.exports'),
            'Config should be a valid module'
        );
        this.assert(
            configContent.includes('content:'),
            'Config should include content paths'
        );
        
        console.log('✓ Config generation tests passed\n');
    }

    /**
     * Helper method to check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Assert helper
     */
    assert(condition, message) {
        const result = {
            passed: !!condition,
            message: message
        };
        
        this.testResults.push(result);
        
        if (!condition) {
            console.error(`✗ FAIL: ${message}`);
        }
    }

    /**
     * Print test results
     */
    printResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const failed = total - passed;
        
        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.message}`));
        }
    }

    /**
     * Clean up temporary files
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up test files...');
        
        for (const file of this.tempFiles) {
            try {
                await fs.unlink(file);
                console.log(`✓ Removed ${file}`);
            } catch (error) {
                console.log(`⚠ Could not remove ${file}: ${error.message}`);
            }
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new TailwindProcessorTests();
    tests.runAllTests();
}

module.exports = TailwindProcessorTests;