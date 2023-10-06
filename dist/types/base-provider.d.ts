import Proxy from "./proxy";
import { MetaData } from "./types";
declare abstract class BaseProvider extends Proxy {
    protected abstract readonly baseUrl: string;
    abstract readonly metaData: MetaData;
}
export default BaseProvider;
