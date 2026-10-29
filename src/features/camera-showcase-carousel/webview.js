// camera-showcase-carousel: an automatic camera tour for kiosks / lobby screens. The
// whole loop lives here in the page, next to the view -- not on the React Native side,
// and never in the bottom sheet's content -- so closing the panel doesn't stop it,
// there is only ever one loop, and leaving the screen (which unmounts the WebView)
// ends it. React Native only sends start/stop and mirrors the state reported back in
// 'camera_carousel_status'. See docs/features/camera-showcase-carousel.md.
;(function (core) {
  'use strict'

  // Stop POI ids, sent by React Native with 'start_camera_carousel' (see
  // CAROUSEL_STOP_IDS in src/demoMap.ts).
  let carouselStopIds = []
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
    core.sendToNative({
      type: 'camera_carousel_status',
      data: {
        state: carouselState,
        stopIndex: carouselStopIndex,
        stopCount: carouselStopIds.length,
        poiId: carouselStopIndex >= 0 ? carouselStopIds[carouselStopIndex] : null,
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
    const view = core.view
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
    const view = core.view
    const isCurrentRun = () => runId === carouselRunId && carouselState === 'running'
    let index = startIndex
    while (isCurrentRun()) {
      const poi = core.findPoi(carouselStopIds[index])
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
        console.warn('camera-showcase-carousel: POI not found', carouselStopIds[index])
      }
      await new Promise((resolve) => setTimeout(resolve, CAROUSEL_DWELL_MS))
      index = (index + 1) % carouselStopIds.length
    }
  }

  const startCarousel = (startIndex = 0) => {
    if (!core.view || !core.venue || carouselStopIds.length === 0) {
      return
    }
    if (!carouselTouchListening) {
      // The SDK has no "camera moved by the user" event, and a drag does not interrupt
      // an SDK camera animation (the user would fight the camera), so the page detects
      // touches itself. Capture phase: seen before the SDK's own handlers, whatever
      // they do with the event.
      core.container.addEventListener('pointerdown', () => onCarouselTouch(), { capture: true })
      core.container.addEventListener('pointerup', () => onCarouselTouch(), { capture: true })
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
        startCarousel((carouselStopIndex + 1) % carouselStopIds.length)
      }
    }, CAROUSEL_RESUME_AFTER_MS)
  }

  const onCarouselTouch = () => {
    // pointerdown pauses; pointerup (end of a long drag) restarts the idle delay.
    pauseCarousel(true)
  }

  // Stop: no further hop is scheduled. The hop in flight, if any, is left to finish on
  // its own (no cancel(), which would stop the camera mid-flight).
  const stopCarousel = () => {
    clearCarouselResumeTimer()
    carouselRunId += 1
    carouselState = 'stopped'
    carouselStopIndex = -1
    sendCarouselStatus()
  }

  core.register({
    start_camera_carousel: ({ stopIds }) => {
      carouselStopIds = stopIds || []
      startCarousel(0)
    },
    stop_camera_carousel: () => {
      stopCarousel()
    },
  })
})(window.MapCore)
