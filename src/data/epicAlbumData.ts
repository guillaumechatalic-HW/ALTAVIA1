import { CustomStagePhotos } from '../types/trail';
import { IMPORTED_ALBUM_PHOTOS as BASE_PHOTOS } from './importedAlbumData';
import { DAY_5_EPIC_PHOTOS } from './day5EpicData';
import { DAY_6_EPIC_PHOTOS } from './day6EpicData';
import { DAY_7_EPIC_PHOTOS } from './day7EpicData';
import { DAY_8_EPIC_PHOTOS } from './day8EpicData';

export const EPIC_ALBUM_PHOTOS: Record<number, CustomStagePhotos> = {
  ...BASE_PHOTOS,
  5: DAY_5_EPIC_PHOTOS,
  6: DAY_6_EPIC_PHOTOS,
  7: DAY_7_EPIC_PHOTOS,
  8: DAY_8_EPIC_PHOTOS,
};
