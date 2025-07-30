/**
 * Production Build Script
 * Optimizes CSS and creates production-ready builds
 */

const fs = require('fs').promises;
const path = require('path');

class ProductionBuilder {
    constructor() {
        this.cssFiles = [
            'css/style.css',
            'css/adaptive-ui.css',
            'css/element-controls-organization.css',
            'css/layout-configuration.css',
            'css/performance-optimization.css',
            'css/dom-fixes.css'
        ];
    }

    /**
     * Main build process
     */
    async build() {
        console.log('Starting production build...');
        
        try {
            // Minify CSS files
            await this.minifyCSS();
            
            // Create optimized bundle
            await this.createOptimizedBundle();
            
            // Generate build report
            await this.generateBuildReport();
            
            console.log('Production build completed successfully!');
            
        } catch (error) {
            console.error('Build failed:', error);
            process.exit(1);
        }
    }

    /**
     * Minify CSS files
     */
    async minifyCSS() {
        console.log('Minifying CSS files...');
        
        for (const cssFile of this.cssFiles) {
            try {
                const content = await fs.readFile(cssFile, 'utf8');
                const minified = this.minifyCSSContent(content);
                
                const minifiedPath = cssFile.replace('.css', '.min.css');
                await fs.writeFile(minifiedPath, minified);
                
                console.log(`✓ Minified ${cssFile} -> ${minifiedPath}`);
                
            } catch (error) {
                console.warn(`⚠ Could not minify ${cssFile}:`, error.message);
            }
        }
    }

    /**
     * Simple CSS minification
     * @param {string} css - CSS content to minify
     * @returns {string} Minified CSS
     */
    minifyCSSContent(css) {
        return css
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove extra whitespace
            .replace(/\s+/g, ' ')
            // Remove whitespace around specific characters
            .replace(/\s*([{}:;,>+~])\s*/g, '$1')
            // Remove trailing semicolons before closing braces
            .replace(/;}/g, '}')
            // Remove leading/trailing whitespace
            .trim();
    }

    /**
     * Create optimized CSS bundle
     */
    async createOptimizedBundle() {
        console.log('Creating optimized CSS bundle...');
        
        let bundledCSS = '/* Ecosse Production CSS Bundle */\n';
        
        for (const cssFile of this.cssFiles) {
            try {
                const content = await fs.readFile(cssFile, 'utf8');
                bundledCSS += `\n/* ${cssFile} */\n`;
                bundledCSS += this.minifyCSSContent(content);
                bundledCSS += '\n';
                
            } catch (error) {
                console.warn(`⚠ Could not include ${cssFile} in bundle:`, error.message);
            }
        }
        
        await fs.writeFile('css/bundle.min.css', bundledCSS);
        console.log('✓ Created css/bundle.min.css');
    }

    /**
     * Generate build report
     */
    async generateBuildReport() {
        console.log('Generating build report...');
        
        const report = {
            buildTime: new Date().toISOString(),
            files: {},
            totalOriginalSize: 0,
            totalMinifiedSize: 0
        };
        
        for (const cssFile of this.cssFiles) {
            try {
                const originalStats = await fs.stat(cssFile);
                const minifiedPath = cssFile.replace('.css', '.min.css');
                
                let minifiedSize = 0;
                try {
                    const minifiedStats = await fs.stat(minifiedPath);
                    minifiedSize = minifiedStats.size;
                } catch (error) {
                    // Minified file doesn't exist
                }
                
                report.files[cssFile] = {
                    originalSize: originalStats.size,
                    minifiedSize: minifiedSize,
                    savings: originalStats.size - minifiedSize,
                    savingsPercent: minifiedSize > 0 ? 
                        Math.round(((originalStats.size - minifiedSize) / originalStats.size) * 100) : 0
                };
                
                report.totalOriginalSize += originalStats.size;
                report.totalMinifiedSize += minifiedSize;
                
            } catch (error) {
                console.warn(`⚠ Could not analyze ${cssFile}:`, error.message);
            }
        }
        
        report.totalSavings = report.totalOriginalSize - report.totalMinifiedSize;
        report.totalSavingsPercent = report.totalMinifiedSize > 0 ? 
            Math.round((report.totalSavings / report.totalOriginalSize) * 100) : 0;
        
        await fs.writeFile('build-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📊 Build Report:');
        console.log(`Total original size: ${this.formatBytes(report.totalOriginalSize)}`);
        console.log(`Total minified size: ${this.formatBytes(report.totalMinifiedSize)}`);
        console.log(`Total savings: ${this.formatBytes(report.totalSavings)} (${report.totalSavingsPercent}%)`);
        console.log('✓ Build report saved to build-report.json');
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run build if this script is executed directly
if (require.main === module) {
    const builder = new ProductionBuilder();
    builder.build();
}

module.exports = ProductionBuilder;