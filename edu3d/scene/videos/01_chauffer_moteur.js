// Vidéo 01 — « Faut-il laisser chauffer sa voiture avant de partir en hiver ? »
// Plan-séquence continu dans le garage (style de la référence), chaque action est calée sur un mot de la voix off.
import * as THREE from 'three';
import { CameraRig, pop, life, prog, smooth, easeInOut, easeOut, easeIn, drop, lerp, clamp, keyTrack } from '../lib/core.js';
import { buildGarage, buildSnowfall, GARAGE, mat, rbox, cyl } from '../lib/garage.js';
import {
  makeStand, makeEngine, makeCar, makeGauge, makeClock, makeJerrycan, makeECU, makeAirCleaner, makeInjector, makeBuckle,
  BeadFlow, Sparkles, Puffs, Confetti,
} from '../lib/props.js';

export function build(scene, camera, C) {
  const env = buildGarage(scene);
  const snowfall = buildSnowfall(scene);
  const E = new THREE.Vector3(-1.5, 1.45, -1.0); // centre du bloc moteur
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const at = (o) => E.clone().add(o);

  // ---------- Objets ----------
  const stand = makeStand(); stand.position.set(E.x, 0, E.z); scene.add(stand);
  const engine = makeEngine(); engine.position.copy(E); scene.add(engine);
  const car = makeCar(); scene.add(car);
  const CAR0 = V(3.9, 0, -1.6);
  const tempG = makeGauge('temp'); scene.add(tempG);
  const tachG = makeGauge('rpm'); scene.add(tachG);
  const clock = makeClock(); scene.add(clock);
  const can = makeJerrycan(); scene.add(can);
  const ecu = makeECU(); scene.add(ecu);
  const cleaner = makeAirCleaner(); scene.add(cleaner);
  const injectors = [0, 1, 2, 3].map(() => { const j = makeInjector(); scene.add(j); return j; });
  const buckle = makeBuckle(); scene.add(buckle);
  const canIcon = makeJerrycan(); scene.add(canIcon);
  const engIcon = makeEngine(); engIcon.setHeat(0); engIcon.setGlass(0); scene.add(engIcon);
  // bornes kilométriques le long de la route
  const posts = [];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Group();
    const b = rbox(0.22, 1.0, 0.22, 0.05, mat('#FFFFFF')); b.position.y = 0.5; p.add(b);
    const tp = rbox(0.23, 0.22, 0.23, 0.05, mat('#E2473D')); tp.position.y = 0.95; p.add(tp);
    p.position.set(-3.9, 0, GARAGE.z1 + 8 + i * 7); scene.add(p); posts.push(p);
  }

  const sparkA = new Sparkles(scene, 16, '#FFFFFF');
  const sparkB = new Sparkles(scene, 16, '#FFE28A');
  const smoke = new Puffs(scene, 12, '#4A4A50');
  const steam = new Puffs(scene, 10, '#F3F0EC');
  const confetti = new Confetti(scene, 180);

  // ---------- Flux lumineux ----------
  const xs = [-0.6, -0.2, 0.2, 0.6];
  const exhaust = new BeadFlow(scene, [[-2.1, 1.75, -0.5], [-1.5, 1.73, -0.46], [-0.9, 1.75, -0.5], [-0.55, 1.55, -0.38], [-0.45, 1.0, -0.3], [-0.3, 0.3, -0.1], [0.4, 0.12, 0.6]], { color: '#FF8A4C', n: 34 });
  const oilLocal = [[0.72, -0.6, 0.3], [0.76, 0.0, 0.33], [0.7, 0.48, 0.3], [0, 0.56, 0.36], [-0.7, 0.48, 0.3], [-0.76, 0, 0.33], [-0.72, -0.6, 0.3], [0, -0.7, 0.34]];
  const oilFlow = new BeadFlow(scene, oilLocal.map(([x, y, z]) => [E.x + x, E.y + y, E.z + z]), { color: '#FFC23A', n: 36, closed: true, r: 0.03, halo: 0.12 });
  const canTip = V(-2.25, 2.55, -0.95);
  const fuelPour = new BeadFlow(scene, [[canTip.x, canTip.y, canTip.z], [-1.95, 2.62, -1.0], [-1.65, 2.42, -1.0], [-1.5, 2.12, -1.0]], { color: '#FF4F7B', n: 14, r: 0.03, halo: 0.12 });
  const inject = xs.map((x) => new BeadFlow(scene, [[E.x + x, E.y + 0.95, E.z], [E.x + x, E.y + 0.7, E.z], [E.x + x, E.y + 0.35, E.z]], { color: '#FF4F7B', n: 8, r: 0.026, halo: 0.1 }));
  const drips = xs.map((x) => new BeadFlow(scene, [[E.x + x + 0.14, E.y + 0.3, E.z + 0.1], [E.x + x + 0.16, E.y - 0.1, E.z + 0.12], [E.x + x + 0.15, E.y - 0.5, E.z + 0.1], [E.x + x + 0.05, E.y - 0.66, E.z + 0.05]], { color: '#FF4F7B', n: 9, r: 0.024, halo: 0.1 }));
  const ecuPos = V(0.15, 2.05, -0.55);
  const wire = new BeadFlow(scene, [[ecuPos.x - 0.25, ecuPos.y, ecuPos.z], [-0.45, 2.35, -0.8], [-0.95, 2.4, -1.0], [-1.5, 2.25, -1.0]], { color: '#38F28E', n: 16, r: 0.025, halo: 0.11 });
  const carHeat = new BeadFlow(scene, [[-0.8, 0.95, 0.6], [0.0, 1.0, 0.5], [0.8, 0.95, 0.6], [0.85, 0.92, 1.6], [0, 0.95, 1.9], [-0.85, 0.92, 1.6]], { color: '#FF7A3C', n: 26, closed: true, r: 0.035, halo: 0.15 });

  // ---------- Mouvement de la voiture (vitesse intégrée) ----------
  const tGo = C.w('how1', -1), tStop = C.seg('exc1') + 0.2, tGo2 = C.w('end1', 2);
  const speed = (t) => {
    if (t < tGo) return 0;
    if (t < tStop - 1.1) return 6.5 * smooth((t - tGo) / 1.6);
    if (t < tStop) return 6.5 * (1 - smooth((t - (tStop - 1.1)) / 1.1));
    if (t < tGo2) return 0;
    return 9 * smooth((t - tGo2) / 2.0);
  };
  const table = [0]; const DT = 1 / 120;
  for (let i = 1; i < 120 * 60; i++) table.push(table[i - 1] + speed(i * DT) * DT);
  const carZ = (t) => CAR0.z + table[Math.max(0, Math.min(table.length - 1, Math.round(t * 120)))];
  const carP = (t) => V(CAR0.x, 0, carZ(t));

  // ---------- Caméra (plan-séquence, aucune coupe) ----------
  const cp = (t, dx, dy, dz) => { const p = carP(t); return [p.x + dx, p.y + dy, p.z + dz]; };
  const keys = [
    { t: 0.0, pos: [9, 12, 34], look: [-0.6, 1.4, -1], fov: 36 },
    { t: 1.0, pos: [5.5, 9.0, 22], look: [-0.8, 1.4, -1], fov: 38 },
    { t: C.w('hook1', 6), pos: [1.2, 3.6, 8.2], look: [-1.4, 1.6, -1], fov: 40 },
    { t: C.w('hook1', 9), pos: [-0.1, 2.6, 4.4], look: [-1.5, 1.75, -1], fov: 40 },
    { t: C.w('hook1', -1), pos: [-1.1, 2.25, 3.15], look: [-1.5, 1.65, -1], fov: 40 },
    { t: C.w('hook2', 2) + 0.3, pos: [-0.35, 2.2, 3.1], look: [-1.15, 1.85, -1], fov: 40 },
    { t: C.seg('why1'), pos: [-0.9, 2.15, 2.7], look: [-1.3, 1.75, -1], fov: 40 },
    { t: C.w('why1', 5), pos: [-1.55, 2.2, 1.7], look: [-1.5, 1.5, -1], fov: 40 },
    { t: C.seg('why2') + 0.6, pos: [-2.45, 2.3, 1.8], look: [-1.5, 1.5, -1], fov: 40 },
    { t: C.seg('why3') + 0.4, pos: [-2.3, 2.6, 2.45], look: [-1.6, 1.85, -1], fov: 40 },
    { t: C.seg('dil1'), pos: [-1.3, 2.7, 2.6], look: [-1.4, 1.85, -1], fov: 40 },
    { t: C.w('dil1', 6), pos: [-0.35, 2.6, 2.45], look: [-0.9, 1.85, -1], fov: 40 },
    { t: C.seg('dil2'), pos: [-1.15, 2.25, 2.05], look: [-1.5, 1.45, -1], fov: 40 },
    { t: C.w('dil2', 8), pos: [-1.6, 1.45, 1.75], look: [-1.5, 1.0, -1], fov: 40 },
    { t: C.seg('dil3') + 0.5, pos: [-1.5, 1.15, 1.3], look: [-1.5, 0.9, -1], fov: 35 },
    { t: C.w('old1', 3), pos: [-0.55, 2.65, 3.5], look: [-1.5, 1.85, -1], fov: 40 },
    { t: C.w('old2', 6), pos: [-0.95, 2.5, 3.0], look: [-1.5, 1.95, -1], fov: 40 },
    { t: C.w('old3', 3), pos: [-2.2, 2.65, 2.7], look: [-1.5, 1.95, -1], fov: 40 },
    { t: C.seg('how1'), pos: [-1.3, 2.5, 3.6], look: [-0.5, 1.6, -1], fov: 40 },
    { t: C.w('how1', 3), pos: [1.3, 2.0, 4.4], look: [3.9, 1.0, -0.8], fov: 40 },
    { t: C.w('how1', -1), pos: [1.9, 1.9, 3.7], look: [3.6, 1.1, 0.4], fov: 40 },
    { t: C.w('how2', 3), pos: cp(C.w('how2', 3), -3.6, 2.4, 6.0), look: cp(C.w('how2', 3), 0, 0.9, 1.5), fov: 42 },
    { t: C.seg('how3'), pos: cp(C.seg('how3'), -4.3, 3.0, 6.8), look: cp(C.seg('how3'), 0, 1.0, 1.5), fov: 42 },
    { t: C.segEnd('how3'), pos: cp(C.segEnd('how3'), -3.0, 2.6, 6.2), look: cp(C.segEnd('how3'), 0, 1.0, 1.0), fov: 42 },
    { t: C.w('exc1', 4), pos: cp(tStop, -0.1, 2.15, 3.3), look: cp(tStop, 0, 1.05, 0.5), fov: 40 },
    { t: C.segEnd('exc1'), pos: cp(tStop, 0.05, 2.0, 2.9), look: cp(tStop, 0, 1.05, 0.5), fov: 40 },
    { t: C.w('end1', 3), pos: cp(tStop, -3.4, 4.6, 8.5), look: cp(tStop, 0, 1.2, 1), fov: 42 },
    { t: C.duration, pos: cp(C.duration, -4.5, 5.2, 11), look: cp(C.duration, 0.2, 2.0, 0), fov: 42 },
  ];
  // recul général : la référence garde le décor visible autour du sujet
  for (const k of keys) {
    const zoomOut = k.t > 1.2 && k.t < C.seg('how1') + 0.1 ? 1.5 : k.t > C.w('exc1', 3) && k.t < C.seg('end1') ? 2.2 : 1;
    if (zoomOut !== 1) k.pos = k.pos.map((v, i) => k.look[i] + (v - k.look[i]) * zoomOut);
  }
  const rig = new CameraRig(camera, keys);
  rig.addShake(C.w('hook2', 2), 0.07, 0.4);
  rig.addShake(C.w('dil1', 0), 0.05, 0.35);
  rig.addShake(C.w('old2', 7), 0.06, 0.5);

  // ---------- Bruitages (calés sur les actions) ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(0.02, 'whoosh_long', 1); S(C.w('hook1', 3), 'sparkle', 0.8); S(C.w('hook1', 3), 'ice', 0.9);
  S(C.w('hook1', 5), 'start', 0.8); S(C.w('hook1', 6), 'pop'); S(C.w('hook1', 6) + 0.2, 'clock', 0.8);
  S(C.w('hook1', 14) - 0.1, 'whoosh', 0.9); S(C.w('hook1', 15), 'fire', 0.7);
  S(C.w('hook2', 2), 'scratch', 1); S(C.w('hook2', 2), 'thud', 0.9);
  S(C.w('hook3', 0), 'pop'); S(C.w('hook3', -1), 'tick', 0.8);
  S(C.seg('why1') + 0.1, 'whoosh', 0.7); S(C.w('why1', 5), 'boom', 0.8); S(C.w('why1', 5) + 0.25, 'boom', 0.6); S(C.w('why1', 5) + 0.5, 'boom', 0.5);
  S(C.w('why3', 0), 'pop'); S(C.w('why3', 2), 'pour', 0.6); S(C.w('why3', -1), 'tick', 0.6);
  S(C.w('dil1', 0), 'thud', 0.8); S(C.w('dil1', 5), 'pop'); S(C.w('dil1', 5) + 0.15, 'beep', 0.7); S(C.w('dil1', 6), 'pour', 0.8);
  for (let i = 0; i < 6; i++) S(C.w('dil2', 6) + i * 0.32, 'drip', 0.7);
  S(C.w('dil2', -1), 'bloop', 0.9); S(C.w('dil3', 3), 'sparkle', 0.8);
  S(C.seg('old1'), 'whoosh', 0.7); S(C.w('old1', 3), 'fall', 0.9); S(C.w('old1', 3) + 0.42, 'clank', 1);
  S(C.w('old2', 5), 'sputter', 1); S(C.w('old2', 6), 'stall', 1);
  S(C.w('old3', 1), 'whoosh', 0.9); for (let i = 0; i < 4; i++) S(C.w('old3', 1) + 0.35 + i * 0.14, 'click', 0.8);
  S(C.w('old3', 2), 'sparkle', 0.7); S(C.w('old3', -1), 'ding', 0.8); S(C.w('old3', -1), 'idle', 0.6);
  S(C.seg('how1') + 0.3, 'whoosh', 0.8); S(C.w('how1', 3), 'start', 1); S(C.w('how1', 5) + 0.25, 'buckle', 1); S(C.w('how1', -1), 'drive', 0.8);
  S(C.w('how2', 3), 'pop'); S(C.w('how3', 0), 'pop'); S(C.w('how3', 5), 'rise', 0.8);
  S(tStop - 1.0, 'brake', 0.6); S(C.w('exc1', 6) - 0.25, 'ice', 1); S(C.w('exc1', 6), 'sparkle', 0.7); S(C.w('exc1', 7), 'defrost', 0.8);
  S(C.w('end1', 0), 'confetti', 1); S(C.w('end1', 0), 'whoosh_long', 0.8); S(C.w('end1', -1), 'pop'); S(C.w('end2', 0), 'pop'); S(C.w('end2', -1), 'ding', 0.9);

  // ---------- Pistes d'état ----------
  const tGel = C.w('hook1', 3), tChaud = C.w('hook1', 14), tNon = C.w('hook2', 2);
  const heatTrack = (t) => {
    // illustration : gelé → faux « bien chaud » → retour au froid (« sauf que non ») → réchauffe à peine → re-gel (carbu) → injection
    if (t < tChaud - 0.15) return -1;
    if (t < tNon) return lerp(-1, 1, easeOut(prog(t, tChaud - 0.15, 0.55)));
    if (t < C.seg('old2')) return lerp(1, -0.55, easeOut(prog(t, tNon, 0.35))) + 0.12 * smooth(prog(t, C.seg('why3'), 3));
    if (t < C.w('old3', 1)) return lerp(-0.43, -0.9, smooth(prog(t, C.w('old2', 6), 0.5)));
    return lerp(-0.9, 0, smooth(prog(t, C.w('old3', -1) - 0.3, 0.6)));
  };
  const glassTrack = keyTrack([[0, 0], [C.seg('why1') + 0.1, 0], [C.seg('why1') + 1.0, 1], [C.seg('old1'), 1], [C.seg('old1') + 0.7, 0]]);
  // vitesse de rotation (rad/s) : ralenti lent, explosions démonstratives, calage, ralenti régulier
  const omegaTrack = (t) => {
    if (t < C.w('hook1', 5)) return 0;
    if (t < C.w('why1', 5)) return 9;
    if (t < C.seg('why2')) return 22;
    if (t < C.w('old2', 5)) return 8;
    if (t < C.w('old2', 6)) return 8 + Math.sin(t * 40) * 6; // à-coups
    if (t < C.w('old3', -1)) return Math.max(0, 8 * (1 - prog(t, C.w('old2', 6), 0.5)));
    return 9;
  };
  const thetaTable = [0];
  for (let i = 1; i < 120 * 60; i++) thetaTable.push(thetaTable[i - 1] + omegaTrack(i * DT) * DT);
  const theta = (t) => thetaTable[Math.max(0, Math.min(thetaTable.length - 1, Math.round(t * 120)))];
  const burnTrack = (t) => (t >= C.w('why1', 5) && t < C.seg('why2') ? 1 : t < C.w('old2', 6) || t > C.w('old3', -1) ? 0.35 : 0);

  const faceCam = (o) => o.quaternion.copy(camera.quaternion);

  // ---------- Mise à jour image par image ----------
  function update(t) {
    snowfall(t);
    const h = heatTrack(t);
    engine.setHeat(h);
    engine.setGlass(glassTrack(t));
    engine.setCrank(theta(t), burnTrack(t));
    // vibration du moteur qui tourne (+ à-coups du carburateur)
    const running = omegaTrack(t) > 0.5 ? 1 : 0;
    const jerk = t > C.w('old2', 4) && t < C.w('old2', 6) + 0.3 ? 0.03 : 0;
    engine.position.set(E.x + Math.sin(t * 61) * (0.004 * running + jerk), E.y + Math.sin(t * 47) * (0.003 * running + jerk * 0.7), E.z);

    // horloge « dix minutes »
    const sClock = life(t, C.w('hook1', 6), tNon - 0.05, 0.4, 0.25);
    clock.visible = sClock > 0.001; clock.scale.setScalar(Math.max(0.001, sClock * 0.9));
    clock.position.set(-2.75, 2.75, -0.7); faceCam(clock);
    clock.setTime(600 * easeInOut(prog(t, C.w('hook1', 6) + 0.1, tChaud - C.w('hook1', 6))));

    // jauge de température (scène moteur)
    const sTemp = life(t, C.w('hook3', 0), C.seg('dil1') - 0.1);
    tempG.visible = sTemp > 0.001 || (t > C.w('how3', 0) && t < C.w('exc1', 1) + 0.3);
    if (t < C.seg('how1')) {
      tempG.scale.setScalar(Math.max(0.001, sTemp * 0.55)); tempG.position.set(-0.35, 2.55, -0.75); faceCam(tempG);
      const v = 0.06 + 0.012 * Math.sin(t * 9) + 0.07 * smooth(prog(t, C.w('why3', -1) - 0.2, 0.8));
      tempG.setValue(t < C.w('hook1', 14) ? 0.02 : t < tNon ? 0.9 * easeOut(prog(t, C.w('hook1', 14), 0.5)) : v);
    } else {
      const s = life(t, C.w('how3', 0), C.w('exc1', 1));
      const p = carP(t);
      tempG.scale.setScalar(Math.max(0.001, s * 0.75)); tempG.position.set(p.x - 0.75, 2.75, p.z + 0.6); faceCam(tempG);
      tempG.setValue(0.12 + 0.48 * easeInOut(prog(t, C.w('how3', 1), 2.2)) + 0.01 * Math.sin(t * 7));
    }

    // bidon d'essence (« très peu d'essence »)
    const sCan = life(t, C.w('why3', 0), C.segEnd('why3') + 0.2);
    can.visible = sCan > 0.001; can.scale.setScalar(Math.max(0.001, sCan * 0.8));
    can.position.set(-2.5, 2.75 + Math.sin(t * 3) * 0.03, -0.95);
    can.rotation.set(0, 0.25, -1.1 * smooth(prog(t, C.w('why3', 1), 0.5)));
    fuelPour.update({ fill: smooth(prog(t, C.w('why3', 2), 0.6)), offset: t * 0.6, alpha: sCan > 0.5 ? 1 : 0, scale: 0.8 });

    // calculateur + injection généreuse + gouttes qui glissent dans l'huile
    const sEcu = life(t, C.w('dil1', 5), C.segEnd('dil3'));
    ecu.visible = sEcu > 0.001; ecu.scale.setScalar(Math.max(0.001, sEcu)); ecu.position.copy(ecuPos); ecu.rotation.set(0.5, -0.4, 0);
    wire.update({ fill: smooth(prog(t, C.w('dil1', 5) + 0.2, 0.5)), offset: t * 1.4, alpha: sEcu > 0.5 ? 1 : 0 });
    const injOn = t > C.w('dil1', 6) && t < C.seg('old1') + 0.3;
    inject.forEach((f, i) => f.update({ fill: 1, offset: t * 2.2 + i * 0.17, alpha: injOn ? 1 : 0, scale: 1 }));
    const dripOn = t > C.w('dil2', 6) - 0.2 && t < C.seg('old1') + 0.3;
    drips.forEach((f, i) => f.update({ fill: smooth(prog(t, C.w('dil2', 6) - 0.2 + i * 0.15, 0.8)), offset: t * 0.5 + i * 0.2, alpha: dripOn ? 1 : 0, scale: 1 }));
    // l'huile se dilue (passe de l'or au rosé terne)
    const dil = smooth(prog(t, C.w('dil2', -1) - 0.3, 1.4));
    engine.userData.oilM.color.set('#F2B43A').lerp(new THREE.Color('#D98C8C'), dil * 0.75);
    const oilCol = new THREE.Color('#FFC23A').lerp(new THREE.Color('#FF7FA0'), dil * 0.7);
    const glass = glassTrack(t);
    const oilSpeed = t < C.seg('how1') ? 0.03 : 0.12;
    oilFlow.update({ fill: 1, offset: t * oilSpeed, alpha: glass > 0.6 ? 1 : 0, scale: 1, colorMix: oilCol });
    exhaust.update({ fill: smooth(prog(t, C.w('hook1', 5), 1.0)), offset: t * 0.18 * (omegaTrack(t) > 0.5 ? 1 : 0.0), alpha: t > C.w('hook1', 5) && t < C.seg('how1') + 1 && omegaTrack(t) > 0.5 ? 0.9 : 0, scale: 0.9 });

    // filtre à air de carburateur (le moteur d'antan) puis injecteurs modernes
    const tFall = C.w('old1', 3), tFly = C.w('old3', 1);
    cleaner.visible = t > tFall - 0.05 && t < tFly + 1.0;
    if (cleaner.visible) {
      const y = E.y + 0.8 + drop(t, tFall, 0.42) * 2.6;
      const fly = easeIn(prog(t, tFly, 0.9));
      cleaner.position.set(E.x - fly * 2.5, y + fly * 3.2, E.z + fly * 1.2);
      cleaner.rotation.set(fly * 2, 0, fly * 1.5 + Math.sin(t * 50) * (t > C.w('old2', 4) && t < C.w('old2', 6) + 0.2 ? 0.05 : 0));
    }
    injectors.forEach((j, i) => {
      const t0 = tFly + 0.35 + i * 0.14;
      j.visible = t > t0 - 0.02 && t < C.segEnd('old3') + 1.5 && t < C.seg('how1') + 1;
      j.position.set(E.x + xs[i], E.y + 0.88 + drop(t, t0, 0.35) * 1.6, E.z + 0.12);
      j.scale.setScalar(0.9);
    });
    const caps = engine.userData.caps; caps.forEach((c) => { c.visible = !(t > tFly + 0.3 && t < C.seg('how1') + 1); });

    // fumée noire du calage / vapeur
    if (t > C.w('old2', 4) && t < C.w('old2', 6) + 1.6) smoke.emit(t, C.w('old2', 5), at(V(0.5, -0.1, 0.6)), V(0.6, 0.5, 0.8), { d: 1.4, size: 0.18, dist: 1.4, spread: 0.6 }); else smoke.hide();

    // étincelles
    if (t < tGel + 1.2) sparkA.burst(t, tGel, at(V(0, 0.3, 0.3)), 1.0, 1.1, 0.14);
    else if (t < C.w('dil3', 3) + 1.2 && t > C.w('dil3', 3) - 0.1) sparkB.burst(t, C.w('dil3', 3), at(V(0, -0.65, 0.4)), 0.7, 1.0, 0.12);
    else if (t > C.w('old3', 2) - 0.1 && t < C.w('old3', -1) + 1.2) sparkB.burst(t, C.w('old3', -1), at(V(0, 0.8, 0.3)), 1.0, 1.0, 0.16);
    else if (t > C.w('exc1', 6) - 0.4 && t < C.w('exc1', 6) + 1.0) { const p = carP(t); sparkA.burst(t, C.w('exc1', 6) - 0.3, V(p.x, 1.3, p.z + 0.7), 0.8, 1.1, 0.12); }
    else if (t > C.w('end2', 0) - 0.1) { sparkB.burst(t, C.w('end2', 0), V(carP(t).x, 3.0, carP(t).z), 1.4, 1.3, 0.2); }
    else { sparkA.hide(); sparkB.hide(); }
    if (t < tGel + 1.2) sparkB.hide();

    // ---------- Voiture ----------
    const p = carP(t);
    car.position.copy(p);
    car.spinWheels((p.z - CAR0.z) / 0.38);
    car.setLights(smooth(prog(t, C.w('how1', 3), 0.3)));
    // petite plongée au freinage
    const brake = t > tStop - 1.1 && t < tStop + 0.3 ? Math.sin(prog(t, tStop - 1.1, 1.4) * Math.PI) * 0.03 : 0;
    car.rotation.x = brake;
    if (t > C.w('how1', 3) && t < C.w('how1', 3) + 1.6) steam.emit(t, C.w('how1', 3), p.clone().add(car.userData.exhaustPos), V(0, 0.4, -1), { d: 1.3, size: 0.2, dist: 1.0 });
    else if (t > tGo2 && t < tGo2 + 1.5) steam.emit(t, tGo2, p.clone().add(car.userData.exhaustPos), V(0, 0.4, -1), { d: 1.2, size: 0.18, dist: 1.0 });
    else steam.hide();
    // givre du pare-brise : apparaît sur « givré », se dégage sur « attends d'y voir clair »
    const fIn = smooth(prog(t, C.w('exc1', 6) - 0.45, 0.5));
    const fOut = smooth(prog(t, C.w('exc1', 7), 1.0));
    car.setFrost(t > C.w('exc1', 5) && t < C.seg('end1') + 0.5 ? fIn : 0, 1 - fOut);

    // ceinture
    const sB = life(t, C.w('how1', 5) - 0.25, C.w('how1', -1) + 0.2, 0.35, 0.25);
    buckle.visible = sB > 0.001; buckle.scale.setScalar(Math.max(0.001, sB * 0.8));
    buckle.position.set(2.35, 1.75, 0.6); faceCam(buckle);
    buckle.setClosed(easeIn(prog(t, C.w('how1', 5), 0.25)));

    // compte-tours : reste bas (« sans monter dans les tours »)
    const sT = life(t, C.w('how2', 3), C.w('exc1', 1));
    tachG.visible = sT > 0.001; tachG.scale.setScalar(Math.max(0.001, sT * 0.75));
    tachG.position.set(p.x + 0.75, 2.75, p.z + 0.6); faceCam(tachG);
    tachG.setValue(t < tStop - 1.1 ? 0.28 + 0.04 * Math.sin(t * 2.1) + 0.05 * smooth(prog(t, tGo, 1.2)) : 0.15);
    // flux de chaleur sur le capot
    const heatOn = t > C.w('how3', 1) && t < C.w('exc1', 2);
    carHeat.mesh.position.copy(p); // le tracé est exprimé dans le repère de la voiture
    carHeat.update({ fill: smooth(prog(t, C.w('how3', 1), 1.0)), offset: t * 0.35, alpha: heatOn ? 1 : 0, scale: 1 });
    carHeat.halos.forEach((hh) => hh.position.add(p));

    // récompenses finales
    const sCi = life(t, C.w('end1', -1) - 0.05, C.duration, 0.4);
    canIcon.visible = sCi > 0.001; canIcon.scale.setScalar(Math.max(0.001, sCi * 0.9));
    canIcon.position.set(p.x - 0.9, 3.0 + Math.sin(t * 3) * 0.05, p.z + 0.5); canIcon.rotation.y = t * 1.6;
    const sEi = life(t, C.w('end2', 0) - 0.05, C.duration, 0.4);
    engIcon.visible = sEi > 0.001; engIcon.scale.setScalar(Math.max(0.001, sEi * 0.55));
    engIcon.position.set(p.x + 0.9, 3.0 + Math.sin(t * 3 + 1) * 0.05, p.z + 0.5); engIcon.rotation.y = -t * 1.4;
    engIcon.setCrank(t * 9, 0);
    confetti.update(t, C.w('end1', 0), V(p.x, 1.6, p.z), 1);

    rig.update(t);
  }

  return { update, sfx };
}
