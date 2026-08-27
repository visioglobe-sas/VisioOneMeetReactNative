# VisioOneMeetRN

Example integration of Visioglobe's [VisioOne](https://www.npmjs.com/package/@visioglobe/visioone) SDK in a React Native application, via `react-native-webview`. The SDK (a 3D engine for indoor/outdoor maps built with VisioMapEditor) runs entirely inside the WebView; the React Native app communicates with it through `postMessage`.

## Setup

### Prerequisites

Follow React Native's [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide for your target platform(s).

### Install

```sh
npm install
```

### Configure your own map

This repo ships pointed at a Visioglobe demo venue. To load your own map, get a venue hash from [my.visioglobe.com](https://my.visioglobe.com) and replace `DEMO_MAP_HASH` in [`src/components/VisioMapView.tsx`](src/components/VisioMapView.tsx).

### Run

Start Metro:

```sh
npm start
```

Then, in another terminal:

**iOS** — install CocoaPods dependencies first (first run, or after any native dependency change):

```sh
bundle install
bundle exec pod install
npm run ios
```

**Android**:

```sh
npm run android
```

## Features

Each feature below is a self-contained screen in the app, demonstrating one piece of the VisioOne SDK. Every entry links to a developer doc with the exact SDK call, its signature, and any gotchas.

- **[Reset view](docs/features/reset-view.md)** — recenter the camera on the venue's default view.
- **[Go to place](docs/features/goto-poi.md)** — center the camera on a place (POI) by its ID.
- **[Itinerary](docs/features/compute-navigation.md)** — compute and display a route between two places.
- **[Tap a place](docs/features/poi-click.md)** — show a tapped place's info in a panel.
- **[Floor selector](docs/features/floor-selector.md)** — switch floor or building from a list driven by the app, in sync with the SDK's own floor-selector widget.
- **[Simulated occupancy](docs/features/occupancy-simulated.md)** — toggle a place's occupancy color with simulated data.
- **[UI visibility](docs/features/ui-part-visibility.md)** — show or hide individual parts of the map's default UI.
- **[Simulated position](docs/features/simulated-position.md)** — animate a simulated tracked position with an accuracy circle between two places.
- **[Camera lock on position](docs/features/camera-lock-on-position.md)** — recenter and lock the camera onto a simulated tracked position, like a "recenter on me" toggle.
- **[Clickable surface](docs/features/clickable-surface.md)** — make a place's surface interactive, letting the SDK swap its color on hover/tap.
- **[Custom data](docs/features/custom-data.md)** — read custom business data (price, hours, reference) attached to a place in VisioMapEditor.
- **[Category highlight](docs/features/category-highlight.md)** — highlight every place belonging to a chosen category, e.g. all restaurants or all shops.
- **[Dynamic POI](docs/features/dynamic-poi-crud.md)** — create, edit and remove a place at runtime, without republishing the map.
- **[Runtime language](docs/features/runtime-locale.md)** — switch the map's displayed language at runtime, without reloading or republishing the map.

## Project structure

```
App.tsx                                    # entry point, optionally switches to a diagnostic mode
src/
├── navigation/
│   └── RootNavigator.tsx                  # Home ↔ Feature screen stack
├── screens/
│   ├── HomeScreen.tsx                     # feature menu
│   ├── FeatureScreen.tsx                  # hosts the map + the active feature's overlay
│   └── useVisioMap.ts                     # native → WebView bridge (postMessage senders)
├── components/
│   └── VisioMapView.tsx                   # WebView wrapper, map status, incoming message handling
├── features/
│   ├── registry.ts                        # feature list (slug, title, description)
│   └── *Overlay.tsx                       # per-feature controls
└── assets/
    ├── visioOne.html                      # WebView-hosted page loading the SDK from the CDN
    ├── visioOneHtml.ts                    # same content as visioOne.html, as a template literal
    ├── diagnostic.html                    # low-level debug page (isolate WebView issues from SDK issues)
    └── diagnosticInlineHtml.ts            # same content, as a template literal

docs/
├── SDK_NOTES.md                           # why the HTML is loaded "inline" rather than via require()
└── features/                              # one doc per feature, see Features above
```

## Troubleshooting

See React Native's official [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page for generic setup issues (Metro, CocoaPods, simulator, etc.). For anything related to loading the VisioOne map itself, see [`docs/SDK_NOTES.md`](docs/SDK_NOTES.md).
