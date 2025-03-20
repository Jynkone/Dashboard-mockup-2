/**
 * Timeline Controller
 * Manages the timeline, tracks, events, and playback functionality
 */
const TimelineController = (function() {
    // DOM elements
    let timelineProgress;
    let timelineHandle;
    let currentTimeDisplay;
    let timeRangeSelect;
    let playPauseButton;
    let timeLabels;
    let personTrack;
    let vehicleTrack;
    let thermalTrack;
    let checkpointTrack;
    
    // Timeline state
    let isDragging = false;
    let playbackInterval = null;
    let eventMarkers = [];
    
    // Initialize timeline controller
    function init() {
        // Cache DOM elements
        timelineProgress = document.getElementById('timelineProgress');
        timelineHandle = document.getElementById('timelineHandle');
        currentTimeDisplay = document.getElementById('currentTime');
        timeRangeSelect = document.getElementById('timeRange');
        playPauseButton = document.getElementById('playPause');
        timeLabels = document.getElementById('timeLabels');
        personTrack = document.getElementById('personTrack');
        vehicleTrack = document.getElementById('vehicleTrack');
        thermalTrack = document.getElementById('thermalTrack');
        checkpointTrack = document.getElementById('checkpointTrack');
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up state subscriptions
        setupStateSubscriptions();
        
        // Generate time labels
        generateTimeLabels();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Timeline scrubbing functionality
        timelineHandle.addEventListener('mousedown', function(e) {
            isDragging = true;
            e.preventDefault(); // Prevent text selection
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const trackRect = document.querySelector('.timeline-track-main').getBoundingClientRect();
                const position = ((e.clientX - trackRect.left) / trackRect.width) * 100;
                
                // Keep within bounds
                // Keep within bounds
                if (position >= 0 && position <= 100) {
                    DashboardState.setTimelinePosition(position);
                }
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // Timeline track click
        document.querySelector('.timeline-track-main').addEventListener('click', function(e) {
            if (!isDragging) { // Only trigger if not dragging
                const trackRect = this.getBoundingClientRect();
                const position = ((e.clientX - trackRect.left) / trackRect.width) * 100;
                DashboardState.setTimelinePosition(position);
            }
        });
        
        // Playback controls
        playPauseButton.addEventListener('click', function() {
            togglePlayback();
        });
        
        document.getElementById('skipBack').addEventListener('click', function() {
            const currentPosition = DashboardState.getTimelinePosition();
            DashboardState.setTimelinePosition(Math.max(0, currentPosition - 10));
        });
        
        document.getElementById('skipForward').addEventListener('click', function() {
            const currentPosition = DashboardState.getTimelinePosition();
            DashboardState.setTimelinePosition(Math.min(100, currentPosition + 10));
        });
        
        // Time range selector
        timeRangeSelect.addEventListener('change', function() {
            DashboardState.setTimeRange(parseInt(this.value));
            generateTimeLabels();
        });
        
        // Track label toggling
        document.querySelectorAll('.track-label').forEach(label => {
            label.addEventListener('click', function() {
                const trackType = this.getAttribute('data-track');
                const track = document.querySelector(`.timeline-track[data-track="${trackType}"]`);
                
                if (track) {
                    track.classList.toggle('hidden');
                    this.classList.toggle('disabled');
                }
            });
        });
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle timeline position changes
        DashboardState.on('timelinePositionChanged', (data) => {
            updateTimelineUI(data.position, data.time);
        });
        
        // Handle time range changes
        DashboardState.on('timeRangeChanged', () => {
            generateTimeLabels();
        });
        
        // Handle events updates
        DashboardState.on('eventsUpdated', (events) => {
            renderEvents(events);
        });
        
        // Handle event selection
        DashboardState.on('eventSelected', (eventId) => {
            highlightEvent(eventId);
        });
        
        // Handle playback state changes
        DashboardState.on('playbackStateChanged', (isPlaying) => {
            updatePlaybackUI(isPlaying);
        });
    }
    
    // Update timeline UI
    function updateTimelineUI(position, time) {
        // Update timeline handle position
        timelineHandle.style.left = `${position}%`;
        
        // Update progress bar
        timelineProgress.style.width = `${position}%`;
        
        // Update time display
        currentTimeDisplay.textContent = Utils.formatTime(time);
    }
    
    // Toggle playback
    function togglePlayback() {
        if (DashboardState.isPlaying()) {
            stopPlayback();
        } else {
            startPlayback();
        }
    }
    
    // Start playback
    function startPlayback() {
        DashboardState.startPlayback();
        
        // Start playback interval
        playbackInterval = setInterval(() => {
            const currentPosition = DashboardState.getTimelinePosition();
            
            if (currentPosition < 100) {
                const newPosition = currentPosition + (0.5 * DashboardState.getPlaybackSpeed());
                DashboardState.setTimelinePosition(Math.min(100, newPosition));
            } else {
                stopPlayback();
            }
        }, 100);
    }
    
    // Stop playback
    function stopPlayback() {
        DashboardState.stopPlayback();
        
        // Clear playback interval
        if (playbackInterval) {
            clearInterval(playbackInterval);
            playbackInterval = null;
        }
    }
    
    // Update playback UI
    function updatePlaybackUI(isPlaying) {
        playPauseButton.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }
    
    // Generate time labels
    function generateTimeLabels() {
        const timeRange = DashboardState.getTimeRange();
        const now = new Date();
        
        timeLabels.innerHTML = '';
        
        // Create labels based on time range
        const labelCount = 6; // Number of labels to show
        
        for (let i = 0; i <= labelCount; i++) {
            const percent = i / labelCount;
            const timeOffset = timeRange * 60 * 60 * 1000 * (1 - percent);
            const labelTime = new Date(now.getTime() - timeOffset);
            
            const label = document.createElement('span');
            label.textContent = Utils.formatTime(labelTime, false);
            timeLabels.appendChild(label);
        }
    }
    
    // Render events on timeline
    function renderEvents(events) {
        // Clear existing events
        personTrack.innerHTML = '';
        vehicleTrack.innerHTML = '';
        thermalTrack.innerHTML = '';
        checkpointTrack.innerHTML = '';
        eventMarkers = [];
        
        // Group events by type
        const personEvents = events.filter(event => event.type.toLowerCase() === 'person');
        const vehicleEvents = events.filter(event => event.type.toLowerCase() === 'vehicle');
        const thermalEvents = events.filter(event => event.type.toLowerCase() === 'thermal');
        const checkpointEvents = events.filter(event => event.type.toLowerCase() === 'checkpoint');
        
        // Add events to respective tracks
        personEvents.forEach(event => addEventMarker(event, personTrack));
        vehicleEvents.forEach(event => addEventMarker(event, vehicleTrack));
        thermalEvents.forEach(event => addEventMarker(event, thermalTrack));
        checkpointEvents.forEach(event => addEventMarker(event, checkpointTrack));
    }
    
    // Add event marker to track
    function addEventMarker(event, trackElement) {
        // Calculate position based on time
        const position = calculatePositionForTime(event.timestamp);
        
        // Skip if position is outside timeline range
        if (position < 0 || position > 100) return;
        
        // Create marker element
        const marker = document.createElement('div');
        marker.className = `event-marker ${event.type.toLowerCase()}`;
        marker.setAttribute('data-id', event.id);
        marker.setAttribute('data-time', event.timestamp.toISOString());
        marker.style.left = `${position}%`;
        marker.title = `${event.type} - ${Utils.formatTime(event.timestamp)}`;
        
        // Add click handler
        marker.addEventListener('click', function() {
            DashboardState.setSelectedEvent(event.id);
        });
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'event-tooltip';
        tooltip.textContent = `${event.description} (${Utils.formatTime(event.timestamp)})`;
        marker.appendChild(tooltip);
        
        // Add to track
        trackElement.appendChild(marker);
        
        // Store reference
        eventMarkers.push({
            id: event.id,
            element: marker,
            position: position
        });
    }
    
    // Calculate position on timeline for a timestamp
    function calculatePositionForTime(timestamp) {
        const now = new Date();
        const timeRange = DashboardState.getTimeRange() * 60 * 60 * 1000; // Convert hours to ms
        const timeDiff = now - timestamp;
        
        // Calculate position (100% is now, 0% is timeRange ago)
        return 100 - (timeDiff / timeRange * 100);
    }
    
    // Highlight selected event
    function highlightEvent(eventId) {
        // Remove highlight from all events
        document.querySelectorAll('.event-marker').forEach(marker => {
            marker.classList.remove('selected');
        });
        
        // Add highlight to selected event
        const marker = document.querySelector(`.event-marker[data-id="${eventId}"]`);
        if (marker) {
            marker.classList.add('selected');
            
            // Scroll to the marker's time if not in view
            const position = parseFloat(marker.style.left);
            const currentPosition = DashboardState.getTimelinePosition();
            
            // If marker is far from current position, update timeline
            if (Math.abs(position - currentPosition) > 10) {
                DashboardState.setTimelinePosition(position);
            }
        }
    }
    
    // Public API
    return {
        init,
        startPlayback,
        stopPlayback,
        togglePlayback
    };
})();