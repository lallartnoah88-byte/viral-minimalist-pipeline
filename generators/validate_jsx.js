#!/usr/bin/env node
/*
 * validate_jsx.js
 * Vérifie que le plugin After Effects respecte ECMAScript 3 (ExtendScript) :
 *  1. analyse syntaxique stricte avec acorn en ecmaVersion 3 (si disponible) ;
 *  2. interdiction explicite de const, let, fonctions fléchées, Array.map / forEach / filter / reduce / indexOf,
 *     gabarits `...`, et utilisation de JSON.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'plugin', 'Minimalist_Viral_Setup.jsx');
const src = fs.readFileSync(file, 'utf8');
const errors = [];

// Retire commentaires et chaînes pour éviter les faux positifs.
const code = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '')
  .replace(/"(?:\\.|[^"\\])*"/g, '""')
  .replace(/'(?:\\.|[^'\\])*'/g, "''");

const banned = [
  [/\bconst\s/, 'const'],
  [/\blet\s/, 'let'],
  [/=>/, 'fonction fléchée =>'],
  [/\.map\s*\(/, 'Array.map'],
  [/\.forEach\s*\(/, 'Array.forEach'],
  [/\.filter\s*\(/, 'Array.filter'],
  [/\.reduce\s*\(/, 'Array.reduce'],
  [/\.indexOf\s*\(/, 'indexOf'],
  [/`/, 'gabarit `...`'],
  [/\bJSON\./, 'JSON (absent d\'ExtendScript ES3)'],
  [/\bclass\s/, 'class'],
];
for (const [re, label] of banned) {
  if (re.test(code)) errors.push(`Construction interdite en ES3 : ${label}`);
}

let parser = null;
for (const candidate of [
  path.join(__dirname, '..', 'remotion-studio', 'node_modules', 'acorn'),
  'acorn',
]) {
  try {
    parser = require(candidate);
    break;
  } catch (e) {
    /* essai suivant */
  }
}
if (parser) {
  try {
    parser.parse(src, { ecmaVersion: 3, sourceType: 'script' });
  } catch (e) {
    errors.push(`Erreur de syntaxe ES3 (acorn) : ${e.message}`);
  }
} else {
  console.log('[JSX] acorn indisponible : contrôle syntaxique ES3 limité aux motifs interdits.');
}

if (errors.length) {
  console.error(`[JSX] ÉCHEC ${path.basename(file)}\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log(`[JSX] ${path.basename(file)} : conforme ECMAScript 3${parser ? ' (analyse acorn ecmaVersion 3)' : ''}`);
