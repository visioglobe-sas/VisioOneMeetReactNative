import { SheetProps } from '../components/BottomSheet';
import {
  AddLocaleResult,
  CameraCarouselStatus,
  CategoryOption,
  CommandError,
  CustomDataLookupResult,
  CustomDataRefreshOutcome,
  DynamicPoiCreateResult,
  GeofenceZone,
  HtmlMarkerCreateResult,
  HtmlMarkerTap,
  IconMarkerCreateResult,
  LocaleInfo,
  MapStatus,
  PositionSimulationResolution,
  TextLabelCreateResult,
  VenueLayoutInfo,
  VisioMapBridge,
} from '../components/VisioMapView';
import { CameraProjection, ClickedPoi, ExploreMode } from '../screens/useVisioMap';

// Everything VisioMapView reports about the map, handed to the active feature.
export interface FeatureContext {
  bridge: VisioMapBridge;
  status: MapStatus;
  clickedPois: ClickedPoi[];
  venueLayout: VenueLayoutInfo;
  positionSimulation: { resolution: PositionSimulationResolution | null; error: string | null };
  customData: { refresh: CustomDataRefreshOutcome | null; lookup: CustomDataLookupResult | null };
  categories: CategoryOption[];
  dynamicPoiCreateResult: DynamicPoiCreateResult | null;
  locale: { info: LocaleInfo; error: string | null };
  addLocaleResult: AddLocaleResult | null;
  exploreMode: ExploreMode;
  geofencing: { zone: GeofenceZone | null; error: string | null };
  iconMarkerCreateResult: IconMarkerCreateResult | null;
  textLabelCreateResult: TextLabelCreateResult | null;
  htmlMarker: { createResult: HtmlMarkerCreateResult | null; tap: HtmlMarkerTap | null };
  themes: string[];
  cameraLockOnPosition: boolean;
  reportedCameraProjection: CameraProjection | null;
  cameraCarousel: CameraCarouselStatus;
  commandError: CommandError | null;
}

// Props of a feature component. It is rendered for the whole life of the feature
// screen (outside the bottom sheet) and renders the sheet itself, so the state it owns
// survives the sheet being closed and reopened; leaving the screen unmounts it.
export interface FeatureProps {
  ctx: FeatureContext;
  sheet: SheetProps;
}
