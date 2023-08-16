import { BaseProvider } from ".";
declare abstract class BaseParser extends BaseProvider {
    abstract search(query: string, ...args: any[]): Promise<unknown>;
}
export default BaseParser;
