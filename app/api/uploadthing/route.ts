import { createRouteHandler, createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const fileRouter = {
  teamImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl ?? file.url };
  }),
  refereeImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl ?? file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;

export const { GET, POST } = createRouteHandler({
  router: fileRouter,
});
