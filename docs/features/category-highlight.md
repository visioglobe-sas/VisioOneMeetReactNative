# Category Highlight

## Description

Highlights every place (POI) belonging to a chosen category in one action — e.g. every restaurant, or every shop — by recoloring their surfaces via `venue.updateSurface`. There is no dedicated "highlight by category" method on the SDK; this is built from three primitives:

- `venue.categories: Category[]` — the venue's full category list (`Category = { readonly id: string }`). `id` is a raw internal identifier, not itself human-readable — see "Things to know".
- `poi.categories: Category[]` — the categories attached to a given POI (a POI can carry several).
- `venue.updateSurface(surface, options)` — same call used by [Clickable surface](clickable-surface.md), here used purely to recolor rather than to make interactive.

## SDK usage

```ts
// useVisioMap.ts
const getCategories = () => {
  sendMessage({ type: 'get_categories' });
};

const highlightCategory = (categoryId: string) => {
  sendMessage({ type: 'highlight_category', data: { categoryId } });
};

const clearCategoryHighlight = () => {
  sendMessage({ type: 'clear_category_highlight' });
};
```

```js
// visioOneHtml.ts / visioOne.html (kept in sync by hand)
const getCategories = () => {
  if (!venue) {
    sendToNative({ type: 'categories_result', data: { categories: [] } })
    return
  }
  sendToNative({
    type: 'categories_result',
    data: {
      categories: venue.categories.map((c) => ({
        id: c.id,
        label: venue.translator.translateCategory(c, venue.currentLocale).name || c.id,
      })),
    },
  })
}

let highlightedCategoryId = null

const revertCategoryHighlight = () => {
  if (!venue || !highlightedCategoryId) {
    return
  }
  venue.pois
    .filter((poi) => poi.categories.some((c) => c.id === highlightedCategoryId))
    .forEach((poi) => {
      poi.surfaces.forEach((surface) => {
        venue.updateSurface(surface, { color: 'initial' })
      })
    })
  highlightedCategoryId = null
}

const highlightCategory = (categoryId) => {
  if (!venue) {
    return
  }
  if (highlightedCategoryId === categoryId) {
    revertCategoryHighlight()
    return
  }
  revertCategoryHighlight()
  venue.pois
    .filter((poi) => poi.categories.some((c) => c.id === categoryId))
    .forEach((poi) => {
      poi.surfaces.forEach((surface) => {
        venue.updateSurface(surface, { color: '#FF6B00' })
      })
    })
  highlightedCategoryId = categoryId
}

const clearCategoryHighlight = () => {
  revertCategoryHighlight()
}
```

Getting the category list into React Native needs a request/response round trip, the same idiom [Custom data](custom-data.md) uses: `get_categories` goes in, `categories_result` (`{ data: { categories: { id: string; label: string }[] } }`) comes back once the WebView has an answer. `highlight_category` and `clear_category_highlight` are fire-and-forget one-way messages — no response is needed since they don't return any data, only cause a side effect.

## Things to know

- **Not every POI has surfaces.** `poi.surfaces` is an empty array for point/marker-only POIs, so `venue.updateSurface` is simply never called for them — they don't visually highlight. This is expected, not a bug: a category made up entirely of marker-only POIs (or a POI within a mixed category that happens to have no surface) will show no color change for those entries even though they were correctly matched by `poi.categories.some(...)`.
- **`color: 'initial'` is the correct reset value, not `undefined`.** Per `SurfaceUpdateOptions`'s own doc comment, `'initial'` restores the surface to whatever color the map bundle originally defined. Omitting the `color` key (or passing `undefined`) does not do this — it leaves the surface's color property unchanged from whatever it last was, so a previously-highlighted surface would stay stuck on the highlight color instead of reverting. Always pass the literal string `'initial'` to clear a highlight.
- **Only one category is highlighted at a time by design**, not an SDK constraint. Selecting a new category first reverts the previously-highlighted one's surfaces (`revertCategoryHighlight()`) before applying the new color — nothing in the SDK itself prevents highlighting several categories simultaneously; this demo just doesn't do that.
- **A POI can belong to several categories.** `poi.categories.some((c) => c.id === categoryId)` matches a POI if *any* of its categories match, so a POI tagged both "Food and Beverage" and "Shops" highlights under either selection.
- **`category.id` is a raw internal identifier, not a display name.** On the shared demo map used by every feature in this repo it's a numeric string (`"1"`.."`11`"`) — confirmed live. The human-readable name (`Food and Beverage`, `Shops`, `Toilets`, ...) comes from `venue.translator.translateCategory(category, venue.currentLocale).name`, the same idiom already used for building/floor labels elsewhere in this repo. `id` is still what filtering/highlighting must use; `label` is for display only.

## Learn more

- [Clickable surface](clickable-surface.md) — the same `venue.updateSurface` call, used for interactivity + hover/selection colors instead of a plain highlight.
- [Custom data](custom-data.md) — the sibling feature this one borrows its request/response bridge idiom from.
