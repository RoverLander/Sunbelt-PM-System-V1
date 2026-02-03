// ============================================================================
// RouteLayer.js - Arc routes from factories to project sites
// ============================================================================
// Renders curved lines connecting factories to active project delivery locations
// Orange glow for active deliveries, muted for completed projects
// ============================================================================

/**
 * Generate curved arc coordinates for a route
 * Creates a "rocket launch" style arc from start to end point
 */
export function generateArcCoordinates(start, end, numPoints = 50) {
  const [startLng, startLat] = start;
  const [endLng, endLat] = end;
  
  // Calculate midpoint and arc height based on distance
  const distance = Math.sqrt(
    Math.pow(endLng - startLng, 2) + Math.pow(endLat - startLat, 2)
  );
  
  // Arc height proportional to distance (higher arc for longer routes)
  const arcHeight = distance * 0.3;
  
  const coordinates = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Linear interpolation for x
    const lng = startLng + (endLng - startLng) * t;
    
    // Parabolic arc for y (simulates rocket path)
    const baseLatinterpolation = startLat + (endLat - startLat) * t;
    const arcOffset = 4 * arcHeight * t * (1 - t); // Peak at t=0.5
    const lat = baseLatinterpolation + arcOffset;
    
    coordinates.push([lng, lat]);
  }
  
  return coordinates;
}

/**
 * Add route layers to Mapbox map
 */
export function addRouteLayer(map, routes, isActive = false) {
  const layerId = isActive ? 'active-routes' : 'completed-routes';
  const lineColor = isActive ? '#f97316' : '#64748b'; // Orange vs gray
  const lineWidth = isActive ? 2 : 1;
  
  // Add source
  map.addSource(layerId, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: routes.map(route => ({
        type: 'Feature',
        properties: {
          projectId: route.projectId,
          projectName: route.projectName,
          factory: route.factory
        },
        geometry: {
          type: 'LineString',
          coordinates: generateArcCoordinates(
            route.start,
            route.end
          )
        }
      }))
    }
  });
  
  // Add line layer
  map.addLayer({
    id: layerId,
    type: 'line',
    source: layerId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth,
      'line-opacity': isActive ? 0.8 : 0.4
    }
  });
  
  // Add glow layer for active routes
  if (isActive) {
    map.addLayer({
      id: `${layerId}-glow`,
      type: 'line',
      source: layerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': lineColor,
        'line-width': 6,
        'line-blur': 4,
        'line-opacity': 0.4
      }
    });
  }
}

/**
 * Update routes on map
 */
export function updateRoutes(map, routes) {
  const activeRoutes = routes.filter(r => r.status === 'Shipping' || r.status === 'In Progress');
  const completedRoutes = routes.filter(r => r.status === 'Completed' || r.status === 'Installation');
  
  // Update active routes
  if (map.getSource('active-routes')) {
    map.getSource('active-routes').setData({
      type: 'FeatureCollection',
      features: activeRoutes.map(route => ({
        type: 'Feature',
        properties: {
          projectId: route.projectId,
          projectName: route.projectName,
          factory: route.factory
        },
        geometry: {
          type: 'LineString',
          coordinates: generateArcCoordinates(route.start, route.end)
        }
      }))
    });
  }
  
  // Update completed routes  
  if (map.getSource('completed-routes')) {
    map.getSource('completed-routes').setData({
      type: 'FeatureCollection',
      features: completedRoutes.map(route => ({
        type: 'Feature',
        properties: {
          projectId: route.projectId,
          projectName: route.projectName,
          factory: route.factory
        },
        geometry: {
          type: 'LineString',
          coordinates: generateArcCoordinates(route.start, route.end)
        }
      }))
    });
  }
}

export default {
  generateArcCoordinates,
  addRouteLayer,
  updateRoutes
};
