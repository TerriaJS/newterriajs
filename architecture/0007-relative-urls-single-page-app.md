# 7. Absolute & relative URLs when using single page app routing

Date: 2020-12-14

## Status

Proposed

## Context

### Glossary

* SPA = single page app. A web application where the URL path changes while navigating the app without the webpage loading again using HTML5 history API (and often React Router or similar frontend package)
* Base tag `<base>` = an HTML 5 element to specify a base URL for all relative URLs https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base

### Major points

* We support Terria being hosted at a non-root path (e.g. nationalmap.gov.au/renewables/, or ci.terria.io/next/)
* When requests to `terriajs-server` routes (either static files or `serverconfig`, `proxy` etc.) are made from SPA routes these requests can be made to the wrong URL. E.g. a request to `serverconfig/` from `https://map.example.com/catalog/` will go to `https://map.example.com/catalog/serverconfig/` when the actual route should be `https://map.example.com/serverconfig/`
* `terriajs@mobx-tjs-new-routing-v2` matched with `TerriaMap@ uses:
  * a `<base>` tag (rendered in `index.html` from `index.ejs` using `baseHref` from `devserverconfig.json`)
    * This rendering is another decision we should discuss and possibly reconsider
  * Absolute urls for calls to `terriajs-server`. E.g `/serverconfig/`, `/init/simple.json`

### Request situations

Different hosting:
* Hosting a TerriaMap at a root path. E.g. https://nationalmap.gov.au/
* Hosting a TerriaMap at a non-root path. E.g. https://nationalmap.gov.au/renewables/

Different SPA paths:
* In a TerriaMap without SPA routing, or using SPA routing but at the root of the TerriaMap
* Inside an SPA route (e.g. https://map.drought.gov.au/catalog/)

Add situations for NSWDT, QLDDT & saas. 

## Decisions

We should use a `<base>` tag and use relative URLs for every request to `terriajs-server`.

E.g. `serverconfig/`, `init/catalog.json`, etc.


