import { StringKey } from '../i18n/strings';

export type FeatureSlug =
  | 'reset-view'
  | 'occupancy-simulated'
  | 'goto-poi'
  | 'compute-navigation'
  | 'poi-click';

export interface FeatureDefinition {
  slug: FeatureSlug;
  titleKey: StringKey;
  descriptionKey: StringKey;
}

export const featureRegistry: FeatureDefinition[] = [
  {
    slug: 'reset-view',
    titleKey: 'resetView.title',
    descriptionKey: 'resetView.description',
  },
  {
    slug: 'occupancy-simulated',
    titleKey: 'occupancySimulated.title',
    descriptionKey: 'occupancySimulated.description',
  },
  {
    slug: 'goto-poi',
    titleKey: 'gotoPoi.title',
    descriptionKey: 'gotoPoi.description',
  },
  {
    slug: 'compute-navigation',
    titleKey: 'computeNavigation.title',
    descriptionKey: 'computeNavigation.description',
  },
  {
    slug: 'poi-click',
    titleKey: 'poiClick.title',
    descriptionKey: 'poiClick.description',
  },
];
