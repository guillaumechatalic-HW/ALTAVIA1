import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Waypoint } from '../types/trail';
import { Layers, Maximize2, Compass, MapPin } from 'lucide-react';
import { STAGES_GPS_TRACKS } from '../data/trailGpsTracks';

interface LeafletTrailMapProps {
  waypoints: (Waypoint & { day: number; cumulativeKm: number })[];
  selectedDay: number | 'all';
  activeWaypoint: Waypoint | null;
  hoveredWaypoint: (Waypoint & { day?: number }) | null;
  onSelectWaypoint: (wp: Waypoint & { day: number; cumulativeKm: number }) => void;
  onSelectStage: (dayNumber: number) => void;
}

type MapLayerType = 'opentopo' | 'osm' | 'voyager';

export const LeafletTrailMap: React.FC<LeafletTrailMapProps> = ({
  waypoints,
  selectedDay,
  activeWaypoint,
  hoveredWaypoint,
  onSelectWaypoint,
  onSelectStage,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('opentopo');

  // Tile layer configurations
  const tileProviders = {
    opentopo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      maxZoom: 17,
    },
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
    voyager: {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around the middle of Alta Via 1 (Cortina / Civetta region)
    const map = L.map(mapContainerRef.current, {
      center: [46.46, 12.10],
      zoom: 10,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    // Add scale bar
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer
    const provider = tileProviders[currentLayer];
    const tiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tiles;

    // Layer groups for paths and markers
    polylinesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer when currentLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const provider = tileProviders[currentLayer];
    const newTiles = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTiles;
  }, [currentLayer]);

  // Update Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !polylinesLayerRef.current || !markersLayerRef.current) return;

    polylinesLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    // Group waypoints by day
    const stagesGroup: Record<number, (Waypoint & { day: number; cumulativeKm: number })[]> = {};
    waypoints.forEach((wp) => {
      if (wp.lat && wp.lng) {
        if (!stagesGroup[wp.day]) stagesGroup[wp.day] = [];
        stagesGroup[wp.day].push(wp);
      }
    });

    const allGpsPoints: L.LatLngExpression[] = [];

    // Draw lines for each day stage using high-resolution GPS tracks
    const allStageDays = [1, 2, 3, 4, 5, 6, 7, 8];
    allStageDays.forEach((dayNum) => {
      const isSelected = selectedDay === 'all' || selectedDay === dayNum;
      const trackPoints = STAGES_GPS_TRACKS[dayNum] || stagesGroup[dayNum]?.map((w) => [w.lat!, w.lng!] as [number, number]);
      if (!trackPoints || trackPoints.length === 0) return;

      const latLngs = trackPoints.map((pt) => [pt[0], pt[1]] as [number, number]);
      allGpsPoints.push(...latLngs);

      // Subtle underglow for contrast on topographic maps
      if (isSelected) {
        L.polyline(latLngs, {
          color: '#ffffff',
          weight: selectedDay === dayNum ? 5 : 4,
          opacity: 0.75,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(polylinesLayerRef.current!);
      }

      // Crisp main trail line (Fine width: 2.5px to 3.5px) following exact paths & switchbacks
      L.polyline(latLngs, {
        color: selectedDay === 'all'
          ? '#992200'
          : selectedDay === dayNum
          ? '#7c2000'
          : '#8c8c88',
        weight: selectedDay === dayNum ? 3.5 : 2.5,
        opacity: isSelected ? 0.95 : 0.4,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: !isSelected ? '3, 4' : undefined,
      }).addTo(polylinesLayerRef.current!);
    });

    // Draw markers
    waypoints.forEach((wp) => {
      if (!wp.lat || !wp.lng) return;

      const isCurrentActive = activeWaypoint?.id === wp.id;
      const isCurrentHovered = hoveredWaypoint?.id === wp.id;
      const isStart = wp.type === 'start';
      const isFinish = wp.type === 'finish';
      const isRefuge = wp.type === 'refuge';
      const isPassOrSummit = wp.type === 'pass' || wp.type === 'summit';
      const isHighlightDay = selectedDay === 'all' || selectedDay === wp.day;

      // Filter non-major waypoints if viewing all days to avoid clutter
      if (selectedDay === 'all' && !isStart && !isFinish && !isRefuge && !isPassOrSummit && !isCurrentActive) {
        return;
      }

      let markerBg = '#ffffff';
      let markerBorder = '#7c2000';
      let markerText = '';
      let markerSize = 10;

      if (isStart) {
        markerBg = '#173028';
        markerBorder = '#ffffff';
        markerText = `J${wp.day}`;
        markerSize = 20;
      } else if (isFinish) {
        markerBg = '#561300';
        markerBorder = '#ffffff';
        markerText = 'FIN';
        markerSize = 20;
      } else if (isRefuge) {
        markerBg = '#7c2000';
        markerBorder = '#ffffff';
        markerSize = 14;
      } else if (isPassOrSummit) {
        markerBg = '#c0392b';
        markerBorder = '#ffffff';
        markerSize = 12;
      }

      const activeGlow = isCurrentActive || isCurrentHovered
        ? 'ring-3 ring-[#173028] scale-125 z-50'
        : 'ring-1 ring-black/20';

      const customIcon = L.divIcon({
        className: 'custom-trail-marker',
        html: `
          <div style="
            width: ${markerSize}px;
            height: ${markerSize}px;
            background-color: ${markerBg};
            border: 2px solid ${markerBorder};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            font-size: ${markerSize > 16 ? '8px' : '0px'};
            font-weight: bold;
            color: white;
            opacity: ${isHighlightDay ? 1 : 0.45};
            transition: transform 0.15s ease-out;
          " class="${activeGlow}">
            ${markerText}
          </div>
        `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon });

      // Clean tooltip
      marker.bindTooltip(
        `
        <div style="font-family: 'Work Sans', sans-serif; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 700; color: #173028;">${wp.name}</div>
          <div style="color: #7c2000; font-size: 10px; font-family: monospace;">${wp.altitude} m • Jour ${wp.day}</div>
          ${wp.description ? `<div style="color: #5a605b; font-size: 9px; margin-top: 2px; max-width: 180px; white-space: normal;">${wp.description}</div>` : ''}
        </div>
        `,
        { direction: 'top', offset: [0, -markerSize / 2], opacity: 0.95 }
      );

      marker.on('click', () => {
        onSelectWaypoint(wp);
        if (wp.day) onSelectStage(wp.day);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // Fit map bounds smoothly
    if (selectedDay === 'all') {
      if (allGpsPoints.length > 0) {
        const bounds = L.latLngBounds(allGpsPoints);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
    } else {
      const trackPoints = STAGES_GPS_TRACKS[selectedDay] || stagesGroup[selectedDay]?.map((w) => [w.lat!, w.lng!] as [number, number]);
      if (trackPoints && trackPoints.length > 0) {
        const stageLatLngs = trackPoints.map((pt) => [pt[0], pt[1]] as [number, number]);
        const stageBounds = L.latLngBounds(stageLatLngs);
        map.flyToBounds(stageBounds, { padding: [45, 45], duration: 0.8, maxZoom: 14 });
      }
    }
  }, [waypoints, selectedDay, activeWaypoint, hoveredWaypoint]);

  // Center on hovered waypoint if set
  useEffect(() => {
    if (!mapInstanceRef.current || !hoveredWaypoint?.lat || !hoveredWaypoint?.lng) return;
    mapInstanceRef.current.panTo([hoveredWaypoint.lat, hoveredWaypoint.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [hoveredWaypoint]);

  // Reset to entire trail bounds
  const handleResetBounds = () => {
    if (!mapInstanceRef.current) return;
    const allGps = waypoints
      .filter((w) => w.lat && w.lng)
      .map((w) => [w.lat!, w.lng!] as [number, number]);
    if (allGps.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allGps), { padding: [30, 30] });
    }
  };

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-inner z-0">
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer Switcher & Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 font-ui">
        {/* Layer Selector */}
        <div className="bg-[#fbf9f4]/95 backdrop-blur-md px-2 py-1.5 rounded-lg border border-[#c2c8c4]/60 shadow-md flex items-center gap-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-[#173028]" />
          <div className="flex gap-1 text-[11px]">
            <button
              onClick={() => setCurrentLayer('opentopo')}
              className={`px-2 py-0.5 rounded transition-all ${
                currentLayer === 'opentopo'
                  ? 'bg-[#173028] text-white font-semibold shadow-xs'
                  : 'text-[#424845] hover:bg-[#eae8e3]'
              }`}
              title="Carte Topographique avec courbes de niveau"
            >
              Topo
            </button>
            <button
              onClick={() => setCurrentLayer('osm')}
              className={`px-2 py-0.5 rounded transition-all ${
                currentLayer === 'osm'
                  ? 'bg-[#173028] text-white font-semibold shadow-xs'
                  : 'text-[#424845] hover:bg-[#eae8e3]'
              }`}
              title="OpenStreetMap Standard"
            >
              OSM
            </button>
            <button
              onClick={() => setCurrentLayer('voyager')}
              className={`px-2 py-0.5 rounded transition-all ${
                currentLayer === 'voyager'
                  ? 'bg-[#173028] text-white font-semibold shadow-xs'
                  : 'text-[#424845] hover:bg-[#eae8e3]'
              }`}
              title="Relief Épuré Voyager"
            >
              Relief
            </button>
          </div>
        </div>

        {/* Reset bounds to full trail */}
        <button
          onClick={handleResetBounds}
          className="bg-[#fbf9f4]/95 hover:bg-white backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#c2c8c4]/60 shadow-md text-[11px] font-semibold text-[#173028] flex items-center gap-1.5 transition-all w-fit"
          title="Recentrer sur l'ensemble de l'Alta Via 1 (Braies ➔ Belluno)"
        >
          <Maximize2 className="w-3 h-3 text-[#7c2000]" />
          <span>Vue complète (120 km)</span>
        </button>
      </div>

      {/* Discrete Topographic Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-[#fbf9f4]/95 backdrop-blur-md px-3 py-2 rounded-lg border border-[#c2c8c4]/60 shadow-md font-ui text-[10px] text-[#424845] flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#173028] border border-white inline-block" />
          <span>Départs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7c2000] border border-white inline-block" />
          <span>Refuges</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#c0392b] border border-white inline-block" />
          <span>Cols / Sommets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#992200] inline-block" />
          <span>Tracé Alta Via 1</span>
        </div>
      </div>
    </div>
  );
};
