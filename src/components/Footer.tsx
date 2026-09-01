import { STAGES } from '../data/stagesData';
import { Mountain, Compass, ShieldAlert, ArrowUp, Heart } from 'lucide-react';

interface FooterProps {
  onSelectStage: (dayNumber: number) => void;
  onNavigateHome: () => void;
}

export const Footer = ({ onSelectStage, onNavigateHome }: FooterProps) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#173028] text-[#dee4de] pt-14 pb-10 border-t border-[#2d463e]">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Col 1: Brand & Manifesto */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#2d463e] flex items-center justify-center text-[#98b3a9]">
                <Mountain className="w-4 h-4" />
              </div>
              <span className="font-headline font-bold text-lg text-white tracking-wide">
                ALTA VIA 1 DOLOMITI
              </span>
            </div>
            <p className="font-serif-body text-xs text-[#98b3a9] leading-relaxed mb-4">
              Un carnet de voyage littéraire et un topo-guide contemplatif à travers le patrimoine mondial de l'UNESCO. 120 kilomètres d'arêtes calcaires, de cols sauvages et de refuges d'altitude.
            </p>
            <div className="text-[11px] font-ui text-[#98b3a9]/80 italic">
              « Les montagnes sont les cathédrales où j'exerce ma religion. » — Anatoli Boukreev
            </div>
          </div>

          {/* Col 2: Navigation rapide vers les 8 étapes */}
          <div className="md:col-span-5 font-ui">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white mb-3">
              Les 8 Étapes du Carnet
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {STAGES.map((stage) => (
                <button
                  key={stage.day}
                  onClick={() => {
                    onSelectStage(stage.day);
                    scrollToTop();
                  }}
                  className="text-left py-1 text-[#dee4de]/80 hover:text-white transition-colors truncate flex items-center gap-1.5"
                >
                  <span className="text-[#ff8f6d] font-mono font-bold text-[10px]">
                    J{stage.day}
                  </span>
                  <span className="truncate">{stage.title.replace(`Jour ${stage.day} : `, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Sécurité & Urgence en montagne */}
          <div className="md:col-span-3 font-ui text-xs">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff8f6d]" />
              <span>Secours en Montagne</span>
            </h4>
            <div className="bg-[#2d463e]/60 p-3 rounded-xl border border-[#98b3a9]/20 space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[#dee4de]/90">Numéro d'urgence Italie :</span>
                <span className="font-mono font-bold text-[#ff8f6d] text-sm">118 / 112</span>
              </div>
              <div className="text-[11px] text-[#dee4de]/70">
                Soccorso Alpino e Speleologico (CNSAS)
              </div>
            </div>
            <div className="text-[#98b3a9] text-xs">
              Toujours vérifier la météo alpine locale auprès des gardiens de refuge avant le départ.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2d463e]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-ui text-[#98b3a9]">
          <div>
            Alta Via 1 Dolomites • Guide de randonnée alpine • Tous droits réservés.
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-white hover:text-[#ff8f6d] transition-colors p-1"
          >
            <span>Haut de page</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
