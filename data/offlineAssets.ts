export const kidsAudioAssets = [
  '/assets/kids/audio/story-adam-scene-0.mp3',
  '/assets/kids/audio/story-adam-scene-1.mp3',
  '/assets/kids/audio/story-adam-scene-2.mp3',
  '/assets/kids/audio/story-adam-lesson.mp3',
  '/assets/kids/audio/story-nuh-scene-0.mp3',
  '/assets/kids/audio/story-nuh-scene-1.mp3',
  '/assets/kids/audio/story-nuh-scene-2.mp3',
  '/assets/kids/audio/story-nuh-scene-3.mp3',
  '/assets/kids/audio/story-nuh-lesson.mp3',
  '/assets/kids/audio/story-ibrahim-scene-0.mp3',
  '/assets/kids/audio/story-ibrahim-scene-1.mp3',
  '/assets/kids/audio/story-ibrahim-scene-2.mp3',
  '/assets/kids/audio/story-ibrahim-lesson.mp3',
  '/assets/kids/audio/story-musa-scene-0.mp3',
  '/assets/kids/audio/story-musa-scene-1.mp3',
  '/assets/kids/audio/story-musa-scene-2.mp3',
  '/assets/kids/audio/story-musa-lesson.mp3',
  '/assets/kids/audio/story-yusuf-scene-0.mp3',
  '/assets/kids/audio/story-yusuf-scene-1.mp3',
  '/assets/kids/audio/story-yusuf-scene-2.mp3',
  '/assets/kids/audio/story-yusuf-lesson.mp3',
];

export const adultAudioAssets = [
  '/assets/adult/audio/seerah-beginning.mp3',
  '/assets/adult/audio/taif-mercy.mp3',
  '/assets/adult/audio/night-journey.mp3',
  '/assets/adult/audio/hijrah-cave.mp3',
  '/assets/adult/audio/madinah-brotherhood.mp3',
];

const shortSurahs = [105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
const offlineReciters = ['ar.alafasy', 'ar.husary', 'ar.minshawimujawwad'];

export const quranOfflineAssets = offlineReciters.flatMap((reciter) =>
  shortSurahs.flatMap((surah) => {
    const verseCountMap: Record<number, number> = {
      105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3, 111: 5, 112: 4, 113: 5, 114: 6,
    };
    const total = verseCountMap[surah];
    const files: string[] = [];
    for (let v = 1; v <= total; v++) {
      files.push(`/assets/quran/offline/${reciter}/${surah}/${v}.mp3`);
    }
    return files;
  })
);

export const offlineAssetManifest = [
  ...kidsAudioAssets,
  ...adultAudioAssets,
  ...quranOfflineAssets,
];
