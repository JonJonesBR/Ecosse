/**
 * Unit tests for FileValidator class
 * Tests file validation logic for missing resources
 */

// Import FileValidator if in Node.js environment
let FileValidator;
if (typeof require !== 'undefined') {
    FileValidator = require('./fileValidator.js');
} else {
    FileValidator = window.FileValidator;
}

// Mock file system operations for testing
class MockFileValidator extends FileValidator {
    constructor(mockFiles = {}, mockHtmlContent = {}) {
        super();
        this.mockFiles = mockFiles; // { 'path/to/file.js': true/false }
        this.mockHtmlContent = mockHtmlContent; // { 'file.html': 'content' }
        this.writtenFiles = new Map(); // Track files written during tests
    }

    async readFile(filePath) {
        if (this.mockHtmlContent[filePath]) {
            return this.mockHtmlContent[filePath];
        }
        throw new Error(`Mock file not found: ${filePath}`);
    }

    async writeFile(filePath, content) {
        this.writtenFiles.set(filePath, content);
    }

    async fileExists(filePath) {
        return this.mockFiles[filePath] === true;
    }

    async getHtmlFiles() {
        return Object.keys(this.mockHtmlContent);
    }
}

// Test suite
class FileValidatorTestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async runTests() {
        console.log('Running FileValidator tests...');
        this.results = [];

        for (const test of this.tests) {
            try {
                await test.testFn();
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.results.push({ 
                    name: test.name, 
                    status: 'FAIL', 
                    error: error.message 
                });
                console.error(`✗ ${test.name}: ${error.message}`);
            }
        }

        return this.getTestSummary();
    }

    getTestSummary() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        return {
            total: this.results.length,
            passed,
            failed,
            results: this.results
        };
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    assertArrayEqual(actual, expected, message) {
        if (JSON.stringify(actual.sort()) !== JSON.stringify(expected.sort())) {
            throw new Error(`${message}: expected [${expected}], got [${actual}]`);
        }
    }
}

// Create test suite
const testSuite = new FileValidatorTestSuite();

// Test 1: Basic file validation
testSuite.addTest('should detect missing script files', async () => {
    const mockFiles = {
        'js/existing.js': true,
        'js/missing.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script src="js/existing.js"></script>
            <script src="js/missing.js"></script>
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.scanMissingFiles();

    testSuite.assertArrayEqual(results.missingFiles, ['js/missing.js'], 'Should detect missing file');
    testSuite.assertArrayEqual(results.validatedFiles, ['js/existing.js'], 'Should validate existing file');
});

// Test 2: Verification file detection
testSuite.addTest('should identify missing verification files', async () => {
    const mockFiles = {
        'verify-task1-completion.js': true,
        'verify-task2-completion.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script src="verify-task1-completion.js"></script>
            <script src="verify-task2-completion.js"></script>
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.identifyMissingVerificationFiles();

    testSuite.assertArrayEqual(results.missing, ['verify-task2-completion.js'], 'Should detect missing verification file');
    testSuite.assertArrayEqual(results.existing, ['verify-task1-completion.js'], 'Should identify existing verification file');
});

// Test 3: Import statement parsing
testSuite.addTest('should parse import statements in HTML', async () => {
    const mockFiles = {
        'js/module1.js': true,
        'js/module2.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script type="module">
                import { func1 } from './js/module1.js';
                import { func2 } from './js/module2.js';
            </script>
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.scanMissingFiles();

    testSuite.assertArrayEqual(results.missingFiles, ['js/module2.js'], 'Should detect missing imported module');
    testSuite.assertArrayEqual(results.validatedFiles, ['js/module1.js'], 'Should validate existing imported module');
});

// Test 4: External URL filtering
testSuite.addTest('should ignore external URLs', async () => {
    const mockFiles = {
        'js/local.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script src="https://cdn.example.com/external.js"></script>
            <script src="js/local.js"></script>
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.scanMissingFiles();

    testSuite.assertArrayEqual(results.missingFiles, ['js/local.js'], 'Should only detect local missing files');
    testSuite.assert(!results.missingFiles.includes('https://cdn.example.com/external.js'), 'Should ignore external URLs');
});

// Test 5: 404 detection
testSuite.addTest('should detect 404-causing references', async () => {
    const mockFiles = {
        'js/working.js': true,
        'js/broken.js': false,
        'css/missing.css': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script src="js/working.js"></script>
            <script src="js/broken.js"></script>
            <link rel="stylesheet" href="css/missing.css">
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.detectMissingReferences();

    testSuite.assertArrayEqual(results.missingScripts, ['js/broken.js'], 'Should detect missing scripts');
    testSuite.assertEqual(results.totalMissing, 1, 'Should count total missing files correctly');
    testSuite.assertArrayEqual(results.affectedFiles, ['test.html'], 'Should identify affected files');
});

// Test 6: Verification file stub generation
testSuite.addTest('should generate verification file stubs', async () => {
    const validator = new MockFileValidator();
    
    await validator.generateMissingFiles(['verify-task5-completion.js']);
    
    const generatedContent = validator.writtenFiles.get('verify-task5-completion.js');
    testSuite.assert(generatedContent, 'Should generate file content');
    testSuite.assert(generatedContent.includes('verifyTask5'), 'Should include camelCase function name');
    testSuite.assert(generatedContent.includes('TODO'), 'Should include TODO comments');
});

// Test 7: Generic script stub generation
testSuite.addTest('should generate generic script stubs', async () => {
    const validator = new MockFileValidator();
    
    await validator.generateMissingFiles(['js/missing-module.js']);
    
    const generatedContent = validator.writtenFiles.get('js/missing-module.js');
    testSuite.assert(generatedContent, 'Should generate file content');
    testSuite.assert(generatedContent.includes('missing-module.js'), 'Should include filename in content');
    testSuite.assert(generatedContent.includes('TODO'), 'Should include TODO comments');
});

// Test 8: Path normalization
testSuite.addTest('should normalize file paths correctly', async () => {
    const mockFiles = {
        'js/test.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `<script src="./js/test.js"></script>`
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.scanMissingFiles();

    testSuite.assertArrayEqual(results.missingFiles, ['js/test.js'], 'Should normalize ./ prefix');
});

// Test 9: Error handling
testSuite.addTest('should handle file reading errors gracefully', async () => {
    const validator = new MockFileValidator({}, {}); // No mock content
    
    const results = await validator.scanMissingFiles(['nonexistent.html']);
    
    testSuite.assert(results.errors.length > 0, 'Should record errors');
    testSuite.assertEqual(results.errors[0].type, 'scan_error', 'Should categorize error type');
});

// Test 10: Comprehensive validation report
testSuite.addTest('should generate comprehensive validation report', async () => {
    const mockFiles = {
        'js/working.js': true,
        'js/broken.js': false,
        'verify-task1-completion.js': false
    };
    
    const mockHtmlContent = {
        'test.html': `
            <script src="js/working.js"></script>
            <script src="js/broken.js"></script>
            <script src="verify-task1-completion.js"></script>
        `
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const report = await validator.getValidationReport();

    testSuite.assert(report.summary, 'Should include summary');
    testSuite.assert(report.missingReferences, 'Should include missing references');
    testSuite.assert(report.verificationFiles, 'Should include verification file analysis');
    testSuite.assert(report.timestamp, 'Should include timestamp');
    testSuite.assertEqual(report.summary.missingFiles, 2, 'Should count missing files correctly');
});

// Test 11: CamelCase conversion utility
testSuite.addTest('should convert kebab-case to CamelCase correctly', async () => {
    const validator = new FileValidator();
    
    testSuite.assertEqual(validator.toCamelCase('task-completion'), 'TaskCompletion', 'Should convert kebab-case');
    testSuite.assertEqual(validator.toCamelCase('simple'), 'Simple', 'Should capitalize single word');
    testSuite.assertEqual(validator.toCamelCase('multi-word-test'), 'MultiWordTest', 'Should handle multiple words');
});

// Test 12: File reference tracking
testSuite.addTest('should track file references correctly', async () => {
    const mockFiles = {
        'js/test1.js': true,
        'js/test2.js': false
    };
    
    const mockHtmlContent = {
        'file1.html': '<script src="js/test1.js"></script>',
        'file2.html': '<script src="js/test2.js"></script>'
    };

    const validator = new MockFileValidator(mockFiles, mockHtmlContent);
    const results = await validator.scanMissingFiles();

    testSuite.assert(results.fileReferences['file1.html'], 'Should track references from file1');
    testSuite.assert(results.fileReferences['file2.html'], 'Should track references from file2');
    testSuite.assertArrayEqual(results.fileReferences['file1.html'], ['js/test1.js'], 'Should track correct reference');
});

// Export test suite for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileValidatorTestSuite, MockFileValidator, testSuite };
} else {
    window.FileValidatorTestSuite = FileValidatorTestSuite;
    window.MockFileValidator = MockFileValidator;
    window.fileValidatorTestSuite = testSuite;
}

// Auto-run tests if loaded directly
if (typeof window !== 'undefined') {
    console.log('FileValidator test suite loaded. Run fileValidatorTestSuite.runTests() to execute tests.');
}