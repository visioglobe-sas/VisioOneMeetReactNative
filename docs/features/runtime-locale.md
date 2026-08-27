# Runtime Locale

## Description

Switches the map's displayed language at runtime — POI/label names and the current UI — without reloading the WebView or republishing the map. Built entirely on the venue-level locale API:

- `venue.currentLocale: string` (readonly) — the venue's current locale.
- `venue.setCurrentLocale(locale: string): Promise<void>` — changes it. Per the SDK's own doc comment, labels are re-displayed using each POI's matching `LocaleEntry` when one exists, and when a `View` exists, every UI item (including the current `Navigation`) is re-rendered in the new locale too — no manual re-fetch of POI data or view refresh is needed on the caller's side.
- `venue.translator.allLocales: string[]` — the venue's full list of available locale codes.

## SDK usage

```ts
// useVisioMap.ts
const getLocales = () => {
  sendMessage({ type: 'get_locales' });
};

const setLocale = (locale: string) => {
  sendMessage({ type: 'set_locale', data: { locale } });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const getLocales = () => {
  if (!venue) {
    sendToNative({ type: 'locales_result', data: { locales: [], currentLocale: null } })
    return
  }
  sendToNative({
    type: 'locales_result',
    data: {
      locales: venue.translator.allLocales.filter((locale) => locale !== 'default'),
      currentLocale: venue.currentLocale,
    },
  })
}

const setLocale = async (locale) => {
  if (!venue) {
    return
  }
  try {
    await venue.setCurrentLocale(locale)
    sendToNative({ type: 'locale_changed', data: { currentLocale: venue.currentLocale } })
  } catch (error) {
    console.error('Unable to set locale', error)
    sendToNative({
      type: 'locale_change_error',
      data: { message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) },
    })
  }
}
```

Fetching the locale list needs a request/response round trip, the same idiom [Category highlight](category-highlight.md)'s `get_categories` uses: `get_locales` goes in, `locales_result` (`{ data: { locales: string[]; currentLocale: string | null } }`) comes back once the WebView has an answer. Switching the locale is also a round trip rather than fire-and-forget, since `setCurrentLocale` is async and can reject: `set_locale` goes in, and either `locale_changed` (`{ data: { currentLocale: string } }`) or `locale_change_error` (`{ data: { message: string } }`) comes back.

## Things to know

- **`setCurrentLocale` is async.** It returns a `Promise<void>`, not a synchronous setter — always `await` it (or otherwise wait for its resolution/rejection) before assuming the locale actually changed, rather than optimistically updating UI state from the argument you passed.
- **`venue.translator.allLocales` can contain a `'default'` entry that duplicates a real locale.** On this repo's shared demo venue, `allLocales` is `['default', 'en', 'fr']`, and `'default'` is a byte-identical duplicate of `'fr'` (both are French) — confirmed directly against the published map payload. Presenting it as a third, distinct choice next to `'fr'` would be misleading, so this repo's `getLocales` filters it out before sending the list to native. This is a data/authoring quirk of this particular venue, not a general SDK guarantee — a different venue's `'default'` locale won't necessarily duplicate another entry, so an integrator working against their own map should verify `allLocales` for that venue rather than assume the same dedup applies.
- **No manual re-fetch is needed after switching locale.** Unlike, say, `refreshCustomData()`, calling `setCurrentLocale` is sufficient on its own — the SDK re-renders POI labels and current UI/`Navigation` items itself once the promise resolves.

## Learn more

- [Category highlight](category-highlight.md) — the sibling feature this one borrows its request/response bridge idiom from, and which also uses `venue.currentLocale` (via `venue.translator.translateCategory`) to resolve display labels.
