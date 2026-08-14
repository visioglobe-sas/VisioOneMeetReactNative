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

      const setup = async (hash) => {
        const venueHash = typeof hash === 'string' ? hash.trim() : ''
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
          sendToNative({
            type: 'loading',
            data: {
              hash: venueHash,
              descriptorURL: \`https://mapserver.visioglobe.com/\${venueHash}/descriptor.json\`,
            },
          })
          const visioOne = await visioOneReady
          const container = document.querySelector('#content')
          venue = await visioOne.loadVenue({ hash: venueHash }, container)
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

      const onMessage = (event) => {
        try {
          const evt = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

          if (!evt.type) {
            console.error('Invalid message: missing type')
            return
          }

          switch (evt.type) {
            case 'setup':
              setup(evt.data.hash)
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
