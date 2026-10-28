// auth-token: the token itself is a loadVenue option (see the core's setup, which also
// reports UnauthorizedError as 'unauthorized'). See docs/features/auth-token.md.
;(function (core) {
  'use strict'

  core.register({
    // Tokens are short-lived (at most 1 hour on the protected server). Send a fresh
    // token from your backend BEFORE the current one expires: it replaces the
    // Authorization header for every later map request of this venue -- no reload
    // needed.
    set_authorization_token: ({ token }) => {
      if (!core.venue) {
        console.warn('setAuthorizationToken: no venue loaded yet')
        return
      }
      try {
        core.venue.setAuthorizationToken(token)
      } catch (error) {
        console.error('setAuthorizationToken failed', error)
      }
    },
  })
})(window.MapCore)
