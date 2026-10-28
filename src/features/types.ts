import { SheetProps } from '../components/BottomSheet';

// Props of a feature's panel component (see shell/FeatureMap.tsx). It is rendered for
// the whole life of the feature screen, outside the bottom sheet, and renders the sheet
// itself, so the state it owns survives the sheet being closed and reopened; leaving
// the screen unmounts it. It reaches the map through useMapBridge / useMapEvent and its
// feature's bridge.ts.
export interface PanelProps {
  sheet: SheetProps;
  // Opens the sheet, for a feature without a FAB (poi-click opens it on a map tap).
  openSheet: () => void;
}
