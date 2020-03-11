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
    // Define a variable holding SVG mark-up that defines an icon image:
    let svgMarkup = '<svg width="24" height="24" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<rect stroke="white" fill="#1b468d" x="1" y="1"  width="22" ' +
        'height="22" /><text x="12" y="18" font-size="12pt" ' +
        'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
        'fill="white">' + element.type + '</text></svg>';

    let icon = new H.map.Icon(svgMarkup);
    let marker = new H.map.Marker(element.coordinates, { icon: icon });
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
    addMarkersToMap();
}