// Auto-resize textarea
document.getElementById('logData').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.max(320, this.scrollHeight) + 'px';
});

// Handle form submission
document.getElementById('logForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const logData = document.getElementById('logData').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const outputDisplay = document.getElementById('outputDisplay');
    const alertContainer = document.getElementById('alertContainer');
    
    if (!logData) {
        showModernAlert('Please enter log data to analyze', 'danger');
        return;
    }

    // Show loading state
    document.body.classList.add('loading-state');
    submitBtn.innerHTML = '<i class="fas fa-sync fa-spin me-2"></i>Processing...';
    
    // Clear previous alerts
    alertContainer.innerHTML = '';

    try {
        const response = await fetch('/api/submit-logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ logData })
        });

        const result = await response.json();

        if (result.success) {
            // Process and format the structured output
            const formattedOutput = formatStructuredOutput(result.summary);
            outputDisplay.innerHTML = formattedOutput;
        } else {
            // Show error
            showModernAlert(result.error || 'Failed to process logs. Please try again.', 'danger');
            outputDisplay.innerHTML = `
                <div class="placeholder-content">
                    <div class="placeholder-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Analysis Failed</h4>
                    <p>Please check your log data and try again.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        showModernAlert('Network error. Please check your connection and try again.', 'danger');
        outputDisplay.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">
                    <i class="fas fa-wifi"></i>
                </div>
                <h4>Connection Error</h4>
                <p>Unable to connect to the AI service. Please try again.</p>
            </div>
        `;
    } finally {
        // Remove loading state
        document.body.classList.remove('loading-state');
        submitBtn.innerHTML = '<i class="fas fa-rocket me-2"></i>Analyze with AI';
    }
});

function formatStructuredOutput(summary) {
    console.log('📋 Raw summary received:', summary);
    
    const lines = summary.split('\n');
    let formatted = '';
    let inLogAnalysis = false;
    let currentLogEntry = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        console.log(`Processing line ${i}: "${line}"`);
        
        if (line.startsWith('SUMMARY:')) {
            formatted += `<div class="summary-header">${line}</div>`;
        } else if (line.startsWith('LOG ANALYSIS:')) {
            inLogAnalysis = true;
            console.log('📊 Starting LOG ANALYSIS section');
        } else if (inLogAnalysis) {
            if (line.startsWith('🔍')) {
                // Start new log entry
                if (currentLogEntry) {
                    formatted += `<div class="log-entry">${currentLogEntry}</div>`;
                    console.log('✅ Added log entry:', currentLogEntry);
                }
                currentLogEntry = `<div class="log-line">${line}</div>`;
            } else if (line.startsWith('📝')) {
                currentLogEntry += `<div class="log-analysis">${line}</div>`;
            } else if (line.startsWith('💡')) {
                let actionClass = 'info';
                if (line.toLowerCase().includes('investigate') || line.toLowerCase().includes('fix')) {
                    actionClass = 'error';
                } else if (line.toLowerCase().includes('monitor') || line.toLowerCase().includes('warning')) {
                    actionClass = 'warning';
                }
                currentLogEntry += `<div class="log-action ${actionClass}">${line}</div>`;
            }
        }
    }
    
    // Add the last log entry
    if (currentLogEntry) {
        formatted += `<div class="log-entry">${currentLogEntry}</div>`;
        console.log('✅ Added final log entry:', currentLogEntry);
    }
    
    console.log('🎯 Final formatted output:', formatted);
    return formatted || `<div style="white-space: pre-wrap;">${summary}</div>`; // Fallback to original with proper formatting
}

function showModernAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `modern-alert alert-${type}`;
    
    const icon = type === 'danger' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    alertDiv.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alertDiv);

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to glass cards
    const glassCards = document.querySelectorAll('.glass-card');
    glassCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});
