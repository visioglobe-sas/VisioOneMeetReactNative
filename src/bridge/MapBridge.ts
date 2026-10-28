import * as React from 'react';

// The React Native side of the bridge to the WebView page (src/webview/core.js).
//
// React Native -> page: `send(type, data)` posts a { type, data } message; each feature
// wraps the messages it sends in typed functions in its own bridge.ts.
// Page -> React Native: every { type, data } message the page posts is dispatched to
// the handlers subscribed to that type (useMapEvent), so each feature only listens to
// its own messages. Message types are the same strings on both sides.

export type MapStatus = 'loading' | 'ready' | 'error';

// A command the page received but that threw (e.g. 'start_itinerary' with an unknown
// place ID), reported as 'command_error'. `at` is set on reception so the same error
// twice in a row is still a new value.
export interface CommandError {
  command: string;
  message: string;
  at: number;
}

// WGS84 coordinate, same shape the SDK's positions use.
export interface Position {
  latitude: number;
  longitude: number;
  altitude?: number;
}

type MessageHandler = (data: any) => void;

export interface MapBridge {
  send: (type: string, data?: object) => void;
  status: MapStatus;
  commandError: CommandError | null;
  subscribe: (type: string, handler: MessageHandler) => () => void;
}

export const MapBridgeContext = React.createContext<MapBridge | null>(null);

// The bridge of the map this component is rendered in (inside VisioMapView).
export const useMapBridge = (): MapBridge => {
  const bridge = React.useContext(MapBridgeContext);
  if (!bridge) {
    throw new Error('useMapBridge must be used inside VisioMapView');
  }
  return bridge;
};

// Calls `handler(data)` for every page message of this type, for as long as the
// calling component is mounted. The latest `handler` is always the one called.
export const useMapEvent = <T = any>(type: string, handler: (data: T) => void) => {
  const { subscribe } = useMapBridge();
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;
  React.useEffect(() => subscribe(type, (data) => handlerRef.current(data)), [subscribe, type]);
};

// The 'command_error' answering the last command of this type sent at or after
// `sentAt` (a Date.now() taken when sending), or null.
export const useCommandError = (command: string, sentAt: number): string | null => {
  const { commandError } = useMapBridge();
  return commandError && commandError.command === command && commandError.at >= sentAt
    ? commandError.message
    : null;
};
