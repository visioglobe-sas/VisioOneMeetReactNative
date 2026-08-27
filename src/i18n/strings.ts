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
    'poiClick.title': 'Tap a place',
    'poiClick.description': "Show a tapped place's info in a panel.",
    'floorSelector.title': 'Floor selector',
    'floorSelector.description': 'Switch floor or building from a list driven by the app.',
    'uiPartVisibility.title': 'UI visibility',
    'uiPartVisibility.description': "Show or hide individual parts of the map's default UI.",
    'uiPartVisibility.floorSelector': 'Floor selector',
    'uiPartVisibility.navigation': 'Navigation',
    'uiPartVisibility.poiDetails': 'POI details',
    'uiPartVisibility.search': 'Search',
    'uiPartVisibility.userTracking': 'User tracking',
    'nativeUiReplacement.title': 'Native UI replacement',
    'nativeUiReplacement.description':
      "Replace the SDK's own floor selector with the app's native one, entirely.",
    'nativeUiReplacement.toggleLabel': "Show SDK's own floor selector",
    'nativeUiReplacement.hint':
      "Off by default: the SDK's own floor-selector widget is hidden and this list is the only way to change floor. Switch it on to compare both, live.",
    'simulatedPosition.title': 'Simulated position',
    'simulatedPosition.description':
      'Animate a simulated position with an accuracy circle between two POIs.',
    'cameraLockOnPosition.title': 'Camera lock on position',
    'cameraLockOnPosition.description':
      'Recenter and lock the camera onto a simulated tracked position, like a "recenter on me" toggle.',
    'clickableSurface.title': 'Clickable surface',
    'clickableSurface.description':
      "Make a place's surface interactive, letting the SDK swap its color on hover/tap.",
    'customData.title': 'Custom data',
    'customData.description':
      'Read custom business data (price, hours, reference) attached to a POI in VisioMapEditor.',
    'categoryHighlight.title': 'Category highlight',
    'categoryHighlight.description':
      'Highlight every place belonging to a chosen category, e.g. all restaurants or all shops.',
    'dynamicPoiCrud.title': 'Dynamic POI',
    'dynamicPoiCrud.description':
      'Create, edit and remove a place at runtime, without republishing the map.',
    'runtimeLocale.title': 'Runtime language',
    'runtimeLocale.description':
      "Switch the map's displayed language live, without reloading or republishing it.",
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
    'poiClick.title': 'Taper un lieu',
    'poiClick.description': "Affiche les infos d'un lieu tapé dans un panneau.",
    'floorSelector.title': "Sélection d'étage",
    'floorSelector.description': "Change d'étage ou de bâtiment depuis une liste pilotée par l'app.",
    'uiPartVisibility.title': "Visibilité de l'UI",
    'uiPartVisibility.description':
      "Afficher ou masquer individuellement les parties de l'UI par défaut de la carte.",
    'uiPartVisibility.floorSelector': "Sélecteur d'étage",
    'uiPartVisibility.navigation': 'Navigation',
    'uiPartVisibility.poiDetails': 'Détails du lieu',
    'uiPartVisibility.search': 'Recherche',
    'uiPartVisibility.userTracking': 'Suivi utilisateur',
    'nativeUiReplacement.title': "Remplacement d'UI native",
    'nativeUiReplacement.description':
      "Remplace entièrement le sélecteur d'étage du SDK par celui, natif, de l'app.",
    'nativeUiReplacement.toggleLabel': "Afficher le sélecteur d'étage natif du SDK",
    'nativeUiReplacement.hint':
      "Désactivé par défaut : le widget natif du SDK est masqué et cette liste est le seul moyen de changer d'étage. Activez-le pour comparer les deux, en direct.",
    'simulatedPosition.title': 'Position simulée',
    'simulatedPosition.description':
      'Anime une position simulée avec un cercle de précision entre deux POI.',
    'cameraLockOnPosition.title': 'Verrouillage caméra sur la position',
    'cameraLockOnPosition.description':
      'Recentre et verrouille la caméra sur une position simulée suivie, comme un bouton "recentrer sur moi".',
    'clickableSurface.title': 'Surface cliquable',
    'clickableSurface.description':
      "Rend la surface d'un lieu interactive, en laissant la SDK changer sa couleur au survol/tap.",
    'customData.title': 'Données personnalisées',
    'customData.description':
      "Lire des données métier (prix, horaires, référence) attachées à un POI dans VisioMapEditor.",
    'categoryHighlight.title': 'Surbrillance par catégorie',
    'categoryHighlight.description':
      'Met en surbrillance tous les lieux appartenant à une catégorie choisie, ex. tous les restaurants ou toutes les boutiques.',
    'dynamicPoiCrud.title': 'POI dynamique',
    'dynamicPoiCrud.description':
      'Crée, modifie et supprime un lieu à la volée, sans republier la carte.',
    'runtimeLocale.title': 'Langue à la volée',
    'runtimeLocale.description':
      "Change la langue affichée sur la carte en direct, sans recharger ni republier.",
  },
};

export type Locale = keyof typeof strings;
export type StringKey = keyof (typeof strings)['en'];
