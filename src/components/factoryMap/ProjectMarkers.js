// ============================================================================
// ProjectMarkers.js - Project delivery location markers
// ============================================================================
// Blue markers showing project delivery sites with status-based colors
// Click to show project details popup
// ============================================================================

/**
 * Get marker color based on project status
 */
export function getMarkerColor(status) {
  const colors = {
    'Planning': '#60a5fa',        // Light blue
    'In Progress': '#3b82f6',     // Medium blue
    'Production': '#2563eb',      // Dark blue
    'Shipping': '#f97316',        // Orange (active delivery)
    'Installation': '#10b981',    // Green
    'Completed': '#6b7280',       // Gray
  };
  
  return colors[status] || '#3b82f6'; // Default blue
}

/**
 * Add project markers to map
 */
export function addProjectMarkers(map, projects) {
  // Filter projects with coordinates
  const projectsWithCoords = projects.filter(p => p.delivery_lat && p.delivery_lng);
  
  // Add source
  map.addSource('projects', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: projectsWithCoords.map(project => ({
        type: 'Feature',
        properties: {
          id: project.id,
          name: project.name,
          project_number: project.project_number,
          status: project.status,
          delivery_city: project.delivery_city,
          delivery_state: project.delivery_state,
          factory: project.factory
        },
        geometry: {
          type: 'Point',
          coordinates: [project.delivery_lng, project.delivery_lat]
        }
      }))
    }
  });
  
  // Add circle layer
  map.addLayer({
    id: 'project-markers',
    type: 'circle',
    source: 'projects',
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'status'], 'Shipping'], 8,  // Larger for active
        6
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'Planning', '#60a5fa',
        'In Progress', '#3b82f6',
        'Production', '#2563eb',
        'Shipping', '#f97316',
        'Installation', '#10b981',
        'Completed', '#6b7280',
        '#3b82f6' // default
      ],
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.9
    }
  });
  
  // Add hover effect
  map.on('mouseenter', 'project-markers', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'project-markers', () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Update project markers
 */
export function updateProjectMarkers(map, projects) {
  const projectsWithCoords = projects.filter(p => p.delivery_lat && p.delivery_lng);
  
  if (map.getSource('projects')) {
    map.getSource('projects').setData({
      type: 'FeatureCollection',
      features: projectsWithCoords.map(project => ({
        type: 'Feature',
        properties: {
          id: project.id,
          name: project.name,
          project_number: project.project_number,
          status: project.status,
          delivery_city: project.delivery_city,
          delivery_state: project.delivery_state,
          factory: project.factory
        },
        geometry: {
          type: 'Point',
          coordinates: [project.delivery_lng, project.delivery_lat]
        }
      }))
    });
  }
}

/**
 * Create popup HTML for project details
 */
export function createProjectPopup(project) {
  return `
    <div style="font-family: var(--font-ui); padding: 8px;">
      <div style="font-weight: 600; color: var(--sunbelt-orange); margin-bottom: 4px;">
        ${project.project_number || 'No PM#'}
      </div>
      <div style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 8px;">
        ${project.name}
      </div>
      <div style="font-size: 0.8rem; color: var(--text-secondary);">
        <div><strong>Location:</strong> ${project.delivery_city}, ${project.delivery_state}</div>
        <div><strong>Factory:</strong> ${project.factory}</div>
        <div><strong>Status:</strong> <span style="color: ${getMarkerColor(project.status)};">${project.status}</span></div>
      </div>
    </div>
  `;
}

export default {
  getMarkerColor,
  addProjectMarkers,
  updateProjectMarkers,
  createProjectPopup
};
