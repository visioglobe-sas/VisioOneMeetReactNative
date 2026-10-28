# Runtime Locale

## Description

Switches the map's displayed language at runtime — POI/label names and the current UI — without reloading the WebView or republishing the map. Built entirely on the venue-level locale API:

- `venue.currentLocale: string` (readonly) — the venue's current locale.
- `venue.setCurrentLocale(locale: string): Promise<void>` — changes it. Per the SDK's own doc comment, labels are re-displayed using each POI's matching `LocaleEntry` when one exists, and when a `View` exists, every UI item (including the current `Navigation`) is re-rendered in the new locale too — no manual re-fetch of POI data or view refresh is needed on the caller's side.
- `venue.translator.allLocales: string[]` — the venue's full list of available locale codes.

## SDK usage

```ts
// src/features/runtime-locale/bridge.ts
export const useLocalesBridge = () => {
  const { send } = useMapBridge();
  const [localeInfo, setLocaleInfo] = React.useState<LocaleInfo>({ locales: [], currentLocale: null });
  const [error, setError] = React.useState<string | null>(null);

  // Asks for the venue's locales + the current one once the venue is loaded.
  useMapEvent('ready', () => send('get_locales'));
  useMapEvent('locales_result', (data) =>
    setLocaleInfo({ locales: data?.locales ?? [], currentLocale: data?.currentLocale ?? null }),
  );
  useMapEvent('locale_changed', (data) => {
    setError(null);
    setLocaleInfo((prev) => ({ ...prev, currentLocale: data?.currentLocale ?? prev.currentLocale }));
  });
  useMapEvent('locale_change_error', (data) => setError(String(data?.message ?? data)));

  return {
    localeInfo,
    error,
    // venue.setCurrentLocale(locale), async on the SDK side: answered with
    // 'locale_changed' or 'locale_change_error'.
    setLocale: (locale: string) => send('set_locale', { locale }),
  };
};
```

```js
// src/features/runtime-locale/webview.js
core.register({
  get_locales: () => {
    const venue = core.venue
    if (!venue) {
      core.sendToNative({ type: 'locales_result', data: { locales: [], currentLocale: null } })
      return
    }
    core.sendToNative({
      type: 'locales_result',
      data: {
        locales: venue.translator.allLocales.filter((locale) => locale !== 'default'),
        currentLocale: venue.currentLocale,
      },
    })
  },

  set_locale: async ({ locale }) => {
    const venue = core.venue
    if (!venue) {
      return
    }
    try {
      await venue.setCurrentLocale(locale)
      core.sendToNative({ type: 'locale_changed', data: { currentLocale: venue.currentLocale } })
    } catch (error) {
      console.error('Unable to set locale', error)
      core.sendToNative({
        type: 'locale_change_error',
        data: { message: core.errorMessage(error) },
      })
    }
  },
})
```

Fetching the locale list needs a request/response round trip, the same idiom [Category highlight](category-highlight.md)'s `get_categories` uses: `get_locales` goes in (sent as soon as `ready` arrives), `locales_result` (`{ data: { locales: string[]; currentLocale: string | null } }`) comes back once the WebView has an answer. Switching the locale is also a round trip rather than fire-and-forget, since `setCurrentLocale` is async and can reject: `set_locale` goes in, and either `locale_changed` (`{ data: { currentLocale: string } }`) or `locale_change_error` (`{ data: { message: string } }`) comes back. (A rejected promise in an `async` handler is not caught by the page's generic `command_error` reporting, which only sees synchronous throws — hence the explicit `try`/`catch` and dedicated error message.)

## Things to know

- **`setCurrentLocale` is async.** It returns a `Promise<void>`, not a synchronous setter — always `await` it (or otherwise wait for its resolution/rejection) before assuming the locale actually changed, rather than optimistically updating UI state from the argument you passed.
- **`venue.translator.allLocales` never includes `'default'`.** The SDK's `Translator.allLocales` getter explicitly filters the `'default'` key out of the map's underlying locale resources (confirmed by reading the SDK's own source, `Translator.parseLocales`) — so on this repo's shared demo venue, `allLocales` is `['en', 'fr']`, not three entries; the `.filter((locale) => locale !== 'default')` in `getLocales` is a defensive no-op here rather than a fix for an entry that actually appears. `'default'` is nonetheless a working value for `setCurrentLocale('default')`, and on this map it renders a byte-identical duplicate of `'fr'` (both are French) — confirmed directly against the published map payload. This is a data/authoring quirk of this particular venue, not a general SDK guarantee — an integrator working against their own map should verify `allLocales` for that venue and what each entry actually resolves to, rather than assume the same dedup applies.
- **No manual re-fetch is needed after switching locale.** Unlike, say, `refreshCustomData()`, calling `setCurrentLocale` is sufficient on its own — the SDK re-renders POI labels and current UI/`Navigation` items itself once the promise resolves.

## Learn more

- [Category highlight](category-highlight.md) — the sibling feature this one borrows its request/response bridge idiom from, and which also uses `venue.currentLocale` (via `venue.translator.translateCategory`) to resolve display labels.
