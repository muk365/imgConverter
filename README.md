# ⚡ MediaForge WASM — Boîte à Outils Multimédia 100% Client-Side

> **Convertisseur, Optimiseur et Découpeur Multimédia de nouvelle génération fonctionnant intégralement dans votre navigateur grâce à WebAssembly et FFmpeg.wasm.**  
> **Zéro octet envoyé vers un serveur — Confidentialité et rapidité maximales.**

---

## 🚀 Fonctionnalités Principales

### 1. 🖼️ Compression d'Images en Masse (Batch)
- **Formats cibles** : WebP (recommandé), AVIF (compression extrême jusqu'à -90%), JPEG, PNG.
- **Paramètres fins** : curseur de qualité en temps réel (1-100%), préréglages instantanés (Éco 65%, Équilibré 80%, Pro 92%).
- **Redimensionnement dynamique** : Échelle (75%, 50%), dimension maximale (1920px Full HD), conservation automatique du ratio d'aspect.
- **Téléchargement par lot** : téléchargement individuel ou génération d'une archive `.ZIP` compressée avec suivi de progression.
- **Comparateur interactif Avant / Après** : curseur fluide de comparaison en direct, vue scindée ou côte à côte, zoom 1x-3x, calcul précis des mégaoctets économisés.

### 2. 🎵 Extraction Audio depuis une Vidéo
- Extrait la piste sonore d'une vidéo (MP4, WebM, MOV, MKV, AVI...) directement via FFmpeg WebAssembly.
- **Formats audio** : MP3, WAV (non compressé), AAC, OGG Vorbis, FLAC (haute résolution).
- **Débits configurables** : 320 kbps (Studio), 256 kbps, 192 kbps, 128 kbps, 64 kbps.
- **Lecteur audio intégré** pour prévisualiser immédiatement l'audio extrait avant téléchargement.

### 3. ✂️ Rognage et Découpage Vidéo MP4
- Lecteur vidéo avec prévisualisation et curseur de positionnement temporel.
- **Stream-Copy instantané (`-c copy`)** : découpage en une fraction de seconde sans ré-encodage ni perte de qualité.
- Sélection interactive des points de début et de fin (touches directes à la position de lecture ou curseur).
- Mode ré-encodage précis à l'image près si nécessaire.

### 4. 🎞️ Convertisseur Vidéo & Générateur de GIF Animé
- Création de GIF animés de haute qualité avec analyse de palette 2-passes (sans effet de banding / aplats).
- Réglage du nombre d'images par seconde (FPS) et de la résolution.
- Compression de vidéos MP4/WebM avec facteur de qualité constante (CRF).

---

## 🎨 Design & Expérience Utilisateur

- **Zone magnétique de drag-and-drop** : physique de ressort (spring physics) qui suit le pointeur de la souris en 3D avec halo lumineux dynamique et animations réactives au survol.
- **Barres de progression liquides & irisées** : gradients animés (`linear-gradient` avec shimmer sweep) indiquant la progression exacte en temps réel.
- **Comparateur Avant / Après fluide** : curseur divisé réactif au drag souris/tactile avec statistiques de réduction.
- **Bouton de test immédiat avec fichiers d'exemple** : génère instantanément en local une photo HD ou un clip vidéo test avec synthétiseur audio pour essayer immédiatement l'application sans chercher de fichier sur son ordinateur !

---

## 🛠️ Stack Technique

- **Framework** : React 19 + TypeScript
- **Bundler** : Vite 8
- **Styles & Design** : Tailwind CSS v4
- **Animations** : Framer Motion
- **Icônes** : Lucide React
- **Moteur WASM** : `@ffmpeg/ffmpeg` 0.12 + `@ffmpeg/core` (hébergé en local dans `/ffmpeg/`)
- **Archivage** : JSZip
- **Effets festifs** : Canvas-Confetti

---

## 🌐 Déploiement & En-têtes HTTP (COOP & COEP)

FFmpeg.wasm et `SharedArrayBuffer` nécessitent l'isolation Cross-Origin du navigateur. Le projet inclut déjà toutes les configurations prêtes à l'emploi :

### 1. Cloudflare Pages
Le fichier `public/_headers` est automatiquement déployé à la racine du build :
```http
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
  Access-Control-Allow-Origin: *
```

### 2. Netlify
Le fichier `netlify.toml` à la racine applique les mêmes en-têtes automatiquement :
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

### 3. Fallback Service Worker universel (`coi-serviceworker`)
Pour les hébergements statiques stricts ne supportant pas les en-têtes personnalisés (comme GitHub Pages), le script `public/coi-serviceworker.js` injecte dynamiquement l'isolation côté client pour garantir l'activation de `SharedArrayBuffer`.

---

## 💻 Lancer en Local

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement Vite
npm run dev

# 3. Compiler pour la production
npm run build

# 4. Prévisualiser le build de production
npm run preview
```
