import React from "react"
import { UploadButton } from "../utils/uploadthing"

export default function UploadTest() {
    return (
        <main style={{ padding: 32, textAlign: "center" }}>
            <h1>UploadThing v7 Test</h1>
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                    console.log("🎉 client got serverData:", res)
                    alert(`Uploaded by ${res[0].serverData.uploadedBy}`)
                }}
                onUploadError={(err) => {
                    console.error("🚨 upload error:", err)
                    alert(`ERROR: ${err.message}`)
                }}
            />
        </main>
    )
}
