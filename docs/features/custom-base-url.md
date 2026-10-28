# Custom map server

## Description

Points the SDK at a different map server than Visioglobe's default SaaS, via `LoadOptions.baseURL` — the root URL the SDK fetches all map data from (venue config, tiles, icons).

## SDK usage

`baseURL` is a `loadVenue` option, not a live property of an already-loaded venue/view — changing it means reloading the venue from scratch:

```js
// src/webview/core.js, in setup({ hash, baseURL, ... })
const trimmedBaseURL = typeof baseURL === 'string' ? baseURL.trim() : ''
// ...
const loadOptions = trimmedBaseURL
  ? { vg_maphash: venueHash, baseURL: trimmedBaseURL }
  : { vg_maphash: venueHash } // omitted entirely -> SDK falls back to its own default
venue = await visioOne.loadVenue(loadOptions, container)
```

The React Native side passes the current value as `VisioMapView`'s `baseURL` prop, sent as part of the same `setup` message already used for the map hash:

```tsx
// src/bridge/VisioMapView.tsx
if (evt.type === 'page_ready') {
  send('setup', {
    hash: mapHash ?? DEMO_MAP_HASH,
    baseURL,
    enableShadows,
    cameraProjection,
    authorizationToken,
  });
}
```

Reloading with a new `baseURL` is done by fully unmounting and remounting the `VisioMapView`/`WebView` (the screen changes the map's React `key`), rather than trying to mutate an in-place venue — there is no SDK call that swaps a loaded venue's server without a fresh `loadVenue`:

```tsx
// src/features/custom-base-url/CustomBaseUrlScreen.tsx
const CustomBaseUrlScreen = () => {
  const [baseURL, setBaseURL] = React.useState(DEFAULT_BASE_URL); // 'https://mapserver.visioglobe.com/'
  // The value the current map was loaded with: editing the field alone changes nothing.
  const [loadedBaseURL, setLoadedBaseURL] = React.useState(DEFAULT_BASE_URL);
  const [reloadKey, setReloadKey] = React.useState(0);

  return (
    <FeatureMap mapKey={`custom-base-url-${reloadKey}`} baseURL={loadedBaseURL}>
      {(sheet) => (
        <BottomSheet {...sheet}>
          <CustomBaseUrlControls
            baseURL={baseURL}
            onChangeBaseURL={setBaseURL}
            onReload={() => {
              setLoadedBaseURL(baseURL);
              setReloadKey((key) => key + 1);
            }}
          />
        </BottomSheet>
      )}
    </FeatureMap>
  );
};
```

(`FeatureMap` renders `<VisioMapView key={mapKey} ...>`.)

## Things to know

- The SDK's own default is `https://mapserver.visioglobe.com/` — leaving the field untouched (or blank) reproduces the exact behavior every other screen already gets, which is itself part of the demo (it proves the parameter is genuinely wired through, not just decorative).
- The map hash option sitting next to `baseURL` is named `vg_maphash` since SDK 1.0.6 (it was `hash` before; a `hash` key is now silently ignored and the load fails with `Hash not found`).
- An invalid or unreachable `baseURL` doesn't hang or crash — `loadVenue` rejects with a typed, catchable `VenueNotFoundError` (same error class as an invalid map hash), surfaced here through the existing generic `error` message the WebView already sends on any `loadVenue` failure.
- Hosting an actual alternate map server is a separate infrastructure decision this demo doesn't make for you — see the SDK's on-premise/self-hosting documentation for that side of it.

## Learn more

- [`goto-poi`](./goto-poi.md) — the other feature relying on the same generic `setup`/`error` round trip for its initial venue load.
