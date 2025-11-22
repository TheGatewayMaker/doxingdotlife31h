import { RequestHandler } from "express";
import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";

interface UploadRequest {
  title: string;
  description: string;
  country?: string;
  city?: string;
  server?: string;
}

export const handleUpload: RequestHandler = (req, res) => {
  try {
    const { title, description, country, city, server } = req.body as UploadRequest;
    const file = req.file;

    if (!title || !description || !file) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const dataDir = join(process.cwd(), "dist", "data");
    const postDir = join(dataDir, title.replace(/\s+/g, "_"));

    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    if (!existsSync(postDir)) {
      mkdirSync(postDir, { recursive: true });
    }

    const mediaFileName = file.filename || `${Date.now()}-${file.originalname}`;
    const mediaPath = join(postDir, mediaFileName);
    writeFileSync(mediaPath, file.buffer);

    const postMetadata = {
      id: Date.now().toString(),
      title,
      description,
      country: country || "",
      city: city || "",
      server: server || "",
      mediaPath: mediaFileName,
      createdAt: new Date().toISOString(),
    };

    const metadataPath = join(postDir, "metadata.json");
    writeFileSync(metadataPath, JSON.stringify(postMetadata, null, 2));

    if (server) {
      const serversPath = join(dataDir, "serverslist.txt");
      const existingContent = existsSync(serversPath)
        ? readFileSync(serversPath, "utf-8")
        : "";
      const servers = existingContent
        .split("\n")
        .filter((line) => line.trim())
        .filter((s) => s !== server);

      servers.push(server);
      servers.sort();

      writeFileSync(serversPath, servers.join("\n"));
    }

    res.json({
      success: true,
      message: "Post uploaded successfully",
      postId: postMetadata.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};
