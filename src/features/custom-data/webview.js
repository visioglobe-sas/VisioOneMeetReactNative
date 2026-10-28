// custom-data: loads and reads the business fields attached to POIs in
// VisioMapEditor. See docs/features/custom-data.md.
;(function (core) {
  'use strict'

  core.register({
    // (Re)loads all CustomData from the server. The cache starts empty ({}) until this
    // resolves at least once -- see get_poi_custom_data below for what that means for
    // a not-yet-refreshed lookup.
    refresh_custom_data: async () => {
      if (!core.venue) {
        return
      }
      try {
        await core.venue.refreshCustomData()
        core.sendToNative({ type: 'custom_data_refreshed' })
      } catch (error) {
        console.error('Unable to refresh custom data', error)
        core.sendToNative({
          type: 'custom_data_refresh_error',
          data: { message: core.errorMessage(error) },
        })
      }
    },

    // Synchronous read of a POI's CustomData, a free { [key: string]: string } bag of
    // business fields (price, opening hours, product reference...) set in
    // VisioMapEditor. venue.getPOICustomData(poi) always returns a plain object, never
    // null/undefined -- {} both when the POI has no CustomData and when
    // refreshCustomData() hasn't resolved yet. "POI not found" (found: false) is
    // reported separately from "found, no CustomData" (found: true, empty customData)
    // -- both are normal, non-error states.
    get_poi_custom_data: ({ placeId }) => {
      const poi = core.findPoi(placeId)
      if (!poi) {
        core.sendToNative({ type: 'poi_custom_data_result', data: { placeId, found: false, customData: {} } })
        return
      }
      const customData = core.venue.getPOICustomData(poi)
      core.sendToNative({ type: 'poi_custom_data_result', data: { placeId, found: true, customData } })
    },
  })
})(window.MapCore)
