// camera-projection-toggle: the projection is a createView option (see the core's
// setup); this file only reports the one the view was actually created with. See
// docs/features/camera-projection-toggle.md.
;(function (core) {
  'use strict'

  // Read back from the read-only view.cameraProjection (a page-URL ?orthographic
  // parameter would override the createView option).
  core.onReady((view) => ({ cameraProjection: view.cameraProjection }))
})(window.MapCore)
