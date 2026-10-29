# Camera projection

## Description

Switches the map between a 3D **perspective** camera (the SDK default) and a flat **orthographic** camera, through the `cameraProjection` option of `visioOne.createView()`:

```ts
cameraProjection?: 'perspective' | 'orthographic' // default: 'perspective'
```

The projection is a **view-creation option only**. `view.cameraProjection` is read-only: it reports the projection the view was created with, and there is no setter or runtime switch. Switching projection therefore means creating a new view, which in practice (see "Things to know") means reloading the venue too.

## SDK usage

The React Native side passes the projection as a `VisioMapView` prop, which sends it in the same `setup` message used for the map hash:

```tsx
// src/bridge/VisioMapView.tsx
if (evt.type === 'page_ready') {
  send('setup', {
    hash: mapHash ?? DEMO_MAP_HASH,
    baseURL,
    enableShadows,
    cameraProjection, // 'perspective' | 'orthographic'
    authorizationToken,
  });
}
```

The WebView page forwards it to `createView`:

```js
// src/webview/core.js, in setup()
venue = await visioOne.loadVenue(loadOptions, container)
const viewOptions = {
  cameraProjection: cameraProjection === 'orthographic' ? 'orthographic' : 'perspective',
}
if (enableShadows === true) {
  viewOptions.enableShadows = true
}
view = await visioOne.createView(container, venue, viewOptions)
```

Then this feature reads the projection back from the view and adds it to the `ready` message, which React Native listens to:

```js
// src/features/camera-projection-toggle/webview.js
core.onReady((view) => ({ cameraProjection: view.cameraProjection })) // what the view really uses
```

```ts
// src/features/camera-projection-toggle/bridge.ts
export type CameraProjection = 'perspective' | 'orthographic';

export const useReportedCameraProjection = () => {
  const [projection, setProjection] = React.useState<CameraProjection | null>(null);
  useMapEvent('ready', (data) => setProjection(data?.cameraProjection ?? null));
  return projection;
};
```

To switch, this app does not try to rebuild the view inside the running page: it remounts the `WebView` by giving the map a new React `key` that includes the projection. The page loads from scratch, receives a new `setup` message with the other projection, and runs `loadVenue` + `createView({ cameraProjection })` again:

```tsx
// src/features/camera-projection-toggle/CameraProjectionScreen.tsx
const CameraProjectionScreen = () => {
  const [cameraProjection, setCameraProjection] = React.useState<CameraProjection>('perspective');
  return (
    <FeatureMap
      mapKey={`camera-projection-toggle-${cameraProjection}`} // becomes VisioMapView's key
      cameraProjection={cameraProjection}>
      {(sheet) => (
        <CameraProjectionPanel
          sheet={sheet}
          requestedProjection={cameraProjection}
          onSelect={setCameraProjection}
        />
      )}
    </FeatureMap>
  );
};
```

If you prefer to switch inside the same page, use the sequence under "Things to know". Rebuilding only the view does not work.

## Things to know

- **Creation-time only.** `cameraProjection` is read once by `createView`. `view.cameraProjection` is read-only and only reports the projection in use. Setting it has no effect, and there is no SDK method that changes the projection of an existing view.
- **`?orthographic` URL parameter.** The SDK also reads an `?orthographic` query parameter (presence only, no value) from the page URL. That parameter forces orthographic and wins over the `createView` option, because the SDK merges options as "page URL > options passed in code > default". It can stand in for the option, but it also means a URL you don't control can override what your code asks for. Read `view.cameraProjection` instead of assuming the option was applied.
- **Rebuilding only the view on the same venue fails.** `await visioOne.destroyView(view)` followed by `visioOne.createView(container, sameVenue, { cameraProjection: 'orthographic' })` breaks. The SDK throws an unhandled `Error: Cannot fetch model` (an unhandled promise rejection, not a rejection of `createView`'s promise). The `createView` promise then never resolves or rejects, and the map stays blank. Reproduced in this app's WebView on SDK 1.1.0: still pending after 15 s, with either projection as the target. The working in-page sequence also reloads the venue:

  ```js
  await visioOne.destroyView(view)
  await visioOne.unloadVenue(venue)
  venue = await visioOne.loadVenue({ vg_maphash }, container)
  view = await visioOne.createView(container, venue, { cameraProjection: 'orthographic' })
  ```

  On this repo's demo map this took about 0.05 s for `unloadVenue`, 0.9 s for `loadVenue` and 4.5 s for `createView`, measured in the iOS simulator. Remounting the whole WebView, as this app does, costs about 8 s from tap to `ready`, because the SDK module is imported again too.
- **Everything attached to the old view or venue is lost.** Event listeners (`poiclick`, `currentfloorchanged`, `exploremodechanged`, tracking events…), runtime-created POIs, images, labels and markers, the camera position, the selected floor, the explore mode, the theme and accent colors, and the tracking state all go away. Your app has to register and restore whatever it needs after the new view is ready. Here the listeners are re-registered automatically because the page runs its normal startup again. The camera, floor and similar state are not restored: the new view opens on the venue's default view.
- **No sky in orthographic.** In perspective the SDK draws a light sky/fog background. In orthographic it draws none, and the canvas stays transparent, so the host page's background shows around the map. In this app's WebView that is plain white, because the page has no background set. Painting the page background red turned the area around the map red in orthographic and left it unchanged in perspective. If your page or app has a dark background, the orthographic map appears on black. Set a background on the map container if you want a specific color.
- The orthographic camera opens noticeably more zoomed out than the perspective one, on the same venue and the same default view.

## Learn more

- [Custom map server](./custom-base-url.md) and [Custom theme](./custom-theme.md) use the same `setup` round trip for other load- and creation-time options (`LoadOptions.baseURL`, `enableShadows`).
