/**
 * TailwindProcessor Class
 * Handles Tailwind CSS local installation, optimization, and CDN replacement
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class TailwindProcessor {
    constructor(options = {}) {
        this.options = {
            inputPath: options.inputPath || 'css/tailwind-src.css',
            outputPath: options.outputPath || 'css/tailwind.min.css',
            configPath: options.configPath || 'tailwind.config.js',
            minify: options.minify !== false,
            purge: options.purge !== false,
            ...options
        };
        
        this.cdnPattern = /<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*><\/script>/gi;
        this.localScriptTag = '<link rel="stylesheet" href="css/tailwind.min.css">';
    }

    /**
     * Install Tailwind CSS as a local dependency
     * @returns {Promise<boolean>} Success status
     */
    async installTailwind() {
        try {
            console.log('Installing Tailwind CSS locally...');
            
            // Check if already installed
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const isInstalled = packageJson.devDependencies?.tailwindcss || 
                              packageJson.dependencies?.tailwindcss;
            
            if (isInstalled) {
                console.log('✓ Tailwind CSS already installed');
                return true;
            }
            
            // Install Tailwind CSS
            execSync('npm install -D tailwindcss @tailwindcss/cli', { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log('✓ Tailwind CSS installed successfully');
            return true;
            
        } catch (error) {
            console.error('✗ Failed to install Tailwind CSS:', error.message);
            return false;
        }
    }

    /**
     * Generate Tailwind configuration file
     * @returns {Promise<boolean>} Success status
     */
    async generateConfig() {
        try {
            console.log('Generating Tailwind configuration...');
            
            // Check if config already exists
            try {
                await fs.access(this.options.configPath);
                console.log('✓ Tailwind config already exists');
                return true;
            } catch {
                // Config doesn't exist, create it
            }
            
            const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        'panel-bg': '#1a1a2e',
        'panel-border': '#16213e',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-green-600', 'bg-green-700', 'bg-yellow-600', 'bg-yellow-700',
    'bg-red-600', 'bg-red-700', 'bg-blue-600', 'bg-blue-700',
    'bg-purple-600', 'bg-purple-700', 'bg-indigo-600', 'bg-indigo-700',
    'bg-slate-600', 'bg-slate-700', 'bg-gray-600', 'bg-gray-700',
    'hover:bg-green-700', 'hover:bg-yellow-700', 'hover:bg-red-700',
    'hover:bg-blue-800', 'hover:bg-purple-700', 'hover:bg-indigo-700',
    'hover:bg-slate-700', 'hover:bg-gray-700',
    'text-white', 'text-gray-200', 'text-gray-300', 'text-gray-400',
    'text-xl', 'text-3xl', 'text-sm',
    'font-bold', 'font-semibold', 'font-medium',
    'mb-2', 'mb-3', 'mb-4', 'mb-6',
    'flex', 'flex-wrap', 'justify-center', 'justify-between', 'items-center',
    'gap-3', 'gap-4', 'w-full', 'hidden', 'lg:hidden', 'sm:inline',
    'px-3', 'py-2', 'drop-shadow-lg', 'text-center',
    'selection:bg-indigo-700', 'selection:text-white'
  ]
}`;
            
            await fs.writeFile(this.options.configPath, config);
            console.log('✓ Tailwind config generated');
            return true;
            
        } catch (error) {
            console.error('✗ Failed to generate Tailwind config:', error.message);
            return false;
        }
    }

    /**
     * Build optimized Tailwind CSS
     * @returns {Promise<boolean>} Success status
     */
    async buildCSS() {
        try {
            console.log('Building Tailwind CSS...');
            
            // Ensure input file exists
            await this.ensureInputFile();
            
            // Build command
            const minifyFlag = this.options.minify ? '--minify' : '';
            const command = `npx tailwindcss -i ${this.options.inputPath} -o ${this.options.outputPath} ${minifyFlag}`.trim();
            
            execSync(command, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            console.log(`✓ Tailwind CSS built: ${this.options.outputPath}`);
            return true;
            
        } catch (error) {
            console.error('✗ Failed to build Tailwind CSS:', error.message);
            return false;
        }
    }

    /**
     * Ensure Tailwind input file exists
     * @returns {Promise<void>}
     */
    async ensureInputFile() {
        try {
            await fs.access(this.options.inputPath);
        } catch {
            // Create basic input file
            const inputContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.panel-bg {
    @apply bg-panel-bg;
}

.panel-border {
    @apply border-panel-border;
}`;
            
            await fs.writeFile(this.options.inputPath, inputContent);
            console.log(`✓ Created Tailwind input file: ${this.options.inputPath}`);
        }
    }

    /**
     * Optimize CSS for production
     * @returns {Promise<boolean>} Success status
     */
    async optimizeForProduction() {
        try {
            console.log('Optimizing CSS for production...');
            
            // Build with purging and minification
            const success = await this.buildCSS();
            if (!success) return false;
            
            // Additional optimization
            const cssContent = await fs.readFile(this.options.outputPath, 'utf8');
            const optimized = this.optimizeCSSContent(cssContent);
            
            await fs.writeFile(this.options.outputPath, optimized);
            
            console.log('✓ CSS optimized for production');
            return true;
            
        } catch (error) {
            console.error('✗ Failed to optimize CSS:', error.message);
            return false;
        }
    }

    /**
     * Optimize CSS content
     * @param {string} css - CSS content to optimize
     * @returns {string} Optimized CSS
     */
    optimizeCSSContent(css) {
        return css
            // Remove comments (preserve important ones)
            .replace(/\/\*(?!\s*!)[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
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
     * Replace CDN references with local files in HTML
     * @param {string} htmlPath - Path to HTML file
     * @returns {Promise<boolean>} Success status
     */
    async replaceCDNReferences(htmlPath = 'index.html') {
        try {
            console.log(`Replacing CDN references in ${htmlPath}...`);
            
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            
            // Check if CDN reference exists
            if (!this.cdnPattern.test(htmlContent)) {
                console.log('✓ No CDN references found');
                return true;
            }
            
            // Replace CDN script with local CSS link
            const updatedContent = htmlContent.replace(
                this.cdnPattern,
                this.localScriptTag
            );
            
            await fs.writeFile(htmlPath, updatedContent);
            console.log('✓ CDN references replaced with local files');
            return true;
            
        } catch (error) {
            console.error('✗ Failed to replace CDN references:', error.message);
            return false;
        }
    }

    /**
     * Complete Tailwind processing pipeline
     * @param {string} htmlPath - Path to HTML file to update
     * @returns {Promise<boolean>} Success status
     */
    async processComplete(htmlPath = 'index.html') {
        try {
            console.log('Starting complete Tailwind processing...');
            
            // Step 1: Install Tailwind (if needed)
            const installed = await this.installTailwind();
            if (!installed) return false;
            
            // Step 2: Generate config (if needed)
            const configGenerated = await this.generateConfig();
            if (!configGenerated) return false;
            
            // Step 3: Build optimized CSS
            const built = await this.optimizeForProduction();
            if (!built) return false;
            
            // Step 4: Replace CDN references
            const replaced = await this.replaceCDNReferences(htmlPath);
            if (!replaced) return false;
            
            console.log('✅ Complete Tailwind processing finished successfully!');
            return true;
            
        } catch (error) {
            console.error('✗ Complete processing failed:', error.message);
            return false;
        }
    }

    /**
     * Get build statistics
     * @returns {Promise<Object>} Build statistics
     */
    async getBuildStats() {
        try {
            const stats = {
                inputExists: false,
                outputExists: false,
                configExists: false,
                inputSize: 0,
                outputSize: 0,
                compressionRatio: 0
            };
            
            // Check input file
            try {
                const inputStat = await fs.stat(this.options.inputPath);
                stats.inputExists = true;
                stats.inputSize = inputStat.size;
            } catch {}
            
            // Check output file
            try {
                const outputStat = await fs.stat(this.options.outputPath);
                stats.outputExists = true;
                stats.outputSize = outputStat.size;
            } catch {}
            
            // Check config file
            try {
                await fs.stat(this.options.configPath);
                stats.configExists = true;
            } catch {}
            
            // Calculate compression ratio
            if (stats.inputSize > 0 && stats.outputSize > 0) {
                stats.compressionRatio = Math.round(
                    ((stats.inputSize - stats.outputSize) / stats.inputSize) * 100
                );
            }
            
            return stats;
            
        } catch (error) {
            console.error('Failed to get build stats:', error.message);
            return null;
        }
    }
}

module.exports = TailwindProcessor;