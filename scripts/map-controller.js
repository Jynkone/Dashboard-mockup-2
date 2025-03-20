/**
 * Map Controller
 * Manages the map view, markers, layers, and interactions
 */
const MapController = (function() {
    // DOM elements
    let mapContainer;
    let mapOverlay;
    let mapControls;
    
    // Map state
    let mapElements = {
        drones: {},
        checkpoints: {},
        objects: {},
        paths: {},
        thermal: {}
    };
    
    // Map dimensions
    let mapWidth;
    let mapHeight;
    
    // Initialize the map
    function init() {
        // Cache DOM elements
        mapContainer = document.getElementById('facilityMap');
        mapOverlay = document.querySelector('.map-overlay');
        mapControls = document.querySelector('.map-controls');
        
        // Update map dimensions
        updateMapDimensions();
        
        // Initialize map layers
        initializeMapLayers();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up state subscriptions
        setupStateSubscriptions();
    }
    
    // Update map dimensions
    function updateMapDimensions() {
        if (!mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        mapWidth = rect.width;
        mapHeight = rect.height;
    }
    
    // Initialize map layers
// Update the initializeMapLayers function in map-controller.js

function initializeMapLayers() {
    // Load background map image first
    const mapImage = document.createElement('img');
    mapImage.src = 'images/facility-map.png'; // Ensure this path points to your satellite image
    mapImage.className = 'map-image';
    mapImage.alt = 'Facility Map';
    mapContainer.appendChild(mapImage);
    
    // Create drone layer
    const droneLayer = document.createElement('div');
    droneLayer.className = 'drone-layer';
    mapOverlay.appendChild(droneLayer);
    
    // Create checkpoint layer
    const checkpointLayer = document.createElement('div');
    checkpointLayer.className = 'checkpoint-layer';
    mapOverlay.appendChild(checkpointLayer);
    
    // Create objects layer
    const objectsLayer = document.createElement('div');
    objectsLayer.className = 'objects-layer';
    mapOverlay.appendChild(objectsLayer);
    
    // Create paths layer
    const pathsLayer = document.createElement('div');
    pathsLayer.className = 'drone-path';
    pathsLayer.style.display = 'none';
    mapOverlay.appendChild(pathsLayer);
    
    // Create thermal overlay
    const thermalOverlay = document.createElement('div');
    thermalOverlay.className = 'thermal-overlay';
    mapOverlay.appendChild(thermalOverlay);
    
    // Create thermal history overlay
    const thermalHistoryOverlay = document.createElement('div');
    thermalHistoryOverlay.className = 'thermal-overlay thermal-history';
    thermalHistoryOverlay.style.opacity = '0.3';
    thermalHistoryOverlay.style.display = 'none';
    mapOverlay.appendChild(thermalHistoryOverlay);
}    
    // Set up event listeners
    function setupEventListeners() {
        // Map zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            // Implement zoom functionality
            console.log('Zoom in');
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            // Implement zoom functionality
            console.log('Zoom out');
        });
        
        // Layer visibility toggles
        document.querySelectorAll('.layer-menu input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const layer = this.getAttribute('data-layer');
                DashboardState.setLayerVisibility(layer, this.checked);
            });
        });
        
        // Thermal view toggle
        document.getElementById('thermalViewToggle').addEventListener('click', function() {
            const newState = !DashboardState.isThermalViewActive();
            DashboardState.setThermalView(newState);
            this.classList.toggle('active', newState);
        });
        
        // Patrol routes toggle
        document.getElementById('patrolViewToggle').addEventListener('click', function() {
            const newState = !DashboardState.isPatrolViewActive();
            DashboardState.setPatrolView(newState);
            this.classList.toggle('active', newState);
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            updateMapDimensions();
            // Redraw elements based on new dimensions
            renderMap();
        });
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle drone updates
        DashboardState.on('dronesUpdated', (drones) => {
            renderDrones(drones);
        });
        
        // Handle active drone changes
        DashboardState.on('activeDroneChanged', (droneId) => {
            highlightDrone(droneId);
        });
        
        // Handle checkpoint updates
        DashboardState.on('checkpointsUpdated', (checkpoints) => {
            renderCheckpoints(checkpoints);
        });
        
        // Handle checkpoint selection
        DashboardState.on('checkpointSelected', (checkpointId) => {
            highlightCheckpoint(checkpointId);
        });
        
        // Handle detected objects
        DashboardState.on('objectsUpdated', (objects) => {
            renderDetectedObjects(objects);
        });
        
        // Handle object selection
        DashboardState.on('objectSelected', (objectId) => {
            highlightObject(objectId);
        });
        
        // Handle layer visibility changes
        DashboardState.on('layerVisibilityChanged', (data) => {
            updateLayerVisibility(data.layer, data.visible);
        });
        
        // Handle thermal view changes
        DashboardState.on('thermalViewChanged', (active) => {
            toggleThermalView(active);
        });
        
        // Handle patrol view changes
        DashboardState.on('patrolViewChanged', (active) => {
            togglePatrolView(active);
        });
        
        // Handle timeline changes
        DashboardState.on('timelinePositionChanged', (data) => {
            updateMapForTime(data.time);
        });
    }
    
    // Render drones on the map
    // In map-controller.js - Update the renderDrones function
function renderDrones(drones) {
    const droneLayer = mapOverlay.querySelector('.drone-layer');
    droneLayer.innerHTML = '';
    
    drones.forEach(drone => {
        // Skip drones filtered out based on current filters
        if (
            (!DashboardState.isDroneFilterActive('thermal') && drone.features.includes('thermal')) ||
            (!DashboardState.isDroneFilterActive('optical') && drone.features.includes('optical')) ||
            (DashboardState.isDroneFilterActive('active') && drone.status !== 'active')
        ) {
            return;
        }
        
        // Create drone marker
        const droneMarker = document.createElement('div');
        droneMarker.className = `drone-marker ${drone.status} tooltip-trigger`;
        droneMarker.setAttribute('data-id', drone.id);
        droneMarker.style.top = `${drone.position.y}%`;
        droneMarker.style.left = `${drone.position.x}%`;
        droneMarker.title = drone.name;
        droneMarker.addEventListener('click', () => {
            DashboardState.setActiveDrone(drone.id);
        });
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Add tooltip content
        tooltip.innerHTML = `
            <strong>${drone.name}</strong>
            <div>Battery: ${drone.battery}%</div>
            <div>Altitude: ${drone.altitude}m</div>
            <div>Features: ${drone.features.join(', ')}</div>
            ${drone.status === 'low-battery' ? '<div class="warning">Low Battery Warning</div>' : ''}
        `;
        
        droneMarker.appendChild(tooltip);
        droneLayer.appendChild(droneMarker);
        
        // Store reference
        mapElements.drones[drone.id] = droneMarker;
    });
}
    // Highlight active drone
    function highlightDrone(droneId) {
        // Remove highlight from all drones
        Object.values(mapElements.drones).forEach(marker => {
            marker.classList.remove('selected');
        });
        
        // Add highlight to active drone
        if (droneId && mapElements.drones[droneId]) {
            mapElements.drones[droneId].classList.add('selected');
            
            // Optionally scroll the drone into view if using a scrollable map
            // mapElements.drones[droneId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
        
    // Render checkpoints on the map
    // In map-controller.js - Update the renderCheckpoints function
function renderCheckpoints(checkpoints) {
    const checkpointLayer = mapOverlay.querySelector('.checkpoint-layer');
    checkpointLayer.innerHTML = '';
    
    checkpoints.forEach(checkpoint => {
        // Create checkpoint element
        const checkpointElement = document.createElement('div');
        checkpointElement.className = `checkpoint ${checkpoint.status} tooltip-trigger`;
        checkpointElement.setAttribute('data-id', checkpoint.id);
        checkpointElement.style.top = `${checkpoint.position.y}%`;
        checkpointElement.style.left = `${checkpoint.position.x}%`;
        checkpointElement.title = checkpoint.name;
        checkpointElement.addEventListener('click', () => {
            DashboardState.setSelectedCheckpoint(checkpoint.id);
        });
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Add tooltip content
        tooltip.innerHTML = `
            <strong>${checkpoint.name} - ${checkpoint.location}</strong>
            <div>Status: ${checkpoint.status.charAt(0).toUpperCase() + checkpoint.status.slice(1)}</div>
            <div>Last checked: ${Utils.formatRelativeTime(checkpoint.lastChecked)}</div>
        `;
        
        checkpointElement.appendChild(tooltip);
        checkpointLayer.appendChild(checkpointElement);
        
        // Store reference
        mapElements.checkpoints[checkpoint.id] = checkpointElement;
    });
}
    // Highlight selected checkpoint
    function highlightCheckpoint(checkpointId) {
        // Remove highlight from all checkpoints
        Object.values(mapElements.checkpoints).forEach(marker => {
            marker.classList.remove('selected');
            marker.style.boxShadow = 'none';
        });
        
        // Add highlight to selected checkpoint
        if (checkpointId && mapElements.checkpoints[checkpointId]) {
            const checkpoint = DashboardState.getSelectedCheckpoint();
            if (checkpoint) {
                const color = Utils.getStatusColor(checkpoint.status);
                mapElements.checkpoints[checkpointId].classList.add('selected');
                mapElements.checkpoints[checkpointId].style.boxShadow = `0 0 15px ${color}`;
            }
        }
    }
        
    // Render detected objects on the map
// In map-controller.js - Update the renderDetectedObjects function
function renderDetectedObjects(objects) {
    const objectsLayer = mapOverlay.querySelector('.objects-layer');
    objectsLayer.innerHTML = '';
    
    objects.forEach(object => {
        // Skip objects filtered out based on current filters
        if (!DashboardState.isFilterActive(object.type.toLowerCase())) {
            return;
        }
        
        // Create object marker
        const objectMarker = document.createElement('div');
        objectMarker.className = `object-marker ${object.type.toLowerCase()} ${object.authorized ? '' : 'unauthorized'} tooltip-trigger`;
        objectMarker.setAttribute('data-id', object.id);
        objectMarker.style.top = `${object.position.y}%`;
        objectMarker.style.left = `${object.position.x}%`;
        objectMarker.title = `${object.type} ${object.authorized ? '' : '(Unauthorized)'}`;
        objectMarker.addEventListener('click', () => {
            DashboardState.setSelectedObject(object.id);
        });
        
        // Add direction indicator if moving
        if (object.direction !== undefined) {
            const indicator = document.createElement('div');
            indicator.className = 'direction-indicator';
            indicator.style.transform = `translateY(-100%) rotate(${object.direction}deg)`;
            objectMarker.appendChild(indicator);
        }
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Add tooltip content
        tooltip.innerHTML = `
            <strong>${object.type} ${object.authorized ? '' : '(Unauthorized)'}</strong>
            <div>Detected: ${Utils.formatRelativeTime(object.timestamp)}</div>
            <div>Location: ${object.location}</div>
            <div>Confidence: ${object.confidence}%</div>
        `;
        
        objectMarker.appendChild(tooltip);
        objectsLayer.appendChild(objectMarker);
        
        // Store reference
        mapElements.objects[object.id] = objectMarker;
    });
}    
    // Highlight selected object
    function highlightObject(objectId) {
        // Remove highlight from all objects
        Object.values(mapElements.objects).forEach(marker => {
            marker.style.boxShadow = 'none';
            marker.style.zIndex = '12';
        });
        
        // Add highlight to selected object
        if (objectId && mapElements.objects[objectId]) {
            const obj = DashboardState.getSelectedObject();
            const color = Utils.getObjectTypeColor(obj.type);
            
            mapElements.objects[objectId].style.boxShadow = `0 0 10px ${color}`;
            mapElements.objects[objectId].style.zIndex = '14';
        }
    }
    
    // Update layer visibility
    function updateLayerVisibility(layer, visible) {
        switch (layer) {
            case 'drones':
                mapOverlay.querySelector('.drone-layer').style.display = visible ? 'block' : 'none';
                break;
            case 'checkpoints':
                mapOverlay.querySelector('.checkpoint-layer').style.display = visible ? 'block' : 'none';
                break;
            case 'thermal-history':
                mapOverlay.querySelector('.thermal-history').style.display = visible ? 'block' : 'none';
                break;
            case 'objects':
                mapOverlay.querySelector('.objects-layer').style.display = visible ? 'block' : 'none';
                break;
            case 'paths':
                mapOverlay.querySelector('.drone-path').style.display = visible ? 'block' : 'none';
                break;
        }
    }
    
    // Toggle thermal view
    function toggleThermalView(active) {
        const thermalOverlay = mapOverlay.querySelector('.thermal-overlay:not(.thermal-history)');
        thermalOverlay.style.display = active ? 'block' : 'none';
    }
    
    // Toggle patrol paths view
    function togglePatrolView(active) {
        const pathsLayer = mapOverlay.querySelector('.drone-path');
        
        if (active) {
            // Generate drone paths (in real implementation, this would use actual path data)
            renderDronePaths(DashboardState.getDrones());
            pathsLayer.style.display = 'block';
        } else {
            pathsLayer.style.display = 'none';
        }
    }
    
    // Render drone patrol paths
    function renderDronePaths(drones) {
        const pathsLayer = mapOverlay.querySelector('.drone-path');
        pathsLayer.innerHTML = '';
        
        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        drones.forEach(drone => {
            // Skip if drone has no path data
            if (!drone.path || !drone.path.length) return;
            
            // Generate path data
            const pathData = drone.path.map((point, index) => {
                return (index === 0 ? 'M' : 'L') + `${point.x}% ${point.y}%`;
            }).join(' ');
            
            // Create path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'path-line');
            path.setAttribute('data-drone-id', drone.id);
            svg.appendChild(path);
            
            // Add waypoints
drone.path.forEach((point, index) => {
    const waypoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    waypoint.setAttribute('cx', `${point.x}%`);
    waypoint.setAttribute('cy', `${point.y}%`);
    waypoint.setAttribute('r', '3');
    waypoint.setAttribute('class', 'waypoint');
    svg.appendChild(waypoint);
});
});

pathsLayer.appendChild(svg);
}

// Update map for specific time
function updateMapForTime(time) {
// In a real implementation, this would fetch historical data for the given time
// and update all map elements accordingly

// For now, we'll just update the timestamp display in the drone feed
const feedTime = document.querySelector('.feed-time');
if (feedTime) {
feedTime.textContent = Utils.formatTime(time);
}

// Simulate updating map elements based on time
simulateHistoricalState(time);
}

// Simulate historical state (for demo purposes)
function simulateHistoricalState(time) {
// This is a simplified simulation that would be replaced by real
// historical data in a production implementation

// Get current time percentage in the 24-hour range
const now = new Date();
const timePercent = (now - time) / (24 * 60 * 60 * 1000) * 100;

// Update checkpoint statuses based on time
const checkpoints = DashboardState.getCheckpoints();
checkpoints.forEach(checkpoint => {
let newStatus = 'normal';

// Simulate different status at different times
if (checkpoint.id === 'checkpointA' && timePercent > 75) {
    newStatus = 'caution';
} else if (checkpoint.id === 'checkpointB' && timePercent > 50) {
    newStatus = 'critical';
} else if (checkpoint.id === 'checkpointC' && timePercent > 25) {
    newStatus = 'caution';
}

// Update checkpoint element if status changed
if (checkpoint.status !== newStatus && mapElements.checkpoints[checkpoint.id]) {
    mapElements.checkpoints[checkpoint.id].className = `checkpoint ${newStatus}`;
    
    // Also update the state
    checkpoint.status = newStatus;
}
});
}

// Render the entire map
function renderMap() {
renderDrones(DashboardState.getDrones());
renderCheckpoints(DashboardState.getCheckpoints());
renderDetectedObjects(DashboardState.getDetectedObjects());

if (DashboardState.isPatrolViewActive()) {
renderDronePaths(DashboardState.getDrones());
}
}

// Public API
return {
init,
renderMap,
updateMapDimensions
};
})();