/**
 * Main JavaScript entry point
 * Initializes all controllers and loads mock data
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all controllers
    MapController.init();
    DroneController.init();
    AlertsController.init();
    TimelineController.init();
    SearchController.init();
    ReportsController.init();
    
    // Setup global event handlers
    setupGlobalEventHandlers();
    
    // Load initial mock data
    loadMockData();
    
    // Initialize any remaining components
    initializeModals();
    initializeEventCarousel();

        // Make sure carousel is hidden initially
        document.getElementById('eventCarousel').style.display = 'none';
    
        // Adjust map size
        adjustMapSize();
    
});

// Set up global event handlers
function setupGlobalEventHandlers() {
    // Close modal when clicking X or outside the modal
    document.querySelectorAll('.close-modal').forEach(closeButton => {
        closeButton.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close panel when clicking X
    document.querySelectorAll('.close-panel').forEach(closeButton => {
        closeButton.addEventListener('click', function() {
            this.closest('.panel-overlay').style.display = 'none';
        });
    });
    
    // Close modals/panels when clicking outside content
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal, .panel-overlay').forEach(element => {
            if (event.target === element) {
                element.style.display = 'none';
            }
        });
    });
    
    // Reports button
    document.getElementById('reportsButton').addEventListener('click', function() {
        document.getElementById('reportsPanel').style.display = 'flex';
    });
    
    // Filter toggles
    document.querySelectorAll('.filter-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const filter = this.getAttribute('data-filter');
            DashboardState.setFilter(filter, this.checked);
        });
    });
    
    // Drone filter toggles
    document.querySelectorAll('.drone-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const filter = this.getAttribute('data-drone');
            DashboardState.setDroneFilter(filter, this.checked);
        });
    });
    
    // Carousel navigation
    document.getElementById('prevEvent').addEventListener('click', function() {
        navigateCarousel(-1);
    });
    
    document.getElementById('nextEvent').addEventListener('click', function() {
        navigateCarousel(1);
    });

        // Close carousel button
        document.getElementById('closeCarousel').addEventListener('click', function() {
            SearchController.hideEventCarousel();
        });
        
        // Make search button show carousel with results
        document.getElementById('searchButton').addEventListener('click', function() {
            const searchInput = document.getElementById('globalSearch');
            if (searchInput.value.trim()) {
                SearchController.performSearch(searchInput.value);
            }
        });
        
        // Also trigger search on Enter key
        document.getElementById('globalSearch').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                SearchController.performSearch(this.value);
            }
        });
    
}

// Initialize modal components
function initializeModals() {
    // Set up tab switching in reports panel
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Deactivate all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Activate selected button
            this.classList.add('active');
        });
    });

    document.querySelectorAll('.layer-menu input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const layer = this.getAttribute('data-layer');
            const visible = this.checked;
            
            DashboardState.setLayerVisibility(layer, visible);
            
            // Provide immediate visual feedback
            switch (layer) {
                case 'drones':
                    document.querySelector('.drone-layer').style.display = visible ? 'block' : 'none';
                    break;
                case 'checkpoints':
                    document.querySelector('.checkpoint-layer').style.display = visible ? 'block' : 'none';
                    break;
                case 'thermal-history':
                    document.querySelector('.thermal-history').style.display = visible ? 'block' : 'none';
                    break;
                case 'objects':
                    document.querySelector('.objects-layer').style.display = visible ? 'block' : 'none';
                    break;
                case 'paths':
                    document.querySelector('.drone-path').style.display = visible ? 'block' : 'none';
                    break;
            }
        });
    });

    
    // Add export handlers
    document.getElementById('exportPDF').addEventListener('click', function() {
        alert('Exporting report as PDF...');
    });
    
    document.getElementById('exportCSV').addEventListener('click', function() {
        alert('Exporting data as CSV...');
    });
}

// Initialize event carousel
function initializeEventCarousel() {
    // This will be automatically updated when events are selected
    DashboardState.on('eventsUpdated', (events) => {
        renderEventCarousel(events);
    });
    
    DashboardState.on('eventSelected', (eventId) => {
        highlightCarouselCard(eventId);
    });
}

function adjustMapSize() {
    const mapContainer = document.querySelector('.map-container');
    const carousel = document.getElementById('eventCarousel');
    
    if (carousel.style.display === 'none') {
        // Carousel is hidden, give more space to map
        mapContainer.style.height = 'calc(100% - 120px)'; // Just account for timeline
    } else {
        // Carousel is visible, reduce map size
        mapContainer.style.height = 'calc(100% - 220px)'; // Account for timeline and carousel
    }
    
    // Update map dimensions in the controller
    if (MapController && MapController.updateMapDimensions) {
        MapController.updateMapDimensions();
    }
}



// Navigate carousel
function navigateCarousel(direction) {
    const carousel = document.getElementById('eventCarousel');
    const scrollAmount = direction * 220; // Approximate card width + gap
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

// Render event carousel
function renderEventCarousel(events) {
    const carousel = document.getElementById('eventCarousel');
    carousel.innerHTML = '';
    
    // Filter events based on current filters
    const filteredEvents = events.filter(event => 
        DashboardState.isFilterActive(event.type.toLowerCase()) &&
        DashboardState.isFilterActive(event.severity.toLowerCase())
    );
    
    // Sort events by timestamp (newest first)
    const sortedEvents = filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
    
    // Add event cards
    sortedEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = `event-card ${event.type.toLowerCase()}`;
        card.setAttribute('data-id', event.id);
        card.addEventListener('click', () => {
            DashboardState.setSelectedEvent(event.id);
        });
        
        // Card header
        const header = document.createElement('div');
        header.className = 'event-card-header';
        
        const eventType = document.createElement('div');
        eventType.className = 'event-type';
        eventType.textContent = event.type;
        
        const eventTime = document.createElement('div');
        eventTime.className = 'event-time';
        eventTime.textContent = Utils.formatRelativeTime(event.timestamp);
        
        header.appendChild(eventType);
        header.appendChild(eventTime);
        
        // Thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'event-thumbnail';
        
        if (event.imageUrl) {
            const img = document.createElement('img');
            img.src = event.imageUrl;
            img.alt = event.type;
            thumbnail.appendChild(img);
        }
        
        // Description
        const description = document.createElement('div');
        description.className = 'event-description';
        description.textContent = event.description;
        
        // Location
        const location = document.createElement('div');
        location.className = 'event-location';
        location.textContent = event.location;
        
        // Assemble card
        card.appendChild(header);
        card.appendChild(thumbnail);
        card.appendChild(description);
        card.appendChild(location);
        
        carousel.appendChild(card);
    });
}

// Highlight carousel card
// In main.js - Update the highlightCarouselCard function
function highlightCarouselCard(eventId) {
    // Remove highlight from all cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add highlight to selected card
    const card = document.querySelector(`.event-card[data-id="${eventId}"]`);
    if (card) {
        card.classList.add('selected');
        
        // Scroll card into view with smooth behavior
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        
        // Add temporary flash effect
        card.classList.add('flash');
        setTimeout(() => {
            card.classList.remove('flash');
        }, 500);
    }
}
// Load mock data for demonstration
function loadMockData() {
    // Load mock drones
    const drones = [
        {
            id: 'drone1',
            name: 'Drone 1',
            status: 'active',
            battery: 78,
            altitude: 35,
            speed: 12,
            signal: 'Strong',
            position: { x: 35, y: 25 },
            features: ['thermal', 'optical'],
            location: 'South Perimeter',
            path: [
                { x: 35, y: 25 },
                { x: 40, y: 30 },
                { x: 45, y: 40 },
                { x: 50, y: 35 },
                { x: 55, y: 25 }
            ],
            detections: [
                {
                    type: 'Person',
                    position: { x: 60, y: 50 },
                    size: { width: 60, height: 120 },
                    confidence: 98
                }
            ]
        },
        {
            id: 'drone2',
            name: 'Drone 2',
            status: 'active',
            battery: 65,
            altitude: 42,
            speed: 15,
            signal: 'Strong',
            position: { x: 65, y: 65 },
            features: ['optical'],
            location: 'East Gate',
            path: [
                { x: 65, y: 65 },
                { x: 70, y: 60 },
                { x: 75, y: 55 },
                { x: 80, y: 60 },
                { x: 85, y: 65 }
            ]
        },
        {
            id: 'drone3',
            name: 'Drone 3',
            status: 'low-battery',
            battery: 15,
            altitude: 28,
            speed: 8,
            signal: 'Moderate',
            position: { x: 25, y: 45 },
            features: ['thermal', 'optical', 'zoom'],
            location: 'North Facility',
            path: [
                { x: 25, y: 45 },
                { x: 20, y: 40 },
                { x: 15, y: 35 },
                { x: 10, y: 30 },
                { x: 5, y: 25 }
            ]
        }
    ];
    
    // Load mock checkpoints
    const checkpoints = [
        {
            id: 'checkpointA',
            name: 'Checkpoint A',
            location: 'South Perimeter',
            status: 'normal',
            position: { x: 40, y: 30 },
            lastChecked: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
        },
        {
            id: 'checkpointB',
            name: 'Checkpoint B',
            location: 'East Gate',
            status: 'caution',
            position: { x: 70, y: 60 },
            lastChecked: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        {
            id: 'checkpointC',
            name: 'Checkpoint C',
            location: 'North Facility',
            status: 'critical',
            position: { x: 20, y: 40 },
            lastChecked: new Date() // Just now
        }
    ];
    
    // Load mock alerts
    const alerts = [
        {
            id: 'alert1',
            type: 'Unauthorized Person',
            severity: 'High',
            message: 'Unauthorized personnel detected in restricted area',
            timestamp: new Date(),
            location: 'North Facility',
            acknowledged: false,
            checkpointId: 'checkpointC',
            droneId: 'drone3',
            imageUrl: 'images/alert1.jpg'
        },
        {
            id: 'alert2',
            type: 'Thermal Anomaly',
            severity: 'Medium',
            message: 'Thermal anomaly detected near equipment',
            timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
            location: 'East Gate',
            acknowledged: false,
            checkpointId: 'checkpointB',
            droneId: 'drone2',
            imageUrl: 'images/alert2.jpg'
        },
        {
            id: 'alert3',
            type: 'Drone Battery Low',
            severity: 'Low',
            message: 'Drone battery at 15%, returning to base',
            timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            location: 'North Facility',
            acknowledged: false,
            droneId: 'drone3'
        },
        {
            id: 'alert4',
            type: 'Routine Patrol',
            severity: 'Low',
            message: 'Routine patrol completed successfully',
            timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
            location: 'South Perimeter',
            acknowledged: true,
            droneId: 'drone1'
        }
    ];
    
    // Load mock detected objects
    const objects = [
        {
            id: 'object1',
            type: 'Person',
            authorized: false,
            position: { x: 20, y: 40 },
            timestamp: new Date(),
            location: 'North Facility',
            confidence: 98,
            direction: 45 // Direction in degrees
        },
        {
            id: 'object2',
            type: 'Vehicle',
            authorized: true,
            position: { x: 70, y: 60 },
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            location: 'East Gate',
            confidence: 95,
            direction: 180
        },
        {
            id: 'object3',
            type: 'Person',
            authorized: true,
            position: { x: 40, y: 30 },
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            location: 'South Perimeter',
            confidence: 92
        }
    ];
    
    // Load mock events
    const events = [
        {
            id: 'event1',
            type: 'Person',
            severity: 'High',
            description: 'Unauthorized person detected in restricted area',
            location: 'North Facility',
            timestamp: new Date(Date.now() - 1 * 60 * 1000),
            imageUrl: 'images/event1.jpg'
        },
        {
            id: 'event2',
            type: 'Vehicle',
            severity: 'Medium',
            description: 'Unknown vehicle at east gate',
            location: 'East Gate',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            imageUrl: 'images/event2.jpg'
        },
        {
            id: 'event3',
            type: 'Thermal',
            severity: 'Medium',
            description: 'Thermal anomaly detected near equipment',
            location: 'East Gate',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            imageUrl: 'images/event3.jpg'
        },
        {
            id: 'event4',
            type: 'Checkpoint',
            severity: 'Low',
            description: 'Checkpoint status changed to normal',
            location: 'South Perimeter',
            timestamp: new Date(Date.now() - 20 * 60 * 1000)
        },
        {
            id: 'event5',
            type: 'Person',
            severity: 'Low',
            description: 'Authorized personnel entering facility',
            location: 'South Perimeter',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            imageUrl: 'images/event5.jpg'
        }
    ];
    
    // Update state with mock data
    DashboardState.setDrones(drones);
    DashboardState.setCheckpoints(checkpoints);
    
    // Set alerts one by one to trigger UI updates
    alerts.forEach(alert => {
        DashboardState.addAlert(alert);
    });
    
    DashboardState.setDetectedObjects(objects);
    DashboardState.setEvents(events);
    
    // Set default selections
    DashboardState.setActiveDrone('drone1');
    DashboardState.setTimelinePosition(30);

    MapController.renderMap();
    AlertsController.renderAlerts();
    TimelineController.renderEvents(DashboardState.getEvents());
    
    // Set default selections
    DashboardState.setActiveDrone('drone1');
    DashboardState.setTimelinePosition(30);
    
    // Make sure UI controls reflect state
    document.querySelectorAll('.toggle-button').forEach(button => {
        const id = button.id;
        if (id === 'thermalViewToggle') {
            button.classList.toggle('active', DashboardState.isThermalViewActive());
        } else if (id === 'patrolViewToggle') {
            button.classList.toggle('active', DashboardState.isPatrolViewActive());
        }
    });

}