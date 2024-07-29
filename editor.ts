let textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);

document.addEventListener("keydown", handleInput);

makeTextSpaces(100, 150);

type mode = "insert" | "command";

type treeNode = {
    leftChild: treeNode;
    rightChild: treeNode;
    parent: treeNode;
}

type Interval = {
    start: Position;
    end: Position;
};

type Position = {
    y: number;
    x: number;
};

let currentMode : mode = "insert";
let currentSelection : Interval = {
    start: { y: 0, x: 0 },
    end: {y: 0, x: 1}
};



/*
insertion should be done before selection
cursor is a special case of selection where selection.start = selection.end
the first highlighted char is selection.start
the last highlighted char is selection.end

for adding a line-break, we need to 
shift everything below the current line down by one
take all the chars on the current line (starting with selection)
 and move them down to the start of the new blank line


*/

function insertLineBreakBeforeSelection(selection) {


}


function handleInput(e) {
    e.preventDefault();
    let key = e.key;

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
        insertBeforeSelection(key, currentSelection);
    }
}


function copyIntoArray(range : Interval) {
    let arr = [];
}

function insertBeforeSelection(key, selection) {
    // copy the range (selection.start, end of first row) to array
    // set (selection.start, end of first row) to spaces
    // copy 
    // move selection segment + rest of line one char to right
    // insert new char
}

function deleteBeforeSelection() {
    // if selection has a left sibling, delete that node
    // otherwise, do nothing
    let leftSibling = selection.previousSibling;
    if (leftSibling != null && selection.parentNode) {
        selection.parentNode.removeChild(leftSibling);
    }
}

function doNothing() {
    return true;
}


// make a table to handle input
// mode, key, --> some function
let insertMap = new Map();

insertMap.set("Backspace", deleteBeforeSelection);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", insertSpace);

function insertSpace() {
    insertBeforeSelection(" ", selection);
}

let shiftMap = new Map();


let commandMap = new Map();


// make a grid of divs with each one containing a space
// appends the grid to textBox div
function makeTextSpaces(width, height) {
    for (let row = 0; row < height; row ++) {
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("row");
    
        for (let col = 0; col < width; col++) {
            let letterDiv = document.createElement("div");
            letterDiv.classList.add("item");
            letterDiv.textContent = " ";
            rowDiv.appendChild(letterDiv);
        }
        textBox.appendChild(rowDiv);
    }
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

function shiftChar(row, col, rowShift, colShift) {
    let letter = getCharAt(row, col);
    setCharAt(row, col, " ");
    setCharAt(row + rowShift, col + colShift, letter);
}

function shiftPositionRight(position : Position, shift) {
    let newPosition = {
        y: position.y,
        x: position.x + shift
    }
    return newPosition;
}

function shiftPositionDown(position : Position, shift) {
    let newPosition = {
        y: position.y + shift,
        x: position.x
    }
    return newPosition;
}


// Tests:

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

// highlight the rectangle at (y,x)
function highlightAt(y, x) {
    let position = getDivAt(y, x);
    position.setAttribute("id", "highlighted");
}

// remove highlighting from rectangle at (y,x)
function unhighlightAt(y, x) {
    let position = getDivAt(y, x);
    position.removeAttribute("id");
}
