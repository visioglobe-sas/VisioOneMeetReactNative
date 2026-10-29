import * as React from 'react';

import { useMapBridge, useMapEvent } from '../../bridge/MapBridge';

// venue.categories mapped down to an { id, label } pair each: id is the raw internal
// identifier used for highlighting, label is the human-readable name resolved via
// venue.translator.translateCategory() for display only.
export interface CategoryOption {
  id: string;
  label: string;
}

export const useCategoryHighlightBridge = () => {
  const { send } = useMapBridge();
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);

  // Asks for venue.categories once the venue is loaded.
  useMapEvent('ready', () => send('get_categories'));
  useMapEvent('categories_result', (data) => setCategories(data?.categories ?? []));

  return {
    categories,
    // Recolors every POI carrying this category id. Reverting any previously
    // highlighted category first (only one at a time) happens on the page side.
    highlightCategory: (categoryId: string) => send('highlight_category', { categoryId }),
    // Reverts whichever category is currently highlighted, if any.
    clearCategoryHighlight: () => send('clear_category_highlight'),
  };
};
