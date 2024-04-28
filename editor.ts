let textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);

// make a grid of divs with each one containing a space
for (let row = 0; row < 100; row ++) {
    let rowDiv = document.createElement("div");
    rowDiv.classList.add("row");

    for (let col = 0; col < 80; col++) {
        let letterDiv = document.createElement("div");
        letterDiv.classList.add("item");
        letterDiv.textContent = " ";
        rowDiv.appendChild(letterDiv);
    }
    textBox.appendChild(rowDiv);
}

// get char at (y,x) in grid
function getCharAt(y, x) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    return rowChildren[x].textContent;
}

// get div at (y,x) in grid
function getDivAt(y,x) {
    let rows = textBox.children;
    let rowChildren = rows[y].children;
    return rowChildren[x];
}

// set char at (y,x) to newChar
function setCharAt(y, x, newChar) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}

// make a diagonal of a's (as a test)
function makeDiagonal() {
    for (let i = 0; i < 50; i++) {
    setCharAt(i,i, "a");
    }
}

// make first row all a's 
// make second row all b's (as a test)
function setRow() {
    for (let i = 0; i < 80; i++) {
        setCharAt(0,i,"a");
        setCharAt(1,i, "b");
    }
}

// highlight the first letter
function highlightFirst() {
    let first = getDivAt(0,0);
    first.setAttribute("id", "highlighted");
}

setRow();
highlightFirst();