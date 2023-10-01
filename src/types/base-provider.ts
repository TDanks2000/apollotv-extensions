import Proxy from "./proxy";
import { MetaData } from "./types";

abstract class BaseProvider extends Proxy {
  protected abstract readonly baseUrl: string;
  public abstract readonly metaData: MetaData;
}

export default BaseProvider;
