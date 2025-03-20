/**
 * Alerts Controller
 * Manages the alerts panel, alert notifications, and alert interactions
 */
const AlertsController = (function() {
    // DOM elements
    let alertsList;
    let activeAlertCount;
    
    // Initialize alerts controller
    function init() {
        // Cache DOM elements
        alertsList = document.getElementById('alertsList');
        activeAlertCount = document.getElementById('activeAlertCount');
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up state subscriptions
        setupStateSubscriptions();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Acknowledge all alerts
        document.getElementById('acknowledgeAll').addEventListener('click', function() {
            // Get all unacknowledged alerts
            const unacknowledgedAlerts = DashboardState.getAlerts().filter(alert => !alert.acknowledged);
            
            // Acknowledge each alert
            unacknowledgedAlerts.forEach(alert => {
                acknowledgeAlert(alert.id);
            });
        });
        
        // Event delegation for alert actions
        alertsList.addEventListener('click', function(e) {
            // Check if we clicked an action button
            if (e.target.matches('.alert-action-ack')) {
                const alertItem = e.target.closest('.alert-item');
                const alertId = alertItem.getAttribute('data-id');
                acknowledgeAlert(alertId);
            } else if (e.target.matches('.alert-action-show')) {
                const alertItem = e.target.closest('.alert-item');
                const alertId = alertItem.getAttribute('data-id');
                showAlertOnMap(alertId);
            } else if (e.target.matches('.alert-action-details')) {
                const alertItem = e.target.closest('.alert-item');
                const alertId = alertItem.getAttribute('data-id');
                showAlertDetails(alertId);
            } else if (e.target.closest('.alert-item')) {
                // If we clicked the alert but not a button, also show on map
                const alertItem = e.target.closest('.alert-item');
                const alertId = alertItem.getAttribute('data-id');
                showAlertOnMap(alertId);
            }
        });
    }
    
    // Set up state subscriptions
    function setupStateSubscriptions() {
        // Handle new alerts
        DashboardState.on('alertAdded', (alert) => {
            renderAlerts();
            notifyNewAlert(alert);
        });
        
        // Handle alert removal
        DashboardState.on('alertRemoved', () => {
            renderAlerts();
        });
        
        // Handle checkpoint selection (to highlight related alerts)
        DashboardState.on('checkpointSelected', (checkpointId) => {
            highlightRelatedAlerts(checkpointId);
        });
        
        // Handle drone selection (to highlight related alerts)
        DashboardState.on('activeDroneChanged', (droneId) => {
            highlightRelatedAlerts(null, droneId);
        });
    }
    
    // Render alerts list
    function renderAlerts() {
        const alerts = DashboardState.getAlerts();
        
        // Clear existing alerts
        alertsList.innerHTML = '';
        
        // Update alert count
        const activeCount = alerts.filter(alert => !alert.acknowledged).length;
        activeAlertCount.textContent = `${activeCount} ${activeCount === 1 ? 'active' : 'active'}`;
        
        // Add alert items
        alerts.forEach(alert => {
            // Skip if filtered out by severity
            if (!DashboardState.isFilterActive(alert.severity.toLowerCase())) {
                return;
            }
            
            // Create alert item
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${getSeverityClass(alert.severity)}`;
            alertItem.setAttribute('data-id', alert.id);
            alertItem.setAttribute('data-checkpoint', alert.checkpointId || '');
            alertItem.setAttribute('data-drone', alert.droneId || '');
            alertItem.setAttribute('data-type', alert.type.toLowerCase());
            
            if (alert.acknowledged) {
                alertItem.classList.add('acknowledged');
            }
            
            // Create alert content
            const alertContent = document.createElement('div');
            alertContent.className = 'alert-content';
            alertContent.textContent = alert.message;
            
            // Create alert time
            const alertTime = document.createElement('div');
            alertTime.className = 'alert-time';
            alertTime.textContent = `${Utils.formatRelativeTime(alert.timestamp)} - ${alert.location}`;
            
            // Create alert actions
            const alertActions = document.createElement('div');
            alertActions.className = 'alert-actions';
            
            // Add buttons
            if (!alert.acknowledged) {
                const ackButton = document.createElement('button');
                ackButton.className = 'alert-action-ack';
                ackButton.innerHTML = '<i class="fas fa-check"></i>';
                ackButton.title = 'Acknowledge';
                alertActions.appendChild(ackButton);
            }
            
            const showButton = document.createElement('button');
            showButton.className = 'alert-action-show';
            showButton.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            showButton.title = 'Show on map';
            alertActions.appendChild(showButton);
            
            const detailsButton = document.createElement('button');
            detailsButton.className = 'alert-action-details';
            detailsButton.innerHTML = '<i class="fas fa-info-circle"></i>';
            detailsButton.title = 'View details';
            alertActions.appendChild(detailsButton);
            
            // Assemble alert item
            alertItem.appendChild(alertContent);
            alertItem.appendChild(alertTime);
            alertItem.appendChild(alertActions);
            
            alertsList.appendChild(alertItem);
        });
    }
    
    // Convert severity to CSS class
    function getSeverityClass(severity) {
        switch (severity.toLowerCase()) {
            case 'high':
                return 'critical';
            case 'medium':
                return 'warning';
            default:
                return 'info';
        }
    }
    
    // Acknowledge alert
    function acknowledgeAlert(alertId) {
        // Find the alert
        const alerts = DashboardState.getAlerts();
        const alertIndex = alerts.findIndex(a => a.id === alertId);
        
        if (alertIndex !== -1) {
            // Update the alert
            const alert = alerts[alertIndex];
            alert.acknowledged = true;
            
            // Update the UI
            const alertItem = document.querySelector(`.alert-item[data-id="${alertId}"]`);
            if (alertItem) {
                alertItem.classList.add('acknowledged');
                
                // Remove acknowledge button
                const ackButton = alertItem.querySelector('.alert-action-ack');
                if (ackButton) {
                    ackButton.remove();
                }
            }
            
            // Update the alert count
            const activeCount = alerts.filter(a => !a.acknowledged).length;
            activeAlertCount.textContent = `${activeCount} ${activeCount === 1 ? 'active' : 'active'}`;
        }
    }
    
    // Show alert on map
    function showAlertOnMap(alertId) {
        const alerts = DashboardState.getAlerts();
        const alert = alerts.find(a => a.id === alertId);
        
        if (!alert) return;
        
        // If the alert is associated with a checkpoint, select it
        if (alert.checkpointId) {
            DashboardState.setSelectedCheckpoint(alert.checkpointId);
        }
        
        // If the alert is associated with a drone, select it
        if (alert.droneId) {
            DashboardState.setActiveDrone(alert.droneId);
        }
        
        // If the alert is associated with an object, select it
        if (alert.objectId) {
            DashboardState.setSelectedObject(alert.objectId);
        }
        
        // If the alert has an event id, select it
        if (alert.eventId) {
            DashboardState.setSelectedEvent(alert.eventId);
        }
    }
    
    // Show alert details
    function showAlertDetails(alertId) {
        const alerts = DashboardState.getAlerts();
        const alert = alerts.find(a => a.id === alertId);
        
        if (!alert) return;
        
        // In a real implementation, this would open a modal with detailed information
        // For now, we'll just log it to console
        console.log('Show alert details:', alert);
        
        // Get the event modal elements
        const modal = document.getElementById('eventDetailModal');
        const modalTitle = document.getElementById('eventModalTitle');
        const modalContent = document.getElementById('eventModalContent');
        
        // Set the modal title
        modalTitle.textContent = `Alert Details: ${alert.type}`;
        
        // Create modal content
        modalContent.innerHTML = '';
        
        // Create container
        const container = document.createElement('div');
        container.className = 'event-detail-container';
        
        // Add alert media (if available)
        if (alert.imageUrl) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'event-media';
            
            const image = document.createElement('img');
            image.src = alert.imageUrl;
            image.alt = alert.type;
            
            mediaContainer.appendChild(image);
            container.appendChild(mediaContainer);
        }
        
        // Add metadata
        const metadata = document.createElement('div');
        metadata.className = 'event-metadata';
        
        // Add metadata items
        const metadataItems = [
            { label: 'Type', value: alert.type },
            { label: 'Severity', value: alert.severity },
            { label: 'Time', value: new Date(alert.timestamp).toLocaleString() },
            { label: 'Location', value: alert.location },
            { label: 'Status', value: alert.acknowledged ? 'Acknowledged' : 'Active' }
        ];
        
        // Add drone and checkpoint info if available
        if (alert.droneId) {
            const drone = DashboardState.getDrones().find(d => d.id === alert.droneId);
            if (drone) {
                metadataItems.push({ label: 'Detected By', value: drone.name });
            }
        }
        
        if (alert.checkpointId) {
            const checkpoint = DashboardState.getCheckpoints().find(c => c.id === alert.checkpointId);
            if (checkpoint) {
                metadataItems.push({ label: 'Checkpoint', value: checkpoint.name });
            }
        }
        
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
            
            metadataItem.appendChild(label);
            metadataItem.appendChild(value);
            metadata.appendChild(metadataItem);
        });
        
        container.appendChild(metadata);
        
        // Add alert description
        const description = document.createElement('div');
        description.className = 'event-description';
        description.textContent = alert.message;
        container.appendChild(description);
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'event-actions';
        
        if (!alert.acknowledged) {
            const acknowledgeBtn = document.createElement('button');
            acknowledgeBtn.textContent = 'Acknowledge';
            acknowledgeBtn.onclick = () => {
                acknowledgeAlert(alert.id);
                modal.style.display = 'none';
            };
            actions.appendChild(acknowledgeBtn);
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
    
    // Highlight alerts related to a checkpoint or drone
    function highlightRelatedAlerts(checkpointId, droneId) {
        // Remove highlight from all alerts
        document.querySelectorAll('.alert-item').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Add highlight to related alerts
        if (checkpointId) {
            document.querySelectorAll(`.alert-item[data-checkpoint="${checkpointId}"]`).forEach(item => {
                item.classList.add('highlighted');
            });
        }
        
        if (droneId) {
            document.querySelectorAll(`.alert-item[data-drone="${droneId}"]`).forEach(item => {
                item.classList.add('highlighted');
            });
        }
    }
    
    // Notify user of new alert (in a real implementation, this could play a sound or show a notification)
    function notifyNewAlert(alert) {
        // Simple visual flash for now
        if (alert.severity.toLowerCase() === 'high') {
            alertsList.classList.add('flash');
            
            // Remove flash class after animation
            setTimeout(() => {
                alertsList.classList.remove('flash');
            }, 500);
            
            // Play sound if available
            const alertSound = document.getElementById('alertSound');
            if (alertSound) {
                alertSound.play();
            }
        }
    }
    
    // Public API
    return {
        init,
        renderAlerts,
        acknowledgeAlert,
        showAlertDetails
    };
})();