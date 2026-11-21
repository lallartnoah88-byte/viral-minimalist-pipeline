import { Config } from '@remotion/cli/config';

// Rendu 3D logiciel (SwiftShader via ANGLE) : fonctionne sans GPU, sur serveur ou en CI.
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);
if (process.env.REMOTION_CONCURRENCY) {
  Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY));
}
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
