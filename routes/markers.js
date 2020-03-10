const express = require('express');
const router = express.Router();

// User model
const Marker = require('../models/Marker');

// Must tell this route to expect JSON in body
router.use(express.json())

// Insert marker
router.post('/marker', (req, res) => {
    const { type, price, coordinates } = req.body;

    if (!type || !price || !coordinates) {
        console.log("Marker data incorrect");
    } else {
        const newMarker = new Marker({
            type,
            price,
            coordinates
        });
        // Save a new marker
        newMarker.save().then(marker => {
            // return inserted marker as json (to give '_id' to the marker)
            res.json(marker)
        })
    }
});

// Delete marker
router.delete('/marker', (req, res) => {
    const { id } = req.body;
    
    if (!id) {
        console.log("Marker not found");
    } else {
        // delete marker with a given id
        Marker.deleteOne({_id: id}).then(marker => {
            res.json("Marker deleted")
        }).catch(err => {
            console.log(err)
        })
    }
});

module.exports = router;