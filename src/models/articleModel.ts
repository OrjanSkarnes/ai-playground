
// @ts-nocheck
const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  prompt: { type: String, required: true },
  data: { type: String, required: true },
  contentType: { type: String, required: true },
  name: { type: String, required: true, index: true },
});

const ArticleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index:true
  },
  prompt: {
    type: String,
    required: true,
    unique: false,
    sparse: true,
  },
  content: {
    type: String,
    required: true,
    unique: true,
  },
  // should be a list of strings
  imgRef: {
    type: String,
    required: false,
    unique: true,
  },
  images: {
    type: [ImageSchema],
    required: false,
  },
  customerUniqueID: {
    type: String,
    required: true,
  },
});

export const ArticleModel = mongoose.models.Article ||  mongoose.model('Article', ArticleSchema);
