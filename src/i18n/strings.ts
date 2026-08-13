export const strings = {
  en: {
    'resetView.title': 'Reset view',
    'resetView.description': "Return the camera to the venue's default view.",
    'occupancySimulated.title': 'Simulated occupancy',
    'occupancySimulated.description': "Toggle a place's occupancy color with simulated data.",
    'gotoPoi.title': 'Go to place',
    'gotoPoi.description': 'Center the camera on a place by its ID.',
    'computeNavigation.title': 'Itinerary',
    'computeNavigation.description': 'Compute and display a route between two places.',
  },
  fr: {
    'resetView.title': 'Réinitialiser la vue',
    'resetView.description': 'Recentre la caméra sur la vue par défaut du lieu.',
    'occupancySimulated.title': 'Occupation simulée',
    'occupancySimulated.description':
      "Bascule la couleur d'occupation d'un lieu avec des données simulées.",
    'gotoPoi.title': 'Aller à un lieu',
    'gotoPoi.description': 'Centre la caméra sur un lieu à partir de son identifiant.',
    'computeNavigation.title': 'Itinéraire',
    'computeNavigation.description': 'Calcule et affiche un itinéraire entre deux lieux.',
  },
};

export type Locale = keyof typeof strings;
export type StringKey = keyof (typeof strings)['en'];
