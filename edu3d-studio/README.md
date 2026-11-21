# Edu3D Studio — vidéos TikTok éducatives 3D (1080×1920, 30 fps)

Chaîne de production entièrement scriptée : **texte → voix off → montage calé sur la voix → scènes 3D → sous-titres → sound design → MP4 masterisé**.

```bash
cd edu3d-studio
./render_episode.sh eternuement      # → out/eternuement.mp4
npm run studio                       # éditeur interactif Remotion (aperçu temps réel)
```

Prérequis : Node ≥ 18, Python ≥ 3.10, ffmpeg, accès réseau à `speech.platform.bing.com` (voix edge-tts).
Le rendu 3D tourne sans GPU (WebGL logiciel SwiftShader, `swangle`) : ~1 s à 4 s par image selon la scène.

| Fichier | Rôle |
|---|---|
| `episodes/<slug>.json` | **Source unique** d'un épisode : plans, texte découpé en sous-titres (`\|`), bruitages ancrés sur des mots |
| `tools/build_episode.py` | Voix off neuronale + alignement mot à mot + timeline + bruitages/musique synthétisés |
| `src/episodes/<slug>.timeline.json` | Généré : début/durée de chaque plan, repères de mots, sous-titres (en images) |
| `src/engine/` | Personnage riggé (IK des bras, expressions), plateau studio, accessoires, sous-titres, habillage « retour » |
| `src/scenes/` | Décors 3D : voiture, coupe de trachée, cou, hôpital, calendrier, cas 2018, coude |
| `tools/contact_sheet.sh` | Planche contact (une image par plan) pour le contrôle qualité |

---

## 1. Analyse des 3 vidéos de référence

Les trois références (39 s, 30 s, 42 s, 29,97 fps, ≈ -11 LUFS) appartiennent au même format « 3D narrative semi-réaliste ».

### Accroche (0–3 s) — même mécanique sur les trois
| Réf. | Première phrase (sans aucune intro) | Mise en scène des 3 premières secondes |
|---|---|---|
| 1 | « He was pooping so hard **that a blood vessel suddenly burst inside his brain** » | Plan large du personnage en effort → zoom rapide **à travers le crâne** → gros plan anatomique du vaisseau qui éclate |
| 2 | « If you dropped a nuke into an active volcano, it would most likely just melt » | Objet qui tombe dans le vide → plongée dans le cratère → contact avec la lave |
| 3 | « As you shower, a tiny vacuum inside the drain sucks up every loose hair » | Plan de dos dans la douche → descente dans la bonde → machine interne |

**Règle extraite :** la vidéo commence *au milieu de l'action*, la première phrase contient à la fois la situation banale et la conséquence choc, et la caméra plonge **à l'intérieur** (corps, volcan, tuyau) avant la 3ᵉ seconde. Pas de « Saviez-vous que… », pas de titre, pas de présentation.

### Structure narrative
Accroche choc → contexte (« Now before the stroke… », « But if… ») → mécanisme expliqué visuellement (intérieur du corps / de l'objet) → conséquence → chute courte. Ton neutre, débit rapide (~3 mots/s), aucune musique dominante.

### Montage et caméra
- Changement de plan ou d'action toutes les **1,5 à 3 s** ; jamais de plan figé (dolly lent permanent, micro-mouvements).
- Transitions : coupe franche, **zoom à travers un objet** (crâne, bonde, cratère), flou de mouvement bref, flash blanc (réf. 2).
- Effets physiques : chute avec gravité, éclatement, gonflement, secousse caméra sur chaque impact.
- Habillage ponctuel : « ◀◀ REWIND » en haut à gauche avec texture VHS pour les retours en arrière (réf. 1).

### Direction artistique 3D
- Rendu semi-réaliste type Blender/Unreal, éclairage studio doux, ombres propres, profondeur de champ légère.
- Fonds unis saturés (bleu ciel en cyclorama dans la réf. 1), couleurs vives lisibles sur mobile.
- Coupes anatomiques en gros plan (cerveau, vaisseaux) dans des teintes rose/rouge avec lueur rouge sur la zone en cause.
- Textes 3D lumineux intégrés au décor (« WASHING », « SANITIZING ») pour nommer les étapes.

### Sous-titres (relevés image par image)
- Police sans-serif humaniste **grasse** (type Verdana/DejaVu Sans Bold), **blanche**, liseré sombre fin + ombre douce.
- Taille ≈ 6 % de la largeur (≈ 66 px en 1080 px), une seule ligne, centrée horizontalement, centre vertical ≈ **78 %** de la hauteur (au-dessus de la barre de description TikTok).
- **1 à 4 mots** par carton, coupés par groupes de sens ; casse de la phrase conservée (majuscule seulement en début de phrase et noms propres), **aucune ponctuation**.
- Apparition sèche, sans animation ni surlignage ; le carton reste affiché jusqu'au suivant.

### Son
Voix off claire et posée, bruitages synchronisés sur chaque événement (whoosh à chaque plongée, impacts, craquements), nappe musicale très discrète, master fort (≈ -11 LUFS).

---

## 2. Sujet choisi et vérification

**Question :** *Est-ce dangereux de retenir un éternuement ?* Un réflexe que presque tout le monde a (se pincer le nez en public), un débat récurrent en ligne (« c'est impoli » contre « c'est dangereux »), et un cas médical réel très visuel en 3D (pression, coupe de trachée, déchirure).

Faits utilisés dans le script (rien d'autre) :
- Un homme a tenté de bloquer un éternuement **en se pinçant le nez et en gardant la bouche fermée** pendant qu'il **conduisait** ; il s'est fait une **déchirure d'environ 2 mm de la trachée**. Cou douloureux et gonflé, **crépitation** à la palpation (air sous la peau = emphysème sous-cutané), confirmée au **scanner**. **Pas d'opération** : cicatrisation spontanée.
  Source : Misirovs R., Hoey G., Carruthers C., Majumdar S., *Spontaneous tracheal perforation following a sneeze*, **BMJ Case Reports** 2023;16(12):e255633 — Ninewells Hospital, Dundee (Écosse). PubMed 38050389.
- **2018** : un autre homme (Leicester, Royaume-Uni) s'était déchiré **le fond de la gorge (pharynx)** de la même manière.
  Source : Yang W. et al., *Snap, crackle and pop: when sneezing leads to crackling in the neck*, **BMJ Case Reports** 2018. PubMed 29335355.
- Conseil des auteurs : ne pas étouffer un éternuement en bouchant nez **et** bouche. Le geste recommandé par les autorités de santé : éternuer dans le pli du coude.

Ce que la vidéo **ne dit pas** (non vérifié ou exagéré ailleurs) : chiffres de pression précis, « des yeux qui sortent des orbites », risque de mort. Les cas sont rarissimes ; la vidéo le présente comme un accident réel, pas comme un risque fréquent.

---

## 3. Script (voix off FR, 38,7 s) et découpage

Accroche calquée sur la réf. 1 : *« Il a retenu un éternuement tellement fort / qu'il s'est fait un trou dans la trachée »* ↔ *« He was pooping so hard / that a blood vessel suddenly burst inside his brain »* — même construction « effort banal → *tellement* → conséquence anatomique », même plongée caméra à l'intérieur du corps sur la 2ᵉ moitié de la phrase.

| # | Début | Voix off | Visuel 3D / caméra | Son |
|---|---|---|---|---|
| 1 | 0,0 s | Il a retenu un éternuement tellement fort | Conducteur nez pincé, joues gonflées, visage rouge ; zoom avant éclair, secousse sur « tellement », poussée vers le cou | whoosh, grondement de pression, impact |
| 2 | 1,6 s | qu'il s'est fait un trou dans la trachée. | Plongée dans la trachée en coupe (anneaux de cartilage) ; la paroi se déchire, l'air s'échappe | whoosh grave, déchirure, sifflement |
| 3 | 3,8 s | Cet homme conduisait en Écosse | Plan large : cabriolet rouge, collines vertes qui défilent | whoosh, moteur |
| 4 | 5,1 s | quand il a senti l'éternuement monter. | Tête en arrière, yeux mi-clos, bouche ouverte « ah… » | montée (riser) |
| 5 | 7,4 s | Pour le bloquer il s'est pincé le nez et a gardé la bouche fermée. | La main quitte le volant, pince le nez ; lèvres serrées, joues qui gonflent ; orbite caméra | pops, couinement |
| 6 | 10,7 s | Mais l'air n'avait plus aucune sortie. | Retour dans la trachée : les bulles d'air montent et butent contre le bouchon rouge | whoosh, « bonk » |
| 7 | 12,9 s | La pression a grimpé d'un coup dans ses voies respiratoires | Air tassé qui s'agite, paroi qui pulse et rougit, point chaud | riser + pression |
| 8 | 15,1 s | et a déchiré un trou de 2 millimètres dans sa trachée. | Déchirure en gros plan, fuite d'air, étiquette 3D « 2 mm » | déchirure, impact, sifflement, tic |
| 9 | 18,0 s | Son cou s'est mis à gonfler et à crépiter sous les doigts. | Cou qui enfle, doigts qui palpent, micro-bulles qui éclatent | gonflement, crépitements |
| 10 | 20,9 s | De l'air s'échappait sous sa peau. | Vue rayons X : cou translucide, trachée lumineuse, bulles dans les tissus | balayage, bulles |
| 11 | 23,0 s | À l'hôpital le scanner a confirmé la déchirure. | La table entre dans l'anneau du scanner → l'écran entoure la déchirure en rouge | whoosh, ronronnement, bips |
| 12 | 26,0 s | Par chance elle a cicatrisé toute seule sans opération. | Le trou se referme, anneau et étincelles vertes, l'air circule de nouveau | whoosh, scintillement, ding |
| 13 | 29,1 s | Et ce n'est pas le premier cas. En 2018 | Habillage « ◀◀ RETOUR EN 2018 » ; le calendrier rembobine 2023 → 2018 | feuilles, impact |
| 14 | 31,6 s | un autre homme s'était déchiré le fond de la gorge de la même manière. | Deuxième personnage, mains sur la gorge, lueur rouge au pharynx | pop, déchirure, pulsation |
| 15 | 35,2 s | Alors la prochaine fois ne le retiens pas. | Retour au conducteur : ça le reprend, la main hésite | whoosh, montée |
| 16 | 36,7 s | Éternue dans ton coude. | Il éternue dans son bras : les gouttelettes s'arrêtent sur la manche ; secousse | « atchoum », pop |

Durée : **38,7 s** (format court adapté à < 10 000 abonnés, sans remplissage).

---

## 4. Ce qui est réellement produit ici, et ses limites

- Le MP4 final est **réellement rendu** par `./render_episode.sh` : 3D temps réel three.js (éclairage studio, ombres douces, reflets d'environnement, tone-mapping ACES), personnages et décors **100 % procéduraux** (aucun asset téléchargé), voix neuronale `fr-FR-HenriNeural`, 24 types de bruitages et une nappe musicale synthétisés, sous-titres calés au mot près.
- **Écart honnête avec les références :** les références sont rendues dans Blender/Unreal avec des personnages semi-réalistes sculptés (peau, rides, cheveux, tissus) et de la profondeur de champ. Le moteur procédural produit un style **cartoon 3D « clay »** plus simple : même grammaire (accroche, plongées, rythme, sous-titres, sound design), mais pas le même niveau de détail des personnages. Pour s'en approcher, voir le workflow « haut de gamme » ci-dessous ; le JSON d'épisode, la voix, les sous-titres et le mix restent réutilisables tels quels.

## 5. Workflow « haut de gamme » (rendu semi-réaliste type référence)

1. **Personnages** : Character Creator 4 / MetaHuman (ou Meshy / Tripo pour un premier jet) → export FBX → Blender. Rig Rigify, expressions via shape keys (joues gonflées, yeux plissés).
2. **Décors** : Blender + kits (BlenderKit, Poly Haven : HDRI studio, matériaux PBR). Coupe de trachée : cylindre + modificateur *Boolean*, anneaux en *Array*, matériau SSS rose.
3. **Rendu** : Eevee Next (rapide) ou Cycles 128 échantillons + débruiteur OpenImageDenoise, 1080×1920, 30 fps, profondeur de champ f/2.8.
4. **Montage** : importer `public/eternuement/voice.wav` + `fx.wav` ; les débuts de plans sont dans `src/episodes/eternuement.timeline.json` (en images à 30 fps) → poser les rendus Blender bout à bout dans CapCut / DaVinci, ou remplacer les scènes Remotion par des `<OffthreadVideo>` des rendus Blender pour garder les sous-titres et le mix automatiques.
5. **Alternative IA vidéo (Kling 2.x / Runway Gen-4 / Luma)** : un prompt par plan (ci-dessous), 5 s, 9:16, puis recadrage à la durée du plan.

### Prompts plan par plan (génération vidéo 3D)
Préfixe commun : *« Stylized semi-realistic 3D animation, Pixar-like render, soft studio softbox lighting, clean shadows, shallow depth of field, vivid saturated colors, vertical 9:16, smooth cinematic camera, no text »*.

1. *A bald-ish man in a mustard sweater driving a red convertible on a sunny Scottish country road, pinching his nose, cheeks puffed, face turning red, eyes squeezed shut, fast push-in to his face then down to his neck, slight camera shake.*
2. *Camera dives inside a human windpipe shown as an anatomical cross-section, pink tissue with pale cartilage rings, glowing air bubbles trapped, the back wall suddenly tears open with a small ragged hole, air rushing out, dramatic red rim light.*
3. *Wide tracking shot of a red convertible driving through green rolling hills in Scotland, trees passing, bright blue sky, the driver relaxed.*
4. *Close-up of the driver tilting his head back about to sneeze, eyes half closed, mouth open, nostrils flaring, slow push-in.*
5. *The driver lets go of the steering wheel and pinches his nose, lips pressed tightly, cheeks inflating like balloons, slow orbit around his face.*
6. *Inside the windpipe cross-section, glowing air bubbles flow upward and bump against a sealed red-glowing dome at the top, accumulating.*
7. *The packed air bubbles vibrate violently, the windpipe walls pulse and turn deep red, a hot red spot glows on the back wall, tension building.*
8. *Extreme close-up: the windpipe wall rips open with a ragged 2 mm hole, bubbles escape through it, camera shake.*
9. *Close-up of a man's neck swelling on both sides, his fingers pressing the skin, tiny bubbles crackling under the skin, studio blue background.*
10. *X-ray style shot: the neck becomes translucent, a glowing pink trachea inside, small blue air bubbles drifting into surrounding tissue, dark blue background.*
11. *Hospital CT scanner room in pastel blue, patient on a sliding table entering the white ring, blue scan light, camera moves to a monitor showing a neck scan with a red circle.*
12. *Inside the windpipe the small hole closes and heals with soft green glowing particles, tissue returns to healthy pink, calm air bubbles flowing.*
13. *A desk calendar on a blue studio background, pages flipping backwards rapidly from 2023 to 2018, VHS rewind look.*
14. *A bearded man with curly black hair in a green sweater clutching his throat in pain, a red glow inside the back of his throat seen through translucent skin.*
15. *The driver again feels a sneeze coming, hand hesitating near his nose.*
16. *The man sneezes into the crook of his elbow, tiny droplets stopped by the sleeve, playful camera bounce, then he smiles at the camera.*

---

## 6. Créer l'épisode suivant

1. Copier `episodes/eternuement.json` → `episodes/<nouveau>.json` ; écrire le texte plan par plan en coupant les sous-titres avec `|` (1 à 4 mots, sans ponctuation à l'écran).
2. Ancrer chaque bruitage sur un mot (`"word": "déchiré"`) : il suit automatiquement la voix.
3. Réutiliser les scènes existantes (`scene` + `params.mode`) ou en ajouter une dans `src/scenes/` et l'enregistrer dans `src/Episode.tsx`.
4. Ajouter la timeline à `src/Root.tsx`, puis `tools/contact_sheet.sh` pour vérifier, puis `./render_episode.sh <slug>`.

### Stratégie de durée
- **Aujourd'hui (< 10 000 abonnés)** : 30–45 s, priorité au taux de visionnage complet ; couper tout plan qui n'apporte pas d'information.
- **Dès l'éligibilité au Creator Rewards Program (10 000 abonnés)** : viser ≥ 60 s en choisissant des sujets plus riches (2 cas, une explication du mécanisme, une idée reçue démontée), jamais en ralentissant la voix ni en ajoutant des plans vides. Pour passer d'un format à l'autre, ajouter des plans au JSON ; la timeline se recale seule.

### Voix off
`edge-tts` utilise le service de lecture vocale de Microsoft Edge ; vérifier ses conditions avant une exploitation commerciale. Alternatives : ElevenLabs, Piper (hors ligne) ou sa propre voix — il suffit de remplacer la fonction `synth` de `tools/build_episode.py` par un moteur qui renvoie l’audio et les horodatages de mots (ou un aligneur forcé type WhisperX).
