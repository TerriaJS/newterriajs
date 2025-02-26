import defined from "terriajs-cesium/Source/Core/defined";
import URI from "urijs";

/**
 * Rewrites URLs so that they're resolved via the TerriaJS-Server proxy rather than going direct. This is most useful
 * for getting around CORS restrictions on services that don't have CORS set up or when using pre-CORS browsers like IE9.
 * Going via the proxy is also useful if you want to change the caching headers on map requests (for instance many map
 * tile providers set cache headers to no-cache even for maps that rarely change, resulting in a much slower experience
 * particularly on time-series data).
 */
export default class CorsProxy {
  static readonly DEFAULT_BASE_PROXY_PATH = "proxy/";

  /**
   * The base URL of the TerriaJS server proxy, to which requests will be appended. In most cases this is the server's
   * host + '/proxy'.
   */
  baseProxyUrl: string = CorsProxy.DEFAULT_BASE_PROXY_PATH;

  /**
   *  Domains that should be proxied for, as set by config files. Stored as an array of hosts - if a TLD is specified,
   * subdomains will also be proxied.
   */
  proxyDomains: string[] = [];

  /**
   * True if we expect that the proxy will proxy any URL - note that if the server isn't set up to do this, having
   * this set to true will just result in a lot of failed AJAX calls
   */
  isOpenProxy: boolean = false;

  /**
   * Domains that are known to support CORS, as set by config files.
   */
  corsDomains: string[] = [];

  /**
   * Whether the proxy should be used regardless of whether the domain supports CORS or not. This defaults to true
   * on IE<10.
   */
  alwaysUseProxy: boolean = false;

  /**
   * Whether the page that Terria is running on is HTTPS. This is relevant because calling an HTTP domain from HTTPS
   * results in mixed content warnings and going through the proxy is required to get around this.
   */
  pageIsHttps =
    typeof window !== "undefined" &&
    defined(window.location) &&
    defined(window.location.href) &&
    new URI(window.location.href).protocol() === "https";

  /**
   * Initialises values with config previously loaded from server. This is the recommended way to use this object as it ensures
   * the options will be correct for the proxy server it's configured to call, but this can be skipped and the values it
   * initialises set manually if desired.
   *
   * @param serverConfig Configuration options retrieved from a ServerConfig object.
   * @param baseProxyUrl The base URL to proxy with - this will default to 'proxy/'
   * @param proxyDomains Initial value for proxyDomains to which proxyable domains from the server will be appended -
   *      defaults to an empty array.
   * @returns A promise that resolves when initialisation is complete.
   */
  init(
    serverConfig: any,
    baseProxyUrl: string = CorsProxy.DEFAULT_BASE_PROXY_PATH,
    proxyDomains: string[] = []
  ): void {
    if (serverConfig !== null && serverConfig !== undefined) {
      this.isOpenProxy = !!serverConfig.proxyAllDomains;
      // ignore client list of allowed proxies in favour of definitive server list.
      if (Array.isArray(serverConfig.allowProxyFor)) {
        this.proxyDomains = serverConfig.allowProxyFor;
      }
    }
    this.baseProxyUrl = baseProxyUrl;

    if (this.proxyDomains === null || this.proxyDomains.length === 0) {
      this.proxyDomains = proxyDomains;
    }
  }

  /**
   * Determines whether this host is, or is a subdomain of, an item in the provided array.
   *
   * @param host The host to search for
   * @param domains The array of domains to look in
   * @returns The result.
   */
  private hostInDomains(host: string, domains?: string[]) {
    if (domains === null || domains === undefined) {
      return false;
    }

    host = host.toLowerCase();
    for (let i = 0; i < domains.length; i++) {
      if (host.match("(^|\\.)" + domains[i] + "$")) {
        return true;
      }
    }
    return false;
  }

  /**
   * Proxies a URL by appending it to {@link CorsProxy#baseProxyUrl}. Optionally inserts a proxyFlag that will override
   * the cache headers of the response, allowing for caching to be added where it wouldn't otherwise.
   *
   * @param resource the URL to potentially proxy
   * @param proxyFlag the proxy flag to pass - generally this is the length of time that you want to override
   *       the cache headers with. E.g. '2d' for 2 days.
   * @returns The proxied URL
   */
  getURL(resource: string, proxyFlag?: string): string {
    return this.getProxyBaseURL(proxyFlag) + resource;
  }

  getProxyBaseURL(proxyFlag: string | undefined): string {
    const flag = proxyFlag === undefined ? "" : "_" + proxyFlag + "/";
    return this.baseProxyUrl + flag;
  }

  /**
   * Convenience method that combines {@link CorsProxy#shouldUseProxy} and {@link getURL} - if the URL passed needs to
   * be proxied according to the rules/config of the proxy, this will return a proxied URL, otherwise it will return the
   * original URL.
   *
   * {@see CorsProxy#shouldUseProxy}
   * {@see CorsProxy#getURL}
   *
   * @param resource the URL to potentially proxy
   * @param proxyFlag the proxy flag to pass - generally this is the length of time that you want to override
   *       the cache headers with. E.g. '2d' for 2 days.
   * @returns Either the URL passed in or a proxied URL if it should be proxied.
   */
  getURLProxyIfNecessary(resource: string, proxyFlag?: string): string {
    if (this.shouldUseProxy(resource)) {
      return this.getURL(resource, proxyFlag);
    }

    return resource;
  }

  /**
   * Determines if the proxying service should be used to access the given URL, based on our list of
   * domains we're willing to proxy for and hosts that are known to support CORS.
   *
   * @param url The url to examine.
   * @return true if the proxy should be used, false if not.
   */
  shouldUseProxy(url: string): boolean {
    if (!defined(url)) {
      // eg. no url may be passed if all data is embedded
      return false;
    }

    const uri = new URI(url);
    const host = uri.host();

    if (host === "") {
      // do not proxy local files
      return false;
    }

    if (!this.isOpenProxy && !this.hostInDomains(host, this.proxyDomains)) {
      // we're not willing to proxy for this host
      return false;
    }
    if (this.alwaysUseProxy) {
      return true;
    }

    if (this.pageIsHttps && uri.protocol() === "http") {
      // if we're accessing an http resource from an https page, always proxy in order to avoid a mixed content error.
      return true;
    }

    if (this.hostInDomains(host, this.corsDomains)) {
      // we don't need to proxy for this host, because it supports CORS
      return false;
    }

    // we are ok with proxying for this host and we need to
    return true;
  }
}
