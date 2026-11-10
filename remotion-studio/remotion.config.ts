import { Config } from '@remotion/cli/config';

// Rendu vertical 1080x1920 à 30 fps, export anti-compression (voir Module 07 du guide).
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setVideoBitrate('25M');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);
Config.setConcurrency(2);

// Navigateur local optionnel (ex. Chromium Headless Shell de Playwright) défini par build_all.sh.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
