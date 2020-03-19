/**
 * Add styling to the clicked mapItem
 * @param {HTMLCollectionItem} item 
 */
const setSelectedItem = item => {
    const itemClicked = item.toElement.id;
    let iconItem;
    for (i = 0; i < mapItems.length; i++) {
        iconItem = mapItems.item(i);

        if (iconItem.id === itemClicked) {
            setObjectToDraw(iconItem.id);
            if (iconItem.classList.contains("selected")) {
                iconItem.classList.remove("selected");
                setObjectToDraw(null);
            } else {
                iconItem.classList.add("selected");
            }
        } else {
            iconItem.classList.remove("selected");
        }
    }
}

/**
 * Sets the marker to place on the map
 * @param {String} obj 
 */
const setObjectToDraw = (id) => {
    switch (id) {
        case "parking":
            objectToDraw = "P";
            break;
        case "traffic-light":
            objectToDraw = "T";
            break;
        case "water-sensor":
            objectToDraw = "W";
            break;
        case "gas-sensor":
            objectToDraw = "G";
            break;
        case "parking-sensor":
            objectToDraw = "PS";
            break;
        case "parking-ramp":
            objectToDraw = "PR";
            break;
        case "vendomat":
            objectToDraw = "V";
            break;
        case "traffic-counter":
            objectToDraw = "TC";
            break;
        case "wify":
            objectToDraw = "Wifi";
            break;
        case "sensor-air":
            objectToDraw = "A";
            break;
        case "smart-bench":
            objectToDraw = "B";
            break;
        case "smart-trash-can":
            objectToDraw = "STC";
            break;
        default:
            objectToDraw = null;
            break;
    }
    resetParkingMarkers();
}

// Find all mapItems
let mapItems = document.getElementsByTagName("i");
let clickedItem;

// Add 'click' listeners to each mapItem
for (let item of mapItems) {
    item.addEventListener("click", (item) => setSelectedItem(item))
}