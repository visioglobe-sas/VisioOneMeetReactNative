// camera-lock-on-position: binds the camera onto the tracked position and mirrors the
// lock state to React Native. See docs/features/camera-lock-on-position.md.
;(function (core) {
  'use strict'

  core.onViewCreated((view) => {
    // Mirrors view.lockCameraPositionOnTracking to native instead of native keeping its
    // own copy -- the SDK changes it by itself: setting allowTracking = true turns it
    // on, allowTracking = false turns it off, and a user pan/zoom while tracking turns
    // it off ('trackingchanged'). None of these events carry the value, so it's read
    // from the view inside the handler.
    const sendCameraLockState = () => {
      core.sendToNative({
        type: 'camera_lock_changed',
        data: { locked: view.lockCameraPositionOnTracking === true },
      })
    }
    view.addEventListener('trackingon', sendCameraLockState)
    view.addEventListener('trackingoff', sendCameraLockState)
    view.addEventListener('trackingchanged', sendCameraLockState)
  })

  core.register({
    // Only has an effect once view.allowTracking is true (see simulated-position) --
    // setting this while allowTracking is still false is a silent no-op, unlike
    // injectTrackedPosition, which throws in that situation. The SDK answers with a
    // 'trackingchanged' event, which is what updates the native toggle.
    set_camera_lock_on_position: ({ locked }) => {
      if (core.view) {
        core.view.lockCameraPositionOnTracking = locked
      }
    },
  })
})(window.MapCore)
