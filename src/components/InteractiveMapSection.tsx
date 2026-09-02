import { useState, useMemo } from 'react';
import { STAGES } from '../data/stagesData';
import { Waypoint, Stage } from '../types/trail';
import { MapPin, Mountain, Compass, ChevronRight, Layers } from 'lucide-react';
import { LeafletTrailMap } from './LeafletTrailMap';
import { StageElevationProfile } from './StageElevationProfile';

interface InteractiveMapSectionProps {
  onSelectStage: (dayNumber: number) => void;
  highlightedDay?: number;
}

export const InteractiveMapSection = ({
  onSelectStage,
  highlightedDay,
}: InteractiveMapSectionProps) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>(highlightedDay || 'all');
  const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(
    STAGES[0].waypoints[0]
  );
  const [hoveredWaypoint, setHoveredWaypoint] = useState<(Waypoint & { cumulativeKm?: number; day?: number }) | null>(null);

  // Compute stage cumulative distances
  const stageStarts = useMemo(() => {
    let acc = 0;
    const starts: Record<number, number> = {};
    STAGES.forEach((s) => {
      starts[s.day] = acc;
      acc += s.distanceKm;
    });
    return starts;
  }, []);

  const totalTrailDistance = useMemo(() => {
    return Math.round(STAGES.reduce((sum, s) => sum + s.distanceKm, 0) * 10) / 10;
  }, []);

  const totalElevationGain = useMemo(() => {
    return STAGES.reduce((sum, s) => sum + s.elevationGainM, 0);
  }, []);

  const totalElevationLoss = useMemo(() => {
    return STAGES.reduce((sum, s) => sum + s.elevationLossM, 0);
  }, []);

  const highestPoint = useMemo(() => {
    return Math.max(...STAGES.map((s) => s.highestPointM));
  }, []);

  // Gather all waypoints with exact cumulative Km across the entire trek
  const allWaypointsWithCumulative = useMemo(() => {
    return STAGES.flatMap((stage) => {
      const stageStartKm = stageStarts[stage.day] || 0;
      return stage.waypoints.map((wp) => ({
        ...wp,
        day: stage.day,
        stageTitle: stage.title,
        stageDistance: stage.distanceKm,
        cumulativeKm: Math.round((stageStartKm + wp.distanceFromStart) * 10) / 10,
      }));
    });
  }, [stageStarts]);

  const displayedWaypoints = useMemo(() => {
    return selectedDayFilter === 'all'
      ? allWaypointsWithCumulative
      : allWaypointsWithCumulative.filter((wp) => wp.day === selectedDayFilter);
  }, [selectedDayFilter, allWaypointsWithCumulative]);

  const currentDisplayWp = hoveredWaypoint || activeWaypoint || allWaypointsWithCumulative[0];

  // Active stage for single-stage elevation view
  const currentStage = useMemo(() => {
    if (selectedDayFilter === 'all') return null;
    return STAGES.find((s) => s.day === selectedDayFilter) || null;
  }, [selectedDayFilter]);

  // Global 8-Day Elevation Profile Computation with Mountain Silhouette Style
  const globalProfileComputed = useMemo(() => {
    const svgWidth = 1000;
    const svgHeight = 380;
    const chartLeft = 75;
    const chartRight = 910;
    const chartTop = 85;
    const chartBottom = 310;
    const chartW = chartRight - chartLeft;
    const chartH = chartBottom - chartTop;

    const minAlt = 300;
    const maxAlt = 2900;
    const gridLevels = [500, 1000, 1500, 2000, 2500];
    const totalKm = totalTrailDistance;

    // Map all waypoints to SVG coordinates
    const mappedWps = allWaypointsWithCumulative.map((wp) => {
      const x = chartLeft + (wp.cumulativeKm / totalKm) * chartW;
      const altNorm = (wp.altitude - minAlt) / (maxAlt - minAlt);
      const y = chartBottom - altNorm * chartH;
      return {
        ...wp,
        svgX: Math.max(chartLeft, Math.min(chartRight, x)),
        svgY: Math.max(chartTop, Math.min(chartBottom, y)),
      };
    });

    // Dense interpolation for realistic mountain ridges
    const densePoints: { x: number; y: number; km: number; alt: number }[] = [];
    for (let i = 0; i < mappedWps.length; i++) {
      const curr = mappedWps[i];
      densePoints.push({
        x: curr.svgX,
        y: curr.svgY,
        km: curr.cumulativeKm,
        alt: curr.altitude,
      });

      if (i < mappedWps.length - 1) {
        const next = mappedWps[i + 1];
        const distDiff = next.cumulativeKm - curr.cumulativeKm;
        const steps = Math.max(2, Math.min(8, Math.round(distDiff * 2)));

        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const interpKm = curr.cumulativeKm + t * distDiff;
          const interpAlt = curr.altitude + t * (next.altitude - curr.altitude);
          const variance = Math.sin(t * Math.PI) * (distDiff > 3 ? (i % 2 === 0 ? 10 : -7) : 0);
          const finalAlt = Math.max(minAlt, Math.min(maxAlt, interpAlt + variance));

          const x = chartLeft + (interpKm / totalKm) * chartW;
          const altNorm = (finalAlt - minAlt) / (maxAlt - minAlt);
          const y = chartBottom - altNorm * chartH;

          densePoints.push({
            x: Math.max(chartLeft, Math.min(chartRight, x)),
            y: Math.max(chartTop, Math.min(chartBottom, y)),
            km: interpKm,
            alt: finalAlt,
          });
        }
      }
    }

    let path = `M ${densePoints[0]?.x.toFixed(1) || chartLeft},${densePoints[0]?.y.toFixed(1) || chartBottom}`;
    for (let i = 1; i < densePoints.length; i++) {
      path += ` L ${densePoints[i].x.toFixed(1)},${densePoints[i].y.toFixed(1)}`;
    }
    const area = `${path} L ${chartRight},${chartBottom} L ${chartLeft},${chartBottom} Z`;

    // Extract ONLY the end-of-stage refuges (and initial start)
    const endOfStagePoints: typeof mappedWps = [];
    
    // Lago di Braies (Start)
    const startWp = mappedWps[0];
    if (startWp) endOfStagePoints.push(startWp);

    // End of each stage 1..8
    STAGES.forEach((stage) => {
      const stageWps = mappedWps.filter((w) => w.day === stage.day);
      if (stageWps.length > 0) {
        const lastWp = stageWps[stageWps.length - 1];
        endOfStagePoints.push(lastWp);
      }
    });

    // Stage dividers and column centers for labels
    const stageDividers = STAGES.map((s) => {
      const startKm = stageStarts[s.day] || 0;
      const endKm = startKm + s.distanceKm;
      const startX = chartLeft + (startKm / totalKm) * chartW;
      const endX = chartLeft + (endKm / totalKm) * chartW;
      const centerX = (startX + endX) / 2;

      return {
        day: s.day,
        startX,
        endX,
        centerX,
        label: `J${s.day}`,
      };
    });

    return {
      svgWidth,
      svgHeight,
      chartLeft,
      chartRight,
      chartTop,
      chartBottom,
      minAlt,
      maxAlt,
      gridLevels,
      pathD: path,
      areaD: area,
      endOfStagePoints,
      stageDividers,
    };
  }, [allWaypointsWithCumulative, totalTrailDistance, stageStarts]);

  return (
    <section id="topo-carte" className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#c2c8c4]/40">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#5a605b] font-ui font-semibold mb-1">
            <Compass className="w-4 h-4 text-[#7c2000]" />
            <span>Topographie & Itinéraire Alpin</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-[#173028] tracking-tight">
            Carte interactive de l'Alta Via 1
          </h2>
          <p className="text-[#5a605b] font-serif-body text-base mt-1 max-w-2xl">
            {totalTrailDistance} kilomètres du nord au sud des Dolomites, du miroir turquoise du Lago di Braies aux collines de Belluno.
          </p>
        </div>

        {/* Global Trail Stats */}
        <div className="flex items-center gap-4 mt-4 md:mt-0 font-ui">
          <div className="bg-[#f0eee9] px-3.5 py-2 rounded-xl border border-[#c2c8c4]/30 text-center">
            <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Distance</span>
            <span className="text-lg font-bold text-[#173028] font-headline">{totalTrailDistance} km</span>
          </div>
          <div className="bg-[#f0eee9] px-3.5 py-2 rounded-xl border border-[#c2c8c4]/30 text-center">
            <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Dénivelé +</span>
            <span className="text-lg font-bold text-[#7c2000] font-headline">+{totalElevationGain.toLocaleString('fr-FR')} m</span>
          </div>
          <div className="bg-[#f0eee9] px-3.5 py-2 rounded-xl border border-[#c2c8c4]/30 text-center">
            <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Point culminant</span>
            <span className="text-lg font-bold text-[#173028] font-headline">{highestPoint.toLocaleString('fr-FR')} m</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Day */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 font-ui text-xs no-scrollbar">
        <button
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap font-medium flex items-center gap-1.5 ${
            selectedDayFilter === 'all'
              ? 'bg-[#173028] text-white shadow-xs'
              : 'bg-[#f0eee9] text-[#424845] hover:bg-[#eae8e3]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tracé complet (8 jours • {totalTrailDistance} km)</span>
        </button>
        {STAGES.map((s) => (
          <button
            key={s.day}
            onClick={() => setSelectedDayFilter(s.day)}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap font-medium flex items-center gap-1.5 ${
              selectedDayFilter === s.day
                ? 'bg-[#7c2000] text-white shadow-xs'
                : 'bg-[#f0eee9] text-[#424845] hover:bg-[#eae8e3]'
            }`}
          >
            <span>Jour {s.day}</span>
            <span className="text-[10px] opacity-75 font-normal">({s.distanceKm}km)</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top Leaflet Map */}
        <div className="lg:col-span-8 bg-[#f5f3ee] border border-[#c2c8c4]/40 rounded-2xl p-4 md:p-5 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 text-xs font-ui">
            <span className="font-bold uppercase tracking-wider text-[#173028] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#7c2000]" />
              {selectedDayFilter === 'all'
                ? 'Carte Topographique Haute Définition (OpenTopoMap • 8 jours)'
                : `Carte Étape ${selectedDayFilter} • ${currentStage?.title}`}
            </span>
            <span className="text-[11px] text-[#5a605b] font-serif-body bg-[#fbf9f4] px-2.5 py-0.5 rounded-full border border-[#c2c8c4]/40">
              🧭 Données GPS exactes • Zoom & déplacement interactifs
            </span>
          </div>

          {/* Leaflet Map Component */}
          <LeafletTrailMap
            waypoints={allWaypointsWithCumulative}
            selectedDay={selectedDayFilter}
            activeWaypoint={activeWaypoint}
            hoveredWaypoint={hoveredWaypoint}
            onSelectWaypoint={(wp) => {
              setActiveWaypoint(wp);
            }}
            onSelectStage={(dayNum) => {
              setSelectedDayFilter(dayNum);
            }}
          />
        </div>

        {/* Right Info Box for active Waypoint / Stage */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Waypoint Card */}
          <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7c2000] font-ui bg-[#fbf9f4] px-2 py-0.5 rounded border border-[#c2c8c4]/30">
                  Étape {currentDisplayWp?.day || 1} • {currentDisplayWp?.type.toUpperCase()}
                </span>
                <span className="text-xs font-mono font-bold text-[#173028]">
                  {currentDisplayWp?.altitude} m d'alt.
                </span>
              </div>

              <h3 className="text-xl font-headline font-bold text-[#173028] mt-1">
                {currentDisplayWp?.name}
              </h3>

              <p className="text-sm font-serif-body text-[#424845] mt-2 leading-relaxed">
                {currentDisplayWp?.description ||
                  `Point de passage remarquable sur l'étape ${currentDisplayWp?.day} de l'Alta Via 1. Traversée de paysages alpins grandioses au cœur des Dolomites.`}
              </p>

              {/* Stage summary preview */}
              {currentDisplayWp?.day && (
                <div className="mt-4 pt-4 border-t border-[#c2c8c4]/40">
                  <div className="text-xs font-ui text-[#5a605b] font-semibold mb-1">
                    Étape associée :
                  </div>
                  <div className="text-sm font-headline font-semibold text-[#173028]">
                    {STAGES[currentDisplayWp.day - 1]?.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#5a605b] font-ui mt-1.5">
                    <span>{STAGES[currentDisplayWp.day - 1]?.distanceKm} km</span>
                    <span>•</span>
                    <span className="text-[#7c2000] font-semibold">+{STAGES[currentDisplayWp.day - 1]?.elevationGainM}m D+</span>
                    <span>•</span>
                    <span>-{STAGES[currentDisplayWp.day - 1]?.elevationLossM}m D-</span>
                    <span>•</span>
                    <span>{STAGES[currentDisplayWp.day - 1]?.durationHours}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => onSelectStage(currentDisplayWp?.day || 1)}
                className="w-full py-2.5 px-4 bg-[#173028] hover:bg-[#2d463e] text-white rounded-xl font-headline text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Consulter le récit du Jour {currentDisplayWp?.day || 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Precision Elevation Profile Chart */}
      {selectedDayFilter !== 'all' && currentStage ? (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setSelectedDayFilter('all')}
              className="px-3 py-1.5 bg-[#173028] text-white rounded-lg hover:bg-[#2d463e] transition-colors flex items-center gap-1.5 text-xs font-ui font-semibold shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>← Revenir au profil complet 8 jours</span>
            </button>
            <span className="text-xs text-[#5a605b] font-ui">
              Étape {currentStage.day} sélectionnée
            </span>
          </div>
          <StageElevationProfile
            waypoints={currentStage.waypoints}
            totalDistanceKm={currentStage.distanceKm}
            stageTitle={currentStage.title}
            stageDay={currentStage.day}
            elevationGainM={currentStage.elevationGainM}
            elevationLossM={currentStage.elevationLossM}
            highestPointM={currentStage.highestPointM}
            onPrevDay={() => {
              if (currentStage.day > 1) setSelectedDayFilter(currentStage.day - 1);
            }}
            onNextDay={() => {
              if (currentStage.day < 8) setSelectedDayFilter(currentStage.day + 1);
            }}
            onSelectDay={(dayNum) => setSelectedDayFilter(dayNum)}
          />
        </div>
      ) : (
        <div className="mt-8 bg-[#fbf9f4] border border-[#c2c8c4]/60 rounded-2xl p-5 sm:p-7 shadow-sm">
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#c2c8c4]/40">
            <div>
              <div className="flex items-center gap-2 text-xs font-ui font-bold text-[#0284c7] uppercase tracking-wider">
                <Mountain className="w-4 h-4 text-[#0369a1]" />
                <span>Topographie & Profil Altimétrique Complet</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-headline font-bold text-[#173028] mt-0.5">
                Profil Altimétrique de l’Intégralité de l’Alta Via 1
              </h3>
              <p className="text-xs text-[#5a605b] font-serif-body mt-1">
                Vue panoramique continue des 8 étapes du nord au sud • Cliquez sur un refuge ou une étape pour zoomer
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-ui text-xs">
              <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#173028]">
                <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Distance totale</span>
                <span className="font-bold font-mono">{totalTrailDistance} km</span>
              </div>
              <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#7c2000]">
                <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Dénivelé +</span>
                <span className="font-bold font-mono">+{totalElevationGain.toLocaleString('fr-FR')} m</span>
              </div>
              <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#0369a1]">
                <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Dénivelé -</span>
                <span className="font-bold font-mono">-{totalElevationLoss.toLocaleString('fr-FR')} m</span>
              </div>
              <div className="bg-[#0369a1]/10 px-3 py-1.5 rounded-lg border border-[#0369a1]/30 text-[#0369a1]">
                <span className="text-[10px] text-[#0369a1]/80 uppercase block font-semibold">Point culminant</span>
                <span className="font-bold font-mono">{highestPoint.toLocaleString('fr-FR')} m (Lagazuoi)</span>
              </div>
            </div>
          </div>

          {/* SVG Global Elevation Profile */}
          <div className="relative w-full overflow-x-auto overflow-y-visible select-none pb-2">
            <svg
              viewBox={`0 0 ${globalProfileComputed.svgWidth} ${globalProfileComputed.svgHeight}`}
              className="w-full h-auto overflow-visible font-sans min-w-[650px] sm:min-w-[750px]"
              style={{ maxHeight: '420px' }}
            >
              <defs>
                <linearGradient id="globalSilhouetteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0883a4" />
                  <stop offset="25%" stopColor="#0369a1" />
                  <stop offset="70%" stopColor="#0b5887" />
                  <stop offset="100%" stopColor="#08334f" />
                </linearGradient>
                <linearGradient id="skyAtmosphereGlobal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4f8fb" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fbf9f4" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Sky background behind peaks */}
              <rect
                x={globalProfileComputed.chartLeft}
                y={globalProfileComputed.chartTop - 15}
                width={globalProfileComputed.chartRight - globalProfileComputed.chartLeft}
                height={globalProfileComputed.chartBottom - globalProfileComputed.chartTop + 15}
                fill="url(#skyAtmosphereGlobal)"
              />

              {/* Horizontal dotted grid lines & numerical elevation labels */}
              {globalProfileComputed.gridLevels.map((alt) => {
                const norm = (alt - globalProfileComputed.minAlt) / (globalProfileComputed.maxAlt - globalProfileComputed.minAlt);
                const y = globalProfileComputed.chartBottom - norm * (globalProfileComputed.chartBottom - globalProfileComputed.chartTop);
                return (
                  <g key={`grid-global-${alt}`}>
                    <line
                      x1={globalProfileComputed.chartLeft}
                      y1={y}
                      x2={globalProfileComputed.chartRight}
                      y2={y}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                      opacity="0.65"
                    />
                    <text
                      x={globalProfileComputed.chartLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="ui-monospace, monospace"
                      fill="#475569"
                    >
                      {alt}
                    </text>
                  </g>
                );
              })}

              {/* Left Y-axis vertical bar */}
              <line
                x1={globalProfileComputed.chartLeft}
                y1={globalProfileComputed.chartTop - 15}
                x2={globalProfileComputed.chartLeft}
                y2={globalProfileComputed.chartBottom}
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Stage dividers with top labels */}
              {globalProfileComputed.stageDividers.map((div, i) => (
                <g key={`stage-div-${div.day}`}>
                  {i > 0 && (
                    <line
                      x1={div.startX}
                      y1={globalProfileComputed.chartTop - 10}
                      x2={div.startX}
                      y2={globalProfileComputed.chartBottom}
                      stroke="#0284c7"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.35"
                    />
                  )}
                  {/* Stage badge on top */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedDayFilter(div.day)}
                  >
                    <rect
                      x={div.centerX - 13}
                      y={globalProfileComputed.chartTop - 32}
                      width="26"
                      height="18"
                      rx="4"
                      fill="#f0eee9"
                      stroke="#c2c8c4"
                      strokeWidth="1"
                    />
                    <text
                      x={div.centerX}
                      y={globalProfileComputed.chartTop - 19}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                      fill="#173028"
                    >
                      {div.label}
                    </text>
                  </g>
                </g>
              ))}

              {/* Solid Mountain Silhouette Polygon Fill */}
              <path
                d={globalProfileComputed.areaD}
                fill="url(#globalSilhouetteFill)"
                className="transition-all duration-300"
              />

              {/* Mountain Ridge Crisp Crest Line */}
              <path
                d={globalProfileComputed.pathD}
                fill="none"
                stroke="#075985"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* ONLY Refuges of Stage End Points + Start */}
              {globalProfileComputed.endOfStagePoints.map((wp, idx) => {
                const isHovered = hoveredWaypoint?.id === wp.id;
                const isSelected = activeWaypoint?.id === wp.id;
                const isLast = idx === globalProfileComputed.endOfStagePoints.length - 1;
                const labelX = wp.svgX;
                const labelY = wp.svgY - 14;

                return (
                  <g
                    key={`end-refuge-${wp.id || idx}`}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredWaypoint(wp)}
                    onMouseLeave={() => setHoveredWaypoint(null)}
                    onClick={() => {
                      setActiveWaypoint(wp);
                      if (wp.day) setSelectedDayFilter(wp.day);
                    }}
                  >
                    {/* Leader line */}
                    <line
                      x1={wp.svgX}
                      y1={wp.svgY}
                      x2={wp.svgX}
                      y2={wp.svgY - 8}
                      stroke={isSelected || isHovered ? '#ff8f6d' : '#ffffff'}
                      strokeWidth="1.5"
                      opacity="1"
                    />

                    {/* Dot Marker */}
                    <circle
                      cx={wp.svgX}
                      cy={wp.svgY}
                      r={isSelected || isHovered ? '5' : '3.8'}
                      fill={isSelected || isHovered ? '#ff8f6d' : '#ffffff'}
                      stroke="#08334f"
                      strokeWidth="1.5"
                    />

                    {/* Text Label - Vertical for last waypoint (La Pissa) to avoid overlap, slanted -45deg otherwise */}
                    <g
                      transform={
                        isLast
                          ? `translate(${labelX}, ${labelY}) rotate(-90)`
                          : `translate(${labelX}, ${labelY}) rotate(-45)`
                      }
                    >
                      <text
                        x="0"
                        y="0"
                        textAnchor="start"
                        fontSize={isHovered || isSelected ? '11.5' : '10.5'}
                        fontWeight={isHovered || isSelected ? 'bold' : '600'}
                        fontFamily="system-ui, sans-serif"
                        fill={isHovered || isSelected ? '#7c2000' : '#1e293b'}
                        className="transition-colors"
                        style={{
                          paintOrder: 'stroke fill',
                          stroke: '#fbf9f4',
                          strokeWidth: '3px',
                          strokeLinejoin: 'round',
                        }}
                      >
                        {wp.name}
                      </text>
                      <text
                        x="0"
                        y="11"
                        textAnchor="start"
                        fontSize="9"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="500"
                        fill={isHovered || isSelected ? '#7c2000' : '#64748b'}
                        style={{
                          paintOrder: 'stroke fill',
                          stroke: '#fbf9f4',
                          strokeWidth: '2px',
                        }}
                      >
                        {wp.altitude} m • {wp.cumulativeKm} km
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Bottom Distance Dimension Line */}
              <g>
                {/* Left Bracket Tick */}
                <line
                  x1={globalProfileComputed.chartLeft}
                  y1={globalProfileComputed.chartBottom + 12}
                  x2={globalProfileComputed.chartLeft}
                  y2={globalProfileComputed.chartBottom + 28}
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                {/* Horizontal Dimension Bar */}
                <line
                  x1={globalProfileComputed.chartLeft}
                  y1={globalProfileComputed.chartBottom + 20}
                  x2={globalProfileComputed.chartRight}
                  y2={globalProfileComputed.chartBottom + 20}
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                {/* Right Bracket Tick */}
                <line
                  x1={globalProfileComputed.chartRight}
                  y1={globalProfileComputed.chartBottom + 12}
                  x2={globalProfileComputed.chartRight}
                  y2={globalProfileComputed.chartBottom + 28}
                  stroke="#0284c7"
                  strokeWidth="2"
                />

                {/* Total Distance Text placed on bottom right bracket */}
                <text
                  x={globalProfileComputed.chartRight}
                  y={globalProfileComputed.chartBottom + 45}
                  textAnchor="end"
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  fill="#0369a1"
                >
                  {totalTrailDistance} km (Terminus La Pissa)
                </text>

                {/* Distance Start Marker 0 km */}
                <text
                  x={globalProfileComputed.chartLeft}
                  y={globalProfileComputed.chartBottom + 45}
                  textAnchor="start"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="ui-monospace, monospace"
                  fill="#64748b"
                >
                  0 km (Lago di Braies)
                </text>
              </g>
            </svg>
          </div>

          {/* Selected / Hovered Point Detail Card */}
          {currentDisplayWp && (
            <div className="mt-4 p-4 rounded-xl bg-[#f0eee9] border border-[#c2c8c4]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0369a1] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#0284c7] font-ui">
                      {currentDisplayWp.day ? `Étape ${currentDisplayWp.day} • ${currentDisplayWp.type.toUpperCase()}` : currentDisplayWp.type.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#173028]">
                      • {currentDisplayWp.altitude} m d'altitude
                    </span>
                  </div>
                  <h4 className="text-base font-headline font-bold text-[#173028]">
                    {currentDisplayWp.name}
                  </h4>
                  {currentDisplayWp.description && (
                    <p className="text-xs text-[#5a605b] font-serif-body mt-0.5">
                      {currentDisplayWp.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-4 font-ui text-xs bg-white/70 px-3 py-2 rounded-lg border border-[#c2c8c4]/40">
                  <div>
                    <span className="text-[10px] text-[#5a605b] block">Distance cumulée</span>
                    <span className="font-bold font-mono text-[#173028]">{currentDisplayWp.cumulativeKm} km</span>
                  </div>
                  <div className="h-6 w-px bg-[#c2c8c4]/50" />
                  <div>
                    <span className="text-[10px] text-[#5a605b] block">Progression globale</span>
                    <span className="font-bold font-mono text-[#0369a1]">
                      {Math.min(100, Math.max(0, Math.round((currentDisplayWp.cumulativeKm / totalTrailDistance) * 100)))}%
                    </span>
                  </div>
                </div>

                {currentDisplayWp.day && (
                  <button
                    onClick={() => setSelectedDayFilter(currentDisplayWp.day!)}
                    className="px-3 py-2 bg-[#173028] hover:bg-[#2d463e] text-white rounded-lg text-xs font-medium font-ui flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <span>Zoom Étape {currentDisplayWp.day}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

