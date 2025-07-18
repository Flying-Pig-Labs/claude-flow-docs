# Claude Flow Visual Style Guide

## Color Palette

### Primary Colors
- **Claude Flow Blue**: `#2563EB` (Primary brand color)
- **Neural Purple**: `#7C3AED` (Neural/AI features)
- **Success Green**: `#10B981` (Performance/Success)
- **Accent Orange**: `#F59E0B` (Highlights/CTAs)

### Secondary Colors
- **Deep Gray**: `#1F2937` (Text/Backgrounds)
- **Medium Gray**: `#6B7280` (Secondary text)
- **Light Gray**: `#F3F4F6` (Backgrounds)
- **White**: `#FFFFFF` (Primary background)

### Gradient Palette
- **Performance Gradient**: `linear-gradient(135deg, #2563EB 0%, #10B981 100%)`
- **Neural Gradient**: `linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)`
- **Warm Gradient**: `linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)`

## Typography

### Font Families
- **Headers**: Inter, -apple-system, BlinkMacSystemFont
- **Body**: Inter, system-ui
- **Code**: 'Fira Code', 'JetBrains Mono', monospace

### Font Sizes
- **H1**: 2.5rem (40px)
- **H2**: 2rem (32px)
- **H3**: 1.5rem (24px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)

## Visual Elements

### Box Styles
```css
.primary-box {
  background: linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 100%);
  border: 2px solid #2563EB;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.neural-box {
  background: linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%);
  border: 2px solid #7C3AED;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.1);
}

.success-box {
  background: linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%);
  border: 2px solid #10B981;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
}
```

### Arrow Styles
- **Primary Arrow**: Solid, 2px width, #2563EB
- **Data Flow Arrow**: Dashed, 2px width, #10B981
- **Neural Connection**: Dotted, 1.5px width, #7C3AED
- **Bidirectional**: Double-headed, 2px width

### Icon Guidelines
- Use line icons for clarity
- Consistent 24x24px base size
- 2px stroke width
- Rounded line caps

## Diagram Standards

### Layout Principles
1. **Whitespace**: Minimum 24px between elements
2. **Alignment**: 8px grid system
3. **Hierarchy**: Size and color to indicate importance
4. **Flow**: Left-to-right or top-to-bottom

### Animation Guidelines
- **Entrance**: Fade in with slight scale (0.95 → 1)
- **Transitions**: 300ms ease-in-out
- **Hover**: Subtle shadow increase
- **Data Flow**: Animated dashed lines

### Accessibility
- Minimum contrast ratio: 4.5:1
- Alt text for all diagrams
- Color-blind friendly palette
- Clear labels and legends

## Mermaid Theme Configuration

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#EBF5FF',
    'primaryTextColor': '#1F2937',
    'primaryBorderColor': '#2563EB',
    'lineColor': '#2563EB',
    'secondaryColor': '#F3E8FF',
    'tertiaryColor': '#D1FAE5',
    'background': '#FFFFFF',
    'mainBkg': '#EBF5FF',
    'secondBkg': '#F3E8FF',
    'tertiaryBkg': '#D1FAE5',
    'primaryBorderColor': '#2563EB',
    'secondaryBorderColor': '#7C3AED',
    'tertiaryBorderColor': '#10B981',
    'fontFamily': 'Inter, -apple-system, BlinkMacSystemFont',
    'fontSize': '16px',
    'darkMode': false
  }
}}%%
```

## Export Guidelines

### Formats
- **SVG**: Primary format for scalability
- **PNG**: 2x resolution for retina displays
- **WebP**: For web optimization

### Dimensions
- **Full Width**: 1200px
- **Half Width**: 580px
- **Square**: 600x600px
- **Thumbnail**: 300x200px