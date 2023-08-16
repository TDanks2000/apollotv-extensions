import Proxy from "./proxy";
declare abstract class BaseProvider extends Proxy {
    protected abstract readonly baseUrl: string;
}
export default BaseProvider;
