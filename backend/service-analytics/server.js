const express = require('express');
const client = require('prom-client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const register = new client.Registry();

// Middleware
app.use(express.json());

// GROQ Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'apikey-your-groq-api-key';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Shared log storage path
const logFilePath = path.join(__dirname, '../../shared/logs/logs.jsonl');

// Metrics
const summariesGenerated = new client.Counter({
  name: 'summaries_generated_total',
  help: 'Number of AI summaries generated',
});

const groqApiCalls = new client.Counter({
  name: 'groq_api_calls_total',
  help: 'Total number of GROQ API calls made',
});

const groqApiDuration = new client.Histogram({
  name: 'groq_api_duration_seconds',
  help: 'Duration of GROQ API calls in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

const summaryLength = new client.Histogram({
  name: 'summary_length_chars',
  help: 'Length of generated summaries in characters',
  buckets: [50, 100, 200, 500, 1000, 2000],
});

register.registerMetric(summariesGenerated);
register.registerMetric(groqApiCalls);
register.registerMetric(groqApiDuration);
register.registerMetric(summaryLength);
client.collectDefaultMetrics({ register });

// GROQ API Integration
async function callGroqAPI(logData) {
  const timer = groqApiDuration.startTimer();
  
  try {
    groqApiCalls.inc();
    
    // Parse individual log lines
    const logLines = logData.split('\n').filter(line => line.trim());
    
    const prompt = `You are an expert log analyzer. Analyze the following log data and provide a structured analysis in this EXACT format. Do not deviate from this format:

SUMMARY: Info - X logs, Error - Y logs, Warning - Z logs, Other - W logs

LOG ANALYSIS:
🔍 Log 1: [Show the actual log line here]
📝 Analysis: [Brief analysis of what this log means]
💡 Action: [If there's an issue, provide a solution, otherwise say "No action needed"]

🔍 Log 2: [Show the actual log line here]  
📝 Analysis: [Brief analysis of what this log means]
💡 Action: [If there's an issue, provide a solution, otherwise say "No action needed"]

🔍 Log 3: [Show the actual log line here]
📝 Analysis: [Brief analysis of what this log means]
💡 Action: [If there's an issue, provide a solution, otherwise say "No action needed"]

Continue this pattern for EVERY single log line in the data. Each log entry must have all three parts: 🔍, 📝, and 💡.

Log Data:
${logData}

Remember: Analyze EACH log line individually and provide the complete structured output above. Keep each analysis concise but complete.`;

    const response = await axios.post(GROQ_API_URL, {
      model: "llama3-8b-8192", // or "mixtral-8x7b-32768"
      messages: [
        {
          role: "system",
          content: "You are an expert system administrator and log analyst with deep experience in troubleshooting and monitoring applications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      top_p: 0.9
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    timer();
    const aiResponse = response.data.choices[0].message.content;
    console.log('🤖 GROQ Response Length:', aiResponse.length);
    console.log('🤖 GROQ Response Preview:', aiResponse.substring(0, 200) + '...');
    return aiResponse;
    
  } catch (error) {
    timer();
    console.error('GROQ API Error:', error.response?.data || error.message);
    
    // Fallback summary if GROQ fails
    return generateFallbackSummary(logData);
  }
}

// Fallback summary generator
function generateFallbackSummary(logData) {
  const lines = logData.split('\n').filter(line => line.trim());
  
  // Count different log types
  const errorLogs = lines.filter(line => 
    line.toLowerCase().includes('error') || 
    line.toLowerCase().includes('fail') ||
    line.toLowerCase().includes('exception')
  );
  
  const warningLogs = lines.filter(line => 
    line.toLowerCase().includes('warn') || 
    line.toLowerCase().includes('warning')
  );
  
  const infoLogs = lines.filter(line => 
    line.toLowerCase().includes('info') || 
    line.toLowerCase().includes('success')
  );
  
  const otherLogs = lines.filter(line => 
    !line.toLowerCase().includes('error') && 
    !line.toLowerCase().includes('fail') &&
    !line.toLowerCase().includes('exception') &&
    !line.toLowerCase().includes('warn') &&
    !line.toLowerCase().includes('warning') &&
    !line.toLowerCase().includes('info') &&
    !line.toLowerCase().includes('success')
  );

  let result = `SUMMARY: Info - ${infoLogs.length} logs, Error - ${errorLogs.length} logs, Warning - ${warningLogs.length} logs, Other - ${otherLogs.length} logs\n\nLOG ANALYSIS:\n`;
  
  // Analyze each log line
  lines.forEach((line, index) => {
    result += `🔍 Log ${index + 1}: ${line}\n`;
    
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
      result += `📝 Analysis: Error detected - system issue requiring attention\n`;
      result += `💡 Action: Investigate the error cause and implement fix\n\n`;
    } else if (line.toLowerCase().includes('warn')) {
      result += `📝 Analysis: Warning message - potential issue to monitor\n`;
      result += `💡 Action: Monitor this condition and consider preventive measures\n\n`;
    } else if (line.toLowerCase().includes('info') || line.toLowerCase().includes('success')) {
      result += `📝 Analysis: Informational message - normal system operation\n`;
      result += `💡 Action: No action needed\n\n`;
    } else {
      result += `📝 Analysis: Debug or trace message - normal system logging\n`;
      result += `💡 Action: No action needed\n\n`;
    }
  });
  
  return result;
}

// Routes
app.post('/summarize', async (req, res) => {
  try {
    const { logData } = req.body;
    
    if (!logData || logData.trim() === '') {
      return res.status(400).json({ 
        error: 'Log data is required',
        summary: null 
      });
    }

    console.log('📝 Processing log summarization request...');
    
    // Generate AI summary using GROQ
    const summary = await callGroqAPI(logData);
    
    // Update metrics
    summariesGenerated.inc();
    summaryLength.observe(summary.length);
    
    // Log the request (optional)
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'summarize',
      inputLength: logData.length,
      outputLength: summary.length,
      processed: true
    };
    
    if (fs.existsSync(path.dirname(logFilePath))) {
      fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
    }
    
    console.log('✅ Summary generated successfully');
    
    res.json({
      summary,
      metadata: {
        inputLength: logData.length,
        outputLength: summary.length,
        timestamp: new Date().toISOString(),
        model: 'groq-llama3'
      }
    });
    
  } catch (error) {
    console.error('❌ Summarization error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      summary: null 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ai-summarizer',
    groqConfigured: !!GROQ_API_KEY && GROQ_API_KEY !== 'your-groq-api-key'
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🤖 AI Summarizer running on port ${PORT}`);
  console.log(`🔑 GROQ API configured: ${GROQ_API_KEY !== 'your-groq-api-key'}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
});