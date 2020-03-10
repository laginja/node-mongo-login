let objectToDraw = null;
let markerClick = false;
let parkingMarkers = [];    // Array to store parkingMarkers
let parkingMarkerLines = [];

/**
 * Toggle group visibility
 */
const toggleVisibility = () => {

    group.setVisibility(group.getVisibility() ? false : true);
    visibilityBtn.innerHTML = group.getVisibility() ? "Hide" : "Show";
}

const visibilityBtn = document.getElementById("visibility");
visibilityBtn.addEventListener("click", toggleVisibility);

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
 * @param {String} type 
 */
const dropMarker = (coordinate, type) => {
    // Define a variable holding SVG mark-up that defines an icon image:
    let svgMarkup = '<svg width="24" height="24" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<rect stroke="white" fill="#1b468d" x="1" y="1"  width="22" ' +
        'height="22" /><text x="12" y="18" font-size="12pt" ' +
        'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
        'fill="white">' + type + '</text></svg>';

    let icon = new H.map.Icon(svgMarkup);
    let marker = new H.map.Marker(coordinate, { icon: icon });
    marker.draggable = true;

    marker.addEventListener('longpress', (evt) => {    
        removeMarker(evt)
    });

    const markerData = {marker, type, coordinate}
    // Save marker
    saveMarker(markerData);
}

/**
 * Save marker to DB
 * @param {Object} marker 
 */
const saveMarker = markerData => {
    const { marker, type, coordinate } = markerData;

    // API - endpoint to save marker 
    const URL = '/markers/marker';
    const data = {
        type: type,
        price: 150,
        coordinates: coordinate
    };

    fetch(URL,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            marker.setData({
                "id": data._id, 
                "type": data.type
            })
            group.addObject(marker);
            enableMarkerDrag();
        });
}
/**
 * Remove marker from DB
 * @param {Object} evt 
 */
const removeMarker = evt => {
    // API - endpoint to delete marker 
    const URL = '/markers/marker';
    const id = evt.target.getData("_id");

    fetch(URL,
        {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(id)
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            group.removeObject(evt.target);
        });
}

/**
 * Places a parkingMarker on the map in order to construct a parking object
 * @param {Object} coordinate 
 */
const dropParkingMarker = coordinate => {
    let icon = createParkingMarkerIcon();
    let marker = new H.map.DomMarker(coordinate, { icon: icon });
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
        drawParkingMarkerLine();
    }
    // add custom data to the marker
    //marker.setData(smartObject);
    parkingMarkersGroup.addObject(marker);
    enableMarkerDrag();
}

const createParkingMarkerIcon = () => {
    // Create a <div> that will represent the marker
    let outerElement = document.createElement('div'),
        innerElement = document.createElement('div');

    outerElement.style.userSelect = 'none';
    outerElement.style.webkitUserSelect = 'none';
    outerElement.style.msUserSelect = 'none';
    outerElement.style.mozUserSelect = 'none';
    outerElement.style.cursor = 'default';

    innerElement.style.borderRadius = '50%';
    innerElement.style.background = 'blue';
    innerElement.style.border = '2px solid black';
    innerElement.style.width = '10px';
    innerElement.style.height = '10px';

    // add negative margin to inner element
    // to move the anchor to center of the div
    innerElement.style.marginTop = '-5px';
    innerElement.style.marginLeft = '-5px';

    outerElement.appendChild(innerElement);

    function changeOpacity(evt) {
        evt.target.style.opacity = 0.6;
    };

    function changeOpacityToOne(evt) {
        evt.target.style.opacity = 1;
    };

    //create dom icon and add/remove opacity listeners
    let domIcon = new H.map.DomIcon(outerElement, {
        // the function is called every time marker enters the viewport
        onAttach: function (clonedElement, domIcon, domMarker) {
            console.log("entered")
            clonedElement.addEventListener('mouseover', changeOpacity);
            clonedElement.addEventListener('mouseout', changeOpacityToOne);
        },
        // the function is called every time marker leaves the viewport
        onDetach: function (clonedElement, domIcon, domMarker) {
            console.log("left")
            clonedElement.removeEventListener('mouseover', changeOpacity);
            clonedElement.removeEventListener('mouseout', changeOpacityToOne);
        }
    });

    return domIcon;
}


const enableMarkerDrag = () => {
    // disable the default draggability of the underlying map
    // and calculate the offset between mouse and target's position
    // when starting to drag a marker object:
    map.addEventListener('dragstart', function (ev) {
        let target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            let targetPosition = map.geoToScreen(target.getGeometry());
            target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
            behavior.disable();
        }
    }, false);


    // re-enable the default draggability of the underlying map
    // when dragging has completed
    map.addEventListener('dragend', function (ev) {
        let target = ev.target;
        if (target instanceof H.map.Marker) {
            behavior.enable();
        }
    }, false);

    // Listen to the drag event and move the position of the marker
    // as necessary
    map.addEventListener('drag', function (ev) {
        let target = ev.target,
            pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
        }
    }, false);
}

const drawParkingMarkerLine = () => {
    let lineString = new H.geo.LineString();

    lineString.pushPoint({ lat: parkingMarkers[parkingMarkers.length - 2].b.lat, lng: parkingMarkers[parkingMarkers.length - 2].b.lng });
    lineString.pushPoint({ lat: parkingMarkers[parkingMarkers.length - 1].b.lat, lng: parkingMarkers[parkingMarkers.length - 1].b.lng });

    const line = new H.map.Polyline(lineString, { style: { strokeColor: 'rgba(114, 38, 51, 1)', lineWidth: 2 } });
    parkingMarkerLines = [...parkingMarkerLines, line]
    map.addObjects(parkingMarkerLines);
}

/**
 * Draws a parking overlay after parkingMarkers have been connected
 * @param {Array} edges 
 */
const drawParking = edges => {
    let parkingEdges = [];
    edges.forEach(edge => {
        // Get coordinates of each marker
        parkingEdges.push(edge.b.lat);
        parkingEdges.push(edge.b.lng);
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
    parkingGroup.addEventListener('longpress', function (evt) {
        group.removeObject(parkingGroup);

        let timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

        // hide vertice markers
        polygonTimeout = setTimeout(function () {
            verticeGroup.setVisibility(true);
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
        let timeout = (evt.currentPointer.type == 'touch') ? 1000 : 0;

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

    // Remove parking markers from the map
    resetParkingMarkers();
}

/**
 * Removes parkingMarkers and parkingMarkerLines from the group and resets parkingMarkers
 */
const resetParkingMarkers = () => {
    // remove objects from the map
    map.removeObjects(parkingMarkerLines);
    parkingMarkersGroup.removeAll();

    // reset helper arrays
    parkingMarkerLines = [];
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
    let target = evt.target;
    // Log 'tap' and 'mouse' events:
    let coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);

    // Check we're not clicking on a marker object and we are not drawing a parking
    if (!(target instanceof H.map.Marker) && (objectToDraw !== 'P' && objectToDraw !== null)) {
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

/* // add 'longpress' event listener, remove marker from the group
group.addEventListener('longpress', function (evt) {
    if (evt.target instanceof H.marker.Marker) {
        group.removeObject(evt.target);
    }
}, false); */

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

