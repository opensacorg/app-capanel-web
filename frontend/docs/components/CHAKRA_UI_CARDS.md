# Chakra UI Cards Implementation Guide

## Overview

This guide explains how to implement and work with Chakra UI cards in our React dashboard, specifically focusing on the census data integration and interactive components.

## Table of Contents
1. [Basic Card Structure](#basic-card-structure)
2. [Census Data Cards Implementation](#census-data-cards-implementation)
3. [State Management](#state-management)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Loading States](#loading-states)
6. [Interactive Components](#interactive-components)
7. [Styling and Theming](#styling-and-theming)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Basic Card Structure

### Our Card System
We use custom card components built on Chakra UI v3:

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/card';

// Basic card structure
<Card variant="elevated">
  <CardHeader>
    <Heading size="md">Card Title</Heading>
  </CardHeader>
  <CardBody>
    {/* Card content */}
  </CardBody>
  <CardFooter>
    {/* Optional footer actions */}
  </CardFooter>
</Card>
```

### Card Variants
- `elevated` - Raised appearance with shadow
- `outline` - Border-only styling
- `filled` - Background-filled appearance

---

## Census Data Cards Implementation

### 1. Total Enrollment Display Card

This card fetches and displays total enrollment data from the census API.

```tsx path=src/routes/_home/dashboard.tsx start=36
function TotalEnrollmentDisplay() {
  const { totalEnr, isLoading, isError, hasData } = useTotalEnrollment();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="40px">
        <Spinner size="md" color="blue.500" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box 
        color="red.600" 
        fontSize="sm" 
        bg="red.50" 
        border="1px solid" 
        borderColor="red.200" 
        borderRadius="md" 
        p={2}
        textAlign="center"
      >
        Failed to load data
      </Box>
    );
  }

  if (!hasData) {
    return (
      <Text fontSize="2xl" fontWeight="bold">
        N/A
      </Text>
    );
  }

  // Format the number with commas for thousands
  const formattedTotalEnr = totalEnr?.toLocaleString() || '0';

  return (
    <Text fontSize="2xl" fontWeight="bold">
      {formattedTotalEnr}
    </Text>
  );
}
```

### 2. Census Data Search Card with Tabs

This card provides an interactive interface for searching and displaying specific census data.

```tsx path=src/routes/_home/dashboard.tsx start=78
function CensusDataSearchCard() {
  const [searchId, setSearchId] = useState<string | null>(null);
  const sampleId = "123e4567-e89b-12d3-a456-426614174000";
  const { data: censusData, isLoading, isError, error } = useCensusDataById(searchId);

  return (
    <Tabs.Root defaultValue="found-id" variant="subtle" size="lg">
      <Tabs.List mb={3}>
        <Tabs.Trigger value="found-id">Found ID</Tabs.Trigger>
        <Tabs.Trigger value="default">Default</Tabs.Trigger>
        <Tabs.Trigger value="last-searched">Last Searched</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="found-id">
        <VStack gap={3}>
          <CensusDataContent 
            censusData={censusData} 
            isLoading={isLoading} 
            isError={isError} 
            error={error} 
          />
          {!searchId && (
            <Button 
              size="xs" 
              colorScheme="blue" 
              variant="outline"
              onClick={() => setSearchId(sampleId)}
            >
              Load Sample Data
            </Button>
          )}
        </VStack>
      </Tabs.Content>
      {/* Other tab contents */}
    </Tabs.Root>
  );
}
```

---

## State Management

### Using React Hooks

#### 1. Local State with useState
```tsx
// Managing search ID state
const [searchId, setSearchId] = useState<string | null>(null);

// Updating state
const handleLoadData = () => {
  setSearchId("sample-id-123");
};
```

#### 2. API State with TanStack Query
```tsx
// Custom hook for census data
const { data, isLoading, isError, error } = useCensusDataById(searchId);

// The hook handles:
// - Loading states
// - Error states  
// - Caching
// - Background refetching
// - Retry logic
```

### State Flow Example
```
User clicks "Load Sample Data" button
↓
setSearchId() updates state with sample ID
↓
useCensusDataById() hook triggers API call
↓
Component shows loading spinner
↓
API returns data → Component displays census information
OR
API returns error → Component displays error message
```

---

## Error Handling Patterns

### Consistent Error Display
Both cards use the same error styling pattern for consistency:

```tsx path=null start=null
// Standard error box styling
<Box 
  color="red.600" 
  fontSize="sm" 
  bg="red.50" 
  border="1px solid" 
  borderColor="red.200" 
  borderRadius="md" 
  p={2}
  textAlign="center"
>
  {errorMessage}
</Box>
```

### Error Handling Hierarchy
1. **Network Errors**: Connection issues, timeouts
2. **HTTP Errors**: 404 (not found), 500 (server error)
3. **Data Errors**: Invalid response format
4. **Validation Errors**: Invalid input data

### Error Recovery
- **Automatic Retries**: TanStack Query retries failed requests
- **Fallback UI**: Show "N/A" or placeholder when no data
- **User Actions**: Allow users to manually retry operations

---

## Loading States

### Spinner Loading
```tsx path=null start=null
// Centered spinner for data loading
<Box display="flex" justifyContent="center" alignItems="center" height="40px">
  <Spinner size="md" color="blue.500" />
</Box>
```

### Skeleton Loading
```tsx path=null start=null
// Skeleton placeholders for content
<VStack align="stretch" gap={2}>
  <Skeleton height="32px" width="120px" />
  <Skeleton height="16px" width="100px" />
</VStack>
```

### Loading States Best Practices
1. **Show immediate feedback** - Display spinner as soon as loading starts
2. **Preserve layout** - Use fixed heights to prevent layout shift
3. **Progressive loading** - Show partial data while loading more
4. **Timeout handling** - Set reasonable timeout limits

---

## Interactive Components

### Tabs Implementation
```tsx path=null start=null
// Chakra UI v3 Tabs pattern
<Tabs.Root defaultValue="tab1" variant="subtle" size="lg">
  <Tabs.List mb={3}>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  
  <Tabs.Content value="tab1">
    {/* Tab 1 content */}
  </Tabs.Content>
  
  <Tabs.Content value="tab2">
    {/* Tab 2 content */}
  </Tabs.Content>
</Tabs.Root>
```

### Button Interactions
```tsx path=null start=null
// Interactive button with state management
<Button 
  size="xs" 
  colorScheme="blue" 
  variant="outline"
  onClick={() => setSearchId(sampleId)}
  isDisabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Load Sample Data'}
</Button>
```

### Conditional Rendering
```tsx path=null start=null
// Show button only when appropriate
{!searchId && (
  <Button onClick={handleAction}>
    Load Data
  </Button>
)}

// Show different content based on state
{isError ? (
  <ErrorMessage />
) : isLoading ? (
  <LoadingSpinner />
) : (
  <DataDisplay data={data} />
)}
```

---

## Styling and Theming

### Chakra UI Props
```tsx path=null start=null
// Common styling props
<Box
  color="blue.500"          // Text color
  bg="blue.50"              // Background color
  border="1px solid"        // Border
  borderColor="blue.200"    // Border color
  borderRadius="md"         // Border radius
  p={2}                     // Padding
  m={4}                     // Margin
  fontSize="sm"             // Font size
  fontWeight="bold"         // Font weight
  textAlign="center"        // Text alignment
/>
```

### Color Scheme Usage
- **Blue**: Primary actions, data display
- **Red**: Errors, warnings
- **Green**: Success states
- **Gray**: Secondary information, disabled states
- **Purple**: Special categories (e.g., charter schools)

### Responsive Design
```tsx path=null start=null
// Responsive grid layout
<Grid 
  templateColumns={{ 
    base: '1fr',                    // Mobile: 1 column
    md: 'repeat(2, 1fr)',          // Tablet: 2 columns
    lg: 'repeat(4, 1fr)'           // Desktop: 4 columns
  }} 
  gap={6}
>
```

---

## Common Patterns

### 1. Data Formatting
```tsx path=null start=null
// Format numbers with thousands separators
const formattedNumber = totalEnr?.toLocaleString() || '0';

// Safe property access
const schoolName = data?.school_name || "Unknown School";

// Conditional badge styling
<Badge 
  colorScheme={data.charter === 'Y' ? 'purple' : 'gray'}
  size="xs"
>
  {data.charter === 'Y' ? 'Charter' : 'Public'}
</Badge>
```

### 2. Layout Patterns
```tsx path=null start=null
// Vertical stack with consistent spacing
<VStack align="stretch" gap={2}>
  <Text>Label</Text>
  <Text>Value</Text>
</VStack>

// Horizontal layout with space between
<HStack justify="space-between">
  <Text>Left content</Text>
  <Icon as={FiHome} />
</HStack>
```

### 3. Icon Integration
```tsx path=null start=null
import { FiHome, FiUsers, FiActivity } from 'react-icons/fi';

<Icon as={FiHome} color="blue.500" boxSize={4} />
```

---

## Troubleshooting

### Common Issues

#### 1. "AlertIcon is not exported"
**Problem**: Using Chakra UI v3 with v2 component patterns
**Solution**: Remove AlertIcon usage, use Alert with status prop only

```tsx path=null start=null
// ❌ Don't do this (v2 pattern)
<Alert status="error">
  <AlertIcon />
  <Text>Error message</Text>
</Alert>

// ✅ Do this (v3 pattern)
<Alert status="error">
  <Text>Error message</Text>
</Alert>
```

#### 2. "FiSchool is not exported"
**Problem**: Using non-existent Feather icons
**Solution**: Use available icons from react-icons/fi

```tsx path=null start=null
// ❌ Don't use non-existent icons
import { FiSchool } from 'react-icons/fi';

// ✅ Use available icons
import { FiHome, FiUsers, FiActivity } from 'react-icons/fi';
```

#### 3. State Not Updating
**Problem**: Component not re-rendering when state changes
**Solution**: Check state dependency and key props

```tsx path=null start=null
// Make sure state is properly managed
const [searchId, setSearchId] = useState<string | null>(null);

// Ensure proper dependency in useEffect/query
const { data } = useCensusDataById(searchId); // ✅ Correct dependency
```

#### 4. API Data Not Loading
**Checklist**:
- ✅ Backend API is running (`docker compose up -d`)
- ✅ API endpoint exists (`http://localhost/docs`)
- ✅ CORS is configured properly
- ✅ Network tab shows API calls
- ✅ TanStack Query DevTools show query status

### Debugging Tools

#### 1. React DevTools
- Install React Developer Tools browser extension
- Inspect component state and props
- Monitor state changes in real-time

#### 2. TanStack Query DevTools
```tsx path=null start=null
// Add to your app root (development only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <div>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}
```

#### 3. Browser DevTools
- **Console**: Check for JavaScript errors
- **Network**: Monitor API requests and responses
- **Elements**: Inspect rendered HTML and CSS

#### 4. Debug Logging
```tsx path=null start=null
// Add debug logs to understand data flow
function MyComponent() {
  const { data, isLoading, isError } = useQuery();
  
  console.log('Component state:', { data, isLoading, isError });
  
  return <div>...</div>;
}
```

### Performance Tips

1. **Memoization**: Use React.memo() for expensive components
```tsx path=null start=null
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});
```

2. **Query Optimization**: Configure appropriate cache times
```tsx path=null start=null
const { data } = useQuery({
  queryKey: ['census-data'],
  queryFn: fetchCensusData,
  staleTime: 5 * 60 * 1000,    // 5 minutes
  cacheTime: 10 * 60 * 1000,   // 10 minutes
});
```

3. **Conditional Queries**: Only fetch when needed
```tsx path=null start=null
const { data } = useQuery({
  queryKey: ['census-data', searchId],
  queryFn: () => fetchCensusById(searchId),
  enabled: !!searchId,  // Only run when searchId exists
});
```

---

## Testing Cards

### Manual Testing Checklist

**Loading States**:
- ✅ Shows spinner immediately when loading starts
- ✅ Spinner disappears when data loads
- ✅ Layout doesn't shift during loading

**Error States**:
- ✅ Shows error message on API failure
- ✅ Error styling is consistent across cards
- ✅ Error message is user-friendly

**Success States**:
- ✅ Data displays correctly
- ✅ Numbers are formatted properly
- ✅ Icons and badges appear as expected

**Interactions**:
- ✅ Buttons respond to clicks
- ✅ Tabs switch content properly
- ✅ State updates trigger re-renders

### Unit Testing Example
```tsx path=null start=null
import { render, screen, waitFor } from '@testing-library/react';
import { TotalEnrollmentDisplay } from './dashboard';

// Mock the hook
jest.mock('../../hooks/useCensusData', () => ({
  useTotalEnrollment: () => ({
    totalEnr: 1234567,
    isLoading: false,
    isError: false,
    hasData: true,
  }),
}));

test('displays formatted enrollment number', async () => {
  render(<TotalEnrollmentDisplay />);
  
  await waitFor(() => {
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});
```

---

## Next Steps

### Enhancement Ideas
1. **Advanced Filtering**: Add date range, district, or school type filters
2. **Data Visualization**: Integrate charts and graphs
3. **Export Functionality**: Allow users to download data
4. **Real-time Updates**: WebSocket integration for live data
5. **Favorites System**: Let users save frequently accessed data

### Learning Resources
- [Chakra UI v3 Documentation](https://next.chakra-ui.com/)
- [TanStack Query Guide](https://tanstack.com/query/latest)
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [Testing React Components](https://testing-library.com/docs/react-testing-library/intro/)

This guide covers the essential patterns for building interactive, data-driven cards with Chakra UI v3. The census data cards serve as a practical example that can be extended for other data sources and use cases.

# Chakra UI Cards Documentation

This documentation covers the implementation and usage of the custom Card component built with Chakra UI v3, along with comprehensive dashboard examples.

## Table of Contents

1. [Overview](#overview)
2. [Card Component API](#card-component-api)
3. [Component Structure](#component-structure)
4. [Variants](#variants)
5. [Usage Examples](#usage-examples)
6. [Dashboard Implementation](#dashboard-implementation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The Card component is a flexible, reusable UI component built on top of Chakra UI's Box component. It provides a clean container for grouping related content and actions with consistent styling and responsive behavior.

### Key Features

- ✅ Three visual variants (outline, filled, elevated)
- ✅ Compositional API with Header, Body, and Footer
- ✅ TypeScript support with proper type definitions
- ✅ Responsive design out of the box
- ✅ Accessible by default (inherits from Chakra UI Box)
- ✅ Consistent with Chakra UI design tokens

## Card Component API

### Card Props

```typescript
interface CardProps extends BoxProps {
  variant?: "outline" | "filled" | "elevated";
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"outline" \| "filled" \| "elevated"` | `"outline"` | Visual style variant |
| `...props` | `BoxProps` | - | All Chakra UI Box props are supported |

### Subcomponents

- **`CardHeader`** - Container for card title and actions
- **`CardBody`** - Main content area
- **`CardFooter`** - Container for actions and secondary content

All subcomponents accept `BoxProps` and can be styled accordingly.

## Component Structure

```
Card (Root container)
├── CardHeader (Optional)
├── CardBody (Main content)
└── CardFooter (Optional)
```

### File Structure

```
src/
├── components/
│   └── ui/
│       └── card.tsx          # Card component implementation
└── routes/
    └── _home/
        └── dashboard.tsx     # Dashboard with card examples
```

## Variants

### 1. Outline (Default)

```tsx
<Card variant="outline">
  <CardBody>Clean, minimal border design</CardBody>
</Card>
```

**Styling:**
- Border: 1px solid border.default
- Background: bg.panel
- Best for: General content, forms, lists

### 2. Filled

```tsx
<Card variant="filled">
  <CardBody>Solid background for emphasis</CardBody>
</Card>
```

**Styling:**
- Background: bg.muted
- No border
- Best for: Secondary content, sidebars, widgets

### 3. Elevated

```tsx
<Card variant="elevated">
  <CardBody>Subtle shadow for depth</CardBody>
</Card>
```

**Styling:**
- Background: bg.panel
- Box shadow: lg
- Best for: Primary content, statistics, important information

## Usage Examples

### Basic Card

```tsx
import { Card, CardBody } from '../components/ui/card';

function BasicExample() {
  return (
    <Card>
      <CardBody>
        <Text>Simple card with default styling</Text>
      </CardBody>
    </Card>
  );
}
```

### Complete Card Structure

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/card';

function CompleteExample() {
  return (
    <Card variant="elevated">
      <CardHeader>
        <Heading size="md">Card Title</Heading>
      </CardHeader>
      <CardBody>
        <Text>Main content goes here</Text>
      </CardBody>
      <CardFooter>
        <Button colorScheme="blue">Primary Action</Button>
        <Button variant="ghost">Secondary</Button>
      </CardFooter>
    </Card>
  );
}
```

### Statistics Card

```tsx
function StatsCard({ title, value, change, icon, color }) {
  return (
    <Card variant="elevated">
      <CardBody>
        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {value}
            </Text>
            <HStack>
              <StatArrow type={change > 0 ? "increase" : "decrease"} />
              <Text fontSize="sm" color={change > 0 ? "green.500" : "red.500"}>
                {Math.abs(change)}%
              </Text>
            </HStack>
          </Box>
          <Box p={3} bg={`${color}.50`} borderRadius="lg">
            <Icon as={icon} boxSize={6} color={`${color}.500`} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
}
```

### Activity Feed Card

```tsx
function ActivityCard() {
  return (
    <Card variant="outline">
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">Recent Activity</Heading>
          <Badge colorScheme="blue" variant="subtle">Live</Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {activities.map((activity) => (
            <HStack key={activity.id}>
              <Box p={2} bg={`${activity.color}.50`} borderRadius="md">
                <Icon as={activity.icon} color={`${activity.color}.500`} />
              </Box>
              <Box flex={1}>
                <Text fontWeight="medium">{activity.title}</Text>
                <Text fontSize="sm" color="fg.muted">{activity.description}</Text>
              </Box>
              <Text fontSize="xs" color="fg.muted">{activity.time}</Text>
            </HStack>
          ))}
        </VStack>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" size="sm" width="full">
          View all activity
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Tabbed User Metrics Card

The tabbed metrics card provides an interactive way to display multiple related metrics in a compact space. This card uses Chakra UI v3's Tabs component to organize user statistics.

```tsx
function TabbedUserMetricsCard() {
  return (
    <Card variant="elevated">
      <CardBody>
        <Tabs.Root defaultValue="total" variant="subtle" size="lg">
          <Tabs.List mb={3}>
            <Tabs.Trigger value="total">Total</Tabs.Trigger>
            <Tabs.Trigger value="active">Active</Tabs.Trigger>
            <Tabs.Trigger value="new">New</Tabs.Trigger>
          </Tabs.List>
          
          <Tabs.Content value="total">
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                Total Users
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                2,543
              </Text>
              <HStack>
                <Icon as={FiArrowUp} color="green.500" boxSize={3} />
                <Text fontSize="sm" color="green.500">
                  +12.5% from last month
                </Text>
              </HStack>
            </VStack>
          </Tabs.Content>
          
          <Tabs.Content value="active">
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                Active Users (30d)
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                1,987
              </Text>
              <HStack>
                <Icon as={FiArrowUp} color="green.500" boxSize={3} />
                <Text fontSize="sm" color="green.500">
                  +8.3% from last month
                </Text>
              </HStack>
            </VStack>
          </Tabs.Content>
          
          <Tabs.Content value="new">
            <VStack align="stretch" gap={2}>
              <Text fontSize="lg" color="fg.muted" fontWeight="medium">
                New Users (7d)
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                142
              </Text>
              <HStack>
                <Icon as={FiArrowDown} color="red.500" boxSize={3} />
                <Text fontSize="sm" color="red.500">
                  -5.2% from last week
                </Text>
              </HStack>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </CardBody>
    </Card>
  );
}
```

**Key Features:**
- Interactive tabs with Chakra UI v3 Tabs component
- Subtle tab variant with large size for better readability
- Three distinct metrics: Total, Active (30d), and New (7d) users
- Trend indicators using react-icons (FiArrowUp/FiArrowDown)
- Color-coded trends (green for positive, red for negative)
- Consistent spacing and typography

## Dashboard Implementation

The dashboard (`src/routes/_home/dashboard.tsx`) showcases various card patterns:

### 1. Statistics Grid

Four metric cards displaying KPIs with interactive and static elements:

```tsx
<Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
  {/* Tabbed User Metrics Card */}
  <Card variant="elevated">
    <CardBody>
      <Tabs.Root defaultValue="total" variant="subtle" size="lg">
        {/* Tabs content */}
      </Tabs.Root>
    </CardBody>
  </Card>
  
  {/* Revenue Card */}
  <Card variant="elevated">
    <CardBody>
      <HStack justify="space-between">
        {/* Revenue metrics */}
      </HStack>
    </CardBody>
  </Card>
  
  {/* Orders and Growth Rate Cards */}
</Grid>
```

**Features:**
- Responsive grid layout (1 column on mobile, 2 on tablet, 4 on desktop)
- **First card**: Interactive tabbed user metrics with Total/Active/New users
- **Other cards**: Static metrics for Revenue ($45,231), Orders (1,234), and Growth Rate (15.3%)
- Color-coded icons with background styling
- Trend indicators using react-icons (FiArrowUp/FiArrowDown)
- Consistent elevation styling across all stats cards

### 2. Main Content Grid

Two-column layout with activity feed and quick actions:

```tsx
<Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
  {/* Activity Card */}
  <Card variant="outline">
    <CardHeader>
      <HStack justify="space-between">
        <Heading size="md">Recent Activity</Heading>
        <Badge colorScheme="blue" variant="subtle">Live</Badge>
      </HStack>
    </CardHeader>
    <CardBody>
      {/* Activity items */}
    </CardBody>
    <CardFooter>
      <Button variant="ghost" size="sm" width="full">
        View all activity
      </Button>
    </CardFooter>
  </Card>
  
  {/* Quick Actions Card */}
  <Card variant="filled">
    <CardHeader>
      <Heading size="md">Quick Actions</Heading>
    </CardHeader>
    <CardBody>
      {/* Action buttons */}
    </CardBody>
  </Card>
</Grid>
```

**Activity Feed Features:**
- Real-time activity display with "Live" badge
- Icon-based activity types (user, payment, order)
- Timestamps and descriptions
- Footer action for viewing all activities
- Outline variant for clean, organized appearance

**Quick Actions Features:**
- Vertical button stack for common actions
- Full-width buttons with icons
- Color-coded by priority (blue, green, gray)
- Filled variant for secondary emphasis
- Actions: Add New User, View Analytics, Settings

### 4. Tabbed User Metrics Card

Interactive card with tabs showing different user analytics:
- Total users with growth metrics
- Active users (30-day period)
- New users (7-day period)
- Smooth tab transitions with Chakra UI Tabs component

### 3. Additional Status Cards

Three-column grid layout showcasing operational metrics:

```tsx
<Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
  {/* System Status Card */}
  <Card variant="outline">
    <CardHeader>
      <Heading size="sm">System Status</Heading>
    </CardHeader>
    <CardBody>
      <VStack gap={3} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm">API Status</Text>
          <Badge colorScheme="green" size="sm">Operational</Badge>
        </HStack>
        {/* More status items */}
      </VStack>
    </CardBody>
  </Card>
  
  {/* Performance Card */}
  <Card variant="elevated">
    <CardHeader>
      <Heading size="sm">Performance</Heading>
    </CardHeader>
    <CardBody>
      <VStack gap={3}>
        <Box textAlign="center">
          <Text fontSize="lg" fontWeight="bold">234ms</Text>
          <Text fontSize="xs" color="fg.muted">Response Time</Text>
        </Box>
      </VStack>
    </CardBody>
  </Card>
  
  {/* Storage Usage Card */}
  <Card variant="outline">
    <CardHeader>
      <Heading size="sm">Storage Usage</Heading>
    </CardHeader>
    <CardBody>
      <VStack gap={2}>
        <HStack justify="space-between" width="full">
          <Text fontSize="sm">Used</Text>
          <Text fontSize="sm" fontWeight="medium">45.2 GB</Text>
        </HStack>
        {/* Progress bar */}
      </VStack>
    </CardBody>
  </Card>
</Grid>
```

**System Status Card Features:**
- Service health monitoring (API, Database, Cache)
- Color-coded status badges (green for operational, yellow for warnings)
- Outline variant for minimal emphasis
- Small heading size for compact display

**Performance Card Features:**
- Response time metrics (234ms)
- Trend indicators with improvement data
- Elevated variant for visual prominence
- Centered text layout for metric focus

**Storage Usage Card Features:**
- Used vs. available storage display (45.2 GB / 54.8 GB)
- Visual progress bar showing 45.2% usage
- Clean data presentation with aligned values
- Outline variant matching system status card

## Best Practices

### 1. Responsive Design

Always use responsive props for grid layouts:

```tsx
// Good
<Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}>

// Avoid
<Grid templateColumns="repeat(4, 1fr)">
```

### 2. Consistent Spacing

Use Chakra UI spacing tokens:

```tsx
// Good
<VStack spacing={4}>
<Box p={6}>

// Avoid
<VStack spacing="16px">
<Box padding="24px">
```

### 3. Semantic Color Usage

Use semantic color tokens for consistency:

```tsx
// Good
<Text color="fg.muted">
<Box bg="bg.panel">

// Avoid
<Text color="gray.500">
<Box bg="white">
```

### 4. Accessibility

Always provide meaningful content:

```tsx
// Good
<Icon as={FiUser} boxSize={6} aria-label="User icon" />
<Button aria-label="View all activities">View all</Button>

// Consider accessibility for complex cards
<Card role="article" aria-labelledby="card-title">
  <CardHeader>
    <Heading id="card-title">Statistics</Heading>
  </CardHeader>
</Card>
```

### 5. Performance

For large lists of cards, consider virtualization:

```tsx
// For many cards, use React Window or similar
import { FixedSizeGrid as Grid } from 'react-window';
```

## Advanced Patterns

### 1. Loading States

```tsx
function LoadingCard() {
  return (
    <Card>
      <CardBody>
        <VStack spacing={3}>
          <Skeleton height="20px" />
          <Skeleton height="40px" />
          <Skeleton height="20px" width="60%" />
        </VStack>
      </CardBody>
    </Card>
  );
}
```

### 2. Interactive Cards

```tsx
function InteractiveCard({ onClick, isSelected }) {
  return (
    <Card
      variant={isSelected ? "elevated" : "outline"}
      cursor="pointer"
      onClick={onClick}
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
      transition="all 0.2s"
    >
      <CardBody>
        {/* Card content */}
      </CardBody>
    </Card>
  );
}
```

### 3. Card with Menu

```tsx
function CardWithMenu() {
  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">Title</Heading>
          <Menu>
            <MenuButton as={IconButton} icon={<Icon as={FiMoreVertical} />} />
            <MenuList>
              <MenuItem>Edit</MenuItem>
              <MenuItem>Delete</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </CardHeader>
      <CardBody>
        {/* Content */}
      </CardBody>
    </Card>
  );
}
```

## Troubleshooting

### Common Issues

1. **Cards not responsive**
   - Ensure parent container has proper responsive props
   - Check that Grid templateColumns uses responsive values

2. **Inconsistent spacing**
   - Use Chakra UI spacing tokens consistently
   - Avoid mixing px values with tokens

3. **Color not updating with theme**
   - Use semantic color tokens (fg.muted, bg.panel)
   - Avoid hardcoded color values

4. **TypeScript errors**
   - Ensure proper imports from @chakra-ui/react
   - Check that custom props extend BoxProps correctly

### Performance Considerations

1. **Many cards**: Consider virtualization for 100+ cards
2. **Complex content**: Memoize expensive calculations
3. **Images**: Use proper loading states and optimization

### Accessibility Checklist

- [ ] Meaningful heading structure
- [ ] Proper color contrast ratios
- [ ] Keyboard navigation support
- [ ] Screen reader friendly content
- [ ] ARIA labels where needed

## Migration Guide

### From Other UI Libraries

If migrating from other card implementations:

```tsx
// Material-UI Card
<Card>
  <CardContent>Content</CardContent>
</Card>

// Our implementation
<Card>
  <CardBody>Content</CardBody>
</Card>
```

### Upgrading

When updating the Card component:

1. Test all variants
2. Check responsive behavior
3. Verify color token usage
4. Update documentation examples

## TypeScript Guide for Python Developers

Before diving into the Census Data integration, let's understand key TypeScript concepts for developers coming from Python backgrounds.

### Language Comparison Overview

| Concept | Python | TypeScript |
|---------|--------|-----------|
| **Type System** | Dynamic (runtime) | Static (compile-time) |
| **Variable Declaration** | `name = "John"` | `const name: string = "John"` |
| **Function Definition** | `def greet(name: str) -> str:` | `function greet(name: string): string` |
| **Class Definition** | `class User:` | `class User {` |
| **Interface/Contract** | `@dataclass` or Protocol | `interface User {` |
| **Imports** | `from module import Class` | `import { Class } from 'module'` |
| **Null/None** | `None` | `null` or `undefined` |
| **Boolean** | `True/False` | `true/false` |
| **Comments** | `# Single line` | `// Single line` |

### Key TypeScript Concepts

#### 1. Type Annotations
```typescript
// TypeScript - types are explicit and checked at compile-time
const age: number = 25;
const name: string = "Alice";
const isActive: boolean = true;
const items: string[] = ["item1", "item2"];

// Python equivalent - types are hints, checked at runtime if using mypy
age: int = 25
name: str = "Alice"
is_active: bool = True
items: List[str] = ["item1", "item2"]
```

#### 2. Interfaces vs Python Classes/DataClasses
```typescript
// TypeScript Interface (compile-time only)
interface User {
  id: string;
  name: string;
  email?: string;  // Optional property (like Optional[str] in Python)
}

// Python equivalent using dataclass
from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: str
    name: str
    email: Optional[str] = None
```

#### 3. Function Signatures
```typescript
// TypeScript function
function calculateTotal(price: number, tax: number = 0.1): number {
  return price * (1 + tax);
}

# Python equivalent
def calculate_total(price: float, tax: float = 0.1) -> float:
    return price * (1 + tax)
```

#### 4. Destructuring vs Unpacking
```typescript
// TypeScript destructuring
const user = { name: "John", age: 30 };
const { name, age } = user;

# Python equivalent
user = {"name": "John", "age": 30}
name, age = user["name"], user["age"]
# Or with dataclass unpacking
from operator import attrgetter
name, age = attrgetter("name", "age")(user)
```

#### 5. Array/List Methods
```typescript
// TypeScript array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);        // [2, 4, 6, 8, 10]
const filtered = numbers.filter(n => n > 3);    // [4, 5]
const sum = numbers.reduce((a, b) => a + b, 0); // 15

# Python equivalent
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]              # [2, 4, 6, 8, 10]
filtered = [n for n in numbers if n > 3]        # [4, 5]
sum_total = sum(numbers)                        # 15
```

#### 6. Async/Await (Very Similar!)
```typescript
// TypeScript async function
async function fetchData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

# Python equivalent (almost identical!)
import aiohttp

async def fetch_data(url: str) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
                return data
    except Exception as error:
        print(f'Error: {error}')
        raise
```

### React Concepts for Python Developers

#### 1. Components are like Python Classes
```typescript
// TypeScript React Component
function UserCard({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

# Python equivalent (conceptual)
class UserCard:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
    
    def render(self) -> str:
        return f"""
        <div>
            <h2>{self.name}</h2>
            <p>{self.email}</p>
        </div>
        """
```

#### 2. State Management (useState hook)
```typescript
// TypeScript state management
const [count, setCount] = useState<number>(0);

// Increment counter
const increment = () => setCount(count + 1);

# Python equivalent (conceptual)
class Counter:
    def __init__(self):
        self._count = 0
    
    @property
    def count(self) -> int:
        return self._count
    
    def set_count(self, new_count: int):
        self._count = new_count
        self.re_render()  # Trigger re-render
```

#### 3. Effects (useEffect hook)
```typescript
// TypeScript side effects
useEffect(() => {
  // This runs when component mounts (like __init__)
  fetchData();
  
  return () => {
    // This runs when component unmounts (like __del__)
    cleanup();
  };
}, [dependency]);  // Re-run when dependency changes

# Python equivalent (conceptual)
class Component:
    def __init__(self, dependency):
        self.dependency = dependency
        self.fetch_data()
    
    def __del__(self):
        self.cleanup()
    
    def dependency_changed(self, new_dependency):
        if new_dependency != self.dependency:
            self.dependency = new_dependency
            self.fetch_data()
```

### Common Patterns Translation

#### Error Handling
```typescript
// TypeScript
try {
  const result = await apiCall();
  setData(result);
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  }
} finally {
  setLoading(false);
}

# Python
try:
    result = await api_call()
    self.data = result
except Exception as error:
    self.error = str(error)
finally:
    self.loading = False
```

#### Conditional Rendering
```typescript
// TypeScript JSX
if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

return <DataDisplay data={data} />;

# Python equivalent
def render(self):
    if self.loading:
        return self.render_loading_spinner()
    
    if self.error:
        return self.render_error_message(self.error)
    
    return self.render_data_display(self.data)
```

### Development Tools Comparison

| Task | Python | TypeScript/React |
|------|--------|-----------------|
| **Package Manager** | pip, poetry | npm, yarn |
| **Virtual Environment** | venv, conda | node_modules |
| **Type Checking** | mypy | Built into TypeScript |
| **Testing** | pytest, unittest | Jest, React Testing Library |
| **Linting** | pylint, flake8 | ESLint, Prettier |
| **Hot Reload** | Flask dev server | Vite, Create React App |

---

## Census Data Integration

Now that we understand TypeScript basics, let's explore how to create Card components that interact with the backend census data API endpoints. The project includes a FastAPI backend with census data endpoints that require superuser authentication.

### Census Data Router Overview

The census data router (`/api/v1/censusdata`) provides the following endpoint:

```typescript
// GET /api/v1/censusdata/{id}
// Requires: Superuser authentication
// Returns: CensusData object
```

**Router Implementation:**
```python path=/backend/app/api/routes/censusdata.py start=32
@router.get("/{id}", response_model=CensusData)
def read_census_data(session: SessionDep, current_user: CurrentUser, id: str) -> Any:
    """
    Get census data by ID.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    census_data = session.get(CensusData, id)
    if not census_data:
        raise HTTPException(status_code=404, detail="Census data not found")

    return census_data
```

### CensusData Model Structure

The `CensusData` model contains comprehensive school enrollment information:

**Core Fields:**
- `census_data_id`: UUID primary key
- `academic_year`: Academic year (indexed)
- `aggregation_level`: Level of data aggregation (indexed)
- `county_code`, `district_code`, `school_code`: Hierarchical codes (indexed)
- `county_name`, `district_name`, `school_name`: Human-readable names
- `charter`: Charter school status
- `reporting_category`: Data reporting category

**Enrollment Data:**
- `total_enr`: Total enrollment count
- `gr_tk` through `gr_12`: Grade-specific enrollment (TK, K, 1-12)

### Census Data Card Component

Here's a complete implementation of a card that fetches and displays census data:

```tsx
import { useEffect, useState } from 'react';
import { 
  Card, CardHeader, CardBody, CardFooter 
} from '../components/ui/card';
import {
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Skeleton,
  Alert,
  AlertIcon,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Icon
} from '@chakra-ui/react';
import { FiSchool, FiUsers, FiMapPin } from 'react-icons/fi';
import { ApiService } from '../client';

interface CensusData {
  census_data_id: string;
  academic_year: number;
  aggregation_level: string;
  county_code: string;
  district_code: string;
  school_code: string;
  county_name: string;
  district_name: string;
  school_name: string;
  charter: string;
  reporting_category: string;
  total_enr: number;
  gr_tk: number;
  gr_kn: number;
  gr_1: number;
  gr_2: number;
  gr_3: number;
  gr_4: number;
  gr_5: number;
  gr_6: number;
  gr_7: number;
  gr_8: number;
  gr_9: number;
  gr_10: number;
  gr_11: number;
  gr_12: number;
}

interface CensusDataCardProps {
  censusDataId: string;
  variant?: "outline" | "filled" | "elevated";
  showGradeBreakdown?: boolean;
}

function CensusDataCard({ 
  censusDataId, 
  variant = "elevated",
  showGradeBreakdown = false 
}: CensusDataCardProps) {
  const [data, setData] = useState<CensusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCensusData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using the generated API client
        const response = await ApiService.readCensusData(censusDataId);
        setData(response);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch census data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCensusData();
  }, [censusDataId]);

  if (loading) {
    return (
      <Card variant={variant}>
        <CardHeader>
          <Skeleton height="24px" width="200px" />
        </CardHeader>
        <CardBody>
          <VStack spacing={3}>
            <Skeleton height="20px" width="100%" />
            <Skeleton height="20px" width="80%" />
            <Skeleton height="40px" width="60%" />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant={variant}>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </CardBody>
        <CardFooter>
          <Button 
            size="sm" 
            onClick={() => window.location.reload()}
            width="full"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card variant={variant}>
        <CardBody>
          <Text color="fg.muted">No census data found</Text>
        </CardBody>
      </Card>
    );
  }

  const gradeData = [
    { label: 'TK', count: data.gr_tk },
    { label: 'K', count: data.gr_kn },
    { label: '1', count: data.gr_1 },
    { label: '2', count: data.gr_2 },
    { label: '3', count: data.gr_3 },
    { label: '4', count: data.gr_4 },
    { label: '5', count: data.gr_5 },
    { label: '6', count: data.gr_6 },
    { label: '7', count: data.gr_7 },
    { label: '8', count: data.gr_8 },
    { label: '9', count: data.gr_9 },
    { label: '10', count: data.gr_10 },
    { label: '11', count: data.gr_11 },
    { label: '12', count: data.gr_12 }
  ].filter(grade => grade.count > 0);

  return (
    <Card variant={variant}>
      <CardHeader>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <HStack>
              <Icon as={FiSchool} boxSize={5} color="blue.500" />
              <Heading size="md">{data.school_name}</Heading>
            </HStack>
            <HStack spacing={4} color="fg.muted" fontSize="sm">
              <HStack>
                <Icon as={FiMapPin} boxSize={3} />
                <Text>{data.district_name}</Text>
              </HStack>
              <Text>•</Text>
              <Text>{data.county_name}</Text>
            </HStack>
          </VStack>
          <VStack spacing={1}>
            <Badge 
              colorScheme={data.charter === 'Y' ? 'purple' : 'gray'}
              size="sm"
            >
              {data.charter === 'Y' ? 'Charter' : 'Public'}
            </Badge>
            <Text fontSize="xs" color="fg.muted">
              AY {data.academic_year}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={4}>
          {/* Total Enrollment */}
          <Box textAlign="center">
            <Stat>
              <StatLabel>
                <HStack justify="center">
                  <Icon as={FiUsers} boxSize={4} />
                  <Text>Total Enrollment</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="2xl" color="blue.500">
                {data.total_enr.toLocaleString()}
              </StatNumber>
              <StatHelpText>
                {data.reporting_category}
              </StatHelpText>
            </Stat>
          </Box>

          {/* Grade Breakdown */}
          {showGradeBreakdown && gradeData.length > 0 && (
            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={3}>
                Enrollment by Grade
              </Text>
              <Grid 
                templateColumns="repeat(auto-fit, minmax(60px, 1fr))" 
                gap={2}
                maxH="200px"
                overflowY="auto"
              >
                {gradeData.map((grade) => (
                  <Box 
                    key={grade.label}
                    p={2}
                    bg="bg.muted"
                    borderRadius="md"
                    textAlign="center"
                  >
                    <Text fontSize="xs" color="fg.muted">
                      Grade {grade.label}
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {grade.count}
                    </Text>
                  </Box>
                ))}
              </Grid>
            </Box>
          )}
        </VStack>
      </CardBody>

      <CardFooter>
        <HStack justify="space-between" width="full" fontSize="xs" color="fg.muted">
          <Text>School Code: {data.school_code}</Text>
          <Text>District Code: {data.district_code}</Text>
        </HStack>
      </CardFooter>
    </Card>
  );
}

export { CensusDataCard };
export type { CensusDataCardProps, CensusData };
```

### Usage Examples

#### Basic Census Data Card

```tsx
import { CensusDataCard } from '../components/CensusDataCard';

function SchoolDashboard() {
  return (
    <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
      <CensusDataCard censusDataId="123e4567-e89b-12d3-a456-426614174000" />
      <CensusDataCard 
        censusDataId="987fcdeb-51a2-43d1-9c4f-123456789abc" 
        variant="outline"
      />
    </Grid>
  );
}
```

#### Census Card with Grade Breakdown

```tsx
function DetailedSchoolView() {
  return (
    <CensusDataCard 
      censusDataId="456e7890-e12b-34c5-d678-901234567890"
      variant="elevated"
      showGradeBreakdown={true}
    />
  );
}
```

### Multiple Census Cards in Dashboard

```tsx
function CensusDataDashboard() {
  const [schoolIds, setSchoolIds] = useState<string[]>([]);

  useEffect(() => {
    // Fetch list of school IDs from API
    // This would use the /censusdata endpoint with pagination
  }, []);

  return (
    <VStack spacing={6}>
      <Heading size="lg">California School Census Data</Heading>
      
      <Grid 
        templateColumns={{ 
          base: '1fr', 
          md: 'repeat(2, 1fr)', 
          lg: 'repeat(3, 1fr)' 
        }} 
        gap={6}
      >
        {schoolIds.map((id) => (
          <CensusDataCard 
            key={id}
            censusDataId={id}
            variant="elevated"
          />
        ))}
      </Grid>
    </VStack>
  );
}
```

#### Census Data Search Card in Dashboard

Here's a complete implementation of a tabbed census data card integrated into the dashboard:

```tsx
// Census Data Search Card Component with tabs
function CensusDataSearchCard() {
  // State management for search functionality
  const [searchId, setSearchId] = useState<string | null>(null);
  
  // Sample ID for demonstration
  const sampleId = "123e4567-e89b-12d3-a456-426614174000";
  
  // React Query hook to fetch census data by ID
  const { data: censusData, isLoading, isError, error } = useCensusDataById(searchId);

  // Nested component for displaying census data content
  function CensusDataContent({ censusData, isLoading, isError, error }) {
    if (isLoading) {
      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="fg.muted" fontWeight="medium">
            Census Data
          </Text>
          <Skeleton height="32px" width="120px" />
          <Skeleton height="16px" width="100px" />
        </VStack>
      );
    }

    if (isError) {
      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="fg.muted" fontWeight="medium">
            Census Data
          </Text>
          <Alert status="error" size="sm">
            <AlertIcon boxSize={3} />
            <Text fontSize="xs">Failed to load</Text>
          </Alert>
        </VStack>
      );
    }

    if (!censusData?.data) {
      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="fg.muted" fontWeight="medium">
            Census Data
          </Text>
          <Text fontSize="lg" color="fg.muted">
            No data found
          </Text>
        </VStack>
      );
    }

    const data = censusData.data;

    return (
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xs" color="fg.muted">
              {data.school_name || "Unknown School"}
            </Text>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">
              Total Enrollment
            </Text>
          </VStack>
          <Icon as={FiSchool} color="blue.500" boxSize={4} />
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
          {data.total_enr?.toLocaleString() || "0"}
        </Text>
        <HStack>
          <Badge 
            colorScheme={data.charter === 'Y' ? 'purple' : 'gray'}
            size="xs"
          >
            {data.charter === 'Y' ? 'Charter' : 'Public'}
          </Badge>
          <Text fontSize="xs" color="fg.muted">
            AY {data.academic_year}
          </Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <Tabs.Root defaultValue="found-id" variant="subtle" size="lg">
      <Tabs.List mb={3}>
        <Tabs.Trigger value="found-id">Found ID</Tabs.Trigger>
        <Tabs.Trigger value="default">Default</Tabs.Trigger>
        <Tabs.Trigger value="last-searched">Last Searched</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="found-id">
        <VStack gap={3}>
          <CensusDataContent 
            censusData={censusData} 
            isLoading={isLoading} 
            isError={isError} 
            error={error} 
          />
          {!searchId && (
            <Button 
              size="xs" 
              colorScheme="blue" 
              variant="outline"
              onClick={() => setSearchId(sampleId)}
            >
              Load Sample Data
            </Button>
          )}
        </VStack>
      </Tabs.Content>

      <Tabs.Content value="default">
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="fg.muted" fontWeight="medium">
            Default View
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            -
          </Text>
          <HStack>
            <Icon as={FiUsers} color="gray.500" boxSize={3} />
            <Text fontSize="sm" color="fg.muted">
              No data selected
            </Text>
          </HStack>
        </VStack>
      </Tabs.Content>

      <Tabs.Content value="last-searched">
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" color="fg.muted" fontWeight="medium">
            Last Searched
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {searchId ? "✓" : "-"}
          </Text>
          <HStack>
            <Icon as={FiActivity} color="blue.500" boxSize={3} />
            <Text fontSize="sm" color="fg.muted">
              {searchId ? "Data loaded" : "No recent searches"}
            </Text>
          </HStack>
        </VStack>
      </Tabs.Content>
    </Tabs.Root>
  );
}

// Integration in Dashboard
function Dashboard() {
  return (
    <Container maxW="7xl" py={8}>
      <VStack gap={8} align="stretch">
        {/* Stats Cards Row */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          {/* First Card: User metrics with tabs */}
          <Card variant="elevated">
            <CardBody>
              {/* Standard user metrics tabs */}
            </CardBody>
          </Card>

          {/* Second Card: Census Data Search Card */}
          <Card variant="elevated">
            <CardBody>
              <CensusDataSearchCard />
            </CardBody>
          </Card>

          {/* Other cards... */}
        </Grid>
      </VStack>
    </Container>
  );
}
```

**Key Features of this Implementation:**

1. **State Management**: Uses React `useState` to manage search ID
2. **React Query Integration**: Leverages `useCensusDataById` hook for data fetching
3. **Three Tab Structure**:
   - **Found ID**: Displays census data when loaded, with button to load sample data
   - **Default**: Shows placeholder content when no data is selected
   - **Last Searched**: Shows status of the last search operation
4. **Loading States**: Skeleton components during data fetching
5. **Error Handling**: Alert components for error states
6. **Responsive Design**: Works across different screen sizes
7. **API Integration**: Connects directly to the FastAPI census data endpoint

### Authentication Requirements

The census data endpoints require superuser authentication. Make sure your API client is configured with proper authentication:

```typescript
// Configure API client with authentication
import { OpenAPI } from '../client';

// Set authentication token
OpenAPI.TOKEN = localStorage.getItem('access_token');

// Or use interceptor for automatic token handling
OpenAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling

The CensusDataCard component includes comprehensive error handling for:

- **403 Forbidden**: User lacks superuser permissions
- **404 Not Found**: Census data record doesn't exist
- **Network errors**: Connection issues
- **Loading states**: Skeleton UI while fetching

### Best Practices for Census Data Cards

1. **Performance**: Use pagination when displaying multiple cards
2. **Caching**: Implement caching for frequently accessed census data
3. **Responsive Design**: Ensure cards work well on all screen sizes
4. **Accessibility**: Include proper ARIA labels for screen readers
5. **Loading States**: Always show loading indicators for better UX

### API Integration with React Query

For better state management, consider using React Query:

```tsx
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../client';

function useCensusData(id: string) {
  return useQuery({
    queryKey: ['censusData', id],
    queryFn: () => ApiService.readCensusData(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function OptimizedCensusCard({ censusDataId }: { censusDataId: string }) {
  const { data, isLoading, error } = useCensusData(censusDataId);
  
  // Component implementation using React Query state
}
```

## Examples Repository

For more examples, check:
- Dashboard implementation: `src/routes/_home/dashboard.tsx`
- Component source: `src/components/ui/card.tsx`
- Census Data integration: `src/components/CensusDataCard.tsx`
- Additional patterns in the component library

---

**Note:** This implementation uses Chakra UI v3. For different versions, some tokens and APIs may vary. Always refer to the official Chakra UI documentation for the most current information.
