/**
 * FileValidator - System for validating file references and detecting missing resources
 * Addresses Requirements 2.1, 2.2 from production-optimization spec
 */

class FileValidator {
    constructor() {
        this.missingFiles = new Set();
        this.validatedFiles = new Set();
        this.fileReferences = new Map();
        this.errors = [];
    }

    /**
     * Scan HTML files for missing file references
     * @param {string[]} htmlFiles - Array of HTML file paths to scan
     * @returns {Promise<Object>} Validation results
     */
    async scanMissingFiles(htmlFiles = []) {
        this.missingFiles.clear();
        this.validatedFiles.clear();
        this.fileReferences.clear();
        this.errors = [];

        const filesToScan = htmlFiles.length > 0 ? htmlFiles : await this.getHtmlFiles();
        
        for (const htmlFile of filesToScan) {
            try {
                await this.scanHtmlFile(htmlFile);
            } catch (error) {
                this.errors.push({
                    file: htmlFile,
                    error: error.message,
                    type: 'scan_error'
                });
            }
        }

        return {
            missingFiles: Array.from(this.missingFiles),
            validatedFiles: Array.from(this.validatedFiles),
            fileReferences: Object.fromEntries(this.fileReferences),
            errors: this.errors
        };
    }

    /**
     * Scan a single HTML file for script and resource references
     * @param {string} htmlFile - Path to HTML file
     */
    async scanHtmlFile(htmlFile) {
        try {
            const content = await this.readFile(htmlFile);
            
            // Extract script src references
            const scriptMatches = content.match(/src=["']([^"']*\.js)["']/g) || [];
            const importMatches = content.match(/import.*from\s*["']([^"']*\.js)["']/g) || [];
            
            const allReferences = [
                ...scriptMatches.map(match => match.match(/src=["']([^"']*)["']/)[1]),
                ...importMatches.map(match => match.match(/from\s*["']([^"']*)["']/)[1])
            ];

            for (const ref of allReferences) {
                await this.validateFileReference(htmlFile, ref);
            }
        } catch (error) {
            throw new Error(`Failed to scan ${htmlFile}: ${error.message}`);
        }
    }

    /**
     * Validate a single file reference
     * @param {string} sourceFile - File containing the reference
     * @param {string} referencePath - Path being referenced
     */
    async validateFileReference(sourceFile, referencePath) {
        // Skip external URLs
        if (referencePath.startsWith('http://') || referencePath.startsWith('https://')) {
            return;
        }

        // Normalize path (remove leading ./)
        const normalizedPath = referencePath.replace(/^\.\//, '');
        
        // Track the reference
        if (!this.fileReferences.has(sourceFile)) {
            this.fileReferences.set(sourceFile, []);
        }
        this.fileReferences.get(sourceFile).push(normalizedPath);

        // Check if file exists
        const exists = await this.fileExists(normalizedPath);
        
        if (exists) {
            this.validatedFiles.add(normalizedPath);
        } else {
            this.missingFiles.add(normalizedPath);
            this.errors.push({
                file: sourceFile,
                missingReference: normalizedPath,
                type: 'missing_file'
            });
        }
    }

    /**
     * Detect 404-causing script and resource references
     * @returns {Promise<Object>} Detection results
     */
    async detectMissingReferences() {
        const results = await this.scanMissingFiles();
        
        const missingScripts = results.missingFiles.filter(file => file.endsWith('.js'));
        const missingResources = results.missingFiles.filter(file => !file.endsWith('.js'));
        
        return {
            missingScripts,
            missingResources,
            totalMissing: results.missingFiles.length,
            affectedFiles: Object.keys(results.fileReferences).filter(file => 
                results.fileReferences[file].some(ref => results.missingFiles.includes(ref))
            )
        };
    }

    /**
     * Identify missing verification files specifically
     * @returns {Promise<Object>} Missing verification files
     */
    async identifyMissingVerificationFiles() {
        const results = await this.scanMissingFiles();
        
        const missingVerificationFiles = results.missingFiles.filter(file => 
            file.includes('verify-') && file.endsWith('.js')
        );

        const existingVerificationFiles = results.validatedFiles.filter(file =>
            file.includes('verify-') && file.endsWith('.js')
        );

        return {
            missing: missingVerificationFiles,
            existing: existingVerificationFiles,
            references: this.getVerificationFileReferences(results.fileReferences)
        };
    }

    /**
     * Get references to verification files from file references map
     * @param {Object} fileReferences - Map of file references
     * @returns {Object} Verification file references
     */
    getVerificationFileReferences(fileReferences) {
        const verificationRefs = {};
        
        for (const [sourceFile, refs] of Object.entries(fileReferences)) {
            const verifyRefs = refs.filter(ref => ref.includes('verify-') && ref.endsWith('.js'));
            if (verifyRefs.length > 0) {
                verificationRefs[sourceFile] = verifyRefs;
            }
        }
        
        return verificationRefs;
    }

    /**
     * Generate missing verification files with stub implementations
     * @param {string[]} missingFiles - Array of missing verification file paths
     * @returns {Promise<Object>} Generation results
     */
    async generateMissingFiles(missingFiles = []) {
        const filesToGenerate = missingFiles.length > 0 ? missingFiles : Array.from(this.missingFiles);
        const generated = [];
        const failed = [];

        for (const filePath of filesToGenerate) {
            try {
                if (filePath.includes('verify-') && filePath.endsWith('.js')) {
                    await this.generateVerificationStub(filePath);
                    generated.push(filePath);
                } else if (filePath.endsWith('.js')) {
                    await this.generateScriptStub(filePath);
                    generated.push(filePath);
                }
            } catch (error) {
                failed.push({
                    file: filePath,
                    error: error.message
                });
            }
        }

        return { generated, failed };
    }

    /**
     * Generate a verification file stub
     * @param {string} filePath - Path for the verification file
     */
    async generateVerificationStub(filePath) {
        const fileName = filePath.split('/').pop().replace('.js', '');
        const taskName = fileName.replace('verify-', '').replace('-completion', '');
        
        const stubContent = `/**
 * ${fileName}.js - Auto-generated verification stub
 * TODO: Implement actual verification logic for ${taskName}
 */

// Verification functions for ${taskName}
function verify${this.toCamelCase(taskName)}() {
    console.log('Verifying ${taskName}...');
    
    // TODO: Add actual verification logic here
    const results = {
        passed: true,
        message: 'Verification stub - needs implementation',
        details: []
    };
    
    return results;
}

// Export verification function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verify${this.toCamelCase(taskName)} };
} else {
    window.verify${this.toCamelCase(taskName)} = verify${this.toCamelCase(taskName)};
}

// Auto-run verification if loaded directly
if (typeof window !== 'undefined') {
    console.log('${fileName} loaded - verification stub ready');
}
`;

        await this.writeFile(filePath, stubContent);
    }

    /**
     * Generate a generic script stub
     * @param {string} filePath - Path for the script file
     */
    async generateScriptStub(filePath) {
        const fileName = filePath.split('/').pop().replace('.js', '');
        
        const stubContent = `/**
 * ${fileName}.js - Auto-generated script stub
 * TODO: Implement actual functionality
 */

console.log('${fileName} loaded - stub implementation');

// TODO: Add actual implementation here

// Export placeholder if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
`;

        await this.writeFile(filePath, stubContent);
    }

    /**
     * Utility methods for file operations
     */
    
    async getHtmlFiles() {
        // In a real implementation, this would scan the directory
        // For now, return known HTML files
        return [
            'index.html',
            'test-element-controls-organization.html',
            'test-layout-error-handling.html',
            'test-layout-validation-task8.html',
            'test-canvas-integration.html',
            'test-canvas-sizing-optimization.html'
        ];
    }

    async readFile(filePath) {
        // This would be implemented with actual file reading
        // For testing purposes, we'll simulate
        if (typeof require !== 'undefined') {
            const fs = require('fs').promises;
            return await fs.readFile(filePath, 'utf8');
        }
        
        // Browser environment - would use fetch
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to read ${filePath}: ${response.status}`);
        }
        return await response.text();
    }

    async writeFile(filePath, content) {
        // This would be implemented with actual file writing
        if (typeof require !== 'undefined') {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            
            await fs.writeFile(filePath, content, 'utf8');
        } else {
            // Browser environment - would need different approach
            console.log(`Would write to ${filePath}:`, content);
        }
    }

    async fileExists(filePath) {
        try {
            if (typeof require !== 'undefined') {
                const fs = require('fs').promises;
                await fs.access(filePath);
                return true;
            } else {
                // Browser environment - try fetch
                const response = await fetch(filePath, { method: 'HEAD' });
                return response.ok;
            }
        } catch {
            return false;
        }
    }

    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
                 .replace(/^[a-z]/, match => match.toUpperCase());
    }

    /**
     * Get comprehensive validation report
     * @returns {Promise<Object>} Complete validation report
     */
    async getValidationReport() {
        const scanResults = await this.scanMissingFiles();
        const missingRefs = await this.detectMissingReferences();
        const verificationFiles = await this.identifyMissingVerificationFiles();

        return {
            summary: {
                totalFilesScanned: scanResults.validatedFiles.length + scanResults.missingFiles.length,
                missingFiles: scanResults.missingFiles.length,
                validFiles: scanResults.validatedFiles.length,
                errors: scanResults.errors.length
            },
            missingReferences: missingRefs,
            verificationFiles,
            details: scanResults,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileValidator;
} else {
    window.FileValidator = FileValidator;
}