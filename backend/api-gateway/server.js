const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Handle log submission - orchestrate microservices calls
app.post('/submit-logs', async (req, res) => {
    try {
        const { logData } = req.body;
        
        if (!logData || !logData.trim()) {
            return res.status(400).json({
                success: false,
                error: 'No log data provided'
            });
        }

        console.log('📥 Received log data for processing');
        console.log('📝 Log data preview:', logData.substring(0, 100) + '...');
        
        // Step 1: Send logs to ingestion service
        console.log('🔗 Calling ingestion service at http://localhost:3001/ingest');
        
        const ingestionPayload = { 
            message: logData,
            level: 'info',
            service: 'web-dashboard',
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 Payload to ingestion service:', JSON.stringify(ingestionPayload, null, 2));
        
        try {
            const ingestionResponse = await fetch('http://localhost:3001/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ingestionPayload)
            });

            console.log('📊 Ingestion response status:', ingestionResponse.status);
            console.log('📊 Ingestion response ok:', ingestionResponse.ok);
            
            if (!ingestionResponse.ok) {
                const errorText = await ingestionResponse.text();
                console.log('❌ Ingestion error response:', errorText);
                throw new Error(`Ingestion service error: ${ingestionResponse.status} - ${errorText}`);
            }

            const ingestionResult = await ingestionResponse.json();
            console.log('✅ Logs sent to ingestion service:', ingestionResult);
        } catch (fetchError) {
            console.error('❌ Fetch error to ingestion service:', fetchError);
            throw new Error(`Failed to connect to ingestion service: ${fetchError.message}`);
        }

        // Step 2: Request AI analysis
        console.log('🔗 Calling analytics service at http://localhost:3002/summarize');
        
        const analyticsPayload = {
            logData: logData
        };
        
        console.log('📤 Payload to analytics service:', JSON.stringify(analyticsPayload, null, 2));
        
        try {
            const analyticsResponse = await fetch('http://localhost:3002/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(analyticsPayload)
            });

            console.log('📊 Analytics response status:', analyticsResponse.status);
            console.log('📊 Analytics response ok:', analyticsResponse.ok);

            if (!analyticsResponse.ok) {
                const errorText = await analyticsResponse.text();
                console.log('❌ Analytics error response:', errorText);
                throw new Error(`Analytics service error: ${analyticsResponse.status} - ${errorText}`);
            }

            const analysisResult = await analyticsResponse.json();
            console.log('🤖 AI analysis completed');

            res.json({
                success: true,
                summary: analysisResult.summary || 'Analysis completed successfully'
            });
        } catch (fetchError) {
            console.error('❌ Fetch error to analytics service:', fetchError);
            throw new Error(`Failed to connect to analytics service: ${fetchError.message}`);
        }

    } catch (error) {
        console.error('❌ Error processing logs:', error);
        
        // Check if it's a connection error to the services
        if (error.message.includes('Failed to connect') || error.message.includes('fetch')) {
            res.status(503).json({
                success: false,
                error: 'Unable to connect to backend services. Please ensure the ingestion and analytics services are running.'
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message || 'An error occurred while processing the logs'
            });
        }
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`🌐 API Gateway running at http://localhost:${port}`);
    console.log('🔗 Connecting to backend services:');
    console.log('   - Ingestion Service: http://localhost:3001');
    console.log('   - Analytics Service: http://localhost:3002');
});
