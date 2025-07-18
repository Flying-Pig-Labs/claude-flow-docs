#!/usr/bin/env node

/**
 * Claude Flow Mermaid Diagram Validator
 * Validates Mermaid diagrams against style guide standards
 */

const fs = require('fs');
const path = require('path');

// Style guide constants
const STYLE_RULES = {
  colors: {
    primary: ['#2563EB', '#1E40AF', '#1976D2'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#EAB308'],
    error: ['#EF4444', '#DC2626'],
    neural: ['#7C3AED', '#8B5CF6'],
    allowed: [
      '#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
      '#1F2937', '#6B7280', '#F3F4F6', '#FFFFFF', '#FFD700',
      '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6', '#6366F1'
    ]
  },
  nodes: {
    maxLabelLength: 20,
    maxDescriptionLength: 30,
    validShapes: ['[]', '()', '{}', '[[]]', '[()]', '(())', '[//]', '{{}}']
  },
  performance: {
    maxNodes: 50,
    maxNestingDepth: 3,
    maxSubgraphs: 10
  },
  accessibility: {
    minContrastRatio: 4.5,
    requiresAltText: true
  }
};

class DiagramValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalDiagrams: 0,
      validDiagrams: 0,
      totalNodes: 0,
      totalColors: new Set(),
      diagramTypes: {}
    };
  }

  /**
   * Validate a single Mermaid diagram
   */
  validateDiagram(content, fileName, lineNumber) {
    this.stats.totalDiagrams++;
    
    // Extract diagram type
    const typeMatch = content.match(/^(graph|flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|gitGraph)/m);
    if (typeMatch) {
      const diagramType = typeMatch[1];
      this.stats.diagramTypes[diagramType] = (this.stats.diagramTypes[diagramType] || 0) + 1;
    }

    // Check for theme initialization
    if (!content.includes('%%{init:') && !content.includes('theme')) {
      this.warnings.push({
        file: fileName,
        line: lineNumber,
        message: 'Missing theme initialization'
      });
    }

    // Validate colors
    this.validateColors(content, fileName, lineNumber);
    
    // Validate node labels
    this.validateNodeLabels(content, fileName, lineNumber);
    
    // Check performance
    this.checkPerformance(content, fileName, lineNumber);
    
    // Check accessibility
    this.checkAccessibility(content, fileName, lineNumber);
  }

  /**
   * Validate color usage
   */
  validateColors(content, fileName, lineNumber) {
    // Find all color definitions
    const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
    const colors = content.match(colorRegex) || [];
    
    colors.forEach(color => {
      this.stats.totalColors.add(color.toUpperCase());
      
      if (!STYLE_RULES.colors.allowed.includes(color.toUpperCase())) {
        this.warnings.push({
          file: fileName,
          line: lineNumber,
          message: `Non-standard color used: ${color}. Consider using brand colors.`
        });
      }
    });
  }

  /**
   * Validate node labels
   */
  validateNodeLabels(content, fileName, lineNumber) {
    // Extract node definitions
    const nodeRegex = /\[([^\]]+)\]|\(([^)]+)\)|{([^}]+)}|\[\[([^\]]+)\]\]/g;
    let match;
    let nodeCount = 0;
    
    while ((match = nodeRegex.exec(content)) !== null) {
      nodeCount++;
      const label = match[1] || match[2] || match[3] || match[4];
      
      // Check label length
      if (label && label.length > STYLE_RULES.nodes.maxLabelLength) {
        if (!label.includes('<br/>') && !label.includes('\\n')) {
          this.warnings.push({
            file: fileName,
            line: lineNumber,
            message: `Node label exceeds ${STYLE_RULES.nodes.maxLabelLength} chars: "${label.substring(0, 20)}..."`
          });
        }
      }
    }
    
    this.stats.totalNodes += nodeCount;
    
    // Check total node count
    if (nodeCount > STYLE_RULES.performance.maxNodes) {
      this.warnings.push({
        file: fileName,
        line: lineNumber,
        message: `Diagram has ${nodeCount} nodes, exceeds recommended ${STYLE_RULES.performance.maxNodes}`
      });
    }
  }

  /**
   * Check performance implications
   */
  checkPerformance(content, fileName, lineNumber) {
    // Count subgraphs
    const subgraphCount = (content.match(/subgraph/g) || []).length;
    if (subgraphCount > STYLE_RULES.performance.maxSubgraphs) {
      this.warnings.push({
        file: fileName,
        line: lineNumber,
        message: `Too many subgraphs (${subgraphCount}), consider splitting diagram`
      });
    }
    
    // Check nesting depth
    const nestingDepth = this.calculateNestingDepth(content);
    if (nestingDepth > STYLE_RULES.performance.maxNestingDepth) {
      this.warnings.push({
        file: fileName,
        line: lineNumber,
        message: `Nesting depth (${nestingDepth}) exceeds recommended ${STYLE_RULES.performance.maxNestingDepth}`
      });
    }
  }

  /**
   * Calculate nesting depth of subgraphs
   */
  calculateNestingDepth(content) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('subgraph')) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (line.includes('end')) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  /**
   * Check accessibility compliance
   */
  checkAccessibility(content, fileName, lineNumber) {
    // Check for descriptive labels
    const genericLabels = ['A', 'B', 'C', 'Node1', 'Node2', 'Process', 'Step'];
    genericLabels.forEach(label => {
      if (content.includes(`[${label}]`) || content.includes(`(${label})`)) {
        this.warnings.push({
          file: fileName,
          line: lineNumber,
          message: `Generic label "${label}" found. Use descriptive labels for accessibility.`
        });
      }
    });
  }

  /**
   * Validate all Mermaid diagrams in a file
   */
  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inMermaidBlock = false;
    let diagramContent = '';
    let diagramStartLine = 0;
    
    lines.forEach((line, index) => {
      if (line.trim() === '```mermaid') {
        inMermaidBlock = true;
        diagramStartLine = index + 1;
        diagramContent = '';
      } else if (inMermaidBlock && line.trim() === '```') {
        inMermaidBlock = false;
        this.validateDiagram(diagramContent, filePath, diagramStartLine);
      } else if (inMermaidBlock) {
        diagramContent += line + '\n';
      }
    });
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n📊 Claude Flow Mermaid Diagram Validation Report');
    console.log('='.repeat(50));
    
    console.log('\n📈 Statistics:');
    console.log(`  Total diagrams: ${this.stats.totalDiagrams}`);
    console.log(`  Total nodes: ${this.stats.totalNodes}`);
    console.log(`  Unique colors: ${this.stats.totalColors.size}`);
    console.log(`  Diagram types: ${Object.entries(this.stats.diagramTypes).map(([k, v]) => `${k}(${v})`).join(', ')}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  ${error.file}:${error.line} - ${error.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`  ${warning.file}:${warning.line} - ${warning.message}`);
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All diagrams pass validation!');
    }
    
    console.log('\n🎨 Color Usage:');
    const brandColors = Array.from(this.stats.totalColors).filter(c => 
      STYLE_RULES.colors.allowed.includes(c)
    );
    const nonBrandColors = Array.from(this.stats.totalColors).filter(c => 
      !STYLE_RULES.colors.allowed.includes(c)
    );
    
    console.log(`  Brand colors: ${brandColors.join(', ')}`);
    if (nonBrandColors.length > 0) {
      console.log(`  Non-brand colors: ${nonBrandColors.join(', ')}`);
    }
    
    // Score calculation
    const score = Math.max(0, 100 - (this.errors.length * 10) - (this.warnings.length * 2));
    console.log(`\n🏆 Quality Score: ${score}/100`);
    
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      score
    };
  }
}

// Main execution
if (require.main === module) {
  const validator = new DiagramValidator();
  
  // Get directory to validate from command line or use default
  const targetDir = process.argv[2] || path.join(__dirname, '..');
  
  console.log(`🔍 Validating Mermaid diagrams in: ${targetDir}`);
  
  // Find all markdown files
  function findMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findMarkdownFiles(fullPath));
      } else if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }
  
  const mdFiles = findMarkdownFiles(targetDir);
  console.log(`📄 Found ${mdFiles.length} markdown files to check`);
  
  // Validate each file
  mdFiles.forEach(file => {
    validator.validateFile(file);
  });
  
  // Generate report
  const result = validator.generateReport();
  
  // Exit with appropriate code
  process.exit(result.errors > 0 ? 1 : 0);
}

module.exports = DiagramValidator;