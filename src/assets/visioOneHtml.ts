// Same content as visioOne.html, exported as a template-literal string so it can be
// passed via <WebView source={{ html, baseUrl }}> instead of source={require('./visioOne.html')}.
// Why this matters: when the HTML is loaded via require(), Metro serves it through the dev
// server in Debug builds and appends its own "?hash=..." cache-busting query param to the
// page URL. VisioOne SDK 1.0.5 merged the page's own URL query parameters into loadVenue's
// options, so that unrelated Metro-generated "hash" param silently overrode the real map
// hash passed in code. Since SDK 1.0.6 the option and its URL parameter are named
// "vg_maphash", so Metro's "?hash=" is no longer read -- see docs/SDK_NOTES.md for the full
// writeup. Loading the HTML inline with an explicit baseUrl avoids the Metro-served URL
// entirely, whatever the SDK version.
//
// Keep this file in sync with visioOne.html by hand if you change the SDK integration logic.
export const visioOneHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  </head>
  <body>
    <div id="content"></div>

    <script type="module">
      // Loading the SDK is async and can take a moment on a slow connection. Register
      // the React Native message listener before it resolves, otherwise the initial
      // "setup" message sent right after WebView load can be lost.
      const visioOneReady = import('https://cdn.visioglobe.com/visioone/1.1.0/dist/visioone.js').then(
        ({ createVisioOne }) => createVisioOne()
      )
      let view = null
      let venue = null
      let image = null
      let poiInfo = null
      // custom-navigation-trace feature: the trace created by the last startItinerary
      // call, kept around so a later 'update_navigation_trace' message has something to
      // restyle -- venue.updateNavigationTrace() only affects a trace that already
      // exists. See docs/features/custom-navigation-trace.md.
      let currentNavigationTrace = null

      // baseURL is optional -- LoadOptions.baseURL defaults to
      // https://mapserver.visioglobe.com/ inside the SDK itself when omitted, so a blank
      // field here means "use the SDK's own default", not some hardcoded fallback of
      // this demo's own. See docs/features/custom-base-url.md.
      //
      // enableShadows is the custom-theme feature's createView option, sent only by that
      // screen: view.setTheme() only changes the scene lights, which are only rendered
      // when shadows are enabled -- see docs/features/custom-theme.md. Every other screen
      // leaves it undefined and keeps the SDK's own default (shadows off, cheaper).
      //
      // cameraProjection is the camera-projection-toggle feature's createView option
      // ('perspective' | 'orthographic'). It can only be chosen when the view is created
      // -- view.cameraProjection is read-only and there is no runtime switch -- so
      // switching projection means a fresh page (fresh loadVenue + createView), driven by
      // the React Native side remounting the WebView. Anything else falls back to the
      // SDK's own default, 'perspective'. See docs/features/camera-projection-toggle.md.
      const setup = async (hash, baseURL, enableShadows, cameraProjection) => {
        const venueHash = typeof hash === 'string' ? hash.trim() : ''
        const trimmedBaseURL = typeof baseURL === 'string' ? baseURL.trim() : ''
        let visioOneLoadError = null
        const originalConsoleWarn = console.warn

        // The SDK surfaces the real loading failure via console.warn before
        // replacing it with a generic "Cannot load the venue" error. Capture it
        // so the native side gets an actionable message instead of the generic one.
        console.warn = (...args) => {
          if (args[0] === 'VisioOne error:') {
            visioOneLoadError = args[1]
          }
          originalConsoleWarn.apply(console, args)
        }

        try {
          const effectiveBaseURL = trimmedBaseURL || 'https://mapserver.visioglobe.com/'
          sendToNative({
            type: 'loading',
            data: {
              hash: venueHash,
              descriptorURL: \`\${effectiveBaseURL}\${venueHash}/descriptor.json\`,
            },
          })
          const visioOne = await visioOneReady
          const container = document.querySelector('#content')
          const loadOptions = trimmedBaseURL
            ? { vg_maphash: venueHash, baseURL: trimmedBaseURL }
            : { vg_maphash: venueHash }
          venue = await visioOne.loadVenue(loadOptions, container)
          const viewOptions = {
            cameraProjection: cameraProjection === 'orthographic' ? 'orthographic' : 'perspective',
          }
          if (enableShadows === true) {
            viewOptions.enableShadows = true
          }
          await visioOne
            .createView(container, venue, viewOptions)
            .then((v) => {
              // All UI parts start visible, matching the SDK's own default -- see
              // setUIPartVisible below for the app-driven toggle (ui-part-visibility feature).
              // event.pois is an array because a single tap can hit several overlapping
              // POIs (e.g. a marker sitting on top of a surface). Forward all of them --
              // only plain serializable fields survive the WebView postMessage boundary,
              // not the live SDK POI object.
              v.addEventListener('poiclick', (event) => {
                const pois = (event.pois || []).map((poi) => ({
                  id: poi.id,
                  name: poi.labels?.[0]?.text || poi.id,
                  floorId: poi.floor?.id,
                  categories: (poi.categories || []).map((category) => category.id),
                }))
                sendToNative({ type: 'poi_click', data: { pois } })
              })
              // Keeps the native floor-selector UI's highlighted floor in sync even when
              // the SDK's own default floor-selector widget (visible by default, see
              // setUIPartVisible below) is the one driving the change -- e.g. the user taps
              // it directly instead of the app's own control.
              v.addEventListener('currentfloorchanged', () => {
                sendToNative({
                  type: 'floor_changed',
                  data: {
                    buildingId: v.currentBuilding?.id,
                    floorId: v.currentFloor?.id,
                  },
                })
              })
              // Keeps the native explore-mode UI's highlighted option in sync even when
              // the mode changes from direct camera/map interaction rather than a
              // set_explore_mode message from native -- e.g. a click while in 'building'
              // mode auto-switches to 'floor' on its own (see ExploreMode.ts in visioone).
              v.addEventListener('exploremodechanged', (event) => {
                sendToNative({
                  type: 'explore_mode_changed',
                  data: { currentExploreMode: event.currentExploreMode },
                })
              })
              // camera-lock-on-position feature: mirrors view.lockCameraPositionOnTracking
              // to native instead of native keeping its own copy -- the SDK changes it by
              // itself: setting allowTracking = true turns it on, allowTracking = false
              // turns it off, and a user pan/zoom while tracking turns it off
              // ('trackingchanged'). None of these events carry the value, so it's read
              // from the view inside the handler.
              const sendCameraLockState = () => {
                sendToNative({
                  type: 'camera_lock_changed',
                  data: { locked: v.lockCameraPositionOnTracking === true },
                })
              }
              v.addEventListener('trackingon', sendCameraLockState)
              v.addEventListener('trackingoff', sendCameraLockState)
              v.addEventListener('trackingchanged', sendCameraLockState)
              view = v
            })
          // Only plain serializable fields survive the WebView postMessage boundary (see
          // the poiclick handler above for the same constraint) -- labels are resolved
          // through venue.translator so they match whatever the SDK's own floor-selector
          // widget displays, rather than raw (often non human-readable) floor/building ids.
          const buildings = venue.venueLayout.buildings.map((building) => ({
            id: building.id,
            label: venue.translator.translateBuilding(building, venue.currentLocale).name,
            defaultFloorID: building.defaultFloorID,
            floors: building.floors.map((floor) => ({
              id: floor.id,
              label: venue.translator.translateFloor(floor, venue.currentLocale).name,
              levelIndex: floor.levelIndex,
            })),
          }))
          sendToNative({
            type: 'ready',
            data: {
              buildings,
              currentBuildingId: view.currentBuilding?.id,
              currentFloorId: view.currentFloor?.id,
              // The SDK's own default, see ExploreMode.ts in visioone -- 'global' at
              // this point since createView just resolved and nothing has changed it yet.
              currentExploreMode: view.currentExploreMode,
              // custom-theme feature: the registered 3D scene theme ids (a plain string
              // array, e.g. day / night / goldenHour), the only valid view.setTheme() args.
              themes: Array.from(view.themes || []),
              // camera-projection-toggle feature: the projection the view was actually
              // created with, read back from the read-only view.cameraProjection (a
              // page-URL ?orthographic parameter would override the createView option).
              cameraProjection: view.cameraProjection,
            },
          })
        } catch (error) {
          const cause = visioOneLoadError || error
          console.error('Unable to initialize VisioOne', error)
          sendToNative({
            type: 'error',
            data: cause instanceof Error ? \`\${cause.name}: \${cause.message}\` : String(cause),
          })
        } finally {
          console.warn = originalConsoleWarn
        }
      }

      const resetMap = () => {
        if (view) {
          view.goToGlobal()
        }
      }

      const goToFloor = (buildingId, floorId) => {
        if (view) {
          const building = venue.venueLayout.buildings.find((b) => b.id === buildingId)
          if (building) {
            if (floorId) {
              const floor = building.floors.find((f) => f.id === floorId)
              if (floor) {
                view.goToFloor(floor)
              }
            } else {
              view.goToBuilding(building)
            }
          }
        }
      }

      // Shared by goto-poi, 3d-icon-marker and custom-text-label: animates the camera
      // onto a POI (and its floor), so indoor content attached to it is actually in view.
      const moveCameraToPoi = (poi) => {
        view.goToPOI(poi, {
          orientation: { pitch: 20 },
          padding: { top: 100, bottom: 100, right: 100, left: 100 },
        })
      }

      const goToPlace = (placeId) => {
        if (venue && view) {
          const poi = venue.pois.find((p) => p.id === placeId)
          poiInfo = poi

          if (poi) {
            moveCameraToPoi(poi)

            poi.surfaces.forEach((surface) => {
              venue.updateSurface(surface, { selectionColor: '#057DBC' })
            })

            const position = { latitude: 0, longitude: 0, altitude: poi.surfaces[0].extrusionHeight }
            poi.surfaces[0].positions.forEach((p) => {
              position.latitude += p.latitude
              position.longitude += p.longitude
            })
            position.latitude /= poi.surfaces[0].positions.length
            position.longitude /= poi.surfaces[0].positions.length

            image = venue.createImage({
              poi,
              position,
              width: 2,
              height: 2,
              orientationType: 'facing',
              url: 'https://cdn-icons-png.flaticon.com/512/731/731582.png',
            })
          }
        }
      }

      const clearPlace = () => {
        if (venue && image && poiInfo) {
          venue.removeImage(image)
          poiInfo.surfaces.forEach((surface) => {
            venue.updateSurface(surface, { selectionColor: undefined })
          })
          image = null
          poiInfo = null
        }
      }

      const updateOccupancy = (occupancy) => {
        occupancy.forEach((entry) => {
          const poi = venue.pois.find((p) => p.id === entry.planId)
          if (!poi) {
            return
          }
          poi.surfaces.forEach((surface) => {
            venue.updateSurface(surface, { color: entry.color })
          })
        })
      }

      // navigation-exclude-modalities feature: excludedAttributes is an optional array
      // of segment-particularity attribute strings (Segment.attributes) the computed
      // route must not use -- forwarded as-is into computeNavigation's own
      // excludedAttributes option. undefined (every caller but
      // navigation-exclude-modalities) behaves exactly as before this option existed.
      // On this demo venue the attribute that excludes the elevator hop is 'lift', not
      // 'elevator' as the SDK's own JSDoc comment on excludedAttributes misleadingly
      // suggests -- see docs/features/navigation-exclude-modalities.md.
      const startItinerary = (origin, destination, isAccessible, excludedAttributes) => {
        const navigation = venue.computeNavigation({
          origin,
          destination,
          isAccessible,
          type: 'fastest',
          firstNodeAsIntersection: false,
          mergeFloorChangeInstructions: false,
          excludedAttributes,
        })

        currentNavigationTrace = venue.createNavigationTrace(navigation)
        view.setCurrentNavigationTrace(currentNavigationTrace)

        sendToNative({
          type: 'itinerary_instructions',
          data: navigation.instructions,
        })
      }

      // custom-navigation-trace feature: restyles the trace startItinerary last created
      // -- venue.updateNavigationTrace(trace, style), colors only (NavigationTraceUpdateOptions).
      // A no-op if no itinerary has been computed yet, same "nothing to act on" idiom as
      // clearPlace above. venue.updateNavigationTrace() throws internally on this demo
      // venue (TypeError reading 'material' deep in the SDK's line-rendering pipeline)
      // even though every color is still applied correctly before it throws -- caught
      // here so it doesn't surface as an uncaught WebView error. Not our bug to fix. See
      // docs/features/custom-navigation-trace.md.
      const updateNavigationTraceStyle = (style) => {
        if (!venue || !currentNavigationTrace) {
          return
        }
        try {
          venue.updateNavigationTrace(currentNavigationTrace, style)
        } catch (error) {
          console.warn('updateNavigationTrace threw (trace styling still applied):', error)
        }
      }

      // uiPart must be one of the SDK's exact, case-sensitive View.UIPart values:
      // 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking'.
      // Requires the view to already exist -- called only after 'ready', once setup()
      // has resolved createView().
      const setUIPartVisible = (uiPart, isVisible) => {
        if (view) {
          view.setUIPartVisible(uiPart, isVisible)
        }
      }

      // explore-mode feature: drives the SDK's 3 building-exploration modes. Just an
      // assignment -- view.currentExploreMode is a plain settable property, not a
      // method (see ExploreMode.ts in visioone). Entering 'building' mode with no
      // building currently open falls back to the venue's first building on its own
      // (the SDK's own behavior, not something this demo has to arrange), so the
      // "carousel" effect is reachable from 'global' with a single tap. The resulting
      // mode -- this call's or a later camera/click-driven change -- is reported back
      // via the 'exploremodechanged' listener registered above, not from here.
      const setExploreMode = (mode) => {
        if (view) {
          view.currentExploreMode = mode
        }
      }

      // POIs have no direct lat/lng field -- it comes from whichever sub-object
      // (marker, label or image) actually carries a Position. Returns null if the POI
      // id isn't found or none of its sub-objects carry a position.
      const resolvePoiPosition = (placeId) => {
        const poi = venue.pois.find((p) => p.id === placeId)
        if (!poi) {
          return null
        }
        const position = poi.markers?.[0]?.position ?? poi.labels?.[0]?.position ?? poi.images?.[0]?.position
        if (!position) {
          return null
        }
        return { latitude: position.latitude, longitude: position.longitude, altitude: position.altitude }
      }

      // Resolves both place IDs for the simulated-position feature and reports the
      // result back to native -- the ping-pong interpolation loop itself lives on the
      // native side (same idiom as update_occupancy's native setInterval), this is
      // just a one-shot lookup.
      const resolvePositionSimulationPois = (originId, destinationId) => {
        if (!venue) {
          return
        }
        const origin = resolvePoiPosition(originId)
        const destination = resolvePoiPosition(destinationId)
        if (!origin) {
          sendToNative({ type: 'position_simulation_error', data: { message: \`POI not found: \${originId}\` } })
          return
        }
        if (!destination) {
          sendToNative({ type: 'position_simulation_error', data: { message: \`POI not found: \${destinationId}\` } })
          return
        }
        sendToNative({ type: 'poi_positions_resolved', data: { origin, destination } })
      }

      // Called on every tick of the native-side interpolation timer. injectTrackedPosition
      // requires allowTracking to already be true, or it throws -- set it once here rather
      // than requiring a separate message from native. Only on the false -> true
      // transition: every allowTracking = true re-locks the camera on the position
      // (lockCameraPositionOnTracking = true), which would undo a user's unlock/pan on
      // the very next tick.
      const injectTrackedPosition = (position, precisionCircleRadius) => {
        if (!view) {
          return
        }
        if (!view.allowTracking) {
          view.allowTracking = true
        }
        view.injectTrackedPosition({ position, precisionCircleRadius })
      }

      // There's no dedicated "stop tracking" call on the SDK -- setting allowTracking
      // back to false is what removes the marker and its accuracy circle from the map.
      const stopPositionSimulation = () => {
        if (view) {
          view.allowTracking = false
        }
      }

      // camera-lock-on-position feature: binds/unbinds the camera's focus onto whatever
      // position is currently being tracked. Only has an effect once view.allowTracking
      // is true (see injectTrackedPosition above) -- setting this while allowTracking is
      // still false is a silent no-op, unlike injectTrackedPosition, which throws in that
      // situation. The SDK answers with a 'trackingchanged' event, which is what updates
      // the native toggle (see the listeners registered next to createView above).
      const setCameraLockOnPosition = (locked) => {
        if (view) {
          view.lockCameraPositionOnTracking = locked
        }
      }

      // accuracy-circle-style feature: color/opacity apply to the tracked position's
      // precision circle (not the center arrow image). The SDK only stores them -- they're
      // applied on the next injectTrackedPosition call -- and resets them to its defaults
      // (#0094f0, 0.3) whenever allowTracking goes back to false, so React Native re-sends
      // the current selection on every Start. Throws on an invalid color or a
      // non-number opacity.
      const setPositionTrackerStyle = (color, opacity) => {
        if (!view) {
          return
        }
        try {
          view.updatePositionTrackerGraphicOptions({ color, opacity })
        } catch (error) {
          console.error('Updating position tracker graphic options failed', error)
        }
      }

      // clickable-surface feature: makes every surface of a POI interactive (or not).
      // Once isInteractive is true, the SDK itself swaps the surface's displayed color
      // on hover/tap using hoverColor/selectionColor -- no click listener is needed on
      // this side for that visual feedback. Passing color: 'initial' when disabling
      // resets the surface to whatever the map bundle originally defined, instead of
      // leaving it stuck on the last custom color.
      const setSurfaceInteractive = (placeId, interactive) => {
        if (!venue) {
          return
        }
        const poi = venue.pois.find((p) => p.id === placeId)
        if (!poi) {
          return
        }
        poi.surfaces.forEach((surface) => {
          venue.updateSurface(
            surface,
            interactive
              ? { isInteractive: true, color: '#2ECC71', hoverColor: '#F1C40F', selectionColor: '#E74C3C' }
              : { isInteractive: false, color: 'initial' }
          )
        })
      }

      // custom-data feature: (re)loads all CustomData from the server. The cache
      // starts empty ({}) until this resolves at least once -- see getPoiCustomData
      // below for what that means for a not-yet-refreshed lookup.
      const refreshCustomData = async () => {
        if (!venue) {
          return
        }
        try {
          await venue.refreshCustomData()
          sendToNative({ type: 'custom_data_refreshed' })
        } catch (error) {
          console.error('Unable to refresh custom data', error)
          sendToNative({
            type: 'custom_data_refresh_error',
            data: { message: error instanceof Error ? \`\${error.name}: \${error.message}\` : String(error) },
          })
        }
      }

      // custom-data feature: synchronous read of a POI's CustomData, a free
      // { [key: string]: string } bag of business fields (price, opening hours,
      // product reference...) set in VisioMapEditor. venue.getPOICustomData(poi)
      // always returns a plain object, never null/undefined -- {} both when the POI
      // has no CustomData and when refreshCustomData() hasn't resolved yet. "POI not
      // found" (found: false) is reported separately from "found, no CustomData"
      // (found: true, empty customData) -- both are normal, non-error states.
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

      // category-highlight feature: reports the venue's full category list
      // (venue.categories) back to native. category.id is a raw internal
      // identifier (a numeric string on the shared demo map, e.g. "1".."11"),
      // not itself human-readable -- confirmed live. The human-readable name
      // comes from venue.translator.translateCategory(), same idiom the
      // buildings/floors mapping above already uses. Both id (used for
      // filtering/highlighting) and label (used for display only) are
      // returned so native never needs to highlight by a translated string.
      const getCategories = () => {
        if (!venue) {
          sendToNative({ type: 'categories_result', data: { categories: [] } })
          return
        }
        sendToNative({
          type: 'categories_result',
          data: {
            categories: venue.categories.map((c) => ({
              id: c.id,
              label: venue.translator.translateCategory(c, venue.currentLocale).name || c.id,
            })),
          },
        })
      }

      // category-highlight feature: tracks which category (if any) is currently
      // highlighted, so a new selection can revert the previous one first -- only one
      // category is ever highlighted at a time.
      let highlightedCategoryId = null

      // Reverts the currently-highlighted category's POI surfaces back to their
      // bundle-defined color. 'initial' (not undefined/omitting the key) is the
      // SurfaceUpdateOptions sentinel that actually restores that color -- see
      // docs/features/category-highlight.md.
      const revertCategoryHighlight = () => {
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

      // No dedicated "highlight by category" SDK method exists -- built from
      // primitives: filter venue.pois by poi.categories, then color every matching
      // POI's surfaces. Not every POI has surfaces (some are point/marker-only):
      // poi.surfaces is simply an empty array for those, so they don't visually
      // change -- expected, not a bug.
      const highlightCategory = (categoryId) => {
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
      }

      const clearCategoryHighlight = () => {
        revertCategoryHighlight()
      }

      // dynamic-poi-crud feature: only one dynamically-created POI/Label pair is
      // tracked at a time (this demo's own choice, not an SDK limit) -- the live SDK
      // objects only exist here, native only holds the display id/text it gets back
      // over the bridge. See docs/features/dynamic-poi-crud.md.
      let dynamicPoi = null
      let dynamicLabel = null

      // A bare POI created via venue.createPOI() has no visual representation of its
      // own -- its images/labels/lines/surfaces/markers arrays all start empty -- so
      // this demo makes it visible by attaching a Label at a position copied from an
      // existing "anchor" POI (there's no tap-to-place UI here), see resolveAnchorPoi.
      // Shared by dynamic-poi-crud, 3d-icon-marker, custom-text-label and
      // html-overlay-marker: resolves an
      // "anchor" POI id to the POI itself plus a WGS84 position copied from it --
      // anchorPoi.labels[0] and .markers[0] are checked, in that order, since either is
      // a normal way for a POI to carry a position. Returns { reason } instead of throwing on the two normal,
      // non-crash failure outcomes: 'anchor_not_found' (no POI with that id) and
      // 'no_position' (the POI exists but has neither a label nor a marker, e.g. a
      // surface-only POI). excludeLabel (optional, custom-text-label only) is a Label
      // this demo itself attached to the anchor POI: it's skipped, so a re-place never
      // copies the custom label's own (already offset) position when the anchor has no
      // label of its own. excludeMarker (optional, html-overlay-marker only) is the same
      // for a Marker this demo attached to the anchor POI (it lands in poi.markers).
      const resolveAnchorPoi = (anchorId, excludeLabel, excludeMarker) => {
        const poi = venue.pois.find((p) => p.id === anchorId)
        if (!poi) {
          return { reason: 'anchor_not_found' }
        }
        const ownLabel = poi.labels.find((label) => label !== excludeLabel)
        const ownMarker = poi.markers.find((marker) => marker !== excludeMarker)
        const position = ownLabel?.position ?? ownMarker?.position
        if (!position) {
          return { reason: 'no_position' }
        }
        return { poi, position }
      }

      const createDynamicPoi = (newId, anchorId, labelText) => {
        if (!venue) {
          return
        }
        if (dynamicPoi) {
          // The app already disables the Create control once a dynamic POI is
          // tracked -- this is just a defensive backstop.
          sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'already_tracked' } })
          return
        }
        const anchor = resolveAnchorPoi(anchorId)
        if (anchor.reason) {
          sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: anchor.reason } })
          return
        }
        const { position } = anchor
        let poi
        try {
          // The SDK's own doc comment documents exactly one failure mode here:
          // POIAlreadyExistsError when newId is already used in the venue. Reported
          // as a normal outcome by message rather than by error class/instanceof --
          // the SDK is loaded as a minified CDN bundle, which doesn't reliably
          // preserve constructor names for that kind of check.
          poi = venue.createPOI({ id: newId })
        } catch (error) {
          sendToNative({
            type: 'dynamic_poi_create_result',
            data: {
              ok: false,
              reason: 'duplicate_id',
              message: error instanceof Error ? \`\${error.name}: \${error.message}\` : String(error),
            },
          })
          return
        }
        const label = venue.createLabel({ poi, position, width: 2, text: labelText })
        dynamicPoi = poi
        dynamicLabel = label
        sendToNative({ type: 'dynamic_poi_create_result', data: { ok: true, id: newId, text: labelText } })
      }

      // updatePOI (POIUpdateOptions) can only ever change categories, never anything
      // visual -- so "editing" the dynamic POI's visible content means updating its
      // attached Label's text instead. Fire-and-forget: always valid while a dynamic
      // POI is tracked, since the app disables this control otherwise.
      const updateDynamicPoiLabel = (text) => {
        if (!venue || !dynamicLabel) {
          return
        }
        venue.updateLabel(dynamicLabel, { text })
      }

      // removePOI cascades: removing the POI also removes its attached Label from the
      // view, no separate removeLabel call needed.
      const removeDynamicPoi = () => {
        if (!venue || !dynamicPoi) {
          return
        }
        venue.removePOI(dynamicPoi)
        dynamicPoi = null
        dynamicLabel = null
      }

      // 3d-icon-marker feature: live SDK Image objects (venue.createImage) only exist
      // here, keyed by an id chosen by the app -- native only ever refers to them by
      // that id over the bridge. See docs/features/3d-icon-marker.md.
      const iconMarkers = new Map()

      // Creates an Image owned by the anchor POI itself (no createPOI needed), at the
      // position copied from it via resolveAnchorPoi. width/height are in meters and
      // url can be any image URL, including a data: URL. Replies with
      // 'icon_marker_create_result' -- a missing POI or a POI without a position are
      // normal outcomes, reported with ok: false + reason rather than thrown.
      const createIconMarker = (imageId, anchorId, options) => {
        if (!venue) {
          return
        }
        const anchor = resolveAnchorPoi(anchorId)
        if (anchor.reason) {
          sendToNative({ type: 'icon_marker_create_result', data: { ok: false, imageId, anchorId, reason: anchor.reason } })
          return
        }
        // Only one Image per id: replace any previous one rather than leaking it.
        const previous = iconMarkers.get(imageId)
        if (previous) {
          venue.removeImage(previous)
          iconMarkers.delete(imageId)
        }
        try {
          const created = venue.createImage({
            poi: anchor.poi,
            position: anchor.position,
            width: options.width,
            height: options.height,
            url: options.url,
            orientationType: options.orientationType,
          })
          iconMarkers.set(imageId, created)
          // The default whole-venue view doesn't show indoor floors, so the new Image
          // would be invisible without moving the camera onto its anchor POI.
          if (view) {
            moveCameraToPoi(anchor.poi)
          }
          sendToNative({ type: 'icon_marker_create_result', data: { ok: true, imageId, anchorId } })
        } catch (error) {
          sendToNative({
            type: 'icon_marker_create_result',
            data: {
              ok: false,
              imageId,
              anchorId,
              reason: 'sdk_error',
              message: error instanceof Error ? error.name + ': ' + error.message : String(error),
            },
          })
        }
      }

      // Live update of an already-placed Image -- only orientationType is changed here,
      // but venue.updateImage also accepts width/position/rotation/url/isVisible.
      // Fire-and-forget: a no-op if nothing is placed under that id.
      const updateIconMarkerOrientation = (imageId, orientationType) => {
        const tracked = iconMarkers.get(imageId)
        if (!venue || !tracked) {
          return
        }
        venue.updateImage(tracked, { orientationType })
      }

      // Fire-and-forget: a no-op if nothing is placed under that id.
      const removeIconMarker = (imageId) => {
        const tracked = iconMarkers.get(imageId)
        if (!venue || !tracked) {
          return
        }
        venue.removeImage(tracked)
        iconMarkers.delete(imageId)
      }

      // custom-text-label feature: live SDK Label objects (venue.createLabel) only exist
      // here, keyed by an id chosen by the app -- native only ever refers to them by
      // that id over the bridge. See docs/features/custom-text-label.md.
      const textLabels = new Map()

      // ~4 m north-east of the anchor's own position, so the custom text doesn't sit on
      // top of the map's own label for that POI. Also used by html-overlay-marker.
      const TEXT_LABEL_OFFSET_DEGREES = 0.00004

      // Creates a Label owned by the anchor POI itself (no createPOI needed), at the
      // position copied from it via resolveAnchorPoi, slightly offset. Always passes
      // height explicitly: createLabel defaults height to width otherwise (a square box
      // in which the text wraps and scales oddly). Replies with
      // 'text_label_create_result' -- empty text, a missing POI or a POI without a
      // position are normal outcomes, reported with ok: false + reason rather than
      // thrown. moveCamera is false when the app only recreates the label to change its
      // rotation (rotation can't be changed with updateLabel).
      const createTextLabel = (labelId, anchorId, options, moveCamera) => {
        if (!venue) {
          return
        }
        const fail = (reason, message) => {
          sendToNative({ type: 'text_label_create_result', data: { ok: false, labelId, anchorId, reason, message } })
        }
        const text = typeof options.text === 'string' ? options.text.trim() : ''
        if (!text) {
          // createLabel would throw "Cannot create Label, text is required".
          fail('empty_text')
          return
        }
        // Skip our own currently tracked label when copying the anchor's position.
        const anchor = resolveAnchorPoi(anchorId, textLabels.get(labelId))
        if (anchor.reason) {
          fail(anchor.reason)
          return
        }
        // Only one Label per id: replace any previous one rather than leaking it.
        const previous = textLabels.get(labelId)
        if (previous) {
          venue.removeLabel(previous)
          textLabels.delete(labelId)
        }
        const position = {
          ...anchor.position,
          latitude: anchor.position.latitude + TEXT_LABEL_OFFSET_DEGREES,
          longitude: anchor.position.longitude + TEXT_LABEL_OFFSET_DEGREES,
        }
        try {
          const created = venue.createLabel({
            poi: anchor.poi,
            position,
            width: options.width,
            height: options.height,
            text,
            color: options.color,
            rotation: options.rotation,
          })
          textLabels.set(labelId, created)
          // A Label is only rendered while its POI's floor is displayed, and the default
          // whole-venue view doesn't show indoor floors: move the camera onto the anchor.
          if (view && moveCamera !== false) {
            moveCameraToPoi(anchor.poi)
          }
          sendToNative({ type: 'text_label_create_result', data: { ok: true, labelId, anchorId } })
        } catch (error) {
          fail('sdk_error', error instanceof Error ? error.name + ': ' + error.message : String(error))
        }
      }

      // Live update of an already-placed Label: any of text / color / width+height.
      // width and height are always sent together by the app -- updateLabel with width
      // alone also sets height = width. rotation is deliberately not accepted here: it
      // isn't part of LabelUpdateOptions (the app recreates the label instead).
      // Fire-and-forget: a no-op if nothing is placed under that id.
      const updateTextLabel = (labelId, update) => {
        const tracked = textLabels.get(labelId)
        if (!venue || !tracked) {
          return
        }
        const options = {}
        if (typeof update.text === 'string') {
          const text = update.text.trim()
          if (!text) {
            return
          }
          options.text = text
        }
        if (update.color !== undefined) {
          options.color = update.color
        }
        if (update.width !== undefined && update.height !== undefined) {
          options.width = update.width
          options.height = update.height
        }
        try {
          venue.updateLabel(tracked, options)
        } catch (error) {
          console.error('updateLabel failed', error)
        }
      }

      // Fire-and-forget: a no-op if nothing is placed under that id (removeLabel itself
      // throws "Provided label is not registered" on a second call).
      const removeTextLabel = (labelId) => {
        const tracked = textLabels.get(labelId)
        if (!venue || !tracked) {
          return
        }
        venue.removeLabel(tracked)
        textLabels.delete(labelId)
      }

      // html-overlay-marker feature: live SDK Marker objects (venue.createMarker) only
      // exist here, keyed by an id chosen by the app -- native only ever refers to them
      // by that id over the bridge. Each entry is { marker, tapCount }. See
      // docs/features/html-overlay-marker.md.
      const htmlMarkers = new Map()

      // Inline style of the badge element. Deliberately no transform / translate /
      // position / top / left: the SDK owns those on the marker element (it centers it
      // on the position and moves it every frame).
      const HTML_MARKER_STYLE =
        'background:#0B6BCB;color:#FFFFFF;font:600 14px sans-serif;padding:6px 12px;' +
        'border-radius:14px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer'

      // Creates an HTML marker owned by the anchor POI itself (no createPOI needed), at
      // the position copied from it via resolveAnchorPoi, offset like custom-text-label
      // so the badge doesn't cover the POI's own label. Validates everything BEFORE
      // touching the current badge: a failed create leaves it in place. Replies with
      // 'html_marker_create_result' -- empty text, a missing POI or a POI without a
      // position are normal outcomes, reported with ok: false + reason rather than thrown.
      // A tap on the badge is forwarded as 'html_marker_tapped' (tapCount resets to 0 on
      // each successful create).
      const createHtmlMarker = (markerId, anchorId, text) => {
        if (!venue) {
          return
        }
        const fail = (reason, message) => {
          sendToNative({ type: 'html_marker_create_result', data: { ok: false, markerId, anchorId, reason, message } })
        }
        const badgeText = typeof text === 'string' ? text.trim() : ''
        if (!badgeText) {
          fail('empty_text')
          return
        }
        const previous = htmlMarkers.get(markerId)
        // Skip our own badge (appended to poi.markers) when copying the anchor's position.
        const anchor = resolveAnchorPoi(anchorId, undefined, previous?.marker)
        if (anchor.reason) {
          fail(anchor.reason)
          return
        }
        const position = {
          ...anchor.position,
          latitude: anchor.position.latitude + TEXT_LABEL_OFFSET_DEGREES,
          longitude: anchor.position.longitude + TEXT_LABEL_OFFSET_DEGREES,
        }
        const element = document.createElement('div')
        element.textContent = badgeText
        element.setAttribute('style', HTML_MARKER_STYLE)
        let marker
        try {
          // Only one marker per id: replace any previous one rather than leaking it.
          if (previous) {
            venue.removeMarker(previous.marker)
            htmlMarkers.delete(markerId)
          }
          // element is required (createMarker throws "invalid element provided" without
          // it). The SDK moves it into its own overlay container above the 3D canvas.
          marker = venue.createMarker({ poi: anchor.poi, position, element })
        } catch (error) {
          fail('sdk_error', error instanceof Error ? error.name + ': ' + error.message : String(error))
          return
        }
        // The SDK sets pointer-events: none on the element at creation (taps would fall
        // through to the map) and never rewrites it afterwards: opt back in.
        element.style.pointerEvents = 'auto'
        const entry = { marker, tapCount: 0 }
        element.addEventListener('click', (event) => {
          // Keep the tap from also reaching the map (it would open the POI underneath).
          event.stopPropagation()
          entry.tapCount += 1
          sendToNative({ type: 'html_marker_tapped', data: { markerId, tapCount: entry.tapCount } })
        })
        htmlMarkers.set(markerId, entry)
        // A marker is only displayed while its POI's floor is displayed, and the default
        // whole-venue view doesn't show indoor floors: move the camera onto the anchor.
        if (view) {
          moveCameraToPoi(anchor.poi)
        }
        sendToNative({ type: 'html_marker_create_result', data: { ok: true, markerId, anchorId } })
      }

      // The marker element is a live DOM node: changing its content is a plain DOM edit,
      // no SDK call. Fire-and-forget: a no-op if nothing is placed or the text is empty.
      const updateHtmlMarkerText = (markerId, text) => {
        const tracked = htmlMarkers.get(markerId)
        const badgeText = typeof text === 'string' ? text.trim() : ''
        if (!tracked || !badgeText) {
          return
        }
        tracked.marker.element.textContent = badgeText
      }

      // venue.updateMarker only accepts position and isVisible (isVisible: false sets
      // display:none, the element stays in the DOM). Fire-and-forget.
      const setHtmlMarkerVisible = (markerId, isVisible) => {
        const tracked = htmlMarkers.get(markerId)
        if (!venue || !tracked) {
          return
        }
        venue.updateMarker(tracked.marker, { isVisible: isVisible === true })
      }

      // removeMarker also detaches the element from the DOM. Fire-and-forget: a no-op if
      // nothing is placed (removeMarker itself throws "Provided marker is not registered"
      // on a second call).
      const removeHtmlMarker = (markerId) => {
        const tracked = htmlMarkers.get(markerId)
        if (!venue || !tracked) {
          return
        }
        venue.removeMarker(tracked.marker)
        htmlMarkers.delete(markerId)
      }

      // runtime-locale feature: reports the venue's available locales
      // (venue.translator.allLocales) plus the currently active one (venue.currentLocale)
      // back to native. 'default' is filtered out here rather than left for native to
      // dedupe: on this repo's shared demo map it's a byte-identical duplicate of 'fr'
      // (confirmed against the published map payload), so surfacing it as a third
      // choice would just be confusing. See docs/features/runtime-locale.md.
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

      // Switches the map's displayed language at runtime -- venue.setCurrentLocale is
      // async (returns a Promise) and, per its own doc comment, re-renders every POI
      // label and current UI item (including the active Navigation) on its own once it
      // resolves -- no manual re-fetch of POI data or view refresh needed on this side.
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
            data: { message: error instanceof Error ? \`\${error.name}: \${error.message}\` : String(error) },
          })
        }
      }

      // add-locale feature: 'es' (Spanish) is never authored in VisioMapEditor for this
      // map -- venue.translator.addLocale is a generic i18next resource bundle,
      // completely separate from the POI/floor/building/category translation data
      // parsed from the published map's own JSON (translatePOI/translateFloor/etc.).
      // It can never add or change a place's name on the map itself -- only (a) the
      // SDK's own predefined UI/navigation strings, when the key matches one of those
      // (see addLocale's own doc comment in the SDK for the full list -- 'search-for-anything'
      // here), and (b) any custom, app-defined key ('welcome-message' here, meaningless
      // to the SDK itself) later read back via translate(). Fixed dictionary is
      // hardcoded here rather than passed from native, same idiom as e.g.
      // highlightCategory's hardcoded highlight color.
      const addSpanishLocale = () => {
        if (!venue) {
          return
        }
        const resources = {
          'search-for-anything': 'Buscar cualquier cosa',
          'welcome-message': '¡Bienvenido!',
        }
        venue.translator.addLocale('es', resources)
        // translate() is synchronous and reads straight back from the bundle just
        // written above -- this is the primary, always-working proof addLocale
        // actually took, independent of whether any SDK UI text is visible right now.
        const translations = Object.keys(resources).reduce((acc, key) => {
          acc[key] = venue.translator.translate(key, 'es')
          return acc
        }, {})
        sendToNative({ type: 'locale_added', data: { translations } })
      }

      // geofencing feature: a "zone" is just an existing POI's Surface polygon --
      // there's no separate geofence concept on the SDK. Reports every surface's WGS84
      // boundary vertices back to native (a POI can have more than one Surface); the
      // point-in-polygon check itself happens on the native side, piggybacked on
      // simulated-position's tick loop -- see docs/features/geofencing.md.
      const resolveGeofenceZone = (placeId) => {
        if (!venue) {
          return
        }
        const poi = venue.pois.find((p) => p.id === placeId)
        if (!poi) {
          sendToNative({ type: 'geofence_zone_error', data: { message: \`POI not found: \${placeId}\` } })
          return
        }
        if (!poi.surfaces || poi.surfaces.length === 0) {
          sendToNative({
            type: 'geofence_zone_error',
            data: { message: \`Zone POI has no surface geometry: \${placeId}\` },
          })
          return
        }
        sendToNative({
          type: 'geofence_zone_resolved',
          data: {
            placeId,
            surfaces: poi.surfaces.map((surface) =>
              surface.positions.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
            ),
          },
        })
      }

      // geofencing feature: flags the zone POI's surfaces as "alert" (entered) or back
      // to their bundle-defined color (left) -- 'initial' is the same
      // SurfaceUpdateOptions sentinel used by clickable-surface/category-highlight.
      const setGeofenceAlert = (placeId, active) => {
        if (!venue) {
          return
        }
        const poi = venue.pois.find((p) => p.id === placeId)
        if (!poi) {
          return
        }
        poi.surfaces.forEach((surface) => {
          venue.updateSurface(surface, { color: active ? '#E74C3C' : 'initial' })
        })
      }

      // custom-theme feature: view.setTheme() throws for an id that isn't in
      // view.themes, so the native side only ever offers ids read from the 'ready'
      // message. There is no current-theme getter, the app tracks the selection itself.
      const setTheme = (theme) => {
        if (!view) {
          return
        }
        try {
          view.setTheme(theme)
        } catch (error) {
          console.error('setTheme failed', error)
        }
      }

      // custom-theme feature: accentColor / textAccentColor are plain settable view
      // properties, applied live to the SDK's own UI buttons. Both setters throw on a
      // string that isn't a hex, rgba or hsl color.
      const setAccentColors = (colors) => {
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
      }

      // camera-showcase-carousel feature: an automatic camera tour for kiosks / lobby
      // screens. The whole loop lives here in the page, next to the view -- not on the
      // React Native side, and never in the bottom sheet's content -- so closing the
      // panel doesn't stop it, there is only ever one loop, and leaving the screen
      // (which unmounts the WebView) ends it. React Native only sends start/stop and
      // mirrors the state reported back in 'camera_carousel_status'. See
      // docs/features/camera-showcase-carousel.md.
      const CAROUSEL_STOP_IDS = ['B4-UL00-ID0009', 'B1-LL01-ID0152', 'B3-UL00-ID0064', 'B4-UL03-ID0015']
      const CAROUSEL_DWELL_MS = 3000
      const CAROUSEL_RESUME_AFTER_MS = 10000
      // 'running' | 'paused' | 'stopped'
      let carouselState = 'stopped'
      // Bumped on every start/pause/stop: a loop iteration only goes on while the run id
      // it was started with is still the current one, so at most one loop is ever active.
      let carouselRunId = 0
      // Index of the stop the camera is heading to / dwelling at (-1 before the first hop).
      let carouselStopIndex = -1
      let carouselResumeTimer = null
      let carouselTouchListening = false

      const sendCarouselStatus = () => {
        sendToNative({
          type: 'camera_carousel_status',
          data: {
            state: carouselState,
            stopIndex: carouselStopIndex,
            stopCount: CAROUSEL_STOP_IDS.length,
            poiId: carouselStopIndex >= 0 ? CAROUSEL_STOP_IDS[carouselStopIndex] : null,
            resumeAfterMs: CAROUSEL_RESUME_AFTER_MS,
          },
        })
      }

      const clearCarouselResumeTimer = () => {
        if (carouselResumeTimer !== null) {
          clearTimeout(carouselResumeTimer)
          carouselResumeTimer = null
        }
      }

      // Stops a running SDK camera animation where it is. Starting another animation
      // interrupts the running one in place (its promise resolves with
      // isCanceled === true), so this starts a zero-length goToViewpoint on the camera's
      // current target, with heading/pitch left untouched ('initial'). (animation.cancel()
      // would also stop the camera where it is; its public typing wrongly says it puts
      // the target in its final state, but the SDK core implementation and live
      // measurements say otherwise.)
      const freezeCamera = () => {
        if (!view) {
          return
        }
        try {
          view.goToViewpoint(
            { positions: [view.camera.target] },
            { duration: 0, orientation: { heading: 'initial', pitch: 'initial' } }
          )
        } catch (error) {
          console.error('freezeCamera failed', error)
        }
      }

      const runCarouselLoop = async (runId, startIndex) => {
        const isCurrentRun = () => runId === carouselRunId && carouselState === 'running'
        let index = startIndex
        while (isCurrentRun()) {
          const poi = venue.pois.find((p) => p.id === CAROUSEL_STOP_IDS[index])
          carouselStopIndex = index
          sendCarouselStatus()
          if (poi) {
            // The SDK docs make the caller responsible for switching to the POI's floor
            // before goToPOI.
            if (poi.floor) {
              const floorAnimation = view.goToFloor(poi.floor, { duration: 800 })
              await floorAnimation
              if (!isCurrentRun()) {
                return
              }
              if (floorAnimation.isCanceled) {
                // Something else started a camera animation: let it win.
                pauseCarousel(false)
                return
              }
            }
            const poiAnimation = view.goToPOI(poi, {
              duration: 2500,
              easing: 'easeInOutQuad',
              orientation: { heading: index * 90, pitch: 30 },
            })
            await poiAnimation
            if (!isCurrentRun()) {
              return
            }
            if (poiAnimation.isCanceled) {
              pauseCarousel(false)
              return
            }
          } else {
            console.warn('camera-showcase-carousel: POI not found', CAROUSEL_STOP_IDS[index])
          }
          await new Promise((resolve) => setTimeout(resolve, CAROUSEL_DWELL_MS))
          index = (index + 1) % CAROUSEL_STOP_IDS.length
        }
      }

      const startCarousel = (startIndex = 0) => {
        if (!view || !venue) {
          return
        }
        if (!carouselTouchListening) {
          // The SDK has no "camera moved by the user" event, and a drag does not
          // interrupt an SDK camera animation (the user would fight the camera), so the
          // page detects touches itself. Capture phase: seen before the SDK's own
          // handlers, whatever they do with the event.
          document
            .querySelector('#content')
            .addEventListener('pointerdown', () => onCarouselTouch(), { capture: true })
          document
            .querySelector('#content')
            .addEventListener('pointerup', () => onCarouselTouch(), { capture: true })
          carouselTouchListening = true
        }
        clearCarouselResumeTimer()
        carouselState = 'running'
        carouselRunId += 1
        runCarouselLoop(carouselRunId, startIndex)
      }

      // Touch on the map: the user's gesture wins. Interrupts the hop in place and
      // schedules a resume from the next stop once the map has been left alone for
      // CAROUSEL_RESUME_AFTER_MS.
      const pauseCarousel = (interruptCamera) => {
        if (carouselState === 'stopped') {
          return
        }
        if (carouselState === 'running') {
          carouselState = 'paused'
          carouselRunId += 1
          if (interruptCamera) {
            freezeCamera()
          }
          sendCarouselStatus()
        }
        clearCarouselResumeTimer()
        carouselResumeTimer = setTimeout(() => {
          carouselResumeTimer = null
          if (carouselState === 'paused') {
            startCarousel((carouselStopIndex + 1) % CAROUSEL_STOP_IDS.length)
          }
        }, CAROUSEL_RESUME_AFTER_MS)
      }

      const onCarouselTouch = () => {
        // pointerdown pauses; pointerup (end of a long drag) restarts the idle delay.
        pauseCarousel(true)
      }

      // Stop: no further hop is scheduled. The hop in flight, if any, is left to finish
      // on its own (no cancel(), which would stop the camera mid-flight).
      const stopCarousel = () => {
        clearCarouselResumeTimer()
        carouselRunId += 1
        carouselState = 'stopped'
        carouselStopIndex = -1
        sendCarouselStatus()
      }

      const onMessage = (event) => {
        try {
          const evt = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

          if (!evt.type) {
            console.error('Invalid message: missing type')
            return
          }

          switch (evt.type) {
            case 'setup':
              setup(
                evt.data.hash,
                evt.data.baseURL,
                evt.data.enableShadows,
                evt.data.cameraProjection
              )
              break
            case 'reset_map':
              resetMap()
              break
            case 'select_place':
              goToPlace(evt.data.placeId)
              break
            case 'clear_place':
              clearPlace()
              break
            case 'select_floor':
              goToFloor(evt.data.buildingId, evt.data.floorId)
              break
            case 'update_occupancy':
              updateOccupancy(evt.data.occupancy)
              break
            case 'start_itinerary':
              startItinerary(
                evt.data.origin,
                evt.data.destination,
                evt.data.isAccessible,
                evt.data.excludedAttributes
              )
              break
            case 'update_navigation_trace':
              updateNavigationTraceStyle(evt.data.style)
              break
            case 'set_ui_part_visible':
              setUIPartVisible(evt.data.uiPart, evt.data.isVisible)
              break
            case 'set_explore_mode':
              setExploreMode(evt.data.mode)
              break
            case 'resolve_poi_positions':
              resolvePositionSimulationPois(evt.data.originId, evt.data.destinationId)
              break
            case 'inject_tracked_position':
              injectTrackedPosition(evt.data.position, evt.data.precisionCircleRadius)
              break
            case 'stop_position_simulation':
              stopPositionSimulation()
              break
            case 'set_camera_lock_on_position':
              setCameraLockOnPosition(evt.data.locked)
              break
            case 'set_position_tracker_style':
              setPositionTrackerStyle(evt.data.color, evt.data.opacity)
              break
            case 'set_surface_interactive':
              setSurfaceInteractive(evt.data.placeId, evt.data.interactive)
              break
            case 'refresh_custom_data':
              refreshCustomData()
              break
            case 'get_poi_custom_data':
              getPoiCustomData(evt.data.placeId)
              break
            case 'get_categories':
              getCategories()
              break
            case 'highlight_category':
              highlightCategory(evt.data.categoryId)
              break
            case 'clear_category_highlight':
              clearCategoryHighlight()
              break
            case 'create_dynamic_poi':
              createDynamicPoi(evt.data.newId, evt.data.anchorId, evt.data.labelText)
              break
            case 'update_dynamic_poi_label':
              updateDynamicPoiLabel(evt.data.text)
              break
            case 'remove_dynamic_poi':
              removeDynamicPoi()
              break
            case 'create_icon_marker':
              createIconMarker(evt.data.imageId, evt.data.anchorId, evt.data.options)
              break
            case 'update_icon_marker_orientation':
              updateIconMarkerOrientation(evt.data.imageId, evt.data.orientationType)
              break
            case 'remove_icon_marker':
              removeIconMarker(evt.data.imageId)
              break
            case 'create_text_label':
              createTextLabel(evt.data.labelId, evt.data.anchorId, evt.data.options, evt.data.moveCamera)
              break
            case 'update_text_label':
              updateTextLabel(evt.data.labelId, evt.data.update)
              break
            case 'remove_text_label':
              removeTextLabel(evt.data.labelId)
              break
            case 'create_html_marker':
              createHtmlMarker(evt.data.markerId, evt.data.anchorId, evt.data.text)
              break
            case 'update_html_marker_text':
              updateHtmlMarkerText(evt.data.markerId, evt.data.text)
              break
            case 'set_html_marker_visible':
              setHtmlMarkerVisible(evt.data.markerId, evt.data.isVisible)
              break
            case 'remove_html_marker':
              removeHtmlMarker(evt.data.markerId)
              break
            case 'get_locales':
              getLocales()
              break
            case 'set_locale':
              setLocale(evt.data.locale)
              break
            case 'add_locale':
              addSpanishLocale()
              break
            case 'resolve_geofence_zone':
              resolveGeofenceZone(evt.data.placeId)
              break
            case 'set_geofence_alert':
              setGeofenceAlert(evt.data.placeId, evt.data.active)
              break
            case 'set_theme':
              setTheme(evt.data.theme)
              break
            case 'set_accent_colors':
              setAccentColors(evt.data)
              break
            case 'start_camera_carousel':
              startCarousel(0)
              break
            case 'stop_camera_carousel':
              stopCarousel()
              break
            default:
              console.error('Unknown message type:', evt.type)
          }
        } catch (e) {
          console.error('Error parsing message from React Native', e)
        }
      }

      const sendToNative = (event) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(event))
      }

      // react-native-webview dispatches postMessage on window on iOS, but on document
      // (non-bubbling) on Android: listen on both or Android never receives commands.
      window.addEventListener('message', onMessage)
      document.addEventListener('message', onMessage)
    </script>

    <style>
      #content {
        height: 100vh;
      }
    </style>
  </body>
</html>
`;
