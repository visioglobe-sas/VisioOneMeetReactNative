# VisioOneMeetRN

Exemple d'intégration du SDK [VisioOne](https://www.npmjs.com/package/@visioglobe/visioone) de Visioglobe dans une application React Native, via `react-native-webview`. Le SDK (moteur 3D pour cartes indoor/outdoor construites avec VisioMapEditor) tourne entièrement dans la WebView ; l'app React Native communique avec lui par `postMessage`.

## Ce que montre cet exemple

- Charger le SDK VisioOne en ESM depuis le CDN Visioglobe dans une `WebView` React Native ([`src/assets/visioOne.html`](src/assets/visioOne.html)).
- Un pont typé `postMessage` entre le JS natif et la page web ([`src/screens/useVisioMap.ts`](src/screens/useVisioMap.ts)) pour piloter le SDK : aller à un lieu, changer d'étage, lancer un itinéraire, mettre à jour l'occupation de zones, réinitialiser la vue.
- Un écran minimal ([`src/screens/MapScreen.tsx`](src/screens/MapScreen.tsx)) illustrant ces commandes.
- Un contournement à connaître si vous chargez du HTML local dans une `WebView` en React Native — voir [`docs/SDK_NOTES.md`](docs/SDK_NOTES.md).

## Configurer votre propre carte

Récupérez le hash de votre carte sur [my.visioglobe.com](https://my.visioglobe.com) et remplacez `DEMO_MAP_HASH` dans [`src/screens/MapScreen.tsx`](src/screens/MapScreen.tsx) (actuellement une carte de démonstration Visioglobe).

## Démarrage

Prérequis : suivre le guide [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) de React Native.

### 1. Démarrer Metro

```sh
npm install
npm start
```

### 2. Build & run

**iOS** — installer les dépendances CocoaPods (première fois, ou après mise à jour des dépendances natives) :

```sh
bundle install
bundle exec pod install
npm run ios
```

**Android** :

```sh
npm run android
```

## Structure

```
App.tsx                          # entrée de l'app, bascule vers un mode diagnostic optionnel
src/
├── screens/
│   ├── MapScreen.tsx            # écran carte : WebView + commandes (place, itinéraire, reset)
│   └── useVisioMap.ts           # pont postMessage natif → WebView
└── assets/
    ├── visioOne.html            # page hôte chargée dans la WebView (SDK en ESM depuis le CDN)
    ├── visioOneHtml.ts          # même contenu que visioOne.html, exporté en template literal
    ├── diagnostic.html          # page de debug bas niveau (isoler un souci WebView du SDK)
    └── diagnosticInlineHtml.ts  # même contenu, en template literal

docs/
└── SDK_NOTES.md                 # pourquoi le HTML est chargé "inline" plutôt que via require()
```

## Troubleshooting

Voir la page [Troubleshooting](https://reactnative.dev/docs/troubleshooting) officielle de React Native pour les problèmes génériques de setup (Metro, CocoaPods, simulateur…). Pour tout ce qui touche au chargement de la carte VisioOne elle-même, voir [`docs/SDK_NOTES.md`](docs/SDK_NOTES.md).
