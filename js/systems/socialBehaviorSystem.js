// Social Behavior System - Implements group behaviors, territoriality, and cooperation
import { publish, EventTypes } from './eventSystem.js';
import { info, warning, error } from './loggingSystem.js';

// Social behavior types
const SOCIAL_BEHAVIORS = {
    FLOCKING: 'flocking',
    HERDING: 'herding',
    TERRITORIAL: 'territorial',
    COOPERATIVE: 'cooperative',
    AGGRESSIVE: 'aggressive',
    SOLITARY: 'solitary'
};

// Group formation parameters
const GROUP_FORMATION = {
    MIN_GROUP_SIZE: 3,
    MAX_GROUP_SIZE: 15,
    FORMATION_RADIUS: 80,
    COHESION_STRENGTH: 0.1,
    SEPARATION_STRENGTH: 0.2,
    ALIGNMENT_STRENGTH: 0.05
};

// Territory parameters
const TERRITORY_CONFIG = {
    BASE_TERRITORY_SIZE: 150,
    TERRITORY_OVERLAP_TOLERANCE: 0.3,
    RESOURCE_DEFENSE_RADIUS: 100,
    TERRITORY_MARKING_DURATION: 500
};

class SocialGroup {
    constructor(id, type, leader = null) {
        this.id = id;
        this.type = type; // 'herd', 'pack', 'flock', 'colony'
        this.members = new Set();
        this.leader = leader;
        this.centerX = 0;
        this.centerY = 0;
        this.cohesion = 1.0;
        this.territory = null;
        this.resources = new Set();
        this.age = 0;
        this.lastActivity = Date.now();
    }

    addMember(element) {
        this.members.add(element);
        element.socialGroup = this;
        this.updateCenter();
        
        // Assign leader if none exists
        if (!this.leader && this.members.size > 0) {
            this.leader = element;
        }
    }

    removeMember(element) {
        this.members.delete(element);
        element.socialGroup = null;
        
        // Reassign leader if current leader is removed
        if (this.leader === element && this.members.size > 0) {
            this.leader = Array.from(this.members)[0];
        }
        
        this.updateCenter();
    }

    updateCenter() {
        if (this.members.size === 0) {
            return;
        }
        
        let totalX = 0;
        let totalY = 0;
        
        for (const member of this.members) {
            totalX += member.x;
            totalY += member.y;
        }
        
        this.centerX = totalX / this.members.size;
        this.centerY = totalY / this.members.size;
    }

    update() {
        this.age++;
        this.updateCenter();
        this.updateCohesion();
        this.manageTerritory();
        this.coordinateActivities();
    }

    updateCohesion() {
        if (this.members.size < 2) {
            this.cohesion = 1.0;
            return;
        }

        // Calculate average distance between members
        let totalDistance = 0;
        let pairCount = 0;
        
        const membersArray = Array.from(this.members);
        for (let i = 0; i < membersArray.length; i++) {
            for (let j = i + 1; j < membersArray.length; j++) {
                const distance = Math.hypot(
                    membersArray[i].x - membersArray[j].x,
                    membersArray[i].y - membersArray[j].y
                );
                totalDistance += distance;
                pairCount++;
            }
        }
        
        const averageDistance = totalDistance / pairCount;
        const idealDistance = GROUP_FORMATION.FORMATION_RADIUS;
        
        // Cohesion decreases as members spread out
        this.cohesion = Math.max(0.1, 1.0 - (averageDistance - idealDistance) / (idealDistance * 2));
    }

    manageTerritory() {
        if (this.type === 'pack' || this.type === 'colony') {
            if (!this.territory) {
                this.establishTerritory();
            } else {
                this.defendTerritory();
            }
        }
    }

    establishTerritory() {
        const size = TERRITORY_CONFIG.BASE_TERRITORY_SIZE + (this.members.size * 20);
        this.territory = {
            x: this.centerX,
            y: this.centerY,
            radius: size,
            established: Date.now(),
            markings: []
        };
        
        publish(EventTypes.TERRITORY_ESTABLISHED, {
            groupId: this.id,
            territory: this.territory,
            memberCount: this.members.size
        });
    }

    defendTerritory() {
        // Territory defense logic will be handled in the main update loop
        // This method updates territory markings and boundaries
        if (this.territory) {
            // Update territory center based on group movement
            this.territory.x = this.centerX;
            this.territory.y = this.centerY;
            
            // Add territory markings
            if (Math.random() < 0.01) { // 1% chance per update
                this.territory.markings.push({
                    x: this.centerX + (Math.random() - 0.5) * this.territory.radius,
                    y: this.centerY + (Math.random() - 0.5) * this.territory.radius,
                    timestamp: Date.now(),
                    strength: 1.0
                });
                
                // Remove old markings
                const now = Date.now();
                this.territory.markings = this.territory.markings.filter(
                    marking => now - marking.timestamp < TERRITORY_CONFIG.TERRITORY_MARKING_DURATION
                );
            }
        }
    }

    coordinateActivities() {
        if (this.members.size < 2) return;
        
        // Coordinate feeding
        this.coordinateFeeding();
        
        // Coordinate movement
        this.coordinateMovement();
        
        // Coordinate reproduction
        this.coordinateReproduction();
    }

    coordinateFeeding() {
        // Groups can share information about food sources
        const foodSources = new Set();
        
        for (const member of this.members) {
            // Each member contributes known food sources
            if (member.nearbyFood) {
                foodSources.add(member.nearbyFood);
            }
        }
        
        // Share food information with all members
        for (const member of this.members) {
            member.sharedFoodSources = Array.from(foodSources);
        }
    }

    coordinateMovement() {
        if (this.leader && this.members.size > 1) {
            // Members tend to follow the leader
            for (const member of this.members) {
                if (member !== this.leader) {
                    member.leaderInfluence = {
                        x: this.leader.x,
                        y: this.leader.y,
                        strength: this.cohesion
                    };
                }
            }
        }
    }

    coordinateReproduction() {
        // Groups can coordinate breeding seasons
        if (this.members.size >= GROUP_FORMATION.MIN_GROUP_SIZE) {
            const reproductiveMembers = Array.from(this.members).filter(
                member => member.energy > 70 && member.age > 100
            );
            
            if (reproductiveMembers.length >= 2) {
                // Increase reproduction chance for group members
                for (const member of reproductiveMembers) {
                    if (member.reproductionChance) {
                        member.reproductionChance *= 1.5; // Group breeding bonus
                    }
                }
            }
        }
    }

    isInTerritory(x, y) {
        if (!this.territory) return false;
        
        const distance = Math.hypot(x - this.territory.x, y - this.territory.y);
        return distance <= this.territory.radius;
    }

    shouldDisband() {
        return this.members.size < 2 || this.cohesion < 0.2;
    }
}

class SocialBehaviorSystem {
    constructor() {
        this.groups = new Map();
        this.territories = new Map();
        this.nextGroupId = 1;
        this.groupFormationCooldown = new Map();
    }

    update(ecosystemElements) {
        this.updateExistingGroups();
        this.formNewGroups(ecosystemElements);
        this.handleTerritorialConflicts(ecosystemElements);
        this.applyFlockingBehaviors(ecosystemElements);
        this.cleanupInactiveGroups();
    }

    updateExistingGroups() {
        for (const group of this.groups.values()) {
            group.update();
            
            // Disband groups that are too small or lack cohesion
            if (group.shouldDisband()) {
                this.disbandGroup(group.id);
            }
        }
    }

    formNewGroups(ecosystemElements) {
        // Group creatures by type and proximity
        const creaturesByType = new Map();
        
        ecosystemElements.forEach(element => {
            if (element.type === 'creature' && !element.socialGroup) {
                if (!creaturesByType.has(element.type)) {
                    creaturesByType.set(element.type, []);
                }
                creaturesByType.get(element.type).push(element);
            }
        });
        
        // Form groups for each creature type
        creaturesByType.forEach((creatures, type) => {
            this.formGroupsForType(creatures, type);
        });
    }

    formGroupsForType(creatures, type) {
        const processed = new Set();
        
        creatures.forEach(creature => {
            if (processed.has(creature.id)) return;
            
            // Check cooldown for this creature
            const cooldownKey = `${creature.id}_${type}`;
            if (this.groupFormationCooldown.has(cooldownKey)) {
                const cooldown = this.groupFormationCooldown.get(cooldownKey);
                if (Date.now() - cooldown < 10000) { // 10 second cooldown
                    return;
                }
            }
            
            // Find nearby creatures of the same type
            const nearbyCreatures = creatures.filter(other => {
                if (processed.has(other.id) || other.socialGroup) return false;
                
                const distance = Math.hypot(creature.x - other.x, creature.y - other.y);
                return distance <= GROUP_FORMATION.FORMATION_RADIUS;
            });
            
            // Form group if enough creatures are nearby
            if (nearbyCreatures.length >= GROUP_FORMATION.MIN_GROUP_SIZE) {
                const groupType = this.determineGroupType(type, nearbyCreatures.length);
                const group = this.createGroup(groupType, creature);
                
                // Add nearby creatures to the group
                nearbyCreatures.slice(0, GROUP_FORMATION.MAX_GROUP_SIZE).forEach(member => {
                    group.addMember(member);
                    processed.add(member.id);
                    
                    // Set cooldown
                    const memberCooldownKey = `${member.id}_${type}`;
                    this.groupFormationCooldown.set(memberCooldownKey, Date.now());
                });
                
                publish(EventTypes.GROUP_FORMED, {
                    groupId: group.id,
                    type: groupType,
                    memberCount: group.members.size,
                    leader: group.leader?.id
                });
            }
        });
    }

    determineGroupType(creatureType, memberCount) {
        if (memberCount >= 10) return 'herd';
        if (memberCount >= 6) return 'pack';
        if (memberCount >= 3) return 'flock';
        return 'pair';
    }

    createGroup(type, leader) {
        const groupId = this.nextGroupId++;
        const group = new SocialGroup(groupId, type, leader);
        this.groups.set(groupId, group);
        return group;
    }

    disbandGroup(groupId) {
        const group = this.groups.get(groupId);
        if (!group) return;
        
        // Remove group reference from all members
        for (const member of group.members) {
            member.socialGroup = null;
            member.leaderInfluence = null;
            member.sharedFoodSources = null;
        }
        
        this.groups.delete(groupId);
        
        publish(EventTypes.GROUP_DISBANDED, {
            groupId: groupId,
            reason: 'low_cohesion_or_size'
        });
    }

    handleTerritorialConflicts(ecosystemElements) {
        const territorialGroups = Array.from(this.groups.values()).filter(
            group => group.territory
        );
        
        // Check for territory overlaps and conflicts
        for (let i = 0; i < territorialGroups.length; i++) {
            for (let j = i + 1; j < territorialGroups.length; j++) {
                const group1 = territorialGroups[i];
                const group2 = territorialGroups[j];
                
                const distance = Math.hypot(
                    group1.territory.x - group2.territory.x,
                    group1.territory.y - group2.territory.y
                );
                
                const overlapDistance = group1.territory.radius + group2.territory.radius;
                
                if (distance < overlapDistance * (1 - TERRITORY_CONFIG.TERRITORY_OVERLAP_TOLERANCE)) {
                    this.resolveTerritorialConflict(group1, group2);
                }
            }
        }
        
        // Handle intruders in territories
        territorialGroups.forEach(group => {
            this.handleTerritoryIntruders(group, ecosystemElements);
        });
    }

    resolveTerritorialConflict(group1, group2) {
        // Determine winner based on group size and cohesion
        const strength1 = group1.members.size * group1.cohesion;
        const strength2 = group2.members.size * group2.cohesion;
        
        const winner = strength1 > strength2 ? group1 : group2;
        const loser = winner === group1 ? group2 : group1;
        
        // Winner expands territory, loser retreats
        winner.territory.radius += 20;
        
        // Move loser's territory
        const angle = Math.atan2(
            loser.territory.y - winner.territory.y,
            loser.territory.x - winner.territory.x
        );
        
        const retreatDistance = winner.territory.radius + loser.territory.radius + 50;
        loser.territory.x = winner.territory.x + Math.cos(angle) * retreatDistance;
        loser.territory.y = winner.territory.y + Math.sin(angle) * retreatDistance;
        
        publish(EventTypes.TERRITORIAL_CONFLICT, {
            winner: winner.id,
            loser: loser.id,
            winnerStrength: strength1,
            loserStrength: strength2
        });
    }

    handleTerritoryIntruders(group, ecosystemElements) {
        const intruders = ecosystemElements.filter(element => {
            if (element.type !== 'creature' || group.members.has(element)) return false;
            return group.isInTerritory(element.x, element.y);
        });
        
        intruders.forEach(intruder => {
            // Make intruder flee from territory
            const fleeAngle = Math.atan2(
                intruder.y - group.territory.y,
                intruder.x - group.territory.x
            );
            
            const fleeDistance = 20;
            intruder.x += Math.cos(fleeAngle) * fleeDistance;
            intruder.y += Math.sin(fleeAngle) * fleeDistance;
            
            // Reduce intruder's energy
            if (intruder.energy) {
                intruder.energy -= 5;
            }
            
            publish(EventTypes.TERRITORY_INTRUSION, {
                territoryOwner: group.id,
                intruder: intruder.id,
                expelled: true
            });
        });
    }

    applyFlockingBehaviors(ecosystemElements) {
        // Apply flocking behaviors to creatures in groups
        this.groups.forEach(group => {
            if (group.members.size < 2) return;
            
            const members = Array.from(group.members);
            
            members.forEach(member => {
                const flockingForce = this.calculateFlockingForce(member, members);
                
                // Apply flocking force to movement
                if (flockingForce.x !== 0 || flockingForce.y !== 0) {
                    member.x += flockingForce.x;
                    member.y += flockingForce.y;
                }
            });
        });
    }

    calculateFlockingForce(creature, groupMembers) {
        let separationX = 0, separationY = 0;
        let cohesionX = 0, cohesionY = 0;
        let alignmentX = 0, alignmentY = 0;
        
        let separationCount = 0;
        let cohesionCount = 0;
        
        groupMembers.forEach(other => {
            if (other === creature) return;
            
            const distance = Math.hypot(creature.x - other.x, creature.y - other.y);
            
            // Separation: avoid crowding neighbors
            if (distance < 30 && distance > 0) {
                separationX += (creature.x - other.x) / distance;
                separationY += (creature.y - other.y) / distance;
                separationCount++;
            }
            
            // Cohesion: steer towards average position of neighbors
            if (distance < GROUP_FORMATION.FORMATION_RADIUS) {
                cohesionX += other.x;
                cohesionY += other.y;
                cohesionCount++;
            }
            
            // Alignment: steer towards average heading of neighbors
            if (distance < GROUP_FORMATION.FORMATION_RADIUS && other.velocity) {
                alignmentX += other.velocity.x || 0;
                alignmentY += other.velocity.y || 0;
            }
        });
        
        // Calculate final forces
        let finalX = 0, finalY = 0;
        
        if (separationCount > 0) {
            separationX /= separationCount;
            separationY /= separationCount;
            finalX += separationX * GROUP_FORMATION.SEPARATION_STRENGTH;
            finalY += separationY * GROUP_FORMATION.SEPARATION_STRENGTH;
        }
        
        if (cohesionCount > 0) {
            cohesionX /= cohesionCount;
            cohesionY /= cohesionCount;
            cohesionX -= creature.x;
            cohesionY -= creature.y;
            finalX += cohesionX * GROUP_FORMATION.COHESION_STRENGTH;
            finalY += cohesionY * GROUP_FORMATION.COHESION_STRENGTH;
        }
        
        finalX += alignmentX * GROUP_FORMATION.ALIGNMENT_STRENGTH;
        finalY += alignmentY * GROUP_FORMATION.ALIGNMENT_STRENGTH;
        
        return { x: finalX, y: finalY };
    }

    cleanupInactiveGroups() {
        const now = Date.now();
        const inactiveThreshold = 30000; // 30 seconds
        
        // Clean up formation cooldowns
        for (const [key, timestamp] of this.groupFormationCooldown.entries()) {
            if (now - timestamp > 60000) { // 1 minute
                this.groupFormationCooldown.delete(key);
            }
        }
        
        // Remove groups that haven't been active
        for (const [groupId, group] of this.groups.entries()) {
            if (now - group.lastActivity > inactiveThreshold) {
                this.disbandGroup(groupId);
            }
        }
    }

    getGroupsInArea(x, y, radius) {
        return Array.from(this.groups.values()).filter(group => {
            const distance = Math.hypot(x - group.centerX, y - group.centerY);
            return distance <= radius;
        });
    }

    getGroupById(groupId) {
        return this.groups.get(groupId);
    }

    getGroupStats() {
        const stats = {
            totalGroups: this.groups.size,
            groupsByType: {},
            averageGroupSize: 0,
            totalMembers: 0,
            territoriesCount: 0
        };
        
        for (const group of this.groups.values()) {
            stats.groupsByType[group.type] = (stats.groupsByType[group.type] || 0) + 1;
            stats.totalMembers += group.members.size;
            if (group.territory) stats.territoriesCount++;
        }
        
        if (stats.totalGroups > 0) {
            stats.averageGroupSize = stats.totalMembers / stats.totalGroups;
        }
        
        return stats;
    }
}

// Create singleton instance
const socialBehaviorSystem = new SocialBehaviorSystem();

export { 
    socialBehaviorSystem, 
    SocialGroup, 
    SOCIAL_BEHAVIORS, 
    GROUP_FORMATION, 
    TERRITORY_CONFIG 
};