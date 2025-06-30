// pages/api/uploadthing.ts
import { createRouteHandler } from "uploadthing/next-legacy"
import { ourFileRouter } from "../../server/uploadthing"

// Create the handler...
const handler = createRouteHandler({
    router: ourFileRouter,
    // optional: config: { ... }
})

// ...and **default-export** it:
export default handler
