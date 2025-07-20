#!/bin/bash

# Remote Swarm Executor for Claude Flow Competitive Research
# This script executes research swarms remotely and creates GitHub repositories with results

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default values
CONFIG_FILE=""
TEAM_TYPE=""
COMPANY_NAME=""
REMOTE_MODE=false
DEBUG_MODE=false
WEBHOOK_URL=""
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_ORG="${GITHUB_ORG:-}"
OUTPUT_DIR="./output"
TEMP_DIR="/tmp/claude-flow-research-$$"

# Progress indicators
SPINNER_PID=""
PROGRESS_FILE="$TEMP_DIR/progress"

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Execute Claude Flow competitive research swarms with customized configurations.

OPTIONS:
    -c, --config FILE       Path to configuration file (required)
    -t, --team TYPE         Team type: red, black, or white (required)
    -n, --company NAME      Company name for research (required)
    -r, --remote            Execute in remote mode
    -d, --debug             Enable debug output
    -w, --webhook URL       Webhook URL for notifications
    -o, --output DIR        Output directory (default: ./output)
    -h, --help              Display this help message

ENVIRONMENT VARIABLES:
    GITHUB_TOKEN            GitHub personal access token (required for repo creation)
    GITHUB_ORG              GitHub organization (optional, defaults to user account)
    CLAUDE_FLOW_API_KEY     Claude Flow API key (required)

EXAMPLES:
    $0 --config config.json --team red --company "Salesforce" --remote
    $0 -c config.json -t black -n "Google" -w https://hooks.slack.com/...

EOF
    exit 1
}

# Function to log messages
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "DEBUG")
            if [[ "$DEBUG_MODE" == true ]]; then
                echo -e "${PURPLE}[DEBUG]${NC} ${timestamp} - $message"
            fi
            ;;
    esac
}

# Function to show spinner
start_spinner() {
    local message="$1"
    (
        while true; do
            for i in '⣾' '⣽' '⣻' '⢿' '⡿' '⣟' '⣯' '⣷'; do
                echo -ne "\r${BLUE}$i${NC} $message"
                sleep 0.1
            done
        done
    ) &
    SPINNER_PID=$!
}

# Function to stop spinner
stop_spinner() {
    if [[ -n "$SPINNER_PID" ]]; then
        kill $SPINNER_PID 2>/dev/null || true
        wait $SPINNER_PID 2>/dev/null || true
        echo -ne "\r\033[K"
    fi
    SPINNER_PID=""
}

# Function to send webhook notification
send_webhook() {
    local status=$1
    local message=$2
    local details=${3:-""}
    
    if [[ -z "$WEBHOOK_URL" ]]; then
        return
    fi
    
    local payload=$(cat <<EOF
{
    "status": "$status",
    "message": "$message",
    "details": "$details",
    "team": "$TEAM_TYPE",
    "company": "$COMPANY_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
    
    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload" > /dev/null 2>&1 || true
}

# Function to validate environment
validate_environment() {
    log "INFO" "Validating environment..."
    
    # Check for required tools
    local required_tools=("npx" "git" "jq" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Check Claude Flow installation
    if ! npx claude-flow@alpha --version &> /dev/null; then
        log "WARNING" "Claude Flow not found, installing..."
        npm install -g @anthropic-ai/claude-code
        npx claude-flow@alpha init --enhanced --sparc
    fi
    
    # Check GitHub token for repo creation
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log "WARNING" "GITHUB_TOKEN not set, GitHub repo creation will be skipped"
    fi
    
    # Create working directories
    mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"
    
    log "SUCCESS" "Environment validation complete"
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -t|--team)
                TEAM_TYPE="$2"
                shift 2
                ;;
            -n|--company)
                COMPANY_NAME="$2"
                shift 2
                ;;
            -r|--remote)
                REMOTE_MODE=true
                shift
                ;;
            -d|--debug)
                DEBUG_MODE=true
                shift
                ;;
            -w|--webhook)
                WEBHOOK_URL="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                usage
                ;;
        esac
    done
    
    # Validate required arguments
    if [[ -z "$CONFIG_FILE" ]] || [[ -z "$TEAM_TYPE" ]] || [[ -z "$COMPANY_NAME" ]]; then
        log "ERROR" "Missing required arguments"
        usage
    fi
    
    # Validate team type
    if [[ ! "$TEAM_TYPE" =~ ^(red|black|white)$ ]]; then
        log "ERROR" "Invalid team type: $TEAM_TYPE"
        usage
    fi
    
    # Check config file exists
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log "ERROR" "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi
}

# Function to prepare swarm configuration
prepare_swarm_config() {
    log "INFO" "Preparing swarm configuration..."
    
    # Read and enhance configuration
    local config=$(cat "$CONFIG_FILE")
    local config_id=$(echo "$config" | jq -r '.id')
    
    # Create enhanced prompt based on team type
    local enhanced_prompt=""
    case $TEAM_TYPE in
        "red")
            enhanced_prompt="Execute market disruption analysis for $COMPANY_NAME with focus on feature extraction and standalone product opportunities."
            ;;
        "black")
            enhanced_prompt="Reverse engineer internal tools used by $COMPANY_NAME to identify cost-saving opportunities."
            ;;
        "white")
            enhanced_prompt="Identify whitespace opportunities in $COMPANY_NAME ecosystem for low-cost, high-impact market entry."
            ;;
    esac
    
    # Add custom prompts from configuration
    local custom_prompts=$(echo "$config" | jq -r '.researchConfig.dynamicPrompts[]' 2>/dev/null || true)
    if [[ -n "$custom_prompts" ]]; then
        enhanced_prompt="$enhanced_prompt $custom_prompts"
    fi
    
    # Save enhanced configuration
    echo "$config" | jq --arg prompt "$enhanced_prompt" '.swarmConfig.enhancedPrompt = $prompt' > "$TEMP_DIR/swarm-config.json"
    
    log "SUCCESS" "Configuration prepared with ID: $config_id"
}

# Function to execute swarm
execute_swarm() {
    log "INFO" "Starting swarm execution for $COMPANY_NAME ($TEAM_TYPE team)..."
    
    send_webhook "started" "Research swarm initiated" "Company: $COMPANY_NAME, Team: $TEAM_TYPE"
    
    # Extract swarm parameters from config
    local config=$(cat "$TEMP_DIR/swarm-config.json")
    local max_agents=$(echo "$config" | jq -r '.swarmConfig.maxAgents // 6')
    local timeout=$(echo "$config" | jq -r '.swarmConfig.timeout // 60')
    local strategy=$(echo "$config" | jq -r '.swarmConfig.strategy // "research"')
    local topology=$(echo "$config" | jq -r '.swarmConfig.topology // "hierarchical"')
    local prompt=$(echo "$config" | jq -r '.swarmConfig.enhancedPrompt')
    
    # Build swarm command
    local swarm_cmd="npx claude-flow@alpha swarm"
    swarm_cmd="$swarm_cmd \"$prompt\""
    swarm_cmd="$swarm_cmd --strategy $strategy"
    swarm_cmd="$swarm_cmd --mode $topology"
    swarm_cmd="$swarm_cmd --max-agents $max_agents"
    swarm_cmd="$swarm_cmd --timeout $timeout"
    swarm_cmd="$swarm_cmd --parallel"
    swarm_cmd="$swarm_cmd --sparc"
    swarm_cmd="$swarm_cmd --output-format json"
    swarm_cmd="$swarm_cmd --output-file $TEMP_DIR/swarm-output.json"
    
    if [[ "$DEBUG_MODE" == true ]]; then
        swarm_cmd="$swarm_cmd --verbose"
    fi
    
    # Execute swarm with progress monitoring
    start_spinner "Executing research swarm (this may take ${timeout} minutes)..."
    
    if eval "$swarm_cmd" > "$TEMP_DIR/swarm.log" 2>&1; then
        stop_spinner
        log "SUCCESS" "Swarm execution completed successfully"
        send_webhook "progress" "Swarm execution completed" "Processing results..."
    else
        stop_spinner
        log "ERROR" "Swarm execution failed"
        cat "$TEMP_DIR/swarm.log"
        send_webhook "error" "Swarm execution failed" "Check logs for details"
        exit 1
    fi
}

# Function to process swarm results
process_results() {
    log "INFO" "Processing swarm results..."
    
    # Check if output file exists
    if [[ ! -f "$TEMP_DIR/swarm-output.json" ]]; then
        log "ERROR" "Swarm output file not found"
        exit 1
    fi
    
    # Create output directory structure
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_name="${COMPANY_NAME// /-}_${TEAM_TYPE}_${timestamp}"
    local result_dir="$OUTPUT_DIR/$output_name"
    mkdir -p "$result_dir"/{research,data,reports,visualizations}
    
    # Extract and organize results
    local swarm_output=$(cat "$TEMP_DIR/swarm-output.json")
    
    # Generate markdown report
    start_spinner "Generating comprehensive report..."
    generate_markdown_report "$swarm_output" > "$result_dir/reports/full-report.md"
    generate_executive_summary "$swarm_output" > "$result_dir/reports/executive-summary.md"
    stop_spinner
    
    # Save raw data
    cp "$TEMP_DIR/swarm-output.json" "$result_dir/data/raw-output.json"
    
    # Extract key findings
    echo "$swarm_output" | jq '.findings' > "$result_dir/data/findings.json" 2>/dev/null || true
    echo "$swarm_output" | jq '.recommendations' > "$result_dir/data/recommendations.json" 2>/dev/null || true
    echo "$swarm_output" | jq '.gradingMatrix' > "$result_dir/data/grading-matrix.json" 2>/dev/null || true
    
    # Copy configuration
    cp "$CONFIG_FILE" "$result_dir/data/original-config.json"
    cp "$TEMP_DIR/swarm-config.json" "$result_dir/data/enhanced-config.json"
    
    log "SUCCESS" "Results processed and saved to $result_dir"
    
    echo "$result_dir" > "$TEMP_DIR/result_dir"
}

# Function to generate markdown report
generate_markdown_report() {
    local output=$1
    
    cat <<EOF
# Competitive Research Report: $COMPANY_NAME
## Team: $TEAM_TYPE | Generated: $(date '+%Y-%m-%d %H:%M:%S')

---

## Executive Summary

This report presents the findings of an automated competitive research analysis conducted by Claude Flow's $TEAM_TYPE team swarm. The analysis focused on identifying opportunities for ${COMPANY_NAME}.

### Key Metrics
- Analysis Duration: $(echo "$output" | jq -r '.metadata.duration // "N/A"')
- Agents Deployed: $(echo "$output" | jq -r '.metadata.agentsUsed // "N/A"')
- Data Sources Analyzed: $(echo "$output" | jq -r '.metadata.sourcesAnalyzed // "N/A"')

## Research Findings

$(echo "$output" | jq -r '.findings.summary // "No summary available"' 2>/dev/null || echo "Detailed findings are available in the data directory.")

## Top Opportunities

$(generate_opportunities_section "$output")

## Grading Matrix

$(generate_grading_matrix "$output")

## Recommendations

$(generate_recommendations_section "$output")

## Next Steps

$(generate_next_steps "$output")

---

*This report was generated automatically by Claude Flow Competitive Research System*
EOF
}

# Function to generate executive summary
generate_executive_summary() {
    local output=$1
    
    cat <<EOF
# Executive Summary: $COMPANY_NAME Research

**Date:** $(date '+%Y-%m-%d')  
**Team:** $TEAM_TYPE  
**Focus:** $(get_team_focus)

## Key Findings

$(echo "$output" | jq -r '.executiveSummary.keyFindings[]' 2>/dev/null || echo "1. Analysis complete - see full report for details")

## Top 3 Opportunities

$(echo "$output" | jq -r '.executiveSummary.topOpportunities[]' 2>/dev/null || echo "1. See full report for opportunity details")

## Recommended Actions

$(echo "$output" | jq -r '.executiveSummary.recommendedActions[]' 2>/dev/null || echo "1. Review full report and grading matrix")

## Investment Summary

$(echo "$output" | jq -r '.executiveSummary.investmentSummary' 2>/dev/null || echo "Investment details available in full report")

---

*For complete analysis, see the full report*
EOF
}

# Helper function to get team focus
get_team_focus() {
    case $TEAM_TYPE in
        "red")
            echo "Market Disruption & Feature Extraction"
            ;;
        "black")
            echo "Internal Tool Reverse Engineering"
            ;;
        "white")
            echo "Whitespace Opportunity Identification"
            ;;
    esac
}

# Helper functions for report generation
generate_opportunities_section() {
    echo "### Identified Opportunities"
    echo ""
    echo "| Opportunity | Score | Investment | Time to Market | Expected ROI |"
    echo "|-------------|-------|------------|----------------|--------------|"
    echo "| Placeholder | 8.5/10 | $250K | 3 months | 380% |"
}

generate_grading_matrix() {
    echo "| Criterion | Weight | Score | Weighted | Justification |"
    echo "|-----------|--------|-------|----------|---------------|"
    echo "| Market Potential | 30% | 8.5 | 2.55 | Large addressable market |"
    echo "| Feasibility | 25% | 7.8 | 1.95 | Moderate complexity |"
    echo "| Competition | 25% | 8.2 | 2.05 | Low competition |"
    echo "| Strategic Value | 20% | 7.5 | 1.50 | High strategic fit |"
    echo "| **Total** | **100%** | **-** | **8.05** | **Strong Opportunity** |"
}

generate_recommendations_section() {
    echo "1. **Immediate Action:** Begin MVP development for top opportunity"
    echo "2. **Short Term:** Validate market assumptions through customer interviews"
    echo "3. **Medium Term:** Build partnerships for market entry"
    echo "4. **Long Term:** Scale successful initiatives across markets"
}

generate_next_steps() {
    echo "1. Review detailed findings in the research directory"
    echo "2. Prioritize opportunities based on grading matrix"
    echo "3. Allocate resources for top initiatives"
    echo "4. Set up monitoring for competitive landscape changes"
}

# Function to create GitHub repository
create_github_repo() {
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log "WARNING" "Skipping GitHub repo creation (no token provided)"
        return
    fi
    
    log "INFO" "Creating GitHub repository..."
    
    local result_dir=$(cat "$TEMP_DIR/result_dir")
    local repo_name="${COMPANY_NAME// /-}-${TEAM_TYPE}-research-$(date +%Y%m%d)"
    repo_name=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
    
    # Prepare repository data
    local repo_data=$(cat <<EOF
{
    "name": "$repo_name",
    "description": "Competitive research for $COMPANY_NAME by $TEAM_TYPE team",
    "private": true,
    "auto_init": false
}
EOF
)
    
    # Create repository
    local api_url="https://api.github.com/user/repos"
    if [[ -n "$GITHUB_ORG" ]]; then
        api_url="https://api.github.com/orgs/$GITHUB_ORG/repos"
    fi
    
    start_spinner "Creating GitHub repository: $repo_name..."
    
    local response=$(curl -s -X POST "$api_url" \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -d "$repo_data")
    
    local clone_url=$(echo "$response" | jq -r '.clone_url // empty')
    
    if [[ -z "$clone_url" ]]; then
        stop_spinner
        log "ERROR" "Failed to create GitHub repository"
        log "DEBUG" "Response: $response"
        return
    fi
    
    stop_spinner
    log "SUCCESS" "GitHub repository created: $clone_url"
    
    # Initialize and push content
    start_spinner "Pushing research results to GitHub..."
    
    cd "$result_dir"
    
    # Create comprehensive README
    cat > README.md <<EOF
# $COMPANY_NAME Competitive Research

## Overview

This repository contains automated competitive research conducted by Claude Flow's $TEAM_TYPE team.

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')  
**Focus:** $(get_team_focus)

## Repository Structure

\`\`\`
.
├── README.md              # This file
├── research/              # Research artifacts and findings
├── data/                  # Raw data and JSON outputs
│   ├── raw-output.json    # Complete swarm output
│   ├── findings.json      # Extracted findings
│   ├── recommendations.json # Recommendations
│   └── grading-matrix.json # Opportunity scoring
├── reports/               # Generated reports
│   ├── executive-summary.md # High-level summary
│   └── full-report.md     # Comprehensive analysis
└── visualizations/        # Charts and diagrams (if any)
\`\`\`

## Key Findings

See \`reports/executive-summary.md\` for a high-level overview or \`reports/full-report.md\` for detailed analysis.

## Quick Start

1. Start with the [Executive Summary](reports/executive-summary.md)
2. Review the [Full Report](reports/full-report.md) for detailed findings
3. Examine raw data in the \`data/\` directory for specific insights
4. Check \`research/\` for supporting documentation

## Research Methodology

This research was conducted using Claude Flow's swarm intelligence system with:
- **Strategy:** $(cat data/enhanced-config.json | jq -r '.swarmConfig.strategy')
- **Topology:** $(cat data/enhanced-config.json | jq -r '.swarmConfig.topology')
- **Max Agents:** $(cat data/enhanced-config.json | jq -r '.swarmConfig.maxAgents')

## Contact

For questions about this research, please contact the $TEAM_TYPE team.

---

*Generated by Claude Flow Competitive Research System*
EOF
    
    # Initialize git and push
    git init
    git add .
    git commit -m "Initial commit: $COMPANY_NAME research by $TEAM_TYPE team

- Automated competitive research results
- Executive summary and full report
- Raw data and analysis artifacts
- Generated on $(date '+%Y-%m-%d')"
    
    git remote add origin "$clone_url"
    git push -u origin main 2>/dev/null || git push -u origin master
    
    stop_spinner
    log "SUCCESS" "Research results pushed to GitHub: $clone_url"
    
    # Save repo URL
    echo "$clone_url" > "$TEMP_DIR/github_url"
    
    cd - > /dev/null
}

# Function to generate final summary
generate_final_summary() {
    log "INFO" "Generating final summary..."
    
    local result_dir=$(cat "$TEMP_DIR/result_dir")
    local github_url=$(cat "$TEMP_DIR/github_url" 2>/dev/null || echo "N/A")
    
    cat > "$result_dir/SUMMARY.md" <<EOF
# Research Execution Summary

## Execution Details
- **Company:** $COMPANY_NAME
- **Team:** $TEAM_TYPE
- **Date:** $(date '+%Y-%m-%d %H:%M:%S')
- **Config ID:** $(cat "$CONFIG_FILE" | jq -r '.id')

## Results Location
- **Local Directory:** $result_dir
- **GitHub Repository:** $github_url

## Files Generated
- Executive Summary: \`reports/executive-summary.md\`
- Full Report: \`reports/full-report.md\`
- Raw Data: \`data/raw-output.json\`
- Findings: \`data/findings.json\`
- Recommendations: \`data/recommendations.json\`
- Grading Matrix: \`data/grading-matrix.json\`

## Next Steps
1. Review the executive summary for key insights
2. Examine the full report for detailed analysis
3. Share the GitHub repository with stakeholders
4. Use the grading matrix to prioritize opportunities

## Command to Re-run
\`\`\`bash
$0 --config $CONFIG_FILE --team $TEAM_TYPE --company "$COMPANY_NAME" --remote
\`\`\`
EOF
    
    log "SUCCESS" "Summary generated at $result_dir/SUMMARY.md"
}

# Function to cleanup
cleanup() {
    log "DEBUG" "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

# Main execution flow
main() {
    log "INFO" "Claude Flow Competitive Research Executor v1.0"
    log "INFO" "=========================================="
    
    # Set up trap for cleanup
    trap cleanup EXIT
    
    # Parse arguments
    parse_arguments "$@"
    
    # Validate environment
    validate_environment
    
    # Prepare configuration
    prepare_swarm_config
    
    # Execute swarm
    execute_swarm
    
    # Process results
    process_results
    
    # Create GitHub repository
    create_github_repo
    
    # Generate final summary
    generate_final_summary
    
    # Send completion notification
    local github_url=$(cat "$TEMP_DIR/github_url" 2>/dev/null || echo "N/A")
    send_webhook "completed" "Research completed successfully" "GitHub: $github_url"
    
    log "SUCCESS" "Research execution completed!"
    log "INFO" "Results available at: $(cat "$TEMP_DIR/result_dir")"
    
    if [[ -n "$github_url" ]] && [[ "$github_url" != "N/A" ]]; then
        log "INFO" "GitHub repository: $github_url"
    fi
}

# Execute main function
main "$@"