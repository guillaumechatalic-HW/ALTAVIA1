import { useState } from 'react';
import { STAGES } from '../data/stagesData';
import {
  Compass,
  BookOpen,
  Menu,
  X,
  ChevronDown,
  Mountain,
} from 'lucide-react';

interface TopNavBarProps {
  currentView: 'home' | 'stage';
  activeDay: number;
  onNavigateHome: () => void;
  onSelectStage: (dayNumber: number) => void;
  onScrollToMap: () => void;
}

export const TopNavBar = ({
  currentView,
  activeDay,
  onNavigateHome,
  onSelectStage,
  onScrollToMap,
}: TopNavBarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stagesDropdownOpen, setStagesDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f4]/90 backdrop-blur-md border-b border-[#c2c8c4]/40 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#173028] text-white flex items-center justify-center shadow-xs group-hover:bg-[#2d463e] transition-colors">
            <Mountain className="w-5 h-5 text-[#98b3a9]" />
          </div>
          <div>
            <span className="font-headline font-bold text-base tracking-tight text-[#173028] block leading-none">
              ALTA VIA 1
            </span>
            <span className="text-[10px] tracking-widest text-[#5a605b] font-ui uppercase block mt-0.5">
              Dolomites • Carnet de Bord (22-29 Juin)
            </span>
          </div>
        </button>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 font-ui text-xs text-[#424845]">
          {/* Stages Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStagesDropdownOpen(!stagesDropdownOpen)}
              onMouseEnter={() => setStagesDropdownOpen(true)}
              className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                currentView === 'stage'
                  ? 'bg-[#eae8e3] text-[#173028] font-semibold'
                  : 'hover:bg-[#f0eee9] text-[#424845]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#7c2000]" />
              <span>Les 8 Étapes</span>
              <ChevronDown className="w-3 h-3 text-[#727975]" />
            </button>

            {/* Dropdown Menu */}
            {stagesDropdownOpen && (
              <div
                onMouseLeave={() => setStagesDropdownOpen(false)}
                className="absolute top-full left-0 mt-1 w-64 bg-[#fbf9f4] border border-[#c2c8c4]/60 rounded-xl shadow-xl p-2 z-50 animate-fade-in"
              >
                <div className="text-[10px] uppercase font-bold text-[#5a605b] px-3 py-1.5 border-b border-[#c2c8c4]/30">
                  Itinéraire Nord ➔ Sud (22 au 29 Juin)
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {STAGES.map((s) => (
                    <button
                      key={s.day}
                      onClick={() => {
                        onSelectStage(s.day);
                        setStagesDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                        currentView === 'stage' && activeDay === s.day
                          ? 'bg-[#173028] text-white font-medium'
                          : 'hover:bg-[#f0eee9] text-[#1b1c19]'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold mr-1.5">J{s.day}</span>
                        <span>{s.title.replace(`Jour ${s.day} : `, '')}</span>
                      </div>
                      <span className="text-[10px] opacity-75 font-mono ml-2 shrink-0">
                        {s.distanceKm}km
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Carte & Topo */}
          <button
            onClick={() => {
              if (currentView !== 'home') {
                onNavigateHome();
                setTimeout(onScrollToMap, 100);
              } else {
                onScrollToMap();
              }
            }}
            className="px-3 py-2 rounded-lg font-medium hover:bg-[#f0eee9] text-[#424845] flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-[#173028]" />
            <span>Carte & Topo</span>
          </button>
        </nav>

        {/* Action Button (Right) */}
        <div className="flex items-center gap-2">
          {currentView === 'stage' && (
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-ui font-medium text-[#173028] bg-[#f0eee9] hover:bg-[#eae8e3] px-3 py-1.5 rounded-lg border border-[#c2c8c4]/40 transition-colors"
            >
              <span>Vue d'ensemble</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#1b1c19] hover:bg-[#f0eee9] focus:outline-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fbf9f4] border-b border-[#c2c8c4]/50 px-4 py-4 space-y-3 font-ui text-sm animate-fade-in shadow-lg">
          <div className="text-xs font-bold uppercase text-[#5a605b] tracking-wider mb-2">
            Étapes de la Haute Route (22-29 Juin)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.day}
                onClick={() => {
                  onSelectStage(s.day);
                  setMobileMenuOpen(false);
                }}
                className={`text-left p-2 rounded-lg text-xs font-medium ${
                  currentView === 'stage' && activeDay === s.day
                    ? 'bg-[#173028] text-white'
                    : 'bg-[#f0eee9] text-[#1b1c19]'
                }`}
              >
                <div className="font-bold">Jour {s.day}</div>
                <div className="truncate text-[11px] opacity-80">
                  {s.title.replace(`Jour ${s.day} : `, '')}
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#c2c8c4]/30 space-y-2">
            <button
              onClick={() => {
                if (currentView !== 'home') onNavigateHome();
                setTimeout(onScrollToMap, 100);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left p-2.5 rounded-lg bg-[#f0eee9] font-medium text-xs flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#173028]" />
              <span>Carte Topographique & Profil Altimétrique</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
