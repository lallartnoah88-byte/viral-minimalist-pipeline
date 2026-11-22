# edu3d — vidéos TikTok éducatives en 3D

Guide pas à pas (avec ou sans code) : **[GUIDE_CREATION.md](GUIDE_CREATION.md)**.

Pipeline 100 % scripté : **voix off neuronale FR → scène Three.js rendue image par image → bruitages/musique synthétisés → MP4 1080×1920 30 fps**.

```bash
cd edu3d
./build.sh 01_chauffer_moteur                 # vidéo finale → out/01_chauffer_moteur.mp4
STILLS=0.5,4.4,20,38 ./build.sh 01_chauffer_moteur   # images de contrôle → build/<id>/still_*.jpg
```

| Fichier | Rôle |
|---|---|
| `videos/<id>/script.json` | Texte de la voix off découpé en segments (seule source à modifier pour changer le texte) |
| `tools/voice.py` | Synthèse Kokoro (`ff_siwis`) + horodatage mot à mot → `voice.wav`, `timings.json` |
| `scene/lib/core.js` | Courbes (pop, rebond, chute), caméra spline continue, sous-titres style référence |
| `scene/lib/garage.js` | Décor : garage stylisé + extérieur enneigé à l'aube, lumières, ombres douces |
| `scene/lib/props.js` | Moteur 4 cylindres « glass-box », voiture, cadrans, bidon, ECU, injecteurs, flux de billes lumineuses, particules |
| `scene/videos/<id>.js` | Mise en scène : chaque action, mouvement caméra et bruitage est calé sur un **mot** de la voix off |
| `render.mjs` | Chromium headless (WebGL) → JPEG → ffmpeg, en parallèle |
| `tools/sfx.py` | 29 bruitages synthétisés, musique lo-fi, ducking, mixage ; loudness finale -14 LUFS dans `build.sh` |

Changer un mot du script décale automatiquement animations, caméra, sous-titres et bruitages (tout est indexé sur `timings.json`).

## 1. Analyse des références (@engineering.animated)

| Élément | Observation | Reproduction |
|---|---|---|
| Accroche | Recette à la 2ᵉ personne + chute : « *Take a metal block, throw in some pistons, add a little fuel, and you've got a car engine. Except…* » / « *If you strap a windmill to your exhaust pipe, you've almost built a turbocharger.* » ≈ 3,5 s | « *Prends un moteur gelé, laisse-le tourner dix minutes au ralenti, et t'as un moteur bien chaud. Sauf que non.* » |
| Caméra d'ouverture | Plan aérien extérieur du garage au coucher du soleil → travelling avant rapide jusqu'au moteur sur son support | Identique, en version hiver/aube enneigée |
| Montage | **Aucune coupe** : un seul plan-séquence, caméra toujours en mouvement, une nouvelle action toutes les 1–3 s | Spline caméra continue + dérive « portée » permanente + secousses sur les ruptures |
| Style 3D | Low-poly arrondi, mat, éclairage chaud soleil rasant + ombres douces ; mur beige, carrelage rosé, poutres rouge-brun, support tubulaire rose-rouge, bidons bleus, pneus, voiture de sport bleue | Palette reproduite (`PAL` dans `garage.js`) |
| Pédagogie visuelle | Bloc moteur qui devient transparent, flux en **billes lumineuses** (orange = gaz chauds, bleu = air, jaune = huile), objets qui tombent avec rebond, étincelles, cadrans flottants | Mêmes codes (orange échappement, or = huile, rose = essence, vert = signal du calculateur) |
| Clin d'œil | Enseigne néon « follow plz <3 » dans le décor | Néon « abonne-toi <3 » (mur du fond + façade) |
| Fin | Rappel de l'accroche « *Congratulations, you've built…* », dézoom + confettis | « *Félicitations, tu viens d'économiser de l'essence… et ton moteur.* » + confettis |
| Sous-titres | **Un seul mot** à l'écran, MAJUSCULES, blanc, graisse Black, contour noir fin + ombre, centré à 50 % de la hauteur, sans ponctuation, mot affiché exactement pendant qu'il est prononcé | Montserrat 900, 64 px, contour 13 %, centre écran, micro-pop d'apparition |
| Rythme | ≈ 2,8 mots/s, voix énergique | ≈ 3,2 mots/s |

## 2. Vidéo 01 — « Faut-il laisser chauffer sa voiture avant de partir en hiver ? »

**Pourquoi ce sujet** : débat qui revient chaque mois de novembre (presse auto, réseaux), croyance transmise par les parents, réponse contre-intuitive, entièrement démontrable en 3D dans l'univers garage/moteur de la référence.

**Vérification** (affirmations retenues) :
- Voiture à injection : inutile de chauffer longtemps à l'arrêt ; mieux vaut partir et rouler en douceur (Mister-Auto, JDN, Test-Achats, fiches-auto.fr).
- Au ralenti le moteur produit peu de chaleur ; il chauffe plus vite en roulant (Road & Track via Yahoo Autos).
- Moteur froid = mélange enrichi ; l'essence non brûlée peut diluer l'huile (« fuel dilution », AMSOIL ; ORNL : les constructeurs signalent l'effet du ralenti prolongé sur l'huile).
- Les carburateurs nécessitaient une chauffe (starter) ; l'injection électronique gère le démarrage à froid.
- Exception : pare-brise givré → dégivrer pour la visibilité (obligatoire).

Volontairement **non affirmés** (sources divergentes) : une durée précise « 30 s » et l'amende de 135 € (l'arrêté de 1963 prévoit justement une exception pour les « mises en route à froid »).

Durée : 49 s (au-dessus de 30–45 s parce que le sujet contient 4 temps forts : idée reçue, mécanisme, origine du mythe, bonne méthode ; aucune phrase de remplissage).

## 3. Vidéo 02 — « Couper son moteur au feu rouge, ça consomme plus ? »

Ouverture **directement sur le moteur qui tourne** (pas de plan extérieur) : la clé coupe le moteur dès le premier mot.

**Vérification** :
- Au-delà d'environ 10 s de ralenti, on consomme plus d'essence (et on émet plus de CO₂) qu'en redémarrant : mesures d'Argonne National Laboratory (voiture récente, 21 °C), reprises par le DOE et Ressources naturelles Canada.
- Démarreur : pour un usage normal, peu de risque de le remplacer (Argonne) ; les véhicules Stop-Start ont démarreur et batterie renforcés.
- Sécurité : dans la circulation, garder le moteur allumé / laisser le système automatique (recommandation de l'étude commandée par Argonne).

Non affirmé : durées de vie chiffrées des démarreurs (sources peu fiables) ; le compteur à l'écran reste dans « des milliers ».

Sources : energy.gov (FOTW #1239), anl.gov (« Ask a scientist »), afdc.energy.gov (idle reduction), NRCan.

## 4. Série « 5 styles viraux » (vidéos 03 à 07)

Même mécanique d'accroche (« recette + *sauf que* ») et même sous-titrage ; chaque vidéo a une direction artistique propre, toutes générées par script (`scene/lib/styles.js`, `scene/lib/character.js` : personnage articulé avec cinématique inverse des bras).

| # | Style | Technique | Sujet | Durée |
|---|---|---|---|---|
| 03 | Pâte à modeler / stop-motion | relief d'empreintes (bump map procédural), formes qui « bougent » (boil), animation à 12 i/s, cyclorama pastel | Retenir un éternuement, c'est dangereux ? | 28,8 s |
| 04 | Diorama isométrique | caméra orthographique en orbite, low-poly à facettes, chambre flottante de nuit, texte 3D extrudé | Avale-t-on des araignées en dormant ? | 26,6 s |
| 05 | Néon synthwave | fond noir, grille rétro, soleil rayé, tubes lumineux + post-traitement bloom | Charger son téléphone la nuit abîme la batterie ? | 30,3 s |
| 06 | Papier découpé | formes 2D extrudées, texture fibreuse, bord blanc de découpe, ombres portées, frise de cartes, 12 i/s | Manger avant de dormir fait grossir ? | 32,8 s |
| 07 | Cartoon cel-shading | `MeshToonMaterial` 3 tons + contours BD (coque inversée), texte 3D | Dangereux de réveiller un somnambule ? | 29,6 s |

**Vérification des faits**
- 03 : BMJ Case Reports — un homme s'est rompu la gorge (2018), un autre la trachée, en bloquant un éternuement nez et bouche fermés ; selon les auteurs, la pression peut dépasser 20 fois celle d'un éternuement normal ; complications possibles décrites : tympans perforés, etc. Événement rare. (NPR, Live Science, CBS News)
- 04 : le « 8 araignées par an » ne repose sur aucune étude ; aucun cas documenté (Rod Crawford, Burke Museum, via Scientific American) ; vibrations du dormeur (souffle, cœur, ronflement) repoussent les araignées. (Scientific American, Britannica)
- 05 : l'iPhone arrête la charge une fois plein et la reprend sous 95 % ; la chaleur et le temps passé à 100 % usent la batterie ; la recharge optimisée attend vers 80 % jusqu'au réveil ; éviter de charger au chaud. (Apple, support 105105 et 108055)
- 06 : Vujović et al., *Cell Metabolism* 2022 (Brigham and Women's / Harvard) : mêmes repas décalés de 4 h → plus de faim, dépense énergétique un peu plus faible, gènes du tissu adipeux orientés vers le stockage ; l'étude ne mesure pas la prise de poids à long terme (d'où « ne fait pas grossir tout seul »).
- 07 : réveiller un somnambule ne provoque ni crise cardiaque ni lésion cérébrale ; risque de confusion et de réaction brusque ; conseil : le raccompagner calmement au lit, le réveiller doucement s'il est en danger. (Sleep Foundation, AASM via NBC News, Snopes)

## 5. Créer la vidéo suivante

1. Copier `videos/01_chauffer_moteur/script.json` → `videos/<nouvel_id>/script.json`, écrire la voix off (accroche « recette + *sauf que* », fin « *Félicitations…* »).
2. Copier `scene/videos/01_chauffer_moteur.js` → `scene/videos/<nouvel_id>.js` ; réutiliser `buildGarage`, les props et `BeadFlow`, caler chaque action avec `C.w('<segment>', <n° de mot>)`.
3. `STILLS=... ./build.sh <id>` pour vérifier les cadrages, puis `./build.sh <id>`.

Idées déjà vérifiables dans le même univers : *Faut-il vraiment changer l'huile tous les 10 000 km ?*, *Rouler sur la réserve abîme-t-il la pompe à essence ?*, *Le mode Eco consomme-t-il vraiment moins ?*, *Faut-il charger sa voiture électrique à 100 % ?*

**Monétisation** : sous 10 000 abonnés, viser 30–50 s et la rétention. Dès l'éligibilité au programme de rémunération (vidéos ≥ 1 min), passer à 60–75 s en ajoutant un vrai 5ᵉ temps (cas concret, chiffre sourcé, contre-exemple), jamais du remplissage.
