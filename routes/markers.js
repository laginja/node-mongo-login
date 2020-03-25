const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/auth');

const Marker = require('../models/Marker');

// Must tell this route to expect JSON in body
router.use(express.json())

// Find all markers
router.get('/all', ensureAuthenticated, (req, res) => {
    const owner = req.session.Auth.email;
    Marker.find({owner: owner}).then(result => {
        res.json(result)
    }).catch(err => {
        console.log(err)
    })
});

// Insert marker
router.post('/marker', ensureAuthenticated, (req, res) => {
    const { type, name, price, coordinates } = req.body;
    const owner = req.session.Auth.email;

    if (!type || !name || !price || !coordinates || !owner) {
        console.log("Marker data incorrect");
    } else {
        const newMarker = new Marker({
            type,
            name,
            price,
            coordinates,
            owner
        });
        // Save a new marker
        newMarker.save().then(marker => {
            // return inserted marker as json (to give '_id' to the marker)
            res.json(marker)
        })
    }
});

// Update marker
router.post('/update', ensureAuthenticated, (req, res) => {
    const { id, coordinates } = req.body;

    if (!id || !coordinates) {
        console.log("Marker data incorrect");
    } else {
        let markerToUpdate;
        // find markerToUpdate
        Marker.findOne({_id: id}).then(result => {
            markerToUpdate = result;
            markerToUpdate.coordinates = coordinates;
            markerToUpdate.save();
        }).catch(err => {
            console.log(err)
        })
    }
});

// Delete marker
router.delete('/marker', ensureAuthenticated, (req, res) => {
    const { id } = req.body;

    if (!id) {
        console.log("Marker not found");
    } else {
        // delete marker with a given id
        Marker.deleteOne({ _id: id }).then(() => {
            res.json("Marker deleted")
        }).catch(err => {
            console.log(err)
        })
    }
});

module.exports = router;