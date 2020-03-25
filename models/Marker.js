const mongoose = require('mongoose');

const MarkerSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    owner: {
        type: String,
        required: true
    }
});

const Marker = mongoose.model('Marker', MarkerSchema);

module.exports = Marker;