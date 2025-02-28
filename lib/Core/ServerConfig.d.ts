export declare interface ServerConfigOptions {
  version: string;
  proxyAllDomains: boolean;
  allowProxyFor: string[];
  maxConversionSize: number;
  newShareUrlPrefix?: string;
  shareUrlPrefixes: object;
  additionalFeedbackParameters: object[];
}

declare class ServerConfig {
  config: ServerConfigOptions;
  init(
    serverConfigUrl: string | undefined
  ): Promise<ServerConfigOptions | undefined>;
}

export default ServerConfig;
