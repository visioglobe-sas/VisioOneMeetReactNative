# Reset View

## Description

Recenters the camera on the venue's default view via `view.goToGlobal()` — a `View` method that takes no arguments and animates the camera back to the venue's initial framing, regardless of any zooming, panning, or POI selection done since.

## SDK usage

```ts
// useVisioMap.ts
webRef.current?.postMessage(JSON.stringify({ type: 'reset_map' }));
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const resetMap = () => {
  if (view) {
    view.goToGlobal()
  }
}
```

`view` is the object resolved by `createView(container, venue, options)` — keep a reference to it once created, since most `View` methods (including this one) are called directly on it.

## Things to know

- Takes no arguments — no payload needed beyond the message type.
- Only callable once `view` exists (i.e. after the SDK's `ready` event) — calling it earlier is a silent no-op, not an exception.
- The camera animates back immediately; there is no callback or event to await for completion.
