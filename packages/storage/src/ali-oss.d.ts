declare module "ali-oss" {
  type ClientOptions = {
    region?: string;
    bucket?: string;
    endpoint?: string;
    accessKeyId?: string;
    accessKeySecret?: string;
    secure?: boolean;
  };

  type PutOptions = { headers?: Record<string, string> };
  type HeadResult = { res: { headers: Record<string, string | number | undefined> } };
  type GetResult = { content: Buffer | ArrayBuffer | Uint8Array | string };

  export default class OSS {
    constructor(options: ClientOptions);
    put(name: string, file: string | Buffer | Uint8Array, options?: PutOptions): Promise<unknown>;
    get(name: string): Promise<GetResult>;
    delete(name: string): Promise<unknown>;
    head(name: string): Promise<HeadResult>;
    signatureUrl(name: string, options?: { expires?: number; method?: string }): string;
  }
}
