# Custom Data

## Description

Reads business `CustomData` — a free `{ [key: string]: string }` bag of fields (price, opening hours, product reference, ...) attached to a POI while editing the map in VisioMapEditor — via two `Venue` methods (SDK `visioone`, see `Venue.ts` in the `visioone` repo):

- `venue.refreshCustomData(): Promise<void>` — (re)loads all `CustomData` from the server.
- `venue.getPOICustomData(poi: POI): CustomData` — synchronous read of one POI's already-cached `CustomData`.

The two are deliberately separate calls: `refreshCustomData` is the (occasional, async, network) sync step, `getPOICustomData` is a cheap synchronous cache read that can be called as often as needed afterwards.

## SDK usage

```ts
// useVisioMap.ts
const refreshCustomData = () => {
  sendMessage({ type: 'refresh_custom_data' });
};

const getPoiCustomData = (placeId: string) => {
  sendMessage({
    type: 'get_poi_custom_data',
    data: { placeId },
  });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const refreshCustomData = async () => {
  if (!venue) {
    return
  }
  try {
    await venue.refreshCustomData()
    sendToNative({ type: 'custom_data_refreshed' })
  } catch (error) {
    sendToNative({
      type: 'custom_data_refresh_error',
      data: { message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) },
    })
  }
}

const getPoiCustomData = (placeId) => {
  if (!venue) {
    sendToNative({ type: 'poi_custom_data_result', data: { placeId, found: false, customData: {} } })
    return
  }
  const poi = venue.pois.find((p) => p.id === placeId)
  if (!poi) {
    sendToNative({ type: 'poi_custom_data_result', data: { placeId, found: false, customData: {} } })
    return
  }
  const customData = venue.getPOICustomData(poi)
  sendToNative({ type: 'poi_custom_data_result', data: { placeId, found: true, customData } })
}
```

Both calls need a response back on the native side, so — unlike a one-way message such as `select_place` — this feature uses the same request/response bridge idiom as `simulated-position`'s POI lookup (see [Simulated Position](simulated-position.md)): a message in, and a distinct message type back out once the WebView side has an answer.

`refreshCustomData()` replies with `{ type: 'custom_data_refreshed' }` on success or `{ type: 'custom_data_refresh_error', data: { message } }` on failure (e.g. no network). `getPoiCustomData(placeId)` always replies with `{ type: 'poi_custom_data_result', data: { placeId, found, customData } }` — `found: false` when the id doesn't resolve to a POI in the loaded venue, `found: true` otherwise (with `customData` possibly `{}`).

## Things to know

- **`refreshCustomData()` is not called automatically anywhere in the SDK.** The `CustomData` cache starts empty (`{}`) when a venue loads and stays that way until this method has been awaited at least once. Reading a POI's data before ever refreshing will look identical to that POI genuinely having no `CustomData` — call `refreshCustomData()` first (or at least once) before relying on `getPOICustomData` results.
- **`getPOICustomData(poi)` always returns a plain object, never `null`/`undefined`.** It returns `{}` both when the POI genuinely has no `CustomData` published and when the cache hasn't been refreshed yet — these two situations are indistinguishable from the return value alone. There is no separate "has this been refreshed" flag on the SDK side; this demo tracks that only in the app's own UI state (the "Refresh from server" outcome), not from anything the SDK exposes.
- **A POI resolving with an empty `CustomData` and a POI id not resolving at all are different, both non-error, states** — `venue.pois.find((p) => p.id === placeId)` failing is a "POI not found" case, entirely separate from a found POI whose `CustomData` happens to be `{}`. This demo's bridge response keeps them distinct (`found: false` vs. `found: true, customData: {}`) rather than collapsing them into one empty-ish result.
- **`getPOICustomData` is synchronous** — no `await`, no network call. All the network cost is paid up front by `refreshCustomData()`; looking up any number of POIs afterwards is just cache reads.
- `refreshCustomData()` reloads *all* `CustomData` for the venue in one call — there is no per-POI refresh. Calling it repeatedly (e.g. once per lookup) is safe but wasteful for a real app; this demo exposes it as its own explicit action instead of hiding it behind every lookup, to make the two SDK calls' distinct roles obvious.

## Learn more

- [Simulated Position](simulated-position.md) — the sibling feature that introduced this repo's request/response bridge idiom (a message in, a distinct message type back once the WebView has an answer) for the first time.
- [Go to Place](goto-poi.md) — another feature resolving a POI id via `venue.pois.find(...)`, the same lookup used here.
