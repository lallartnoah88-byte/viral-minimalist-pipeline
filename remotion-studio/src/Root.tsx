import React from 'react';
import { Composition, Folder } from 'remotion';
import story from './data/storyboards.json';
import { HEIGHT, WIDTH } from './components/geometry';
import { Video1_MentalNoise } from './videos/Video1_MentalNoise';
import { Video2_MotivationIllusion } from './videos/Video2_MotivationIllusion';
import { Video3_PriceOfDifference } from './videos/Video3_PriceOfDifference';
import { Video4_PaycheckTrap } from './videos/Video4_PaycheckTrap';

const durationOf = (id: string) => story.videos.find((v) => v.id === id)?.durationInFrames ?? 1980;

/** Format TikTok : 1080x1920, 30 fps, chaque vidéo entre 61 s et 90 s. */
const common = {
  fps: story.fps, // 30 fps
  width: WIDTH, // 1080
  height: HEIGHT, // 1920
};

export const RemotionRoot: React.FC = () => (
  <Folder name="Viral-Minimalist">
    <Composition id="Video1-MentalNoise" durationInFrames={durationOf('Video1-MentalNoise')} component={Video1_MentalNoise} {...common} />
    <Composition id="Video2-MotivationIllusion" durationInFrames={durationOf('Video2-MotivationIllusion')} component={Video2_MotivationIllusion} {...common} />
    <Composition id="Video3-PriceOfDifference" durationInFrames={durationOf('Video3-PriceOfDifference')} component={Video3_PriceOfDifference} {...common} />
    <Composition id="Video4-PaycheckTrap" durationInFrames={durationOf('Video4-PaycheckTrap')} component={Video4_PaycheckTrap} {...common} />
  </Folder>
);
