const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/auth');

const Parking = require('../models/Parking');

// Must tell this route to expect JSON in body
router.use(express.json())

// Find all parkings
router.get('/all', ensureAuthenticated, (req, res) => {
    const owner = req.session.Auth.email;
    Parking.find({owner: owner}).then(result => {
        res.json(result)
    }).catch(err => {
        console.log(err)
    })
});

// Insert parking
router.post('/parking', ensureAuthenticated, (req, res) => {
    const { price, edges, type } = req.body;
    const owner = req.session.Auth.email;

    if (!price || !edges || !type) {
        console.log("Parking data incorrect");
    } else {
        const newParking = new Parking({
            price,
            edges,
            type,
            owner
        });
        // Save a new parking
        newParking.save().then(parking => {
            // return inserted parking as json (to give '_id' to the parking)
            res.json(parking)
        })
    }
});

// Update parking
router.post('/update', ensureAuthenticated, (req, res) => {
    const { id, verticeIndex, coordinates } = req.body;

    if (!id || verticeIndex === undefined ||!coordinates) {
        console.log("Parking data incorrect");
    } else {
        let parkingToUpdate;
        // find parkingToUpdate
        Parking.findOne({_id: id}).then(result => {
            parkingToUpdate = result;
            parkingToUpdate.edges[verticeIndex] = coordinates;
            parkingToUpdate.save();
        }).catch(err => {
            console.log(err)
        })
    }
});

// Delete parking
router.delete('/parking', ensureAuthenticated, (req, res) => {
    const { id } = req.body;

    if (!id) {
        console.log("Parking not found");
    } else {
        // delete a parking with the given id
        Parking.deleteOne({ _id: id }).then(() => {
            res.json("Parking deleted")
        }).catch(err => {
            console.log(err)
        })
    }
});

module.exports = router;