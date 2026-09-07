'use client';

import React, { useEffect, useRef } from 'react';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  type?: 'pickup' | 'drop' | 'transporter' | 'farmer';
  popupText?: string;
}

interface OpenStreetMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routeCoordinates?: [number, number][];
  height?: string | number;
  className?: string;
}

export default function OpenStreetMap({
  center = [20.5937, 78.9629],
  zoom = 6,
  markers = [],
  routeCoordinates = [],
  height = 360,
  className = '',
}: OpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map instance if not yet created
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Add OpenStreetMap Free Carto/OSM Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = layerGroup;
      }

      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;

      if (!layerGroup) return;

      // Clear existing markers/lines
      layerGroup.clearLayers();

      const validLatLngs: [number, number][] = [];

      // Add custom HTML DivIcon markers
      markers.forEach((m) => {
        if (!m.lat || !m.lng || isNaN(m.lat) || isNaN(m.lng)) return;

        validLatLngs.push([m.lat, m.lng]);

        let color = '#52A352'; // default green
        let iconSymbol = '📍';

        if (m.type === 'pickup' || m.type === 'farmer') {
          color = '#2ECC71';
          iconSymbol = '🌾';
        } else if (m.type === 'drop') {
          color = '#E67E22';
          iconSymbol = '🏁';
        } else if (m.type === 'transporter') {
          color = '#3498DB';
          iconSymbol = '🚛';
        }

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="
              background: ${color};
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              border: 2px solid #ffffff;
              transform: translate(-50%, -50%);
            ">
              ${iconSymbol}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(layerGroup);

        if (m.popupText || m.label) {
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 13px; color: #111; padding: 4px;">
              <strong>${m.label || (m.type === 'pickup' ? 'Farm Pickup' : 'Delivery Drop')}</strong>
              ${m.popupText ? `<p style="margin: 4px 0 0 0; color: #444;">${m.popupText}</p>` : ''}
              <div style="font-size: 11px; color: #777; margin-top: 4px;">Lat: ${m.lat.toFixed(4)}, Lng: ${m.lng.toFixed(4)}</div>
            </div>
          `);
        }
      });

      // Draw route polyline if coordinates provided
      const routePoints: [number, number][] = routeCoordinates.length > 0
        ? routeCoordinates.filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
        : validLatLngs;

      if (routePoints.length > 1) {
        L.polyline(routePoints, {
          color: '#F1C40F',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          lineCap: 'round',
        }).addTo(layerGroup);
      }

      // Auto fit bounds
      if (validLatLngs.length > 0) {
        const bounds = L.latLngBounds(validLatLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (center) {
        map.setView(center, zoom);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [center, zoom, markers, routeCoordinates]);

  // Clean up map on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: '100%',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
        position: 'relative',
        zIndex: 1,
      }}
      className={`glass ${className}`}
    >
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
