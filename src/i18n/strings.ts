export const strings = {
  en: {
    'resetView.title': 'Reset view',
    'resetView.description': "Return the camera to the venue's default view.",
    'occupancySimulated.title': 'Simulated occupancy',
    'occupancySimulated.description': "Toggle a place's occupancy color with simulated data.",
  },
  fr: {
    'resetView.title': 'Réinitialiser la vue',
    'resetView.description': 'Recentre la caméra sur la vue par défaut du lieu.',
    'occupancySimulated.title': 'Occupation simulée',
    'occupancySimulated.description':
      "Bascule la couleur d'occupation d'un lieu avec des données simulées.",
  },
};

export type Locale = keyof typeof strings;
export type StringKey = keyof (typeof strings)['en'];
