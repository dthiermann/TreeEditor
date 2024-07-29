var textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);
document.addEventListener("keydown", handleInput);
var currentMode = "insert";
var currentSelection = {
    start: { y: 0, x: 0 },
    end: { y: 0, x: 1 }
};
// line breaks:
// split line into beforeSelection + (selection and after)
// make a new line and
// move (selection and after) to new line
/*
for adding a line-break, we need to
shift everything below the current line down by one
take all the chars on the current line (starting with selection)
 and move them down to the start of the new blank line


*/
function insertLineBreakBeforeSelection(selection) {
}
function handleInput(e) {
    e.preventDefault();
    var key = e.key;
    if (currentMode == "insert") {
        insertMode(key);
    }
    if (currentMode == "command") {
        commandMode(key);
    }
}
function commandMode(key) {
    if (commandMap.has(key)) {
        commandMap.get(key)();
    }
}
function insertMode(key) {
    if (insertMap.has(key)) {
        insertMap.get(key)();
    }
    else {
        insertBeforeSelection(key, selection);
    }
}
function insertBeforeSelection(key, selection) {
    var keyNode = document.createElement("div");
    var selectionParent = selection.parentNode;
    keyNode.textContent = key;
    keyNode.classList.add("item");
    selectionParent.insertBefore(keyNode, selection);
}
function deleteBeforeSelection() {
    // if selection has a left sibling, delete that node
    // otherwise, do nothing
    var leftSibling = selection.previousSibling;
    if (leftSibling != null && selection.parentNode) {
        selection.parentNode.removeChild(leftSibling);
    }
}
function doNothing() {
    return true;
}
// make a table to handle input
// mode, key, --> some function
var insertMap = new Map();
insertMap.set("Backspace", deleteBeforeSelection);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", insertSpace);
function insertSpace() {
    insertBeforeSelection(" ", selection);
}
var shiftMap = new Map();
var commandMap = new Map();
// make a grid of divs with each one containing a space
function makeTextSpaces(width, height) {
    for (var row = 0; row < height; row++) {
        var rowDiv = document.createElement("div");
        rowDiv.classList.add("row");
        for (var col = 0; col < width; col++) {
            var letterDiv = document.createElement("div");
            letterDiv.classList.add("item");
            letterDiv.textContent = " ";
            rowDiv.appendChild(letterDiv);
        }
        textBox.appendChild(rowDiv);
    }
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
function shiftChar(row, col, rowShift, colShift) {
    var letter = getCharAt(row, col);
    setCharAt(row, col, " ");
    setCharAt(row + rowShift, col + colShift, letter);
}
// Tests:
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
// highlight the rectangle at (y,x)
function highlightAt(y, x) {
    var position = getDivAt(y, x);
    position.setAttribute("id", "highlighted");
}
// remove highlighting from rectangle at (y,x)
function unhighlightAt(y, x) {
    var position = getDivAt(y, x);
    position.removeAttribute("id");
}
