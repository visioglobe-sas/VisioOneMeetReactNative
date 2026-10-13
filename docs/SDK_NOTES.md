# Notes techniques — intégration SDK VisioOne en React Native

Ce document rassemble des points d'attention rencontrés en intégrant le SDK VisioOne dans une app React Native via `react-native-webview`, avec le SDK chargé en ESM depuis le CDN Visioglobe (voir [`src/assets/visioOne.html`](../src/assets/visioOne.html)).

## Pourquoi le HTML est chargé "inline" plutôt que via `require()`

Ce projet charge la page hôte du SDK avec :

```tsx
<WebView source={{ html: visioOneHtml, baseUrl: 'https://cdn.visioglobe.com/' }} />
```

plutôt que la manière la plus naturelle :

```tsx
<WebView source={require('../assets/visioOne.html')} />
```

Ce choix n'est pas cosmétique — voici l'investigation qui l'explique.

### Le symptôme

En chargeant `visioOne.html` via `require(...)` en build Debug (Metro connecté), la carte ne s'affichait pas : le SDK renvoyait une erreur générique `"Cannot load the venue"`, sans plus de détail.

### Cause racine

En instrumentant une page de diagnostic (interception `console.warn`/`console.error`, wrapper de `fetch` loggant chaque requête — voir [`src/assets/diagnosticInlineHtml.ts`](../src/assets/diagnosticInlineHtml.ts)), la vraie erreur masquée est apparue :

```
[console.warn] VisioOne error: Error: Hash not found
```

Avec le détail réseau :

```
location.href = http://localhost:8081/.../index.html?platform=ios&hash=b52c3a3b3521fadf7f0e0299fdcc22fb
[fetch] https://mapserver.visioglobe.com/b52c3a3b3521fadf7f0e0299fdcc22fb/descriptor.json -> 404
```

Le SDK a utilisé `b52c3a3b3521fadf7f0e0299fdcc22fb` — **pas** le hash passé dans le code. Cette valeur vient du paramètre `?hash=...` que **Metro** (le bundler React Native) ajoute automatiquement à l'URL de tout asset local chargé via `require()` en mode Debug — un hash de cache interne à Metro, sans aucun rapport avec VisioOne.

Le SDK VisioOne fusionne les paramètres de l'URL de la page dans les options de `loadVenue` (mécanisme interne `mergeVenueOptionsWithDefaultAndURLParameters`). Entre les versions **1.0.3** et **1.0.5**, la priorité de cette fusion s'est inversée :

| Version SDK | Hash réellement utilisé | Résultat |
|---|---|---|
| **1.0.3** | celui passé explicitement dans le code | `descriptor.json` → 200, carte chargée |
| **1.0.5** | celui de l'URL (`?hash=` de Metro) | `descriptor.json` → 404, "Hash not found" |
| **1.0.9** | celui passé explicitement dans le code (option renommée `vg_maphash`) | `descriptor.json` → 200, carte chargée — le `?hash=` de Metro n'est plus lu |

Ce piège n'existe qu'en build **Debug connecté à Metro** : en Release/production, React Native ne sert pas les assets via un serveur avec query string (ils sont copiés directement dans le bundle applicatif), donc la collision n'a pas lieu — vérifié en générant un build Release et en confirmant l'absence de query string sur `location.href`.

### Le contournement retenu dans ce repo

Charger le HTML comme une chaîne (`source={{ html, baseUrl }}`) plutôt que via `require(...)` évite complètement l'URL servie par Metro. Le `baseUrl` est indispensable : sans lui, l'origine du document devient opaque (`null`), ce qui casse le logger interne du SDK (`SDKStatsLogger`, basé sur `localStorage`) avec une `SecurityError: The operation is insecure`.

| Config | `location.origin` | Résultat |
|---|---|---|
| `source={require('./visioOne.html')}` | `http://localhost:8081` (+ `?hash=` Metro) | ❌ le hash de Metro écrase celui du code |
| `source={{ html }}` **sans** `baseUrl` | `null` (origine opaque) | ❌ plus de collision de hash, mais `SecurityError` sur `localStorage` |
| `source={{ html, baseUrl: 'https://cdn.visioglobe.com/' }}` | `https://cdn.visioglobe.com` | ✅ fonctionne, y compris en Debug connecté à Metro |

C'est ce dernier réglage qui est utilisé par défaut dans [`src/components/VisioMapView.tsx`](../src/components/VisioMapView.tsx).

### Depuis le SDK 1.0.9 : collision levée par le renommage en `vg_maphash`

Le SDK 1.0.9 renomme l'option `LoadOptions.hash` en `LoadOptions.vg_maphash` (changement cassant : un `hash` passé à `loadVenue` est désormais ignoré, et le chargement échoue avec `Hash not found`). Le paramètre d'URL lu par `mergeVenueOptionsWithDefaultAndURLParameters` est renommé de la même façon : le SDK ne lit plus que `?vg_maphash=` (et `?baseURL=`), plus `?hash=`.

Conséquence pour ce problème : le `?hash=` ajouté par Metro n'est plus pris en compte par le SDK, la collision décrite ci-dessus n'a donc plus lieu à partir de 1.0.9. Vérifié en navigateur headless avec la page hôte de ce repo servie à une URL `…?platform=ios&hash=b52c3a3b3521fadf7f0e0299fdcc22fb` : le SDK a chargé `descriptor.json` pour le hash passé dans le code (200) et la carte s'est affichée. Le mécanisme de priorité « URL > code » existe toujours, mais sous le nom `vg_maphash` : la même page servie avec `?vg_maphash=<autre hash>` charge bien cet autre hash. Seul un paramètre d'URL nommé `vg_maphash` peut donc encore écraser le hash du code.

Ce repo garde néanmoins le chargement inline (`source={{ html, baseUrl }}`) : il fonctionne quelle que soit la version du SDK, et le retour à `require(...)` n'a pas été re-testé sur device avec Metro.

Ce contournement reste une solution côté application, pas structurelle. Si vous rencontrez ce comportement dans votre propre intégration avec un SDK antérieur à 1.0.9, ce contournement s'applique.

## Autre point corrigé dans cet exemple

La page hôte capture l'erreur réelle du SDK (`console.warn('VisioOne error:', ...)`) mais, dans une première version, ne la remontait pas côté natif — seul un message générique était renvoyé, rendant tout futur diagnostic difficile. `src/assets/visioOne.html` remonte désormais la cause capturée dans son message d'erreur `postMessage`.

## Aller plus loin

Le mode diagnostic (`DIAGNOSTIC_MODE` dans `App.tsx`) charge une page minimale qui logge chaque étape du chargement du SDK (import du module, `fetch`, erreurs) directement dans la WebView et les relaie côté natif — pratique pour isoler un problème de `react-native-webview` d'un problème applicatif ou du SDK lui-même.
