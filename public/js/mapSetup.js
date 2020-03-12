let total = 0;
const totalCost = document.getElementById("total-cost");

const moveMapToZagreb = map => {
    map.setCenter({ lat: 45.80724, lng: 15.96757 });
    map.setZoom(14);
}

const addMarkersToMap = () => {
    // API - endpoint to save marker 
    const URL = '/markers/all';

    fetch(URL,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            data.forEach(element => {
                total += element.price;

                setMarkerData(element);
                enableMarkerDrag();
            });
            totalCost.innerHTML = total;
        });
}

const setMarkerData = element => {
    // Create a <div> that will represent the marker
    let outerElement = createMarkerIcon(element.type);

    const onMouseOver = evt => {
        evt.target.style.opacity = 0.7;
        evt.target.style.cursor = 'pointer';
    }

    const onMouseOut = evt => {
        evt.target.style.opacity = 1;
        evt.target.style.cursor = 'default';
    }

    //create dom icon and add/remove listeners
    let domIcon = new H.map.DomIcon(outerElement, {
        // the function is called every time marker enters the viewport
        onAttach: function (clonedElement, domIcon, domMarker) {
            clonedElement.addEventListener('mouseover', onMouseOver);
            clonedElement.addEventListener('mouseout', onMouseOut);
        },
        // the function is called every time marker leaves the viewport
        onDetach: function (clonedElement, domIcon, domMarker) {
            clonedElement.removeEventListener('mouseover', onMouseOver);
            clonedElement.removeEventListener('mouseout', onMouseOut);
        }
    });

    let marker = new H.map.DomMarker(element.coordinates, { icon: domIcon });
    marker.draggable = true;

    marker.addEventListener('longpress', (evt) => {
        removeMarker(evt)
    });

    marker.setData({
        "id": element._id,
        "type": element.type,
        "price": element.price
    })
    group.addObject(marker);
}

const addParkingsToMap = () => {
    // API - endpoint to save marker 
    const URL = '/parkings/all';

    fetch(URL,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            data.forEach(element => {
                total += element.price;
                
                setParkingData(element);
                enableMarkerDrag();
            });
            totalCost.innerHTML = total;
        });
}

const setParkingData = element => {
    let parkingEdges = [];
    element.edges.forEach(edge => {
        // Get coordinates of each marker
        parkingEdges.push(edge.lat);
        parkingEdges.push(edge.lng);
        parkingEdges.push(0);

    });

    let style = {
        fillColor: 'rgba(35, 51, 129, 0.3)',
        lineWidth: 2,
        strokeColor: 'rgba(114, 38, 51, 1)'
    };
    let svgCircle = '<svg width="20" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="10" cy="10" r="4" fill="transparent" stroke="red" stroke-width="3"/>' +
        '</svg>';
    let parking = new H.map.Polygon(new H.geo.Polygon(new H.geo.LineString(parkingEdges)), { style: style });
    let verticeGroup = new H.map.Group({ visibility: false });
    let parkingGroup = new H.map.Group({
        volatility: true, // mark the group as volatile for smooth dragging of all it's objects
        objects: [parking, verticeGroup]
    });
    let polygonTimeout;

    // ensure that the parking can receive drag events
    parking.draggable = true;

    // assign data to the parking
    parking.setData({
        "id": element._id,
        "price": element.price
    })

    // create markers for each polygon's vertice which will be used for dragging
    parking.getGeometry().getExterior().eachLatLngAlt((lat, lng, alt, index) => {
        let vertice = new H.map.Marker(
            { lat, lng },
            {
                icon: new H.map.Icon(svgCircle, { anchor: { x: 10, y: 10 } })
            }
        );
        vertice.draggable = true;
        vertice.setData({ 'verticeIndex': index })
        verticeGroup.addObject(vertice);
    });

    // add group with parking and it's vertices (markers) on the map
    group.addObject(parkingGroup);

    // add 'longpress' event listener, remove parking from the map
    parkingGroup.addEventListener('longpress', evt => {
        group.removeObject(parkingGroup);
        removeParking(evt)

        let timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(() => {
            verticeGroup.setVisibility(true);
        }, timeout);
    }, false);

    // event listener for main group to show markers if moved in with mouse (or touched on touch devices)
    parkingGroup.addEventListener('pointerenter', evt => {
        if (polygonTimeout) {
            clearTimeout(polygonTimeout);
            polygonTimeout = null;
        }

        // show vertice markers
        verticeGroup.setVisibility(true);
    }, true);

    // event listener for main group to hide vertice markers if moved out with mouse (or released finger on touch devices)
    // the vertice markers are hidden on touch devices after specific timeout
    parkingGroup.addEventListener('pointerleave', evt => {
        let timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(() => {
            verticeGroup.setVisibility(false);
        }, timeout);
    }, true);

    // event listener for vertice markers group to change the cursor to pointer
    verticeGroup.addEventListener('pointerenter', evt => {
        document.body.style.cursor = 'pointer';
    }, true);

    // event listener for vertice markers group to change the cursor to default
    verticeGroup.addEventListener('pointerleave', evt => {
        document.body.style.cursor = 'default';
    }, true);

    // event listener for vertice markers group to resize the geo polygon object if dragging over markers
    verticeGroup.addEventListener('drag', evt => {
        let pointer = evt.currentPointer,
            geoLineString = parking.getGeometry().getExterior(),
            geoPoint = map.screenToGeo(pointer.viewportX, pointer.viewportY);

        // set new position for vertice marker
        evt.target.setGeometry(geoPoint);

        // set new position for parking's vertice
        geoLineString.removePoint(evt.target.getData()['verticeIndex']);
        geoLineString.insertPoint(evt.target.getData()['verticeIndex'], geoPoint);
        parking.setGeometry(new H.geo.Polygon(geoLineString));

        // stop propagating the drag event, so the map doesn't move
        evt.stopPropagation();
    }, true);
}

//Step 1: initialize communication with the platform
const platform = new H.service.Platform({
    'apikey': 'Izxy6fjoTs6MBcl7TgGMR6eqs85IK2klw4GV1FL_y4g'
});

const defaultLayers = platform.createDefaultLayers();

//Step 2: initialize a map - this map is centered over Europe
let map = new H.Map(document.getElementById('map'),
    defaultLayers.vector.normal.map, {
    center: { lat: 50, lng: 5 },
    zoom: 4,
    pixelRatio: window.devicePixelRatio || 1
});

// add a resize listener to make sure that the map occupies the whole container
window.addEventListener('resize', () => map.getViewPort().resize());

// Add event listeners:
map.addEventListener('tap', evt => {
    let target = evt.target;
    // Log 'tap' and 'mouse' events:
    let coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);

    // Check we're not clicking on a marker object and we are not drawing a parking
    if (!(target instanceof H.map.DomMarker) && (objectToDraw !== 'P' && objectToDraw !== null)) {
        dropMarker(coord, objectToDraw);
    }

    // Check we're not clicking on a dommarker object and we are drawing a parking
    if (!(target instanceof H.map.DomMarker || target instanceof H.map.Marker) && objectToDraw === 'P') {
        dropParkingMarker(coord);
    }
});

// Create groups for the markers
let group = new H.map.Group({
    volatility: true // mark the group as volatile for smooth dragging of all it's objects
});
let parkingMarkersGroup = new H.map.Group({
    volatility: true // mark the group as volatile for smooth dragging of all it's objects
});

map.addObject(group);
map.addObject(parkingMarkersGroup);

// add 'tap' event listener, that opens info bubble, to the group
group.addEventListener('tap', evt => {
    // event target is the marker itself, group is a parent event target
    // for all objects that it contains
    let bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
        // read custom data
        content: evt.target.getData().type
    });

    ui.addBubble(bubble);
}, false);

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
let ui = H.ui.UI.createDefault(map, defaultLayers);

// Now use the map as required...
window.onload = () => {
    moveMapToZagreb(map);
    addMarkersToMap();
    addParkingsToMap();
}