// @ts-nocheck
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    prompt: { type: String, required: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    name: { type: String, required: true, index: true },
});

export const ImageModel = mongoose.models.Image || mongoose.model('Image', imageSchema);