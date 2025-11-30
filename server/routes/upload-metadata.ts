import { RequestHandler } from "express";
import {
  uploadPostMetadataWithThumbnail,
  getServersList,
  updateServersList,
  getMediaUrl,
} from "../utils/r2-storage";

interface UploadMetadataRequest {
  postId: string;
  title: string;
  description: string;
  country?: string;
  city?: string;
  server?: string;
  nsfw?: string | boolean;
  thumbnailFileName: string;
  mediaFiles: string[];
  isTrend?: string | boolean;
  trendRank?: string;
}

export const handleUploadMetadata: RequestHandler = async (req, res) => {
  let responseSent = false;

  try {
    const {
      postId,
      title,
      description,
      country,
      city,
      server,
      nsfw,
      thumbnailUrl,
      mediaFiles,
      isTrend,
      trendRank,
    } = req.body as UploadMetadataRequest;

    // Validate required fields
    if (!postId || !title || !description || !thumbnailUrl || !mediaFiles) {
      console.error("Missing required metadata fields", {
        postId: !!postId,
        title: !!title,
        description: !!description,
        thumbnailUrl: !!thumbnailUrl,
        mediaFiles: !!mediaFiles,
      });

      if (!res.headersSent) {
        res.status(400).json({
          error:
            "Missing required fields: postId, title, description, thumbnailUrl, and mediaFiles are all required",
        });
        responseSent = true;
      }
      return;
    }

    // Validate mediaFiles is an array
    if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) {
      console.error("Invalid mediaFiles", {
        mediaFilesType: typeof mediaFiles,
        mediaFilesLength: Array.isArray(mediaFiles) ? mediaFiles.length : 0,
      });

      if (!res.headersSent) {
        res.status(400).json({
          error: "mediaFiles must be a non-empty array",
        });
        responseSent = true;
      }
      return;
    }

    console.log(
      `[${new Date().toISOString()}] Storing metadata for post ${postId}`,
    );

    const postMetadata = {
      id: postId,
      title,
      description,
      country: country || "",
      city: city || "",
      server: server || "",
      nsfw: nsfw === "true" || nsfw === true,
      mediaFiles,
      createdAt: new Date().toISOString(),
      isTrend: isTrend === "true" || isTrend === true,
      trendRank: isTrend ? parseInt(String(trendRank)) || 0 : 0,
    };

    try {
      await uploadPostMetadataWithThumbnail(postId, postMetadata, thumbnailUrl);

      // Update servers list if a server was provided
      if (server && server.trim()) {
        try {
          const servers = await getServersList();

          if (!Array.isArray(servers)) {
            console.warn(
              "Servers list is not an array, initializing with empty array",
            );
            await updateServersList([server.trim()]);
          } else {
            const serverSet = new Set(servers);
            serverSet.add(server.trim());
            const updatedServers = Array.from(serverSet);
            updatedServers.sort();
            await updateServersList(updatedServers);
          }
        } catch (serverError) {
          console.error("Error updating servers list:", serverError);
          // Don't fail the entire request if server list update fails
        }
      }

      console.log(
        `[${new Date().toISOString()}] ✅ Metadata stored successfully for post ${postId}`,
      );

      if (!res.headersSent) {
        res.json({
          success: true,
          message: "Post metadata stored successfully",
          postId,
          mediaCount: mediaFiles.length,
        });
        responseSent = true;
      }
    } catch (r2Error) {
      const errorMessage =
        r2Error instanceof Error ? r2Error.message : String(r2Error);
      console.error(
        `[${new Date().toISOString()}] ❌ R2 metadata storage error for post ${postId}:`,
        errorMessage,
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to store post metadata",
          details:
            process.env.NODE_ENV === "development"
              ? errorMessage
              : "Failed to store post metadata. Please try again.",
        });
        responseSent = true;
      }

      throw r2Error;
    }
  } catch (error) {
    if (responseSent) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Metadata upload error:`,
      errorMessage,
    );

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to store post metadata",
        details:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "An error occurred while storing post metadata. Please try again.",
      });
      responseSent = true;
    }
  }
};
