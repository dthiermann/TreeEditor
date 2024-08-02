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

// an interval is a contiguous range of positions on a single line
// when an interval is selected,
// the first highlighted spot is (row, start)
// the last highlighted spot is (row, end)
type Interval = {
    row: number;
    start: number;
    end: number;
};

type Position = {
    row: number;
    x: number;
};

let currentMode : mode = "insert";
let currentSelection : Interval = {
    row : 0,
    start: 0,
    end: 0
};

// set every char in an interval to the same char: letter
function setIntervalTo(range : Interval, letter) {
    for (let i = range.start; i <= range.end; i++) {
        setCharAt(range.row, i, letter);
    }
}

// copy the text from an interval into an array
// return that array
function copyTextToArray(range: Interval) {
    let text : string[] = [];

    for (let i = range.start; i <= range.end; i++) {
        text.push(getCharAt(range.row, i));
    }

    return text;
}

function copyArrayToPosition(textArray, range : Interval) {
    for (let i = 0; i < textArray.length; i ++) {
        setCharAt(range.row, range.start + i, textArray[i]);
    }
}

// move the text in range to newStart
// this leaves whitespace in some or all of range
// this will overwrite preexisting text after newStart
function moveText(range : Interval, newStart : Interval) {
    let textArray = copyTextToArray(range);
    setIntervalTo(range, " ");

    copyArrayToPosition(textArray, newStart);
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

delete selection:
lineBefore - selection - lineAfter
-set selection to whitespace
moving selection and highlighting to last char of lineBefore
moving lineAfter back by selectionLength


*/
function unhighlightInterval(range : Interval) {
    for (let i = range.start; i <= range.end; i ++) {
        unhighlightAt(range.row, i);
    }
}

function highlightInterval(range : Interval) {
    for (let i = range.start; i <= range.end; i++) {
        highlightAt(range.row, i);
    }
}

// updates currentSelection variable
// updates highlighting
// does not move any text
function setSelection(newRange : Interval) {
    unhighlightInterval(currentSelection);
    currentSelection = newRange;

    highlightInterval(newRange);

}

function shiftText(range : Interval, shift) {
    moveText(range, shiftIntervalRight(range, shift));
}

function deleteSelection() {
    let currentRow = currentSelection.row;
    let currentStart = currentSelection.start;
    let currentEnd = currentSelection.end;
    let selectionLength = currentEnd - currentStart + 1;

    let endOfLine = lineEndIndices.get(currentRow);

    let newCursor : Interval = {
        start: currentStart - 1,
        end: currentStart - 1,
        row: currentRow
    }

    let afterSelection : Interval = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    }

    setIntervalTo(currentSelection, " ");
    shiftText(afterSelection, - selectionLength);

    setSelection(newCursor);
    
}

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

let lineEndIndices = new Map();
lineEndIndices.set(0,0);

function insertBeforeSelection(key) {
    let currentRow = currentSelection.row;
    let endOfLine = lineEndIndices.get(currentRow);

    let afterSelection : Interval = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    }


    // shift everything after the selection to the right by 1
    shiftText(afterSelection, 1);

    // shift selection to the right by 1
    setSelection(shiftIntervalRight(currentSelection, 1));

    // insert key right before the start of new selection
    setCharAt(currentRow, currentSelection.start - 1, key);
}


function doNothing() {
    return true;
}


// make a table to handle input
// mode, key, --> some function
let insertMap = new Map();

insertMap.set("Backspace", deleteSelection);
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
function getCharAt(y : number, x : number) : string {
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
        y: position.row,
        x: position.x + shift
    }
    return newPosition;
}

function shiftIntervalRight(range : Interval, shift) {
    let row = range.row;
    let newRange = {
        row: row,
        start: range.start + shift,
        end: range.end + shift
    }

    return newRange;
}

function shiftPositionDown(position : Position, shift) {
    let newPosition = {
        y: position.row + shift,
        x: position.x
    }
    return newPosition;
}


// highlight the rectangle at (y,x)
function highlightAt(row, x) {
    let position = getDivAt(row, x);
    position.setAttribute("id", "selection");
}

// remove highlighting from rectangle at (y,x)
function unhighlightAt(row, x) {
    let position = getDivAt(row, x);
    position.removeAttribute("id");
}
