export interface Waypoint {
  id: string;
  name: string;
  altitude: number; // in meters
  distanceFromStart: number; // in km
  type: 'start' | 'pass' | 'refuge' | 'summit' | 'lake' | 'finish' | 'viewpoint';
  description?: string;
  coordinates: { x: number; y: number }; // percentage on topo canvas
  lat?: number;
  lng?: number;
}

export interface RifugioInfo {
  name: string;
  altitude: number;
  massif: string;
  description: string;
  badgeLabel?: string;
  beds?: number;
  foodHighlight?: string;
  amenities: string[];
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  websiteLabel?: string;
  guardianName?: string;
  imageUrl: string;
  imageAlt?: string;
}

export interface GalleryPhoto {
  url: string;
  alt: string;
  caption: string;
  location?: string;
  timeStr?: string;
  aspect?: 'wide' | 'tall' | 'square';
}

export interface Stage {
  day: number;
  slug: string;
  title: string;
  subtitle: string;
  routeLabel: string;
  dateLabel?: string;
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  durationHours: string;
  difficulty: 'Modéré' | 'Soutenu' | 'Exigeant' | 'Très Exigeant';
  highestPointM: number;
  heroImage: string;
  heroImageAlt: string;
  cardImage: string;
  cardImageAlt: string;
  cardSummary: string;
  introStory: string;
  secondStory: string;
  thirdStory?: string;
  fourthStory?: string;
  fifthStory?: string;
  sixthStory?: string;
  warningNote?: string;
  storyImages?: Array<{
    url: string;
    alt: string;
    caption: string;
    position: 'after-intro' | 'after-second' | 'after-third' | 'after-fourth' | 'after-fifth' | 'after-warning';
    aspect?: 'wide' | 'tall' | 'square';
  }>;
  middleImage: string;
  middleImageAlt: string;
  middleImageCaption: string;
  galleryPhotos: GalleryPhoto[];
  rifugio: RifugioInfo;
  waypoints: Waypoint[];
  highlights: string[];
  waterSources: string;
  escapeRoute?: string;
}

export interface CustomStagePhotos {
  heroImage?: string;
  middleImage?: string;
  cardImage?: string;
  galleryPhotos?: GalleryPhoto[];
}

export interface UserHikeProgress {
  completedDays: number[];
  dayNotes: Record<number, string>;
  dayDates: Record<number, string>;
  dayRatings: Record<number, number>;
  packedItems: string[];
  customPhotos?: Record<number, CustomStagePhotos>;
}
