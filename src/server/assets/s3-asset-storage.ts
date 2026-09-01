import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";
import { validateImage, type AssetStorage } from "@/server/assets/asset-storage";

type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

export class S3AssetStorage implements AssetStorage {
  constructor(private readonly config: S3Config) {}

  async storeImage(ownerKey: string, bytes: Uint8Array, mimeType: string) {
    const extension = validateImage(bytes, mimeType);
    const fileName = `${randomUUID()}.${extension}`;
    const storageKey = `uploads/${safeSegment(ownerKey)}/${fileName}`;
    await this.request("PUT", storageKey, bytes, mimeType);
    return {
      fileName,
      storageKey,
      publicUrl: `${this.config.publicBaseUrl.replace(/\/$/, "")}/${storageKey}`,
    };
  }

  async remove(storageKey: string) {
    if (!storageKey.startsWith("uploads/")) return;
    await this.request("DELETE", storageKey, new Uint8Array(), undefined);
  }

  private async request(method: "PUT" | "DELETE", storageKey: string, body: Uint8Array, contentType?: string) {
    const endpoint = new URL(this.config.endpoint);
    if (process.env.NODE_ENV === "production" && endpoint.protocol !== "https:") {
      throw new Error("Production asset storage endpoint must use HTTPS.");
    }
    const canonicalPath = `/${encodeURIComponent(this.config.bucket)}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
    const url = new URL(canonicalPath, endpoint);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = amzDate.slice(0, 8);
    const payloadHash = sha256(body);
    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };
    if (contentType) headers["content-type"] = contentType;
    const signedHeaders = Object.keys(headers).sort().join(";");
    const canonicalHeaders = Object.keys(headers).sort().map((key) => `${key}:${headers[key].trim()}\n`).join("");
    const canonicalRequest = [method, canonicalPath, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${date}/${this.config.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
    const signature = sign(this.config.secretAccessKey, date, this.config.region, stringToSign);
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const requestBody = body.buffer.slice(
      body.byteOffset,
      body.byteOffset + body.byteLength,
    ) as ArrayBuffer;
    const response = await fetch(url, {
      method,
      headers,
      body: method === "PUT" ? requestBody : undefined,
    });
    if (!response.ok) throw new Error(`Asset storage request failed (${response.status}).`);
  }
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}
function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}
function hmac(key: string | Buffer, value: string) {
  return createHmac("sha256", key).update(value).digest();
}
function sign(secret: string, date: string, region: string, stringToSign: string) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  return createHmac("sha256", signingKey).update(stringToSign).digest("hex");
}
