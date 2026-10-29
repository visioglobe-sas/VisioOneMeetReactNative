# Camera lock on position

## Description

A "recenter on me" toggle, like in a GPS app: while it's on, the camera follows the tracked position on every update; while it's off, the user moves the camera freely and tracking keeps going.

It's built on one property of the view, `view.lockCameraPositionOnTracking` (boolean), plus the three view events the SDK dispatches whenever that state changes: `trackingon`, `trackingoff` and `trackingchanged`. The lock only means something while a position is being tracked, so this screen reuses the [simulated position](./simulated-position.md) mechanism (a position moving back and forth between two POIs through `view.injectTrackedPosition`) to have something to follow.

The sibling property `view.lockCameraOrientationOnTracking` (camera heading follows the device orientation) is not demonstrated here, since it needs a real device-orientation feed.

## SDK usage

Turning the lock on or off is a single message from React Native:

```ts
// src/features/camera-lock-on-position/bridge.ts
export const useCameraLockBridge = () => {
  const { send } = useMapBridge();
  const [locked, setLocked] = React.useState(false);

  useMapEvent('camera_lock_changed', (data) => setLocked(data?.locked === true));

  return {
    locked,
    setCameraLockOnPosition: (value: boolean) => send('set_camera_lock_on_position', { locked: value }),
  };
};
```

```js
// src/features/camera-lock-on-position/webview.js
core.register({
  set_camera_lock_on_position: ({ locked }) => {
    if (core.view) {
      core.view.lockCameraPositionOnTracking = locked
    }
  },
})
```

The toggle doesn't keep its own copy of the value: it displays the SDK's state, because the SDK changes the lock by itself (see "Things to know"). Right after `createView`, the page subscribes once to the three tracking events and forwards the current value to React Native. The events carry no lock value, so it's read from the view inside the handler:

```js
// src/features/camera-lock-on-position/webview.js (core.onViewCreated runs right after createView)
core.onViewCreated((view) => {
  const sendCameraLockState = () => {
    core.sendToNative({
      type: 'camera_lock_changed',
      data: { locked: view.lockCameraPositionOnTracking === true },
    })
  }
  view.addEventListener('trackingon', sendCameraLockState)
  view.addEventListener('trackingoff', sendCameraLockState)
  view.addEventListener('trackingchanged', sendCameraLockState)
})
```

On the React Native side, `camera_lock_changed` updates the `locked` state the toggle displays (see `useCameraLockBridge` above). Pressing the toggle only sends `set_camera_lock_on_position`; the SDK replies with `trackingchanged`, and the toggle follows.

Tracking itself is turned on once, right before the first injected position, and never again on later updates:

```js
// src/features/simulated-position/webview.js
inject_tracked_position: ({ position, precisionCircleRadius }) => {
  const view = core.view
  if (!view) {
    return
  }
  if (!view.allowTracking) {
    view.allowTracking = true
  }
  view.injectTrackedPosition({ position, precisionCircleRadius })
},
```

## Things to know

- **`view.allowTracking = true` turns the lock on by itself.** Each time it's set to `true`, the SDK sets `lockCameraPositionOnTracking` (and `lockCameraOrientationOnTracking`) to `true` and dispatches `trackingon`. So right after tracking starts, the camera follows the position even if your app never touched the lock.
- **Don't set `allowTracking = true` on every position update.** Because of the previous point, setting it again re-locks the camera each time, which undoes a user's unlock or pan on the next update. Only set it on the `false` -> `true` transition (`if (!view.allowTracking) view.allowTracking = true`).
- **A user pan turns the lock off.** When the user drags the map while the camera is locked, the SDK sets `lockCameraPositionOnTracking` to `false` and dispatches `trackingchanged`. Your app's own call never runs in that case, so a UI that only remembers what it last set gets out of sync.
- **`view.allowTracking = false` turns the lock off too** (both locks go back to `false` and `trackingoff` is dispatched). You don't need to reset the lock yourself when tracking stops.
- **Use `trackingon` / `trackingoff` / `trackingchanged` to keep a UI in sync**, and read `view.lockCameraPositionOnTracking` inside the handler. None of these events carries the new value.
- **Setting the lock while `allowTracking` is `false` does nothing**: it doesn't throw (unlike `injectTrackedPosition`), it doesn't change the value, and it doesn't dispatch `trackingchanged`. Turn tracking on first.
- Turning the lock off also cancels the camera animation in progress toward the tracked position.

## Learn more

- [`simulated-position`](./simulated-position.md): how the tracked position is fed with `view.injectTrackedPosition`, and how `allowTracking = false` removes it.
