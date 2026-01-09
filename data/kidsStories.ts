import stories from './kidsStories.json' assert { type: 'json' };

export type KidsStoryScene = {
  text: string;
  emoji: string;
};

export type KidsStory = {
  id: string;
  prophet: string;
  prophetArabic: string;
  title: string;
  emoji: string;
  colorKey: 'coral' | 'teal' | 'yellow' | 'green' | 'purple';
  scenes: KidsStoryScene[];
  lesson: string;
};

export default stories as KidsStory[];
