# Custom theme

## Description

White-label styling, applied live without reloading the map:

- **3D scene theme** — `view.themes` (read-only list of registered theme ids: `['day', 'night', 'goldenHour']` as of SDK 1.1.0) and `view.setTheme(id)`, which switches the scene's lighting.
- **UI accent colors** — `view.accentColor` and `view.textAccentColor`, two settable properties that recolor the SDK's own UI buttons (the place card's "Go" button, "Add a step", "Remove step"…).

There is no custom font option in the SDK public API (as of 1.1.0).

## SDK usage

Themes only have a visible effect when the view is created with `enableShadows: true` (see "Things to know"). The React Native side passes it in the same `setup` message used for the map hash:

```ts
// useVisioMap.ts
sendMessage({ type: 'setup', data: { hash, baseURL, enableShadows } })
```

```js
// src/assets/visioOne.html
const viewOptions = { cameraProjection: 'perspective' } // see camera-projection-toggle.md
if (enableShadows === true) {
  viewOptions.enableShadows = true
}
await visioOne.createView(container, venue, viewOptions)
```

The available theme ids are read from the view once it's created and forwarded to React Native with the `ready` message (`view.themes` is a plain string array):

```js
sendToNative({ type: 'ready', data: { /* … */ themes: Array.from(view.themes || []) } })
```

Switching theme and recoloring the accent are one message each:

```ts
// useVisioMap.ts
sendMessage({ type: 'set_theme', data: { theme } }) // theme: one of view.themes
sendMessage({ type: 'set_accent_colors', data: { accentColor, textAccentColor } }) // either may be omitted
```

```js
// src/assets/visioOne.html (WebView message handler)
case 'set_theme':
  view.setTheme(evt.data.theme)
  break
case 'set_accent_colors':
  if (typeof evt.data.accentColor === 'string') view.accentColor = evt.data.accentColor
  if (typeof evt.data.textAccentColor === 'string') view.textAccentColor = evt.data.textAccentColor
  break
```

(The actual handlers wrap each call in `try`/`catch`, since both can throw — see below.)

## Things to know

- `setTheme` only changes the 3D scene's lighting (directional and ambient light color/position), never the UI. It has **no visible effect at all unless the view was created with `enableShadows: true`** — the rendered frame is pixel-identical otherwise, even at high quality. With shadows enabled, `night` is darker and bluish and `goldenHour` warm and muted.
- `enableShadows` is described by the SDK as computationally expensive. Only enable it where you actually need themes (this demo enables it on this screen only).
- `setTheme` throws `Cannot apply given theme <id> as it isn't registered.` for any id that isn't in `view.themes` — build your choices from `view.themes` rather than hardcoding them.
- There is no getter for the current theme (as of SDK 1.1.0): the SDK starts on `day`, and your app has to track the selection itself.
- `accentColor` / `textAccentColor` apply immediately to SDK UI that is already on screen (e.g. an open place card). Assigning a string that isn't a hex, `rgba()` or `hsl()` color throws `Invalid color format provided, it should be hex color, rgba color or hsl color.` and leaves the previous value in place.
- The accent colors do **not** change the color of a selected surface on the map — that's a separate property, `view.surfaceSelectionColor`.
- The SDK defaults are `#0094F0` (accent) and `#FFFFFF` (text accent); resetting means assigning these back, there is no dedicated reset call.

## Learn more

- Both accent colors can also be set at load time, without any code, through the page's URL parameters `accentColor` and `textAccentColor` (the SDK reads them from its `URLParameters`).
- [`custom-base-url`](./custom-base-url.md) — the other per-screen option carried by the same `setup` message.
