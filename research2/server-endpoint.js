#!/usr/bin/env node

/**
 * Server Endpoint for Claude Flow Competitive Research
 * RESTful API for form submission and swarm execution
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const FormDataProcessor = require('./form-data-processor');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Job storage (in production, use Redis or database)
const jobs = new Map();

// Initialize form processor
const formProcessor = new FormDataProcessor();

// Utility function to update job status
async function updateJobStatus(jobId, status, details = {}) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    job.details = { ...job.details, ...details };
    jobs.set(jobId, job);
    
    // Send webhook if configured
    if (job.webhookUrl) {
      try {
        await sendWebhook(job.webhookUrl, {
          jobId,
          status,
          details,
          timestamp: job.updatedAt
        });
      } catch (error) {
        console.error('Webhook error:', error);
      }
    }
  }
}

// Webhook sender
async function sendWebhook(url, data) {
  const fetch = require('node-fetch');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// API Routes

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /teams
 * Get available team configurations
 */
app.get('/teams', async (req, res) => {
  try {
    await formProcessor.initialize();
    const teams = formProcessor.config.teams;
    
    // Return team metadata without full field configs
    const teamMetadata = {};
    for (const [key, team] of Object.entries(teams)) {
      teamMetadata[key] = {
        name: team.name,
        templateId: team.templateId,
        description: team.description,
        fieldCount: Object.keys(team.fields).length
      };
    }
    
    res.json({
      success: true,
      teams: teamMetadata,
      gradingPresets: Object.keys(formProcessor.config.gradingWeightPresets)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /teams/:teamType/fields
 * Get form fields for a specific team
 */
app.get('/teams/:teamType/fields', async (req, res) => {
  try {
    const { teamType } = req.params;
    await formProcessor.initialize();
    
    const teamConfig = formProcessor.config.teams[teamType];
    if (!teamConfig) {
      return res.status(404).json({
        success: false,
        error: `Team type '${teamType}' not found`
      });
    }
    
    res.json({
      success: true,
      team: {
        name: teamConfig.name,
        description: teamConfig.description,
        templateId: teamConfig.templateId
      },
      fields: teamConfig.fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /research/submit
 * Submit research request
 */
app.post('/research/submit', async (req, res) => {
  try {
    const { teamType, formData, options = {} } = req.body;
    
    // Validate request
    if (!teamType || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: teamType, formData'
      });
    }
    
    // Initialize processor
    await formProcessor.initialize();
    
    // Process form submission
    const configuration = await formProcessor.processFormSubmission(teamType, formData);
    
    // Create job
    const jobId = uuidv4();
    const job = {
      id: jobId,
      teamType,
      companyName: formData.companyName,
      configuration,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      webhookUrl: options.webhookUrl || null,
      details: {}
    };
    
    jobs.set(jobId, job);
    
    // Execute asynchronously
    executeResearch(jobId, configuration, teamType);
    
    res.json({
      success: true,
      jobId,
      message: 'Research job submitted successfully',
      status: 'pending',
      pollUrl: `/research/status/${jobId}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /research/status/:jobId
 * Get job status
 */
app.get('/research/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      teamType: job.teamType,
      companyName: job.companyName,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      details: job.details
    }
  });
});

/**
 * GET /research/results/:jobId
 * Get job results
 */
app.get('/research/results/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: `Job is ${job.status}, not completed`,
      status: job.status
    });
  }
  
  try {
    // Read results from file system
    const resultsPath = job.details.resultsPath;
    if (!resultsPath) {
      throw new Error('Results path not found');
    }
    
    const executiveSummary = await fs.readFile(
      path.join(resultsPath, 'reports/executive-summary.md'), 
      'utf8'
    );
    const fullReport = await fs.readFile(
      path.join(resultsPath, 'reports/full-report.md'), 
      'utf8'
    );
    const rawData = JSON.parse(
      await fs.readFile(
        path.join(resultsPath, 'data/raw-output.json'), 
        'utf8'
      )
    );
    
    res.json({
      success: true,
      jobId,
      results: {
        executiveSummary,
        fullReport,
        rawData,
        githubUrl: job.details.githubUrl || null,
        resultsPath: resultsPath
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read results: ' + error.message
    });
  }
});

/**
 * GET /research/list
 * List all jobs (with pagination)
 */
app.get('/research/list', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  
  let jobList = Array.from(jobs.values());
  
  // Filter by status if provided
  if (status) {
    jobList = jobList.filter(job => job.status === status);
  }
  
  // Sort by creation date (newest first)
  jobList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Paginate
  const paginatedJobs = jobList.slice(offset, offset + parseInt(limit));
  
  res.json({
    success: true,
    jobs: paginatedJobs.map(job => ({
      id: job.id,
      teamType: job.teamType,
      companyName: job.companyName,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: jobList.length,
      pages: Math.ceil(jobList.length / limit)
    }
  });
});

/**
 * DELETE /research/:jobId
 * Cancel or delete a job
 */
app.delete('/research/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  // Update status
  if (job.status === 'running') {
    await updateJobStatus(jobId, 'cancelled');
    // TODO: Actually kill the running process
  }
  
  // Remove from jobs map
  jobs.delete(jobId);
  
  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

/**
 * Execute research asynchronously
 */
async function executeResearch(jobId, configuration, teamType) {
  try {
    await updateJobStatus(jobId, 'running', { startTime: new Date().toISOString() });
    
    // Save configuration to temp file
    const configPath = path.join('./configs', `${configuration.id}.json`);
    await fs.mkdir('./configs', { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(configuration, null, 2));
    
    // Build execution command
    const command = [
      './remote-swarm-executor.sh',
      `--config "${configPath}"`,
      `--team ${teamType}`,
      `--company "${configuration.companyName}"`,
      '--remote'
    ].join(' ');
    
    // Execute command
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
      if (error) {
        console.error('Execution error:', error);
        await updateJobStatus(jobId, 'failed', {
          error: error.message,
          stderr: stderr
        });
        return;
      }
      
      // Parse output to find results path
      const resultsPathMatch = stdout.match(/Results available at: (.+)/);
      const githubUrlMatch = stdout.match(/GitHub repository: (.+)/);
      
      if (resultsPathMatch) {
        await updateJobStatus(jobId, 'completed', {
          endTime: new Date().toISOString(),
          resultsPath: resultsPathMatch[1],
          githubUrl: githubUrlMatch ? githubUrlMatch[1] : null
        });
      } else {
        await updateJobStatus(jobId, 'failed', {
          error: 'Could not determine results path',
          stdout: stdout
        });
      }
    });
  } catch (error) {
    console.error('Execute research error:', error);
    await updateJobStatus(jobId, 'failed', {
      error: error.message
    });
  }
}

/**
 * Cleanup old jobs (run periodically)
 */
function cleanupOldJobs() {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
  
  for (const [jobId, job] of jobs.entries()) {
    const jobTime = new Date(job.createdAt).getTime();
    if (jobTime < cutoffTime && job.status !== 'running') {
      jobs.delete(jobId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Claude Flow Research API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;