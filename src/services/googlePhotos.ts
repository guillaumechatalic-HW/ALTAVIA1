import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { parseDateFromAnyString, isDateInTrekRange } from '../utils/exifParser';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/photospicker.mediaitems.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

export interface GooglePhotoMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string; // ISO 8601 string or valid date
    width?: string;
    height?: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
      focalLength?: number;
      apertureFNumber?: number;
      isoEquivalent?: number;
      exposureTime?: string;
    };
  };
  productUrl?: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export class GooglePhotosService {
  /**
   * Listen to Firebase Auth state
   */
  static initAuth(
    onAuthSuccess?: (user: User, token: string) => void,
    onAuthFailure?: () => void
  ) {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  }

  /**
   * Sign in with Google Popup and obtain access token
   */
  static async signIn(): Promise<{ user: User; accessToken: string }> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Aucun jeton d’accès reçu de Google.');
      }

      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Erreur de connexion Google:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  /**
   * Get currently active access token
   */
  static getAccessToken(): string | null {
    return cachedAccessToken;
  }

  /**
   * Sign out and clear cached token
   */
  static async logout(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
  }

  /**
   * 1. Create a Google Photos Picker Session
   */
  static async createPickerSession(accessToken: string): Promise<{ id: string; pickerUri: string }> {
    const url = 'https://photospicker.googleapis.com/v1/sessions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Erreur Google Photos Picker ${res.status}`);
    }

    return await res.json();
  }

  /**
   * 2. Poll picker session to retrieve all selected items with full pagination
   */
  static async getPickerMediaItems(
    accessToken: string,
    sessionId: string,
    startDateStr?: string,
    strictDateFilter: boolean = false
  ): Promise<GooglePhotoMediaItem[]> {
    const allItems: GooglePhotoMediaItem[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}&pageSize=100${pageParam}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Erreur Photos Picker Items ${res.status}`);
      }

      const data = await res.json();
      const mediaItems = data.mediaItems || [];

      for (const item of mediaItems) {
        const rawTime = item.createTime || item.mediaFile?.mediaMetadata?.creationTime || item.mediaFile?.filename;
        const parsedDate = parseDateFromAnyString(rawTime, item.mediaFile?.filename) || new Date();

        if (strictDateFilter && startDateStr) {
          if (!isDateInTrekRange(parsedDate, startDateStr, 8)) {
            continue; // Skip out-of-range photo
          }
        }

        allItems.push({
          id: item.id || Math.random().toString(),
          baseUrl: item.mediaFile?.baseUrl || item.baseUrl || '',
          mimeType: item.mediaFile?.mimeType || 'image/jpeg',
          filename: item.mediaFile?.filename || 'Photo Alta Via',
          mediaMetadata: {
            creationTime: parsedDate.toISOString(),
            width: item.mediaFile?.mediaMetadata?.width,
            height: item.mediaFile?.mediaMetadata?.height,
          },
        });
      }

      pageToken = data.nextPageToken;
    } while (pageToken && allItems.length < 500);

    return allItems;
  }

  /**
   * 3. Fetch images from Google Drive matching the trek date range strictly
   */
  static async searchDrivePhotos(
    accessToken: string,
    startDateStr: string = '2025-06-22',
    searchTerm: string = '',
    strictDateFilter: boolean = true
  ): Promise<{ photos: GooglePhotoMediaItem[]; totalScanned: number; filteredOutCount: number }> {
    const allFiles: any[] = [];
    const fields = encodeURIComponent(
      'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, thumbnailLink, webContentLink, imageMediaMetadata)'
    );

    // Build smart queries for Google Drive
    const queryParts: string[] = ["mimeType contains 'image/'", 'trashed = false'];
    if (searchTerm.trim()) {
      queryParts.push(`name contains '${searchTerm.trim()}'`);
    }

    const queryStr = encodeURIComponent(queryParts.join(' and '));
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    try {
      // Loop pages to get files
      do {
        pageCount++;
        const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
        const url = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=${fields}&pageSize=100&orderBy=createdTime%20desc${tokenParam}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          break;
        }

        const data = await res.json();
        const files = data.files || [];
        allFiles.push(...files);
        pageToken = data.nextPageToken;
      } while (pageToken && pageCount < 6 && allFiles.length < 600);

      // Process and extract valid photo dates
      const results: GooglePhotoMediaItem[] = [];
      let filteredOutCount = 0;

      for (const file of allFiles) {
        // Priority 1: imageMediaMetadata.time ("YYYY:MM:DD HH:MM:SS")
        // Priority 2: Date extracted from filename (e.g. IMG_20250622_... or 2024-06-23)
        // Priority 3: file.createdTime or file.modifiedTime
        const exifRawTime = file.imageMediaMetadata?.time;
        const parsedDate =
          parseDateFromAnyString(exifRawTime, file.name) ||
          parseDateFromAnyString(file.createdTime, file.name) ||
          parseDateFromAnyString(file.modifiedTime, file.name);

        // If no valid date could be parsed, or if strict filter is ON and date is outside the 8-day trek
        if (!parsedDate) {
          filteredOutCount++;
          continue;
        }

        if (strictDateFilter) {
          const inRange = isDateInTrekRange(parsedDate, startDateStr, 8);
          if (!inRange) {
            filteredOutCount++;
            continue; // DISCARD photos from other years, months, or days!
          }
        }

        const highResThumb = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s2048') : '';

        results.push({
          id: file.id,
          baseUrl: highResThumb || file.webContentLink || '',
          mimeType: file.mimeType || 'image/jpeg',
          filename: file.name || 'Photo Dolomite',
          mediaMetadata: {
            creationTime: parsedDate.toISOString(),
            width: file.imageMediaMetadata?.width?.toString(),
            height: file.imageMediaMetadata?.height?.toString(),
            photo: {
              cameraMake: file.imageMediaMetadata?.cameraMake,
              cameraModel: file.imageMediaMetadata?.cameraModel,
              focalLength: file.imageMediaMetadata?.focalLength,
              apertureFNumber: file.imageMediaMetadata?.aperture,
              isoEquivalent: file.imageMediaMetadata?.isoSpeed,
              exposureTime: file.imageMediaMetadata?.exposureTime?.toString(),
            },
          },
        });
      }

      // Sort chronologically by actual shooting date
      results.sort((a, b) => {
        const tA = new Date(a.mediaMetadata.creationTime).getTime();
        const tB = new Date(b.mediaMetadata.creationTime).getTime();
        return tA - tB;
      });

      return {
        photos: results,
        totalScanned: allFiles.length,
        filteredOutCount,
      };
    } catch (e) {
      console.warn('Drive search error:', e);
      return { photos: [], totalScanned: 0, filteredOutCount: 0 };
    }
  }
}
