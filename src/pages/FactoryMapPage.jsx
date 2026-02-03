// ============================================================================
// FactoryMapPage - Interactive factory location map with project routes
// ============================================================================
// Uses Mapbox GL JS with dark theme to visualize Sunbelt Modular factory
// locations and optionally show routes from factories to project sites.
//
// Inspired by: https://peaceandquiet.io/
// Created: 2026-02-03
// Ported to Sunbelt PM System: 2026-02-04
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// ============================================================================
// FACTORY COORDINATES (Hardcoded - geocoded via Nominatim)
// ============================================================================

const FACTORIES = [
  {
    code: 'SNB',
    name: 'Sunbelt Modular (Corporate HQ)',
    location: 'Phoenix, AZ',
    coordinates: [-112.074141, 33.4484367],
    lat: 33.4484367,
    lng: -112.074141,
  },
  {
    code: 'AMT',
    name: 'AmTex Corporation',
    location: 'Garland, TX',
    coordinates: [-96.6388833, 32.912624],
    lat: 32.912624,
    lng: -96.6388833,
  },
  {
    code: 'BUSA',
    name: 'BritCo USA',
    location: 'Teague, TX',
    coordinates: [-96.2838621, 31.6271145],
    lat: 31.6271145,
    lng: -96.2838621,
  },
  {
    code: 'C&B',
    name: 'C&B Modular',
    location: 'Bristol, IN',
    coordinates: [-85.8175361, 41.7214415],
    lat: 41.7214415,
    lng: -85.8175361,
  },
  {
    code: 'IBI',
    name: 'IBI (Indicom Buildings)',
    location: 'Burleson, TX',
    coordinates: [-96.6353488, 30.4764878],
    lat: 30.4764878,
    lng: -96.6353488,
  },
  {
    code: 'MRS',
    name: 'MRS',
    location: 'Phoenix, AZ',
    coordinates: [-112.074141, 33.4484367],
    lat: 33.4484367,
    lng: -112.074141,
  },
  {
    code: 'NWBS',
    name: 'Northwest Building Systems',
    location: 'Boise, ID',
    coordinates: [-116.200886, 43.6166163],
    lat: 43.6166163,
    lng: -116.200886,
  },
  {
    code: 'PMI',
    name: 'PMI (Phoenix Modular Inc)',
    location: 'Phoenix, AZ',
    coordinates: [-112.074141, 33.4484367],
    lat: 33.4484367,
    lng: -112.074141,
  },
  {
    code: 'SMM',
    name: 'SMM',
    location: 'Leesburg, FL',
    coordinates: [-81.8778582, 28.810823],
    lat: 28.810823,
    lng: -81.8778582,
  },
  {
    code: 'SSI',
    name: 'SSI',
    location: 'Willacoochee, GA',
    coordinates: [-83.0459826, 31.3407551],
    lat: 31.3407551,
    lng: -83.0459826,
  },
  {
    code: 'WM-EAST',
    name: 'Whitley Manufacturing - East',
    location: 'Leola, PA',
    coordinates: [-76.1849534, 40.087875],
    lat: 40.087875,
    lng: -76.1849534,
  },
  {
    code: 'WM-EVERGREEN',
    name: 'Whitley Manufacturing - Evergreen',
    location: 'Marysville, WA',
    coordinates: [-122.1768209, 48.0517429],
    lat: 48.0517429,
    lng: -122.1768209,
  },
  {
    code: 'WM-ROCHESTER',
    name: 'Whitley Manufacturing - Rochester',
    location: 'Rochester, IN',
    coordinates: [-86.2159959, 41.0648846],
    lat: 41.0648846,
    lng: -86.2159959,
  },
  {
    code: 'WM-SOUTH',
    name: 'Whitley Manufacturing - South',
    location: 'South Whitley, IN',
    coordinates: [-85.6280381, 41.0847677],
    lat: 41.0847677,
    lng: -85.6280381,
  },
  {
    code: 'PRM',
    name: 'ProMod Manufacturing',
    location: 'Ellaville, GA',
    coordinates: [-84.3089928, 32.2379098],
    lat: 32.2379098,
    lng: -84.3089928,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function FactoryMapPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);

  // Check for Mapbox token
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const hasToken = Boolean(mapboxToken);

  // DEBUG: Log token status
  console.log('🗺️ FactoryMapPage render', {
    hasToken,
    tokenLength: mapboxToken?.length,
    tokenPrefix: mapboxToken?.substring(0, 10),
    mapContainerExists: Boolean(mapContainer.current),
  });

  useEffect(() => {
    console.log('🗺️ useEffect running', { hasToken, mapCurrentExists: Boolean(map.current) });
    
    if (!hasToken) {
      console.error('❌ No Mapbox token - showing fallback');
      return;
    }
    
    if (map.current) {
      console.log('✅ Map already initialized, skipping');
      return;
    }

    if (!mapContainer.current) {
      console.error('❌ Map container ref is null!');
      return;
    }

    console.log('🚀 Initializing Mapbox map...');
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme like peaceandquiet.io
      center: [-98, 38], // Center of US
      zoom: 4,
      attributionControl: false, // Custom attribution in footer
    });

    map.current.on('load', () => {
      console.log('✅ Map loaded successfully!');
      setMapLoaded(true);

      // Add factory markers
      FACTORIES.forEach((factory) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'factory-marker';
        el.innerHTML = `
          <div style="
            background: var(--sunbelt-orange);
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 8px rgba(245, 166, 35, 0.6);
            cursor: pointer;
          "></div>
        `;

        el.addEventListener('click', () => {
          setSelectedFactory(factory);
          map.current.flyTo({
            center: factory.coordinates,
            zoom: 8,
            essential: true,
          });
        });

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div style="color: var(--text-primary); font-family: var(--font-ui);">
            <strong style="color: var(--sunbelt-orange);">${factory.code}</strong><br/>
            ${factory.name}<br/>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${factory.location}</span>
          </div>
        `);

        new mapboxgl.Marker(el).setLngLat(factory.coordinates).setPopup(popup).addTo(map.current);
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });

    map.current.on('error', (e) => {
      console.error('❌ Map error:', e);
    });

    console.log('✅ Map instance created, waiting for load event...');

    return () => {
      console.log('🧹 Cleaning up map');
      if (map.current) {
        map.current.remove();
        map.current = null; // Reset ref for strict mode re-mount
      }
    };
  }, []); // Only run once on mount

  // Fly to all factories (fit bounds)
  const fitAllFactories = () => {
    if (!map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    FACTORIES.forEach((f) => bounds.extend(f.coordinates));

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 6,
    });

    setSelectedFactory(null);
  };

  if (!hasToken) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary)',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <MapPin size={48} color="var(--sunbelt-orange)" />
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Mapbox Token Required</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', textAlign: 'center' }}>
          To display the factory map, add your Mapbox access token to <code>.env</code>:
        </p>
        <pre
          style={{
            background: 'var(--bg-secondary)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}
        >
          VITE_MAPBOX_TOKEN=your_token_here
        </pre>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Get a free token at{' '}
          <a
            href="https://account.mapbox.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--sunbelt-orange)' }}
          >
            account.mapbox.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Map Container */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      {/* Factory List Sidebar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '280px',
          maxHeight: 'calc(100vh - 32px)',
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px',
          overflowY: 'auto',
          backdropFilter: 'blur(8px)',
        }}
      >
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '1rem' }}>
          Factory Locations
        </h3>
        <button
          onClick={fitAllFactories}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center',
          }}
        >
          <Maximize2 size={14} />
          Show All Factories
        </button>

        {FACTORIES.map((factory) => (
          <div
            key={factory.code}
            onClick={() => {
              setSelectedFactory(factory);
              map.current?.flyTo({
                center: factory.coordinates,
                zoom: 8,
              });
            }}
            style={{
              padding: '10px',
              background:
                selectedFactory?.code === factory.code ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
              border: '1px solid',
              borderColor:
                selectedFactory?.code === factory.code
                  ? 'var(--sunbelt-orange)'
                  : 'var(--border-color)',
              borderRadius: '6px',
              marginBottom: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => {
              if (selectedFactory?.code !== factory.code) {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedFactory?.code !== factory.code) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <MapPin size={14} color="var(--sunbelt-orange)" />
              <span
                style={{
                  color: 'var(--sunbelt-orange)',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                }}
              >
                {factory.code}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              {factory.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {factory.location}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Attribution */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(17, 24, 39, 0.8)',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
        }}
      >
        Map by{' '}
        <a
          href="https://www.mapbox.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--sunbelt-orange)' }}
        >
          Mapbox
        </a>{' '}
        • Data by{' '}
        <a
          href="https://www.openstreetmap.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--sunbelt-orange)' }}
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}

export default FactoryMapPage;
