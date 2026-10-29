// goto-poi: moves the camera onto a POI and drops a pin on it. See
// docs/features/goto-poi.md.
;(function (core) {
  'use strict'

  // A pin Image (venue.createImage) is placed on the POI the camera goes to, at its
  // display position (core.getPoiDisplayPosition). Only one pin at a time: every Go
  // removes the previous one first, and Clear removes it. The icon is an inline data:
  // URL (a 96x96 PNG), so the demo depends on no third-party host.
  let gotoPin = null
  const GOTO_PIN_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACBklEQVR42u3dWW4CMRBFUVbLarOn5JsIqRlsv6FuSfmE0O+IwS7bfbtR1GXdf34/+qMOhg2KcehgGIU+HsMt+DEQ7sHXQqQFXwWRHn4sQkvwkRCt4dsjtAdvDTEtfCuEqeFbIAgv/H/NQzAKfx6CYfhzEIzD70cQf+FFAGxFAEAIEBJ+J4LB7+04gKUIAAgBTEackQBfI4SG34MAgBDAaMIrHuAjBACEAGZTvhUAbyEAIAQwbHrUALyEAAAAcwGMe68V4V8iHAjJHeAI7mqAb0oNcOK1vwYgCP+di1E/334EMcDVRSmewx5gd60COPk6K94Bzy7u1OP4CAqrNQCCQdJ4gAcE0Uh1dPgrASYirB0Ri+dsRoa/A6AdYt+ckNksZn3wpwDSIc7NiprP69cFrwJwBdH3BUo6YLlN+qI2ZGZ7EgAA+AgqD99/ueKA8K0Q0veAxSMk7v+tQnABULQrvQZhQgBVv9gCQb00cXVoUQgOa0MBEALsCitvFlSEMBpAvT9gd0g5TRgATAGMe8Ru/ydul+TJULIBNiGMBlDvlFcE4rkGSISgCsICwOG0FGUIuQDCdaM121ydTs1S/wrJDP8gQN3pu44nJzo1RXLC56h6Ts4FAAROUCd8ELiLBuGDwJ2UCB8E7qhH8BMR4orgQZgdfjJEbRE8ELODd8KgBBjUQRSKuqo/fm7G7BpJ/VcAAAAASUVORK5CYII='

  const clearPlace = () => {
    if (core.venue && gotoPin) {
      core.venue.removeImage(gotoPin)
    }
    gotoPin = null
  }

  core.register({
    select_place: ({ placeId }) => {
      const venue = core.venue
      if (!venue || !core.view) {
        return
      }
      clearPlace()
      const poi = core.findPoi(placeId)
      if (!poi) {
        // Reported to React Native as a 'command_error' by the core.
        throw new Error(`POI not found: ${placeId}`)
      }
      core.moveCameraToPoi(poi)
      const position = core.getPoiDisplayPosition(poi)
      if (position) {
        gotoPin = venue.createImage({
          poi,
          position,
          width: 2,
          height: 2,
          orientationType: 'facing',
          url: GOTO_PIN_URL,
        })
      }
    },
    clear_place: () => {
      clearPlace()
    },
  })
})(window.MapCore)
