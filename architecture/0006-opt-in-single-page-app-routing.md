# 6. Single page routing

Date: 2020-12-14

## Status

Proposed

## Context

### Glossary

* SPA = single page app. A web application where the URL path changes while navigating the app without the webpage loading again using HTML5 history API (and often React Router or similar frontend package)

### Major points

* We currently support static hosting of TerriaMap html, css & js for simple maps (apart from a warning message)
* SPA routing is used on sites which we have pre-rendering of catalog routes
* SPA routing can be used on sites that don't have pre-rendering

## Decisions

SPA routing should be opt-in and existing static hosting solutions should continue to work with new releases of TerriaMap and terriajs

On sites that don't have SPA routing enabled

Thus routing shouldn't be the 

