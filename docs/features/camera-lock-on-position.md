# Camera Lock on Position

## Description

A "recenter on me" toggle, GPS-app style: locks the camera's focus onto whichever position is currently tracked by the SDK, via `view.lockCameraPositionOnTracking` — a boolean property on `View`, not a one-shot method or event. While `true`, the camera follows every newly injected tracked position; setting it back to `false` returns camera control to the user without affecting tracking itself.

This only has a visible effect when there's a moving tracked position to lock onto, so it builds on [Simulated Position](simulated-position.md)'s tracking mechanism. The SDK also has a sibling property, `view.lockCameraOrientationOnTracking`, to lock the camera's *orientation* (requires a device-orientation feed) — out of scope here; only position locking is covered.

## SDK usage

```ts
// useVisioMap.ts
const setCameraLockOnPosition = (locked: boolean) => {
  sendMessage({ type: 'set_camera_lock_on_position', data: { locked } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const setCameraLockOnPosition = (locked) => {
  if (view) {
    view.lockCameraPositionOnTracking = locked
  }
}
```

## Things to know

- `lockCameraPositionOnTracking` only has a visible effect once `view.allowTracking` is `true` (see [Simulated Position](simulated-position.md)). Setting it while `allowTracking` is still `false` is a documented no-op on the SDK side — unlike `injectTrackedPosition`, which throws in that situation, so no guard is required before calling this.
- The SDK does not reset this boolean on its own when `allowTracking` goes back to `false` — if a fresh simulation should always start unlocked, the app needs to explicitly set it back to `false` when tracking stops.
- `lockCameraOrientationOnTracking` (orientation locking) is a separate, sibling property, not covered here; it requires a real device-orientation feed.
- The camera movement is only noticeable if the tracked position actually travels a meaningful distance — two points very close together will barely move the camera.

## Learn more

- [Simulated Position](simulated-position.md) — the tracking mechanism (`view.allowTracking`, `injectTrackedPosition`) this feature locks the camera onto.
- Orientation locking (`lockCameraOrientationOnTracking`) would need a real device-orientation feed; out of scope for this repo — see the [VisioOneHub](https://github.com/visioglobe-sas/VisioOneHub) for the broader example catalog.
