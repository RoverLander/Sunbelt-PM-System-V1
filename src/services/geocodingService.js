// ============================================================================
// geocodingService.js - Mapbox Geocoding for Project Locations
// ============================================================================
// Converts delivery city/state to lat/lng coordinates for map visualization
// Uses Mapbox Geocoding API with caching to minimize API calls
// ============================================================================

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * Geocode a location (city, state) to lat/lng coordinates
 * @param {string} city - City name
 * @param {string} state - State code (e.g., "CA", "TX")
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeLocation(city, state) {
  if (!city || !state) return null;
  if (!MAPBOX_TOKEN) {
    console.error('VITE_MAPBOX_TOKEN not set - cannot geocode');
    return null;
  }

  try {
    const query = encodeURIComponent(`${city}, ${state}, USA`);
    const url = `${GEOCODING_API}/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding failed for ${city}, ${state}:`, error);
    return null;
  }
}

/**
 * Geocode multiple locations in batch (with rate limiting)
 * @param {Array<{city: string, state: string}>} locations
 * @returns {Promise<Array<{lat: number, lng: number} | null>>}
 */
export async function geocodeLocationsBatch(locations) {
  const results = [];
  
  for (const loc of locations) {
    const coords = await geocodeLocation(loc.city, loc.state);
    results.push(coords);
    
    // Rate limit: 600 requests/minute = ~100ms between requests
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  return results;
}

/**
 * Geocode a project's delivery location
 * @param {Object} project - Project with delivery_city and delivery_state
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeProject(project) {
  if (!project.delivery_city || !project.delivery_state) return null;
  return geocodeLocation(project.delivery_city, project.delivery_state);
}

export default {
  geocodeLocation,
  geocodeLocationsBatch,
  geocodeProject
};
