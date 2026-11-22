# Guide complet : créer des vidéos TikTok éducatives 3D

Ce guide contient tout ce qu'il faut pour refaire ce type de vidéo, que tu codes ou non.

- **Méthode A : le pipeline automatique.** Tu écris un texte, une commande produit le MP4. C'est la méthode utilisée pour les 7 vidéos déjà faites.
- **Méthode B : sans coder.** Blender ou Spline, ou une IA vidéo, puis CapCut. Toutes les réglages sont donnés pour obtenir exactement le même rendu.

Sommaire :
1. La formule d'écriture (le plus important)
2. Trouver et vérifier un sujet
3. Méthode A : le pipeline automatique
4. Méthode B : sans coder (Blender/Spline ou IA, puis CapCut)
5. Fiches de style (7 directions artistiques)
6. Sous-titres : réglages exacts
7. Son : voix, bruitages, musique, mixage
8. Export et publication
9. Les 7 scripts déjà produits
10. Modèle vierge à remplir

---

## 1. La formule d'écriture

Toutes les vidéos suivent la même structure, calquée sur les références (@engineering.animated).

| Temps | Durée | Rôle | Exemple |
|---|---|---|---|
| **Accroche « recette »** | 0 à 4 s | Une suite d'actions à la 2ᵉ personne qui mène à la croyance populaire. | « Pince-toi le nez, ferme la bouche, bloque ton éternuement, et t'as évité la honte. » |
| **Retournement** | 4 à 6 s | « Sauf que… » démonte immédiatement la croyance. | « Sauf que ta gorge, elle, a pris le choc. » |
| **Mécanisme** | 6 à 20 s | 2 ou 3 phrases courtes qui expliquent *pourquoi*, chacune illustrée par une action à l'écran. | « Un éternuement chasse l'air de tes poumons à toute vitesse… » |
| **Preuve** | 1 phrase | Une source crédible citée simplement. | « Selon des médecins… », « des chercheurs de Harvard… » |
| **Conseil pratique** | 1 phrase | Ce que la personne peut faire dès aujourd'hui. | « La bonne méthode : éternue dans ton coude. » |
| **Chute « Félicitations »** | 2 à 3 s | Rappel de l'accroche, ton complice. | « Félicitations, ta gorge te dit merci. » |

Règles d'écriture :
- **Tutoiement**, phrases de 5 à 15 mots, aucun mot inutile.
- **Une idée = une image.** Si une phrase ne peut pas être montrée, coupe-la.
- **Rythme cible** : environ 3 mots par seconde, soit 90 à 110 mots pour 30 s.
- **Durée** : 25 à 45 s tant que tu as moins de 10 000 abonnés. Une fois éligible à la monétisation, vise au moins 60 s en ajoutant un vrai temps fort (un cas concret, un chiffre, un contre-exemple), jamais du remplissage.
- **Ne jamais affirmer un fait douteux.** En cas de doute, nuance : « pas totalement », « c'est rare ».

---

## 2. Trouver et vérifier un sujet

**Ce qu'il te faut** : une question que les gens se posent vraiment, liée à une croyance populaire ou à l'actualité, avec une réponse surprenante et facile à montrer en 3D.

Où chercher :
- la barre de recherche TikTok (tape « est-ce que », « pourquoi », « faut-il ») ;
- les commentaires sous les vidéos de vulgarisation ;
- Google Trends ;
- les « idées reçues » de saison : l'hiver, la rentrée, les vacances, les fêtes.

Méthode de vérification, avant d'écrire une seule ligne :
1. Trouve **au moins 2 sources indépendantes et sérieuses** : étude scientifique, organisme officiel, hôpital, constructeur, presse spécialisée.
2. Note la formulation **exacte** de la source. Un chiffre vague (« 30 secondes », « 135 € ») n'entre dans le script que s'il est confirmé.
3. Si les sources divergent, nuance ou retire l'affirmation.
4. Garde les liens dans le README de la vidéo.

**20 idées de sujets prêtes à vérifier :**
1. Faut-il vraiment boire 2 litres d'eau par jour ?
2. Le mode avion recharge-t-il le téléphone plus vite ?
3. Craquer ses doigts donne-t-il de l'arthrose ?
4. Faut-il attendre 2 h après manger pour se baigner ?
5. Le micro-ondes « tue »-t-il les nutriments ?
6. Lire dans le noir abîme-t-il les yeux ?
7. Les éoliennes consomment-elles plus d'énergie qu'elles n'en produisent ?
8. La foudre ne tombe-t-elle jamais deux fois au même endroit ?
9. Rouler sur la réserve abîme-t-il la pompe à essence ?
10. Le chewing-gum avalé reste-t-il 7 ans dans l'estomac ?
11. Se raser fait-il repousser les poils plus épais ?
12. Faut-il vraiment changer l'huile tous les 10 000 km ?
13. Le sucre rend-il les enfants hyperactifs ?
14. Un téléphone peut-il exploser à cause de la chaleur ?
15. Les poissons rouges ont-ils une mémoire de 3 secondes ?
16. Dormir avec le téléphone à côté de la tête est-il dangereux ?
17. Le froid donne-t-il le rhume ?
18. Faut-il laisser refroidir un plat avant de le mettre au frigo ?
19. Le mode Eco consomme-t-il vraiment moins ?
20. Peut-on vraiment voir la Muraille de Chine depuis l'espace ?

---

## 3. Méthode A : le pipeline automatique

### 3.1 Installation (une seule fois)

Prérequis :
- **Node.js 18 ou plus** : https://nodejs.org
- **Python 3.10 ou plus** : https://python.org
- **ffmpeg** :
  - Windows : `winget install ffmpeg`
  - Mac : `brew install ffmpeg`
  - Linux : `apt install ffmpeg`
- **Git** (pour récupérer le projet).

```bash
git clone <ton dépôt> && cd viral-minimalist-pipeline/edu3d
npm install
npx playwright install chromium      # navigateur utilisé pour le rendu 3D
```

Au premier lancement, `build.sh` crée tout seul l'environnement Python (`.venv/` avec numpy, scipy, kokoro-onnx). Il télécharge aussi la voix française neuronale Kokoro (350 Mo, depuis GitHub).

Sous Windows, lance les commandes dans **Git Bash** ou **WSL**.

### 3.2 Les commandes

```bash
./build.sh 03_eternuement                      # produit out/03_eternuement.mp4
STILLS=0.5,5,12,20 ./build.sh 03_eternuement   # images de contrôle → build/03_eternuement/still_*.jpg
WORKERS=2 ./build.sh 03_eternuement            # moins de navigateurs en parallèle (PC moins puissant)
```

Temps de rendu : environ 3 à 8 min par vidéo sur un PC à 4 cœurs, sans carte graphique.

### 3.3 Organisation des fichiers

| Fichier | À quoi il sert |
|---|---|
| `videos/<id>/script.json` | **Le texte de la voix off**, découpé en segments. C'est le seul fichier à modifier pour changer le texte. |
| `scene/videos/<id>.js` | La mise en scène 3D : objets, mouvements de caméra, bruitages. Chaque action est calée sur un mot. |
| `scene/lib/core.js` | Animations (pop, rebond, chute), caméra continue, **sous-titres**. |
| `scene/lib/styles.js` | Matières : pâte à modeler, cel-shading, néon, papier. |
| `scene/lib/character.js` | Personnage articulé (marche, expressions, bras guidés par cinématique inverse). |
| `scene/lib/garage.js`, `props.js`, `props2.js` | Décor du garage, moteur, voiture et accessoires. |
| `tools/voice.py` | Voix off et horodatage de chaque mot. |
| `tools/sfx.py` | 44 bruitages synthétisés, musique, mixage. |
| `render.mjs` | Rendu image par image, puis vidéo. |

### 3.4 Créer une nouvelle vidéo, étape par étape

1. **Copie le dossier d'une vidéo du même style.** Par exemple, pour un style pâte à modeler :
   ```bash
   cp -r videos/03_eternuement videos/08_mon_sujet
   cp scene/videos/03_eternuement.js scene/videos/08_mon_sujet.js
   ```
2. **Écris le texte** dans `videos/08_mon_sujet/script.json` : un segment par phrase. Le champ `gap` est la pause avant la phrase, en secondes.
   ```json
   { "id": "08_mon_sujet", "title": "Ma question ?", "voice": { "engine": "kokoro", "name": "ff_siwis", "speed": 1.12 },
     "segments": [
       { "id": "hook1", "gap": 0.0,  "text": "Fais ceci, puis cela, et t'as obtenu ça." },
       { "id": "hook2", "gap": 0.18, "text": "Sauf que non." },
       { "id": "s1",    "gap": 0.22, "text": "Première explication." },
       { "id": "end1",  "gap": 0.24, "text": "Félicitations, ..." }
     ] }
   ```
3. **Lance une première fois** `STILLS=1 ./build.sh 08_mon_sujet`. Cela génère la voix et `build/08_mon_sujet/timings.json`, qui donne l'heure exacte de chaque mot.
4. **Mets en scène** dans `scene/videos/08_mon_sujet.js`. Les mots se repèrent ainsi :
   - `C.w('s1', 3)` = début du 4ᵉ mot du segment `s1` ; `C.w('s1', -1)` = début du dernier mot ;
   - `C.seg('s1')` = début du segment ; `C.segEnd('s1')` = fin du segment.
   - Pour faire apparaître un objet : `show(objet, life(t, debut, fin))`. Il apparaît avec un rebond et disparaît en rétrécissant.
   - Pour la caméra : la liste `keys` contient des points `{ t, pos, look, fov }`, reliés par une courbe continue. Il n'y a aucune coupe.
   - Pour les bruitages : `S(C.w('s1', 3), 'pop')`. Types disponibles : whoosh, whoosh_long, pop, click, tick, clock, sparkle, ice, start, idle, fire, scratch, thud, boom, pour, drip, bloop, beep, fall, clank, sputter, stall, ding, buckle, drive, rise, brake, defrost, confetti, coin, bell, squish, muffle, inflate, rip, boing, achoo, snore, heartbeat, zap, hum, rustle, stamp, slide.
5. **Vérifie les cadrages** avec `STILLS=...`, puis **produis** avec `./build.sh 08_mon_sujet`.

Pour changer **uniquement le texte** d'une vidéo existante : modifie `script.json`, puis relance `build.sh`. Animations, sous-titres et bruitages se recalent automatiquement, puisqu'ils sont indexés sur les mots.

### 3.5 Dépannage

| Problème | Solution |
|---|---|
| L'image est noire ou il y a une erreur WebGL | `npx playwright install chromium`, puis relance. |
| La voix ne se télécharge pas | Télécharge à la main `kokoro-v1.0.onnx` et `voices-v1.0.bin` depuis github.com/thewh1teagle/kokoro-onnx/releases (tag `model-files-v1.0`), et place-les dans `edu3d/.models/`. |
| Un mot est mal prononcé | Écris-le comme il se prononce dans `script.json` (par exemple « Stop-Start » au lieu de « Stop and Start »). |
| Un objet sort du cadre | Recule la caméra (augmente la distance `pos`, ou `zoom` en isométrique) ou déplace l'objet. |
| Le rendu est trop lent | Mets `WORKERS=2`, ferme les autres applications. |

---

## 4. Méthode B : sans coder

### 4.1 Les outils

| Étape | Gratuit | Payant ou IA |
|---|---|---|
| Modèles 3D | **Blender** (blender.org), **Spline** (spline.design, dans le navigateur, très simple) | Meshy, Tripo (modèles générés par IA à partir d'un texte) |
| Animation et rendu | Blender (moteur Eevee), Spline (export vidéo) | Kling, Runway, Luma, Pika (vidéo par IA) |
| Voix | Ta propre voix (micro-cravate à environ 20 €), Kokoro (voix `ff_siwis`) | ElevenLabs |
| Montage, sous-titres | **CapCut** (PC ou mobile) | Premiere Pro, DaVinci Resolve |
| Bruitages | Pixabay Sound Effects, freesound.org | Epidemic Sound |

### 4.2 Le déroulé de production

1. **Écris le script** avec la formule de la partie 1, puis vérifie les faits.
2. **Enregistre la voix en premier.** C'est elle qui donne le rythme de tout le reste. Parle vite et énergique, en appuyant sur le « Sauf que ».
3. **Découpe en plans** : un plan par phrase, et une action visible par mot important (voir le tableau de découpage, partie 10).
4. **Crée le décor et les objets** dans le style choisi (partie 5).
5. **Anime** :
   - la caméra bouge toujours : travelling lent, petite orbite, zoom sur chaque nouvel élément ;
   - les objets apparaissent avec un rebond (scale de 0 à 110 % puis 100 % en 0,4 s) ou tombent avec un rebond ;
   - aucun plan figé.
6. **Rends** en 1080×1920, à 30 i/s.
7. **Monte dans CapCut** :
   - place la vidéo et la voix ;
   - lance « Sous-titres automatiques », puis applique les réglages de la partie 6 ;
   - ajoute les bruitages sur chaque apparition ;
   - ajoute la musique à −22 dB.
8. **Exporte et publie** (partie 8).

### 4.3 Plans avec une IA vidéo (Kling, Runway, Luma)

Pour chaque plan, utilise ce modèle de prompt, en anglais (les IA vidéo le comprennent mieux) :

```
[STYLE], [SUJET ET ACTION], [DÉCOR], [CAMÉRA], vertical 9:16, 1080x1920,
soft studio lighting, clean render, vibrant colors, no text, no watermark, 3 seconds
```

Exemple pour le plan d'ouverture de la vidéo « éternuement », en style pâte à modeler :

```
claymation stop-motion style, cute clay character with big head pinching his nose and
covering his mouth, cheeks puffing up as he holds back a sneeze, pastel peach cyclorama
background, slow push-in camera, vertical 9:16, soft studio lighting, visible fingerprints
in the clay, 12 fps stop motion feel, no text, no watermark, 3 seconds
```

Les blocs de style à coller sont dans la partie 5.

Conseils pour les IA vidéo :
- une seule action par plan ;
- 3 à 5 s par plan ;
- garde le même bloc de style dans tous les prompts pour une identité constante ;
- génère 2 ou 3 versions et garde la meilleure ;
- n'écris jamais de texte dans l'image : les sous-titres sont ajoutés au montage.

---

## 5. Fiches de style

| Style | Palette (hex) | Lumière | Caméra et animation | Bloc de prompt IA |
|---|---|---|---|---|
| **Garage 3D (référence)** | mur `#E9DCD0`, sol `#E7B9A0`, poutres `#7C2F25`, support `#EC6E6A`, bleu `#2F5BD6` | soleil chaud rasant + ombres douces | plan-séquence continu, moteur « en verre », flux de billes lumineuses | `stylized 3D render, low-poly rounded shapes, cozy warm garage, glass cutaway engine, glowing bead flow lines, Blender Eevee look` |
| **Pâte à modeler** | fond `#F6CFAE`, rouge `#F25C54`, rose `#F59BA8`, menthe `#7FC8A9` | studio doux, grande ombre floue | 12 i/s saccadé, formes qui « vibrent » légèrement | `claymation stop-motion, plasticine with fingerprints, pastel cyclorama, soft shadows, 12 fps` |
| **Diorama isométrique** | nuit `#1B1F44`, murs `#6F7FD6`, bois `#C88A5A`, lampe `#FFB64A` | lune bleue + lampe chaude | caméra orthographique en orbite lente, zooms | `isometric 3D diorama, floating room cutaway, low-poly flat shading, orthographic camera, night lighting` |
| **Néon synthwave** | noir `#05020C`, rose `#FF2BD6`, cyan `#22E8FF`, jaune `#FFE14D`, vert `#39FF88` | aucune lumière : les objets émettent + bloom | grille qui défile, soleil rétro rayé | `synthwave neon wireframe, glowing outlines, black background, retro grid floor, striped retro sun, strong bloom` |
| **Papier découpé** | nuit `#22305A`, carte `#FBEFDD`, collines `#3E9370`, accents `#F28C38` `#E2473D` | lumière dure et rasante, ombres portées nettes | couches à différentes profondeurs (parallaxe), 12 i/s | `paper cut-out craft, layered paper with drop shadows, visible paper texture, white cut borders, stop motion` |
| **Cartoon cel-shading** | mur `#8C7FD6`, nuit `#2B2350`, bois `#B9824F`, pyjama `#8FC4F2` | 1 lumière principale, ombres en aplats | contours noirs épais, couleurs en 3 tons | `cel-shaded toon 3D, thick black outlines, flat colors, 3-tone shading, cartoon` |

---

## 6. Sous-titres : réglages exacts

Ce sont les mêmes que les références, et les mêmes dans toutes les vidéos.

| Réglage | Valeur |
|---|---|
| Mots par écran | **1 seul mot**, affiché exactement pendant qu'il est prononcé |
| Casse | **MAJUSCULES** |
| Police | **Montserrat Black (900)**, gratuite sur Google Fonts. Dans CapCut : « Montserrat » en gras maximal. |
| Taille | 64 px pour une largeur de 1080 px (environ 6 % de la largeur). Rétrécit si le mot dépasse 86 % de la largeur. |
| Couleur | blanc `#FFFFFF` |
| Contour | noir `#111111`, épaisseur égale à 13 % de la taille du texte (environ 8 px) |
| Ombre | noire à 45 %, flou 10, décalage vers le bas de 3 px |
| Position | **centré, à 50 % de la hauteur** |
| Animation | petit « pop » : 112 % puis 100 % en 0,15 s |
| Ponctuation | aucune (apostrophes et traits d'union conservés : T'AS, LAISSE-LE) |

Dans CapCut :
1. Texte → Sous-titres automatiques (français).
2. Découpage : 1 mot par sous-titre.
3. Style : Montserrat, gras, majuscules, contour 8, ombre.
4. Position Y : 0 (centre).
5. Animation d'entrée : « Pop » ou « Zoom avant ».
6. Relis chaque mot : la reconnaissance automatique fait des erreurs.

---

## 7. Son

| Piste | Niveau | Détail |
|---|---|---|
| Voix | référence (0 dB) | coupe-bas à 90 Hz, présence +2 dB vers 3 à 5 kHz, compression 3,5:1 |
| Impacts (pop, stamp, thud, clank) | −9 à −12 dB | un par apparition d'objet ou par mot-clé |
| Mouvements (whoosh, slide, rustle) | −12 à −15 dB | à chaque grand mouvement de caméra |
| Ambiances (idle, snore, hum) | −14 à −18 dB | en fond pendant la scène concernée |
| Musique | −21 dB, baissée de moitié sous la voix (ducking) | lo-fi léger, environ 100 BPM |
| Niveau final | **−14 LUFS**, crête à −1,5 dBTP | norme TikTok |

Repères de synchronisation :
- un **pop** sur chaque objet qui apparaît ;
- un **whoosh** sur chaque grand mouvement de caméra ;
- un **disque rayé + choc** sur le « Sauf que » ;
- des **confettis + ding** sur « Félicitations ».

Voix de synthèse utilisée : Kokoro v1.0, voix `ff_siwis`, vitesse 1,12. Avec ta propre voix, l'engagement est souvent meilleur.

---

## 8. Export et publication

**Export** :
- 1080×1920, 30 i/s, H.264, débit d'environ 15 à 25 Mbit/s ;
- audio AAC 256 kbit/s, 48 kHz ;
- avec ffmpeg : `-c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart`.

**Zones sûres** : rien d'important dans les 250 px du bas (description, boutons) ni dans les 120 px à droite (icônes like, commentaires, partage). Les sous-titres au centre sont dans la zone sûre.

**Titre ou texte de couverture** : la question, par exemple « Retenir un éternuement, c'est dangereux ? 🤧 ».

**Description** : une phrase + une question pour les commentaires (« Tu le faisais, toi ? ») + 3 à 5 hashtags, par exemple `#apprendresurtiktok #science #lesaviezvous #mythe #3d`.

**Avant de publier** :
- [ ] les faits sont vérifiés, avec 2 sources ou plus ;
- [ ] l'accroche est comprise en moins de 2 s, sans le son ;
- [ ] aucun plan figé de plus d'une seconde ;
- [ ] les sous-titres sont relus mot à mot ;
- [ ] le niveau est à −14 LUFS ;
- [ ] la fin renvoie à l'accroche.

**Analyse** : regarde la rétention dans les statistiques TikTok. Si les gens décrochent avant 3 s, retravaille l'accroche. S'ils décrochent au milieu, raccourcis l'explication.

---

## 9. Les 7 scripts produits

Les timecodes sont ceux de la voix off générée. Le texte source est dans `videos/<id>/script.json`.

### 01 · Faut-il laisser chauffer sa voiture avant de partir en hiver ? (49 s, garage 3D)
| | |
|---|---|
| 0,0 s | Prends un moteur gelé, laisse-le tourner dix minutes au ralenti, et t'as un moteur bien chaud. |
| 4,6 s | Sauf que non. |
| 5,4 s | Au ralenti, il chauffe à peine. |
| 7,1 s | La chaleur d'un moteur vient des explosions dans les cylindres. |
| 10,3 s | Mais à l'arrêt, il ne force pas. |
| 11,8 s | Il brûle très peu d'essence, donc il produit très peu de chaleur. |
| 15,2 s | Pire : tant qu'il est froid, le calculateur injecte plus d'essence. |
| 18,5 s | Une partie ne brûle pas, glisse le long des cylindres, et finit dans ton huile. |
| 22,4 s | Ça s'appelle la dilution. |
| 23,9 s | Alors pourquoi ton grand-père le faisait ? |
| 25,8 s | Parce que les vieux moteurs à carburateur calaient à froid. |
| 28,6 s | Avec l'injection électronique, ce problème a disparu. |
| 31,6 s | La bonne méthode : démarre, boucle ta ceinture, et pars. |
| 34,4 s | Roule doucement, sans monter dans les tours, pendant les premiers kilomètres. |
| 37,9 s | Le moteur travaille, et la chaleur monte bien plus vite. |
| 40,8 s | Seule exception : si ton pare-brise est givré, attends d'y voir clair. |
| 44,3 s | Félicitations, tu viens d'économiser de l'essence… et ton moteur. |

### 02 · Couper son moteur au feu rouge, ça consomme plus ? (42 s, garage 3D)
| | |
|---|---|
| 0,0 s | Coupe ton moteur à un feu rouge, redémarre-le, et t'as brûlé plus d'essence qu'en le laissant tourner. |
| 4,9 s | Sauf que non. |
| 5,8 s | Au ralenti, ton moteur boit de l'essence en continu, même quand tu ne bouges pas. |
| 9,8 s | Chaque seconde, il en injecte un peu plus. |
| 11,9 s | Un redémarrage, lui, consomme à peu près autant que dix secondes de ralenti. |
| 15,7 s | C'est ce qu'ont mesuré les chercheurs du laboratoire américain Argonne. |
| 19,4 s | Donc, au-delà de dix secondes d'arrêt, couper le moteur est gagnant. |
| 22,5 s | Et le démarreur, alors ? |
| 23,6 s | Sur les voitures équipées du Stop-Start, il est renforcé, tout comme la batterie, pour encaisser des milliers de démarrages. |
| 30,2 s | Seule précaution : dans la circulation, laisse le système faire le travail. |
| 34,2 s | Et coupe toi-même pour les longs arrêts, comme devant un passage à niveau. |
| 37,6 s | Félicitations, ton moteur se repose… et ton portefeuille aussi. |

### 03 · Retenir un éternuement, c'est dangereux ? (29 s, pâte à modeler)
| | |
|---|---|
| 0,0 s | Pince-toi le nez, ferme la bouche, bloque ton éternuement, et t'as évité la honte. |
| 4,1 s | Sauf que ta gorge, elle, a pris le choc. |
| 6,3 s | Un éternuement chasse l'air de tes poumons à toute vitesse. |
| 9,2 s | Si tu bouches toutes les sorties, la pression reste coincée à l'intérieur. |
| 12,9 s | Selon des médecins, elle peut être multipliée par plus de vingt. |
| 16,1 s | Ils ont déjà soigné un homme qui s'était déchiré la gorge comme ça… et un autre, la trachée. |
| 20,7 s | C'est rare, mais ce geste peut aussi abîmer les tympans. |
| 23,4 s | La bonne méthode : éternue dans ton coude. |
| 25,6 s | Félicitations, ta gorge te dit merci. |

### 04 · Avale-t-on vraiment des araignées en dormant ? (27 s, isométrique)
| | |
|---|---|
| 0,0 s | Dors la bouche ouverte, laisse une araignée se balader, et t'en avales huit par an. |
| 4,0 s | Sauf que c'est faux. |
| 5,0 s | Ce chiffre ne vient d'aucune étude, et les spécialistes ne connaissent aucun cas documenté. |
| 9,8 s | Pour une araignée, un dormeur, c'est un danger. |
| 12,0 s | Ton souffle chaud, les battements de ton cœur, tes ronflements : tout ça fait vibrer le lit. |
| 16,1 s | Et les araignées sentent ces vibrations avec leurs pattes. |
| 18,7 s | Alors elles font demi-tour. |
| 20,1 s | Impossible ? Pas totalement, mais ce serait un pur accident. |
| 23,3 s | Félicitations, tu peux dormir tranquille. |

### 05 · Charger son téléphone toute la nuit abîme-t-il la batterie ? (30 s, néon)
| | |
|---|---|
| 0,0 s | Branche ton téléphone toute la nuit, laisse-le à cent pour cent jusqu'au matin, et t'as tué ta batterie. |
| 4,8 s | Sauf que non, pas vraiment. |
| 6,2 s | Une fois pleine, ta batterie arrête de charger. |
| 8,5 s | Le téléphone la recharge juste un peu quand elle redescend. |
| 11,6 s | Ce qui l'use vraiment, c'est la chaleur, et le temps passé tout en haut, à cent pour cent. |
| 15,7 s | C'est pour ça que les téléphones récents ont une charge optimisée : ils attendent vers quatre-vingts pour cent, et finissent juste avant ton réveil. |
| 22,7 s | Le vrai conseil : ne le charge pas sous ton oreiller, et évite les endroits chauds. |
| 26,8 s | Félicitations, ta batterie va vivre plus longtemps. |

### 06 · Manger avant de dormir fait-il grossir ? (33 s, papier découpé)
| | |
|---|---|
| 0,0 s | Mange un gros plat à minuit, va te coucher direct, et tout se transforme en graisse. |
| 4,4 s | Sauf que ce n'est pas si simple. |
| 6,0 s | Ce qui fait grossir, c'est surtout le total de calories sur la journée, pas l'heure du repas. |
| 10,5 s | Mais en 2022, des chercheurs de Harvard ont testé exactement les mêmes repas, décalés de quatre heures. |
| 16,1 s | En mangeant tard, les participants avaient plus faim, brûlaient un peu moins de calories, et leur graisse stockait davantage. |
| 22,0 s | Manger tard ne fait pas grossir tout seul, mais ça pousse à manger plus, et à stocker plus. |
| 26,6 s | Si tu peux, laisse quelques heures entre le dîner et le coucher. |
| 29,4 s | Félicitations, ton frigo peut dormir aussi. |

### 07 · Est-ce dangereux de réveiller un somnambule ? (30 s, cartoon cel-shading)
| | |
|---|---|
| 0,0 s | Réveille un somnambule en pleine balade, et tu risques de lui provoquer une crise cardiaque. |
| 4,6 s | Sauf que c'est un mythe. |
| 6,3 s | Le réveiller ne provoque ni crise cardiaque, ni dégâts au cerveau. |
| 9,8 s | Le vrai risque ? Il se réveille perdu, confus, et parfois, il se débat. |
| 13,5 s | Pendant une crise, une partie de son cerveau dort profondément, pendant qu'une autre fait marcher ses jambes. |
| 18,8 s | Le bon réflexe : parle-lui calmement, et guide-le doucement jusqu'à son lit. |
| 22,5 s | Mais s'il est en danger, près d'un escalier ou d'une fenêtre, réveille-le, en douceur. |
| 26,5 s | Félicitations, tout le monde a bien dormi. |

Les sources de chaque vidéo sont listées dans `README.md`.

---

## 10. Modèle vierge à remplir

```
SUJET (question) : ...............................................
SOURCES (2 minimum) : 1) ......................  2) ......................
STYLE : garage / pâte à modeler / isométrique / néon / papier / cartoon

ACCROCHE (0-4 s)   : [Verbe], [action], et t'as [croyance].
RETOURNEMENT       : Sauf que [vérité choc].
MÉCANISME 1        : ...............................................
MÉCANISME 2        : ...............................................
PREUVE             : Selon [source], ...............................
CONSEIL            : La bonne méthode : ............................
CHUTE              : Félicitations, ................................
```

Tableau de découpage (une ligne par phrase) :

| Temps | Voix off | Ce qu'on voit (objet 3D + action) | Caméra | Bruitage |
|---|---|---|---|---|
| 0-4 s | accroche | l'objet principal apparaît, puis chaque action de la « recette » | travelling avant rapide | whoosh, pop |
| 4-6 s | Sauf que… | l'illusion se brise (tampon, croix, retour en arrière) | secousse | disque rayé, choc |
| … | … | … | … | … |
| fin | Félicitations… | confettis, rappel de l'accroche | recul large | confettis, ding |
