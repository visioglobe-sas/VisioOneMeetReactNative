# Protected map (token) — code sample

## Description

Loads a map protected by an authorization token: a short-lived JWT passed to the SDK as `LoadOptions.authorizationToken`, refreshed later with `venue.setAuthorizationToken(freshToken)`, with the SDK's `UnauthorizedError` reported distinctly from other load errors.

**This feature is a code sample only.** This demo has no protected map to load, so every value in the repo is a **fictitious placeholder** you must replace with your own:

| Constant (`src/features/AuthTokenSample.tsx`) | Placeholder value | Replace with |
| --- | --- | --- |
| `PROTECTED_MAP_HASH` | `YOUR_PROTECTED_MAP_HASH` | the hash of your protected map |
| `PROTECTED_MAP_BASE_URL` | `https://mapserver-auth.visioglobe.com/` | keep as is (the protected map server) |
| `AUTHORIZATION_TOKEN` / `fetchAuthorizationToken()` | `YOUR_JWT_FROM_YOUR_BACKEND` | a call to your own backend that issues the JWT |

The app's "Protected map (token)" screen only shows a short text pointing here; it does not render the sample and never tries to load a map with the placeholders.

## SDK usage

### React Native side

`src/features/AuthTokenSample.tsx` exports `ProtectedMapSample`, a ready-to-render component: it gets a token, then mounts the map against the protected server.

```tsx
export const PROTECTED_MAP_HASH = 'YOUR_PROTECTED_MAP_HASH';
export const PROTECTED_MAP_BASE_URL = 'https://mapserver-auth.visioglobe.com/';
// A JWT issued by YOUR OWN backend. Visioglobe provides the signing secret and the
// claims to use; the signing secret must never be embedded in the app.
export const AUTHORIZATION_TOKEN = 'YOUR_JWT_FROM_YOUR_BACKEND';

export const fetchAuthorizationToken = async (): Promise<string> => AUTHORIZATION_TOKEN;

<VisioMapView
  mapHash={PROTECTED_MAP_HASH}
  baseURL={PROTECTED_MAP_BASE_URL}
  authorizationToken={token}
  onUnauthorized={(message) => { /* token invalid, expired or missing */ }}
  renderOverlay={(bridge, status) => (
    <TokenRefresher ready={status === 'ready'} setAuthorizationToken={bridge.setAuthorizationToken} />
  )}
/>
```

The token travels to the WebView page in the same `setup` message as the map hash and base URL, and refreshes go through their own message:

```ts
// useVisioMap.ts
sendMessage({ type: 'setup', data: { hash, baseURL, enableShadows, cameraProjection, authorizationToken } });

const setAuthorizationToken = (token: string) => {
  sendMessage({ type: 'set_authorization_token', data: { token } });
};
```

`TokenRefresher` calls `bridge.setAuthorizationToken(await fetchAuthorizationToken())` on a timer (every 50 minutes) once the venue is ready.

### WebView side

In the WebView page (`src/assets/visioOne.html`), `setup()` adds the token to the load options and `setAuthorizationToken()` forwards refreshes to the venue:

```js
const loadOptions = { vg_maphash: venueHash, baseURL: trimmedBaseURL }
if (typeof authorizationToken === 'string' && authorizationToken !== '') {
  loadOptions.authorizationToken = authorizationToken
}
venue = await visioOne.loadVenue(loadOptions, container)
view = await visioOne.createView(container, venue, viewOptions)

const setAuthorizationToken = (token) => {
  venue.setAuthorizationToken(token) // later map requests use the new token, no reload
}
```

Load errors: `UnauthorizedError` is posted back as its own `unauthorized` message, separate from the generic `error` message used for every other load failure:

```js
const isUnauthorizedError = (error) =>
  error?.constructor?.name === 'UnauthorizedError' ||
  error?.message === 'This venue needs an Authorization token to be loaded'

} catch (error) {
  if (isUnauthorizedError(error)) {
    sendToNative({ type: 'unauthorized', data: error.message })
    return
  }
  sendToNative({ type: 'error', data: /* … */ })
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
