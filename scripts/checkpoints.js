/**
 * Checkpoints Controller
 * Manages checkpoint zones, status updates, and related functionality
 */
const CheckpointsController = (function() {
    // Initialize checkpoints controller
    function init() {
        // Set up state subscriptions
        setupStateSubscriptions();
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle checkpoint selection
        DashboardState.on('checkpointSelected', (checkpointId) => {
            if (checkpointId) {
                showCheckpointDetails(checkpointId);
            }
        });
        
        // Handle checkpoint updates
        DashboardState.on('checkpointUpdated', (checkpoint) => {
            // Update checkpoint visuals would happen automatically through map controller
            // But we might trigger specific actions here based on status changes
            if (checkpoint.status === 'critical') {
                // Check if this is a new critical situation that needs an alert
                createAlertForCriticalCheckpoint(checkpoint);
            }
        });
    }
    
    // Show checkpoint details (in modal or panel)
    function showCheckpointDetails(checkpointId) {
        const checkpoint = DashboardState.getCheckpoints().find(cp => cp.id === checkpointId);
        
        if (!checkpoint) return;
        
        // Get the event modal elements
        const modal = document.getElementById('eventDetailModal');
        const modalTitle = document.getElementById('eventModalTitle');
        const modalContent = document.getElementById('eventModalContent');
        
        // Set the modal title
        modalTitle.textContent = `${checkpoint.name} Details`;
        
        // Create modal content
        modalContent.innerHTML = '';
        
        // Create container
        const container = document.createElement('div');
        container.className = 'event-detail-container';
        
        // Add checkpoint media - in a real implementation, this would show a live or recent image
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'event-media';
        
        const image = document.createElement('img');
        image.src = `images/checkpoint-${checkpoint.id.replace('checkpoint', '')}.jpg`;
        image.alt = checkpoint.name;
        
        mediaContainer.appendChild(image);
        container.appendChild(mediaContainer);
        
        // Add metadata
        const metadata = document.createElement('div');
        metadata.className = 'event-metadata';
        
        // Add metadata items
        const metadataItems = [
            { label: 'Name', value: checkpoint.name },
            { label: 'Location', value: checkpoint.location },
            { label: 'Status', value: checkpoint.status.charAt(0).toUpperCase() + checkpoint.status.slice(1) },
            { label: 'Last Checked', value: Utils.formatRelativeTime(checkpoint.lastChecked) }
        ];
        
        // Add monitoring drone if available
        const activeDrone = DashboardState.getActiveDrone();
        if (activeDrone) {
            metadataItems.push({ label: 'Monitoring Drone', value: activeDrone.name });
        }
        
        // Get recent alerts for this checkpoint
        const recentAlerts = DashboardState.getAlerts().filter(
            alert => alert.checkpointId === checkpoint.id
        ).length;
        
        metadataItems.push({ label: 'Recent Alerts', value: recentAlerts.toString() });
        
        // Create metadata items
        metadataItems.forEach(item => {
            const metadataItem = document.createElement('div');
            metadataItem.className = 'metadata-item';
            
            const label = document.createElement('div');
            label.className = 'metadata-label';
            label.textContent = item.label;
            
            const value = document.createElement('div');
            value.className = 'metadata-value';
            value.textContent = item.value;
            
            if (item.label === 'Status') {
                value.classList.add(`status-${checkpoint.status}`);
            }
            
            metadataItem.appendChild(label);
            metadataItem.appendChild(value);
            metadata.appendChild(metadataItem);
        });
        
        container.appendChild(metadata);
        
        // Add checkpoint details based on status
        if (checkpoint.status === 'critical' || checkpoint.status === 'caution') {
            const alertDetails = document.createElement('div');
            alertDetails.className = 'alert-details';
            
            const alertTitle = document.createElement('h4');
            alertTitle.textContent = checkpoint.status === 'critical' ? 'Critical Alert' : 'Caution';
            
            const alertDesc = document.createElement('p');
            
            if (checkpoint.status === 'critical') {
                alertDesc.textContent = 'AI Detection: Unauthorized personnel in restricted area';
                
                // Get thermal data if available
                const thermalData = ThermalController.getThermalDataForLocation(
                    checkpoint.position.x, checkpoint.position.y
                );
                
                if (thermalData && thermalData.anomaly) {
                    const thermalInfo = document.createElement('p');
                    thermalInfo.textContent = 
                        `Thermal Anomaly: Temperature ${thermalData.temperature.toFixed(1)}°C (${(thermalData.temperature * 1.8 + 32).toFixed(1)}°F)`;
                    alertDetails.appendChild(thermalInfo);
                }
            } else {
                alertDesc.textContent = 'Unusual activity detected in this area';
            }
            
            alertDetails.appendChild(alertTitle);
            alertDetails.appendChild(alertDesc);
            
            container.appendChild(alertDetails);
        }
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'event-actions';
        
        const viewFeedBtn = document.createElement('button');
        viewFeedBtn.textContent = 'View Live Feed';
        viewFeedBtn.onclick = () => {
            // Find a drone monitoring this checkpoint
            const drones = DashboardState.getDrones();
            const monitoringDrone = drones.find(drone => 
                Utils.calculateDistance(drone.position, checkpoint.position) < 20 // arbitrary distance threshold
            );
            
            if (monitoringDrone) {
                DashboardState.setActiveDrone(monitoringDrone.id);
            }
            
            modal.style.display = 'none';
        };
        actions.appendChild(viewFeedBtn);
        
        // For critical checkpoints, add dispatch button
        if (checkpoint.status === 'critical') {
            const dispatchBtn = document.createElement('button');
            dispatchBtn.textContent = 'Dispatch Security';
            dispatchBtn.onclick = () => {
                alert('Security team dispatched to ' + checkpoint.location);
                modal.style.display = 'none';
            };
            actions.appendChild(dispatchBtn);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'secondary';
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        actions.appendChild(closeBtn);
        
        container.appendChild(actions);
        
        // Add container to modal
        modalContent.appendChild(container);
        
        // Show the modal
        modal.style.display = 'flex';
    }
    
    // Create alert for critical checkpoint
    function createAlertForCriticalCheckpoint(checkpoint) {
        // Check if there's already an active alert for this checkpoint
        const existingAlerts = DashboardState.getAlerts().filter(
            alert => alert.checkpointId === checkpoint.id && !alert.acknowledged
        );
        
        if (existingAlerts.length > 0) {
            // Already has an active alert
            return;
        }
        
        // Create a new alert
        const alert = {
            id: 'alert-' + Utils.generateId(),
            type: 'Critical Checkpoint',
            severity: 'High',
            message: `${checkpoint.name} has entered critical status`,
            timestamp: new Date(),
            location: checkpoint.location,
            acknowledged: false,
            checkpointId: checkpoint.id
        };
        
        // Add to state
        DashboardState.addAlert(alert);
    }
    
    // Update checkpoint status
    function updateCheckpointStatus(checkpointId, newStatus) {
        const checkpoints = DashboardState.getCheckpoints();
        const checkpointIndex = checkpoints.findIndex(cp => cp.id === checkpointId);
        
        if (checkpointIndex === -1) return;
        
        // Create updated checkpoint object
        const updatedCheckpoint = {
            ...checkpoints[checkpointIndex],
            status: newStatus,
            lastChecked: new Date()
        };
        
        // Update state
        DashboardState.updateCheckpoint(updatedCheckpoint);
        
        // If status changed to critical, this might trigger an alert
        if (newStatus === 'critical') {
            createAlertForCriticalCheckpoint(updatedCheckpoint);
        }
        
        // Return the updated checkpoint
        return updatedCheckpoint;
    }
    
    // Configure a new checkpoint
    function configureCheckpoint(checkpointId, config) {
        // In a real implementation, this would apply configuration settings to the checkpoint
        console.log(`Configuring checkpoint ${checkpointId}:`, config);
        
        // For now, just return a success message
        return {
            success: true,
            message: `Checkpoint ${checkpointId} configured successfully`
        };
    }
    
    // Public API
    return {
        init,
        showCheckpointDetails,
        updateCheckpointStatus,
        configureCheckpoint
    };
})();