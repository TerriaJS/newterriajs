import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Resource from "terriajs-cesium/Source/Core/Resource";

function loadWithXhr(options) {
  // Take advantage that most parameters are the same
  const resource = new Resource(options);

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
      return Resource._Implementations.loadWithXhr;
    },
    set: function (value) {
      Resource._Implementations.loadWithXhr = value;
    }
  },

  defaultLoad: {
    get: function () {
      return Resource._DefaultImplementations.loadWithXhr;
    }
  }
});

export default loadWithXhr;
