/**
 * Global state manager for the dashboard
 * Handles shared state and provides access to different controllers
 */
const DashboardState = (function() {
    // Private state
    const state = {
        // Active entities
        activeDroneId: null,
        selectedCheckpoint: null,
        selectedEvent: null,
        selectedObject: null,
        
        // Map state
        mapLayers: {
            drones: true,
            checkpoints: true,
            thermalHistory: false,
            objects: true,
            paths: false
        },
        thermalViewActive: false,
        patrolViewActive: false,
        
        // Timeline state
        timelinePosition: 30, // Percentage (0-100)
        isPlaying: false,
        timeRange: 24, // hours
        currentTime: new Date(),
        playbackSpeed: 1,
        
        // Filter state
        filters: {
            person: true,
            vehicle: true,
            thermal: true,
            high: true,
            medium: true,
            low: true
        },
        
        // Drone filters
        droneFilters: {
            thermal: true,
            optical: true,
            active: true
        },
        
        // Data collections
        drones: [],
        alerts: [],
        checkpoints: [],
        events: [],
        detectedObjects: []
    };
    
    // Event bus for pub/sub pattern
    const eventBus = {
        events: {},
        
        subscribe: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
            
            // Return unsubscribe function
            return () => {
                this.events[event] = this.events[event].filter(cb => cb !== callback);
            };
        },
        
        publish: function(event, data) {
            if (!this.events[event]) {
                return;
            }
            this.events[event].forEach(callback => {
                callback(data);
            });
        }
    };
    
    // Public API
    return {
        // Getters
        getActiveDrone: function() {
            return state.drones.find(drone => drone.id === state.activeDroneId) || null;
        },
        
        getSelectedCheckpoint: function() {
            return state.checkpoints.find(cp => cp.id === state.selectedCheckpoint) || null;
        },
        
        getSelectedEvent: function() {
            return state.events.find(event => event.id === state.selectedEvent) || null;
        },
        
        getSelectedObject: function() {
            return state.detectedObjects.find(obj => obj.id === state.selectedObject) || null;
        },
        
        getDrones: function() {
            return state.drones;
        },
        
        getAlerts: function() {
            return state.alerts;
        },
        
        getCheckpoints: function() {
            return state.checkpoints;
        },
        
        getEvents: function() {
            return state.events;
        },
        
        getDetectedObjects: function() {
            return state.detectedObjects;
        },
        
        getTimelinePosition: function() {
            return state.timelinePosition;
        },
        
        getCurrentTime: function() {
            return state.currentTime;
        },
        
        getTimeRange: function() {
            return state.timeRange;
        },
        
        isLayerVisible: function(layer) {
            return state.mapLayers[layer];
        },
        
        isThermalViewActive: function() {
            return state.thermalViewActive;
        },
        
        isPatrolViewActive: function() {
            return state.patrolViewActive;
        },
        
        isFilterActive: function(filter) {
            return state.filters[filter];
        },
        
        isDroneFilterActive: function(filter) {
            return state.droneFilters[filter];
        },
        
        // Setters
        setActiveDrone: function(droneId) {
            state.activeDroneId = droneId;
            eventBus.publish('activeDroneChanged', droneId);
        },
        
        setSelectedCheckpoint: function(checkpointId) {
            state.selectedCheckpoint = checkpointId;
            eventBus.publish('checkpointSelected', checkpointId);
        },
        
        setSelectedEvent: function(eventId) {
            state.selectedEvent = eventId;
            eventBus.publish('eventSelected', eventId);
        },
        
        setSelectedObject: function(objectId) {
            state.selectedObject = objectId;
            eventBus.publish('objectSelected', objectId);
        },
        
        setTimelinePosition: function(position) {
            state.timelinePosition = position;
            
            // Update current time based on position and time range
            const now = new Date();
            const rangeMs = state.timeRange * 60 * 60 * 1000;
            const positionMs = (position / 100) * rangeMs;
            
            state.currentTime = new Date(now.getTime() - (rangeMs - positionMs));
            
            eventBus.publish('timelinePositionChanged', {
                position: position,
                time: state.currentTime
            });
        },
        
        setTimeRange: function(hours) {
            state.timeRange = hours;
            eventBus.publish('timeRangeChanged', hours);
            
            // Update current time based on new range
            this.setTimelinePosition(state.timelinePosition);
        },
        
        setLayerVisibility: function(layer, visible) {
            state.mapLayers[layer] = visible;
            eventBus.publish('layerVisibilityChanged', {
                layer: layer,
                visible: visible
            });
        },
        
        setThermalView: function(active) {
            state.thermalViewActive = active;
            eventBus.publish('thermalViewChanged', active);
        },
        
        setPatrolView: function(active) {
            state.patrolViewActive = active;
            eventBus.publish('patrolViewChanged', active);
        },
        
        setFilter: function(filter, active) {
            state.filters[filter] = active;
            eventBus.publish('filterChanged', {
                filter: filter,
                active: active
            });
        },
        
        setDroneFilter: function(filter, active) {
            state.droneFilters[filter] = active;
            eventBus.publish('droneFilterChanged', {
                filter: filter,
                active: active
            });
        },
        
        // Data manipulation
        setDrones: function(drones) {
            state.drones = drones;
            eventBus.publish('dronesUpdated', drones);
        },
        
        addAlert: function(alert) {
            state.alerts.unshift(alert); // Add to beginning
            eventBus.publish('alertAdded', alert);
        },
        
        removeAlert: function(alertId) {
            state.alerts = state.alerts.filter(a => a.id !== alertId);
            eventBus.publish('alertRemoved', alertId);
        },
        
        setCheckpoints: function(checkpoints) {
            state.checkpoints = checkpoints;
            eventBus.publish('checkpointsUpdated', checkpoints);
        },
        
        updateCheckpoint: function(checkpoint) {
            const index = state.checkpoints.findIndex(cp => cp.id === checkpoint.id);
            if (index !== -1) {
                state.checkpoints[index] = checkpoint;
                eventBus.publish('checkpointUpdated', checkpoint);
            }
        },
        
        setEvents: function(events) {
            state.events = events;
            eventBus.publish('eventsUpdated', events);
        },
        
        setDetectedObjects: function(objects) {
            state.detectedObjects = objects;
            eventBus.publish('objectsUpdated', objects);
        },
        
        // Event system
        on: function(event, callback) {
            return eventBus.subscribe(event, callback);
        },
        
        // Simulation controls
        startPlayback: function() {
            state.isPlaying = true;
            eventBus.publish('playbackStateChanged', true);
        },
        
        stopPlayback: function() {
            state.isPlaying = false;
            eventBus.publish('playbackStateChanged', false);
        },
        
        isPlaying: function() {
            return state.isPlaying;
        },
        
        setPlaybackSpeed: function(speed) {
            state.playbackSpeed = speed;
            eventBus.publish('playbackSpeedChanged', speed);
        },
        
        getPlaybackSpeed: function() {
            return state.playbackSpeed;
        }
    };
})();