export type Shot = {
  id: string;
  scene: string;
  params: Record<string, string | number | boolean>;
  from: number;
  dur: number;
  cues: Record<string, number>;
};

export type Timeline = {
  slug: string;
  compositionId: string;
  title: string;
  fps: number;
  durationInFrames: number;
  shots: Shot[];
  subs: Array<{ text: string; from: number; to: number }>;
};

/** Propriétés reçues par chaque scène 3D : image locale au plan + repères de mots. */
export type SceneProps = {
  f: number;
  dur: number;
  mode: string;
  params: Shot['params'];
  /** Image (locale au plan) où le narrateur prononce le mot donné (sans accents ni ponctuation). */
  cue: (word: string, fallback?: number) => number;
};

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const makeCue = (shot: Shot) => (word: string, fallback = 0) => {
  const k = strip(word);
  if (shot.cues[k] !== undefined) return shot.cues[k];
  const hit = Object.keys(shot.cues).find((c) => c.includes(k));
  return hit ? shot.cues[hit] : fallback;
};
