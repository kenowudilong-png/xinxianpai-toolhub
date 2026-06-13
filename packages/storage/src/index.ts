import OSS from "ali-oss";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoragePutOptions = { mime?: string };
export type StorageHead = { size: number };
export type SignedStorageUrl = { url: string; expiresAt: string };

export interface StorageDriver {
  put(key: string, body: Buffer | Uint8Array, options?: StoragePutOptions): Promise<{ key: string; size: number }>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  head(key: string): Promise<StorageHead>;
  signGetUrl(key: string, expiresSeconds?: number): Promise<SignedStorageUrl>;
}

export function normalizeObjectKey(key: string) {
  return path.posix.normalize(key.replace(/\\/g, "/")).replace(/^\.\.(\/|$)/, "").replace(/^\/+/, "");
}

export function storageKey(toolId: string, userId: string, relPath: string) {
  return normalizeObjectKey(`${toolId}/${safeStorageId(userId)}/${relPath}`);
}

export function safeStorageId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}

  async put(key: string, body: Buffer | Uint8Array) {
    const normalized = normalizeObjectKey(key);
    const buffer = Buffer.from(body);
    const fullPath = path.join(this.rootDir, normalized);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return { key: normalized, size: buffer.length };
  }

  async get(key: string) {
    return readFile(path.join(this.rootDir, normalizeObjectKey(key)));
  }

  async delete(key: string) {
    await rm(path.join(this.rootDir, normalizeObjectKey(key)), { force: true });
  }

  async exists(key: string) {
    try {
      await this.head(key);
      return true;
    } catch {
      return false;
    }
  }

  async head(key: string) {
    const info = await stat(path.join(this.rootDir, normalizeObjectKey(key)));
    return { size: info.size };
  }

  async signGetUrl(key: string, expiresSeconds = 600) {
    return {
      url: `/api/me/files/raw/${encodeURIComponent(normalizeObjectKey(key))}`,
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
    };
  }
}

export type OssStorageDriverOptions = {
  region: string;
  bucket: string;
  endpointInternal: string;
  endpointPublic: string;
  accessKeyId: string;
  accessKeySecret: string;
  secure?: boolean;
};

export class OssStorageDriver implements StorageDriver {
  private readonly internalClient: OSS;
  private readonly publicClient: OSS;

  constructor(options: OssStorageDriverOptions) {
    const base = {
      region: options.region,
      bucket: options.bucket,
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      secure: options.secure ?? true,
    };
    this.internalClient = new OSS({ ...base, endpoint: options.endpointInternal });
    this.publicClient = new OSS({ ...base, endpoint: options.endpointPublic });
  }

  async put(key: string, body: Buffer | Uint8Array, options?: StoragePutOptions) {
    const normalized = normalizeObjectKey(key);
    const buffer = Buffer.from(body);
    await this.internalClient.put(normalized, buffer, options?.mime ? { headers: { "Content-Type": options.mime } } : undefined);
    return { key: normalized, size: buffer.length };
  }

  async get(key: string) {
    const result = await this.internalClient.get(normalizeObjectKey(key));
    return Buffer.isBuffer(result.content) ? result.content : Buffer.from(result.content as ArrayBuffer);
  }

  async delete(key: string) {
    await this.internalClient.delete(normalizeObjectKey(key));
  }

  async exists(key: string) {
    try {
      await this.head(key);
      return true;
    } catch {
      return false;
    }
  }

  async head(key: string) {
    const result = await this.internalClient.head(normalizeObjectKey(key));
    return { size: Number(result.res.headers["content-length"] || 0) };
  }

  async signGetUrl(key: string, expiresSeconds = 600) {
    return {
      url: this.publicClient.signatureUrl(normalizeObjectKey(key), { expires: expiresSeconds, method: "GET" }),
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
    };
  }
}

export function createStorageDriverFromEnv(env: NodeJS.ProcessEnv, localRootDir: string) {
  if (env.STORAGE_DRIVER !== "oss") return new LocalStorageDriver(localRootDir);

  const required = [
    "OSS_REGION",
    "OSS_BUCKET",
    "OSS_ENDPOINT_INTERNAL",
    "OSS_ENDPOINT_PUBLIC",
    "OSS_ACCESS_KEY_ID",
    "OSS_ACCESS_KEY_SECRET",
  ] as const;
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing OSS env: ${missing.join(", ")}`);

  return new OssStorageDriver({
    region: env.OSS_REGION!,
    bucket: env.OSS_BUCKET!,
    endpointInternal: env.OSS_ENDPOINT_INTERNAL!,
    endpointPublic: env.OSS_ENDPOINT_PUBLIC!,
    accessKeyId: env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET!,
  });
}
