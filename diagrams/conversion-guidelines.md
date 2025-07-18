# Mermaid Conversion Guidelines for Claude Flow

## Overview
This document provides comprehensive guidelines for converting ASCII art and text-based diagrams to Mermaid format, ensuring consistency and quality across all Claude Flow presentation materials.

## Conversion Process

### Phase 1: Analysis & Planning
1. **Identify diagram intent** - What concept is being illustrated?
2. **Choose optimal Mermaid type** - Which format best represents the concept?
3. **Extract key information** - What must be preserved from the original?
4. **Plan enhancements** - How can Mermaid features improve clarity?

### Phase 2: Conversion
1. **Create basic structure** - Convert core elements first
2. **Add styling** - Apply Claude Flow color scheme
3. **Enhance with Mermaid features** - Use subgraphs, styling, labels
4. **Optimize layout** - Ensure readability at different sizes

### Phase 3: Quality Assurance
1. **Verify information fidelity** - All original info preserved?
2. **Check visual clarity** - Is it easier to understand?
3. **Test rendering** - Works across platforms?
4. **Validate accessibility** - Alternative text provided?

## Diagram Type Conversion Patterns

### 1. Sequential Flow Diagrams

**Original ASCII:**
```
Request 1 → Wait → Response 1 → Request 2 → Wait → Response 2
```

**Mermaid Conversion:**
```mermaid
flowchart LR
    R1[Request 1] --> W1[Wait]
    W1 --> Res1[Response 1]
    Res1 --> R2[Request 2]
    R2 --> W2[Wait]
    W2 --> Res2[Response 2]
    
    style W1 fill:#f59e0b,stroke:#d97706,color:#fff
    style W2 fill:#f59e0b,stroke:#d97706,color:#fff
```

### 2. Parallel Flow Diagrams

**Original ASCII:**
```
[Request 1, 2, 3, 4, 5] → [Parallel Processing] → [Response 1, 2, 3, 4, 5]
```

**Mermaid Conversion:**
```mermaid
flowchart LR
    subgraph Requests
        R1[Request 1]
        R2[Request 2]
        R3[Request 3]
        R4[Request 4]
        R5[Request 5]
    end
    
    PP[Parallel Processing]
    
    subgraph Responses
        Res1[Response 1]
        Res2[Response 2]
        Res3[Response 3]
        Res4[Response 4]
        Res5[Response 5]
    end
    
    R1 & R2 & R3 & R4 & R5 --> PP
    PP --> Res1 & Res2 & Res3 & Res4 & Res5
    
    style PP fill:#10b981,stroke:#059669,color:#fff
```

### 3. Hierarchical Structures

**Original ASCII:**
```
Session Start
     │
     ├─→ [Session Start Hooks]
     │    ├── Initialize monitoring
     │    ├── Load configurations
     │    └── Prepare environment
```

**Mermaid Conversion:**
```mermaid
flowchart TD
    Start[Session Start]
    SSH[Session Start Hooks]
    
    Start --> SSH
    SSH --> Init[Initialize monitoring]
    SSH --> Load[Load configurations]
    SSH --> Prep[Prepare environment]
    
    style Start fill:#1e40af,stroke:#1e3a8a,color:#fff
    style SSH fill:#3b82f6,stroke:#2563eb,color:#fff
```

### 4. Cache/Layer Architecture

**Original ASCII:**
```
Request → L1 Cache → L2 Cache → SQLite → Disk
```

**Mermaid Conversion:**
```mermaid
flowchart LR
    Req[Request] --> L1[L1 Cache<br/>In-memory]
    L1 -->|miss| L2[L2 Cache<br/>Redis]
    L2 -->|miss| DB[(SQLite)]
    DB -->|miss| Disk[Disk Storage]
    
    L1 -.->|hit| Resp[Response]
    L2 -.->|hit| Resp
    DB -.->|hit| Resp
    Disk --> Resp
    
    style L1 fill:#10b981,stroke:#059669,color:#fff
    style L2 fill:#3b82f6,stroke:#2563eb,color:#fff
    style DB fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style Disk fill:#6b7280,stroke:#4b5563,color:#fff
```

### 5. Learning Loops

**Original ASCII:**
```
Task → Recognition → Training → Update → Optimization → Task
          ↑                                              ↓
          └──────────────────────────────────────────────┘
```

**Mermaid Conversion:**
```mermaid
flowchart TB
    Task[Task Execution]
    Rec[Pattern Recognition]
    Train[Neural Training]
    Update[Weight Update]
    Opt[Strategy Optimization]
    
    Task --> Rec
    Rec --> Train
    Train --> Update
    Update --> Opt
    Opt --> Task
    
    style Task fill:#1e40af,stroke:#1e3a8a,color:#fff
    style Train fill:#10b981,stroke:#059669,color:#fff
    style Opt fill:#f59e0b,stroke:#d97706,color:#fff
```

### 6. Performance Comparisons

**Original Table:**
```
Operation | Sequential | Parallel | Improvement
File Ops  | 1,200ms   | 150ms    | 8x
```

**Mermaid Bar Chart:**
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1e40af'}}}%%
gantt
    title Performance Comparison
    dateFormat X
    axisFormat %s
    
    section File Ops
    Sequential  :1200
    Parallel    :150
    
    section Agent Init
    Sequential  :5000
    Parallel    :800
```

## Style Consistency Rules

### 1. Color Usage
- **Blue (#1e40af)**: Primary actions, main flow
- **Green (#10b981)**: Success states, optimizations
- **Amber (#f59e0b)**: Warnings, wait states
- **Purple (#8b5cf6)**: Special processes, neural operations
- **Gray (#6b7280)**: Storage, background processes

### 2. Node Naming
- Use descriptive but concise labels
- Include metrics in nodes where relevant
- Use line breaks for multi-line labels
- Maintain consistent capitalization

### 3. Arrow Styles
- Solid arrows (-->) for primary flow
- Dashed arrows (-.->)  for alternative paths
- Thick arrows (==>) for critical paths
- Include labels on arrows when needed

### 4. Subgraph Usage
- Group related nodes in subgraphs
- Use clear subgraph titles
- Apply consistent styling within subgraphs
- Don't nest subgraphs more than 2 levels

### 5. Layout Direction
- **TD**: Hierarchical structures, top-down flows
- **LR**: Sequential processes, pipelines
- **TB**: Cyclic processes, feedback loops
- **RL**: Reverse flows (use sparingly)

## Common Enhancements

### 1. Add Visual Hierarchy
```mermaid
flowchart TD
    subgraph "High Level"
        A[Main Process]
    end
    
    subgraph "Details"
        B[Step 1]
        C[Step 2]
        D[Step 3]
    end
    
    A --> B
    B --> C
    C --> D
```

### 2. Include Metrics
```mermaid
flowchart LR
    A[Process A<br/>Time: 100ms] --> B[Process B<br/>Time: 50ms]
    B --> C[Process C<br/>Time: 200ms]
```

### 3. Show Parallelism
```mermaid
flowchart TD
    Start[Start] --> Fork{Fork}
    Fork --> P1[Process 1]
    Fork --> P2[Process 2]
    Fork --> P3[Process 3]
    P1 & P2 & P3 --> Join{Join}
    Join --> End[End]
```

### 4. Indicate State
```mermaid
flowchart LR
    A[Active]:::active --> B[Pending]:::pending
    B --> C[Complete]:::complete
    
    classDef active fill:#10b981,stroke:#059669,color:#fff
    classDef pending fill:#f59e0b,stroke:#d97706,color:#fff
    classDef complete fill:#6b7280,stroke:#4b5563,color:#fff
```

## Quality Checklist

Before considering a diagram converted:

- [ ] All information from original is preserved
- [ ] Diagram type matches content appropriately
- [ ] Claude Flow color scheme applied
- [ ] Labels are clear and concise
- [ ] Layout is logical and readable
- [ ] Styling enhances understanding
- [ ] Renders correctly in preview
- [ ] Alternative text description provided
- [ ] Follows size constraints (< 50 nodes)
- [ ] No overlapping elements

## Testing Requirements

### Rendering Tests
1. GitHub markdown preview
2. VS Code mermaid preview
3. Mermaid.live editor
4. Mobile responsive view

### Accessibility Tests
1. Color contrast verification
2. Alternative text completeness
3. Logical reading order
4. Screen reader compatibility

## Common Pitfalls to Avoid

1. **Over-complication**: Don't add features just because you can
2. **Information loss**: Ensure all original data is preserved
3. **Inconsistent styling**: Follow the style guide strictly
4. **Poor layout**: Test different directions (TD, LR, etc.)
5. **Missing context**: Include necessary labels and legends

## Conversion Examples Library

Maintain a library of successful conversions in:
`/diagrams/examples/`

Each example should include:
- Original ASCII version
- Mermaid conversion
- Notes on conversion decisions
- Any special considerations

## Continuous Improvement

1. **Track conversion metrics**: Time taken, issues encountered
2. **Gather feedback**: From team and users
3. **Update guidelines**: Based on learnings
4. **Share patterns**: Document new conversion patterns
5. **Automate where possible**: Create conversion scripts for common patterns