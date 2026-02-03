// ============================================================================
// geocodeProjects.js - One-time script to geocode existing projects
// ============================================================================
// Run this once to populate delivery_lat/delivery_lng for all projects
// ============================================================================

import { supabase } from './supabaseClient.js';
import { geocodeLocation } from '../services/geocodingService.js';

async function geocodeAllProjects() {
  console.log('🗺️  Starting project geocoding...');
  
  // Get all projects with delivery location but no coordinates
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, delivery_city, delivery_state, delivery_lat, delivery_lng')
    .not('delivery_city', 'is', null)
    .not('delivery_state', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch projects:', error);
    return;
  }

  console.log(`📋 Found ${projects.length} projects with delivery locations`);
  
  // Filter to only ungecoded projects
  const needsGeocoding = projects.filter(p => !p.delivery_lat || !p.delivery_lng);
  console.log(`🔍 ${needsGeocoding.length} projects need geocoding`);

  let geocoded = 0;
  let failed = 0;

  for (const project of needsGeocoding) {
    try {
      const coords = await geocodeLocation(project.delivery_city, project.delivery_state);
      
      if (coords) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            delivery_lat: coords.lat,
            delivery_lng: coords.lng,
            geocoded_at: new Date().toISOString()
          })
          .eq('id', project.id);

        if (updateError) {
          console.error(`❌ Failed to update ${project.name}:`, updateError);
          failed++;
        } else {
          geocoded++;
          console.log(`✅ ${geocoded}/${needsGeocoding.length} - ${project.name} (${project.delivery_city}, ${project.delivery_state})`);
        }
      } else {
        console.warn(`⚠️  Could not geocode: ${project.delivery_city}, ${project.delivery_state}`);
        failed++;
      }

      // Rate limit: 150ms between requests
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (err) {
      console.error(`❌ Error geocoding ${project.name}:`, err);
      failed++;
    }
  }

  console.log(`\n✅ Geocoding complete!`);
  console.log(`   Geocoded: ${geocoded}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Already had coords: ${projects.length - needsGeocoding.length}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  geocodeAllProjects();
}

export default geocodeAllProjects;
