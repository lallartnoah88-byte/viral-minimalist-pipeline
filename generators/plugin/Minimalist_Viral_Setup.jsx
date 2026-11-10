/*
 * Minimalist_Viral_Setup.jsx
 * Plugin ScriptUI pour Adobe After Effects - "Dark Minimalist Viral Animations"
 *
 * - Fonctionne en panneau ancrable (Fenetre > Minimalist_Viral_Setup.jsx) s'il est place dans
 *   le dossier "Scripts/ScriptUI Panels/", ou en fenetre flottante via Fichier > Scripts > Executer.
 * - ExtendScript ECMAScript 3 : uniquement "var", boucles "for", aucune fonction flechee,
 *   aucun Array.map / forEach / indexOf.
 * - Toutes les proprietes et effets sont appeles par leur matchName officiel (ou par index en
 *   secours) : le script fonctionne dans After Effects en francais comme en anglais.
 */
(function MinimalistViralSetup(thisObj) {
    var SCRIPT_NAME = "Minimalist Viral Setup";
    var COMP_NAME = "00_VIRAL_REEL_MAIN";
    var DARK = [7 / 255, 7 / 255, 7 / 255];
    var EASE_OUT_INFLUENCE = 75; // depart (sortie de la 1re cle)
    var EASE_IN_INFLUENCE = 85;  // arrivee (entree de la 2e cle)

    /* ------------------------------------------------------------------ */
    /* Utilitaires                                                         */
    /* ------------------------------------------------------------------ */
    function getActiveComp(allowFallback) {
        var item = app.project.activeItem;
        if (item && item instanceof CompItem) {
            return item;
        }
        if (allowFallback) {
            for (var i = 1; i <= app.project.numItems; i++) {
                var it = app.project.item(i);
                if (it instanceof CompItem && it.name === COMP_NAME) {
                    return it;
                }
            }
        }
        return null;
    }

    function requireComp(allowFallback) {
        var comp = getActiveComp(allowFallback);
        if (!comp) {
            alert("Ouvrez d'abord une composition (ou lancez l'etape 1).\nOpen a composition first (or run step 1).", SCRIPT_NAME);
        }
        return comp;
    }

    /** Recherche un parametre d'effet par matchName, sinon par index (independant de la langue). */
    function findParam(effect, matchNames, fallbackIndex) {
        for (var m = 0; m < matchNames.length; m++) {
            for (var i = 1; i <= effect.numProperties; i++) {
                if (effect.property(i).matchName === matchNames[m]) {
                    return effect.property(i);
                }
            }
        }
        if (fallbackIndex && fallbackIndex <= effect.numProperties) {
            return effect.property(fallbackIndex);
        }
        return null;
    }

    function setParam(effect, matchNames, fallbackIndex, value) {
        var p = findParam(effect, matchNames, fallbackIndex);
        if (p) {
            try {
                p.setValue(value);
                return p;
            } catch (e) {
                // parametre non modifiable : on ignore sans bloquer la suite
            }
        }
        return p;
    }

    function addEffect(layer, matchName) {
        var parade = layer.property("ADBE Effect Parade");
        if (!parade.canAddProperty(matchName)) {
            throw new Error("Effet introuvable / Effect not available : " + matchName);
        }
        return parade.addProperty(matchName);
    }

    function transformProp(layer, matchName) {
        return layer.property("ADBE Transform Group").property(matchName);
    }

    /** Construit un tableau de KeyframeEase de la bonne dimension pour la propriete. */
    function easeArray(prop, influence) {
        var dims = 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) {
            dims = 2;
        } else if (t === PropertyValueType.ThreeD) {
            dims = 3;
        }
        var arr = [];
        for (var i = 0; i < dims; i++) {
            arr.push(new KeyframeEase(0, influence));
        }
        return arr;
    }

    function applySpeedGraph(prop, keyA, keyB) {
        var tries = [easeArray(prop, 0).length, 3, 2, 1];
        for (var i = 0; i < tries.length; i++) {
            try {
                var outA = [];
                var inB = [];
                var flatA = [];
                var flatB = [];
                for (var d = 0; d < tries[i]; d++) {
                    outA.push(new KeyframeEase(0, EASE_OUT_INFLUENCE));
                    inB.push(new KeyframeEase(0, EASE_IN_INFLUENCE));
                    flatA.push(new KeyframeEase(0, 33.333));
                    flatB.push(new KeyframeEase(0, 33.333));
                }
                prop.setInterpolationTypeAtKey(keyA, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                prop.setInterpolationTypeAtKey(keyB, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                prop.setTemporalEaseAtKey(keyA, flatA, outA);
                prop.setTemporalEaseAtKey(keyB, inB, flatB);
                return true;
            } catch (e) {
                // dimension incorrecte : on essaie la suivante
            }
        }
        return false;
    }

    function ellipseShape(cx, cy, w, h) {
        var k = 0.5522847;
        var rx = w / 2;
        var ry = h / 2;
        var s = new Shape();
        s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
        s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
        s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
        s.closed = true;
        return s;
    }

    function selectedLayers(comp) {
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) {
            alert("Selectionnez au moins un calque.\nSelect at least one layer.", SCRIPT_NAME);
            return null;
        }
        return sel;
    }

    /* ------------------------------------------------------------------ */
    /* 1. Composition + fond grille                                        */
    /* ------------------------------------------------------------------ */
    function createCompAndGrid() {
        app.beginUndoGroup(SCRIPT_NAME + " - Comp & Grid");
        try {
            var comp = app.project.items.addComp(COMP_NAME, 1080, 1920, 1, 30, 30);
            comp.bgColor = DARK;
            comp.motionBlur = true;
            comp.openInViewer();

            var bg = comp.layers.addSolid(DARK, "BG_DARK", 1080, 1920, 1, comp.duration);
            bg.locked = false;

            var grid = comp.layers.addSolid([0, 0, 0], "BG_GRID", 1080, 1920, 1, comp.duration);
            var fx = addEffect(grid, "ADBE Grid");
            setParam(fx, ["ADBE Grid-0002"], 2, 2);   // Size From : Width Slider
            setParam(fx, ["ADBE Grid-0004"], 4, 90);  // Width = 90 px
            setParam(fx, ["ADBE Grid-0006"], 6, 2);   // Border = 2 px
            grid.blendingMode = BlendingMode.ADD;
            transformProp(grid, "ADBE Opacity").setValue(4);

            var mask = grid.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            mask.property("ADBE Mask Shape").setValue(ellipseShape(540, 960, 1000, 1700));
            mask.property("ADBE Mask Feather").setValue([450, 450]);
            grid.moveBefore(bg);
        } catch (err) {
            alert("Erreur etape 1 : " + err.toString(), SCRIPT_NAME);
        }
        app.endUndoGroup();
    }

    /* ------------------------------------------------------------------ */
    /* 2. Pile des 4 calques d'effets                                      */
    /* ------------------------------------------------------------------ */
    function addAdjustment(comp, name) {
        var l = comp.layers.addSolid([1, 1, 1], name, comp.width, comp.height, comp.pixelAspect, comp.duration);
        l.adjustmentLayer = true;
        l.moveToBeginning();
        return l;
    }

    function addEffectStack() {
        var comp = requireComp(true);
        if (!comp) {
            return;
        }
        app.beginUndoGroup(SCRIPT_NAME + " - FX Stack");
        try {
            // Ordre d'ajout = du bas vers le haut : FX_01 en bas de la pile, FX_04 tout en haut.
            var glowLayer = addAdjustment(comp, "FX_01_DOUBLE_GLOW");
            var g1 = addEffect(glowLayer, "ADBE Glo2");
            setParam(g1, ["ADBE Glo2-0002"], 2, 60);   // Glow Threshold 60 %
            setParam(g1, ["ADBE Glo2-0003"], 3, 25);   // Glow Radius 25
            setParam(g1, ["ADBE Glo2-0004"], 4, 1.2);  // Glow Intensity 1.2
            var g2 = addEffect(glowLayer, "ADBE Glo2");
            setParam(g2, ["ADBE Glo2-0002"], 2, 40);
            setParam(g2, ["ADBE Glo2-0003"], 3, 120);
            setParam(g2, ["ADBE Glo2-0004"], 4, 0.6);

            var boilLayer = addAdjustment(comp, "FX_02_LINE_BOIL");
            var td = addEffect(boilLayer, "ADBE Turbulent Displace");
            setParam(td, ["ADBE Turbulent Displace-0002"], 2, 4);   // Amount
            setParam(td, ["ADBE Turbulent Displace-0003"], 3, 15);  // Size
            var evo = findParam(td, ["ADBE Turbulent Displace-0006"], 6); // Evolution
            if (evo && evo.canSetExpression) {
                evo.expression = "time*250";
            }

            var posterLayer = addAdjustment(comp, "FX_03_POSTERIZE_15FPS");
            var pt = addEffect(posterLayer, "ADBE Posterize Time");
            setParam(pt, ["ADBE Posterize Time-0001"], 1, 15);

            var noiseLayer = addAdjustment(comp, "FX_04_NOISE");
            var nz = addEffect(noiseLayer, "ADBE Noise2");
            setParam(nz, ["ADBE Noise2-0001"], 1, 6);   // Amount of Noise 6 %
            setParam(nz, ["ADBE Noise2-0002"], 2, 0);   // Use Color Noise = off
        } catch (err) {
            alert("Erreur etape 2 : " + err.toString(), SCRIPT_NAME);
        }
        app.endUndoGroup();
    }

    /* ------------------------------------------------------------------ */
    /* 3. Rig camera 3D                                                    */
    /* ------------------------------------------------------------------ */
    function createCameraRig() {
        var comp = requireComp(true);
        if (!comp) {
            return;
        }
        app.beginUndoGroup(SCRIPT_NAME + " - Camera Rig");
        try {
            var ctrl = comp.layers.addNull(comp.duration);
            ctrl.name = "CAMERA_CONTROLLER_3D";
            ctrl.threeDLayer = true;
            transformProp(ctrl, "ADBE Position").setValue([comp.width / 2, comp.height / 2, 0]);
            ctrl.moveToBeginning();

            var count = 0;
            for (var i = 1; i <= comp.numLayers; i++) {
                var l = comp.layer(i);
                if (l === ctrl) {
                    continue;
                }
                if (l instanceof ShapeLayer && l.threeDLayer && !l.parent) {
                    l.parent = ctrl;
                    count++;
                }
            }
            if (count === 0) {
                alert("Controleur cree. Aucun calque de forme 3D a parenter : activez le commutateur 3D de vos calques de forme puis relancez.\nController created. No 3D shape layer found to parent.", SCRIPT_NAME);
            }
        } catch (err) {
            alert("Erreur etape 3 : " + err.toString(), SCRIPT_NAME);
        }
        app.endUndoGroup();
    }

    /* ------------------------------------------------------------------ */
    /* 4. Trim Paths + Speed Graph 75 / 85                                 */
    /* ------------------------------------------------------------------ */
    function animateTrace() {
        var comp = requireComp(false);
        if (!comp) {
            return;
        }
        var sel = selectedLayers(comp);
        if (!sel) {
            return;
        }
        app.beginUndoGroup(SCRIPT_NAME + " - Trim Paths");
        var done = 0;
        try {
            var t0 = comp.time;
            var t1 = t0 + 25 * comp.frameDuration;
            for (var i = 0; i < sel.length; i++) {
                var layer = sel[i];
                if (!(layer instanceof ShapeLayer)) {
                    continue;
                }
                var contents = layer.property("ADBE Root Vectors Group");
                var trim = contents.addProperty("ADBE Vector Filter - Trim");
                var endProp = trim.property("ADBE Vector Trim End");
                var kA = endProp.addKey(t0);
                var kB = endProp.addKey(t1);
                endProp.setValueAtKey(kA, 0);
                endProp.setValueAtKey(kB, 100);
                applySpeedGraph(endProp, kA, kB);
                done++;
            }
            if (done === 0) {
                alert("Selectionnez des calques de forme (Shape Layers).\nSelect shape layers.", SCRIPT_NAME);
            }
        } catch (err) {
            alert("Erreur etape 4 : " + err.toString(), SCRIPT_NAME);
        }
        app.endUndoGroup();
    }

    /* ------------------------------------------------------------------ */
    /* 5. Pop-In Scale 220 % -> 100 %                                      */
    /* ------------------------------------------------------------------ */
    function popInScale() {
        var comp = requireComp(false);
        if (!comp) {
            return;
        }
        var sel = selectedLayers(comp);
        if (!sel) {
            return;
        }
        app.beginUndoGroup(SCRIPT_NAME + " - Pop-In");
        try {
            var t0 = comp.time;
            var t1 = t0 + 20 * comp.frameDuration;
            for (var i = 0; i < sel.length; i++) {
                var scale = transformProp(sel[i], "ADBE Scale");
                var current = scale.value;
                var big = [];
                var normal = [];
                for (var d = 0; d < current.length; d++) {
                    big.push(220);
                    normal.push(100);
                }
                var kA = scale.addKey(t0);
                var kB = scale.addKey(t1);
                scale.setValueAtKey(kA, big);
                scale.setValueAtKey(kB, normal);
                applySpeedGraph(scale, kA, kB);
            }
        } catch (err) {
            alert("Erreur etape 5 : " + err.toString(), SCRIPT_NAME);
        }
        app.endUndoGroup();
    }

    /* ------------------------------------------------------------------ */
    /* Interface                                                           */
    /* ------------------------------------------------------------------ */
    function buildUI(host) {
        var win = (host instanceof Panel) ? host : new Window("palette", SCRIPT_NAME, undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 6;
        win.margins = 10;

        var title = win.add("statictext", undefined, "DARK MINIMALIST VIRAL SETUP");
        title.alignment = ["center", "top"];

        var buttons = [
            ["1. Creer Comp & Fond Grille (1080x1920)", createCompAndGrid],
            ["2. Ajouter la Pile de 4 Effets (Look Signature)", addEffectStack],
            ["3. Creer Rig Camera 3D (Null Controller)", createCameraRig],
            ["4. Animer Trace (Trim Paths + Speed Graph 75/85)", animateTrace],
            ["5. Appliquer Pop-In Scale (Hook 220% -> 100%)", popInScale]
        ];
        for (var i = 0; i < buttons.length; i++) {
            var b = win.add("button", undefined, buttons[i][0]);
            b.preferredSize = [320, 30];
            b.onClick = buttons[i][1];
        }

        var info = win.add("statictext", undefined, "Speed Graph : 75% sortie / 85% entree", { multiline: true });
        info.alignment = ["center", "top"];

        win.onResizing = win.onResize = function () {
            this.layout.resize();
        };
        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) {
        ui.center();
        ui.show();
    } else {
        ui.layout.layout(true);
        ui.layout.resize();
    }
})(this);
