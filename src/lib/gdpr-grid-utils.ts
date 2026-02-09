/**
 * GDPR-compliant grid utilities for heatmap anonymization
 */

export interface GDPRGridConfig {
  maxGridSize: number;
  minCellSize: number;
}

export interface GridCoordinates {
  grid_x: number;
  grid_y: number;
  viewport_width: number;
  viewport_height: number;
  device_type: string;
}

// GDPR-compliant grid configuration
export const GDPR_GRID_CONFIG: Record<string, GDPRGridConfig> = {
  desktop: { 
    maxGridSize: 25, // 25x25 grid = ~77px per cell (1920px/25)
    minCellSize: 50   // Minimum 50px per cell for anonymity
  },
  mobile: { 
    maxGridSize: 10,  // 10x10 grid = ~37.5px per cell (375px/10)  
    minCellSize: 35   // Minimum 35px per cell for touch anonymity
  },
  tablet: {
    maxGridSize: 20,  // 20x20 grid = ~40px per cell (800px/20)
    minCellSize: 40   // Minimum 40px per cell
  }
};

/**
 * Determine device type based on viewport width
 */
export function getDeviceType(width: number): string {
  if (width < 600) return 'mobile';
  if (width < 900) return 'tablet';
  return 'desktop';
}

/**
 * Calculate GDPR-compliant grid coordinates from exact coordinates
 */
export function calculateGDPRGrid(x: number, y: number, viewportWidth: number, viewportHeight: number): GridCoordinates {
  const deviceType = getDeviceType(viewportWidth);
  const config = GDPR_GRID_CONFIG[deviceType];
  
  // Calculate optimal grid size based on viewport and GDPR requirements
  const gridSizeX = Math.min(config.maxGridSize, Math.floor(viewportWidth / config.minCellSize));
  const gridSizeY = Math.min(config.maxGridSize, Math.floor(viewportHeight / config.minCellSize));
  
  // Convert coordinates to grid positions (GDPR-compliant anonymization)
  const gridX = Math.floor((x / viewportWidth) * gridSizeX);
  const gridY = Math.floor((y / viewportHeight) * gridSizeY);
  
  return {
    grid_x: Math.max(0, Math.min(gridX, gridSizeX - 1)),
    grid_y: Math.max(0, Math.min(gridY, gridSizeY - 1)),
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    device_type: deviceType
  };
}

/**
 * Get maximum number of grid points for a device type
 */
export function getMaxGridPoints(deviceType: string): number {
  const config = GDPR_GRID_CONFIG[deviceType];
  return config.maxGridSize * config.maxGridSize;
}

/**
 * Calculate cell size in pixels for a given viewport and device type
 */
export function calculateCellSize(viewportWidth: number, deviceType: string): number {
  const config = GDPR_GRID_CONFIG[deviceType];
  const gridSize = Math.min(config.maxGridSize, Math.floor(viewportWidth / config.minCellSize));
  return viewportWidth / gridSize;
}