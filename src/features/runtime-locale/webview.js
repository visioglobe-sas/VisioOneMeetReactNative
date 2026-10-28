// runtime-locale: lists the venue's locales and switches the map's language at
// runtime. Also used by add-locale. See docs/features/runtime-locale.md.
;(function (core) {
  'use strict'

  core.register({
    // Reports venue.translator.allLocales plus the currently active one
    // (venue.currentLocale). 'default' is filtered out here rather than left for native
    // to dedupe: on this repo's shared demo map it's a byte-identical duplicate of 'fr'
    // (confirmed against the published map payload), so surfacing it as a third choice
    // would just be confusing.
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

    // venue.setCurrentLocale is async (returns a Promise) and, per its own doc comment,
    // re-renders every POI label and current UI item (including the active Navigation)
    // on its own once it resolves -- no manual re-fetch of POI data or view refresh
    // needed on this side.
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
})(window.MapCore)
