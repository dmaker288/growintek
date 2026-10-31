import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
export const s3Configured = () =>
  [
    "S3_ENDPOINT",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET",
  ].every((k) => Boolean(process.env[k]));
let saved;
function storage() {
  const endpoint = new URL(process.env.S3_ENDPOINT);
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password)
    throw new Error(
      "S3 storage requires an HTTPS endpoint without credentials in its URL.",
    );
  const fingerprint = [
    process.env.S3_ENDPOINT,
    process.env.S3_ACCESS_KEY_ID,
    process.env.S3_SECRET_ACCESS_KEY,
    process.env.S3_REGION,
  ].join("|");
  if (!saved || saved.fingerprint !== fingerprint)
    saved = {
      fingerprint,
      client: new S3Client({
        endpoint: endpoint.origin,
        region: process.env.S3_REGION || "auto",
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        maxAttempts: 2,
      }),
    };
  return saved.client;
}
export async function putS3Image(filename, buffer, client = storage()) {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: "growintek/" + filename,
        Body: buffer,
        ContentType: "image/webp",
        CacheControl: "public,max-age=31536000,immutable",
      }),
    );
  } catch {
    throw Object.assign(
      new Error(
        "Image storage rejected the upload. Check the bucket and write permissions.",
      ),
      { status: 502 },
    );
  }
}
export async function listS3Images(client = storage()) {
  try {
    const r = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: "growintek/media-",
        MaxKeys: 1000,
      }),
    );
    return (r.Contents || [])
      .filter((x) => /^growintek\/media-[a-f0-9-]+\.webp$/.test(x.Key))
      .sort((a, b) => Number(b.LastModified) - Number(a.LastModified))
      .map((x) => "/images/" + x.Key.split("/").pop());
  } catch {
    throw Object.assign(
      new Error("Unable to list images. Check storage read permissions."),
      { status: 502 },
    );
  }
}
export async function getS3Image(filename, client = storage()) {
  try {
    const r = await client.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: "growintek/" + filename,
      }),
    );
    return Buffer.from(await r.Body.transformToByteArray());
  } catch (e) {
    if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404)
      return null;
    throw Object.assign(
      new Error("Image storage is temporarily unavailable."),
      { status: 502 },
    );
  }
}
