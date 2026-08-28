# Add Locale

## Description

Adds a brand-new locale, `'es'` (Spanish), to the SDK at runtime — one that was never authored in VisioMapEditor for this map — and proves it round-tripped by reading two keys back. Built on `venue.translator`:

- `addLocale(locale: string, resources: Resources): void` — creates a locale at runtime (`Resources` is a flat `{ [key: string]: string }` map). Not persisted across a reload.
- `translate(key: string, locale: string, context?: Context): string` — reads a value back from that locale.

## SDK usage

```ts
// useVisioMap.ts
const addLocale = () => {
  sendMessage({ type: 'add_locale' });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const addSpanishLocale = () => {
  if (!venue) {
    return
  }
  const resources = {
    'search-for-anything': 'Buscar cualquier cosa',
    'welcome-message': '¡Bienvenido!',
  }
  venue.translator.addLocale('es', resources)
  const translations = Object.keys(resources).reduce((acc, key) => {
    acc[key] = venue.translator.translate(key, 'es')
    return acc
  }, {})
  sendToNative({ type: 'locale_added', data: { translations } })
}
```

`add_locale` goes in, fire-and-forget; `locale_added` (`{ data: { translations: Record<string, string> } }`) comes back once the WebView has read every key back through `translate()`. The fixed two-entry dictionary is hardcoded on the WebView side rather than passed over the bridge:

- `'search-for-anything'` — one of the SDK's own predefined UI keys (see `addLocale`'s own TSDoc for the full UI/Navigation key list), overridden here to show this can reach the SDK's own built-in text.
- `'welcome-message'` — a plain custom key with no meaning to the SDK itself, showing `addLocale`/`translate` is a fully generic key/value store an app can use for its own strings too.

The demo also reuses `runtime-locale`'s `set_locale` message (`venue.setCurrentLocale('es')`) behind a secondary "Switch to Spanish" button, so any SDK UI text currently on screen would flip to the new locale live — a bonus, not the primary proof.

## Things to know

- **`addLocale` never touches POI/label/floor/building names.** It's backed by a generic i18next resource bundle, completely separate from the venue's own POI/floor/building/category translation data — the data `translatePOI`/`translateFloor`/`translateBuilding`/`translateCategory` read, parsed once at load time from the published map's own JSON. Adding or overriding a key here can never rename a place on the map, no matter what the key looks like. It only affects (a) the SDK's own predefined UI/navigation strings, when the key happens to match one of those, and (b) whatever your own app defines and reads back with `translate()`.
- **`translate()` is the reliable proof, `setCurrentLocale()` is not.** Reading a key back with `venue.translator.translate(key, 'es')` works immediately and unconditionally. Calling `venue.setCurrentLocale('es')` only has a *visible* effect on whichever of the SDK's own default UI parts happen to be on screen at that moment — on a screen where none of those are shown, switching the active locale produces no observable change even though the override worked. That's why this demo shows the `translate()` round trip directly in the panel rather than relying on the SDK's own UI to prove anything.
- **Complements, not duplicates, `runtime-locale`.** [`runtime-locale`](runtime-locale.md) switches between locales already authored for the map (`en`/`fr` on this repo's shared demo venue) via `venue.setCurrentLocale`. This feature instead creates a locale that doesn't exist anywhere in the map's own published data, via `addLocale`. Both end up calling `setCurrentLocale` to make a locale "live", but only `runtime-locale`'s locales have any effect on POI/label names — `add-locale`'s never do.
- **Not persisted.** Per `addLocale`'s own doc comment, a runtime-added locale is lost on reload/republish — it's an in-memory-only addition, same lifetime as the WebView page itself.

## Learn more

- [Runtime locale](runtime-locale.md) — switches between locales already authored on the map, the complementary feature this one is built alongside.
- `removeLocale(locale: string): void` and `getLocale(locale: string): Resources` also exist on `venue.translator` (remove a runtime-added locale, read back its full resource map) — not built into this demo's UI, but available on the same interface.
