# Accuracy circle style

## Description

Recolors the tracked position's precision (accuracy) circle live: `view.updatePositionTrackerGraphicOptions({ color, opacity })` sets the color and opacity of the circle drawn around the tracked position (the SDK calls it the "blue dot"). The arrow icon in the middle is a fixed image and keeps its own look. The circle's size is a separate setting, `precisionCircleRadius`, passed with every `view.injectTrackedPosition(...)` call.

A tracked position has to exist for anything to show, so this feature reuses the [simulated position](./simulated-position.md) loop (a position interpolated back and forth between two POIs and injected every ~150 ms) and adds color presets and an opacity setting on top.

## SDK usage

The React Native side sends one message whenever the color or opacity changes, and once more on every Start (see "Things to know"):

```ts
// useVisioMap.ts
sendMessage({ type: 'set_position_tracker_style', data: { color, opacity } }) // e.g. '#e53935', 0.5
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
case 'set_position_tracker_style':
  view.updatePositionTrackerGraphicOptions({ color: evt.data.color, opacity: evt.data.opacity })
  break
```

(The actual handler wraps the call in `try`/`catch`, since it throws on invalid input.)

The radius travels with each injected position, as for simulated position:

```ts
// useVisioMap.ts, called on every tick of the React Native timer
sendMessage({ type: 'inject_tracked_position', data: { position, precisionCircleRadius } })
```

```js
// visioOneHtml.ts / visioOne.html
if (!view.allowTracking) {
  view.allowTracking = true
}
view.injectTrackedPosition({ position, precisionCircleRadius }) // radius in meters
```

Stopping is `view.allowTracking = false`.

## Things to know

- **Signature**: `updatePositionTrackerGraphicOptions(options: { color?: Color; opacity?: number }): void`. Both fields are optional.
- **Only the precision circle changes.** In SDK 1.1.0, color and opacity go to the circle (the SDK's "blue dot" mesh, sized by `precisionCircleRadius`). The arrow icon at the center of the tracked position is a fixed image texture that these options don't touch. With no radius (see below), there's no circle, so these options have nothing visible to change.
- **The options are only stored.** They're applied on the **next** `injectTrackedPosition` call, not right away. Here, the ~150 ms injection loop makes the change look instant. If your app injects positions rarely, expect the new style to appear with the next position update. Calling it while tracking is off is fine: the stored options are used once tracking starts.
- **The SDK resets color and opacity to its defaults (`#0094f0`, `0.3`) whenever tracking stops** (`view.allowTracking = false`). To keep a custom style across a stop/start, call `updatePositionTrackerGraphicOptions` again after each start, before or together with the first `injectTrackedPosition`. This demo re-sends the current selection right before the first position of every run.
- **The radius is not a graphic option.** It's `PositionTrackerOptions.precisionCircleRadius` (meters), passed on every `injectTrackedPosition`. If you omit it or pass `0`, no circle is drawn.
- **Invalid input throws.** A color that isn't a hex, `rgba()` or `hsl()` string throws `Invalid color format provided, it should be hex color, rgba color or hsl color.`. An opacity that isn't a number throws `Blue dot's opacity must be a number.`. An opacity of `0` skips that check because the check treats it as false, so this demo's minimum is `0.1`.
- **There's no getter** for the current graphic options: your app has to track the selected color and opacity itself.

## Learn more

- [`simulated-position`](./simulated-position.md): the tracking loop reused here (POI resolution, interpolation timer, `allowTracking`).
- [`camera-lock-on-position`](./camera-lock-on-position.md): another option layered on the same tracked position.
