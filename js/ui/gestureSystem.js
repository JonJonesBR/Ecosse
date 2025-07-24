// js/ui/gestureSystem.js
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Advanced Gesture Recognition System
 * Handles complex multi-touch gestures and mouse interactions
 */
export class GestureSystem {
    constructor() {
        this.isInitialized = false;
        this.gestures = new Map();
        this.activeGestures = new Map();
        this.touchPoints = new Map();
        this.gestureHistory = [];
        this.settings = {
            tapThreshold: 10, // pixels
            longPressDelay: 500, // ms
            swipeThreshold: 50, // pixels
            swipeVelocityThreshold: 0.5, // pixels/ms
            pinchThreshold: 20, // pixels
            rotationThreshold: 15, // degrees
            maxTouchPoints: 10
        };
    }

    /**
     * Initialize the gesture system
     */
    initialize() {
        if (this.isInitialized) return;

        this.registerDefaultGestures();
        this.setupEventListeners();
        
        this.isInitialized = true;
        eventSystem.emit('gestureSystemInitialized');
    }

    /**
     * Register default gestures
     */
    registerDefaultGestures() {
        // Single touch gestures
        this.registerGesture('tap', {
            touchCount: 1,
            maxDuration: 300,
            maxDistance: this.settings.tapThreshold,
            handler: this.handleTap.bind(this)
        });

        this.registerGesture('longPress', {
            touchCount: 1,
            minDuration: this.settings.longPressDelay,
            maxDistance: this.settings.tapThreshold,
            handler: this.handleLongPress.bind(this)
        });

        this.registerGesture('swipe', {
            touchCount: 1,
            minDistance: this.settings.swipeThreshold,
            minVelocity: this.settings.swipeVelocityThreshold,
            handler: this.handleSwipe.bind(this)
        });

        this.registerGesture('drag', {
            touchCount: 1,
            minDistance: this.settings.tapThreshold,
            continuous: true,
            handler: this.handleDrag.bind(this)
        });

        // Multi-touch gestures
        this.registerGesture('pinch', {
            touchCount: 2,
            minDistanceChange: this.settings.pinchThreshold,
            continuous: true,
            handler: this.handlePinch.bind(this)
        });

        this.registerGesture('rotate', {
            touchCount: 2,
            minAngleChange: this.settings.rotationThreshold,
            continuous: true,
            handler: this.handleRotate.bind(this)
        });

        this.registerGesture('twoFingerTap', {
            touchCount: 2,
            maxDuration: 300,
            maxDistance: this.settings.tapThreshold,
            handler: this.handleTwoFingerTap.bind(this)
        });

        // Three finger gestures
        this.registerGesture('threeFingerSwipe', {
            touchCount: 3,
            minDistance: this.settings.swipeThreshold,
            handler: this.handleThreeFingerSwipe.bind(this)
        });

        // Mouse-specific gestures
        this.registerGesture('mouseWheel', {
            inputType: 'mouse',
            handler: this.handleMouseWheel.bind(this)
        });

        this.registerGesture('rightClick', {
            inputType: 'mouse',
            button: 2,
            handler: this.handleRightClick.bind(this)
        });

        this.registerGesture('middleClick', {
            inputType: 'mouse',
            button: 1,
            handler: this.handleMiddleClick.bind(this)
        });
    }

    /**
     * Register a gesture
     */
    registerGesture(name, config) {
        this.gestures.set(name, {
            name,
            ...config,
            id: this.generateGestureId()
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const canvas = document.querySelector('#three-js-canvas-container canvas');
        if (!canvas) return;

        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        // Mouse events
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // Pointer events (for hybrid devices)
        if (window.PointerEvent) {
            canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
            canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
            canvas.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        Array.from(e.changedTouches).forEach(touch => {
            this.addTouchPoint(touch);
        });

        this.updateActiveGestures();
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        Array.from(e.changedTouches).forEach(touch => {
            this.updateTouchPoint(touch);
        });

        this.updateActiveGestures();
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        Array.from(e.changedTouches).forEach(touch => {
            this.removeTouchPoint(touch);
        });

        this.finalizeGestures();
    }

    /**
     * Handle touch cancel
     */
    handleTouchCancel(e) {
        e.preventDefault();
        this.handleTouchEnd(e);
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        const touchPoint = this.createTouchPointFromMouse(e);
        touchPoint.button = e.button;
        this.addTouchPoint(touchPoint);
        this.updateActiveGestures();
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        const touchPoint = this.createTouchPointFromMouse(e);
        touchPoint.button = e.button;
        this.updateTouchPoint(touchPoint);
        this.updateActiveGestures();
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        const touchPoint = this.createTouchPointFromMouse(e);
        touchPoint.button = e.button;
        this.removeTouchPoint(touchPoint);
        this.finalizeGestures();
    }

    /**
     * Handle wheel events
     */
    handleWheel(e) {
        e.preventDefault();
        
        const gesture = this.gestures.get('mouseWheel');
        if (gesture) {
            gesture.handler({
                type: 'mouseWheel',
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                deltaZ: e.deltaZ,
                position: { x: e.clientX, y: e.clientY },
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey
            });
        }
    }

    /**
     * Handle context menu
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const gesture = this.gestures.get('rightClick');
        if (gesture) {
            gesture.handler({
                type: 'rightClick',
                position: { x: e.clientX, y: e.clientY },
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey
            });
        }
    }

    /**
     * Handle pointer events (for hybrid devices)
     */
    handlePointerDown(e) {
        if (e.pointerType === 'touch') {
            // Convert pointer event to touch-like event
            const touchPoint = {
                identifier: e.pointerId,
                clientX: e.clientX,
                clientY: e.clientY,
                force: e.pressure || 1,
                timestamp: Date.now()
            };
            this.addTouchPoint(touchPoint);
        }
    }

    handlePointerMove(e) {
        if (e.pointerType === 'touch') {
            const touchPoint = {
                identifier: e.pointerId,
                clientX: e.clientX,
                clientY: e.clientY,
                force: e.pressure || 1,
                timestamp: Date.now()
            };
            this.updateTouchPoint(touchPoint);
        }
    }

    handlePointerUp(e) {
        if (e.pointerType === 'touch') {
            const touchPoint = {
                identifier: e.pointerId,
                clientX: e.clientX,
                clientY: e.clientY,
                force: e.pressure || 1,
                timestamp: Date.now()
            };
            this.removeTouchPoint(touchPoint);
        }
    }

    handlePointerCancel(e) {
        this.handlePointerUp(e);
    }

    /**
     * Add touch point
     */
    addTouchPoint(touch) {
        const touchPoint = {
            id: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            previousX: touch.clientX,
            previousY: touch.clientY,
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
            force: touch.force || 1,
            button: touch.button || 0,
            path: [{ x: touch.clientX, y: touch.clientY, time: Date.now() }]
        };

        this.touchPoints.set(touch.identifier, touchPoint);
    }

    /**
     * Update touch point
     */
    updateTouchPoint(touch) {
        const touchPoint = this.touchPoints.get(touch.identifier);
        if (!touchPoint) return;

        touchPoint.previousX = touchPoint.currentX;
        touchPoint.previousY = touchPoint.currentY;
        touchPoint.currentX = touch.clientX;
        touchPoint.currentY = touch.clientY;
        touchPoint.lastUpdateTime = Date.now();
        touchPoint.force = touch.force || 1;

        // Add to path for gesture recognition
        touchPoint.path.push({
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        });

        // Limit path length for performance
        if (touchPoint.path.length > 50) {
            touchPoint.path.shift();
        }
    }

    /**
     * Remove touch point
     */
    removeTouchPoint(touch) {
        this.touchPoints.delete(touch.identifier);
    }

    /**
     * Create touch point from mouse event
     */
    createTouchPointFromMouse(e) {
        return {
            identifier: 'mouse',
            clientX: e.clientX,
            clientY: e.clientY,
            force: 1,
            button: e.button
        };
    }

    /**
     * Update active gestures
     */
    updateActiveGestures() {
        const touchCount = this.touchPoints.size;
        
        this.gestures.forEach((gesture, name) => {
            if (this.shouldActivateGesture(gesture, touchCount)) {
                if (!this.activeGestures.has(name)) {
                    this.startGesture(name, gesture);
                } else if (gesture.continuous) {
                    this.updateGesture(name, gesture);
                }
            }
        });
    }

    /**
     * Check if gesture should be activated
     */
    shouldActivateGesture(gesture, touchCount) {
        if (gesture.touchCount && gesture.touchCount !== touchCount) {
            return false;
        }

        if (gesture.inputType === 'mouse' && touchCount !== 1) {
            return false;
        }

        return true;
    }

    /**
     * Start a gesture
     */
    startGesture(name, gesture) {
        const gestureState = {
            name,
            startTime: Date.now(),
            touchPoints: new Map(this.touchPoints),
            initialDistance: this.calculateInitialDistance(),
            initialAngle: this.calculateInitialAngle(),
            initialCenter: this.calculateCenter()
        };

        this.activeGestures.set(name, gestureState);
    }

    /**
     * Update a gesture
     */
    updateGesture(name, gesture) {
        const gestureState = this.activeGestures.get(name);
        if (!gestureState) return;

        const currentTime = Date.now();
        const duration = currentTime - gestureState.startTime;

        const gestureData = {
            type: name,
            duration,
            touchPoints: Array.from(this.touchPoints.values()),
            center: this.calculateCenter(),
            ...this.calculateGestureMetrics(gestureState)
        };

        if (this.isGestureValid(gesture, gestureData)) {
            gesture.handler(gestureData);
        }
    }

    /**
     * Finalize gestures
     */
    finalizeGestures() {
        this.activeGestures.forEach((gestureState, name) => {
            const gesture = this.gestures.get(name);
            if (!gesture) return;

            const currentTime = Date.now();
            const duration = currentTime - gestureState.startTime;

            const gestureData = {
                type: name,
                duration,
                touchPoints: Array.from(gestureState.touchPoints.values()),
                center: gestureState.initialCenter,
                ...this.calculateGestureMetrics(gestureState)
            };

            if (this.isGestureValid(gesture, gestureData)) {
                gesture.handler(gestureData);
            }
        });

        this.activeGestures.clear();
    }

    /**
     * Calculate gesture metrics
     */
    calculateGestureMetrics(gestureState) {
        const metrics = {};

        if (gestureState.touchPoints.size === 1) {
            const touchPoint = Array.from(gestureState.touchPoints.values())[0];
            const currentPoint = this.touchPoints.get(touchPoint.id);
            
            if (currentPoint) {
                metrics.distance = this.calculateDistance(
                    { x: touchPoint.startX, y: touchPoint.startY },
                    { x: currentPoint.currentX, y: currentPoint.currentY }
                );
                
                metrics.velocity = this.calculateVelocity(currentPoint);
                metrics.direction = this.calculateDirection(touchPoint, currentPoint);
            }
        } else if (gestureState.touchPoints.size === 2) {
            const currentDistance = this.calculateCurrentDistance();
            const currentAngle = this.calculateCurrentAngle();
            
            metrics.scaleChange = currentDistance / gestureState.initialDistance;
            metrics.rotationChange = currentAngle - gestureState.initialAngle;
        }

        return metrics;
    }

    /**
     * Check if gesture is valid
     */
    isGestureValid(gesture, data) {
        if (gesture.minDuration && data.duration < gesture.minDuration) {
            return false;
        }

        if (gesture.maxDuration && data.duration > gesture.maxDuration) {
            return false;
        }

        if (gesture.minDistance && data.distance < gesture.minDistance) {
            return false;
        }

        if (gesture.maxDistance && data.distance > gesture.maxDistance) {
            return false;
        }

        if (gesture.minVelocity && data.velocity < gesture.minVelocity) {
            return false;
        }

        return true;
    }

    /**
     * Calculate distance between two points
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate velocity
     */
    calculateVelocity(touchPoint) {
        if (touchPoint.path.length < 2) return 0;

        const recent = touchPoint.path.slice(-5); // Last 5 points
        let totalDistance = 0;
        let totalTime = 0;

        for (let i = 1; i < recent.length; i++) {
            const distance = this.calculateDistance(recent[i - 1], recent[i]);
            const time = recent[i].time - recent[i - 1].time;
            totalDistance += distance;
            totalTime += time;
        }

        return totalTime > 0 ? totalDistance / totalTime : 0;
    }

    /**
     * Calculate direction
     */
    calculateDirection(startPoint, currentPoint) {
        const dx = currentPoint.currentX - startPoint.startX;
        const dy = currentPoint.currentY - startPoint.startY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -45 && angle < 45) return 'right';
        if (angle >= 45 && angle < 135) return 'down';
        if (angle >= 135 || angle < -135) return 'left';
        return 'up';
    }

    /**
     * Calculate center point of all touches
     */
    calculateCenter() {
        if (this.touchPoints.size === 0) return { x: 0, y: 0 };

        let totalX = 0;
        let totalY = 0;

        this.touchPoints.forEach(point => {
            totalX += point.currentX;
            totalY += point.currentY;
        });

        return {
            x: totalX / this.touchPoints.size,
            y: totalY / this.touchPoints.size
        };
    }

    /**
     * Calculate initial distance for multi-touch gestures
     */
    calculateInitialDistance() {
        if (this.touchPoints.size < 2) return 0;

        const points = Array.from(this.touchPoints.values());
        return this.calculateDistance(
            { x: points[0].startX, y: points[0].startY },
            { x: points[1].startX, y: points[1].startY }
        );
    }

    /**
     * Calculate current distance for multi-touch gestures
     */
    calculateCurrentDistance() {
        if (this.touchPoints.size < 2) return 0;

        const points = Array.from(this.touchPoints.values());
        return this.calculateDistance(
            { x: points[0].currentX, y: points[0].currentY },
            { x: points[1].currentX, y: points[1].currentY }
        );
    }

    /**
     * Calculate initial angle for multi-touch gestures
     */
    calculateInitialAngle() {
        if (this.touchPoints.size < 2) return 0;

        const points = Array.from(this.touchPoints.values());
        const dx = points[1].startX - points[0].startX;
        const dy = points[1].startY - points[0].startY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    /**
     * Calculate current angle for multi-touch gestures
     */
    calculateCurrentAngle() {
        if (this.touchPoints.size < 2) return 0;

        const points = Array.from(this.touchPoints.values());
        const dx = points[1].currentX - points[0].currentX;
        const dy = points[1].currentY - points[0].currentY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    /**
     * Generate unique gesture ID
     */
    generateGestureId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Gesture handlers
     */
    handleTap(data) {
        eventSystem.emit('tap', data);
    }

    handleLongPress(data) {
        eventSystem.emit('longPress', data);
    }

    handleSwipe(data) {
        eventSystem.emit('swipe', data);
    }

    handleDrag(data) {
        eventSystem.emit('drag', data);
    }

    handlePinch(data) {
        eventSystem.emit('pinch', data);
    }

    handleRotate(data) {
        eventSystem.emit('rotate', data);
    }

    handleTwoFingerTap(data) {
        eventSystem.emit('twoFingerTap', data);
    }

    handleThreeFingerSwipe(data) {
        eventSystem.emit('threeFingerSwipe', data);
    }

    handleMouseWheel(data) {
        eventSystem.emit('mouseWheel', data);
    }

    handleRightClick(data) {
        eventSystem.emit('rightClick', data);
    }

    handleMiddleClick(data) {
        eventSystem.emit('middleClick', data);
    }

    /**
     * Get gesture statistics
     */
    getGestureStats() {
        return {
            registeredGestures: this.gestures.size,
            activeGestures: this.activeGestures.size,
            activeTouchPoints: this.touchPoints.size,
            gestureHistory: this.gestureHistory.length
        };
    }

    /**
     * Enable/disable gesture
     */
    setGestureEnabled(name, enabled) {
        const gesture = this.gestures.get(name);
        if (gesture) {
            gesture.enabled = enabled;
        }
    }

    /**
     * Update gesture settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
}

// Create and export singleton instance
export const gestureSystem = new GestureSystem();