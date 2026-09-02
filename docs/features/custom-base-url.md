# Custom map server

## Description

Points the SDK at a different map server than Visioglobe's default SaaS, via `LoadOptions.baseURL` — the root URL the SDK fetches all map data from (venue config, tiles, icons).

## SDK usage

`baseURL` is a `loadVenue` option, not a live property of an already-loaded venue/view — changing it means reloading the venue from scratch:

```js
// visioOneHtml.ts / visioOne.html
const loadOptions = trimmedBaseURL
  ? { hash: venueHash, baseURL: trimmedBaseURL }
  : { hash: venueHash } // omitted entirely -> SDK falls back to its own default
venue = await visioOne.loadVenue(loadOptions, container)
```

The React Native side sends the current field value as part of the same `setup` message already used for the map hash:

```ts
// useVisioMap.ts
sendMessage({ type: 'setup', data: { hash, baseURL } })
```

```ts
// visioOneHtml.ts (WebView message handler)
case 'setup':
  setup(evt.data.hash, evt.data.baseURL)
  break
```

Reloading with a new `baseURL` is done by fully unmounting and remounting the `VisioMapView`/`WebView` (`FeatureScreen.tsx` changes the component's `key`), rather than trying to mutate an in-place venue — there is no SDK call that swaps a loaded venue's server without a fresh `loadVenue`.

## Things to know

- The SDK's own default is `https://mapserver.visioglobe.com/` — leaving the field untouched (or blank) reproduces the exact behavior every other screen already gets, which is itself part of the demo (it proves the parameter is genuinely wired through, not just decorative).
- An invalid or unreachable `baseURL` doesn't hang or crash — `loadVenue` rejects with a typed, catchable `VenueNotFoundError` (same error class as an invalid map hash), surfaced here through the existing generic `error` message the WebView already sends on any `loadVenue` failure.
- Hosting an actual alternate map server is a separate infrastructure decision this demo doesn't make for you — see the SDK's on-premise/self-hosting documentation for that side of it.

## Learn more

- [`goto-poi`](./goto-poi.md) — the other feature relying on the same generic `setup`/`error` round trip for its initial venue load.
