# Claude Code Guidelines for PaddleRating App

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Full-page screen components
├── hooks/          # Custom React hooks for data/state
├── services/       # API layer (mock now, real API later)
├── data/           # Mock data files
├── types/          # TypeScript interfaces
├── theme/          # Design tokens (colors, spacing, typography)
├── utils/          # Helper functions
├── constants/      # App-wide constants
└── navigation/     # React Navigation setup (for dev builds)
```

## Key Conventions

### Adding New UI Components
1. Create in `src/components/`
2. Export from `src/components/index.ts`
3. Use design tokens from `src/theme/colors.ts`
4. Use TypeScript interfaces from `src/types/`

### Adding New Screens
1. Create in `src/screens/`
2. Use hooks from `src/hooks/` for data fetching
3. Import components from `src/components`
4. Navigation is disabled in Expo Go - screens are swapped manually in App.tsx for now

### Data Flow Pattern
```typescript
// Screen uses hook
const { players, loading } = useNearbyPlayers();

// Hook calls service
const data = await playerService.getNearbyPlayers();

// Service returns mock data (swap to API later)
return mockPlayers;
```

### Adding Mock Data
1. Add to `src/data/mockData.ts`
2. Export from `src/data/index.ts`
3. Use in services layer, NOT directly in components

### Styling
- Use `colors`, `spacing`, `borderRadius` from `src/theme/colors.ts`
- Use `StyleSheet.create()` at bottom of component files
- Dark theme with neon green accent (#39FF14)

### Types
- All types in `src/types/index.ts`
- Player, Team, GameMode, CurrentUser, CurrentTeam

### Animation
- Use `react-native-reanimated` for animations
- Common patterns: FadeInDown, withSpring, useAnimatedStyle

## Current State
- Single screen app (HomeScreen)
- Navigation setup exists but requires dev build to use
- Mock data in services layer
- Ready for backend integration (swap service implementations)

## Backend Integration (Future)
When adding real API:
1. Update service functions in `src/services/playerService.ts`
2. Replace mock returns with API calls
3. Hooks and components need no changes
