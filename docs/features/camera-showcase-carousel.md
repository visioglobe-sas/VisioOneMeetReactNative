# Camera showcase

## Description

An automatic camera tour of the map, for kiosks and lobby screens: the camera flies through a fixed list of places, one after the other, forever. It is built on the view's camera animation methods, which all return an `AnimationPromise`:

```ts
view.goToFloor(floor: Floor, animationOptions?: AnimationOptions): AnimationPromise
view.goToPOI(poi: POI, animationOptions?: AnimationOptions): AnimationPromise
view.goToViewpoint(viewpoint: { positions: Position[]; targetAltitude?: number },
                   animationOptions?: AnimationOptions): AnimationPromise

interface AnimationOptions {
  duration?: number                 // ms
  easing?: string                   // an animejs Penner function name, e.g. 'easeInOutQuad'
  padding?: Padding
  orientation?: {                   // final camera orientation, in degrees
    heading?: number | 'initial'    // 'initial' = leave it untouched
    pitch?: number | 'initial'
  }
}

interface AnimationPromise extends Promise<void> {
  isCanceled: boolean
  cancel(): void
}
```

Each hop is `goToFloor` on the place's floor, then `goToPOI` with a heading that turns by 90° per stop and a 30° pitch, then a 3 s dwell. Touching the map pauses the tour immediately so the user's gesture wins; it resumes on its own from the next stop after 10 s without touch.

The demo tours 4 places of the demo venue, across 3 buildings: `B4-UL00-ID0009`, `B1-LL01-ID0152`, `B3-UL00-ID0064`, `B4-UL03-ID0015`. The list is `CAROUSEL_STOP_IDS` in `src/demoMap.ts`, sent to the page with the start message.

## SDK usage

The whole loop runs inside the WebView page, next to the `view` it animates. React Native only starts and stops it, and mirrors the state the page reports on every change (Start/Stop, a touch on the map, the idle timer resuming the tour):

```ts
// src/features/camera-showcase-carousel/bridge.ts -- CAROUSEL_STOP_IDS comes from src/demoMap.ts
export type CameraCarouselState = 'running' | 'paused' | 'stopped';

export interface CameraCarouselStatus {
  state: CameraCarouselState;
  stopIndex: number;
  stopCount: number;
  poiId: string | null;
  resumeAfterMs: number;
}

export const useCameraCarouselBridge = () => {
  const { send } = useMapBridge();
  const [status, setStatus] = React.useState<CameraCarouselStatus>(INITIAL_STATUS);

  useMapEvent<CameraCarouselStatus>('camera_carousel_status', setStatus);

  return {
    status,
    startCameraCarousel: () => send('start_camera_carousel', { stopIds: CAROUSEL_STOP_IDS }),
    stopCameraCarousel: () => send('stop_camera_carousel'),
  };
};
```

```js
// src/features/camera-showcase-carousel/webview.js
core.register({
  start_camera_carousel: ({ stopIds }) => {
    carouselStopIds = stopIds || []
    startCarousel(0)
  },
  stop_camera_carousel: () => {
    stopCarousel()
  },
})
```

Keeping the loop in the page means it does not depend on any React component staying mounted (it keeps running while the control panel is closed), there is only ever one loop, and it ends with the WebView when the screen is left.

The loop, in the page. A run id, bumped by every start/pause/stop, guarantees an older loop never continues after a newer action:

```js
// src/features/camera-showcase-carousel/webview.js
const runCarouselLoop = async (runId, startIndex) => {
  const view = core.view
  const isCurrentRun = () => runId === carouselRunId && carouselState === 'running'
  let index = startIndex
  while (isCurrentRun()) {
    const poi = core.findPoi(carouselStopIds[index])
    carouselStopIndex = index
    sendCarouselStatus()
    if (poi) {
      // The SDK docs make the caller responsible for switching to the POI's floor
      // before goToPOI.
      if (poi.floor) {
        const floorAnimation = view.goToFloor(poi.floor, { duration: 800 })
        await floorAnimation
        if (!isCurrentRun()) {
          return
        }
        if (floorAnimation.isCanceled) {
          // Something else started a camera animation: let it win.
          pauseCarousel(false)
          return
        }
      }
      const poiAnimation = view.goToPOI(poi, {
        duration: 2500,
        easing: 'easeInOutQuad',
        orientation: { heading: index * 90, pitch: 30 },
      })
      await poiAnimation
      if (!isCurrentRun()) {
        return
      }
      if (poiAnimation.isCanceled) {
        pauseCarousel(false)
        return
      }
    } else {
      console.warn('camera-showcase-carousel: POI not found', carouselStopIds[index])
    }
    await new Promise((resolve) => setTimeout(resolve, CAROUSEL_DWELL_MS)) // 3000
    index = (index + 1) % carouselStopIds.length
  }
}
```

Pausing on touch. The SDK gives no signal that the user moved the camera, so the page listens for touches on the map container itself (`core.container`, the `#content` element the map is created in), in the capture phase, registered once on the first start:

```js
// src/features/camera-showcase-carousel/webview.js, in startCarousel()
core.container.addEventListener('pointerdown', () => onCarouselTouch(), { capture: true })
// pointerup restarts the 10 s idle delay, so a long drag doesn't resume mid-gesture
core.container.addEventListener('pointerup', () => onCarouselTouch(), { capture: true })
```

`onCarouselTouch` calls `pauseCarousel(true)`, which invalidates the running loop, stops the camera **where it is** and schedules the resume from the next stop:

```js
// src/features/camera-showcase-carousel/webview.js
// Starting another animation interrupts the running one in place.
// (animation.cancel() would stop the camera in place too.)
const freezeCamera = () => {
  const view = core.view
  if (!view) {
    return
  }
  try {
    view.goToViewpoint(
      { positions: [view.camera.target] },
      { duration: 0, orientation: { heading: 'initial', pitch: 'initial' } }
    )
  } catch (error) {
    console.error('freezeCamera failed', error)
  }
}

const pauseCarousel = (interruptCamera) => {
  if (carouselState === 'stopped') {
    return
  }
  if (carouselState === 'running') {
    carouselState = 'paused'
    carouselRunId += 1
    if (interruptCamera) {
      freezeCamera()
    }
    sendCarouselStatus()
  }
  clearCarouselResumeTimer()
  carouselResumeTimer = setTimeout(() => {
    carouselResumeTimer = null
    if (carouselState === 'paused') {
      startCarousel((carouselStopIndex + 1) % carouselStopIds.length)
    }
  }, CAROUSEL_RESUME_AFTER_MS) // 10000
}
```

Stop clears the resume timer and invalidates the loop. It deliberately does not touch the hop in flight: that animation finishes on its own, and no further hop is started.

## Things to know

- **`animation.cancel()` stops the camera where it is.** It resolves the promise immediately with `isCanceled === true` and leaves the camera in the state it is in at the moment of the call. The public typing of `cancel()` says it "puts the animation target in its final state": that wording is wrong. The SDK core implementation (1.1.0) documents and implements the opposite, and live measurements (Android `WebView`, iOS `WKWebView`) confirm it. The demo pauses with a zero-length `goToViewpoint` instead (see above); both stop the camera in place.
- **A new camera animation interrupts the running one, in place.** The running animation's promise resolves with `isCanceled === true` and the camera continues from where it was, without jumping to the old destination. The demo uses this to freeze the camera on touch: a zero-length `goToViewpoint` on `view.camera.target`, with `heading`/`pitch` set to `'initial'`. Measured on a touch in the middle of a `goToPOI`: the camera stayed where it was, about 30 m from the destination. It only settled by a few meters and about 2° of heading within the next 100 ms.
- **Check `isCanceled` after every `await`.** Any later camera animation cancels the current one, whoever started it. A loop that ignores `isCanceled` would keep fighting whatever moved the camera.
- **User drags don't interrupt SDK animations, and there is no "camera moved by user" event.** A drag during a `goTo*` animation does not stop it: the animation runs to the end and the user fights the camera. Detect touches yourself, for example with a `pointerdown` listener on the map container in the capture phase, as above.
- **Known SDK issue (1.1.0): the camera can break after a drag on an underground floor.** Observed in testing: after `goToPOI` with `orientation: { heading: 90 or 180, pitch: 45 }` on the underground POI `B1-LL01-ID0152` (floor `B1-LL1`, camera at its 10 m minimum altitude), one or two user drags turned `view.camera.heading` into `NaN` and `pitch` into `0`, and the map rendered black until the view was reloaded. It is not systematically reproducible; pitch 30 did not trigger it in the attempts made, so the demo uses `pitch: 30`.
- **Call `goToFloor` before `goToPOI`** when the place is on another floor. The SDK documentation makes the caller responsible for that. In SDK 1.1.0, `goToPOI` alone did switch the floor in a test, but the demo follows the documented order. One hop takes about 0.8 s (`goToFloor`) + 2.5 s (`goToPOI`) with the durations above.
- **`orientation` sets the camera's final heading and pitch, in degrees.** Here the heading turns 90° per stop. `view.camera.heading` reads it back normalized to (-180, 180], so a requested 270° reads back as -90°. `'initial'` leaves a value untouched.
- **`goToPOI` decides the zoom.** The final camera distance depends on the place's size. A small place can bring the camera down to the camera's minimum altitude (10 m by default, `view.camera.minimumAltitude`). Use `padding` or a different place if a stop is too close.

## Learn more

- [Go to place](goto-poi.md): a single `goToPOI` hop driven from React Native.
- [Floor selector](floor-selector.md): `goToFloor` / `goToBuilding`.
