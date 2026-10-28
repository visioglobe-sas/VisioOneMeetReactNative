// poi-click: forwards every tap on a POI to React Native. See
// docs/features/poi-click.md.
;(function (core) {
  'use strict'

  core.onViewCreated((view) => {
    // event.pois is an array because a single tap can hit several overlapping POIs
    // (e.g. a marker sitting on top of a surface). Forward all of them -- only plain
    // serializable fields survive the WebView postMessage boundary, not the live SDK
    // POI object.
    view.addEventListener('poiclick', (event) => {
      const pois = (event.pois || []).map((poi) => ({
        id: poi.id,
        name: poi.labels?.[0]?.text || poi.id,
        floorId: poi.floor?.id,
        categories: (poi.categories || []).map((category) => category.id),
      }))
      core.sendToNative({ type: 'poi_click', data: { pois } })
    })
  })
})(window.MapCore)
