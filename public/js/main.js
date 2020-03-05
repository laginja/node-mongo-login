let objectToDraw = null;
let markerClick = false;
let parkingMarkers = [];    // Array to store parkingMarkers

const toggleVisibility = () => {
    group.setVisibility(group.getVisibility() ? false : true);
}

document.getElementById("parking").addEventListener("click", () => setObjectToDraw("P"));
document.getElementById("traffic-light").addEventListener("click", () => setObjectToDraw("T"));
document.getElementById("visibility").addEventListener("click", toggleVisibility);

const setObjectToDraw = (objectString) => {
    objectToDraw = objectString;
    resetParkingMarkers();
}

/**
 * Moves the map to display over Zagreb
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */
const moveMapToZagreb = map => {
    map.setCenter({ lat: 45.80724, lng: 15.96757 });
    map.setZoom(14);
}

/**
 * Places a marker on a map (non-parking marker)
 * @param {Object} coordinate 
 * @param {String} smartObject 
 */
const dropMarker = (coordinate, smartObject) => {
    // Define a variable holding SVG mark-up that defines an icon image:
    var svgMarkup = '<svg width="24" height="24" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<rect stroke="white" fill="#1b468d" x="1" y="1" width="22" ' +
        'height="22" /><text x="12" y="18" font-size="12pt" ' +
        'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
        'fill="white">' + smartObject + '</text></svg>';

    var icon = new H.map.Icon(svgMarkup);
    var marker = new H.map.Marker(coordinate, { icon: icon });
    marker.draggable = true;

    // add custom data to the marker
    marker.setData(smartObject);
    group.addObject(marker);
    enableMarkerDrag();
}

/**
 * Places a parkingMarker on the map in order to construct a parking object
 * @param {Object} coordinate 
 */
const dropParkingMarker = (coordinate) => {
    let svgCircle = '<svg width="20" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="10" cy="10" r="4" fill="#990000" stroke="black" stroke-width="1"/>' +
        '</svg>';

    var icon = new H.map.Icon(svgCircle);
    var marker = new H.map.Marker(coordinate, { icon: icon });
    parkingMarkers.push(marker);
    // Ensure that the marker can receive drag events
    marker.draggable = true;

    if (parkingMarkers.length === 1) {
        marker.addEventListener('tap', () => {
            // Called when we connect back to the first marker
            if (parkingMarkers.length > 2) {
                // Draw a parking if we have atleast 3 markers
                drawParking(parkingMarkers)
            }
        })
    }

    if (parkingMarkers.length > 1) {
        // Draw a line between markers
        //drawMarkerLine();
    }
    // add custom data to the marker
    //marker.setData(smartObject);
    parkingMarkersGroup.addObject(marker);
    enableMarkerDrag();
}


const enableMarkerDrag = () => {
    // disable the default draggability of the underlying map
    // and calculate the offset between mouse and target's position
    // when starting to drag a marker object:
    map.addEventListener('dragstart', function (ev) {
        var target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            var targetPosition = map.geoToScreen(target.getGeometry());
            target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
            behavior.disable();
        }
    }, false);


    // re-enable the default draggability of the underlying map
    // when dragging has completed
    map.addEventListener('dragend', function (ev) {
        var target = ev.target;
        if (target instanceof H.map.Marker) {
            behavior.enable();
        }
    }, false);

    // Listen to the drag event and move the position of the marker
    // as necessary
    map.addEventListener('drag', function (ev) {
        var target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
        }
    }, false);
}

const drawMarkerLine = () => {
    var lineString = new H.geo.LineString();

    lineString.pushPoint({ lat: parkingMarkers[parkingMarkers.length - 2].getGeometry().lat, lng: parkingMarkers[parkingMarkers.length - 2].getGeometry().lng });
    lineString.pushPoint({ lat: parkingMarkers[parkingMarkers.length - 1].getGeometry().lat, lng: parkingMarkers[parkingMarkers.length - 1].getGeometry().lng });

    group.addObject(new H.map.Polyline(
        lineString, { style: { lineWidth: 4 } }
    ));
}

/**
 * Draws a parking overlay after parkingMarkers have been connected
 * @param {Array} edges 
 */
const drawParking = (edges) => {
    let parkingEdges = [];
    edges.forEach(edge => {
        // Get coordinates of each marker
        let edgeCoordinates = edge.getGeometry();
        parkingEdges.push(edgeCoordinates.lat);
        parkingEdges.push(edgeCoordinates.lng);
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

    // create markers for each polygon's vertice which will be used for dragging
    parking.getGeometry().getExterior().eachLatLngAlt(function (lat, lng, alt, index) {
        var vertice = new H.map.Marker(
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
    map.addObject(parkingGroup);

    // add 'longpress' event listener, remove parking from the map
    parkingGroup.addEventListener('longpress', function (evt) {
        parkingGroup.removeObject(evt.target);

        var timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(function () {
            verticeGroup.setVisibility(false);
        }, timeout);
    }, false);

    // event listener for main group to show markers if moved in with mouse (or touched on touch devices)
    parkingGroup.addEventListener('pointerenter', function (evt) {
        if (polygonTimeout) {
            clearTimeout(polygonTimeout);
            polygonTimeout = null;
        }

        // show vertice markers
        verticeGroup.setVisibility(true);
    }, true);

    // event listener for main group to hide vertice markers if moved out with mouse (or released finger on touch devices)
    // the vertice markers are hidden on touch devices after specific timeout
    parkingGroup.addEventListener('pointerleave', function (evt) {
        var timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(function () {
            verticeGroup.setVisibility(false);
        }, timeout);
    }, true);

    // event listener for vertice markers group to change the cursor to pointer
    verticeGroup.addEventListener('pointerenter', function (evt) {
        document.body.style.cursor = 'pointer';
    }, true);

    // event listener for vertice markers group to change the cursor to default
    verticeGroup.addEventListener('pointerleave', function (evt) {
        document.body.style.cursor = 'default';
    }, true);

    // event listener for vertice markers group to resize the geo polygon object if dragging over markers
    verticeGroup.addEventListener('drag', function (evt) {
        var pointer = evt.currentPointer,
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
    /* var style = {
        fillColor: 'rgba(35, 51, 129, 0.3)',
        lineWidth: 2,
        strokeColor: 'rgba(114, 38, 51, 1)'
    };
    var svgCircle = '';

    let parkingEdges = [];
    edges.forEach(edge => {
        // Get coordinates of each marker
        let edgeCoordinates = edge.getGeometry();
        parkingEdges.push(edgeCoordinates.lat);
        parkingEdges.push(edgeCoordinates.lng);
        parkingEdges.push(0);
    });
    // Create a polygon map object
    var parking = new H.map.Polygon(new H.geo.LineString(parkingEdges), { style: style });

    let verticeGroup = new H.map.Group({
        visibility: false
    })
    let mainGroup = new H.map.Group({
            volatility: true, // mark the group as volatile for smooth dragging of all it's objects
            objects: [parking, verticeGroup]
        });
    let polygonTimeout;

    // ensure that the parking can receive drag events
    parking.draggable = true;

    // create markers for each parking's vertice which will be used for dragging
    parking.getGeometry().getExterior().eachLatLngAlt(function (lat, lng, alt, index) {
        var vertice = new H.map.Marker(
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
    group.addObject(mainGroup);

    // event listener for main group to show markers if moved in with mouse (or touched on touch devices)
    mainGroup.addEventListener('pointerenter', function (evt) {
        if (polygonTimeout) {
            clearTimeout(polygonTimeout);
            polygonTimeout = null;
        }

        // show vertice markers
        verticeGroup.setVisibility(true);
    }, true);

    // event listener for main group to hide vertice markers if moved out with mouse (or released finger on touch devices)
    // the vertice markers are hidden on touch devices after specific timeout
    mainGroup.addEventListener('pointerleave', function (evt) {
        var timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(function () {
            verticeGroup.setVisibility(false);
        }, timeout);
    }, true);

    // event listener for vertice markers group to change the cursor to pointer
    verticeGroup.addEventListener('pointerenter', function (evt) {
        document.body.style.cursor = 'pointer';
    }, true);

    // event listener for vertice markers group to change the cursor to default
    verticeGroup.addEventListener('pointerleave', function (evt) {
        document.body.style.cursor = 'default';
    }, true);

    // event listener for vertice markers group to resize the geo polygon object if dragging over markers
    verticeGroup.addEventListener('drag', function (evt) {
        var pointer = evt.currentPointer,
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
    }, true); */

    // Remove parking markers from the map
    resetParkingMarkers();
}

/**
 * Removes parkingMarkers from the group and resets parkingMarkers
 */
const resetParkingMarkers = () => {
    parkingMarkersGroup.removeAll();
    parkingMarkers = [];
}

/**
 * Boilerplate map initialization code starts below:
 */

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
    var target = evt.target;
    // Log 'tap' and 'mouse' events:
    var coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
    console.log(objectToDraw)

    // Check we're not clicking on a marker object and we are not drawing a parking
    if (!(target instanceof H.map.Marker) && objectToDraw !== 'P') {
        dropMarker(coord, objectToDraw);
    }

    // Check we're not clicking on a marker object and we are drawing a parking
    if (!(target instanceof H.map.Marker) && objectToDraw === 'P') {
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
group.addEventListener('tap', function (evt) {
    console.log("group", evt.target)
    // event target is the marker itself, group is a parent event target
    // for all objects that it contains
    var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
        // read custom data
        content: evt.target.getData()
    });
    // show info bubble
    ui.addBubble(bubble);
}, false);

// add 'longpress' event listener, remove marker from the group
group.addEventListener('longpress', function (evt) {
    //group.removeObject(evt.target);
    console.log(evt.target);
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
}

