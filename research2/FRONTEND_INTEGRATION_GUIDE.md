# Frontend Integration Guide for Claude Flow Competitive Research

## Overview

This guide explains how to integrate the Claude Flow Competitive Research system with your frontend application. The system provides customizable forms for three research teams (Red, Black, White) with different focus areas and configurations.

## API Endpoints

### Base URL
```
https://api.your-domain.com/research
```

### Available Endpoints

#### 1. Get Available Teams
```http
GET /teams
```

**Response:**
```json
{
  "success": true,
  "teams": {
    "red": {
      "name": "Red Team - Market Disruption Analysis",
      "templateId": 1,
      "description": "Analyze competitors' business models...",
      "fieldCount": 10
    },
    "black": {
      "name": "Black Team - Internal Tool Reverse Engineering",
      "templateId": 2,
      "description": "Identify and analyze internal tools...",
      "fieldCount": 11
    },
    "white": {
      "name": "White Team - Whitespace Opportunity Analysis",
      "templateId": 3,
      "description": "Identify market gaps and whitespace...",
      "fieldCount": 12
    }
  },
  "gradingPresets": ["balanced", "market_focused", "speed_focused", "strategic"]
}
```

#### 2. Get Form Fields for Specific Team
```http
GET /teams/{teamType}/fields
```

**Parameters:**
- `teamType`: One of `red`, `black`, or `white`

**Response:**
```json
{
  "success": true,
  "team": {
    "name": "Red Team - Market Disruption Analysis",
    "description": "...",
    "templateId": 1
  },
  "fields": {
    "companyName": {
      "type": "text",
      "label": "Target Company Name",
      "required": true,
      "placeholder": "e.g., Salesforce, HubSpot",
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    // ... other fields
  }
}
```

#### 3. Submit Research Request
```http
POST /research/submit
```

**Request Body:**
```json
{
  "teamType": "red",
  "formData": {
    "companyName": "Salesforce",
    "analysisFocus": ["feature_extraction", "pricing_disruption"],
    "marketScope": "global",
    "disruptionTimeline": 6,
    "investmentRange": "small",
    "targetMarketSize": ["hundred_million", "billion_plus"],
    "competitiveIntensity": "low_competition",
    "customKeywords": ["automation", "integration"],
    "disruptionStrategy": "price"
  },
  "options": {
    "webhookUrl": "https://your-webhook.com/notifications"
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Research job submitted successfully",
  "status": "pending",
  "pollUrl": "/research/status/123e4567-e89b-12d3-a456-426614174000"
}
```

#### 4. Check Job Status
```http
GET /research/status/{jobId}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "running", // pending, running, completed, failed, cancelled
    "teamType": "red",
    "companyName": "Salesforce",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "details": {
      "startTime": "2024-01-15T10:31:00Z"
    }
  }
}
```

#### 5. Get Research Results
```http
GET /research/results/{jobId}
```

**Response (when completed):**
```json
{
  "success": true,
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "results": {
    "executiveSummary": "# Executive Summary...",
    "fullReport": "# Competitive Research Report...",
    "rawData": { /* JSON data */ },
    "githubUrl": "https://github.com/org/salesforce-red-research-20240115",
    "resultsPath": "./output/salesforce_red_20240115_103000"
  }
}
```

## Form Field Types and Rendering

### 1. Text Field
```javascript
{
  "type": "text",
  "label": "Target Company Name",
  "required": true,
  "placeholder": "e.g., Salesforce, HubSpot",
  "validation": {
    "minLength": 2,
    "maxLength": 100
  }
}
```
**Render as:** Standard text input

### 2. Multiselect Field
```javascript
{
  "type": "multiselect",
  "label": "Analysis Focus Areas",
  "required": true,
  "options": [
    {"value": "revenue_unbundling", "label": "Revenue Stream Unbundling"},
    {"value": "feature_extraction", "label": "Feature Extraction Opportunities"}
  ],
  "default": ["feature_extraction"],
  "minSelections": 1,
  "maxSelections": 5
}
```
**Render as:** Checkbox group or multi-select dropdown

### 3. Dropdown Field
```javascript
{
  "type": "dropdown",
  "label": "Geographic Market Scope",
  "required": true,
  "options": [
    {"value": "global", "label": "Global Markets"},
    {"value": "north_america", "label": "North America"}
  ],
  "default": "global",
  "conditionalFields": {
    "custom": ["customCountries"]
  }
}
```
**Render as:** Select dropdown

### 4. Slider Field
```javascript
{
  "type": "slider",
  "label": "Target Disruption Timeline",
  "required": true,
  "min": 0,
  "max": 24,
  "step": 3,
  "default": 6,
  "unit": "months",
  "labels": {
    "0": "Immediate",
    "6": "6 months",
    "12": "1 year"
  }
}
```
**Render as:** Range slider with labels

### 5. Radio Field
```javascript
{
  "type": "radio",
  "label": "Competitive Landscape Preference",
  "required": true,
  "options": [
    {"value": "blue_ocean", "label": "Blue Ocean Only"},
    {"value": "low_competition", "label": "Low Competition"}
  ],
  "default": "low_competition"
}
```
**Render as:** Radio button group

### 6. Checkbox Field
```javascript
{
  "type": "checkbox",
  "label": "Acceptable Market Sizes",
  "required": true,
  "options": [
    {"value": "billion_plus", "label": "Billion+ Dollar Opportunity"},
    {"value": "hundred_million", "label": "$100M-$1B Opportunity"}
  ],
  "default": ["billion_plus"],
  "minSelections": 1
}
```
**Render as:** Checkbox group

### 7. Tags Field
```javascript
{
  "type": "tags",
  "label": "Additional Search Keywords",
  "required": false,
  "placeholder": "Add custom search terms...",
  "maxTags": 10,
  "examples": ["API", "automation", "integration"]
}
```
**Render as:** Tag input component

### 8. Toggle Field
```javascript
{
  "type": "toggles",
  "label": "Information Sources to Use",
  "required": true,
  "options": [
    {"value": "eng_blogs", "label": "Engineering Blogs", "default": true},
    {"value": "patents", "label": "Patent Database", "default": true}
  ]
}
```
**Render as:** Toggle switches

### 9. Range Field
```javascript
{
  "type": "range",
  "label": "Investment Range Preference",
  "required": true,
  "options": [
    {"value": "micro", "label": "Micro ($0-$100K)", "min": 0, "max": 100000},
    {"value": "small", "label": "Small ($100K-$500K)", "min": 100000, "max": 500000}
  ],
  "default": "small",
  "allowMultiple": true
}
```
**Render as:** Range selector or multi-checkbox

## Frontend Implementation Example (React)

### Form Component
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ResearchForm({ teamType }) {
  const [fields, setFields] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch form fields for selected team
    fetchFormFields(teamType);
  }, [teamType]);

  const fetchFormFields = async (team) => {
    try {
      const response = await axios.get(`/api/teams/${team}/fields`);
      setFields(response.data.fields);
      initializeFormData(response.data.fields);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const initializeFormData = (fields) => {
    const initialData = {};
    Object.entries(fields).forEach(([key, field]) => {
      if (field.default !== undefined) {
        initialData[key] = field.default;
      } else if (field.type === 'multiselect' || field.type === 'checkbox') {
        initialData[key] = [];
      } else if (field.type === 'toggles') {
        initialData[key] = {};
        field.options.forEach(opt => {
          initialData[key][opt.value] = opt.default || false;
        });
      }
    });
    setFormData(initialData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/research/submit', {
        teamType,
        formData,
        options: {
          webhookUrl: 'https://your-webhook.com/notifications'
        }
      });

      // Poll for status or redirect to results page
      pollJobStatus(response.data.jobId);
    } catch (error) {
      console.error('Submission error:', error);
      setLoading(false);
    }
  };

  const renderField = (fieldName, fieldConfig) => {
    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[fieldName] || ''}
            onChange={(e) => setFormData({...formData, [fieldName]: e.target.value})}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
          />
        );

      case 'multiselect':
        return (
          <div>
            {fieldConfig.options.map(opt => (
              <label key={opt.value}>
                <input
                  type="checkbox"
                  checked={formData[fieldName]?.includes(opt.value) || false}
                  onChange={(e) => {
                    const current = formData[fieldName] || [];
                    const updated = e.target.checked
                      ? [...current, opt.value]
                      : current.filter(v => v !== opt.value);
                    setFormData({...formData, [fieldName]: updated});
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div>
            <input
              type="range"
              min={fieldConfig.min}
              max={fieldConfig.max}
              step={fieldConfig.step}
              value={formData[fieldName] || fieldConfig.default}
              onChange={(e) => setFormData({...formData, [fieldName]: Number(e.target.value)})}
            />
            <span>{formData[fieldName] || fieldConfig.default} {fieldConfig.unit}</span>
          </div>
        );

      // Add other field types...

      default:
        return <div>Unsupported field type: {fieldConfig.type}</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(fields).map(([fieldName, fieldConfig]) => (
        <div key={fieldName} className="form-field">
          <label>
            {fieldConfig.label}
            {fieldConfig.required && <span className="required">*</span>}
          </label>
          {renderField(fieldName, fieldConfig)}
        </div>
      ))}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Start Research'}
      </button>
    </form>
  );
}
```

### Status Polling
```javascript
const pollJobStatus = async (jobId) => {
  const pollInterval = 5000; // 5 seconds
  
  const checkStatus = async () => {
    try {
      const response = await axios.get(`/api/research/status/${jobId}`);
      const { status, details } = response.data.job;
      
      switch (status) {
        case 'completed':
          // Fetch and display results
          const results = await axios.get(`/api/research/results/${jobId}`);
          displayResults(results.data.results);
          break;
          
        case 'failed':
          console.error('Job failed:', details.error);
          setLoading(false);
          break;
          
        case 'running':
        case 'pending':
          // Continue polling
          setTimeout(checkStatus, pollInterval);
          break;
      }
    } catch (error) {
      console.error('Status check error:', error);
      setLoading(false);
    }
  };
  
  checkStatus();
};
```

## Conditional Fields

Some fields may appear based on selections in other fields:

```javascript
// Example: Show custom countries field when "custom" is selected
const shouldShowField = (fieldName, fieldConfig) => {
  if (fieldConfig.showIf) {
    // Parse condition like "marketScope === 'custom'"
    const [dependentField, operator, value] = fieldConfig.showIf.match(/(\w+)\s*===\s*'(\w+)'/).slice(1);
    return formData[dependentField] === value;
  }
  return true;
};
```

## Validation

Implement client-side validation based on field configurations:

```javascript
const validateForm = () => {
  const errors = {};
  
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    const value = formData[fieldName];
    
    // Required field validation
    if (fieldConfig.required && !value) {
      errors[fieldName] = `${fieldConfig.label} is required`;
    }
    
    // Type-specific validation
    if (fieldConfig.type === 'text' && value) {
      if (fieldConfig.validation?.minLength && value.length < fieldConfig.validation.minLength) {
        errors[fieldName] = `Minimum length is ${fieldConfig.validation.minLength}`;
      }
    }
    
    if (fieldConfig.type === 'multiselect' && value) {
      if (fieldConfig.minSelections && value.length < fieldConfig.minSelections) {
        errors[fieldName] = `Select at least ${fieldConfig.minSelections} options`;
      }
    }
  });
  
  return errors;
};
```

## Best Practices

1. **Progressive Enhancement**: Load form fields dynamically based on team selection
2. **Validation**: Implement both client-side and server-side validation
3. **Error Handling**: Display clear error messages for failed submissions
4. **Progress Indication**: Show research progress with status updates
5. **Responsive Design**: Ensure forms work well on all devices
6. **Accessibility**: Use proper labels, ARIA attributes, and keyboard navigation

## Webhook Integration

If you provide a webhook URL, you'll receive notifications:

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "details": {
    "githubUrl": "https://github.com/org/salesforce-red-research-20240115"
  },
  "timestamp": "2024-01-15T11:30:00Z"
}
```

## Error Handling

Handle various error scenarios:

```javascript
try {
  const response = await submitResearch(formData);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    displayValidationErrors(error.response.data.error);
  } else if (error.response?.status === 500) {
    // Server error
    showNotification('Server error. Please try again later.');
  } else {
    // Network error
    showNotification('Network error. Please check your connection.');
  }
}
```

## Sample Implementation

A complete example implementation is available in the `examples/frontend` directory, including:

- React components for all field types
- Form validation and error handling
- Status polling and result display
- Responsive design with Tailwind CSS
- TypeScript type definitions

## Support

For questions or issues:
- API Documentation: `/api/docs`
- GitHub Issues: https://github.com/your-org/claude-flow-research
- Email: support@your-domain.com