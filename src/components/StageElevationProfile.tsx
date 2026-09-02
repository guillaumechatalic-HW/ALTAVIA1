import React, { useState, useMemo } from 'react';
import { Waypoint } from '../types/trail';
import { Mountain, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface StageElevationProfileProps {
  waypoints: Waypoint[];
  totalDistanceKm: number;
  stageTitle?: string;
  stageDay?: number;
  elevationGainM?: number;
  elevationLossM?: number;
  highestPointM?: number;
  className?: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  onSelectDay?: (day: number) => void;
}

export const StageElevationProfile: React.FC<StageElevationProfileProps> = ({
  waypoints,
  totalDistanceKm,
  stageTitle,
  stageDay,
  elevationGainM,
  elevationLossM,
  highestPointM,
  className = '',
  onPrevDay,
  onNextDay,
  onSelectDay,
}) => {
  const [hoveredWp, setHoveredWp] = useState<Waypoint | null>(null);
  const [selectedWp, setSelectedWp] = useState<Waypoint | null>(null);

  // SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 380;
  const chartLeft = 75;
  const chartRight = 910;
  const chartTop = 85;
  const chartBottom = 310;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  // Compute altitude bounds with rounded grid intervals
  const { minAlt, maxAlt, gridLevels, profilePoints, pathD, areaD } = useMemo(() => {
    if (!waypoints || waypoints.length === 0) {
      return { minAlt: 0, maxAlt: 3000, gridLevels: [], profilePoints: [], pathD: '', areaD: '' };
    }

    const altitudes = waypoints.map((w) => w.altitude);
    const rawMin = Math.min(...altitudes);
    const rawMax = Math.max(...altitudes);

    // Dynamic grid step (200m, 250m, or 500m)
    const range = rawMax - rawMin;
    const gridStep = range > 1400 ? 500 : range > 800 ? 250 : 200;

    // Generous altitude bounds for ample text clearance above peaks
    const floorMin = Math.max(0, Math.floor((rawMin - 120) / gridStep) * gridStep);
    const ceilMax = Math.ceil((rawMax + 240) / gridStep) * gridStep;

    const gridLevelsArr: number[] = [];
    for (let alt = floorMin; alt <= ceilMax; alt += gridStep) {
      gridLevelsArr.push(alt);
    }

    const totalKm = totalDistanceKm > 0 ? totalDistanceKm : Math.max(...waypoints.map((w) => w.distanceFromStart), 1);

    // Build dense interpolation curve for realistic mountain terrain
    const densePoints: { x: number; y: number; km: number; alt: number; wp?: Waypoint }[] = [];

    // First map actual waypoints
    const mappedWps = waypoints.map((wp) => {
      const x = chartLeft + (wp.distanceFromStart / totalKm) * chartW;
      const altNorm = (wp.altitude - floorMin) / (ceilMax - floorMin);
      const y = chartBottom - altNorm * chartH;
      return {
        ...wp,
        svgX: Math.max(chartLeft, Math.min(chartRight, x)),
        svgY: Math.max(chartTop, Math.min(chartBottom, y)),
      };
    });

    const daySeed = (stageDay || 1) * 1.618;

    // Interpolate with rugged, authentic Dolomite relief between waypoints
    for (let i = 0; i < mappedWps.length; i++) {
      const curr = mappedWps[i];
      densePoints.push({
        x: curr.svgX,
        y: curr.svgY,
        km: curr.distanceFromStart,
        alt: curr.altitude,
        wp: curr,
      });

      if (i < mappedWps.length - 1) {
        const next = mappedWps[i + 1];
        const distDiff = next.distanceFromStart - curr.distanceFromStart;
        if (distDiff <= 0.001) continue;

        // High resolution steps for crisp, natural rock and ridge detail (~30-50m per point)
        const steps = Math.max(16, Math.min(90, Math.round(distDiff * 28)));
        const altDiff = next.altitude - curr.altitude;
        const slope = altDiff / distDiff; // m/km

        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const interpKm = curr.distanceFromStart + t * distDiff;

          // Smooth baseline slope between waypoints
          const smoothT = t * t * (3 - 2 * t);
          const baseAlt = curr.altitude + smoothT * altDiff;

          // Boundary dampener: strictly 0 at waypoints, peaking naturally in between
          const envelope = Math.sin(t * Math.PI);

          // 1. Macro alpine terrain (crêtes secondaires, combes et épaules: 12-28m)
          const f1 = Math.sin(interpKm * 2.8 + i * 1.9 + daySeed) * Math.cos(interpKm * 1.4 + i);
          let macroAmp = Math.min(26.0, Math.max(8.0, distDiff * 6.0));
          if (Math.abs(slope) > 160) {
            macroAmp *= 0.65; // Dampen slightly on very steep direct ascents/descents
          }

          // 2. Intermediate rock benches & terraces (ressauts rocheux dolomitiques: 6-14m)
          const f2 = Math.sin(interpKm * 7.4 + i * 2.7) * Math.cos(interpKm * 4.2 + daySeed);
          const medAmp = Math.min(13.0, Math.max(4.0, distDiff * 3.2));

          // 3. Micro jaggedness & scree terrain (pierriers, caillasse, crans d'éboulis: 2-5m)
          const f3 = (Math.sin(interpKm * 21.0 + i) + 0.65 * Math.cos(interpKm * 43.0 + daySeed)) * 0.7;
          const microAmp = 3.8;

          const relief = envelope * (f1 * macroAmp + f2 * medAmp + f3 * microAmp);
          const finalAlt = Math.max(floorMin + 5, Math.min(ceilMax - 10, baseAlt + relief));

          const x = chartLeft + (interpKm / totalKm) * chartW;
          const altNorm = (finalAlt - floorMin) / (ceilMax - floorMin);
          const y = chartBottom - altNorm * chartH;

          densePoints.push({
            x: Math.max(chartLeft, Math.min(chartRight, x)),
            y: Math.max(chartTop, Math.min(chartBottom, y)),
            km: Math.round(interpKm * 100) / 100,
            alt: Math.round(finalAlt),
          });
        }
      }
    }

    if (densePoints.length === 0) {
      return { minAlt: floorMin, maxAlt: ceilMax, gridLevels: gridLevelsArr, profilePoints: mappedWps, pathD: '', areaD: '' };
    }

    let path = `M ${densePoints[0].x.toFixed(1)},${densePoints[0].y.toFixed(1)}`;
    for (let i = 1; i < densePoints.length; i++) {
      path += ` L ${densePoints[i].x.toFixed(1)},${densePoints[i].y.toFixed(1)}`;
    }

    const area = `${path} L ${chartRight},${chartBottom} L ${chartLeft},${chartBottom} Z`;

    return {
      minAlt: floorMin,
      maxAlt: ceilMax,
      gridLevels: gridLevelsArr,
      profilePoints: mappedWps,
      pathD: path,
      areaD: area,
    };
  }, [waypoints, totalDistanceKm, chartW, chartH, chartLeft, chartRight, chartTop, chartBottom]);

  const activeDisplayWp = hoveredWp || selectedWp || (profilePoints.length > 0 ? profilePoints[0] : null);

  const getYForAlt = (alt: number) => {
    if (maxAlt === minAlt) return chartBottom;
    const norm = (alt - minAlt) / (maxAlt - minAlt);
    return chartBottom - norm * chartH;
  };

  return (
    <div className={`bg-[#fbf9f4] border border-[#c2c8c4]/60 rounded-2xl p-5 sm:p-7 shadow-sm ${className}`}>
      {/* Header bar with Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#c2c8c4]/40">
        <div>
          <div className="flex items-center gap-2 text-xs font-ui font-bold text-[#0284c7] uppercase tracking-wider">
            <Mountain className="w-4 h-4 text-[#0369a1]" />
            <span>Topographie & Profil Altimétrique</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-headline font-bold text-[#173028] mt-0.5">
            {stageDay ? `Profil du Jour ${stageDay}` : 'Profil Altimétrique de l’Étape'}
            {stageTitle && <span className="font-normal text-[#5a605b] text-base ml-2">• {stageTitle}</span>}
          </h3>
        </div>

        {/* Navigation & Mini stats */}
        <div className="flex flex-wrap items-center gap-2 font-ui text-xs">
          {/* Day Stepper buttons if stageDay is present */}
          {stageDay && (
            <div className="flex items-center gap-1 bg-[#f0eee9] p-1 rounded-xl border border-[#c2c8c4]/40 mr-1">
              <button
                onClick={onPrevDay}
                disabled={stageDay <= 1 || !onPrevDay}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  stageDay <= 1 || !onPrevDay
                    ? 'opacity-40 cursor-not-allowed text-[#727975]'
                    : 'bg-[#fbf9f4] hover:bg-[#173028] hover:text-white text-[#173028] shadow-2xs'
                }`}
                title="Jour précédent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Jour {stageDay - 1}</span>
              </button>

              <div className="px-2 py-0.5 font-bold text-[#173028] text-xs">
                J{stageDay}/8
              </div>

              <button
                onClick={onNextDay}
                disabled={stageDay >= 8 || !onNextDay}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                  stageDay >= 8 || !onNextDay
                    ? 'opacity-40 cursor-not-allowed text-[#727975]'
                    : 'bg-[#173028] text-white hover:bg-[#2d463e] shadow-2xs'
                }`}
                title="Jour suivant"
              >
                <span className="hidden sm:inline">Jour {stageDay + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#173028]">
            <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Distance</span>
            <span className="font-bold font-mono">{totalDistanceKm} km</span>
          </div>
          {elevationGainM !== undefined && (
            <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#7c2000]">
              <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Dénivelé +</span>
              <span className="font-bold font-mono">+{elevationGainM} m</span>
            </div>
          )}
          {elevationLossM !== undefined && (
            <div className="bg-[#f0eee9] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 text-[#0369a1]">
              <span className="text-[10px] text-[#5a605b] uppercase block font-semibold">Dénivelé -</span>
              <span className="font-bold font-mono">-{elevationLossM} m</span>
            </div>
          )}
          {highestPointM !== undefined && (
            <div className="bg-[#0369a1]/10 px-3 py-1.5 rounded-lg border border-[#0369a1]/30 text-[#0369a1]">
              <span className="text-[10px] text-[#0369a1]/80 uppercase block font-semibold">Point culminant</span>
              <span className="font-bold font-mono">{highestPointM} m</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Topo Silhouette Chart */}
      <div className="relative w-full overflow-x-auto overflow-y-visible select-none pb-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible font-sans min-w-[650px] sm:min-w-[750px]"
          style={{ maxHeight: '420px' }}
        >
          <defs>
            <linearGradient id="mountainSilhouetteFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0883a4" />
              <stop offset="25%" stopColor="#0369a1" />
              <stop offset="70%" stopColor="#0b5887" />
              <stop offset="100%" stopColor="#08334f" />
            </linearGradient>
            <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4f8fb" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbf9f4" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Sky background behind peaks */}
          <rect
            x={chartLeft}
            y={chartTop - 15}
            width={chartRight - chartLeft}
            height={chartBottom - chartTop + 15}
            fill="url(#skyAtmosphere)"
          />

          {/* Horizontal dotted grid lines & numerical elevation labels */}
          {gridLevels.map((alt) => {
            const y = getYForAlt(alt);
            return (
              <g key={`grid-${alt}`}>
                <line
                  x1={chartLeft}
                  y1={y}
                  x2={chartRight}
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                  opacity="0.65"
                />
                <text
                  x={chartLeft - 10}
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
            x1={chartLeft}
            y1={chartTop - 15}
            x2={chartLeft}
            y2={chartBottom}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Solid Mountain Silhouette Polygon Fill */}
          <path
            d={areaD}
            fill="url(#mountainSilhouetteFill)"
            className="transition-all duration-300"
          />

          {/* Mountain Ridge Crisp Crest Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#075985"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Angled Peak, Col & Refuge Labels */}
          {profilePoints.map((wp, idx) => {
            const isHovered = hoveredWp?.id === wp.id;
            const isSelected = selectedWp?.id === wp.id;
            const isKeyPoint =
              wp.type === 'summit' ||
              wp.type === 'pass' ||
              wp.type === 'refuge' ||
              wp.type === 'start' ||
              wp.type === 'finish' ||
              profilePoints.length <= 6;

            const isLast = idx === profilePoints.length - 1 || wp.type === 'finish';
            const nextWp = profilePoints[idx + 1];
            // Only turn vertical if it's the finish point, or if it's right before the finish and tightly packed (< 75px)
            const isNearFinish = Boolean(
              nextWp &&
              (nextWp.type === 'finish' || idx + 1 === profilePoints.length - 1) &&
              Math.abs(nextWp.svgX - wp.svgX) < 75
            );
            const isVertical = isLast || isNearFinish;
            const labelX = wp.svgX;
            const labelY = wp.svgY - 14;

            return (
              <g
                key={`wp-label-${wp.id || idx}`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredWp(wp)}
                onMouseLeave={() => setHoveredWp(null)}
                onClick={() => setSelectedWp(wp)}
              >
                {/* Leader line from crest to point marker */}
                <line
                  x1={wp.svgX}
                  y1={wp.svgY}
                  x2={wp.svgX}
                  y2={wp.svgY - 8}
                  stroke={isSelected || isHovered ? '#ff8f6d' : '#ffffff'}
                  strokeWidth="1.5"
                  opacity={isKeyPoint || isHovered ? '1' : '0.4'}
                />

                {/* Crest point dot */}
                <circle
                  cx={wp.svgX}
                  cy={wp.svgY}
                  r={isSelected || isHovered ? '5' : isKeyPoint ? '3.8' : '2.5'}
                  fill={isSelected || isHovered ? '#ff8f6d' : '#ffffff'}
                  stroke="#08334f"
                  strokeWidth="1.5"
                />

                {/* Text Label - Vertical for last waypoint to avoid overlap, slanted -45deg otherwise */}
                {isKeyPoint && (
                  <g
                    transform={
                      isVertical
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
                      {wp.altitude} m • {wp.distanceFromStart} km
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Bottom Distance Dimension Line */}
          <g>
            {/* Left Bracket Tick */}
            <line
              x1={chartLeft}
              y1={chartBottom + 12}
              x2={chartLeft}
              y2={chartBottom + 28}
              stroke="#0284c7"
              strokeWidth="2"
            />
            {/* Horizontal Dimension Bar */}
            <line
              x1={chartLeft}
              y1={chartBottom + 20}
              x2={chartRight}
              y2={chartBottom + 20}
              stroke="#0284c7"
              strokeWidth="2"
            />
            {/* Right Bracket Tick */}
            <line
              x1={chartRight}
              y1={chartBottom + 12}
              x2={chartRight}
              y2={chartBottom + 28}
              stroke="#0284c7"
              strokeWidth="2"
            />

            {/* Total Distance Text placed on bottom right bracket */}
            <text
              x={chartRight}
              y={chartBottom + 45}
              textAnchor="end"
              fontSize="14"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
              fill="#0369a1"
            >
              {totalDistanceKm} km
            </text>

            {/* Distance Start Marker 0 km */}
            <text
              x={chartLeft}
              y={chartBottom + 45}
              textAnchor="start"
              fontSize="12"
              fontWeight="600"
              fontFamily="ui-monospace, monospace"
              fill="#64748b"
            >
              0 km (Départ)
            </text>
          </g>
        </svg>
      </div>

      {/* Selected / Hovered Waypoint Interactive Detail Card */}
      {activeDisplayWp && (
        <div className="mt-4 p-4 rounded-xl bg-[#f0eee9] border border-[#c2c8c4]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0369a1] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#0284c7] font-ui">
                  {activeDisplayWp.type.toUpperCase()}
                </span>
                <span className="text-xs font-mono font-bold text-[#173028]">
                  • {activeDisplayWp.altitude} m d'altitude
                </span>
              </div>
              <h4 className="text-base font-headline font-bold text-[#173028]">
                {activeDisplayWp.name}
              </h4>
              {activeDisplayWp.description && (
                <p className="text-xs text-[#5a605b] font-serif-body mt-0.5">
                  {activeDisplayWp.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 sm:text-right font-ui text-xs bg-white/70 px-3 py-2 rounded-lg border border-[#c2c8c4]/40">
            <div>
              <span className="text-[10px] text-[#5a605b] block">Kilomètre</span>
              <span className="font-bold font-mono text-[#173028]">{activeDisplayWp.distanceFromStart} km</span>
            </div>
            <div className="h-6 w-px bg-[#c2c8c4]/50" />
            <div>
              <span className="text-[10px] text-[#5a605b] block">Progression</span>
              <span className="font-bold font-mono text-[#0369a1]">
                {Math.min(100, Math.max(0, Math.round((activeDisplayWp.distanceFromStart / (totalDistanceKm || 1)) * 100)))}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

