# Financial Planning Report Generator - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from professional productivity tools like Notion and Linear, with influences from financial platforms like Mint. This utility-focused application prioritizes efficiency, data clarity, and professional presentation over visual flair.

## Core Design Elements

### Color Palette
**Primary Colors (Dark Mode):**
- Background: 222 10% 5% (deep charcoal)
- Surface: 222 8% 12% (elevated dark gray)
- Text Primary: 210 20% 90% (soft white)
- Text Secondary: 210 15% 70% (muted gray)

**Primary Colors (Light Mode):**
- Background: 210 20% 98% (clean white)
- Surface: 210 15% 95% (subtle off-white)
- Text Primary: 222 15% 15% (dark charcoal)
- Text Secondary: 222 10% 45% (medium gray)

**Brand Colors:**
- Primary: 210 100% 50% (professional blue)
- Success: 142 76% 36% (financial green)
- Warning: 38 92% 50% (attention amber)

### Typography
- **Primary Font**: Inter (Google Fonts) for clean, professional readability
- **Headers**: 600-700 weight, 1.2-2rem sizes
- **Body**: 400-500 weight, 0.875-1rem sizes
- **Labels**: 500 weight, 0.75-0.875rem sizes

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (p-2, h-6, m-4, gap-8)
- Container max-width: 7xl (1280px)
- Form sections: 6-8 spacing between major elements
- Input groups: 4 spacing between related fields

### Component Library

**Forms & Inputs:**
- Clean input fields with subtle borders and focus states
- Grouped form sections with clear visual separation
- Comment boxes with proper textarea styling
- Toggle switches for strategy selection with visual feedback

**Navigation:**
- Three-panel layout: Form (left), Strategy Bank (center), Report Preview (right)
- Collapsible sidebar panels for mobile responsiveness
- Progress indicators showing completion status

**Data Display:**
- Strategy cards with toggle states and brief descriptions
- Report preview with structured sections and typography hierarchy
- Clear section dividers and organized content blocks

**Overlays:**
- Modal dialogs for confirmations and additional options
- Toast notifications for success/error states
- Loading states for report generation

### Professional Financial Theme
**Visual Treatment:**
- Emphasis on data clarity and professional presentation
- Minimal use of color - strategic blues and greens only
- Clean lines and organized sections reflecting financial industry standards
- Subtle shadows and borders for depth without distraction

**Interaction Design:**
- Immediate feedback on form completion
- Visual indicators for selected strategies
- Real-time report preview updates
- Clear save/export action buttons

### Layout Structure
**Three-Column Desktop Layout:**
1. **Client Data Form** (left panel): Organized form sections with logical grouping
2. **Strategy Bank** (center panel): Scrollable list of toggleable strategy cards
3. **Report Preview** (right panel): Live preview of generated report

**Mobile Responsive:**
- Tabbed interface switching between Form, Strategies, and Report
- Full-width panels with smooth transitions
- Maintained data persistence across tab switches

This design prioritizes professional functionality while maintaining the clean, organized aesthetic expected in financial planning software.