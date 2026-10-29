// add-locale: adds a brand-new 'es' locale at runtime. See docs/features/add-locale.md.
;(function (core) {
  'use strict'

  core.register({
    // 'es' (Spanish) is never authored in VisioMapEditor for this map --
    // venue.translator.addLocale is a generic i18next resource bundle, completely
    // separate from the POI/floor/building/category translation data parsed from the
    // published map's own JSON (translatePOI/translateFloor/etc.). It can never add or
    // change a place's name on the map itself -- only (a) the SDK's own predefined
    // UI/navigation strings, when the key matches one of those (see addLocale's own doc
    // comment in the SDK for the full list -- 'search-for-anything' here), and (b) any
    // custom, app-defined key ('welcome-message' here, meaningless to the SDK itself)
    // later read back via translate(). Fixed dictionary is hardcoded here rather than
    // passed from native, same idiom as e.g. category-highlight's hardcoded highlight
    // color.
    add_locale: () => {
      const venue = core.venue
      if (!venue) {
        return
      }
      const resources = {
        'search-for-anything': 'Buscar cualquier cosa',
        'welcome-message': '¡Bienvenido!',
      }
      venue.translator.addLocale('es', resources)
      // translate() is synchronous and reads straight back from the bundle just written
      // above -- this is the primary, always-working proof addLocale actually took,
      // independent of whether any SDK UI text is visible right now.
      const translations = Object.keys(resources).reduce((acc, key) => {
        acc[key] = venue.translator.translate(key, 'es')
        return acc
      }, {})
      core.sendToNative({ type: 'locale_added', data: { translations } })
    },
  })
})(window.MapCore)
