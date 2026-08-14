# Masquage sélectif de l'UI

## Description

Affiche ou masque individuellement chacune des 5 parties de l'UI par défaut de la carte (`floorSelector`, `navigation`, `poiDetails`, `search`, `userTracking`), via `view.setUIPartVisible(uiPart, isVisible)` — une méthode du `view` retourné par `createView()`/le chargement de la venue. Il existe aussi un getter symétrique, `view.isUIPartVisible(uiPart)`, non utilisé ici (voir "Points d'attention").

Contrairement aux autres features de ce catalogue, il n'y a pas de nouvel effet visuel à construire : les 5 widgets existent déjà et sont dessinés par le SDK lui-même. Cette feature démontre uniquement que l'app hôte peut piloter leur visibilité à la volée, par exemple pour composer sa propre UI (masquer la recherche du SDK pour la remplacer par la sienne, cacher `userTracking` tant que la position n'est pas pertinente pour le cas d'usage, etc.).

## Step by step

1. **Pont natif → WebView** (`src/screens/useVisioMap.ts`) : ajouter `setUIPartVisible(uiPart, isVisible)`, qui envoie `{ type: 'set_ui_part_visible', data: { uiPart, isVisible } }` à la WebView, sur le même modèle exact que `updateOccupancy`. `uiPart` est typé `UIPart = 'floorSelector' | 'navigation' | 'poiDetails' | 'search' | 'userTracking'`, calqué sur le type `UIPart` du SDK (`View.ts`).
2. **Côté WebView** (`src/assets/visioOneHtml.ts`/`visioOne.html`) : ajouter le handler
   ```js
   const setUIPartVisible = (uiPart, isVisible) => {
     if (view) {
       view.setUIPartVisible(uiPart, isVisible)
     }
   }
   ```
   et le brancher dans le `switch` de `onMessage` :
   ```js
   case 'set_ui_part_visible':
     setUIPartVisible(evt.data.uiPart, evt.data.isVisible)
     break
   ```
3. **Contrôle utilisateur** (`src/features/UIPartVisibilityOverlay.tsx`, branché dans `FeatureScreen.tsx` sous `slug: 'ui-part-visibility'`) : 5 `Switch` React Native, un par `UIPart`, tous initialisés à `true` (visible) pour refléter l'état par défaut du SDK. Chaque bascule met à jour un state local d'affichage **et** appelle immédiatement `setUIPartVisible(part, isVisible)` — l'effet est visible sur la carte derrière le bottom sheet sans fermer le panneau.
4. **Menu** : entrée ajoutée dans `src/features/registry.ts` (`slug: 'ui-part-visibility'`) avec ses clés `uiPartVisibility.title`/`.description` (EN/FR) dans `src/i18n/strings.ts`, plus une clé de libellé par `UIPart` (`uiPartVisibility.floorSelector`, `.navigation`, `.poiDetails`, `.search`, `.userTracking`) pour que les 5 switchs affichent un nom humain traduit plutôt que la valeur technique du SDK.

## Points d'attention

- **`setUIPartVisible` doit être appelé après le chargement de la vue/venue.** Comme toutes les méthodes de `view`, elle n'existe qu'une fois `createView(...)` résolu — le handler côté WebView vérifie `if (view)` avant d'appeler quoi que ce soit, exactement comme `resetMap`/`goToFloor`. Appeler le bridge avant le message `ready` est un no-op silencieux, pas une erreur : dans cette démo ce n'est pas un risque puisque le panneau n'est accessible qu'une fois l'écran de la feature affiché (donc la carte déjà en cours de chargement), mais un client qui déclencherait ce bridge plus tôt (ex. au montage de l'écran) doit attendre `ready` lui-même.
- **Les 5 valeurs de `uiPart` sont exactes et sensibles à la casse** : `floorSelector`, `navigation`, `poiDetails`, `search`, `userTracking` — aucune autre n'existe (type `UIPart` dans `View.ts` du SDK). Une faute de casse (`floorselector`, `UserTracking`, etc.) n'est pas rejetée avec une erreur explicite par le SDK ; elle échoue silencieusement à changer quoi que ce soit sur l'UI, à surveiller en cas de nouveau libellé côté app qui diverge du nom technique.
- **Masquer `search` ou `navigation` retire le seul moyen natif de déclencher ces flux SDK.** Ce ne sont pas de simples éléments décoratifs : c'est le seul déclencheur intégré pour la recherche ou pour démarrer une navigation depuis l'UI du SDK. Dans cette démo, comme les 5 switchs vivent dans le même bottom sheet, on peut toujours rebasculer un `uiPart` masqué par erreur depuis le même panneau (le FAB reste accessible même UI masquée). Dans une intégration réelle qui masquerait `search`/`navigation` durablement, il faut prévoir son propre point d'entrée applicatif pour ces flux avant de les cacher.
- **Cette feature remplace un comportement figé et non interactif préexistant.** Avant cette feature, `visioOneHtml.ts`/`visioOne.html` définissaient une constante `DEFAULT_OPTIONS` (`{ userTracking: true, navigation: true, poiDetails: false, search: false, floorSelector: true }`) et, juste après `createView(...)`, calculaient `hideKeys` (les clés à `false`) pour appeler `v.setUIPartVisible(key, false)` sur chacune — un masquage fixe décidé au build, jamais exposé à l'app ni à l'utilisateur (statut `🟡` dans `CHECKLIST.md`). Cette logique a été entièrement supprimée : toutes les parties démarrent maintenant visibles (comportement par défaut du SDK, sans aucun appel `setUIPartVisible` au chargement) et ne changent que sur interaction utilisateur via les 5 switchs. Un futur dev qui chercherait `DEFAULT_OPTIONS`/`hideKeys` dans l'historique du repo doit savoir qu'ils ont été retirés intentionnellement, pas oubliés.
- **`visioOneHtml.ts` et `visioOne.html` doivent rester identiques** (à l'échappement de template-literal près) — ce repo les garde synchronisés à la main, il n'y a pas de build qui génère l'un depuis l'autre (voir `docs/features/floor-selector.md` pour le même rappel). Les deux ont été édités dans ce commit.

## Pour aller plus loin

- `docs/features/floor-selector.md` de ce repo : autre feature qui cohabite volontairement avec un widget par défaut du SDK plutôt que de le remplacer (le sélecteur d'étage natif reste affiché par défaut, `floorSelector: true`).
- `docs/features/occupancy-simulated.md` de ce repo pour le même patron de pont `{ type, data }` utilisé comme référence pour `set_ui_part_visible`.
- `docs/SDK_NOTES.md` de ce repo pour les autres gotchas SDK/WebView documentés indépendamment de toute feature.
