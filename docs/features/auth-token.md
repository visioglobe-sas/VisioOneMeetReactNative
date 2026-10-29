# Protected map (token) — code sample

## Description

Loads a map protected by an authorization token: a short-lived JWT passed to the SDK as `LoadOptions.authorizationToken`, refreshed later with `venue.setAuthorizationToken(freshToken)`, with the SDK's `UnauthorizedError` reported distinctly from other load errors.

**This feature is a code sample only.** This demo has no protected map to load, so every value in the repo is a **fictitious placeholder** you must replace with your own:

| Constant (`src/features/auth-token/AuthTokenSample.tsx`) | Placeholder value | Replace with |
| --- | --- | --- |
| `PROTECTED_MAP_HASH` | `YOUR_PROTECTED_MAP_HASH` | the hash of your protected map |
| `PROTECTED_MAP_BASE_URL` | `https://mapserver-auth.visioglobe.com/` | keep as is (the protected map server) |
| `AUTHORIZATION_TOKEN` / `fetchAuthorizationToken()` | `YOUR_JWT_FROM_YOUR_BACKEND` | a call to your own backend that issues the JWT |

The app's "Protected map (token)" screen (`src/features/auth-token/AuthTokenInfo.tsx`) only shows a short text pointing here; it does not render the sample and never tries to load a map with the placeholders.

## SDK usage

### React Native side

`src/features/auth-token/AuthTokenSample.tsx` exports `ProtectedMapSample`, a ready-to-render component: it gets a token, then mounts the map against the protected server.

```tsx
// src/features/auth-token/AuthTokenSample.tsx
export const PROTECTED_MAP_HASH = 'YOUR_PROTECTED_MAP_HASH';
export const PROTECTED_MAP_BASE_URL = 'https://mapserver-auth.visioglobe.com/';
// A JWT issued by YOUR OWN backend. Visioglobe provides the signing secret and the
// claims to use; the signing secret must never be embedded in the app.
export const AUTHORIZATION_TOKEN = 'YOUR_JWT_FROM_YOUR_BACKEND';

export const fetchAuthorizationToken = async (): Promise<string> => AUTHORIZATION_TOKEN;

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
```

The token travels to the WebView page in the same `setup` message as the map hash and base URL (sent by `VisioMapView` once the page reports `page_ready`), and refreshes go through their own message:

```tsx
// src/bridge/VisioMapView.tsx
if (evt.type === 'page_ready') {
  send('setup', {
    hash: mapHash ?? DEMO_MAP_HASH,
    baseURL,
    enableShadows,
    cameraProjection,
    authorizationToken,
  });
}
```

```ts
// src/features/auth-token/bridge.ts
export const useAuthTokenBridge = () => {
  const { send, status } = useMapBridge();
  return {
    ready: status === 'ready',
    setAuthorizationToken: (token: string) => send('set_authorization_token', { token }),
  };
};
```

`TokenRefresher` (rendered as a child of `VisioMapView`, so it can use the bridge) calls `setAuthorizationToken(await fetchAuthorizationToken())` on a timer (every 50 minutes) once the venue is ready:

```tsx
// src/features/auth-token/AuthTokenSample.tsx
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
    }, TOKEN_REFRESH_INTERVAL_MS); // 50 * 60 * 1000
    return () => clearInterval(timer);
  }, [ready]);

  return null;
};
```

### WebView side

In the WebView page, `setup()` (`src/webview/core.js`) adds the token to the load options, and the `set_authorization_token` handler (`src/features/auth-token/webview.js`) forwards refreshes to the venue:

```js
// src/webview/core.js, in setup()
const loadOptions = trimmedBaseURL
  ? { vg_maphash: venueHash, baseURL: trimmedBaseURL }
  : { vg_maphash: venueHash }
if (typeof authorizationToken === 'string' && authorizationToken !== '') {
  loadOptions.authorizationToken = authorizationToken
}
venue = await visioOne.loadVenue(loadOptions, container)
```

```js
// src/features/auth-token/webview.js
core.register({
  set_authorization_token: ({ token }) => {
    if (!core.venue) {
      console.warn('setAuthorizationToken: no venue loaded yet')
      return
    }
    try {
      core.venue.setAuthorizationToken(token) // later map requests use the new token, no reload
    } catch (error) {
      console.error('setAuthorizationToken failed', error)
    }
  },
})
```

Load errors: `UnauthorizedError` is posted back as its own `unauthorized` message, separate from the generic `error` message used for every other load failure:

```js
// src/webview/core.js
const isUnauthorizedError = (error) =>
  error?.constructor?.name === 'UnauthorizedError' ||
  error?.message === 'This venue needs an Authorization token to be loaded'

// in setup()
} catch (error) {
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
}
```

On the React Native side, `VisioMapView` shows "Authorization token invalid, expired or missing" in its status badge and calls the `onUnauthorized` prop.

## Things to know

- **How the token is sent**: the SDK adds `Authorization: Bearer <token>` to every map request. It only matters with the protected map server as `baseURL` (`https://mapserver-auth.visioglobe.com/`). The standard `https://mapserver.visioglobe.com/` does not check tokens.
- **Protected maps have their own hash**, separate from any public map hash.
- **`UnauthorizedError` can't be checked with `instanceof` here.** The CDN build loaded by this page (`visioone/1.1.0/dist/visioone.js`) only exports `createVisioOne` and `VisioOne`, not the error classes. `error.name` is just `"Error"`, so the sample checks `error.constructor.name === 'UnauthorizedError'`, which the CDN build keeps, and falls back to the SDK's message. With the npm package, use `error instanceof UnauthorizedError`.
- **`UnauthorizedError` only comes from an HTTP 403.** `loadVenue` rejects with `UnauthorizedError` ("This venue needs an Authorization token to be loaded") only when `descriptor.json` comes back 403. For example, on the protected server, a request with no token at all gets a 403. Any other failure comes back as a generic `Error('Cannot load the venue')`, with the real cause only written to the console (`VisioOne error: …`). This page captures that console message and reports it. In this demo's test with the placeholders, the server answered **500** to the made-up Bearer token. The SDK therefore reported "The map hash 'YOUR_PROTECTED_MAP_HASH' was not found." through the generic error, not `UnauthorizedError`. So a bad token will not always surface as `UnauthorizedError`: treat any load failure on a protected map as "maybe get a new token".
- **Tokens are short-lived**: the protected server accepts a lifetime of at most 1 hour. Requests made after the token expires are rejected. Call `venue.setAuthorizationToken(freshToken)` before it expires. The new token applies to every later request, with no reload. Refreshing in time is your app's job.
- **CORS / page origin**: the protected server checks each request's `Origin` against a list of allowed origins that Visioglobe sets up for your account. The `Authorization` header also triggers a CORS preflight. If your origin is not on the list, the request fails at the network level (`TypeError`), and you only get the generic "Cannot load the venue" error, never `UnauthorizedError`. In this repo the page is loaded with `source={{ html, baseUrl: 'https://cdn.visioglobe.com/' }}`, so its origin is **`https://cdn.visioglobe.com`** (measured as `window.location.origin` on iOS; Android uses the same `baseUrl`). If your app sets a different `baseUrl` or loads the page another way, tell Visioglobe which origin(s) your app actually uses.
- **Never embed the JWT signing secret** in the app or the page. Get tokens from your own backend, which signs them with the secret and claims Visioglobe gives you.

## Learn more

- [`custom-base-url`](./custom-base-url.md): the other feature that changes `LoadOptions.baseURL`.
