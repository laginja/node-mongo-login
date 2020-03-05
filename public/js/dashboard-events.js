/**
 * Add styling to the clicked mapItem
 * @param {HTMLCollectionItem} item 
 */
const setSelectedItem = item => {
    const itemClicked = item.toElement.id;
    for (i = 0; i < mapItems.length; i++) {
        let item = mapItems.item(i);

        if (item.id === itemClicked) {
            item.classList.add("selected");
        }
        else {
            item.classList.remove("selected");
        }
      }
}

// Find all mapItems
let mapItems = document.getElementsByTagName("i");

// Add 'click' listeners to each mapItem
for (let item of mapItems) {
    item.addEventListener("click", (item) => setSelectedItem(item))
}