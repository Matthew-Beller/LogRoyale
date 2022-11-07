function highlightSearchBar() {
    document.getElementById("search-icon").style.color = "#323437";                    
}

function unhighlightSearchBar() {
    document.getElementById("search-icon").style.color = "#949597";
}
// Generates an HTML element to display a search result a clan search
function addSearchResultCell(clanName, clanID, clanMemberCount, clanLocation) {
    let location = document.getElementById("results-box")
    let newCell = document.createElement('div');
    let domain = window.location.origin;
    newCell.innerHTML = `
    <div class="results-cell" onclick="location.href='${domain}/clan.php?id=${clanID.replace('#','')}'">
    <div class="cell-clan-name-and-icon">
        <!-- <img id="cell-clan-badge" src="https://cdn.statsroyale.com/images/badges/16000128.png"> -->
        <div class="cell-clan-name">${clanName}</div>
    </div>
    <div class="cell-subtext">
        <div class="cell-clan-id">${clanID}</div>
        <div class="cell-members">${clanMemberCount}/50</div>
        <div class="cell-location">${clanLocation}</div>
    </div>`;
    location.append(newCell);
}

// Generates all clan search results when given clan search recieved from RoyaleAPI
function populateSearchResultBox(apijson) {
    apijson.forEach(clan => {
        addSearchResultCell(clan[0], clan[1], clan[2], clan[3]);
    });
}