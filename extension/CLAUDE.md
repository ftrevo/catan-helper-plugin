# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start`: Start development server on port 3301
- `npm run build`: Build the production extension and copy manifest
- `npm test`: Run Jest tests
- `npm run generate:api:types`: Generate TypeScript API types from Swagger endpoint

## Project Architecture

This is a Chrome extension that provides a helper tool for Catan games on colonist.io. The extension captures screenshots of the game board and uses computer vision (via backend API) to extract board information for analysis.

### Key Components

**Extension Structure:**
- React-based popup UI using TypeScript
- Background script for Chrome API interactions
- Custom webpack configuration for bundling background script
- Uses react-app-rewired for configuration overrides

**Core Architecture:**
- `App.tsx`: Main application component with tab-based interface (game view and statistics)
- `src/infra/background.ts`: Chrome extension background script for screenshot capture
- `src/infra/repository.ts`: API communication layer with backend
- `src/utils/hexagons.ts`: Core game logic for Catan board representation
- `src/utils/calculations.ts`: Probability calculations for dice rolls

**Board Representation:**
- 19 hexagonal tiles positioned 0-18 in a specific Catan board layout
- Each hexagon has: resource type, dice number, position, probability, and 6 vertices
- Hexagon vertices are mapped to specific positions (0-53) for settlement/city placement
- Statistics calculations for resource scarcity analysis

**Data Flow:**
1. User clicks screenshot button in extension popup
2. Background script captures visible tab as PNG via Chrome API
3. Image data sent to backend `/image/read` endpoint for processing
4. Backend returns structured data (numbers array, resources array)
5. Frontend builds hexagon objects and renders game board or statistics

**Mock Data:**
- `useMock = true` in App.tsx uses hardcoded board data for development
- Set to false to use actual screenshot processing

## Testing

- Jest configuration with jsdom environment
- Test files use `.spec.ts` extension
- Setup in `src/setupTests.ts`

## Build Process

- Production build creates optimized bundle in `build/` directory
- `copyManifest.js` copies manifest.json to build directory
- Background script bundled separately via webpack