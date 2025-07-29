<div align="center">
  <img src="public/logo.png" alt="Catan Helper Logo" width="128" height="128">
  
  # Catan Helper Chrome Extension
  
  A Chrome extension that provides a helper tool for Catan games on [colonist.io](https://colonist.io). The extension captures screenshots of the game board and uses computer vision to extract board information for analysis and statistics.
</div>

## Features

- **Board Analysis**: Capture and analyze the current state of a Catan game board
- **Resource Statistics**: View detailed statistics about resource scarcity and probability
- **Real-time Data**: Process live game screenshots to extract dice numbers and resource positions
- **Toggle Views**: Switch between game board view and statistical analysis
- **Probability Calculations**: Analyze dice roll probabilities for strategic planning

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension:
   ```bash
   npm run build
   ```
3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build` folder

## Development

### Prerequisites

- Node.js and npm
- Chrome browser
- Backend API server running on localhost:3300 (for image processing)

### Scripts

- `npm start`: Start development server on port 3301
- `npm run build`: Build the production extension and copy manifest
- `npm test`: Run Jest tests
- `npm run generate:api:types`: Generate TypeScript API types from Swagger endpoint

### Development Workflow

1. Start the development server:
   ```bash
   npm start
   ```
2. The extension will be available at `localhost:3301`
3. For testing with mock data, set `useMock = true` in `src/App.tsx`
4. Load the unpacked extension in Chrome for testing

## Architecture

### Core Components

- **App.tsx**: Main application with tab-based interface (game view and statistics)
- **Background Script**: Chrome extension background script for screenshot capture
- **Repository Layer**: API communication with backend for image processing
- **Game Logic**: Catan board representation and probability calculations

### Board Representation

The extension models a Catan board with:

- 19 hexagonal tiles positioned 0-18 in standard Catan layout
- Each hexagon contains: resource type, dice number, position, probability
- 54 vertices (0-53) mapped for settlement/city placement
- Statistical calculations for resource scarcity analysis

### Data Flow

1. User clicks screenshot button in extension popup
2. Background script captures visible tab as PNG via Chrome API
3. Image data sent to backend `/image/read` endpoint for processing
4. Backend returns structured data (numbers array, resources array)
5. Frontend builds hexagon objects and renders game board or statistics

## Technologies Used

- **Frontend**: React 18, TypeScript
- **Build Tools**: Create React App, react-app-rewired, Webpack
- **Testing**: Jest with jsdom environment
- **Chrome APIs**: activeTab, clipboardWrite, clipboardRead, scripting
- **API Integration**: RESTful backend communication

## Project Structure

```
extension/
├── public/                     # Static assets
│   ├── index.html             # Main HTML file
│   ├── manifest.json          # Chrome extension manifest
│   └── *.png                  # Extension icons
├── src/
│   ├── App.tsx                # Main application component
│   ├── index.tsx              # React entry point
│   ├── components/            # React components
│   │   ├── DiceNumber/        # Dice number display component
│   │   ├── Game/              # Game board view component
│   │   ├── Hexagon/           # Individual hexagon tile component
│   │   ├── Line/              # Line drawing component
│   │   ├── NoData/            # No data state component
│   │   ├── Statistics/        # Statistics view component
│   │   ├── TabHeader/         # Tab navigation component
│   │   └── Vertex/            # Settlement/city vertex component
│   ├── infra/                 # Infrastructure layer
│   │   ├── background.ts      # Chrome extension background script
│   │   └── repository.ts      # API communication layer
│   ├── utils/                 # Utility functions
│   │   ├── calculations.ts    # Probability calculations
│   │   ├── hexagons.ts        # Catan board logic
│   │   ├── statistics.ts      # Statistics utilities
│   │   └── vertices.ts        # Vertex positioning logic
│   └── *.css                  # Component stylesheets
├── typings/
│   └── api.d.ts              # TypeScript API type definitions
├── build/                     # Production build output (generated)
├── manifest.json             # Chrome extension manifest
├── config-overrides.js      # Create React App configuration overrides
├── copyManifest.js          # Build script to copy manifest
├── webpack.config.js        # Webpack configuration for background script
├── package.json             # Node.js dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

### Key Files

- **`src/App.tsx`**: Main React component with tab interface and game logic
- **`src/infra/background.ts`**: Chrome extension background script for screenshot capture
- **`src/infra/repository.ts`**: Handles API calls to backend image processing service
- **`src/utils/hexagons.ts`**: Core Catan board representation and hexagon logic
- **`src/utils/calculations.ts`**: Dice probability and statistical calculations
- **`manifest.json`**: Chrome extension configuration and permissions
- **`config-overrides.js`**: Webpack customizations for Chrome extension build

## Testing

The project uses Jest with jsdom for testing:

```bash
npm test
```

Test files use `.spec.ts` extension and are located alongside their corresponding source files.

## License

This project is private and intended for personal use.

## Notes

- The extension only works on [colonist.io](https://colonist.io) game pages with the regular game map.
- Requires a backend API server for image processing functionality.
- Mock data can be used for development by setting `useMock = true`
