/**
 * Thermal Controller
 * Manages thermal overlays, heatmaps, and thermal data visualization
 */
const ThermalController = (function() {
    // DOM elements
    let thermalOverlay;
    let thermalHistoryOverlay;
    
    // Thermal state
    let thermalSpots = [];
    let historicalHeatmap = {};
    
    // Initialize thermal controller
    function init() {
        // Cache DOM elements
        thermalOverlay = document.querySelector('.thermal-overlay:not(.thermal-history)');
        thermalHistoryOverlay = document.querySelector('.thermal-overlay.thermal-history');
        
        // Set up thermal spots
        setupThermalSpots();
        
        // Set up historical heatmap
        setupHistoricalHeatmap();
        
        // Set up state subscriptions
        setupStateSubscriptions();
    }
    
    // Set up thermal spots
    function setupThermalSpots() {
        // Generate initial thermal spots
        generateThermalSpots();
        
        // Render the spots
        renderThermalSpots();
    }
    
    // Set up historical heatmap
    function setupHistoricalHeatmap() {
        // Generate historical heatmap data
        generateHistoricalHeatmap();
        
        // Render the heatmap
        renderHistoricalHeatmap();
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle thermal view toggle
        DashboardState.on('thermalViewChanged', (active) => {
            thermalOverlay.style.display = active ? 'block' : 'none';
            
            // If thermal view is active, update spots
            if (active) {
                updateThermalSpots();
            }
        });
        
        // Handle layer visibility changes
        DashboardState.on('layerVisibilityChanged', (data) => {
            if (data.layer === 'thermal-history') {
                thermalHistoryOverlay.style.display = data.visible ? 'block' : 'none';
                
                // If thermal history is now visible, update the heatmap
                if (data.visible) {
                    updateHistoricalHeatmap();
                }
            }
        });
        
        // Handle timeline position changes
        DashboardState.on('timelinePositionChanged', () => {
            // Update thermal spots based on timeline position
            updateThermalSpots();
            
            // Update historical heatmap if visible
            if (thermalHistoryOverlay.style.display === 'block') {
                updateHistoricalHeatmap();
            }
        });
    }
    
// Generate thermal spots
function generateThermalSpots() {
    // Get checkpoints - thermal anomalies are often near checkpoints
    const checkpoints = DashboardState.getCheckpoints();
    
    // Clear existing spots
    thermalSpots = [];
    
    // Add spots for checkpoints in caution or critical state
    checkpoints.forEach(checkpoint => {
        if (checkpoint.status === 'caution' || checkpoint.status === 'critical') {
            // Add a thermal spot at the checkpoint
            thermalSpots.push({
                id: `thermal-${checkpoint.id}`,
                x: checkpoint.position.x,
                y: checkpoint.position.y,
                intensity: checkpoint.status === 'critical' ? 0.9 : 0.6,
                size: checkpoint.status === 'critical' ? 100 : 80
            });
            
            // Add some random spots around the checkpoint for more realism
            for (let i = 0; i < (checkpoint.status === 'critical' ? 3 : 1); i++) {
                const offsetX = (Math.random() - 0.5) * 15;
                const offsetY = (Math.random() - 0.5) * 15;
                
                thermalSpots.push({
                    id: `thermal-${checkpoint.id}-${i}`,
                    x: checkpoint.position.x + offsetX,
                    y: checkpoint.position.y + offsetY,
                    intensity: Math.random() * 0.5 + 0.3,
                    size: Math.random() * 40 + 40
                });
            }
        }
    });
    
    // Add some random thermal spots for variety
    for (let i = 0; i < 3; i++) {
        thermalSpots.push({
            id: `thermal-random-${i}`,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
            intensity: Math.random() * 0.4 + 0.2,
            size: Math.random() * 30 + 30
        });
    }
}

// Render thermal spots
function renderThermalSpots() {
    // Clear existing spots
    thermalOverlay.innerHTML = '';
    
    // Add each spot
    thermalSpots.forEach(spot => {
        const spotElement = document.createElement('div');
        spotElement.className = 'thermal-spot';
        spotElement.style.top = `${spot.y}%`;
        spotElement.style.left = `${spot.x}%`;
        spotElement.style.width = `${spot.size}px`;
        spotElement.style.height = `${spot.size}px`;
        spotElement.style.opacity = spot.intensity;
        
        thermalOverlay.appendChild(spotElement);
    });
}

// Update thermal spots (e.g., when timeline changes)
function updateThermalSpots() {
    // In a real implementation, this would fetch thermal data for the current time
    // For now, we'll just add some randomness to the existing spots
    
    thermalSpots.forEach(spot => {
        // Adjust intensity slightly
        spot.intensity = Math.max(0.2, Math.min(0.9, spot.intensity + (Math.random() - 0.5) * 0.1));
        
        // Adjust size slightly
        spot.size = Math.max(20, Math.min(120, spot.size + (Math.random() - 0.5) * 10));
    });
    
    // Render the updated spots
    renderThermalSpots();
}

// Generate historical heatmap data
function generateHistoricalHeatmap() {
    // In a real implementation, this would fetch historical thermal data
    // For now, we'll generate some random data
    
    historicalHeatmap = {
        maxIntensity: 0.5,
        points: []
    };
    
    // Generate some heatmap points - more dense around checkpoints
    const checkpoints = DashboardState.getCheckpoints();
    
    // Add points near checkpoints
    checkpoints.forEach(checkpoint => {
        const pointCount = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < pointCount; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            historicalHeatmap.points.push({
                x: checkpoint.position.x + offsetX,
                y: checkpoint.position.y + offsetY,
                value: Math.random() * 0.5 + 0.2
            });
            
            // Update max intensity if needed
            historicalHeatmap.maxIntensity = Math.max(historicalHeatmap.maxIntensity, 
                                                     historicalHeatmap.points[historicalHeatmap.points.length - 1].value);
        }
    });
    
    // Add some random points
    for (let i = 0; i < 15; i++) {
        historicalHeatmap.points.push({
            x: Math.random() * 90 + 5,
            y: Math.random() * 90 + 5,
            value: Math.random() * 0.3 + 0.1
        });
        
        // Update max intensity if needed
        historicalHeatmap.maxIntensity = Math.max(historicalHeatmap.maxIntensity, 
                                                 historicalHeatmap.points[historicalHeatmap.points.length - 1].value);
    }
}

// Render historical heatmap
function renderHistoricalHeatmap() {
    // Clear existing heatmap
    thermalHistoryOverlay.innerHTML = '';
    
    // In a real implementation, this would use a proper heatmap library
    // For now, we'll just render simple thermal spots
    
    historicalHeatmap.points.forEach(point => {
        const normalizedValue = point.value / historicalHeatmap.maxIntensity;
        
        const spotElement = document.createElement('div');
        spotElement.className = 'thermal-spot';
        spotElement.style.top = `${point.y}%`;
        spotElement.style.left = `${point.x}%`;
        spotElement.style.width = `${normalizedValue * 60 + 10}px`;
        spotElement.style.height = `${normalizedValue * 60 + 10}px`;
        spotElement.style.opacity = normalizedValue * 0.7;
        
        thermalHistoryOverlay.appendChild(spotElement);
    });
}

// Update historical heatmap based on timeline
function updateHistoricalHeatmap() {
    // In a real implementation, this would fetch historical data for the selected time
    // For now, we'll just add some randomness to the existing data
    
    historicalHeatmap.points.forEach(point => {
        // Adjust value slightly
        point.value = Math.max(0.1, Math.min(0.8, point.value + (Math.random() - 0.5) * 0.1));
    });
    
    // Update max intensity
    historicalHeatmap.maxIntensity = historicalHeatmap.points.reduce((max, point) => 
        Math.max(max, point.value), 0);
    
    // Render the updated heatmap
    renderHistoricalHeatmap();
}

// Get thermal data for a location
function getThermalDataForLocation(x, y) {
    // Find nearby thermal spots
    const nearbySpots = thermalSpots.filter(spot => {
        const distance = Math.sqrt(Math.pow(spot.x - x, 2) + Math.pow(spot.y - y, 2));
        return distance < spot.size / 100; // Size as percentage of map
    });
    
    if (nearbySpots.length === 0) {
        return null;
    }
    
    // Get the most intense nearby spot
    const mostIntense = nearbySpots.reduce((max, spot) => 
        spot.intensity > max.intensity ? spot : max, nearbySpots[0]);
    
    // Convert intensity to temperature (for demo purposes)
    const baseTemp = 20; // 20°C as baseline
    const tempVariation = 30; // up to +30°C for max intensity
    
    return {
        temperature: baseTemp + mostIntense.intensity * tempVariation,
        intensity: mostIntense.intensity,
        anomaly: mostIntense.intensity > 0.6
    };
}

// Public API
return {
    init,
    getThermalDataForLocation,
    renderThermalSpots,
    renderHistoricalHeatmap
};
})();