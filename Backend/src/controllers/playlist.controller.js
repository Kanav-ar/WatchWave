import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";

const createPlaylist = wrapAsync(async (req, res) => {
  const name = req.body.name?.trim();
  const description = req.body.description?.trim();
  // create playlist
  if (!name || name.length < 3) {
    throw new ApiError(400, "Playlist name too short");
  }

  if (!description || description.length < 5) {
    throw new ApiError(400, "Playlist description too short");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "New playlist created successfully"));
});

const getUserPlaylists = wrapAsync(async (req, res) => {
  // get user playlists

  const playlists = await Playlist.find({ owner: req.user._id });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        playlists.length > 0 ? "Playlists fetched" : "No playlists found",
      ),
    );
});

const getPlaylistById = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  // get playlist by id

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Not a valid playlist id");
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("owner", "username avatar")
    .populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched"));
});

const addVideoToPlaylist = wrapAsync(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Not a valid playlist id");
  }
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Not a valid video id");
  }

  const videoExists = await Video.exists({ _id: videoId });

  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }
  const playlist = await Playlist.findById(playlistId).populate("videos");
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this playlist");
  }

  if (playlist.videos.some((id) => id.toString() === videoId)) {
    throw new ApiError(400, "Video already in the playlist");
  }

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, `Video added to ${playlist.name}`));
});

const removeVideoFromPlaylist = wrapAsync(async (req, res) => {
  const { playlistId, videoId } = req.params;
  //  remove video from playlist
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Not a valid playlist id");
  }
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Not a valid video id");
  }

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this playlist");
  }

  if (!playlist.videos.some((id) => id.toString() === videoId)) {
    throw new ApiError(
      400,
      "The video you are trying to remove doesn't exist in the playlist",
    );
  }

  playlist.videos.pull(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, `Video removed from ${playlist.name}`));
});

const deletePlaylist = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  //  delete playlist
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Not a valid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this playlist");
  }

  await playlist.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const updates = {};
  // update playlist
  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Not a valid playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this playlist");
  }

  if (name?.trim()?.length >= 3) {
    playlist.name = name.trim();
    updates.name = `Playlist name updated to ${name.trim()}`;
  }
  if (description?.trim()?.length >= 5) {
    playlist.description = description.trim();
    updates.description = "Playlist description updated successfully";
  }

  const isUpdated = Object.keys(updates).length > 0
  if (isUpdated) {
    await playlist.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updates, playlist },
        isUpdated ? "Playlist updated" : "Nothing to update",
      ),
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
