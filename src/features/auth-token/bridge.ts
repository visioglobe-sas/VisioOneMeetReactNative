import { useMapBridge } from '../../bridge/MapBridge';

export const useAuthTokenBridge = () => {
  const { send, status } = useMapBridge();
  return {
    ready: status === 'ready',
    // Hands a fresh token to the already-loaded venue (venue.setAuthorizationToken in
    // the page), used for every later map request -- call it before the current token
    // expires.
    setAuthorizationToken: (token: string) => send('set_authorization_token', { token }),
  };
};
