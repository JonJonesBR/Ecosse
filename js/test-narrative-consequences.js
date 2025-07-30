/**
 * Test file for Narrative Consequences System
 * This file tests the basic functionality of the narrative consequences system
 */

import { narrativeConsequencesSystem } from './systems/narrativeConsequencesSystem.js';
import { eventSystem, EventTypes } from './systems/eventSystem.js';

// Test function to verify the system works
function testNarrativeConsequencesSystem() {
    console.log('🧪 Testing Narrative Consequences System...');
    
    // Reset system for clean test
    narrativeConsequencesSystem.reset();
    
    // Test 1: Basic player action recording
    console.log('\n1. Testing player action recording...');
    
    // Simulate player creating elements
    for (let i = 0; i < 10; i++) {
        eventSystem.publish(EventTypes.ELEMENT_CREATED, {
            type: 'plant',
            source: 'player',
            emoji: '🌱'
        });
    }
    
    const stats1 = narrativeConsequencesSystem.getStats();
    console.log('Stats after 10 element creations:', stats1);
    
    // Test 2: Trigger consequence through excessive intervention
    console.log('\n2. Testing consequence triggering...');
    
    // Create many more elements to trigger consequence
    for (let i = 0; i < 15; i++) {
        eventSystem.publish(EventTypes.ELEMENT_CREATED, {
            type: 'creature',
            source: 'player',
            emoji: '🐾'
        });
    }
    
    const consequences = narrativeConsequencesSystem.getActiveConsequences();
    console.log('Active consequences:', consequences.length);
    if (consequences.length > 0) {
        console.log('First consequence:', consequences[0].narrative);
    }
    
    // Test 3: Planet destiny tracking
    console.log('\n3. Testing planet destiny...');
    
    const destiny = narrativeConsequencesSystem.getPlanetDestiny();
    console.log('Planet destiny:', destiny);
    
    // Test 4: Meta-narrative progression
    console.log('\n4. Testing meta-narrative...');
    
    const metaNarrative = narrativeConsequencesSystem.getMetaNarrative();
    console.log('Meta-narrative:', metaNarrative);
    
    // Test 5: Ecosystem destruction pattern
    console.log('\n5. Testing ecosystem destruction pattern...');
    
    // Remove many elements to trigger destruction pattern
    for (let i = 0; i < 20; i++) {
        eventSystem.publish(EventTypes.ELEMENT_REMOVED, {
            type: 'plant',
            source: 'player'
        });
    }
    
    const stats2 = narrativeConsequencesSystem.getStats();
    console.log('Stats after removals:', stats2);
    
    const newConsequences = narrativeConsequencesSystem.getActiveConsequences();
    console.log('New consequences count:', newConsequences.length);
    
    // Test 6: Destiny report
    console.log('\n6. Testing destiny report...');
    
    const report = narrativeConsequencesSystem.generateDestinyReport();
    console.log('Destiny Report:\n', report);
    
    console.log('\n✅ Narrative Consequences System tests completed!');
    
    return {
        totalActions: stats2.totalActions,
        consequences: newConsequences.length,
        planetPath: destiny.path,
        chapter: metaNarrative.chapter
    };
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.testNarrativeConsequences = testNarrativeConsequencesSystem;
    console.log('Narrative Consequences test function available as window.testNarrativeConsequences()');
} else {
    // Node.js environment
    testNarrativeConsequencesSystem();
}

export { testNarrativeConsequencesSystem };