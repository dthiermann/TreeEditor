let textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);

document.addEventListener("keydown", handleInput);

type mode = "input" | "command";


// global variables here: not sure if ok stylewise
// but they are the obvious way to handle selection and cursor position
let mode : mode = "input";

let selection = {
    row: 0,
    col: 0
}

// in the syntax tree, the selection will be a node
// in the grid, the selection will be a range btw two points


function handleInput(e) {
    e.preventDefault();
    let key = e.key;

    if (mode == "input") {
        insertMode(key);
    }
    if (mode == "command") {
        commandMap.get(key);
    }
}

function insertMode(key) {
    if (insertMap.has(key)) {
        insertMap.get(key)();
    }
    else {
        insertAtCursor(key);
    }
}


function insertAtCursor(key) {
    
}

function doNothing() {
    return true;
}


// make a table to handle input
// mode, key, --> some function
let insertMap = new Map();

insertMap.set("Backspace", doNothing);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);

let commandMap = new Map();


// make a grid of divs with each one containing a space
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

// make a table of keys that are not literal


// to do:
// implement basic key functionality
// for some keys we want the literal keyname to be typed (like letters)
// for others (tab, enter) we want another command to happen

// want to parse code into a tree while we're typing
// want to link each node in the tree with coordinates on the text grid
// decide on formatting rules
// copy and paste
// undo
// fold/hide sections
// rename symbols
// debugging

// putting called functions down here
makeTextSpaces(80, 100);