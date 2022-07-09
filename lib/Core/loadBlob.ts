import Resource from "terriajs-cesium/Source/Core/Resource";
import URI from "urijs";
import JsonValue from "./Json";
import loadJson from "./loadJson";

const zip = require("terriajs-cesium/Source/ThirdParty/zip").default;

export default function loadBlob(
  urlOrResource: string,
  headers?: any,
  body?: any
): Promise<Blob> {
  if (body !== undefined) {
    return Resource.post({
      url: urlOrResource,
      headers: headers,
      data: JSON.stringify(body),
      responseType: "blob"
    })!;
  } else {
    return Resource.fetchBlob({ url: urlOrResource, headers: headers })!;
  }
}

export function isJson(uri: string) {
  return /(\.geojson)|(\.json)\b/i.test(uri);
}

export function isZip(uri: string) {
  return /(\.zip\b)/i.test(uri);
}

/** Parse zipped blob into JsonValue */
export function parseZipJsonBlob(blob: Blob): Promise<JsonValue> {
  const zWorkerPakoUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/z-worker-pako.js");
  const inflateUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/pako_inflate.min.js");
  const deflateUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/pako_deflate.min.js");

  // zip annoyingly requires the inflateUrl and deflateUrl to be relative to the zWorkerPakoUrl.
  // To do that, we need to go via absolute URLs
  const absoluteBase = new URI(zWorkerPakoUrl)
    .absoluteTo(location.href)
    .toString();
  const relativeInflateUri = new URI(deflateUrl)
    .absoluteTo(location.href)
    .relativeTo(absoluteBase);
  const relativeDeflateUri = new URI(inflateUrl)
    .absoluteTo(location.href)
    .relativeTo(absoluteBase);

  zip.configure({
    workerScripts: {
      deflate: [zWorkerPakoUrl, relativeInflateUri.toString()],
      inflate: [zWorkerPakoUrl, relativeDeflateUri.toString()]
    }
  });

  const reader = new zip.ZipReader(new zip.BlobReader(blob));

  return reader.getEntries().then(function(entries: any) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (isJson(entry.filename)) {
        return entry
          .getData(new zip.Data64URIWriter())
          .then(function(uri: string) {
            return loadJson(uri);
          });
      }
    }
    return undefined;
  });
}
