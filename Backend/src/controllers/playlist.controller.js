import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { wrapAsync } from "../utils/asyncHandler.js";

const createPlaylist = wrapAsync(async (req, res) => {
  const { name, description } = req.body;

  // create playlist
});

const getUserPlaylists = wrapAsync(async (req, res) => {
  const { userId } = req.params;
  // get user playlists
});

const getPlaylistById = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  // get playlist by id
});

const addVideoToPlaylist = wrapAsync(async (req, res) => {
  const { playlistId, videoId } = req.params;
});

const removeVideoFromPlaylist = wrapAsync(async (req, res) => {
  const { playlistId, videoId } = req.params;
  //  remove video from playlist
});

const deletePlaylist = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  //  delete playlist
});

const updatePlaylist = wrapAsync(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  // update playlist
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
