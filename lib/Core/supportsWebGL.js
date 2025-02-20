import defined from "terriajs-cesium/Source/Core/defined";

let result;

/**
 * Determines if the current browser supports WebGL.
 * @return {Boolean|String} False if WebGL is not supported at all, 'slow' if WebGL is supported
 *                          but it has a major performance caveat (e.g. software rendering), and True
 *                          if WebGL is available without a major performance caveat.
 */
function supportsWebGL() {
  if (defined(result)) {
    return result;
  }

  //Check for webgl support and if not, then fall back to leaflet
  if (!window.WebGLRenderingContext) {
    // Browser has no idea what WebGL is. Suggest they
    // get a new browser by presenting the user with link to
    // http://get.webgl.org
    result = false;
    return result;
  }
  const canvas = document.createElement("canvas");

  const webglOptions = {
    alpha: false,
    stencil: false,
    failIfMajorPerformanceCaveat: true
  };

  let gl =
    canvas.getContext("webgl", webglOptions) ||
    canvas.getContext("experimental-webgl", webglOptions);
  if (!gl) {
    // We couldn't get a WebGL context without a major performance caveat.  Let's see if we can get one at all.
    webglOptions.failIfMajorPerformanceCaveat = false;
    gl =
      canvas.getContext("webgl", webglOptions) ||
      canvas.getContext("experimental-webgl", webglOptions);
    if (!gl) {
      // No WebGL at all.
      result = false;
    } else {
      // We can do WebGL, but only with software rendering (or similar).
      result = "slow";
    }
  } else {
    // WebGL is good to go!
    result = true;
  }

  return result;
}

export default supportsWebGL;
