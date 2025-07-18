# Mermaid Diagram Style Guide for Claude Flow

## Color Palette

### Primary Colors
```css
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#1e40af',
  'primaryTextColor':'#ffffff',
  'primaryBorderColor':'#1e3a8a',
  'lineColor':'#3b82f6',
  'secondaryColor':'#7c3aed',
  'tertiaryColor':'#0891b2',
  'background':'#f8fafc',
  'mainBkg':'#ffffff',
  'secondBkg':'#f1f5f9'
}}}%%
```

### Semantic Colors
- **Success**: #10b981 (emerald-500)
- **Warning**: #f59e0b (amber-500)
- **Error**: #ef4444 (red-500)
- **Info**: #3b82f6 (blue-500)
- **Neutral**: #6b7280 (gray-500)

## Node Styles

### Standard Nodes
```mermaid
flowchart LR
    A[Standard Node] --> B{Decision Node}
    B --> C([Rounded Node])
    B --> D[[Subroutine]]
    C --> E[(Database)]
    D --> F((Circle))
```

### Agent Nodes (Special)
```mermaid
flowchart LR
    A[🐝 Queen Agent]:::queen
    B[🔧 Architect]:::architect
    C[💻 Coder]:::coder
    D[🔬 Researcher]:::researcher
    
    classDef queen fill:#fbbf24,stroke:#f59e0b,color:#000
    classDef architect fill:#7c3aed,stroke:#6d28d9,color:#fff
    classDef coder fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef researcher fill:#10b981,stroke:#059669,color:#fff
```

## Arrow Styles

### Relationship Types
```mermaid
flowchart LR
    A -->|Standard| B
    B -.->|Dashed| C
    C ==>|Thick| D
    D -->|Async| E
    E -.->|Optional| F
```

### Arrow Labels
- Use descriptive labels for clarity
- Keep labels concise (2-3 words)
- Use action verbs when possible

## Diagram-Specific Guidelines

### Flowcharts
```mermaid
flowchart TD
    Start([Start]) --> Init[Initialize]
    Init --> Process{Process?}
    Process -->|Yes| Execute[Execute]
    Process -->|No| End([End])
    Execute --> End
    
    style Start fill:#10b981
    style End fill:#ef4444
```

### Sequence Diagrams
```mermaid
sequenceDiagram
    participant U as User
    participant C as Claude Flow
    participant A as Agent
    participant M as Memory
    
    U->>C: Request task
    C->>A: Spawn agent
    A->>M: Load context
    M-->>A: Return data
    A->>C: Complete task
    C->>U: Return result
```

### State Diagrams
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start Task
    Processing --> Success: Complete
    Processing --> Failed: Error
    Success --> Idle: Reset
    Failed --> Idle: Retry
```

### Class Diagrams
```mermaid
classDiagram
    class Agent {
        +String id
        +String type
        +String status
        +execute()
        +coordinate()
    }
    
    class Swarm {
        +String topology
        +List~Agent~ agents
        +orchestrate()
        +monitor()
    }
    
    Swarm "1" --> "*" Agent
```

## Text Guidelines

### Node Labels
- Use title case for main nodes
- Use sentence case for descriptions
- Keep labels under 20 characters
- Use line breaks for longer text

### Font Sizes
- Main titles: 16px
- Node labels: 14px
- Arrow labels: 12px
- Annotations: 10px

## Layout Best Practices

### Direction
- **TD** (Top-Down): Hierarchical structures
- **LR** (Left-Right): Process flows
- **BT** (Bottom-Top): Building up concepts
- **RL** (Right-Left): Reverse flows

### Spacing
- Maintain consistent spacing between nodes
- Group related nodes together
- Use subgraphs for logical grouping
- Leave adequate whitespace

### Alignment
- Align nodes horizontally when at same level
- Center decision nodes
- Keep arrows straight when possible
- Avoid crossing lines

## Complex Diagram Patterns

### Parallel Processing
```mermaid
flowchart LR
    Start --> Fork{Fork}
    Fork --> A1[Process A]
    Fork --> B1[Process B]
    Fork --> C1[Process C]
    A1 --> Join{Join}
    B1 --> Join
    C1 --> Join
    Join --> End
```

### Feedback Loops
```mermaid
flowchart TD
    Input --> Process
    Process --> Check{Valid?}
    Check -->|Yes| Output
    Check -->|No| Feedback
    Feedback --> Process
```

### Multi-Level Architecture
```mermaid
flowchart TD
    subgraph "Presentation Layer"
        UI[User Interface]
    end
    
    subgraph "Business Layer"
        API[API Gateway]
        Logic[Business Logic]
    end
    
    subgraph "Data Layer"
        DB[(Database)]
        Cache[(Cache)]
    end
    
    UI --> API
    API --> Logic
    Logic --> DB
    Logic --> Cache
```

## Accessibility

### Color Contrast
- Ensure 4.5:1 contrast ratio for normal text
- Use patterns in addition to colors
- Provide alternative text descriptions

### Labels
- Make all labels descriptive
- Avoid relying solely on color
- Include directional cues

## Performance

### Optimization
- Limit nodes to 50 per diagram
- Use subgraphs for complex flows
- Consider splitting large diagrams
- Pre-render when possible

### Responsive Design
- Test at different screen sizes
- Use relative sizing
- Consider mobile viewing
- Provide zoom controls

## Examples by Section

### Evolution Diagrams
- Use timeline for version progression
- Show clear before/after states
- Highlight improvements

### Architecture Diagrams
- Use flowchart TD for hierarchies
- Show clear component boundaries
- Indicate data flow directions

### Hook System Diagrams
- Use sequence diagrams for timing
- Show pre/post operations clearly
- Indicate automatic vs manual

### Swarm Diagrams
- Use graph for agent relationships
- Show communication patterns
- Indicate parallel operations

## Quality Checklist

- [ ] Correct Mermaid syntax
- [ ] Consistent color scheme
- [ ] Clear, readable labels
- [ ] Proper arrow types
- [ ] Logical flow direction
- [ ] No overlapping elements
- [ ] Responsive design
- [ ] Accessibility compliant
- [ ] Performance optimized
- [ ] Well documented