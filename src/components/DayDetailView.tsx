import { useState } from 'react';
import { Stage, GalleryPhoto, CustomStagePhotos } from '../types/trail';
import confetti from 'canvas-confetti';
import { StageElevationProfile } from './StageElevationProfile';
import { formatImageUrl } from '../utils/imageUrl';
import {
  ArrowLeft,
  ArrowRight,
  Mountain,
  Clock,
  TrendingDown,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Phone,
  Bed,
  Bus,
  Globe,
  ExternalLink,
  UtensilsCrossed,
  Droplets,
  AlertTriangle,
  Mail,
  Sparkles,
  Maximize2,
  Share2,
  Check,
  Bookmark,
  Calendar,
} from 'lucide-react';

interface DayDetailViewProps {
  stage: Stage;
  onNavigateBack: () => void;
  onSelectStage: (dayNumber: number) => void;
  onOpenLightbox: (photo: GalleryPhoto, allPhotos: GalleryPhoto[]) => void;
  customPhotos?: Record<number, CustomStagePhotos>;
  onOpenPhotoImport?: (dayNumber: number) => void;
}

export const DayDetailView = ({
  stage,
  onNavigateBack,
  onSelectStage,
  onOpenLightbox,
  customPhotos = {},
}: DayDetailViewProps) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const hasPrev = stage.day > 1;
  const hasNext = stage.day < 8;

  // Custom photo overrides
  const dayCustom = customPhotos[stage.day];
  const heroImage = dayCustom?.heroImage || stage.heroImage;
  const middleImage = dayCustom?.middleImage || stage.middleImage;
  const galleryPhotos = dayCustom?.galleryPhotos || stage.galleryPhotos;

  return (
    <article className="py-6 px-4 md:px-8 max-w-5xl mx-auto animate-fade-in">
      {/* Top Bar with Back Button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#c2c8c4]/40">
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 text-xs font-ui font-semibold text-[#173028] hover:text-[#7c2000] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Retour à la vue d'ensemble</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 font-ui text-xs">
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-[#f0eee9] hover:bg-[#eae8e3] text-[#5a605b] border border-[#c2c8c4]/40 transition-colors flex items-center gap-1.5 px-3"
            title="Partager cette étape"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Lien copié !' : 'Partager'}</span>
          </button>
        </div>
      </div>

      {/* Route Badge & Titles */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[#7c2000] uppercase">
            {stage.routeLabel}
          </span>
          {stage.dateLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#173028]/10 text-[#173028] text-xs font-ui font-semibold">
              <Calendar className="w-3 h-3 text-[#7c2000]" />
              <span>{stage.dateLabel}</span>
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-[#173028] tracking-tight leading-[1.1] mb-2">
          {stage.title}
        </h1>
        <p className="text-base md:text-lg font-serif-body text-[#5a605b] italic">
          {stage.subtitle}
        </p>
      </div>

      {/* 4 Pillars Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-xl p-3 text-center">
          <span className="text-[10px] text-[#5a605b] uppercase font-ui font-semibold block">Distance</span>
          <span className="text-xl font-bold font-headline text-[#173028]">{stage.distanceKm} km</span>
        </div>
        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-xl p-3 text-center">
          <span className="text-[10px] text-[#5a605b] uppercase font-ui font-semibold block">Dénivelé +</span>
          <span className="text-xl font-bold font-headline text-[#7c2000]">+{stage.elevationGainM} m</span>
        </div>
        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-xl p-3 text-center">
          <span className="text-[10px] text-[#5a605b] uppercase font-ui font-semibold block">Dénivelé -</span>
          <span className="text-xl font-bold font-headline text-[#5a605b]">-{stage.elevationLossM} m</span>
        </div>
        <div className="bg-[#f0eee9] border border-[#c2c8c4]/40 rounded-xl p-3 text-center">
          <span className="text-[10px] text-[#5a605b] uppercase font-ui font-semibold block">Durée estimée</span>
          <span className="text-xl font-bold font-headline text-[#173028]">{stage.durationHours}</span>
        </div>
      </div>

      {/* Hero Banner Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#c2c8c4]/40 mb-10 image-depth">
        <div className="aspect-16/9 md:aspect-21/9 max-h-[480px] w-full relative">
          <img
            src={formatImageUrl(heroImage)}
            alt={stage.heroImageAlt}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() =>
              onOpenLightbox(
                { url: heroImage, alt: stage.heroImageAlt, caption: stage.heroImageAlt },
                [
                  { url: heroImage, alt: stage.heroImageAlt, caption: stage.heroImageAlt },
                  ...galleryPhotos,
                ]
              )
            }
            className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg text-xs font-ui flex items-center gap-1.5 transition-colors backdrop-blur-xs"
            title="Agrandir la photo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plein écran</span>
          </button>
        </div>
        <div className="bg-[#f0eee9] px-4 py-2 text-[11px] text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
          <span className="italic">{stage.heroImageAlt}</span>
          <span className="font-mono">Alta Via 1 • {stage.dateLabel || 'Dolomites'}</span>
        </div>
      </div>

      {/* Story Text Section with Drop Cap, Rich Paragraphs & Inline Highlights */}
      <div className="prose prose-stone max-w-none mb-10 text-[#1b1c19]">
        <p className="drop-cap font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify mb-6">
          {stage.introStory}
        </p>

        {/* Story Images after intro story if present */}
        {stage.storyImages?.filter(img => img.position === 'after-intro').map((img, idx) => (
          <div key={`img-intro-${idx}`} className="my-6 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-xs">
            <div className={`${img.aspect === 'tall' ? 'aspect-4/3 max-h-[420px]' : 'aspect-16/9 max-h-[380px]'} w-full bg-[#f0eee9]`}>
              <img
                src={formatImageUrl(img.url)}
                alt={img.alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox(img, galleryPhotos)}
              />
            </div>
            <div className="bg-[#f0eee9] p-2.5 px-3.5 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{img.caption}</span>
              <span className="text-[11px] text-[#727975] italic">Agrandir</span>
            </div>
          </div>
        ))}

        {/* Middle Highlight Image (only if no storyImages after-intro exist to avoid double display) */}
        {middleImage && (!stage.storyImages || stage.storyImages.length === 0) && (
          <div className="my-8 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-md">
            <div className="aspect-16/9 max-h-[380px] w-full">
              <img
                src={formatImageUrl(middleImage)}
                alt={stage.middleImageAlt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() =>
                  onOpenLightbox(
                    {
                      url: middleImage,
                      alt: stage.middleImageAlt,
                      caption: stage.middleImageCaption,
                    },
                    galleryPhotos
                  )
                }
              />
            </div>
            <div className="bg-[#f0eee9] p-3 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{stage.middleImageCaption}</span>
              <span className="text-[11px] text-[#727975] italic">Cliquez pour agrandir</span>
            </div>
          </div>
        )}

        <p className="font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify mb-6">
          {stage.secondStory}
        </p>

        {/* Story Images after second story if present */}
        {stage.storyImages?.filter(img => img.position === 'after-second').map((img, idx) => (
          <div key={`img-sec-${idx}`} className="my-6 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-xs">
            <div className={`${img.aspect === 'tall' ? 'aspect-4/3 max-h-[420px]' : 'aspect-16/9 max-h-[380px]'} w-full bg-[#f0eee9]`}>
              <img
                src={formatImageUrl(img.url)}
                alt={img.alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox(img, galleryPhotos)}
              />
            </div>
            <div className="bg-[#f0eee9] p-2.5 px-3.5 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{img.caption}</span>
              <span className="text-[11px] text-[#727975] italic">Agrandir</span>
            </div>
          </div>
        ))}

        {stage.thirdStory && (
          <p className="font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify mb-6">
            {stage.thirdStory}
          </p>
        )}

        {/* Story Images after third story if present */}
        {stage.storyImages?.filter(img => img.position === 'after-third').map((img, idx) => (
          <div key={`img-third-${idx}`} className="my-6 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-xs">
            <div className={`${img.aspect === 'tall' ? 'aspect-4/3 max-h-[420px]' : 'aspect-16/9 max-h-[380px]'} w-full bg-[#f0eee9]`}>
              <img
                src={formatImageUrl(img.url)}
                alt={img.alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox(img, galleryPhotos)}
              />
            </div>
            <div className="bg-[#f0eee9] p-2.5 px-3.5 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{img.caption}</span>
              <span className="text-[11px] text-[#727975] italic">Agrandir</span>
            </div>
          </div>
        ))}

        {/* Safety / History Warning Note Banner if defined */}
        {stage.warningNote && (
          <div className="my-6 p-4 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-sans leading-relaxed">
              <span className="font-bold text-amber-900 block mb-0.5 font-ui">Avertissement & Recommandation :</span>
              <p className="font-serif-body italic text-[#442c05]">{stage.warningNote}</p>
            </div>
          </div>
        )}

        {stage.fourthStory && (
          <p className="font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify mb-6">
            {stage.fourthStory}
          </p>
        )}

        {/* Story Images after fourth story if present */}
        {stage.storyImages?.filter(img => img.position === 'after-fourth').map((img, idx) => (
          <div key={`img-fourth-${idx}`} className="my-6 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-xs">
            <div className={`${img.aspect === 'tall' ? 'aspect-4/3 max-h-[420px]' : 'aspect-16/9 max-h-[380px]'} w-full bg-[#f0eee9]`}>
              <img
                src={formatImageUrl(img.url)}
                alt={img.alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox(img, galleryPhotos)}
              />
            </div>
            <div className="bg-[#f0eee9] p-2.5 px-3.5 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{img.caption}</span>
              <span className="text-[11px] text-[#727975] italic">Agrandir</span>
            </div>
          </div>
        ))}

        {stage.fifthStory && (
          <p className="font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify mb-6">
            {stage.fifthStory}
          </p>
        )}

        {/* Story Images after fifth story if present */}
        {stage.storyImages?.filter(img => img.position === 'after-fifth').map((img, idx) => (
          <div key={`img-fifth-${idx}`} className="my-6 rounded-xl overflow-hidden border border-[#c2c8c4]/40 shadow-xs">
            <div className={`${img.aspect === 'tall' ? 'aspect-4/3 max-h-[420px]' : 'aspect-16/9 max-h-[380px]'} w-full bg-[#f0eee9]`}>
              <img
                src={formatImageUrl(img.url)}
                alt={img.alt}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox(img, galleryPhotos)}
              />
            </div>
            <div className="bg-[#f0eee9] p-2.5 px-3.5 text-xs text-[#5a605b] font-ui border-t border-[#c2c8c4]/40 flex items-center justify-between">
              <span className="font-medium text-[#173028]">{img.caption}</span>
              <span className="text-[11px] text-[#727975] italic">Agrandir</span>
            </div>
          </div>
        ))}

        {stage.sixthStory && (
          <p className="font-serif-body text-base md:text-lg leading-relaxed text-[#1b1c19] text-justify">
            {stage.sixthStory}
          </p>
        )}
      </div>

      {/* Gallery Section */}
      {galleryPhotos && galleryPhotos.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7c2000]" />
              <h2 className="font-headline font-bold text-xl text-[#173028]">
                Galerie Photographique de l’Étape
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPhotos.map((photo, idx) => (
              <div
                key={idx}
                onClick={() => onOpenLightbox(photo, galleryPhotos)}
                className="group relative rounded-xl overflow-hidden cursor-pointer aspect-4/3 bg-[#f0eee9] border border-[#c2c8c4]/40 shadow-xs hover:shadow-md transition-shadow"
              >
                <img
                  src={formatImageUrl(photo.url)}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <p className="text-xs font-medium line-clamp-1">{photo.caption}</p>
                  {photo.location && (
                    <p className="text-[10px] text-[#ff8f6d] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{photo.location}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Refuge Feature Card */}
      <section className="bg-[#f0eee9] border border-[#c2c8c4]/50 rounded-2xl p-6 sm:p-8 mb-12 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-1/3 rounded-xl overflow-hidden shadow-md aspect-4/3 relative bg-[#eae8e3]">
            <img
              src={formatImageUrl(stage.rifugio.imageUrl)}
              alt={stage.rifugio.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() =>
                onOpenLightbox(
                  {
                    url: formatImageUrl(stage.rifugio.imageUrl),
                    alt: stage.rifugio.name,
                    caption: `${stage.rifugio.name} (${stage.rifugio.altitude} m) - ${stage.rifugio.massif}`,
                    location: stage.rifugio.name,
                  },
                  galleryPhotos
                )
              }
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = formatImageUrl(heroImage);
                }
              }}
            />
            <div className="absolute top-2 left-2 bg-[#173028]/85 backdrop-blur-xs text-white text-[10px] font-ui px-2 py-0.5 rounded-full font-bold">
              {stage.rifugio.altitude} m
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-ui text-[#7c2000] font-semibold uppercase tracking-wider">
                {stage.rifugio.badgeLabel ? (
                  <>
                    <Bus className="w-3.5 h-3.5" />
                    <span>{stage.rifugio.badgeLabel}</span>
                  </>
                ) : (
                  <>
                    <Bed className="w-3.5 h-3.5" />
                    <span>Nuitée en Refuge</span>
                  </>
                )}
              </div>
              <h3 className="text-2xl font-headline font-bold text-[#173028] mt-0.5">
                {stage.rifugio.name}
              </h3>
              <p className="text-xs text-[#5a605b] font-ui">
                Massif : {stage.rifugio.massif}
              </p>
            </div>

            <p className="text-sm font-serif-body text-[#1b1c19] leading-relaxed">
              {stage.rifugio.description}
            </p>

            {/* Food Highlight if available */}
            {stage.rifugio.foodHighlight && (
              <div className="bg-[#fcfbf9] p-3.5 rounded-xl border border-[#c2c8c4]/40 flex items-start gap-3">
                <UtensilsCrossed className="w-4 h-4 text-[#7c2000] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-ui font-bold text-[#173028] block">Spécialité culinaire :</span>
                  <span className="text-xs text-[#424845] font-serif-body italic">{stage.rifugio.foodHighlight}</span>
                </div>
              </div>
            )}

            {/* Amenities List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {stage.rifugio.amenities.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/70 border border-[#c2c8c4]/50 rounded-lg text-[11px] font-ui text-[#424845]"
                >
                  ✓ {item}
                </span>
              ))}
            </div>

            {/* Contacts & External Links */}
            {(stage.rifugio.contactPhone || stage.rifugio.contactEmail || stage.rifugio.websiteUrl) && (
              <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-ui text-[#5a605b]">
                {stage.rifugio.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#173028]" />
                    <span>Tél : <a href={`tel:${stage.rifugio.contactPhone}`} className="font-bold text-[#173028] hover:underline">{stage.rifugio.contactPhone}</a></span>
                  </div>
                )}
                {stage.rifugio.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#173028]" />
                    <span>Email : <a href={`mailto:${stage.rifugio.contactEmail}`} className="font-bold text-[#173028] hover:underline">{stage.rifugio.contactEmail}</a></span>
                  </div>
                )}
                {stage.rifugio.websiteUrl && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#7c2000]" />
                    <a
                      href={stage.rifugio.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#7c2000] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{stage.rifugio.websiteLabel || 'Site officiel'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Topography & Elevation Profile Section (Styled after alpine reference) */}
      <section className="mb-12">
        <StageElevationProfile
          waypoints={stage.waypoints}
          totalDistanceKm={stage.distanceKm}
          stageTitle={stage.title}
          stageDay={stage.day}
          elevationGainM={stage.elevationGainM}
          elevationLossM={stage.elevationLossM}
          highestPointM={stage.highestPointM}
          onPrevDay={() => {
            if (stage.day > 1) {
              onSelectStage(stage.day - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNextDay={() => {
            if (stage.day < 8) {
              onSelectStage(stage.day + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onSelectDay={(d) => {
            onSelectStage(d);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </section>

      {/* Waypoints Table */}
      <section className="mb-12">
        <h3 className="font-headline font-bold text-xl text-[#173028] mb-4">
          Profil des Points de Passage
        </h3>
        <div className="bg-white border border-[#c2c8c4]/40 rounded-xl overflow-hidden shadow-xs">
          <div className="divide-y divide-[#c2c8c4]/30 font-ui text-xs">
            {stage.waypoints.map((wp, i) => (
              <div key={wp.id} className="p-3 sm:px-4 flex items-center justify-between hover:bg-[#fbf9f4] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#173028] text-white flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-[#173028] block sm:inline">{wp.name}</span>
                    {wp.description && (
                      <span className="text-[11px] text-[#5a605b] sm:ml-2 block sm:inline">
                        — {wp.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <span className="font-mono text-[#5a605b]">{wp.distanceFromStart} km</span>
                  <span className="font-mono font-bold text-[#7c2000]">{wp.altitude} m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practical Advice Section */}
      <div className={`grid grid-cols-1 ${stage.escapeRoute ? 'sm:grid-cols-2' : ''} gap-4 mb-12`}>
        <div className="p-4 rounded-xl bg-[#f0eee9] border border-[#c2c8c4]/40 flex items-start gap-3">
          <Droplets className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-ui font-bold text-[#173028] block">Points d'eau sur le parcours</span>
            <span className="text-xs text-[#424845] font-serif-body">{stage.waterSources}</span>
          </div>
        </div>

        {stage.escapeRoute && (
          <div className="p-4 rounded-xl bg-[#f0eee9] border border-[#c2c8c4]/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-ui font-bold text-[#173028] block">Échappatoires & Sécurité</span>
              <span className="text-xs text-[#424845] font-serif-body">{stage.escapeRoute}</span>
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next Stage Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-[#c2c8c4]/50 font-ui text-xs">
        {hasPrev ? (
          <button
            onClick={() => onSelectStage(stage.day - 1)}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#f0eee9] hover:bg-[#eae8e3] text-[#173028] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#7c2000]" />
            <span>Jour {stage.day - 1} précédent</span>
          </button>
        ) : (
          <div />
        )}

        {hasNext ? (
          <button
            onClick={() => onSelectStage(stage.day + 1)}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#173028] hover:bg-[#2d463e] text-white font-semibold transition-colors"
          >
            <span>Jour {stage.day + 1} suivant</span>
            <ArrowRight className="w-4 h-4 text-[#ff8f6d]" />
          </button>
        ) : (
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 p-3 rounded-xl bg-[#7c2000] hover:bg-[#9e2c00] text-white font-semibold transition-colors"
          >
            <span>Trek terminé ! Voir le carnet</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
};
