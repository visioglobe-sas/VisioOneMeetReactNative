// Same content as visioOne.html, exported as a template-literal string so it can be
// passed via <WebView source={{ html, baseUrl }}> instead of source={require('./visioOne.html')}.
// Why this matters: when the HTML is loaded via require(), Metro serves it through the dev
// server in Debug builds and appends its own "?hash=..." cache-busting query param to the
// page URL. VisioOne SDK >= 1.0.5 merges the page's own URL query parameters into loadVenue's
// options, so that unrelated Metro-generated "hash" param silently overrides the real map
// hash passed in code -- see docs/SDK_NOTES.md for the full writeup. Loading the HTML inline
// with an explicit baseUrl avoids the Metro-served URL entirely.
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
      const visioOneReady = import('https://cdn.visioglobe.com/visioone/1.0.5/dist/visioone.js').then(
        ({ createVisioOne }) => createVisioOne()
      )
      let view = null
      let venue = null
      let image = null
      let poiInfo = null

      // baseURL is optional -- LoadOptions.baseURL defaults to
      // https://mapserver.visioglobe.com/ inside the SDK itself when omitted, so a blank
      // field here means "use the SDK's own default", not some hardcoded fallback of
      // this demo's own. See docs/features/custom-base-url.md.
      const setup = async (hash, baseURL) => {
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
            ? { hash: venueHash, baseURL: trimmedBaseURL }
            : { hash: venueHash }
          venue = await visioOne.loadVenue(loadOptions, container)
          await visioOne
            .createView(container, venue, {
              cameraProjection: 'perspective',
            })
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

      const goToPlace = (placeId) => {
        if (venue && view) {
          const poi = venue.pois.find((p) => p.id === placeId)
          poiInfo = poi

          if (poi) {
            view.goToPOI(poi, {
              orientation: { pitch: 20 },
              padding: { top: 100, bottom: 100, right: 100, left: 100 },
            })

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

      const startItinerary = (origin, destination, isAccessible) => {
        const navigation = venue.computeNavigation({
          origin,
          destination,
          isAccessible,
          type: 'fastest',
          firstNodeAsIntersection: false,
          mergeFloorChangeInstructions: false,
        })

        const navigationTrace = venue.createNavigationTrace(navigation)
        view.setCurrentNavigationTrace(navigationTrace)

        sendToNative({
          type: 'itinerary_instructions',
          data: navigation.instructions,
        })
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
      // than requiring a separate message from native.
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
      // position is currently being tracked. Only has a visible effect once
      // view.allowTracking is true (see injectTrackedPosition above) -- setting this
      // while allowTracking is still false is a harmless no-op per the SDK's own doc
      // comment, unlike injectTrackedPosition, which throws in that situation.
      const setCameraLockOnPosition = (locked) => {
        if (view) {
          view.lockCameraPositionOnTracking = locked
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
      // existing "anchor" POI (there's no tap-to-place UI here). anchorPoi.labels[0]
      // and .markers[0] are checked, in that order, since either is a normal way for a
      // POI to carry a position; a POI with neither (e.g. surface-only) reports a
      // distinct "no position to copy" outcome instead of crashing.
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
        const anchorPoi = venue.pois.find((p) => p.id === anchorId)
        if (!anchorPoi) {
          sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'anchor_not_found' } })
          return
        }
        const position = anchorPoi.labels[0]?.position ?? anchorPoi.markers[0]?.position
        if (!position) {
          sendToNative({ type: 'dynamic_poi_create_result', data: { ok: false, reason: 'no_position' } })
          return
        }
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

      const onMessage = (event) => {
        try {
          const evt = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

          if (!evt.type) {
            console.error('Invalid message: missing type')
            return
          }

          switch (evt.type) {
            case 'setup':
              setup(evt.data.hash, evt.data.baseURL)
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
              startItinerary(evt.data.origin, evt.data.destination, evt.data.isAccessible)
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

      window.addEventListener('message', onMessage)
    </script>

    <style>
      #content {
        height: 100vh;
      }
    </style>
  </body>
</html>
`;
