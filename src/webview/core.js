// Core of the page: loads the map (venue + view), owns the React Native <-> page
// message channel, the helpers shared by several features, and the registration API
// the feature files use.
//
// Every feature lives in its own file, src/features/<slug>/webview.js (same slug as
// docs/features/<slug>.md), run after this one (see index.html). A feature file:
//   - handles its React Native -> page messages through MapCore.register({ type: fn });
//   - adds its view event listeners through MapCore.onViewCreated(fn);
//   - adds its fields to the 'ready' message through MapCore.onReady(fn).
// bootstrap.js, run last, then starts listening to React Native.
;(function () {
  'use strict'

  // Loading the SDK is async and can take a moment on a slow connection. The React
  // Native message listener is registered before it resolves (bootstrap.js), otherwise
  // the initial 'setup' message could be lost.
  const visioOneReady = import('https://cdn.visioglobe.com/visioone/1.1.0/dist/visioone.js').then(
    ({ createVisioOne }) => createVisioOne()
  )
  const container = document.querySelector('#content')
  let venue = null
  let view = null

  const handlers = {}
  const viewCreatedHooks = []
  const readyHooks = []

  // Page -> React Native: every message goes through here, as { type, data }.
  const sendToNative = (event) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(event))
  }

  // Formats any thrown value for a message to React Native.
  const errorMessage = (error) =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error)

  const findPoi = (poiId) => (venue ? venue.pois.find((p) => p.id === poiId) : undefined)

  // A POI has no position field of its own: its position comes from the objects it
  // owns. Every feature that needs "where is this POI" (goto-poi, simulated position,
  // the anchors of dynamic-poi-crud / 3d-icon-marker / custom-text-label /
  // html-overlay-marker) goes through this one helper, always with the same
  // priority: (1) the POI's first Label position, (2) its first Image position, then
  // its first Marker position, (3) the centroid of its first Surface's vertices
  // (Surface.positions). `exclude` lists objects to skip -- a Label / Image / Marker
  // this demo itself attached to the POI. Returns null when nothing gives a position.
  const getPoiDisplayPosition = (poi, exclude = []) => {
    const first = (items) => (items || []).find((item) => !exclude.includes(item) && item.position)
    const position =
      first(poi.labels)?.position ?? first(poi.images)?.position ?? first(poi.markers)?.position
    if (position) {
      return { latitude: position.latitude, longitude: position.longitude, altitude: position.altitude }
    }
    const vertices = poi.surfaces?.[0]?.positions ?? []
    if (vertices.length === 0) {
      return null
    }
    const sum = vertices.reduce(
      (acc, p) => ({
        latitude: acc.latitude + p.latitude,
        longitude: acc.longitude + p.longitude,
        altitude: acc.altitude + (p.altitude ?? 0),
      }),
      { latitude: 0, longitude: 0, altitude: 0 }
    )
    return {
      latitude: sum.latitude / vertices.length,
      longitude: sum.longitude / vertices.length,
      altitude: sum.altitude / vertices.length,
    }
  }

  // Shared by dynamic-poi-crud, 3d-icon-marker, custom-text-label and
  // html-overlay-marker: resolves an "anchor" POI id to the POI itself plus its
  // display position (getPoiDisplayPosition). Returns { reason } instead of throwing
  // on the two normal, non-crash failure outcomes: 'anchor_not_found' (no POI with
  // that id) and 'no_position' (nothing on the POI gives a position). `exclude`
  // lists the Label / Image / Marker this demo itself attached to the anchor, so a
  // re-place never copies its own (already offset) position.
  const resolveAnchorPoi = (anchorId, exclude = []) => {
    const poi = findPoi(anchorId)
    if (!poi) {
      return { reason: 'anchor_not_found' }
    }
    const position = getPoiDisplayPosition(poi, exclude)
    if (!position) {
      return { reason: 'no_position' }
    }
    return { poi, position }
  }

  // ~4 m north-east of `position`, so a label or badge placed next to a POI doesn't
  // sit on top of the map's own label for that POI. Used by custom-text-label and
  // html-overlay-marker.
  const ANCHOR_OFFSET_DEGREES = 0.00004
  const offsetPosition = (position) => ({
    ...position,
    latitude: position.latitude + ANCHOR_OFFSET_DEGREES,
    longitude: position.longitude + ANCHOR_OFFSET_DEGREES,
  })

  // Shared by goto-poi, 3d-icon-marker, custom-text-label and html-overlay-marker:
  // animates the camera onto a POI (and its floor), so indoor content attached to it
  // is actually in view.
  const moveCameraToPoi = (poi) => {
    view.goToPOI(poi, {
      orientation: { pitch: 20 },
      padding: { top: 100, bottom: 100, right: 100, left: 100 },
    })
  }

  // auth-token feature. The CDN build only exports createVisioOne/VisioOne, not the
  // SDK's error classes, so UnauthorizedError can't be checked with instanceof here.
  // Its error.name is the generic "Error" (the class doesn't override it): the class
  // name identifies it, with the SDK's message as a fallback in case a build ever
  // mangles class names. (With the npm package, prefer
  // "error instanceof UnauthorizedError".)
  const isUnauthorizedError = (error) =>
    error?.constructor?.name === 'UnauthorizedError' ||
    error?.message === 'This venue needs an Authorization token to be loaded'

  // The 'setup' message: loads the venue and creates the view.
  //
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
  //
  // authorizationToken is the auth-token feature's LoadOptions.authorizationToken:
  // a JWT issued by YOUR backend, sent by the SDK as "Authorization: Bearer <token>"
  // on every map request. Only meaningful together with the protected map server as
  // baseURL (https://mapserver-auth.visioglobe.com/) and a protected map hash. Every
  // other screen leaves it undefined (public map, no header). See
  // docs/features/auth-token.md.
  const setup = async ({ hash, baseURL, enableShadows, cameraProjection, authorizationToken }) => {
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
      const visioOne = await visioOneReady
      const loadOptions = trimmedBaseURL
        ? { vg_maphash: venueHash, baseURL: trimmedBaseURL }
        : { vg_maphash: venueHash }
      if (typeof authorizationToken === 'string' && authorizationToken !== '') {
        loadOptions.authorizationToken = authorizationToken
      }
      venue = await visioOne.loadVenue(loadOptions, container)
      const viewOptions = {
        cameraProjection: cameraProjection === 'orthographic' ? 'orthographic' : 'perspective',
      }
      if (enableShadows === true) {
        viewOptions.enableShadows = true
      }
      view = await visioOne.createView(container, venue, viewOptions)
      viewCreatedHooks.forEach((hook) => hook(view))
      // Each feature adds the initial state it needs (floors, explore mode, themes...).
      const data = {}
      readyHooks.forEach((hook) => Object.assign(data, hook(view)))
      sendToNative({ type: 'ready', data })
    } catch (error) {
      // auth-token feature: an invalid, expired or missing token is reported
      // distinctly from any other load failure, so the app can e.g. fetch a fresh
      // token from its backend and retry.
      if (isUnauthorizedError(error)) {
        console.error('VisioOne: authorization token invalid, expired or missing', error)
        sendToNative({ type: 'unauthorized', data: error.message })
        return
      }
      const cause = visioOneLoadError || error
      console.error('Unable to initialize VisioOne', error)
      sendToNative({
        type: 'error',
        data: errorMessage(cause),
      })
    } finally {
      console.warn = originalConsoleWarn
    }
  }
  handlers.setup = setup

  // A command that throws synchronously (e.g. computeNavigation with an unknown POI
  // id) is reported to React Native as 'command_error' { command, message }, so the
  // app can show it instead of the failure going unnoticed.
  const onMessage = (event) => {
    let evt
    try {
      evt = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    } catch (error) {
      console.error('Invalid message from React Native', error)
      return
    }
    if (!evt || !evt.type) {
      console.error('Invalid message: missing type')
      return
    }
    const handler = handlers[evt.type]
    if (!handler) {
      console.error('Unknown message type:', evt.type)
      return
    }
    try {
      handler(evt.data || {})
    } catch (error) {
      console.error(`Command '${evt.type}' failed`, error)
      sendToNative({ type: 'command_error', data: { command: evt.type, message: errorMessage(error) } })
    }
  }

  // API used by the feature files.
  const core = {
    container,
    sendToNative,
    errorMessage,
    findPoi,
    getPoiDisplayPosition,
    resolveAnchorPoi,
    offsetPosition,
    moveCameraToPoi,

    // The NavigationTrace currently displayed (set by compute-navigation, restyled by
    // custom-navigation-trace), null until a route is computed.
    currentNavigationTrace: null,

    // Adds message handlers: { type: (data) => ... }, `type` being the message type
    // React Native sends. A type already taken is a wiring error (two features
    // stepping on each other): logged and ignored.
    register: (messages) => {
      Object.keys(messages).forEach((type) => {
        if (handlers[type]) {
          console.error(`Message type already registered: ${type}`)
          return
        }
        handlers[type] = messages[type]
      })
    },

    // `fn(view)` runs once the view exists, before 'ready': the feature adds its view
    // event listeners there.
    onViewCreated: (fn) => {
      viewCreatedHooks.push(fn)
    },

    // `fn(view)` returns an object merged into the 'ready' message's data: the
    // initial state the feature's React Native side needs.
    onReady: (fn) => {
      readyHooks.push(fn)
    },

    // Called once by bootstrap.js, after every feature file.
    start: () => {
      // react-native-webview dispatches postMessage on window on iOS, but on document
      // (non-bubbling) on Android: listen on both or Android never receives commands.
      window.addEventListener('message', onMessage)
      document.addEventListener('message', onMessage)
      // Handshake: React Native sends 'setup' when it receives this, i.e. only once the
      // listeners above are registered (no fixed delay needed).
      sendToNative({ type: 'page_ready' })
    },
  }

  // Current venue/view, null until the map is loaded.
  Object.defineProperty(core, 'venue', { get: () => venue })
  Object.defineProperty(core, 'view', { get: () => view })

  window.MapCore = core
})()
