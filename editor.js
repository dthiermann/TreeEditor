var textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);
// make a grid of divs with each one containing a space
for (var row = 0; row < 100; row++) {
    var rowDiv = document.createElement("div");
    rowDiv.classList.add("row");
    for (var col = 0; col < 80; col++) {
        var letterDiv = document.createElement("div");
        letterDiv.classList.add("item");
        letterDiv.textContent = " ";
        rowDiv.appendChild(letterDiv);
    }
    textBox.appendChild(rowDiv);
}
// get char at (y,x) in grid
function getCharAt(y, x) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    return rowChildren[x].textContent;
}
// get div at (y,x) in grid
function getDivAt(y, x) {
    var rows = textBox.children;
    var rowChildren = rows[y].children;
    return rowChildren[x];
}
// set char at (y,x) to newChar
function setCharAt(y, x, newChar) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}
// make a diagonal of a's (as a test)
function makeDiagonal() {
    for (var i = 0; i < 50; i++) {
        setCharAt(i, i, "a");
    }
}
// make first row all a's 
// make second row all b's (as a test)
function setRow() {
    for (var i = 0; i < 80; i++) {
        setCharAt(0, i, "a");
        setCharAt(1, i, "b");
    }
}
// highlight the first letter
function highlightFirst() {
    var first = getDivAt(0, 0);
    first.setAttribute("id", "highlighted");
}
setRow();
highlightFirst();
