import Proxy from "./proxy";

abstract class BaseProvider extends Proxy {
  /**
   * The main URL of the provider
   */
  protected abstract readonly baseUrl: string;
}

export default BaseProvider;
