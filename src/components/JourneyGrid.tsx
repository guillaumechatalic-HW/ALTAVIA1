import { STAGES } from '../data/stagesData';
import { CustomStagePhotos } from '../types/trail';
import { Clock, Mountain, ArrowUpRight, Flame, Calendar } from 'lucide-react';

interface JourneyGridProps {
  onSelectStage: (dayNumber: number) => void;
  customPhotos?: Record<number, CustomStagePhotos>;
}

export const JourneyGrid = ({
  onSelectStage,
  customPhotos = {},
}: JourneyGridProps) => {
  return (
    <section id="les-etapes" className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#c2c8c4]/40">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#5a605b] font-ui font-semibold mb-1">
            <Flame className="w-4 h-4 text-[#7c2000]" />
            <span>La Traversée Étape par Étape • 22 au 29 Juin</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-[#173028] tracking-tight">
            Les 8 Étapes du Carnet
          </h2>
          <p className="text-[#5a605b] font-serif-body text-base mt-1 max-w-2xl">
            Cliquez sur une étape pour plonger dans le récit détaillé, découvrir la galerie photo haute résolution, les caractéristiques du refuge et les conseils topo.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <div className="text-xs font-ui text-[#5a605b] bg-[#f0eee9] px-3 py-2 rounded-xl border border-[#c2c8c4]/40">
            <span className="font-semibold text-[#173028]">8</span> étapes alpines d’exception
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAGES.map((stage) => {
          const displayImage = customPhotos[stage.day]?.cardImage || customPhotos[stage.day]?.heroImage || stage.cardImage;

          return (
            <div
              key={stage.day}
              onClick={() => onSelectStage(stage.day)}
              className="group cursor-pointer bg-[#f5f3ee] hover:bg-[#eae8e3] border border-[#c2c8c4]/40 hover:border-[#7c2000]/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Image Header */}
              <div className="relative aspect-4/3 overflow-hidden bg-[#dee4de]">
                <img
                  src={displayImage}
                  alt={stage.cardImageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Day Badge */}
                <div className="absolute top-3 left-3 bg-[#173028]/85 backdrop-blur-xs text-white text-[11px] font-ui font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <span>Jour {stage.day}</span>
                  {stage.dateLabel && (
                    <span className="text-[10px] text-stone-300 font-normal border-l border-white/30 pl-1">
                      {stage.dateLabel.replace('Dimanche ', '').replace('Lundi ', '').replace('Mardi ', '').replace('Mercredi ', '').replace('Jeudi ', '').replace('Vendredi ', '').replace('Samedi ', '')}
                    </span>
                  )}
                </div>

                {/* Difficulty Pill */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-xs text-white text-[10px] font-ui px-2 py-0.5 rounded-md">
                  {stage.difficulty}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-ui font-semibold text-[#7c2000] mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>{stage.dateLabel || `Jour ${stage.day}`}</span>
                  </div>

                  <h3 className="text-lg font-headline font-bold text-[#173028] group-hover:text-[#7c2000] transition-colors line-clamp-1">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[#5a605b] font-ui italic mb-2.5">
                    {stage.subtitle}
                  </p>
                  <p className="text-xs font-serif-body text-[#424845] line-clamp-3 leading-relaxed">
                    {stage.cardSummary}
                  </p>
                </div>

                {/* Card Meta Stats & Button */}
                <div className="mt-4 pt-3 border-t border-[#c2c8c4]/30">
                  <div className="flex items-center justify-between text-[11px] font-ui text-[#5a605b] mb-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-[#173028]">{stage.distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mountain className="w-3 h-3 text-[#7c2000]" />
                      <span>+{stage.elevationGainM}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{stage.durationHours}</span>
                    </div>
                  </div>

                  <div className="w-full py-2 px-3 rounded-xl bg-[#173028] text-white text-xs font-ui font-semibold flex items-center justify-between group-hover:bg-[#7c2000] transition-colors">
                    <span>Ouvrir l'étape</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
