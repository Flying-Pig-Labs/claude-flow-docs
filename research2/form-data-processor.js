#!/usr/bin/env node

/**
 * Form Data Processor for Claude Flow Competitive Research
 * Processes form submissions and generates swarm configurations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FormDataProcessor {
  constructor(configPath = './form-customization-config.json') {
    this.configPath = configPath;
    this.config = null;
    this.templates = {
      1: require('./CLAUDE_FLOW_COMPETITIVE_RESEARCH_TEMPLATES.md').template1,
      2: require('./CLAUDE_FLOW_COMPETITIVE_RESEARCH_TEMPLATES.md').template2,
      3: require('./CLAUDE_FLOW_COMPETITIVE_RESEARCH_TEMPLATES.md').template3
    };
  }

  async initialize() {
    const configContent = await fs.readFile(this.configPath, 'utf8');
    this.config = JSON.parse(configContent);
  }

  /**
   * Validate form data against team configuration
   */
  validateFormData(teamType, formData) {
    const teamConfig = this.config.teams[teamType];
    if (!teamConfig) {
      throw new Error(`Invalid team type: ${teamType}`);
    }

    const errors = [];
    const validated = {};

    // Validate each field
    for (const [fieldName, fieldConfig] of Object.entries(teamConfig.fields)) {
      const value = formData[fieldName];

      // Check required fields
      if (fieldConfig.required && !value) {
        errors.push(`${fieldName} is required`);
        continue;
      }

      // Skip optional empty fields
      if (!value && !fieldConfig.required) {
        continue;
      }

      // Type-specific validation
      switch (fieldConfig.type) {
        case 'text':
          if (fieldConfig.validation) {
            if (fieldConfig.validation.minLength && value.length < fieldConfig.validation.minLength) {
              errors.push(`${fieldName} must be at least ${fieldConfig.validation.minLength} characters`);
            }
            if (fieldConfig.validation.maxLength && value.length > fieldConfig.validation.maxLength) {
              errors.push(`${fieldName} must be at most ${fieldConfig.validation.maxLength} characters`);
            }
          }
          validated[fieldName] = value.trim();
          break;

        case 'multiselect':
        case 'checkbox':
          if (!Array.isArray(value)) {
            errors.push(`${fieldName} must be an array`);
            break;
          }
          if (fieldConfig.minSelections && value.length < fieldConfig.minSelections) {
            errors.push(`${fieldName} requires at least ${fieldConfig.minSelections} selections`);
          }
          if (fieldConfig.maxSelections && value.length > fieldConfig.maxSelections) {
            errors.push(`${fieldName} allows at most ${fieldConfig.maxSelections} selections`);
          }
          validated[fieldName] = value;
          break;

        case 'dropdown':
        case 'radio':
          const validOptions = fieldConfig.options.map(opt => opt.value);
          if (!validOptions.includes(value)) {
            errors.push(`${fieldName} has invalid value: ${value}`);
          }
          validated[fieldName] = value;
          break;

        case 'slider':
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${fieldName} must be a number`);
            break;
          }
          if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
            errors.push(`${fieldName} must be at least ${fieldConfig.min}`);
          }
          if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
            errors.push(`${fieldName} must be at most ${fieldConfig.max}`);
          }
          validated[fieldName] = numValue;
          break;

        case 'tags':
          if (!Array.isArray(value)) {
            errors.push(`${fieldName} must be an array`);
            break;
          }
          if (fieldConfig.maxTags && value.length > fieldConfig.maxTags) {
            errors.push(`${fieldName} allows at most ${fieldConfig.maxTags} tags`);
          }
          validated[fieldName] = value;
          break;

        case 'toggles':
          if (typeof value !== 'object') {
            errors.push(`${fieldName} must be an object`);
            break;
          }
          validated[fieldName] = value;
          break;

        case 'range':
          if (!Array.isArray(value) && typeof value !== 'string') {
            errors.push(`${fieldName} must be a range selection`);
          }
          validated[fieldName] = value;
          break;

        default:
          validated[fieldName] = value;
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return validated;
  }

  /**
   * Generate dynamic prompts based on form selections
   */
  generateDynamicPrompts(teamType, formData) {
    const prompts = [];
    
    switch (teamType) {
      case 'red':
        // Market Disruption prompts
        if (formData.analysisFocus?.includes('revenue_unbundling')) {
          prompts.push('Focus heavily on analyzing revenue streams and identifying which features contribute most to revenue.');
        }
        if (formData.analysisFocus?.includes('geographic_gaps')) {
          prompts.push(`Specifically analyze market penetration in ${formData.marketScope} markets.`);
        }
        if (formData.customKeywords?.length > 0) {
          prompts.push(`Include specific analysis of: ${formData.customKeywords.join(', ')}`);
        }
        if (formData.disruptionTimeline <= 6) {
          prompts.push('Prioritize opportunities that can be executed within 6 months.');
        }
        break;

      case 'black':
        // Reverse Engineering prompts
        if (formData.toolCategories?.includes('ml_platforms')) {
          prompts.push('Deep dive into ML/AI infrastructure, including training pipelines and model serving.');
        }
        if (formData.evidenceThreshold >= 3) {
          prompts.push('Only include tools with high confidence (4+ independent sources of evidence).');
        }
        if (formData.existingTools?.length > 0) {
          prompts.push(`Compare specifically against these tools: ${formData.existingTools.join(', ')}`);
        }
        break;

      case 'white':
        // Whitespace prompts
        if (formData.riskTolerance >= 4) {
          prompts.push('Include experimental and unproven market opportunities with high potential.');
        }
        if (formData.opportunityTypes?.includes('platform_extensions')) {
          prompts.push('Focus on opportunities that extend the platform ecosystem.');
        }
        if (formData.targetCustomerSize?.includes('enterprise')) {
          prompts.push('Prioritize enterprise-grade solutions with compliance and security features.');
        }
        break;
    }

    return prompts;
  }

  /**
   * Adjust grading weights based on user preferences
   */
  adjustGradingWeights(teamType, formData) {
    // Start with default weights
    let weights = { ...this.config.gradingWeightPresets.balanced.weights };

    // Adjust based on team type and preferences
    switch (teamType) {
      case 'red':
        if (formData.disruptionTimeline <= 6) {
          // Speed is important
          weights.implementation_feasibility *= 1.3;
          weights.market_potential *= 0.9;
        }
        if (formData.competitiveIntensity === 'blue_ocean') {
          weights.competitive_advantage *= 1.4;
        }
        break;

      case 'black':
        if (formData.teamSizeConstraint === 'solo' || formData.teamSizeConstraint === 'small') {
          weights.implementation_feasibility *= 1.5;
          weights.strategic_value *= 0.8;
        }
        break;

      case 'white':
        if (formData.successMetrics?.includes('revenue')) {
          weights.market_potential *= 1.3;
        }
        if (formData.successMetrics?.includes('strategic')) {
          weights.strategic_value *= 1.4;
        }
        break;
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    for (const key in weights) {
      weights[key] = weights[key] / totalWeight;
    }

    return weights;
  }

  /**
   * Calculate optimal swarm parameters
   */
  calculateSwarmParameters(teamType, formData) {
    const params = {
      maxAgents: 6,
      timeout: 60,
      strategy: 'research',
      topology: 'hierarchical',
      parallel: true
    };

    // Adjust based on scope and complexity
    switch (teamType) {
      case 'red':
        if (formData.analysisFocus?.length > 3) {
          params.maxAgents = 8;
          params.timeout = 90;
        }
        if (formData.marketScope === 'global') {
          params.maxAgents = Math.max(params.maxAgents, 10);
        }
        break;

      case 'black':
        params.topology = 'mesh'; // Better for technical analysis
        if (formData.toolCategories?.length > 4) {
          params.maxAgents = 10;
          params.timeout = 120;
        }
        break;

      case 'white':
        if (formData.opportunityTypes?.length > 5) {
          params.maxAgents = 12;
          params.timeout = 120;
        }
        if (formData.riskTolerance >= 4) {
          params.strategy = 'exploration'; // More experimental
        }
        break;
    }

    return params;
  }

  /**
   * Generate complete swarm configuration
   */
  async processFormSubmission(teamType, formData) {
    // Validate input
    const validated = this.validateFormData(teamType, formData);

    // Generate configuration ID
    const configId = crypto.randomBytes(16).toString('hex');

    // Get base template
    const templateId = this.config.teams[teamType].templateId;
    
    // Generate components
    const dynamicPrompts = this.generateDynamicPrompts(teamType, validated);
    const gradingWeights = this.adjustGradingWeights(teamType, validated);
    const swarmParams = this.calculateSwarmParameters(teamType, validated);

    // Build complete configuration
    const configuration = {
      id: configId,
      timestamp: new Date().toISOString(),
      team: teamType,
      templateId: templateId,
      companyName: validated.companyName,
      
      swarmConfig: {
        ...swarmParams,
        objective: `${this.config.teams[teamType].description} for ${validated.companyName}`,
        metadata: {
          team: teamType,
          submissionId: configId,
          customizations: validated
        }
      },

      researchConfig: {
        baseTemplate: templateId,
        dynamicPrompts: dynamicPrompts,
        focusAreas: this.extractFocusAreas(teamType, validated),
        constraints: this.extractConstraints(teamType, validated),
        outputRequirements: this.getOutputRequirements(teamType, validated)
      },

      gradingConfig: {
        weights: gradingWeights,
        thresholds: this.getGradingThresholds(teamType, validated),
        customCriteria: this.getCustomCriteria(teamType, validated)
      },

      executionConfig: {
        environment: 'production',
        githubRepo: {
          create: true,
          name: `${validated.companyName.toLowerCase().replace(/\s+/g, '-')}-${teamType}-research-${Date.now()}`,
          visibility: 'private',
          template: `competitive-research-${teamType}`
        },
        notifications: {
          webhook: process.env.WEBHOOK_URL || null,
          email: process.env.NOTIFICATION_EMAIL || null
        }
      }
    };

    // Save configuration
    const configPath = path.join('./configs', `${configId}.json`);
    await fs.mkdir('./configs', { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(configuration, null, 2));

    return configuration;
  }

  /**
   * Extract focus areas from form data
   */
  extractFocusAreas(teamType, formData) {
    const focusAreas = [];

    switch (teamType) {
      case 'red':
        if (formData.analysisFocus) {
          focusAreas.push(...formData.analysisFocus);
        }
        if (formData.industryVerticals && !formData.industryVerticals.includes('all')) {
          focusAreas.push(`industry_focus:${formData.industryVerticals.join(',')}`);
        }
        break;

      case 'black':
        if (formData.toolCategories) {
          focusAreas.push(...formData.toolCategories);
        }
        if (formData.informationSources) {
          const activeSources = Object.entries(formData.informationSources)
            .filter(([_, enabled]) => enabled)
            .map(([source, _]) => source);
          focusAreas.push(`sources:${activeSources.join(',')}`);
        }
        break;

      case 'white':
        if (formData.opportunityTypes) {
          focusAreas.push(...formData.opportunityTypes);
        }
        if (formData.businessModelPreference) {
          focusAreas.push(`models:${formData.businessModelPreference.join(',')}`);
        }
        break;
    }

    return focusAreas;
  }

  /**
   * Extract constraints from form data
   */
  extractConstraints(teamType, formData) {
    const constraints = {};

    switch (teamType) {
      case 'red':
        constraints.timeline = formData.disruptionTimeline;
        constraints.investmentRange = formData.investmentRange;
        constraints.marketSize = formData.targetMarketSize;
        constraints.competition = formData.competitiveIntensity;
        break;

      case 'black':
        constraints.complexity = formData.implementationComplexity;
        constraints.teamSize = formData.teamSizeConstraint;
        constraints.techStack = formData.techStackPreference;
        constraints.timeToMarket = formData.timeToMarket;
        break;

      case 'white':
        constraints.entrySpeed = formData.marketEntrySpeed;
        constraints.riskLevel = formData.riskTolerance;
        constraints.minOpportunitySize = formData.minimumOpportunitySize;
        constraints.technicalApproach = formData.technicalApproach;
        break;
    }

    return constraints;
  }

  /**
   * Get output requirements based on preferences
   */
  getOutputRequirements(teamType, formData) {
    const requirements = {
      format: 'comprehensive-markdown',
      sections: ['executive-summary', 'detailed-analysis', 'recommendations', 'grading-matrix'],
      visualizations: true,
      exportFormats: ['md', 'json', 'pdf']
    };

    // Add team-specific requirements
    switch (teamType) {
      case 'red':
        requirements.sections.push('disruption-roadmap', 'investment-analysis');
        requirements.financialModeling = true;
        break;

      case 'black':
        requirements.sections.push('implementation-blueprint', 'cost-comparison');
        requirements.technicalDiagrams = true;
        break;

      case 'white':
        requirements.sections.push('opportunity-matrix', 'go-to-market-strategy');
        requirements.marketMaps = true;
        break;
    }

    return requirements;
  }

  /**
   * Get grading thresholds
   */
  getGradingThresholds(teamType, formData) {
    const thresholds = {
      excellent: 8.5,
      good: 7.0,
      fair: 5.5,
      poor: 4.0
    };

    // Adjust based on risk tolerance or other factors
    if (teamType === 'white' && formData.riskTolerance >= 4) {
      // More aggressive = lower thresholds
      thresholds.excellent = 8.0;
      thresholds.good = 6.5;
      thresholds.fair = 5.0;
    }

    return thresholds;
  }

  /**
   * Get custom grading criteria
   */
  getCustomCriteria(teamType, formData) {
    const criteria = [];

    switch (teamType) {
      case 'red':
        if (formData.disruptionStrategy) {
          criteria.push({
            name: 'disruption_effectiveness',
            weight: 0.15,
            description: `Effectiveness of ${formData.disruptionStrategy} strategy`
          });
        }
        break;

      case 'black':
        if (formData.existingTools?.length > 0) {
          criteria.push({
            name: 'replacement_value',
            weight: 0.20,
            description: 'Value of replacing existing tools'
          });
        }
        break;

      case 'white':
        if (formData.ecosystemIntegration?.length > 0) {
          criteria.push({
            name: 'ecosystem_fit',
            weight: 0.15,
            description: 'Integration with existing ecosystem'
          });
        }
        break;
    }

    return criteria;
  }

  /**
   * Generate shell command for execution
   */
  generateExecutionCommand(configuration) {
    const configPath = `./configs/${configuration.id}.json`;
    const command = [
      './remote-swarm-executor.sh',
      `--config ${configPath}`,
      `--team ${configuration.team}`,
      `--company "${configuration.companyName}"`,
      '--remote'
    ].join(' ');

    return command;
  }
}

// Export for use in other modules
module.exports = FormDataProcessor;

// CLI execution
if (require.main === module) {
  const processor = new FormDataProcessor();
  
  // Example usage
  const exampleFormData = {
    companyName: "Salesforce",
    analysisFocus: ["feature_extraction", "pricing_disruption"],
    marketScope: "global",
    disruptionTimeline: 6,
    investmentRange: "small",
    targetMarketSize: ["hundred_million", "billion_plus"],
    competitiveIntensity: "low_competition",
    customKeywords: ["automation", "integration"],
    disruptionStrategy: "price"
  };

  processor.initialize().then(async () => {
    try {
      const config = await processor.processFormSubmission('red', exampleFormData);
      console.log('Generated configuration:', JSON.stringify(config, null, 2));
      console.log('\nExecution command:', processor.generateExecutionCommand(config));
    } catch (error) {
      console.error('Error:', error.message);
    }
  });
}