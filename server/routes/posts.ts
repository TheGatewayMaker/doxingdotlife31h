import { RequestHandler } from "express";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

interface Post {
  id: string;
  title: string;
  description: string;
  country?: string;
  city?: string;
  server?: string;
  thumbnail?: string;
  createdAt: string;
}

export const handleGetPosts: RequestHandler = (req, res) => {
  try {
    const dataDir = join(process.cwd(), "dist", "data");
    const posts: Post[] = [];

    if (!existsSync(dataDir)) {
      res.json({ posts: [], total: 0 });
      return;
    }

    const folders = readdirSync(dataDir).filter((name) => {
      const path = join(dataDir, name);
      return (
        !name.includes(".") &&
        require("fs").statSync(path).isDirectory()
      );
    });

    for (const folder of folders) {
      const metadataPath = join(dataDir, folder, "metadata.json");
      if (existsSync(metadataPath)) {
        const metadata = JSON.parse(readFileSync(metadataPath, "utf-8"));
        posts.push({
          id: metadata.id,
          title: metadata.title,
          description: metadata.description,
          country: metadata.country,
          city: metadata.city,
          server: metadata.server,
          createdAt: metadata.createdAt,
        });
      }
    }

    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      posts,
      total: posts.length,
    });
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Failed to retrieve posts" });
  }
};
