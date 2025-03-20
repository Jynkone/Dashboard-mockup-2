/**
 * Search Controller
 * Manages search functionality including global search and filters
 */
const SearchController = (function() {
    // DOM elements
    let searchInput;
    let searchButton;
    
    // Initialize search controller
    function init() {
        // Cache DOM elements
        searchInput = document.getElementById('globalSearch');
        searchButton = document.getElementById('searchButton');
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Search button click
        searchButton.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
        
        // Search input enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Close carousel button (if it exists)
        const closeCarouselBtn = document.getElementById('closeCarousel');
        if (closeCarouselBtn) {
            closeCarouselBtn.addEventListener('click', function() {
                hideEventCarousel();
            });
        }
    }
    
    // Perform search
    function performSearch(query) {
        if (!query.trim()) return;
        
        console.log('Searching for:', query);
        
        // Parse search query
        const searchParams = parseSearchQuery(query);
        
        // Search different data sources
        const results = {
            events: searchEvents(searchParams),
            alerts: searchAlerts(searchParams),
            objects: searchObjects(searchParams),
            checkpoints: searchCheckpoints(searchParams)
        };
        
        // Display results
        displaySearchResults(results);
    }
    
    // Parse search query into structured parameters
    function parseSearchQuery(query) {
        const params = {
            text: query.toLowerCase(),
            types: [],
            location: null,
            time: null
        };
        
        // Extract search parameters
        const typeMatches = query.match(/type:([a-z]+)/i);
        if (typeMatches) {
            params.types.push(typeMatches[1].toLowerCase());
            params.text = params.text.replace(typeMatches[0], '').trim();
        }
        
        // Common object types
        ['person', 'vehicle', 'thermal'].forEach(type => {
            if (query.toLowerCase().includes(type)) {
                params.types.push(type);
            }
        });
        
        // Extract location
        const locationMatches = query.match(/location:([a-z\s]+)/i);
        if (locationMatches) {
            params.location = locationMatches[1].trim();
            params.text = params.text.replace(locationMatches[0], '').trim();
        }
        
        // Extract time
        const timeMatches = query.match(/time:([0-9:]+)/i);
        if (timeMatches) {
            params.time = timeMatches[1].trim();
            params.text = params.text.replace(timeMatches[0], '').trim();
        }
        
        return params;
    }
    
    // Search events
    function searchEvents(params) {
        const events = DashboardState.getEvents();
        
        return events.filter(event => {
            // Match by type
            if (params.types.length > 0 && !params.types.includes(event.type.toLowerCase())) {
                return false;
            }
            
            // Match by location
            if (params.location && !event.location.toLowerCase().includes(params.location.toLowerCase())) {
                return false;
            }
            
            // Match by text in description
            if (params.text && !event.description.toLowerCase().includes(params.text)) {
                return false;
            }
            
            return true;
        });
    }
    
    // Search alerts
    function searchAlerts(params) {
        const alerts = DashboardState.getAlerts();
        
        return alerts.filter(alert => {
            // Match by type
            if (params.types.length > 0) {
                const alertType = alert.type.toLowerCase();
                const matchesType = params.types.some(type => 
                    alertType.includes(type)
                );
                
                if (!matchesType) return false;
            }
            
            // Match by location
            if (params.location && !alert.location.toLowerCase().includes(params.location.toLowerCase())) {
                return false;
            }
            
            // Match by text in message
            if (params.text && !alert.message.toLowerCase().includes(params.text)) {
                return false;
            }
            
            return true;
        });
    }
    
    // Search detected objects
    function searchObjects(params) {
        const objects = DashboardState.getDetectedObjects();
        
        return objects.filter(object => {
            // Match by type
            if (params.types.length > 0 && !params.types.includes(object.type.toLowerCase())) {
                return false;
            }
            
            // Match by location
            if (params.location && !object.location.toLowerCase().includes(params.location.toLowerCase())) {
                return false;
            }
            
            return true;
        });
    }
    
    // Search checkpoints
    function searchCheckpoints(params) {
        const checkpoints = DashboardState.getCheckpoints();
        
        return checkpoints.filter(checkpoint => {
            // Match by location
            if (params.location && !checkpoint.location.toLowerCase().includes(params.location.toLowerCase())) {
                return false;
            }
            
            // Match by name or location text
            if (params.text) {
                return checkpoint.name.toLowerCase().includes(params.text) || 
                       checkpoint.location.toLowerCase().includes(params.text);
            }
            
            return true;
        });
    }
    
    // Display search results
    function displaySearchResults(results) {
        const totalResults = results.events.length + 
                            results.alerts.length + 
                            results.objects.length + 
                            results.checkpoints.length;
        
        if (totalResults === 0) {
            alert('No search results found.');
            return;
        }
        
        // Create synthetic events from all result types
        const searchEvents = [];
        
        // Convert alerts to event format
        results.alerts.forEach(alert => {
            searchEvents.push({
                id: `search-alert-${alert.id}`,
                type: 'Alert',
                severity: alert.severity,
                description: alert.message,
                location: alert.location,
                timestamp: alert.timestamp,
                imageUrl: alert.imageUrl,
                originalId: alert.id,
                resultType: 'alert'
            });
        });
        
        // Convert objects to event format
        results.objects.forEach(object => {
            searchEvents.push({
                id: `search-object-${object.id}`,
                type: object.type,
                severity: object.authorized ? 'Low' : 'High',
                description: `${object.authorized ? 'Authorized' : 'Unauthorized'} ${object.type} detected`,
                location: object.location,
                timestamp: object.timestamp,
                originalId: object.id,
                resultType: 'object'
            });
        });
        
        // Convert checkpoints to event format
        results.checkpoints.forEach(checkpoint => {
            searchEvents.push({
                id: `search-checkpoint-${checkpoint.id}`,
                type: 'Checkpoint',
                severity: checkpoint.status === 'normal' ? 'Low' : 
                         checkpoint.status === 'caution' ? 'Medium' : 'High',
                description: `${checkpoint.name} - ${checkpoint.status.charAt(0).toUpperCase() + checkpoint.status.slice(1)} status`,
                location: checkpoint.location,
                timestamp: checkpoint.lastChecked,
                originalId: checkpoint.id,
                resultType: 'checkpoint'
            });
        });
        
        // Add actual events
        results.events.forEach(event => {
            searchEvents.push({
                ...event,
                resultType: 'event'
            });
        });
        
        // Sort by timestamp (newest first)
        searchEvents.sort((a, b) => b.timestamp - a.timestamp);
        
        // Display results in carousel
        displaySearchResultsInCarousel(searchEvents);
        
        // Show the carousel with results count as title
        showEventCarousel(`Found ${searchEvents.length} results`);
    }
    
    // Show the event carousel
    function showEventCarousel(title) {
        const carousel = document.getElementById('eventCarousel');
        const carouselTitle = document.getElementById('carouselTitle');
        
        // Set the title
        if (title && carouselTitle) {
            carouselTitle.textContent = title;
        }
        
        // Show the carousel
        if (carousel) {
            carousel.style.display = 'block';
            
            // Adjust the map container size to make room
            adjustMapSize();
        }
    }
    
    // Hide the carousel
    function hideEventCarousel() {
        const carousel = document.getElementById('eventCarousel');
        if (carousel) {
            carousel.style.display = 'none';
            
            // Readjust the map container size
            adjustMapSize();
        }
    }
    
    // Adjust map size based on carousel visibility
    function adjustMapSize() {
        const mapContainer = document.querySelector('.map-container');
        const carousel = document.getElementById('eventCarousel');
        
        if (!mapContainer || !carousel) return;
        
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
    
    // Display search results in the event carousel
    function displaySearchResultsInCarousel(searchEvents) {
        const carousel = document.getElementById('eventCarouselContainer');
        if (!carousel) return;
        
        carousel.innerHTML = '';
        
        // Add event cards using the utility function
        searchEvents.forEach(event => {
            const card = Utils.createEventCard(event);
            carousel.appendChild(card);
        });
    }
    
    // Handle search result click
    function handleSearchResultClick(event) {
        switch (event.resultType) {
            case 'alert':
                const alert = DashboardState.getAlerts().find(a => a.id === event.originalId);
                if (alert) {
                    // Show the alert on the map and in the alerts panel
                    if (alert.checkpointId) {
                        DashboardState.setSelectedCheckpoint(alert.checkpointId);
                    }
                    
                    if (alert.droneId) {
                        DashboardState.setActiveDrone(alert.droneId);
                    }
                    
                    // Highlight in alerts list
                    const alertItem = document.querySelector(`.alert-item[data-id="${alert.id}"]`);
                    if (alertItem) {
                        alertItem.scrollIntoView({ behavior: 'smooth' });
                        alertItem.classList.add('highlighted');
                        
                        // Remove highlight after a delay
                        setTimeout(() => {
                            alertItem.classList.remove('highlighted');
                        }, 2000);
                    }
                }
                break;
                
            case 'object':
                DashboardState.setSelectedObject(event.originalId);
                break;
                
            case 'checkpoint':
                DashboardState.setSelectedCheckpoint(event.originalId);
                break;
                
            case 'event':
                DashboardState.setSelectedEvent(event.originalId || event.id);
                break;
        }
    }
    
    // Public API
    return {
        init,
        performSearch,
        showEventCarousel,
        hideEventCarousel,
        handleSearchResultClick
    };
})();