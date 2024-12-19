import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Resource from "terriajs-cesium/Source/Core/Resource";

interface Options extends Resource.ConstructorOptions {
  responseType?: string;
  headers?: any;
  overrideMimeType?: string;
  method?: "GET" | "POST" | "PUT";
  data?: any;
}

export default function loadWithXhr(options: Options): Promise<any> {
  // Take advantage that most parameters are the same
  const resource = new Resource(options);

  // @ts-expect-error Calling "private" method without type declaration.
  return resource._makeRequest({
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    method: defaultValue(options.method, "GET"),
    data: options.data
  });
}

Object.defineProperties(loadWithXhr, {
  load: {
    get: function () {
      // @ts-expect-error Calling "private" method without type declaration.
      return Resource._Implementations.loadWithXhr;
    },
    set: function (value) {
      // @ts-expect-error Calling "private" method without type declaration.
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function () {
      // @ts-expect-error Calling "private" method without type declaration.
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});
