import Proxy from "./proxy";

abstract class BaseProvider extends Proxy {
  protected abstract readonly baseUrl: string;
}

export default BaseProvider;
