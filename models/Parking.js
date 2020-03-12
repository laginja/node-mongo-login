const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true
    },
    edges: [
        {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            }
        }   
    ]
});

const Parking = mongoose.model('Parking', ParkingSchema);

module.exports = Parking;