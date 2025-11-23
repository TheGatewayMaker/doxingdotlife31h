import { RequestHandler } from "express";
import {
  deletePostFolder,
  deleteMediaFile,
  updatePostMetadataField,
  getPostMetadata,
} from "../utils/r2-storage";

export const handleDeletePost: RequestHandler = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({ error: "Post ID is required" });
      return;
    }

    await deletePostFolder(postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete post: ${errorMessage}` });
  }
};

export const handleDeleteMediaFile: RequestHandler = async (req, res) => {
  try {
    const { postId, fileName } = req.params;

    if (!postId || !fileName) {
      res.status(400).json({ error: "Post ID and file name are required" });
      return;
    }

    if (fileName.includes("..") || fileName.includes("/")) {
      res.status(403).json({ error: "Invalid file path" });
      return;
    }

    await deleteMediaFile(postId, fileName);

    res.json({
      success: true,
      message: "Media file deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media file:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: `Failed to delete media file: ${errorMessage}`,
    });
  }
};

export const handleUpdatePost: RequestHandler = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, country, city, server } = req.body;

    if (!postId) {
      res.status(400).json({ error: "Post ID is required" });
      return;
    }

    const metadata = await getPostMetadata(postId);
    if (!metadata) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const updates: {
      title?: string;
      description?: string;
      country?: string;
      city?: string;
      server?: string;
    } = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (country !== undefined) updates.country = country;
    if (city !== undefined) updates.city = city;
    if (server !== undefined) updates.server = server;

    const updatedMetadata = await updatePostMetadataField(postId, updates);

    res.json({
      success: true,
      message: "Post updated successfully",
      post: updatedMetadata,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update post: ${errorMessage}` });
  }
};
