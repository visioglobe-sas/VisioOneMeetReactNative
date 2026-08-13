import { StringKey } from '../i18n/strings';

export type FeatureSlug = 'reset-view' | 'occupancy-simulated';

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
];
