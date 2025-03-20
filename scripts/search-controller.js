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
        
        // For this implementation, we'll show results in the event carousel
        // In a real implementation, this would be a more sophisticated search results view
        
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
}

// Display search results in the event carousel
function displaySearchResultsInCarousel(searchEvents) {
const carousel = document.getElementById('eventCarousel');
carousel.innerHTML = '';

// Add search result header
const header = document.createElement('div');
header.className = 'search-results-header';
header.textContent = `Found ${searchEvents.length} results`;
carousel.appendChild(header);

// Add event cards
searchEvents.forEach(event => {
    const card = document.createElement('div');
    card.className = `event-card ${event.type.toLowerCase()}`;
    card.setAttribute('data-id', event.id);
    card.setAttribute('data-result-type', event.resultType);
    card.setAttribute('data-original-id', event.originalId || event.id);
    
    card.addEventListener('click', () => {
        handleSearchResultClick(event);
    });
    
    // Card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'event-card-header';
    
    const eventType = document.createElement('div');
    eventType.className = 'event-type';
    eventType.textContent = event.type;
    
    const eventTime = document.createElement('div');
    eventTime.className = 'event-time';
    eventTime.textContent = Utils.formatRelativeTime(event.timestamp);
    
    cardHeader.appendChild(eventType);
    cardHeader.appendChild(eventTime);
    
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
    
    // Result type
    const resultType = document.createElement('div');
    resultType.className = 'event-result-type';
    resultType.textContent = `Result Type: ${event.resultType.charAt(0).toUpperCase() + event.resultType.slice(1)}`;
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(thumbnail);
    card.appendChild(description);
    card.appendChild(location);
    card.appendChild(resultType);
    
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
performSearch
};
})();