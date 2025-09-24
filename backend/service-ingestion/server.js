const express = require('express');
const client = require('prom-client');
const fs = require('fs');
const path = require('path');

const app = express();
const register = new client.Registry();

// Middleware
app.use(express.json());

// Shared log storage path
const logFilePath = path.join(__dirname, '../../shared/logs/logs.jsonl');

// Metrics
const logsReceived = new client.Counter({
  name: 'logs_received_total',
  help: 'Number of logs received',
});

const logIngestDuration = new client.Histogram({
  name: 'log_ingest_duration_seconds',
  help: 'Duration of log ingestion in seconds',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const logSizeBytes = new client.Histogram({
  name: 'log_size_bytes',
  help: 'Size of ingested logs in bytes',
  buckets: [100, 500, 1000, 5000, 10000, 50000],
});

register.registerMetric(logsReceived);
register.registerMetric(logIngestDuration);
register.registerMetric(logSizeBytes);
client.collectDefaultMetrics({ register });

// Ensure log directory exists
function ensureLogDirectory() {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// Log ingestion endpoint
app.post('/ingest', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, level = 'info', service = 'unknown', ...metadata } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      metadata,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    // Ensure directory exists
    ensureLogDirectory();

    // Append to log file
    fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');

    // Update metrics
    logsReceived.inc();
    const duration = (Date.now() - startTime) / 1000;
    logIngestDuration.observe(duration);
    logSizeBytes.observe(JSON.stringify(logEntry).length);

    res.status(200).json({ 
      success: true, 
      id: logEntry.id,
      message: 'Log ingested successfully' 
    });

  } catch (error) {
    console.error('Error ingesting log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk log ingestion endpoint
app.post('/ingest/bulk', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { logs } = req.body;
    
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'Logs array is required' });
    }

    ensureLogDirectory();

    const processedLogs = [];
    
    for (const log of logs) {
      const { message, level = 'info', service = 'unknown', ...metadata } = log;
      
      if (!message) {
        continue; // Skip logs without message
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        service,
        message,
        metadata,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };

      fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
      processedLogs.push(logEntry.id);
    }

    // Update metrics
    logsReceived.inc(processedLogs.length);
    const duration = (Date.now() - startTime) / 1000;
    logIngestDuration.observe(duration);

    res.status(200).json({ 
      success: true, 
      processed: processedLogs.length,
      ids: processedLogs,
      message: `${processedLogs.length} logs ingested successfully` 
    });

  } catch (error) {
    console.error('Error ingesting bulk logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs endpoint (for debugging/testing)
app.get('/logs', (req, res) => {
  try {
    const { limit = 100, service, level } = req.query;
    
    if (!fs.existsSync(logFilePath)) {
      return res.json({ logs: [] });
    }

    const logs = fs.readFileSync(logFilePath, 'utf8')
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line))
      .filter(log => {
        if (service && log.service !== service) return false;
        if (level && log.level !== level) return false;
        return true;
      })
      .slice(-parseInt(limit));

    res.json({ logs, count: logs.length });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'log-ingestion' });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Log Ingestion Service running on port ${port}`);
  console.log(`Logs will be stored at: ${logFilePath}`);
});
