import { useState } from 'react';
import { STAGES } from './data/stagesData';
import { EPIC_ALBUM_PHOTOS } from './data/epicAlbumData';
import { GalleryPhoto } from './types/trail';
import { TopNavBar } from './components/TopNavBar';
import { HeroSection } from './components/HeroSection';
import { JourneyGrid } from './components/JourneyGrid';
import { InteractiveMapSection } from './components/InteractiveMapSection';
import { DayDetailView } from './components/DayDetailView';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { Footer } from './components/Footer';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'stage'>('home');
  const [activeDay, setActiveDay] = useState<number>(1); // Default to Day 1

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [lightboxList, setLightboxList] = useState<GalleryPhoto[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleSelectStage = (dayNumber: number) => {
    setActiveDay(dayNumber);
    setCurrentView('stage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToMap = () => {
    const el = document.getElementById('topo-carte');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToStages = () => {
    const el = document.getElementById('les-etapes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenLightbox = (photo: GalleryPhoto, allPhotos: GalleryPhoto[]) => {
    setLightboxPhoto(photo);
    setLightboxList(allPhotos);
    setLightboxOpen(true);
  };

  const activeStageData = STAGES.find((s) => s.day === activeDay) || STAGES[0];

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#1b1c19] flex flex-col justify-between selection:bg-[#173028] selection:text-[#dee4de]">
      {/* Top Fixed / Sticky Navigation Bar */}
      <TopNavBar
        currentView={currentView}
        activeDay={activeDay}
        onNavigateHome={handleNavigateHome}
        onSelectStage={handleSelectStage}
        onScrollToMap={handleScrollToMap}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' ? (
          <div>
            {/* Hero Section */}
            <HeroSection
              onExploreClick={handleScrollToStages}
              onMapClick={handleScrollToMap}
            />

            {/* 8 Stages Grid */}
            <JourneyGrid
              onSelectStage={handleSelectStage}
              customPhotos={EPIC_ALBUM_PHOTOS}
            />

            {/* Interactive Topo Route & Elevation Map */}
            <InteractiveMapSection
              onSelectStage={handleSelectStage}
              highlightedDay={activeDay}
            />
          </div>
        ) : (
          <div>
            {/* Single Day Detailed Expedition Journal View */}
            <DayDetailView
              stage={activeStageData}
              onNavigateBack={handleNavigateHome}
              onSelectStage={handleSelectStage}
              onOpenLightbox={handleOpenLightbox}
              customPhotos={EPIC_ALBUM_PHOTOS}
            />
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        photo={lightboxPhoto}
        photosList={lightboxList}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectPhoto={(p) => setLightboxPhoto(p)}
      />

      {/* Global Footer */}
      <Footer
        onSelectStage={handleSelectStage}
        onNavigateHome={handleNavigateHome}
      />
    </div>
  );
}
export default App;

