// category-highlight: lists the venue's categories and recolors every POI of one.
// See docs/features/category-highlight.md.
;(function (core) {
  'use strict'

  // Which category (if any) is currently highlighted, so a new selection can revert
  // the previous one first -- only one category is ever highlighted at a time.
  let highlightedCategoryId = null

  // Reverts the currently-highlighted category's POI surfaces back to their
  // bundle-defined color. 'initial' (not undefined/omitting the key) is the
  // SurfaceUpdateOptions sentinel that actually restores that color.
  const revertCategoryHighlight = () => {
    const venue = core.venue
    if (!venue || !highlightedCategoryId) {
      return
    }
    venue.pois
      .filter((poi) => poi.categories.some((c) => c.id === highlightedCategoryId))
      .forEach((poi) => {
        poi.surfaces.forEach((surface) => {
          venue.updateSurface(surface, { color: 'initial' })
        })
      })
    highlightedCategoryId = null
  }

  core.register({
    // Reports venue.categories back to native. category.id is a raw internal
    // identifier (a numeric string on the shared demo map, e.g. "1".."11"), not itself
    // human-readable -- confirmed live. The human-readable name comes from
    // venue.translator.translateCategory(). Both id (used for filtering/highlighting)
    // and label (used for display only) are returned so native never needs to
    // highlight by a translated string.
    get_categories: () => {
      const venue = core.venue
      if (!venue) {
        core.sendToNative({ type: 'categories_result', data: { categories: [] } })
        return
      }
      core.sendToNative({
        type: 'categories_result',
        data: {
          categories: venue.categories.map((c) => ({
            id: c.id,
            label: venue.translator.translateCategory(c, venue.currentLocale).name || c.id,
          })),
        },
      })
    },

    // No dedicated "highlight by category" SDK method exists -- built from primitives:
    // filter venue.pois by poi.categories, then color every matching POI's surfaces.
    // Not every POI has surfaces (some are point/marker-only): poi.surfaces is simply
    // an empty array for those, so they don't visually change -- expected, not a bug.
    highlight_category: ({ categoryId }) => {
      const venue = core.venue
      if (!venue) {
        return
      }
      if (highlightedCategoryId === categoryId) {
        // Tapping the already-highlighted category again clears it.
        revertCategoryHighlight()
        return
      }
      revertCategoryHighlight()
      venue.pois
        .filter((poi) => poi.categories.some((c) => c.id === categoryId))
        .forEach((poi) => {
          poi.surfaces.forEach((surface) => {
            venue.updateSurface(surface, { color: '#FF6B00' })
          })
        })
      highlightedCategoryId = categoryId
    },

    clear_category_highlight: () => {
      revertCategoryHighlight()
    },
  })
})(window.MapCore)
