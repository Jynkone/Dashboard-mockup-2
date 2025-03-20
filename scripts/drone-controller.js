/**
 * Drone Controller
 * Manages drone feeds, telemetry data, and drone-related functionality
 */
const DroneController = (function() {
    // DOM elements
    let droneFeed;
    let telemetryStats;
    let activeDroneTitle;
    
    // Drone feed elements
    let feedOptical;
    let feedThermal;
    let feedZoom;
    let feedOverlay;
    let feedHeader;
    let feedFooter;
    
    // Active camera view
    let activeView = 'optical';
    
    // Initialize drone controller
    function init() {
        // Cache DOM elements
        droneFeed = document.getElementById('droneFeed');
        telemetryStats = document.getElementById('telemetryStats');
        activeDroneTitle = document.getElementById('activeDroneTitle');
        
        // Set up drone feed
        setupDroneFeed();
        
        // Set up telemetry display
        setupTelemetryDisplay();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up state subscriptions
        setupStateSubscriptions();
    }
    
    // Set up drone feed elements
    function setupDroneFeed() {
        // Create feed container
        const feedWrapper = document.createElement('div');
        feedWrapper.className = 'feed-wrapper';
        
        // Create feed images for different camera types
        feedOptical = document.createElement('img');
        feedOptical.className = 'feed-optical';
        feedOptical.src = 'images/feed-optical.jpg'; // Placeholder
        feedOptical.alt = 'Drone Optical Feed';
        
        feedThermal = document.createElement('img');
        feedThermal.className = 'feed-thermal';
        feedThermal.src = 'images/feed-thermal.jpg'; // Placeholder
        feedThermal.alt = 'Drone Thermal Feed';
        feedThermal.style.display = 'none';
        
        feedZoom = document.createElement('img');
        feedZoom.className = 'feed-zoom';
        feedZoom.src = 'images/feed-zoom.jpg'; // Placeholder
        feedZoom.alt = 'Drone Zoom Feed';
        feedZoom.style.display = 'none';
        
        // Create feed overlay
        feedOverlay = document.createElement('div');
        feedOverlay.className = 'drone-feed-overlay';
        
        // Create feed header
        feedHeader = document.createElement('div');
        feedHeader.className = 'drone-feed-header';
        
        const feedType = document.createElement('span');
        feedType.className = 'feed-type';
        feedType.textContent = 'Optical';
        
        const feedTime = document.createElement('span');
        feedTime.className = 'feed-time';
        feedTime.textContent = Utils.formatTime(new Date());
        
        feedHeader.appendChild(feedType);
        feedHeader.appendChild(feedTime);
        
        // Create feed footer
        feedFooter = document.createElement('div');
        feedFooter.className = 'drone-feed-footer';
        feedFooter.textContent = 'Awaiting drone selection';
        
        // Assemble feed overlay
        feedOverlay.appendChild(feedHeader);
        feedOverlay.appendChild(feedFooter);
        
        // Add AI detection box (as an example)
        const detectionBox = document.createElement('div');
        detectionBox.className = 'detection-box person';
        detectionBox.style.top = '50%';
        detectionBox.style.left = '60%';
        detectionBox.style.width = '60px';
        detectionBox.style.height = '120px';
        
        const detectionLabel = document.createElement('div');
        detectionLabel.className = 'detection-label person';
        detectionLabel.textContent = 'Person';
        
        const confidenceScore = document.createElement('div');
        confidenceScore.className = 'confidence-score';
        confidenceScore.textContent = '98%';
        
        detectionBox.appendChild(detectionLabel);
        detectionBox.appendChild(confidenceScore);
        feedOverlay.appendChild(detectionBox);
        
        // Assemble feed wrapper
        feedWrapper.appendChild(feedOptical);
        feedWrapper.appendChild(feedThermal);
        feedWrapper.appendChild(feedZoom);
        feedWrapper.appendChild(feedOverlay);
        
        // Add to drone feed container
        droneFeed.innerHTML = '';
        droneFeed.appendChild(feedWrapper);
    }
    
    // Set up telemetry display
    function setupTelemetryDisplay() {
        // Create telemetry stat items
        const statItems = [
            { label: 'Altitude', value: '-', id: 'altitude' },
            { label: 'Speed', value: '-', id: 'speed' },
            { label: 'Battery', value: '-', id: 'battery' },
            { label: 'Signal', value: '-', id: 'signal' }
        ];
        
        telemetryStats.innerHTML = '';
        
        // Create and add stat items
        statItems.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.id = `stat-${stat.id}`;
            
            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label;
            
            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            statValue.textContent = stat.value;
            
            statItem.appendChild(statLabel);
            statItem.appendChild(statValue);
            telemetryStats.appendChild(statItem);
        });
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Toggle between camera views
        document.querySelectorAll('.view-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                setActiveCameraView(view);
                
                // Update button UI
                document.querySelectorAll('.view-toggle').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            });
        });
        
        // Set optical view as active by default
        document.querySelector('.view-toggle[data-view="optical"]').classList.add('active');
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle active drone changes
        DashboardState.on('activeDroneChanged', (droneId) => {
            updateDroneFeed(droneId);
        });
        
        // Handle timeline position changes
        DashboardState.on('timelinePositionChanged', (data) => {
            updateFeedTimestamp(data.time);
        });
    }
    
    // Update drone feed for the selected drone
    function updateDroneFeed(droneId) {
        const drone = DashboardState.getActiveDrone();
        
        if (!drone) {
            // No drone selected
            activeDroneTitle.textContent = 'DRONE FEED';
            feedFooter.textContent = 'No drone selected';
            updateTelemetry({
                altitude: '-',
                speed: '-',
                battery: '-',
                signal: '-'
            });
            return;
        }
        
        // Update title
        activeDroneTitle.textContent = `${drone.name.toUpperCase()} FEED`;
        
        // Update feed location
        feedFooter.textContent = drone.location || 'Unknown location';
        
        // Update feed images (in a real implementation, these would come from live feeds)
        feedOptical.src = `images/${drone.id}-optical.jpg`;
        feedThermal.src = `images/${drone.id}-thermal.jpg`;
        feedZoom.src = `images/${drone.id}-zoom.jpg`;
        
        // Update telemetry
        updateTelemetry({
            altitude: `${drone.altitude} m`,
            speed: `${drone.speed} km/h`,
            battery: `${drone.battery}%`,
            signal: drone.signal
        });
        
        // Update detections based on active drone
        updateDetections(drone.detections || []);
    }
    
    // Update telemetry display
    function updateTelemetry(data) {
        if (data.altitude) {
            document.querySelector('#stat-altitude .stat-value').textContent = data.altitude;
        }
        
        if (data.speed) {
            document.querySelector('#stat-speed .stat-value').textContent = data.speed;
        }
        
        if (data.battery) {
            const batteryValue = document.querySelector('#stat-battery .stat-value');
            batteryValue.textContent = data.battery;
            
            // Change color based on battery level
            if (data.battery !== '-') {
                const percentage = parseInt(data.battery);
                if (percentage < 30) {
                    batteryValue.style.color = '#e74c3c';
                } else if (percentage < 50) {
                    batteryValue.style.color = '#f39c12';
                } else {
                    batteryValue.style.color = '';
                }
            }
        }
        
        if (data.signal) {
            document.querySelector('#stat-signal .stat-value').textContent = data.signal;
        }
    }
    
    // Update AI detection overlays
    // In drone-controller.js - Enhance the updateDetections function
function updateDetections(detections) {
    // Remove existing detection boxes
    document.querySelectorAll('.detection-box').forEach(box => {
        box.remove();
    });
    
    // Add new detection boxes
    detections.forEach(detection => {
        // Create detection box
        const detectionBox = document.createElement('div');
        detectionBox.className = `detection-box ${detection.type.toLowerCase()}`;
        detectionBox.style.top = `${detection.position.y}%`;
        detectionBox.style.left = `${detection.position.x}%`;
        detectionBox.style.width = `${detection.size.width}px`;
        detectionBox.style.height = `${detection.size.height}px`;
        
        // Create detection label
        const detectionLabel = document.createElement('div');
        detectionLabel.className = `detection-label ${detection.type.toLowerCase()}`;
        detectionLabel.textContent = detection.type;
        
        // Create confidence score
        const confidenceScore = document.createElement('div');
        confidenceScore.className = 'confidence-score';
        confidenceScore.textContent = `${detection.confidence}%`;
        
        detectionBox.appendChild(detectionLabel);
        detectionBox.appendChild(confidenceScore);
        feedOverlay.appendChild(detectionBox);
        
        // Add pulse effect for unauthorized entities
        if (detection.type.toLowerCase().includes('unauthorized')) {
            detectionBox.classList.add('pulse');
        }
    });
}
    // Set active camera view (optical, thermal, zoom)
    function setActiveCameraView(view) {
        // Hide all feeds
        feedOptical.style.display = 'none';
        feedThermal.style.display = 'none';
        feedZoom.style.display = 'none';
        
        // Show selected feed
        switch (view) {
            case 'optical':
                feedOptical.style.display = 'block';
                break;
            case 'thermal':
                feedThermal.style.display = 'block';
                break;
            case 'zoom':
                feedZoom.style.display = 'block';
                break;
        }
        
        // Update feed type display
        const feedType = document.querySelector('.feed-type');
        feedType.textContent = view.charAt(0).toUpperCase() + view.slice(1);
        
        // Save active view
        activeView = view;
    }
    
    // Update feed timestamp
    function updateFeedTimestamp(time) {
        const feedTime = document.querySelector('.feed-time');
        if (feedTime) {
            feedTime.textContent = Utils.formatTime(time);
        }
    }
    
    // Public API
    return {
        init,
        updateDroneFeed,
        setActiveCameraView
    };
})();