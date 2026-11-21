// Vidéo 02 — « Couper son moteur au feu rouge, ça consomme plus ? »
// Ouverture directement sur le moteur (pas de plan extérieur), puis plan-séquence continu dans le garage.
import * as THREE from 'three';
import { CameraRig, life, prog, smooth, easeInOut, easeOut, drop, lerp, clamp } from '../lib/core.js';
import { buildGarage, mat, rbox } from '../lib/garage.js';
import { makeStand, makeEngine, makeCar, makeClock, makeJerrycan, BeadFlow, Sparkles, Puffs, Confetti } from '../lib/props.js';
import { makeLabel, makeTrafficLight, makeKey, makeBarChart, makeFlask, makeStarter, makeBattery, makeBarrier, makeWallet, makeStopStartIcon } from '../lib/props2.js';

export function build(scene, camera, C) {
  buildGarage(scene);
  const E = new THREE.Vector3(-1.5, 1.45, -1.0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const xs = [-0.6, -0.2, 0.2, 0.6];
  const w = C.w;

  // ---------- Objets ----------
  const stand = makeStand(); stand.position.set(E.x, 0, E.z); scene.add(stand);
  const engine = makeEngine(); engine.position.copy(E); engine.setHeat(0); scene.add(engine);
  const car = makeCar(); car.position.set(3.9, 0, -1.6); scene.add(car);
  const light1 = makeTrafficLight(); light1.position.set(-2.75, 0, 0.25); light1.rotation.y = 0.3; scene.add(light1);
  const light2 = makeTrafficLight(); light2.position.set(1.85, 0, 1.3); light2.rotation.y = 0.5; scene.add(light2);
  const key = makeKey(); scene.add(key);
  const can = makeJerrycan(); scene.add(can);
  const chart = makeBarChart(); chart.position.set(0.55, 0, -1.25); chart.scale.setScalar(1.2); scene.add(chart);
  const watch = makeClock(); scene.add(watch);
  const watchLbl = makeLabel(0.9, 0.3, { bg: '#2A2A30', color: '#FFFFFF', px: 120 }); scene.add(watchLbl);
  const flask = makeFlask(); scene.add(flask);
  const labLbl = makeLabel(1.3, 0.3, { bg: '#FFFFFF', color: '#2A2A30', px: 100 }); labLbl.setText('ARGONNE'); scene.add(labLbl);
  const starter = makeStarter(); engine.add(starter); starter.position.set(0.45, -0.48, 0.47);
  const battery = makeBattery(); scene.add(battery);
  const counter = makeLabel(1.3, 0.36, { bg: '#2A2A30', color: '#FFC72C', px: 120 }); scene.add(counter);
  const ssIcon = makeStopStartIcon(); scene.add(ssIcon);
  const barrier = makeBarrier(4.4); barrier.position.set(6.55, 0, 1.6); scene.add(barrier);
  const wallet = makeWallet(); scene.add(wallet);
  const zzz = [0, 1, 2].map(() => { const l = makeLabel(0.5, 0.5, { color: '#FFFFFF', px: 300 }); l.setText('Z'); scene.add(l); return l; });

  const sparkA = new Sparkles(scene, 16, '#FFFFFF');
  const sparkB = new Sparkles(scene, 16, '#FFE28A');
  const puffs = new Puffs(scene, 10, '#EDE8E3');
  const confetti = new Confetti(scene, 180);

  // ---------- Flux lumineux ----------
  const exhaust = new BeadFlow(scene, [[-2.1, 1.75, -0.5], [-1.5, 1.73, -0.46], [-0.9, 1.75, -0.5], [-0.55, 1.55, -0.38], [-0.45, 1.0, -0.3], [-0.3, 0.3, -0.1], [0.4, 0.12, 0.6]], { color: '#FF8A4C', n: 34 });
  const inject = xs.map((x) => new BeadFlow(scene, [[E.x + x, E.y + 1.0, E.z], [E.x + x, E.y + 0.72, E.z], [E.x + x, E.y + 0.35, E.z]], { color: '#FF4F7B', n: 7, r: 0.026, halo: 0.1 }));
  const canTip = V(-2.25, 2.6, -0.95);
  const pour = new BeadFlow(scene, [[canTip.x, canTip.y, canTip.z], [-1.95, 2.66, -1.0], [-1.65, 2.45, -1.0], [-1.5, 2.12, -1.0]], { color: '#FF4F7B', n: 22, r: 0.035, halo: 0.14 });
  const cable = new BeadFlow(scene, [[0.0, 0.55, 0.05], [-0.25, 0.6, 0.0], [-0.65, 0.85, -0.45], [-1.0, 0.97, -0.53]], { color: '#FF3B3B', n: 14, r: 0.025, halo: 0.11 });

  // ---------- États : moteur tournant / coupé ----------
  const tCut = w('hook1', 0), tRe = w('hook1', 7), tNon = w('hook2', 2);
  const tSleep = w('end1', 3);
  const running = (t) => !(t >= tCut + 0.25 && t < tRe + 0.35) && t < tSleep;
  const omega = (t) => {
    if (t >= tCut && t < tCut + 0.6) return 9 * (1 - prog(t, tCut, 0.6));
    if (!running(t)) return t >= tSleep && t < tSleep + 0.8 ? 9 * (1 - prog(t, tSleep, 0.8)) : 0;
    if (t >= tRe + 0.35 && t < tRe + 0.8) return 18; // redémarrage vif
    return 9;
  };
  const DT = 1 / 120; const th = [0];
  for (let i = 1; i < 120 * 60; i++) th.push(th[i - 1] + omega(i * DT) * DT);
  const theta = (t) => th[Math.max(0, Math.min(th.length - 1, Math.round(t * 120)))];
  // vue en coupe pendant l'explication de la consommation au ralenti puis du démarreur
  const glass = (t) => smooth(prog(t, w('idl1', 0), 0.8)) * (1 - smooth(prog(t, C.seg('rst1') + 0.2, 0.7))) +
    smooth(prog(t, C.seg('stb1'), 0.7)) * (1 - smooth(prog(t, C.seg('safe1'), 0.7)));

  // ---------- Histogramme : chronomètre accéléré ----------
  const tW0 = w('idl2', 0), tDix = w('rst1', 9), tFreeze = w('rst3', 4) + 0.3;
  const secs = (t) => (t < tW0 ? 0 : Math.min(18, 10 * (Math.min(t, tFreeze) - tW0) / (tDix - tW0)));
  const H10 = 0.9;

  // ---------- Caméra ----------
  const keys = [
    { t: 0.0, pos: [-0.4, 2.35, 3.2], look: [-1.5, 1.6, -1], fov: 44 },
    { t: w('hook1', 4), pos: [-0.9, 2.3, 3.9], look: [-1.8, 1.65, -1], fov: 40 },
    { t: w('hook1', 7) + 0.2, pos: [-1.7, 2.4, 4.3], look: [-2.3, 1.85, -0.9], fov: 40 },
    { t: w('hook1', 12), pos: [-1.1, 2.7, 3.9], look: [-1.6, 1.95, -1], fov: 40 },
    { t: tNon + 0.3, pos: [-0.7, 2.4, 4.3], look: [-1.5, 1.75, -1], fov: 40 },
    { t: w('idl1', 4), pos: [-1.3, 2.3, 3.4], look: [-1.5, 1.55, -1], fov: 40 },
    { t: w('idl1', -1), pos: [-1.9, 2.45, 3.3], look: [-1.5, 1.65, -1], fov: 40 },
    { t: w('idl2', 2), pos: [-0.4, 2.5, 6.4], look: [-0.45, 1.55, -1.1], fov: 40 },
    { t: w('rst1', 9), pos: [0.2, 2.35, 6.0], look: [-0.2, 1.5, -1.1], fov: 40 },
    { t: w('rst2', 6), pos: [1.0, 2.55, 5.6], look: [0.5, 1.65, -1.0], fov: 40 },
    { t: w('rst3', 6), pos: [0.15, 2.4, 5.4], look: [0.25, 1.55, -1.1], fov: 40 },
    { t: C.segEnd('rst3'), pos: [0.35, 2.3, 5.0], look: [0.3, 1.45, -1.1], fov: 40 },
    { t: w('stb1', 3), pos: [0.75, 1.75, 2.6], look: [-0.9, 1.0, -0.6], fov: 40 },
    { t: w('stb2', 10), pos: [0.55, 1.6, 2.35], look: [-0.95, 0.95, -0.6], fov: 40 },
    { t: w('stb2', 14), pos: [1.3, 2.0, 3.4], look: [-0.5, 0.9, -0.4], fov: 40 },
    { t: C.segEnd('stb2'), pos: [1.1, 2.1, 3.7], look: [-0.6, 1.0, -0.5], fov: 40 },
    { t: w('safe1', 4), pos: [0.9, 2.5, 6.6], look: [3.3, 1.35, -0.3], fov: 40 },
    { t: w('safe2', 2), pos: [1.5, 2.6, 7.2], look: [3.7, 1.3, 0.2], fov: 40 },
    { t: w('safe2', -1) + 0.2, pos: [2.2, 2.8, 7.8], look: [3.9, 1.2, 0.6], fov: 40 },
    { t: w('end1', 2), pos: [2.2, 2.9, 6.6], look: [3.9, 1.8, -0.5], fov: 42 },
    { t: C.duration, pos: [2.5, 3.0, 6.1], look: [3.9, 1.9, -0.5], fov: 42 },
  ];
  const rig = new CameraRig(camera, keys);
  rig.addShake(tNon, 0.07, 0.4);
  rig.addShake(w('safe2', 10) + 0.35, 0.04, 0.3);

  // ---------- Bruitages ----------
  const sfx = [];
  const S = (t, type, gain = 1) => sfx.push({ t: +t.toFixed(3), type, gain });
  S(0, 'idle', 0.8); S(tCut, 'click', 1); S(tCut + 0.05, 'stall', 0.8); S(w('hook1', 5), 'pop'); S(w('hook1', 5) + 0.1, 'beep', 0.5);
  S(tRe, 'click', 1); S(tRe + 0.05, 'start', 1); S(w('hook1', 10), 'pop'); S(w('hook1', 11), 'pour', 1);
  S(tNon, 'scratch', 1); S(tNon, 'thud', 0.9);
  S(w('idl1', 0), 'whoosh', 0.7); S(w('idl1', 4), 'pour', 0.6); S(w('idl1', 8), 'idle', 0.5);
  S(w('idl2', 0) - 0.2, 'whoosh', 0.8); S(w('idl2', 0), 'pop'); S(w('idl2', 0) + 0.1, 'clock', 0.7); S(w('idl2', 0) + 1.5, 'clock', 0.6); S(w('idl2', 0) + 3.0, 'clock', 0.6);
  S(w('rst1', 1), 'pop'); S(w('rst1', 1) + 0.15, 'rise', 0.6); S(tDix, 'ding', 0.9);
  S(w('rst2', 7), 'pop'); S(w('rst2', 7) + 0.2, 'bloop', 0.8); S(w('rst2', 9), 'sparkle', 0.7);
  S(w('rst3', 3), 'tick', 0.8); S(w('rst3', 10), 'ding', 1); S(w('rst3', 10), 'sparkle', 0.8);
  S(C.seg('stb1'), 'whoosh_long', 0.8); S(w('stb1', 2), 'pop');
  S(w('stb2', 5), 'pop'); S(w('stb2', 8), 'clank', 0.8); S(w('stb2', 8) + 0.2, 'sparkle', 0.8); S(w('stb2', 12), 'pop'); S(w('stb2', 12) + 0.2, 'beep', 0.6);
  for (let i = 0; i < 6; i++) S(w('stb2', 16) + i * 0.17, 'tick', 0.7);
  S(C.seg('safe1') - 0.1, 'whoosh', 0.8); S(w('safe1', 5), 'pop'); S(w('safe1', 7), 'stall', 0.6); S(w('safe1', 7) + 0.1, 'beep', 0.6);
  S(w('safe2', 1), 'click', 0.9); S(w('safe2', 10) - 0.1, 'bell', 0.8); S(w('safe2', 10) + 0.35, 'thud', 0.8);
  S(w('end1', 0), 'confetti', 1); S(w('end1', 0), 'whoosh_long', 0.7); S(tSleep, 'stall', 0.6); S(w('end2', 2), 'pop'); S(w('end2', 2) + 0.2, 'coin', 1); S(w('end2', 3), 'coin', 0.9); S(w('end2', 3) + 0.25, 'ding', 0.9);

  const faceCam = (o) => o.quaternion.copy(camera.quaternion);
  const show = (o, s, k = 1) => { o.visible = s > 0.001; o.scale.setScalar(Math.max(0.001, s * k)); };

  function update(t) {
    const run = running(t);
    engine.setGlass(glass(t));
    engine.setCrank(theta(t), run ? 0.35 : 0);
    const vib = run ? 0.004 : 0;
    engine.position.set(E.x + Math.sin(t * 61) * vib, E.y + Math.sin(t * 47) * vib * 0.7, E.z);
    exhaust.update({ fill: 1, offset: theta(t) * 0.02, alpha: run && t < C.seg('stb1') ? 0.9 : 0, scale: 0.9 });

    // feu tricolore n°1 (rouge pendant l'accroche, vert au redémarrage)
    show(light1, life(t, w('hook1', 5) - 0.05, C.seg('idl1') + 0.2, 0.45, 0.3));
    light1.setLight(t < tRe ? 0 : 2);

    // clé : tourne pour couper, puis pour redémarrer
    const sKey = life(t, -0.2, tRe + 0.9, 0.35, 0.25);
    show(key, sKey, 0.75);
    key.position.set(-0.95, 2.45, -0.2);
    faceCam(key);
    const turn = t < tRe ? -1.2 * easeOut(prog(t, tCut, 0.18)) : -1.2 + 2.0 * easeOut(prog(t, tRe, 0.18)) - 0.8 * smooth(prog(t, tRe + 0.5, 0.3));
    key.rotateZ(turn);

    // le mythe : un gros jet d'essence au redémarrage
    const sCan = life(t, w('hook1', 10) - 0.1, tNon - 0.05, 0.4, 0.25);
    show(can, sCan, 0.8);
    can.position.set(-2.5, 2.8 + Math.sin(t * 3) * 0.03, -0.95);
    can.rotation.set(0, 0.25, -1.2 * smooth(prog(t, w('hook1', 11), 0.35)));
    pour.update({ fill: smooth(prog(t, w('hook1', 11) + 0.1, 0.4)), offset: t * 1.2, alpha: sCan > 0.5 ? 1 : 0, scale: 1.1 });

    // injection continue au ralenti
    const injOn = t > w('idl1', 4) - 0.2 && t < C.seg('rst1') + 0.6;
    inject.forEach((f, i) => f.update({ fill: 1, offset: t * 1.6 + i * 0.21, alpha: injOn ? 1 : 0 }));

    // chronomètre + histogramme
    const sW = life(t, w('idl2', 0), C.segEnd('rst3') + 0.1);
    show(watch, sW, 0.55); watch.position.set(0.1, 3.3, -1.0); faceCam(watch); watch.setTime(secs(t));
    show(watchLbl, sW, 0.7); watchLbl.position.set(0.1, 2.78, -0.95); faceCam(watchLbl);
    watchLbl.setText(`${Math.floor(secs(t))} s`, secs(t) >= 10 ? '#FFC72C' : '#FFFFFF');
    const sC = life(t, w('idl2', 0) + 0.1, C.segEnd('rst3') + 0.1);
    show(chart, sC, 1.2);
    const hA = H10 * secs(t) / 10;
    const hB = H10 * easeOut(prog(t, w('rst1', 1), 0.5));
    chart.setBars(Math.max(0.02, hA), Math.max(0.001, hB), t > w('rst1', 9) - 0.3 ? H10 : 0);
    const over = smooth(prog(t, w('rst3', 3), 0.6));
    chart.userData.mA.color.set('#FF8A3C').lerp(new THREE.Color('#E2473D'), over);
    chart.userData.mB.color.set('#3B7BFF').lerp(new THREE.Color('#2FCB6A'), smooth(prog(t, w('rst3', 10), 0.4)));
    chart.userData.mB.emissive = new THREE.Color('#2FCB6A'); chart.userData.mB.emissiveIntensity = 0.35 * smooth(prog(t, w('rst3', 10), 0.4));

    // laboratoire Argonne
    const sF = life(t, w('rst2', 7) - 0.1, C.segEnd('rst2') + 0.2);
    show(flask, sF, 0.8); flask.position.set(1.65, 1.95, -0.75); flask.bubble(t);
    show(labLbl, sF, 0.75); labLbl.position.set(1.65, 1.7, -0.45); faceCam(labLbl);

    // démarreur : apparaît, se renforce, enchaîne les démarrages
    const sS = life(t, w('stb1', 2) - 0.1, C.seg('safe1') + 0.3, 0.45, 0.3);
    starter.visible = sS > 0.001; starter.scale.setScalar(Math.max(0.001, sS));
    starter.setArmor(smooth(prog(t, w('stb2', 8), 0.5)));
    const cranking = t > w('stb2', 16) - 0.1 && t < C.segEnd('stb2');
    starter.spin(cranking ? t * 40 : t > tRe && t < tRe + 0.4 ? t * 40 : 0);
    const sI = life(t, w('stb2', 5), C.seg('safe1') - 0.1);
    show(ssIcon, Math.max(sI, life(t, w('safe1', 5), C.seg('safe2') + 0.5)), 0.85);
    if (t < C.seg('safe1')) { ssIcon.position.set(-0.05, 2.3, -0.1); ssIcon.setColor('#FFFFFF'); }
    else { ssIcon.position.set(3.9, 2.55, -0.6); ssIcon.setColor(t > w('safe1', 7) ? '#2FCB6A' : '#FFFFFF'); }
    faceCam(ssIcon);
    const sBat = life(t, w('stb2', 12) - 0.05, C.seg('safe1') + 0.2);
    show(battery, sBat, 0.9); battery.position.set(0.1, 0.0, 0.1); battery.rotation.y = -0.5;
    cable.update({ fill: smooth(prog(t, w('stb2', 12) + 0.2, 0.5)), offset: t * 1.3, alpha: sBat > 0.6 ? 1 : 0 });
    const sCnt = life(t, w('stb2', 16) - 0.1, C.segEnd('stb2') + 0.15);
    show(counter, sCnt, 0.8); counter.position.set(-0.2, 1.55, 0.15); faceCam(counter);
    const n = Math.floor(lerp(1, 5000, Math.pow(prog(t, w('stb2', 16), C.segEnd('stb2') - w('stb2', 16)), 1.6)));
    counter.setText(`× ${n.toLocaleString('fr-FR')}`);
    if (cranking) puffs.emit(t, w('stb2', 16), E.clone().add(V(0.9, -0.2, 0.5)), V(0.3, 0.6, 0.6), { d: 1.0, size: 0.12, dist: 0.8 });
    else if (t > tRe + 0.3 && t < tRe + 1.6) puffs.emit(t, tRe + 0.3, V(0.4, 0.15, 0.6), V(0.5, 0.4, 0.8), { d: 1.2, size: 0.18, dist: 1.2 });
    else puffs.hide();

    // voiture au feu : le Stop-Start coupe, puis barrière de passage à niveau
    show(light2, life(t, w('safe1', 2) - 0.1, C.duration, 0.45));
    light2.setLight(0);
    car.setLights(t > C.seg('safe1') && t < tSleep + 0.5 ? 1 : 0);
    const sBar = life(t, w('safe2', 9) - 0.15, C.duration, 0.4);
    barrier.visible = sBar > 0.001; barrier.scale.set(1, Math.max(0.001, sBar), 1);
    const down = smooth(prog(t, w('safe2', 10), 0.4));
    barrier.setArm(down, t > w('safe2', 10) ? (Math.sin(t * 12) > 0 ? 2.5 : 0) : 0);

    // fin : le moteur s'endort, le portefeuille se remplit
    zzz.forEach((z, i) => {
      const u = ((t - tSleep) * 0.6 + i / 3) % 1;
      const on = t > tSleep;
      z.visible = on;
      z.position.set(2.9 + u * 0.4, 1.5 + u * 0.9, 0.9);
      z.scale.setScalar(on ? (0.4 + u * 0.7) * Math.sin(u * Math.PI) * smooth(prog(t, tSleep, 0.4)) + 0.001 : 0.001);
      faceCam(z);
    });
    const sWal = life(t, w('end2', 2) - 0.1, C.duration, 0.4);
    show(wallet, sWal, 1.1); wallet.position.set(3.9, 2.3 + Math.sin(t * 3) * 0.04, 0.7); faceCam(wallet);
    wallet.coins(prog(t, w('end2', 2) + 0.1, 1.2) * 1.6);
    confetti.update(t, w('end1', 0), V(3.9, 1.5, 0.2), 1.0);

    // étincelles
    if (t > w('rst3', 10) - 0.1 && t < w('rst3', 10) + 1.1) sparkB.burst(t, w('rst3', 10), chart.position.clone().add(V(0.42, 1.55, 0.35)), 0.5, 1.0, 0.12);
    else if (t > w('stb2', 8) && t < w('stb2', 8) + 1.1) sparkB.burst(t, w('stb2', 8) + 0.05, E.clone().add(V(0.45, -0.48, 0.55)), 0.4, 1.0, 0.1);
    else if (t > w('end2', 2) && t < w('end2', 2) + 1.4) sparkB.burst(t, w('end2', 2) + 0.1, V(3.9, 2.5, 0.8), 0.9, 1.2, 0.16);
    else sparkB.hide();
    if (t > w('rst2', 9) - 0.1 && t < w('rst2', 9) + 1.1) sparkA.burst(t, w('rst2', 9), V(1.65, 2.5, -0.7), 0.5, 1.0, 0.1);
    else if (t > tRe + 0.3 && t < tRe + 1.3) sparkA.burst(t, tRe + 0.3, E.clone().add(V(0.6, -0.4, 0.5)), 0.4, 0.9, 0.09);
    else sparkA.hide();

    rig.update(t);
  }

  return { update, sfx };
}
