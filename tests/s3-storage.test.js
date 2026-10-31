import test from "node:test";
import assert from "node:assert/strict";
import { putS3Image, listS3Images, getS3Image } from "../server/s3-storage.js";
test("S3 images use a scoped prefix, image content type and exact byte roundtrip", async () => {
  const name = "media-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp",
    bytes = Buffer.from("image");
  let stored;
  const client = {
    async send(command) {
      const d = command.input;
      if (command.constructor.name === "PutObjectCommand") {
        assert.equal(d.Key, "growintek/" + name);
        assert.equal(d.ContentType, "image/webp");
        stored = d.Body;
        return {};
      }
      if (command.constructor.name === "GetObjectCommand")
        return { Body: { transformToByteArray: async () => stored } };
      return {
        Contents: [
          { Key: "growintek/" + name },
          { Key: "outside/private.json" },
        ],
      };
    },
  };
  await putS3Image(name, bytes, client);
  assert.deepEqual(await getS3Image(name, client), bytes);
  assert.deepEqual(await listS3Images(client), ["/images/" + name]);
  assert.equal(
    await getS3Image(name, {
      send: async () => {
        throw { name: "NoSuchKey" };
      },
    }),
    null,
  );
  await assert.rejects(
    () =>
      putS3Image(name, bytes, {
        send: async () => {
          throw new Error("secret key provider error");
        },
      }),
    (e) => e.status === 502 && !e.message.includes("secret"),
  );
});
