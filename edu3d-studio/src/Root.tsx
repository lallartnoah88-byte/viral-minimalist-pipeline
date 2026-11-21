import React from 'react';
import { Composition, Folder } from 'remotion';
import { Episode } from './Episode';
import type { Timeline } from './engine/types';
import eternuement from './episodes/eternuement.timeline.json';

// Chaque épisode = un timeline.json généré par tools/build_episode.py
const EPISODES: Timeline[] = [eternuement as unknown as Timeline];

export const RemotionRoot: React.FC = () => (
  <Folder name="Edu3D">
    {EPISODES.map((tl) => (
      <React.Fragment key={tl.slug}>
        <Composition
          id={tl.compositionId}
          component={Episode}
          defaultProps={{ timeline: tl, only: '' }}
          durationInFrames={tl.durationInFrames}
          fps={tl.fps}
          width={1080}
          height={1920}
        />
      </React.Fragment>
    ))}
  </Folder>
);
