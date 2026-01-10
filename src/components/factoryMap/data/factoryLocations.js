// Factory locations with map coordinates (percentage-based 0-100)
// Coordinates roughly match US geography

export const FACTORY_LOCATIONS = {
  'NWBS': {
    x: 12, y: 12,
    name: 'Northwest Building Systems',
    fullName: 'NWBS - Northwest Building Systems',
    state: 'WA',
    city: 'Tacoma',
    region: 'pacificNorthwest'
  },
  'BRIT': {
    x: 15, y: 8,
    name: 'Britco',
    fullName: 'BRIT - Britco',
    state: 'WA',
    city: 'Ferndale',
    region: 'pacificNorthwest'
  },
  'WM-WEST': {
    x: 8, y: 38,
    name: 'Whitley Manufacturing West',
    fullName: 'WM-WEST - Whitley Manufacturing West',
    state: 'CA',
    city: 'Stockton',
    region: 'california'
  },
  'MM': {
    x: 6, y: 42,
    name: 'Mobile Modular',
    fullName: 'MM - Mobile Modular',
    state: 'CA',
    city: 'Livermore',
    region: 'california'
  },
  'PMI': {
    x: 10, y: 58,
    name: 'Palomar Modular',
    fullName: 'PMI - Palomar Modular',
    state: 'CA',
    city: 'San Marcos',
    region: 'california'
  },
  'SSI': {
    x: 38, y: 72,
    name: 'Sunbelt Structures',
    fullName: 'SSI - Sunbelt Structures',
    state: 'TX',
    city: 'Waco',
    region: 'texas'
  },
  'AMTEX': {
    x: 42, y: 68,
    name: 'AmTex Modular',
    fullName: 'AMTEX - AmTex Modular',
    state: 'TX',
    city: 'Dallas',
    region: 'texas'
  },
  'MRS': {
    x: 55, y: 48,
    name: 'Mr. Steel',
    fullName: 'MRS - Mr. Steel',
    state: 'MO',
    city: 'Springfield',
    region: 'midwest'
  },
  'CB': {
    x: 62, y: 52,
    name: 'C&B Modular',
    fullName: 'CB - C&B Modular',
    state: 'TN',
    city: 'Nashville',
    region: 'southeast'
  },
  'IND': {
    x: 68, y: 42,
    name: 'Indicom',
    fullName: 'IND - Indicom',
    state: 'OH',
    city: 'Columbus',
    region: 'midwest'
  },
  'SEMO': {
    x: 75, y: 58,
    name: 'Southeast Modular',
    fullName: 'SEMO - Southeast Modular',
    state: 'GA',
    city: 'Atlanta',
    region: 'southeast'
  },
  'WM-EAST': {
    x: 82, y: 48,
    name: 'Whitley Manufacturing East',
    fullName: 'WM-EAST - Whitley Manufacturing East',
    state: 'NC',
    city: 'Statesville',
    region: 'southeast'
  },
  'MS': {
    x: 85, y: 38,
    name: 'ModSpace',
    fullName: 'MS - ModSpace',
    state: 'PA',
    city: 'Berwick',
    region: 'northeast'
  },
  'MG': {
    x: 82, y: 42,
    name: 'Modular Genius',
    fullName: 'MG - Modular Genius',
    state: 'MD',
    city: 'Hagerstown',
    region: 'northeast'
  }
};

// Region definitions with boundaries and visual properties
export const REGION_CONFIG = {
  pacificNorthwest: {
    bounds: { x1: 0, y1: 0, x2: 25, y2: 30 },
    color: '#1a3d2e',
    accentColor: '#2d5a3f'
  },
  california: {
    bounds: { x1: 0, y1: 30, x2: 18, y2: 65 },
    color: '#8b7355',
    accentColor: '#a08060'
  },
  southwest: {
    bounds: { x1: 18, y1: 45, x2: 35, y2: 75 },
    color: '#c4956a',
    accentColor: '#d4a070'
  },
  texas: {
    bounds: { x1: 35, y1: 55, x2: 55, y2: 85 },
    color: '#8a7a55',
    accentColor: '#9a8a60'
  },
  midwest: {
    bounds: { x1: 45, y1: 30, x2: 75, y2: 55 },
    color: '#5a7a45',
    accentColor: '#6a8a50'
  },
  southeast: {
    bounds: { x1: 55, y1: 50, x2: 88, y2: 75 },
    color: '#4a6a40',
    accentColor: '#5a7a4a'
  },
  northeast: {
    bounds: { x1: 70, y1: 25, x2: 100, y2: 50 },
    color: '#4a5a45',
    accentColor: '#5a6a50'
  }
};

// US state center coordinates for job site placement
export const STATE_COORDINATES = {
  'AL': { x: 68, y: 62 },
  'AK': { x: 15, y: 85 },
  'AZ': { x: 22, y: 55 },
  'AR': { x: 55, y: 58 },
  'CA': { x: 8, y: 45 },
  'CO': { x: 32, y: 45 },
  'CT': { x: 90, y: 35 },
  'DE': { x: 88, y: 40 },
  'FL': { x: 78, y: 72 },
  'GA': { x: 75, y: 60 },
  'HI': { x: 25, y: 90 },
  'ID': { x: 18, y: 25 },
  'IL': { x: 62, y: 42 },
  'IN': { x: 66, y: 42 },
  'IA': { x: 55, y: 38 },
  'KS': { x: 45, y: 48 },
  'KY': { x: 68, y: 48 },
  'LA': { x: 55, y: 68 },
  'ME': { x: 95, y: 20 },
  'MD': { x: 84, y: 42 },
  'MA': { x: 92, y: 32 },
  'MI': { x: 68, y: 32 },
  'MN': { x: 52, y: 28 },
  'MS': { x: 62, y: 62 },
  'MO': { x: 55, y: 48 },
  'MT': { x: 25, y: 20 },
  'NE': { x: 42, y: 40 },
  'NV': { x: 15, y: 40 },
  'NH': { x: 92, y: 28 },
  'NJ': { x: 88, y: 38 },
  'NM': { x: 28, y: 55 },
  'NY': { x: 85, y: 32 },
  'NC': { x: 80, y: 52 },
  'ND': { x: 42, y: 22 },
  'OH': { x: 72, y: 42 },
  'OK': { x: 45, y: 55 },
  'OR': { x: 12, y: 22 },
  'PA': { x: 82, y: 38 },
  'RI': { x: 92, y: 34 },
  'SC': { x: 78, y: 56 },
  'SD': { x: 42, y: 28 },
  'TN': { x: 68, y: 52 },
  'TX': { x: 40, y: 65 },
  'UT': { x: 22, y: 42 },
  'VT': { x: 90, y: 25 },
  'VA': { x: 80, y: 45 },
  'WA': { x: 12, y: 12 },
  'WV': { x: 76, y: 45 },
  'WI': { x: 60, y: 30 },
  'WY': { x: 28, y: 32 }
};

// Convert percentage coords to pixel coords
export const getPixelPosition = (factoryCode, mapWidth, mapHeight) => {
  const loc = FACTORY_LOCATIONS[factoryCode];
  if (!loc) return null;
  return {
    x: (loc.x / 100) * mapWidth,
    y: (loc.y / 100) * mapHeight
  };
};

// Simple hash function for deterministic jitter
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

// Seeded pseudo-random number generator
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get state pixel position with optional seed for consistent positioning
export const getStatePixelPosition = (stateCode, mapWidth, mapHeight, seed = null) => {
  const coords = STATE_COORDINATES[stateCode];
  if (!coords) return null;

  // Use deterministic jitter based on seed (e.g., project ID) for consistency
  // This ensures the same project always appears in the same position
  let jitterX = 0;
  let jitterY = 0;

  if (seed !== null) {
    const hash = hashCode(String(seed) + stateCode);
    jitterX = (seededRandom(hash) - 0.5) * 3;
    jitterY = (seededRandom(hash + 1) - 0.5) * 3;
  }

  return {
    x: ((coords.x + jitterX) / 100) * mapWidth,
    y: ((coords.y + jitterY) / 100) * mapHeight
  };
};

// Get region for a coordinate
export const getRegionAt = (percentX, percentY) => {
  for (const [region, config] of Object.entries(REGION_CONFIG)) {
    const { bounds } = config;
    if (percentX >= bounds.x1 && percentX <= bounds.x2 &&
        percentY >= bounds.y1 && percentY <= bounds.y2) {
      return region;
    }
  }
  return 'midwest'; // Default fallback
};

// Get all factories as array
export const getFactoriesArray = () => {
  return Object.entries(FACTORY_LOCATIONS).map(([code, data]) => ({
    code,
    ...data
  }));
};
