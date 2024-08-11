let textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);

document.addEventListener("keydown", handleInput);

let documentWidth = 100;
let documentHeight = 150;

newDocument(documentWidth, documentHeight);

let documentLastRow = 0;

type mode = "insert" | "command";

type treeNode = {
    letter?: string;
    parent?: treeNode;
    leftChild?: treeNode;
    leftSibling?: treeNode;
    rightSibling?: treeNode
}

let documentNode : treeNode = {};
let selectedNode = documentNode;

// inserts an empty node to the left of selected node
// does not change the selection
function insertEmptyNodeBeforeSelected() {
    let blank : treeNode = {};
    // need to do a lot of null checking
    blank.rightSibling = selectedNode;
    blank.leftSibling = selectedNode.leftSibling;
    blank.parent = selectedNode.parent;

    selectedNode.leftSibling = blank;
}

// inserts an empty node to the right of selected node
// does not change the selection
function insertEmptyNodeAfterSelected() {
    let blank : treeNode = {};

    blank.leftSibling = selectedNode;
    blank.rightSibling = selectedNode.rightSibling;
    blank.parent = selectedNode.parent;

    selectedNode.rightSibling = blank;
}

function insertLetterInTree(letter) {

}
/*
when user presses a key:
  if we are in insert mode:
    if the key is in the insert mode table:
      perform the corresponding action
    if the key is a letter:
      we want to insert the letter in the right place in the ui relative to the selection
      we want to insert the letter in the tree:
        some different possiblities:
          cursor is an empty node, and we are inserting the letter before/after it
          cursor is a letter node, and we are inserting the letter before/after it
        
  if we are in command mode:
    look the key up in the command table and do the corresponding action

tree actions (controlled by non-letter keys):
  if the currently selected node is a list of letters, add new letter to the end
  select right sibling node (if exists)
  select left sibling node (if exists)
  select parent node (if exists)
  select first child node (if exists)
  make a new empty node to the right of selected node
  add a new empty node at the end of the children of current selection

we need some way of
  getting left sibling of node
  getting right sibling of node
  getting parent of node
  getting first child of node
  adding empty node to left of node
  adding empty node to right
  adding letter to end of word node
  adding new empty node to children

typing a letter adds the letter to current word
typing space starts a new empty list to the right of current and selects it
typing leftParens: if current list is empty, add an empty list inside it, and select that
typing rightParens selects the parent node

For testing purposes, it would be nice to have a way to uniformly
display trees in the ui, aka a print function for expressions

(a b c (d e f))
*/

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

type Block = {
    firstRow: number;
    lastRow: number;
}

let currentMode : mode = "insert";
let currentSelection : Interval = {
    row : 0,
    start: 0,
    end: 0
};

function shiftBlockDown(section : Block, shift : number) {
    for (let i = section.lastRow; i >= section.firstRow; i--) {
        let line : Interval = {
            row : i,
            start: 0,
            end: documentWidth      
        };

        moveText(line, i + shift, 0);

    }
    
    for (let i = section.firstRow; i < section.firstRow + shift; i++) {
        let line : Interval = {
            row : i,
            start: 0,
            end: documentWidth
        }
        setIntervalText(line, " ");
    }

}


// set every char in an interval to the same char: letter
function setIntervalText(range : Interval, letter) {
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

function copyArrayToPosition(textArray, newRow, newStart) {
    for (let i = 0; i < textArray.length; i ++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}

// move the text in range to newStart
// this leaves whitespace in some or all of range
// this will overwrite preexisting text after newStart
function moveText(range : Interval, newRow, newStart) {
    let textArray = copyTextToArray(range);
    setIntervalText(range, " ");

    copyArrayToPosition(textArray, newRow, newStart);
}

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
    moveText(range, range.row, range.start + shift);
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

    setIntervalText(currentSelection, " ");
    shiftText(afterSelection, - selectionLength);

    setSelection(newCursor);

    lineEndIndices.set(currentRow, endOfLine - selectionLength);
    
}

function insertBlankLineBelow() {
    let row = currentSelection.row;
    // shift every row below down by 1
    if (row < documentLastRow) {
        let everythingBelow : Block = {
            firstRow: row + 1,
            lastRow: documentLastRow
        }
        shiftBlockDown(everythingBelow, 1);
    }
    
    documentLastRow = documentLastRow + 1;

}

function insertLineBreakBeforeSelection() {
    // shift everything below current line down by 1
    insertBlankLineBelow();
    // move selection text and rest of line to line below
    let restOfLine : Interval = {
        row: currentSelection.row,
        start: currentSelection.start,
        end: lineEndIndices.get(currentSelection.row)
    }

    moveText(restOfLine, currentSelection.row + 1, 0);

    // move selection (highlighting + variable) to start of new line
    let newSelection : Interval = {
        row: currentSelection.row + 1,
        start: 0,
        end: currentSelection.end - currentSelection.start
    }

    setSelection(newSelection);
    console.log(currentSelection);

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
        currentList.push(key);
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

    lineEndIndices.set(currentRow, endOfLine + 1);
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
insertMap.set("Enter", insertLineBreakBeforeSelection);

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

function shiftIntervalDown(range : Interval, shift) {
    let newRange : Interval = {
        row: range.row + shift,
        start: range.start,
        end: range.end
    }

    return newRange;
}

function shiftInterval(range : Interval, rightShift, downShift) {
    let newRange : Interval = {
        row: range.row + downShift,
        start: range.start + rightShift,
        end: range.end + downShift
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
