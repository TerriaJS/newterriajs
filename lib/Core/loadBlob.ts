import Resource from "terriajs-cesium/Source/Core/Resource";
import JsonValue from "./Json";
import loadJson from "./loadJson";
import {
  ZipReader,
  BlobReader as ZipBlobReader,
  Data64URIWriter as ZipData64URIWriter,
  Uint8ArrayWriter as ZipUint8ArrayWriter
} from "@zip.js/zip.js";

interface ZipEntries {
  fileName: string;
  isDirectory: boolean;
  data: Uint8Array;
}

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

/** Get zipjs ZipReader for given Blob */
function getZipReader(blob: Blob): any {
  // const zWorkerPakoUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/z-worker-pako.js");
  // const inflateUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/pako_inflate.min.js");
  // const deflateUrl = require("file-loader!terriajs-cesium/Source/ThirdParty/Workers/pako_deflate.min.js");

  // zip annoyingly requires the inflateUrl and deflateUrl to be relative to the zWorkerPakoUrl.
  // To do that, we need to go via absolute URLs
  // const absoluteBase = new URI(zWorkerPakoUrl)
  //   .absoluteTo(location.href)
  //   .toString();
  // const relativeInflateUri = new URI(deflateUrl)
  //   .absoluteTo(location.href)
  //   .relativeTo(absoluteBase);
  // const relativeDeflateUri = new URI(inflateUrl)
  //   .absoluteTo(location.href)
  //   .relativeTo(absoluteBase);

  // zip.configure({
  //   workerScripts: {
  //     deflate: [zWorkerPakoUrl, relativeInflateUri.toString()],
  //     inflate: [zWorkerPakoUrl, relativeDeflateUri.toString()]
  //   }
  // });

  return new ZipReader(new ZipBlobReader(blob));
}

/** Parse zipped blob into JsonValue */
export function parseZipJsonBlob(blob: Blob): Promise<JsonValue> {
  const reader = getZipReader(blob);

  return reader.getEntries().then(function (entries: any) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (isJson(entry.filename)) {
        return entry.getData(new ZipData64URIWriter()).then(function (
          uri: string
        ) {
          return loadJson(uri);
        });
      }
    }
    return undefined;
  });
}

/** Parse zip Blob and return array of files (as UInt8Array) */
export async function parseZipArrayBuffers(blob: Blob): Promise<ZipEntries[]> {
  const reader = getZipReader(blob);

  const entries = await reader.getEntries();

  return await Promise.all(
    entries.map(async (entry: any) => {
      const data = await entry.getData(new ZipUint8ArrayWriter());
      return {
        fileName: entry.filename,
        isDirectory: entry.directory === true,
        data
      };
    })
  );
}
