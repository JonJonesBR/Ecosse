/**
 * Demonstration of FileValidator functionality
 * Shows real-world usage against project files
 */

const FileValidator = require('./fileValidator.js');
const fs = require('fs').promises;
const path = require('path');

async function demonstrateFileValidator() {
    console.log('=== FileValidator Demonstration ===\n');
    
    const validator = new FileValidator();
    
    try {
        // 1. Get comprehensive validation report
        console.log('1. Running comprehensive validation...');
        const report = await validator.getValidationReport();
        
        console.log('\n📊 Validation Summary:');
        console.log(`   Total files scanned: ${report.summary.totalFilesScanned}`);
        console.log(`   Missing files: ${report.summary.missingFiles}`);
        console.log(`   Valid files: ${report.summary.validFiles}`);
        console.log(`   Errors: ${report.summary.errors}`);
        
        // 2. Show missing verification files specifically
        console.log('\n2. Analyzing verification files...');
        const verificationAnalysis = await validator.identifyMissingVerificationFiles();
        
        console.log('\n🔍 Verification Files Analysis:');
        console.log(`   Missing verification files: ${verificationAnalysis.missing.length}`);
        if (verificationAnalysis.missing.length > 0) {
            verificationAnalysis.missing.forEach(file => {
                console.log(`   - ${file}`);
            });
        }
        
        console.log(`   Existing verification files: ${verificationAnalysis.existing.length}`);
        if (verificationAnalysis.existing.length > 0) {
            verificationAnalysis.existing.forEach(file => {
                console.log(`   + ${file}`);
            });
        }
        
        // 3. Show 404-causing references
        console.log('\n3. Detecting 404-causing references...');
        const missingRefs = await validator.detectMissingReferences();
        
        console.log('\n🚫 Missing References:');
        console.log(`   Missing scripts: ${missingRefs.missingScripts.length}`);
        if (missingRefs.missingScripts.length > 0) {
            missingRefs.missingScripts.forEach(script => {
                console.log(`   - ${script}`);
            });
        }
        
        console.log(`   Missing resources: ${missingRefs.missingResources.length}`);
        if (missingRefs.missingResources.length > 0) {
            missingRefs.missingResources.forEach(resource => {
                console.log(`   - ${resource}`);
            });
        }
        
        console.log(`   Affected files: ${missingRefs.affectedFiles.length}`);
        if (missingRefs.affectedFiles.length > 0) {
            missingRefs.affectedFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
        }
        
        // 4. Generate missing files if any
        if (report.summary.missingFiles > 0) {
            console.log('\n4. Generating missing files...');
            const generationResults = await validator.generateMissingFiles();
            
            console.log('\n📝 File Generation Results:');
            console.log(`   Generated: ${generationResults.generated.length}`);
            generationResults.generated.forEach(file => {
                console.log(`   + ${file}`);
            });
            
            if (generationResults.failed.length > 0) {
                console.log(`   Failed: ${generationResults.failed.length}`);
                generationResults.failed.forEach(failure => {
                    console.log(`   - ${failure.file}: ${failure.error}`);
                });
            }
        }
        
        // 5. Show detailed errors if any
        if (report.details.errors.length > 0) {
            console.log('\n5. Detailed error analysis...');
            console.log('\n❌ Errors Found:');
            report.details.errors.forEach(error => {
                console.log(`   File: ${error.file}`);
                console.log(`   Type: ${error.type}`);
                if (error.missingReference) {
                    console.log(`   Missing: ${error.missingReference}`);
                }
                if (error.error) {
                    console.log(`   Error: ${error.error}`);
                }
                console.log('');
            });
        }
        
        // 6. Show file references map
        console.log('\n6. File reference mapping...');
        console.log('\n🔗 File References:');
        Object.entries(report.details.fileReferences).forEach(([sourceFile, refs]) => {
            console.log(`   ${sourceFile}:`);
            refs.forEach(ref => {
                const status = report.details.missingFiles.includes(ref) ? '❌' : '✅';
                console.log(`     ${status} ${ref}`);
            });
        });
        
        console.log('\n✅ FileValidator demonstration completed!');
        
    } catch (error) {
        console.error('❌ Demonstration failed:', error.message);
        console.error(error.stack);
    }
}

// Run demonstration
if (require.main === module) {
    demonstrateFileValidator();
}

module.exports = { demonstrateFileValidator };