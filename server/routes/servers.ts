import { RequestHandler } from "express";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const handleGetServers: RequestHandler = (req, res) => {
  try {
    const dataDir = join(process.cwd(), "dist", "data");
    const serversPath = join(dataDir, "serverslist.txt");
    const servers: string[] = [];

    if (existsSync(serversPath)) {
      const content = readFileSync(serversPath, "utf-8");
      servers.push(
        ...content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)
      );
    }

    servers.sort();

    res.json({ servers });
  } catch (error) {
    console.error("Error getting servers:", error);
    res.status(500).json({ error: "Failed to retrieve servers" });
  }
};
