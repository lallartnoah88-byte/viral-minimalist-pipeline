import React from 'react';
import { Html5Audio, Loop, Sequence, staticFile, useVideoConfig } from 'remotion';
import story from '../data/storyboards.json';
import voix from '../data/voix.json';
import { db } from './geometry';

export type VideoId =
  | 'Video1-MentalNoise'
  | 'Video2-MotivationIllusion'
  | 'Video3-PriceOfDifference'
  | 'Video4-PaycheckTrap';

/** Niveaux de l'architecture à 4 pistes (Module 05 du guide). */
export const LEVELS = {
  voice: -3, // Voix-off Henri (generateur_voix.py)
  impacts: -10, // Sub Drops + clics
  movements: -12, // Whooshes + Risers
  music: -24, // Drones
} as const;

const levelFor = (file: string) => (/Whoosh|Riser/.test(file) ? LEVELS.movements : LEVELS.impacts);

export const getVideo = (id: VideoId) => {
  const v = story.videos.find((x) => x.id === id);
  if (!v) throw new Error(`Storyboard introuvable : ${id}`);
  return v;
};

/**
 * Pose chaque effet sonore du storyboard à l'image exacte prévue (pistes 2 et 3)
 * pose la voix-off Henri (piste 1, generators/generateur_voix.py)
 * et boucle le drone sous toute la vidéo (piste 4).
 */
export const SfxTrack: React.FC<{ id: VideoId }> = ({ id }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const video = getVideo(id);
  const cues = video.scenes.flatMap((s) => s.sfx);
  return (
    <>
      <Loop durationInFrames={10 * fps}>
        <Html5Audio src={staticFile(`sfx/${video.music}`)} volume={db(LEVELS.music)} />
      </Loop>
      {(voix.videos[id] ?? []).map((clip) => (
        <Sequence key={clip.file} from={clip.frame} durationInFrames={clip.durationInFrames} layout="none">
          <Html5Audio src={staticFile(clip.file)} volume={db(LEVELS.voice)} />
        </Sequence>
      ))}
      {cues.map((cue, i) => (
        <Sequence key={`${cue.file}-${cue.frame}-${i}`} from={cue.frame} durationInFrames={Math.max(1, durationInFrames - cue.frame)} layout="none">
          <Html5Audio src={staticFile(`sfx/${cue.file}`)} volume={db(levelFor(cue.file))} />
        </Sequence>
      ))}
    </>
  );
};
