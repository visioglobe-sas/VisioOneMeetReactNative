// custom-theme: switches the 3D scene's lighting theme and the SDK UI's accent colors.
// See docs/features/custom-theme.md.
;(function (core) {
  'use strict'

  // The registered 3D scene theme ids (a plain string array, e.g. day / night /
  // goldenHour), the only valid view.setTheme() args.
  core.onReady((view) => ({ themes: Array.from(view.themes || []) }))

  core.register({
    // view.setTheme() throws for an id that isn't in view.themes, so the native side
    // only ever offers ids read from the 'ready' message. There is no current-theme
    // getter, the app tracks the selection itself.
    set_theme: ({ theme }) => {
      if (!core.view) {
        return
      }
      try {
        core.view.setTheme(theme)
      } catch (error) {
        console.error('setTheme failed', error)
      }
    },

    // accentColor / textAccentColor are plain settable view properties, applied live to
    // the SDK's own UI buttons. Both setters throw on a string that isn't a hex, rgba
    // or hsl color.
    set_accent_colors: (colors) => {
      const view = core.view
      if (!view || !colors) {
        return
      }
      try {
        if (typeof colors.accentColor === 'string') {
          view.accentColor = colors.accentColor
        }
        if (typeof colors.textAccentColor === 'string') {
          view.textAccentColor = colors.textAccentColor
        }
      } catch (error) {
        console.error('Setting accent colors failed', error)
      }
    },
  })
})(window.MapCore)
