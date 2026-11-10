import React from 'react';
import { Composition, Folder } from 'remotion';
import story from './data/storyboards.json';
import { HEIGHT, WIDTH } from './components/geometry';
import { Video1_MentalNoise } from './videos/Video1_MentalNoise';
import { Video2_MotivationIllusion } from './videos/Video2_MotivationIllusion';
import { Video3_PriceOfDifference } from './videos/Video3_PriceOfDifference';
import { Video4_PaycheckTrap } from './videos/Video4_PaycheckTrap';

const common = {
  durationInFrames: story.durationInFrames, // 660 images = 22 s
  fps: story.fps, // 30 fps
  width: WIDTH, // 1080
  height: HEIGHT, // 1920
};

export const RemotionRoot: React.FC = () => (
  <Folder name="Viral-Minimalist">
    <Composition id="Video1-MentalNoise" component={Video1_MentalNoise} {...common} />
    <Composition id="Video2-MotivationIllusion" component={Video2_MotivationIllusion} {...common} />
    <Composition id="Video3-PriceOfDifference" component={Video3_PriceOfDifference} {...common} />
    {/* Vidéo bonus thème argent : 1830 images = 61 s */}
    <Composition
      id="Video4-PaycheckTrap"
      component={Video4_PaycheckTrap}
      {...common}
      durationInFrames={story.videos.find((v) => v.id === 'Video4-PaycheckTrap')?.durationInFrames ?? 1830}
    />
  </Folder>
);
