let textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);

document.addEventListener("keydown", handleInput);

newDocument(100, 150);

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
    end: {y: 0, x: 0}
};

function shiftEverythingRight(range : Interval, shift) {
    let newStart = shiftPositionRight(range.start, shift);
    let newEnd = shiftPositionRight(range.end, shift);

    // shift highlighting
    let y = range.start.y
    for (let i = range.start.x; i <= range.end.x; i++) {
        unhighlightAt(y, i);
    }

    for (let k = newStart.x; k <= newEnd.x; k++) {
        highlightAt(y, k);
    }

    // shift text
    for (let i = range.end.x; i >= range.start.x; i--) {
        let letter = getCharAt(y, i);
        setCharAt(y, i + shift, letter);
    }

    currentSelection = {start: newStart, end: newEnd};

}


/*
insertion should be done before selection
cursor is a special case of selection where selection.start = selection.end
the first highlighted char is selection.start
the last highlighted char is selection.end

for adding a line-break, we need to 
shift everything below the current line down by one
take all the chars on the current line (starting with selection)
 and move them down to the start of the new blank line

Steps:
highlight the (0,0) div
insert text in a sequence before this div





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
        insertBeforeSelection(key);
    }
}


function copyIntoArray(range : Interval) {
    let arr = [];
}

let lineEndIndices = new Map();
lineEndIndices.set(0,0);

function insertBeforeSelection(key) {
    // shift end line to the right by one
    // we are shifting the text and the highlighting of the selection
    // if we hit the end of the line, we will just lose the extra chars for now
    // we need to keep track of the index of the last char in a line
    // we will have a table of (rowNumber : lineEndIndex) pairs
    let rowNumber = currentSelection.start.y;
    let endOfLine = lineEndIndices.get(rowNumber);
    let selectionLength = currentSelection.end.x - currentSelection.start.x + 1;

    lineEndIndices.set(rowNumber, endOfLine + selectionLength);

    let endPosition : Position = { y: rowNumber, x: endOfLine};
    let range : Interval = { start: currentSelection.start, end: endPosition};
    
    shiftEverythingRight(range, 1);
    setCharAt(rowNumber, currentSelection.start.x, key);

}

function deleteBeforeSelection(selection) {
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
    insertBeforeSelection(" ");
}

let shiftMap = new Map();


let commandMap = new Map();


// make a grid of divs with each one containing a space
// appends the grid to textBox div
function newDocument(width, height) {
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
    highlightAt(0,0);
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
