/**
 * Utility functions for the dashboard
 */
const Utils = (function() {
    return {
        /**
         * Format a timestamp into a readable string
         * @param {Date} date - Date object
         * @param {boolean} includeSeconds - Whether to include seconds
         * @returns {string} Formatted time string
         */
        formatTime: function(date, includeSeconds = true) {
            if (!date) return '';
            
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            if (!includeSeconds) {
                return `${hours}:${minutes}`;
            }
            
            const seconds = date.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        },
        
        /**
         * Format a timestamp relative to now (e.g., "2m ago")
         * @param {Date} date - Date object
         * @returns {string} Relative time string
         */
        formatRelativeTime: function(date) {
            if (!date) return '';
            
            const now = new Date();
            const diffMs = now - date;
            const diffSec = Math.floor(diffMs / 1000);
            
            if (diffSec < 60) {
                return diffSec <= 5 ? 'Just now' : `${diffSec}s ago`;
            }
            
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 60) {
                return `${diffMin}m ago`;
            }
            
            const diffHour = Math.floor(diffMin / 60);
            if (diffHour < 24) {
                return `${diffHour}h ago`;
            }
            
            const diffDay = Math.floor(diffHour / 24);
            return `${diffDay}d ago`;
        },
        
        /**
         * Generate a unique ID
         * @returns {string} Unique ID
         */
        generateId: function() {
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        
        /**
         * Create HTML element with attributes and event listeners
         * @param {string} tag - HTML tag name
         * @param {object} props - HTML attributes and event listeners
         * @param {Array} children - Child elements or text content
         * @returns {HTMLElement} Created element
         */
        createElement: function(tag, props = {}, children = []) {
            const element = document.createElement(tag);
            
            // Set attributes and event listeners
            Object.entries(props).forEach(([key, value]) => {
                if (key.startsWith('on') && typeof value === 'function') {
                    // Event listener
                    const eventName = key.slice(2).toLowerCase();
                    element.addEventListener(eventName, value);
                } else if (key === 'className') {
                    // Special case for className
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    // Style object
                    Object.assign(element.style, value);
                } else {
                    // Regular attribute
                    element.setAttribute(key, value);
                }
            });
            
            // Add children
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
            
            return element;
        },
        
        /**
         * Deep clone an object
         * @param {object} obj - Object to clone
         * @returns {object} Cloned object
         */
        deepClone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        /**
         * Get color based on severity level
         * @param {string} severity - Severity level ('high', 'medium', 'low')
         * @returns {string} Hex color
         */
        getSeverityColor: function(severity) {
            switch (severity.toLowerCase()) {
                case 'high':
                    return '#e74c3c';
                case 'medium':
                    return '#f1c40f';
                case 'low':
                    return '#3498db';
                default:
                    return '#7f8c8d';
            }
        },
        
        /**
         * Get color based on checkpoint status
         * @param {string} status - Checkpoint status ('normal', 'caution', 'critical')
         * @returns {string} Hex color
         */
        getStatusColor: function(status) {
            switch (status.toLowerCase()) {
                case 'normal':
                    return '#2ecc71';
                case 'caution':
                    return '#f1c40f';
                case 'critical':
                    return '#e74c3c';
                default:
                    return '#7f8c8d';
            }
        },
        
        /**
         * Get color based on object type
         * @param {string} type - Object type ('person', 'vehicle', 'thermal', etc.)
         * @returns {string} Hex color
         */
        getObjectTypeColor: function(type) {
            switch (type.toLowerCase()) {
                case 'person':
                    return '#9b59b6';
                case 'vehicle':
                    return '#f1c40f';
                case 'thermal':
                    return '#e74c3c';
                case 'equipment':
                    return '#27ae60';
                default:
                    return '#3498db';
            }
        },
        
        /**
         * Create an event card element
         * @param {Object} event - Event data object
         * @param {boolean} isSelected - Whether this card should be highlighted as selected
         * @returns {HTMLElement} The created event card element
         */
        createEventCard: function(event, isSelected = false) {
            const card = document.createElement('div');
            card.className = `event-card ${event.type.toLowerCase()} ${isSelected ? 'selected' : ''}`;
            card.setAttribute('data-id', event.id);
            card.setAttribute('data-result-type', event.resultType || 'event');
            card.setAttribute('data-original-id', event.originalId || event.id);
            
            // Card header
            const cardHeader = document.createElement('div');
            cardHeader.className = 'event-card-header';
            
            const eventType = document.createElement('div');
            eventType.className = 'event-type';
            eventType.textContent = event.type;
            
            const eventTime = document.createElement('div');
            eventTime.className = 'event-time';
            eventTime.textContent = this.formatRelativeTime(event.timestamp);
            
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
            
            // Assemble card
            card.appendChild(cardHeader);
            card.appendChild(thumbnail);
            card.appendChild(description);
            card.appendChild(location);
            
            // Add click event handler
            card.addEventListener('click', () => {
                if (event.resultType === 'event' || !event.resultType) {
                    DashboardState.setSelectedEvent(event.id);
                } else if (typeof SearchController !== 'undefined' && 
                          typeof SearchController.handleSearchResultClick === 'function') {
                    // Handle other result types (alert, checkpoint, object)
                    SearchController.handleSearchResultClick(event);
                }
            });
            
            return card;
        },
        
        /**
         * Calculate distance between two coordinates
         * @param {object} coord1 - First coordinate {x, y}
         * @param {object} coord2 - Second coordinate {x, y}
         * @returns {number} Distance
         */
        calculateDistance: function(coord1, coord2) {
            return Math.sqrt(
                Math.pow(coord2.x - coord1.x, 2) + 
                Math.pow(coord2.y - coord1.y, 2)
            );
        },
        
        /**
         * Get angle between two coordinates (for direction indicators)
         * @param {object} from - Starting coordinate {x, y}
         * @param {object} to - Ending coordinate {x, y}
         * @returns {number} Angle in degrees
         */
        calculateAngle: function(from, to) {
            return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
        },
        
        /**
         * Format percentage with one decimal place
         * @param {number} value - Value to format
         * @returns {string} Formatted percentage
         */
        formatPercentage: function(value) {
            return value.toFixed(1) + '%';
        },
        
        /**
         * Format large numbers with commas
         * @param {number} value - Value to format
         * @returns {string} Formatted number
         */
        formatLargeNumber: function(value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        
        /**
         * Truncate text with ellipsis
         * @param {string} text - Text to truncate
         * @param {number} length - Maximum length
         * @returns {string} Truncated text
         */
        truncateText: function(text, length) {
            if (text.length <= length) return text;
            return text.slice(0, length) + '...';
        }
    };
})();