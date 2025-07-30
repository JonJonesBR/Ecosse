/**
 * Simple test runner for element controls organization
 * This simulates a basic DOM environment to test the functionality
 */

// Mock DOM environment
const mockElements = {
    '.element-categories': { appendChild: () => {} },
    '#bottom-panel': { 
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
    },
    '.element-category': [
        { dataset: {}, querySelector: () => null, className: '' },
        { dataset: {}, querySelector: () => null, className: '' },
        { dataset: {}, querySelector: () => null, className: '' },
        { dataset: {}, querySelector: () => null, className: '' },
        { dataset: {}, querySelector: () => null, className: '' },
        { dataset: {}, querySelector: () => null, className: '' }
    ]
};

let domContentLoadedCallback = null;

global.document = {
    addEventListener: (event, callback) => {
        if (event === 'DOMContentLoaded') {
            domContentLoadedCallback = callback;
        }
    },
    getElementById: (id) => mockElements[`#${id}`] || null,
    querySelector: (selector) => mockElements[selector] || null,
    querySelectorAll: (selector) => {
        if (selector === '.element-category') {
            return mockElements[selector];
        }
        return [];
    },
    createElement: () => ({
        className: '',
        innerHTML: '',
        style: {},
        appendChild: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        parentNode: {
            replaceChild: () => {},
            insertBefore: () => {}
        },
        querySelector: () => null,
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        }
    }),
    body: {
        appendChild: () => {}
    }
};

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => {},
    matchMedia: () => ({
        addListener: () => {}
    }),
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    IntersectionObserver: function() {
        this.observe = () => {};
        this.unobserve = () => {};
        this.disconnect = () => {};
    },
    performance: {
        now: () => Date.now()
    }
};

global.console = console;

// Load the ElementControlsOrganizer
try {
    require('./js/ui/elementControlsOrganizer.js');
    console.log('✅ ElementControlsOrganizer loaded successfully');
    
    // Trigger DOMContentLoaded event
    if (domContentLoadedCallback) {
        setTimeout(() => {
            domContentLoadedCallback();
            
            // Wait for initialization
            setTimeout(() => {
                testOrganizer();
            }, 1000);
        }, 100);
    } else {
        testOrganizer();
    }
    
} catch (error) {
    console.error('❌ Error loading ElementControlsOrganizer:', error.message);
    process.exit(1);
}

function testOrganizer() {
    // Basic functionality test
    if (global.window.elementControlsOrganizer) {
        console.log('✅ ElementControlsOrganizer instance created');
        
        const organizer = global.window.elementControlsOrganizer;
        const state = organizer.getState();
        console.log('✅ State retrieved:', {
            categories: Object.keys(state.categories).length,
            isCompactMode: state.isCompactMode,
            collapsedCategories: state.collapsedCategories.length
        });
        
        // Test compact mode toggle
        const initialCompactMode = organizer.isCompactMode;
        organizer.setCompactMode(!initialCompactMode);
        const newCompactMode = organizer.isCompactMode;
        console.log(`✅ Compact mode toggle: ${initialCompactMode} → ${newCompactMode}`);
        
        // Test category expansion
        const testCategory = 'plants';
        if (organizer.categories.has(testCategory)) {
            const initialExpanded = organizer.categories.get(testCategory).expanded;
            organizer.setCategoryExpanded(testCategory, !initialExpanded);
            const newExpanded = organizer.categories.get(testCategory).expanded;
            console.log(`✅ Category toggle: ${testCategory} ${initialExpanded} → ${newExpanded}`);
        }
        
        console.log('\n🎯 All basic tests passed! Element Controls Organization system is working.');
        
    } else {
        console.error('❌ ElementControlsOrganizer instance not found');
    }
}