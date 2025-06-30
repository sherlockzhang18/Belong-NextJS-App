import type { NextApiRequest, NextApiResponse } from "next"
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

const auth = async (req: NextApiRequest, res: NextApiResponse) => {
    return { id: "fake-user-id" }
}

export const ourFileRouter = {
    imageUploader: f(
        {
            image: {
                maxFileSize: "4MB",
                maxFileCount: 1,
            },
        }
    )
        .middleware(async ({ req, res }) => {
            const user = await auth(req, res)
            if (!user) throw new UploadThingError("Unauthorized")
            return { userId: user.id }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("✅ upload complete for user:", metadata.userId)
            console.log("▶️ file URL:", file.ufsUrl)
            return { uploadedBy: metadata.userId }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
