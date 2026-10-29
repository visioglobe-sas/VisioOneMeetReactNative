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

This repo ships pointed at a Visioglobe demo venue. To load your own map, get a venue hash from [my.visioglobe.com](https://my.visioglobe.com) and replace `DEMO_MAP_HASH` in [`src/demoMap.ts`](src/demoMap.ts). That file also holds every demo POI id the feature screens are prefilled with (go-to target, itinerary origin/destination, tracking path, anchors, carousel stops...): replace them with ids from your own map.

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

### Editing the WebView page

All SDK calls run in the WebView page, split into one file per concern: [`src/webview/core.js`](src/webview/core.js) (map loading, the message channel, shared helpers) and one `src/features/<slug>/webview.js` per feature, listed in [`src/webview/index.html`](src/webview/index.html). The WebView loads the page as an inline string (see [`docs/SDK_NOTES.md`](docs/SDK_NOTES.md)), so `src/webview/visioOneHtml.ts` is a **generated** file: the page with every script inlined, committed so a fresh clone builds as is. Edit `index.html` and the `.js` files only, then regenerate:

```sh
npm run build:webview
```

`npm start`, `npm run ios`, `npm run android` and `npm test` regenerate it first on their own, and `npm run lint` fails if the generated file is out of date.

## Features

Each feature below is a self-contained screen in the app, demonstrating one piece of the VisioOne SDK. Every entry links to a developer doc with the exact SDK call, its signature, and any gotchas.

- **[Reset view](docs/features/reset-view.md)** — recenter the camera on the venue's default view.
- **[Go to place](docs/features/goto-poi.md)** — center the camera on a place (POI) by its ID.
- **[Itinerary](docs/features/compute-navigation.md)** — compute and display a route between two places.
- **[Custom navigation trace](docs/features/custom-navigation-trace.md)** — restyle a computed route's colors with a tappable preset palette.
- **[Avoid elevator](docs/features/navigation-exclude-modalities.md)** — exclude elevator segments from a computed route, rerouting through stairs instead.
- **[Accessible route](docs/features/accessible-mode.md)** — compute a route that avoids stairs, rerouting through a lift/ramp instead.
- **[Tap a place](docs/features/poi-click.md)** — show a tapped place's info in a panel.
- **[Floor selector](docs/features/floor-selector.md)** — switch floor or building from a list driven by the app, in sync with the SDK's own floor-selector widget.
- **[Simulated occupancy](docs/features/occupancy-simulated.md)** — toggle a place's occupancy color with simulated data.
- **[UI visibility](docs/features/ui-part-visibility.md)** — show or hide individual parts of the map's default UI.
- **[Native UI replacement](docs/features/native-ui-replacement.md)** — hide the SDK's own floor selector and drive floor changes entirely from the app's native picker.
- **[Simulated position](docs/features/simulated-position.md)** — animate a simulated tracked position with an accuracy circle between two places.
- **[Camera lock on position](docs/features/camera-lock-on-position.md)** — recenter and lock the camera onto a simulated tracked position, like a "recenter on me" toggle.
- **[Accuracy circle style](docs/features/accuracy-circle-style.md)** — recolor the tracked position's precision circle (color and opacity), live.
- **[Clickable surface](docs/features/clickable-surface.md)** — make a place's surface interactive, letting the SDK swap its color on hover/tap.
- **[Custom data](docs/features/custom-data.md)** — read custom business data (price, hours, reference) attached to a place in VisioMapEditor.
- **[Category highlight](docs/features/category-highlight.md)** — highlight every place belonging to a chosen category, e.g. all restaurants or all shops.
- **[Dynamic POI](docs/features/dynamic-poi-crud.md)** — create, edit and remove a place at runtime, without republishing the map.
- **[3D icon marker](docs/features/3d-icon-marker.md)** — place a custom image at a spot on the 3D map, oriented fixed, flat or facing the camera.
- **[Custom text label](docs/features/custom-text-label.md)** — place your own text on the map next to a place and restyle it live (text, color, size, rotation).
- **[HTML overlay marker](docs/features/html-overlay-marker.md)** — pin a tappable HTML badge on the map that's never hidden by 3D, with its taps forwarded to React Native.
- **[Runtime language](docs/features/runtime-locale.md)** — switch the map's displayed language at runtime, without reloading or republishing the map.
- **[Explore mode](docs/features/explore-mode.md)** — switch between the SDK's 3 building-exploration modes, including the exploded "carousel" view.
- **[Add locale](docs/features/add-locale.md)** — add a brand-new locale at runtime, never authored in VisioMapEditor, and prove it with a live translation round trip.
- **[Geofencing](docs/features/geofencing.md)** — flag a place as a zone and alert when a simulated tracked position enters or leaves it.
- **[Custom map server](docs/features/custom-base-url.md)** — point the SDK at a different map server than Visioglobe's default SaaS.
- **[Custom theme](docs/features/custom-theme.md)** — switch the 3D lighting theme and recolor the SDK's own buttons live.
- **[Camera projection](docs/features/camera-projection-toggle.md)** — switch between a 3D perspective view and a flat orthographic view (recreates the map, the projection is a view-creation option).
- **[Camera showcase](docs/features/camera-showcase-carousel.md)** — automatic camera tour of the map for kiosks and lobby screens, paused by a touch and resumed after 10 s idle.
- **[Protected map (token)](docs/features/auth-token.md)** — code sample: load a map protected by an authorization token (JWT from your own backend), refresh it, and handle `UnauthorizedError`. Placeholder values only, to replace with your own.

## Project structure

```
App.tsx                                    # entry point (providers + navigation)
scripts/
└── build-webview.mjs                      # inlines the page's scripts into src/webview/visioOneHtml.ts
src/
├── demoMap.ts                             # demo map hashes + POI ids used as prefilled values
├── navigation/RootNavigator.tsx           # Home ↔ Feature screen stack
├── screens/HomeScreen.tsx                 # feature menu
├── shell/
│   ├── FeatureScreen.tsx                  # one screen for every feature, driven by the feature table
│   └── FeatureMap.tsx                     # map + FAB + the feature's panel
├── bridge/
│   ├── VisioMapView.tsx                   # the WebView, map status, 'setup' handshake, message dispatch
│   └── MapBridge.ts                       # useMapBridge (send, status), useMapEvent (page → React Native)
├── features/
│   ├── registry.ts                        # the feature table (slug, title, description, panel or screen, map options)
│   └── <slug>/                            # everything of one feature:
│       ├── <Name>Panel.tsx                #   its panel (or <Name>Screen.tsx)
│       ├── bridge.ts                      #   the messages it sends and listens to
│       └── webview.js                     #   its SDK calls, in the WebView page
├── shared/positionTracking/               # simulated-position session, shared by the 4 tracking features
├── components/                            # BottomSheet, ItineraryForm, ColorChips
└── webview/
    ├── index.html                         # page skeleton, lists the scripts in load order
    ├── core.js                            # loadVenue/createView, message channel, shared SDK helpers
    ├── bootstrap.js                       # starts listening to React Native
    └── visioOneHtml.ts                    # GENERATED: the page with every script inlined, the string actually loaded

docs/
├── SDK_NOTES.md                           # why the HTML is loaded "inline" rather than via require()
└── features/                              # one doc per feature, see Features above
```

### How React Native and the page talk

Both directions are `{ type, data }` JSON messages over `postMessage`, with the same type strings on both sides.

- **React Native → page**: a feature's `bridge.ts` calls `send('select_place', { placeId })`; in the page, the feature's `webview.js` handles it through `MapCore.register({ select_place: ({ placeId }) => ... })`. A handler that throws is reported back as `command_error`.
- **Page → React Native**: `MapCore.sendToNative({ type, data })`; on the React Native side, `useMapEvent(type, handler)` calls the handler for as long as the component using it is mounted.
- **Loading**: the page posts `page_ready` once it listens, `VisioMapView` answers with `setup` (map hash and load/view options), and the page posts `ready` (or `error` / `unauthorized`). Each feature adds the initial state it needs to `ready`'s data through `MapCore.onReady`.

### Where is the code of feature X?

In `src/features/<slug>/`, `<slug>` being the name of its doc in `docs/features/`: its panel, its `bridge.ts` and its `webview.js`. A feature without a `webview.js` reuses another feature's messages (e.g. `accessible-mode` sends compute-navigation's `start_itinerary`); a feature without a panel has a `<Name>Screen.tsx` (custom-base-url and camera-projection-toggle, whose map options change at runtime) or no map at all (auth-token). Its entry in `src/features/registry.ts` gives its menu title and any map option of its own (custom-data's map hash, custom-theme's shadows, poi-click's missing FAB).

## Troubleshooting

See React Native's official [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page for generic setup issues (Metro, CocoaPods, simulator, etc.). For anything related to loading the VisioOne map itself, see [`docs/SDK_NOTES.md`](docs/SDK_NOTES.md).
