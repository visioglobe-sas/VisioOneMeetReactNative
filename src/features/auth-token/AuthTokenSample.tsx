// auth-token feature -- CODE SAMPLE ONLY.
//
// Loads a map protected by an authorization token. This demo has no protected map of
// its own, so every value below is a FICTITIOUS placeholder: replace them with your own
// before using this component. The demo's feature screen does not render it (it only
// shows an explanatory text), so nothing here runs with the placeholders. See
// docs/features/auth-token.md.
//
// The page side: src/webview/core.js (setup passes authorizationToken to
// visioOne.loadVenue, isUnauthorizedError recognizes UnauthorizedError) and
// src/features/auth-token/webview.js ('set_authorization_token' calls
// venue.setAuthorizationToken).
import * as React from 'react';

import VisioMapView from '../../bridge/VisioMapView';
import { useAuthTokenBridge } from './bridge';

// Placeholder: the hash of YOUR protected map (distinct from any public map hash).
export const PROTECTED_MAP_HASH = 'YOUR_PROTECTED_MAP_HASH';

// The protected map server: it enforces the token (the standard
// https://mapserver.visioglobe.com/ does not).
export const PROTECTED_MAP_BASE_URL = 'https://mapserver-auth.visioglobe.com/';

// Placeholder: a JWT issued by YOUR OWN backend. Visioglobe provides the signing secret
// and the claims to use; the signing secret must never be embedded in the app.
export const AUTHORIZATION_TOKEN = 'YOUR_JWT_FROM_YOUR_BACKEND';

// Tokens are short-lived (at most 1 hour on the protected server): refresh well before.
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

// Replace with a call to your own backend endpoint that issues the JWT.
export const fetchAuthorizationToken = async (): Promise<string> => AUTHORIZATION_TOKEN;

// Refreshes the token of the already-loaded venue (venue.setAuthorizationToken in the
// WebView page) on a timer -- no venue reload needed.
const TokenRefresher = () => {
  const { ready, setAuthorizationToken } = useAuthTokenBridge();
  const setTokenRef = React.useRef(setAuthorizationToken);
  setTokenRef.current = setAuthorizationToken;

  React.useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setInterval(() => {
      fetchAuthorizationToken()
        .then((freshToken) => setTokenRef.current(freshToken))
        .catch((error) => console.warn('Could not refresh the authorization token', error));
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ready]);

  return null;
};

export const ProtectedMapSample = () => {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAuthorizationToken()
      .then(setToken)
      .catch((error) => console.warn('Could not get an authorization token', error));
  }, []);

  if (!token) {
    return null;
  }

  return (
    <VisioMapView
      mapHash={PROTECTED_MAP_HASH}
      baseURL={PROTECTED_MAP_BASE_URL}
      authorizationToken={token}
      onUnauthorized={(message) => {
        // UnauthorizedError: the token is invalid, expired or missing. A real app would
        // get a fresh token from its backend and remount the map (change its `key`).
        console.warn('Protected map: authorization token invalid, expired or missing', message);
      }}>
      <TokenRefresher />
    </VisioMapView>
  );
};

export default ProtectedMapSample;
