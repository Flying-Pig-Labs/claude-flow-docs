# Claude Flow Competitive Research System

## Overview

The Claude Flow Competitive Research System provides automated, AI-powered competitive intelligence through three specialized research teams:

- **Red Team**: Market Disruption Analysis - Identifies features to extract and disrupt
- **Black Team**: Internal Tool Reverse Engineering - Discovers cost-saving tool opportunities  
- **White Team**: Whitespace Opportunity Analysis - Finds market gaps for new products

## System Architecture

```
Frontend Application
    ↓
Form Submission (Customized per team)
    ↓
Server API Endpoint
    ↓
Form Data Processor
    ↓
Remote Swarm Executor
    ↓
Claude Flow Research Swarm
    ↓
GitHub Repository (Results)
```

## Key Components

### 1. Form Customization Configuration (`form-customization-config.json`)
Defines all customizable fields for each team's research form:
- Field types, validations, and dependencies
- Dynamic conditional fields
- Default values and constraints

### 2. Form Data Processor (`form-data-processor.js`)
Server-side component that:
- Validates form submissions
- Generates dynamic research prompts
- Adjusts grading weights based on preferences
- Creates swarm execution configurations

### 3. Remote Swarm Executor (`remote-swarm-executor.sh`)
Shell script that:
- Executes research swarms in remote environments
- Monitors progress with visual indicators
- Creates GitHub repositories with results
- Sends webhook notifications

### 4. Server API Endpoint (`server-endpoint.js`)
RESTful API providing:
- Form field retrieval
- Research job submission
- Status polling
- Results delivery

### 5. Frontend Integration Guide
Comprehensive documentation for frontend developers including:
- API endpoint descriptions
- Field type rendering guidelines
- React implementation examples
- Error handling patterns

## Quick Start

### 1. Install Dependencies

```bash
npm install express body-parser cors uuid node-fetch
npm install -g @anthropic-ai/claude-code
npx claude-flow@alpha init --enhanced --sparc
```

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN="your-github-token"
export GITHUB_ORG="your-org" # Optional
export CLAUDE_FLOW_API_KEY="your-api-key"
export WEBHOOK_URL="https://your-webhook.com/notifications" # Optional
```

### 3. Start the Server

```bash
node server-endpoint.js
```

### 4. Submit a Research Request

Using the sample configurations:

```bash
# Red Team - Market Disruption
./remote-swarm-executor.sh \
  --config sample-configs/red-team-salesforce.json \
  --team red \
  --company "Salesforce" \
  --remote

# Black Team - Tool Reverse Engineering  
./remote-swarm-executor.sh \
  --config sample-configs/black-team-google.json \
  --team black \
  --company "Google" \
  --remote

# White Team - Whitespace Opportunities
./remote-swarm-executor.sh \
  --config sample-configs/white-team-microsoft.json \
  --team white \
  --company "Microsoft" \
  --remote
```

## Customization Options

### Red Team (Market Disruption)
- **Analysis Focus**: Revenue unbundling, feature extraction, geographic gaps
- **Market Scope**: Global, regional, or custom countries
- **Timeline**: Immediate to 2+ years
- **Investment Range**: Micro ($0-100K) to Large ($2M+)
- **Competition Preference**: Blue ocean to red ocean

### Black Team (Reverse Engineering)
- **Tool Categories**: Data infrastructure, dev tools, ML platforms, etc.
- **Information Sources**: Blogs, patents, GitHub, conferences
- **Implementation Complexity**: MVP to enhanced version
- **Team Size**: Solo developer to large team
- **Tech Stack**: JavaScript, Python, Go, Rust, etc.

### White Team (Whitespace)
- **Opportunity Types**: Integration gaps, workflow automation, vertical solutions
- **Customer Segments**: Enterprise to individual consumers
- **Business Models**: SaaS, usage-based, freemium, marketplace
- **Technical Approach**: API-only to full platform
- **Risk Tolerance**: Conservative to experimental

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/teams` | GET | Get available teams |
| `/teams/{type}/fields` | GET | Get form fields for team |
| `/research/submit` | POST | Submit research request |
| `/research/status/{id}` | GET | Check job status |
| `/research/results/{id}` | GET | Get research results |
| `/research/list` | GET | List all jobs |

## Output Structure

Research results are organized as follows:

```
company-name_team_timestamp/
├── README.md              # Repository overview
├── research/              # Research artifacts
├── data/                  # Raw JSON data
│   ├── raw-output.json
│   ├── findings.json
│   ├── recommendations.json
│   └── grading-matrix.json
├── reports/               # Generated reports
│   ├── executive-summary.md
│   └── full-report.md
└── visualizations/        # Charts and diagrams
```

## Grading System

Each opportunity is scored on four dimensions:

1. **Market Potential** (30%): TAM size, growth rate, customer urgency
2. **Competitive Advantage** (25%): Differentiation, defensibility
3. **Implementation Feasibility** (25%): Complexity, resources, time
4. **Strategic Value** (20%): Ecosystem fit, scalability

Weights are dynamically adjusted based on user preferences.

## Security Considerations

- All GitHub repositories are created as private by default
- API endpoints require authentication (implement as needed)
- Sensitive data is not logged
- Webhook URLs are validated before use

## Troubleshooting

### Common Issues

1. **Swarm execution fails**
   - Check Claude Flow installation: `npx claude-flow@alpha --version`
   - Verify API credentials are set
   - Check system resources (memory, disk space)

2. **GitHub repo creation fails**
   - Ensure GITHUB_TOKEN has repo creation permissions
   - Check organization permissions if using GITHUB_ORG
   - Verify repository name is valid

3. **Form validation errors**
   - Check that all required fields are provided
   - Verify field values match expected types
   - Ensure array fields have proper number of selections

## Advanced Usage

### Custom Grading Weights

Modify the grading weight presets in `form-customization-config.json`:

```json
"gradingWeightPresets": {
  "custom": {
    "description": "Your custom weighting",
    "weights": {
      "market_potential": 0.40,
      "competitive_advantage": 0.30,
      "implementation_feasibility": 0.20,
      "strategic_value": 0.10
    }
  }
}
```

### Webhook Integration

Webhooks receive notifications at key stages:

```json
{
  "jobId": "uuid",
  "status": "started|progress|completed|failed",
  "details": {
    "message": "Status message",
    "githubUrl": "https://github.com/..."
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Extending Field Types

Add new field types by:
1. Defining the field structure in config
2. Adding validation logic to processor
3. Implementing rendering in frontend
4. Updating documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- Documentation: This README and integration guide
- Issues: GitHub Issues
- Examples: Sample configuration files in `sample-configs/`

---

Built with Claude Flow - Intelligent Swarm Orchestration for Competitive Research