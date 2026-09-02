import { HERO_MAIN_IMAGE, STAGES } from '../data/stagesData';
import { Mountain, Compass, ArrowDown, MapPin, Sparkles } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUrl';

interface HeroSectionProps {
  onExploreClick: () => void;
  onMapClick: () => void;
}

export const HeroSection = ({
  onExploreClick,
  onMapClick,
}: HeroSectionProps) => {
  const totalDistance = Math.round(STAGES.reduce((sum, s) => sum + s.distanceKm, 0) * 10) / 10;
  const totalElevationGain = STAGES.reduce((sum, s) => sum + s.elevationGainM, 0);
  const highestPoint = Math.max(...STAGES.map((s) => s.highestPointM));

  return (
    <section className="relative pt-8 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f0eee9] border border-[#c2c8c4]/50 text-xs font-ui text-[#5a605b] uppercase tracking-widest font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#7c2000]" />
          <span>Carnet de Randonnée & Topo Guide • 22 au 29 Juin</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-[#173028] tracking-tight leading-[1.08] mb-5">
          ALTA VIA 1 : LE CŒUR DES DOLOMITES
        </h1>

        <p className="text-lg md:text-xl font-serif-body text-[#424845] leading-relaxed italic max-w-2xl mx-auto">
          {totalDistance} kilomètres à travers les géants de calcaire. Un carnet de voyage au jour le jour, entre refuges perchés et cols vertigineux.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7 font-ui text-xs">
          <button
            onClick={onExploreClick}
            className="py-3 px-6 rounded-xl bg-[#173028] hover:bg-[#2d463e] text-white font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg group"
          >
            <span>Découvrir les 8 étapes</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={onMapClick}
            className="py-3 px-4 rounded-xl bg-[#f0eee9] hover:bg-[#eae8e3] text-[#173028] font-semibold flex items-center gap-2 border border-[#c2c8c4]/40 transition-colors"
          >
            <Compass className="w-4 h-4 text-[#173028]" />
            <span>Carte & profil</span>
          </button>
        </div>
      </div>

      {/* Hero Image Banner with High Aesthetic Depth */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#c2c8c4]/50 image-depth bg-[#eae8e3]">
        <div className="aspect-16/9 sm:aspect-21/9 max-h-[520px] w-full relative">
          <img
            src={formatImageUrl(HERO_MAIN_IMAGE)}
            alt="Le célèbre Passo Giau sous la pyramide de Ra Gusela"
            className="w-full h-full object-cover object-center"
          />

          {/* Vignette Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Location Badge on Image */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-ui flex items-center gap-1.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-[#ff8f6d]" />
            <span>Dolomiti di Braies ➔ Belluno (Italie)</span>
          </div>

          {/* Bottom Overlay Info Banner */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between text-white gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#ff8f6d] font-ui font-semibold block">
                Itinéraire légendaire n°1 • 22 au 29 Juin
              </span>
              <h2 className="text-xl sm:text-2xl font-headline font-bold drop-shadow-md">
                De la Croda del Becco au massif du Schiara
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-ui bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Saison idéale : Mi-juin à fin septembre</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-xs text-[#5a605b] uppercase font-ui tracking-wider font-semibold block mb-1">
            Durée totale
          </span>
          <span className="text-2xl md:text-3xl font-bold font-headline text-[#173028]">
            {STAGES.length} Jours
          </span>
          <span className="text-[11px] text-[#5a605b] font-serif-body italic block mt-0.5">
            En refuges gardés
          </span>
        </div>

        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-xs text-[#5a605b] uppercase font-ui tracking-wider font-semibold block mb-1">
            Distance à pied
          </span>
          <span className="text-2xl md:text-3xl font-bold font-headline text-[#173028]">
            {totalDistance} km
          </span>
          <span className="text-[11px] text-[#5a605b] font-serif-body italic block mt-0.5">
            Sentier balisé n°1
          </span>
        </div>

        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-xs text-[#5a605b] uppercase font-ui tracking-wider font-semibold block mb-1">
            Dénivelé Positif
          </span>
          <span className="text-2xl md:text-3xl font-bold font-headline text-[#7c2000]">
            +{totalElevationGain.toLocaleString('fr-FR')} m
          </span>
          <span className="text-[11px] text-[#5a605b] font-serif-body italic block mt-0.5">
            Ascensions cumulées
          </span>
        </div>

        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-2xl p-4 text-center shadow-xs">
          <span className="text-xs text-[#5a605b] uppercase font-ui tracking-wider font-semibold block mb-1">
            Point culminant
          </span>
          <span className="text-2xl md:text-3xl font-bold font-headline text-[#173028]">
            {highestPoint.toLocaleString('fr-FR')} m
          </span>
          <span className="text-[11px] text-[#5a605b] font-serif-body italic block mt-0.5">
            Rifugio Lagazuoi
          </span>
        </div>
      </div>
    </section>
  );
};
