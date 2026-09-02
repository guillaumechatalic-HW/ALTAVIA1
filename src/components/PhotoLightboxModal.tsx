import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, ZoomIn } from 'lucide-react';
import { GalleryPhoto } from '../types/trail';
import { formatImageUrl } from '../utils/imageUrl';

interface PhotoLightboxModalProps {
  photo: GalleryPhoto | null;
  photosList: GalleryPhoto[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photo: GalleryPhoto) => void;
}

export const PhotoLightboxModal = ({
  photo,
  photosList,
  isOpen,
  onClose,
  onSelectPhoto,
}: PhotoLightboxModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        const currentIndex = photosList.findIndex((p) => p.url === photo.url);
        if (currentIndex < photosList.length - 1) {
          onSelectPhoto(photosList[currentIndex + 1]);
        }
      }
      if (e.key === 'ArrowLeft') {
        const currentIndex = photosList.findIndex((p) => p.url === photo.url);
        if (currentIndex > 0) {
          onSelectPhoto(photosList[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photo, photosList, onClose, onSelectPhoto]);

  if (!isOpen || !photo) return null;

  const currentIndex = photosList.findIndex((p) => p.url === photo.url);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photosList.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all focus:outline-none"
        aria-label="Fermer la vue"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          onClick={() => onSelectPhoto(photosList[currentIndex - 1])}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all focus:outline-none"
          aria-label="Photo précédente"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={() => onSelectPhoto(photosList[currentIndex + 1])}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all focus:outline-none"
          aria-label="Photo suivante"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Image and Caption Container */}
      <div className="max-w-5xl max-h-[92vh] flex flex-col items-center justify-center">
        <div className="relative overflow-hidden rounded-lg shadow-2xl flex items-center justify-center">
          <img
            src={formatImageUrl(photo.url)}
            alt={photo.alt}
            className="max-h-[70vh] sm:max-h-[74vh] w-auto object-contain rounded-lg border border-white/10"
          />
        </div>

        <div className="mt-3 text-center text-white max-w-3xl px-4 py-2 bg-black/60 backdrop-blur-xs rounded-xl border border-white/10 shadow-lg">
          <p className="text-xs sm:text-sm font-headline text-stone-100 leading-relaxed max-h-24 overflow-y-auto">
            {photo.caption}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] text-stone-400 font-ui">
            {photo.location && (
              <span className="flex items-center gap-1 text-[#ff8f6d] font-medium">
                <MapPin className="w-3 h-3 shrink-0" />
                {photo.location}
              </span>
            )}
            <span>•</span>
            <span>Photo {currentIndex + 1} sur {photosList.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
