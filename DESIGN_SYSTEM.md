# 📐 UI Architecture & Design System

Complete visual design documentation for the attendance system.

---

## Color System

### Primary Colors
```
Blue-50:   #eff6ff   (backgrounds)
Blue-100:  #dbeafe   (borders, hover)
Blue-600:  #2563eb   (primary actions)
Blue-700:  #1d4ed8   (hover state)
```

### Neutral Colors
```
Gray-50:   #f9fafb   (light background)
Gray-100:  #f3f4f6   (card background)
Gray-200:  #e5e7eb   (borders)
Gray-600:  #4b5563   (secondary text)
Gray-900:  #111827   (primary text)
```

### Semantic Colors
```
Green-50:  #f0fdf4   (success background)
Green-100: #dcfce7   (success border)
Green-800: #166534   (success text)

Red-50:    #fef2f2   (error background)
Red-100:   #fee2e2   (error border)
Red-800:   #991b1b   (error text)

Yellow-50: #fefce8   (warning background)
Yellow-800: #713f12   (warning text)
```

---

## Typography System

### Font Family
- **Primary**: System UI, -apple-system, sans-serif
- **Weight**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Font Sizes
```
Display:    32px / 40px (h1 on desktop)
Header:     24px / 28px (h1 on mobile)
Subheader:  20px / 24px (h2)
Title:      18px / 22px (h3)
Body:       16px / 20px (p, regular text)
Small:      14px / 18px (labels, secondary)
Tiny:       12px / 16px (captions)
```

### Line Heights
- Headers: 1.1
- Body: 1.5
- Dense: 1.25

---

## Spacing System

### Base Unit: 4px (Tailwind default)

```
0:     0
1:     4px
2:     8px
3:    12px
4:    16px
6:    24px
8:    32px
12:   48px
16:   64px
20:   80px
24:   96px
```

### Common Patterns
- **Card Padding**: 24px (6)
- **Section Gap**: 32px (8)
- **Element Gap**: 16px (4)
- **Border Radius**: 8px (lg), 6px (md), 4px (sm)

---

## Component Spacing

### Header
```
Height: 64px
Padding: 16px horizontal, 12px vertical
Logo: 40px × 40px
Gap: 12px
```

### Card
```
Padding: 24px
Border Radius: 8px
Border: 1px solid gray-200
Shadow: 0 1px 3px rgba(0,0,0,0.1)
Gap (internal): 16px
```

### Form Input
```
Height: 40px
Padding: 8px 12px
Border: 1px solid gray-300
Border Radius: 8px
Font Size: 14px
Focus: Ring 2px blue-100, border blue-500
```

### Button
```
Height: 40px
Padding: 8px 24px
Border Radius: 8px
Font Size: 14px
Font Weight: 500
Transition: all 0.2s ease
```

---

## Responsive Breakpoints

### Tailwind Breakpoints
```
sm: 640px  (mobile to tablet)
md: 768px  (tablet mid-point)
lg: 1024px (tablet to desktop)
xl: 1280px (large desktop)
2xl: 1536px (extra large)
```

### Layout Patterns
```
Mobile (< 640px):
  - 1 column layout
  - Full width cards
  - Stack vertically
  - 16px padding

Tablet (640px - 1024px):
  - 2 column layout
  - Medium cards
  - 24px padding
  - Horizontal scroll on tables

Desktop (> 1024px):
  - 3-4 column layout
  - Cards in grid
  - 32px padding
  - Full table display
```

---

## Page Layouts

### Authentication Pages (Login, Forgot Password, Reset Password)

```
┌────────────────────────────┐
│        Gradient BG         │
│   ┌──────────────────────┐ │
│   │   Logo/Icon          │ │
│   │  [Centered Card]     │ │
│   │  ┌────────────────┐  │ │
│   │  │ Form Fields    │  │ │
│   │  │ Buttons        │  │ │
│   │  │ Footer Links   │  │ │
│   │  └────────────────┘  │ │
│   └──────────────────────┘ │
└────────────────────────────┘
- Min height: 100vh
- Centered vertically & horizontally
- Max width: 448px (28rem)
```

### Dashboard Pages (Admin, Teacher, Student)

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Header (Logo, User, Logout)         │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Title                               │ │
│ │ Subtitle                            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────┬───────────┬───────────┐ │
│ │  Card 1     │  Card 2   │  Card 3   │ │
│ ├─────────────┼───────────┼───────────┤ │
│ │  Card 4     │  Card 5   │  Card 6   │ │
│ └─────────────┴───────────┴───────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Content Area / Table / Widget        │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
- Full viewport height
- Header: 64px fixed
- Main: max-width 1280px, centered
- Sidebar optional on future updates
```

### Form Pages (Create User, etc)

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Header                              │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Title                               │ │
│ │ Subtitle                            │ │
│ │ [Back Button]                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Form Card                      │ │ │
│ │ │ ─────────────────────────────  │ │ │
│ │ │ [Form Sections]                │ │ │
│ │ │ [Input Fields]                 │ │ │
│ │ │ [Select Dropdowns]             │ │ │
│ │ │ [Buttons]                      │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
- Max width: 896px (56rem)
- Centered horizontally
- Form sections separated
- Conditional fields shown/hidden
```

---

## Component States

### Button States
```
Normal:    bg-blue-600, text-white
Hover:    bg-blue-700
Active:   scale 0.95
Disabled: bg-gray-400, cursor-not-allowed
Loading:  spinner animation
```

### Input States
```
Empty:    border-gray-300, bg-white
Focused:  border-blue-500, ring-2 ring-blue-100
Error:    border-red-500, ring-2 ring-red-100
Disabled: bg-gray-100, text-gray-500
```

### Card States
```
Normal:   border-gray-200, shadow-sm
Hover:   shadow-md (if clickable)
Selected: border-blue-500, ring-2 ring-blue-100
```

---

## Animation & Transitions

### Timing
```
Fast:     0.15s (quick interactions)
Normal:   0.2s (standard transitions)
Slow:     0.3s (page transitions)
Slow:     1s (loading spinners)
```

### Easing
```
ease-in:       cubic-bezier(0.4, 0, 1, 1)
ease-out:      cubic-bezier(0, 0, 0.2, 1)
ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1)
linear:        linear
```

### Animations
```
Fade:          opacity 0→1, 0.2s ease-out
Slide Up:      translateY 10px→0, 0.3s ease-out
Scale:         scale 0.95→1, 0.2s ease-out
Spin:          rotate 0→360°, 1s linear infinite
Pulse:         opacity variation, 2s ease-in-out
```

---

## Shadows

### Elevation Levels
```
Shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
Shadow:    0 1px 3px 0 rgba(0, 0, 0, 0.1)
Shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
Shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

### Usage
```
Cards:      shadow-sm, shadow-md on hover
Modals:     shadow-lg
Headers:    shadow-sm
Dropdowns:  shadow-md
```

---

## Borders

### Border Widths
```
1px: standard borders
2px: focus rings
```

### Border Radius
```
4px:  small elements
6px:  buttons
8px:  cards, inputs, modals
12px: larger components
```

---

## Grid Systems

### Desktop (1280px)
```
Max width: 1280px (80rem)
Padding: 32px (8) on sides
Content width: 1216px
Grid gap: 24px (6)
Columns: 1, 2, 3, 4
```

### Tablet (1024px - 640px)
```
Max width: 1024px
Padding: 24px (6) on sides
Content width: 976px
Grid gap: 16px (4)
Columns: 1, 2, 3
```

### Mobile (< 640px)
```
Full width
Padding: 16px (4) on sides
Content width: full - 32px
Grid gap: 16px (4)
Columns: 1, 2
```

---

## Dark Mode (Future Enhancement)

### Color Palette
```
bg-dark:      #1a1a1a
surface-dark: #2d2d2d
text-dark:    #f0f0f0
border-dark:  #444444
```

### Implementation
```css
@media (prefers-color-scheme: dark) {
  /* Dark mode styles */
}
```

---

## Accessibility

### Focus States
```
Outline: 2px solid blue-600
Offset: 2px
Visible on keyboard navigation
```

### Contrast Ratios
```
AAA Level: 7:1 (preferred)
AA Level:  4.5:1 (minimum)
```

### Text
```
Min font size: 12px (only for captions)
Optimal: 14-16px
Line height: ≥ 1.4
Letter spacing: slightly increased
```

### Icons
```
Size: 20px, 24px, 32px
Padding: 4-8px around icon
Color contrast: ≥ 4.5:1 with background
```

---

## Error States

### Form Validation
```
Invalid input:
  - Border: red-500
  - Icon: ✗ (red)
  - Message below field

Error message:
  - Color: red-700
  - Font size: 12px
  - Top margin: 4px
```

### Page Errors
```
Toast/Alert:
  - Position: top or bottom
  - Background: red-50
  - Border: red-200
  - Text: red-800
  - Auto-dismiss: 4s
```

---

## Success States

### Success Feedback
```
Toast/Alert:
  - Position: top
  - Background: green-50
  - Border: green-200
  - Text: green-800
  - Icon: ✓
  - Auto-dismiss: 3s
```

---

## Loading States

### Loading Indicators
```
Spinner:
  - Size: 8px (small), 16px (normal), 24px (large)
  - Border width: 2px
  - Color: blue-600
  - Animation: spin 1s linear infinite
  - Show: During API calls

Skeleton:
  - Size: match content
  - Background: gray-200
  - Animation: pulse effect
  - Show: Before content loads
```

---

## Modal/Dialog (Future)

### Sizing
```
Small:    400px max-width
Medium:   600px max-width
Large:    800px max-width
Full:     90vw max-width
```

### Structure
```
┌──────────────────────┐
│ Header               │ (48px)
├──────────────────────┤
│ Content              │ (flexible)
│                      │
├──────────────────────┤
│ Footer / Actions     │ (56px)
└──────────────────────┘
```

---

## Design Tokens Reference

### Quick Copy-Paste
```javascript
// Colors
const colors = {
  primary: '#2563eb',
  secondary: '#6b7280',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
}

// Spacing
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
}

// Border radius
const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
}
```

---

## Before & After

### Before (Old UI)
- Basic styling
- Limited visual hierarchy
- No consistent spacing
- Poor mobile experience
- Minimal feedback states

### After (New UI)
- Professional design system
- Clear visual hierarchy
- Consistent spacing throughout
- Fully responsive
- Rich feedback & loading states
- Accessible to all users
- Modern animations
- Color-coded actions

---

**Design System Version**: 1.0.0  
**Updated**: December 2025  
**Tool**: Tailwind CSS 3.4.18  
**Status**: ✅ Production Ready
