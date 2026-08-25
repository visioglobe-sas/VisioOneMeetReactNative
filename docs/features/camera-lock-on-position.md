# Verrouillage caméra sur la position

## Description

Bascule "recentrer sur moi", façon appli GPS : verrouille le focus de la caméra sur la position actuellement suivie par la SDK, via `view.lockCameraPositionOnTracking` (propriété booléenne de la classe `View`, SDK `visioone` — voir `View.ts` dans le repo `visioone`). Ce n'est pas une méthode ni un événement ponctuel : tant que la propriété est à `true`, la caméra suit chaque nouvelle position injectée ; la repasser à `false` rend le contrôle de la caméra à l'utilisateur sans toucher au suivi lui-même.

Cette feature n'a d'effet visible que s'il y a une position suivie qui bouge : elle réutilise donc le mécanisme de [position simulée](./simulated-position.md) (deux POI Origin/Destination, aller-retour interpolé par un `setInterval` côté React Native) pour avoir quelque chose à verrouiller. La SDK a aussi une propriété sœur, `view.lockCameraOrientationOnTracking`, pour verrouiller l'**orientation** de la caméra (nécessite un flux d'orientation de l'appareil) — volontairement **hors scope** ici, seul le verrouillage de position est implémenté.

## Step by step

1. **Nouveau message natif → WebView** : `set_camera_lock_on_position`, payload `{ locked: boolean }`, sur le même patron que `update_occupancy`/`inject_tracked_position`. Ajouté dans `useVisioMap.ts` :
   ```ts
   const setCameraLockOnPosition = (locked: boolean) => {
     sendMessage({ type: 'set_camera_lock_on_position', data: { locked } });
   };
   ```
   Handler côté WebView (`visioOneHtml.ts`/`visioOne.html`), volontairement "bête" — aucune garde nécessaire (voir "Points d'attention") :
   ```js
   const setCameraLockOnPosition = (locked) => {
     if (view) {
       view.lockCameraPositionOnTracking = locked
     }
   }
   ```
2. **UI** : plutôt que dupliquer tout le mécanisme de suivi (résolution des deux POI ID, timer d'interpolation, bouton Start/Stop, stepper de rayon), la feature réutilise `SimulatedPositionOverlay.tsx` via une nouvelle prop optionnelle `setCameraLockOnPosition`. Quand cette prop est fournie, un `Switch` "Recenter camera on position" apparaît sous le bouton Start/Stop ; quand elle est absente (cas de la feature `simulated-position` seule), le composant se comporte exactement comme avant. Le bouton bascule est **désactivé tant que le suivi n'est pas démarré** (`disabled={!running}`) — verrouiller la caméra sur rien n'a pas de sens.
3. **Réinitialisation systématique à "off"** : le bascule ne doit jamais rester activé d'une simulation à l'autre. Il repasse à `false` (état local **et** message envoyé) dans trois cas :
   - le bouton **Stop** est pressé,
   - une erreur **"POI not found"** survient à la résolution,
   - l'écran est **quitté** (démontage du composant).
   Les deux premiers cas et le démontage sont couverts par le `cleanup` du même `useEffect` qui gère déjà le timer d'interpolation et l'appel à `stopSimulation()` (il tourne à chaque passage de `running` à `false`, y compris au démontage) ; le cas de l'erreur de résolution est couvert séparément dans l'effet qui surveille `awaitingResolution`, avant même que `running` ne soit jamais passé à `true`.
4. **Menu** : entrée `camera-lock-on-position` ajoutée dans `src/features/registry.ts`, clés `cameraLockOnPosition.title`/`cameraLockOnPosition.description` (EN/FR) dans `src/i18n/strings.ts`. `FeatureScreen.tsx` rend le même `SimulatedPositionOverlay`, cette fois avec `setCameraLockOnPosition={bridge.setCameraLockOnPosition}` passé en plus.

## Points d'attention

- **`lockCameraPositionOnTracking` n'a d'effet visible qu'une fois `view.allowTracking = true`** — ce qui est déjà le cas dès que la simulation de position tourne (voir `injectTrackedPosition` dans `simulated-position.md`). L'activer alors que `allowTracking` est encore `false` est un **no-op silencieux** d'après la doc de la SDK elle-même : contrairement à `injectTrackedPosition`, qui lève une exception dans ce cas, aucune garde n'est donc nécessaire côté handler WebView.
- **`lockCameraOrientationOnTracking` (verrouillage d'orientation) est hors scope** de cette feature — elle nécessiterait un vrai flux de capteur d'orientation de l'appareil, qu'aucun de ces repos de démo ne fournit actuellement.
- **La SDK ne réinitialise pas elle-même ce booléen** quand `allowTracking` repasse à `false` (Stop) — c'est cette app qui force explicitement le message `set_camera_lock_on_position` à `false` à chaque arrêt, pour que redémarrer une simulation commence toujours déverrouillé (choix délibéré : opt-in à chaque fois, jamais un état qui traîne).
- **Choisir deux POI vraiment éloignés** pour Origin/Destination : le déplacement de caméra n'est visible que si le trajet simulé couvre une distance suffisante — deux places de parking adjacentes ne donneront quasiment aucun mouvement de caméra perceptible.
- **`visioOneHtml.ts` et `visioOne.html` doivent rester identiques** (à l'échappement de template-literal près) — les deux ont été édités dans ce commit pour le nouveau type de message `set_camera_lock_on_position`.

## Pour aller plus loin

- `docs/features/simulated-position.md` de ce repo pour le détail du mécanisme de suivi (résolution des POI, timer d'interpolation côté natif) réutilisé ici.
- Version "verrouillage d'orientation" : voir le [`ROADMAP.md`](https://github.com/visioglobe-sas/VisioOneHub) du hub — `lockCameraOrientationOnTracking` nécessiterait un vrai flux d'orientation de l'appareil, hors scope tant qu'aucune source réelle n'est disponible dans ces repos de démo.
