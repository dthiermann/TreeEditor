// simple version of application:
// user is working in a single file / module
var _a;
let textBox = document.createElement("div");
document.body.appendChild(textBox);
textBox.classList.add("textBox");
// get the number of lines that the displayed node takes up from local storage
// use that number to determine how many lines the textbox should have
let storedSize = (_a = localStorage.getItem("displayed-node-size")) !== null && _a !== void 0 ? _a : "300";
let documentHeight = Math.max(300, parseInt(storedSize));
let documentWidth = 100;
// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);
let currentMode = "command";
let documentNode = {
    kind: "module",
    contents: [],
    numberOfRows: 0
};
let displayedNode = documentNode;
let selectedNode = documentNode;
document.addEventListener("keydown", handleInput);
// when page loads:
// blank ui
// displayedNode = selectedNode = empty node of type module
// no storage for now (everything gets deleted when page reloads)
// command mode
// ui grid
// syntax tree
// displayed node
// selected node
// mode
// + input key
// clear the display of all text and highlighting
function clearDisplay(documentHeight, documentWidth) {
    for (let row = 0; row < documentHeight; row++) {
        for (let x = 0; x < documentWidth; x++) {
            setCharAt(row, x, " ");
            unhighlightAt(row, x);
        }
    }
}
// this is the main entry point for the editor program
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
let commandMap = new Map();
commandMap.set("f", addNewFunctionToModule);
// make a table to handle input
// mode, key, --> some function
let insertMap = new Map();
insertMap.set("Backspace", deleteSelection);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", insertSpace);
insertMap.set("Enter", insertLineBreakBeforeSelection);
let documentLastRow = 0;
function printExpression(expr) {
    if (expr.kind === "word") {
        return printWord(expr);
    }
    if (expr.kind == "definition") {
        return printDef(expr);
    }
    if (expr.kind == "module") {
        return printModule(expr);
    }
}
// print String to the ui directly
function printString(str, row, x) {
    for (let i = 0; i < str.length; i++) {
        setCharAt(row, x, str[i]);
    }
}
// print module to ui directly
function printModule(mod) {
}
// node --> print to ui at the location specified by node position attributes
function printDef(def) {
    let defKeyWord = "define ";
    printString(defKeyWord, def.firstRow, 0);
    printWord(def.name);
    // To Do: print arguments and body of definition
}
// print word node onto ui
function printWord(word) {
    for (let i = 0; i < word.content.length; i++) {
        printLetter(word.content[i]);
    }
}
// print letter to ui
function printLetter(letter) {
    setCharAt(letter.row, letter.x, letter.value);
}
let currentSelection = {
    row: 0,
    start: 0,
    end: 0
};
function shiftBlockDown(section, shift) {
    for (let i = section.lastRow; i >= section.firstRow; i--) {
        let line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        moveText(line, i + shift, 0);
    }
    for (let i = section.firstRow; i < section.firstRow + shift; i++) {
        let line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        setIntervalText(line, " ");
    }
}
// set every char in an interval to the same char: letter
function setIntervalText(range, letter) {
    for (let i = range.start; i <= range.end; i++) {
        setCharAt(range.row, i, letter);
    }
}
// copy the text from an interval into an array
// return that array
function copyTextToArray(range) {
    let text = [];
    for (let i = range.start; i <= range.end; i++) {
        text.push(getCharAt(range.row, i));
    }
    return text;
}
function copyArrayToPosition(textArray, newRow, newStart) {
    for (let i = 0; i < textArray.length; i++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}
// move the text in range to newStart
// this leaves whitespace in some or all of range
// this will overwrite preexisting text after newStart
function moveText(range, newRow, newStart) {
    let textArray = copyTextToArray(range);
    setIntervalText(range, " ");
    copyArrayToPosition(textArray, newRow, newStart);
}
function unhighlightInterval(range) {
    for (let i = range.start; i <= range.end; i++) {
        unhighlightAt(range.row, i);
    }
}
function highlightInterval(range) {
    for (let i = range.start; i <= range.end; i++) {
        highlightAt(range.row, i);
    }
}
// updates currentSelection variable
// updates highlighting
// does not move any text
function setSelection(newRange) {
    unhighlightInterval(currentSelection);
    currentSelection = newRange;
    highlightInterval(newRange);
}
function shiftText(range, shift) {
    moveText(range, range.row, range.start + shift);
}
function deleteSelection() {
    let currentRow = currentSelection.row;
    let currentStart = currentSelection.start;
    let currentEnd = currentSelection.end;
    let selectionLength = currentEnd - currentStart + 1;
    let endOfLine = lineEndIndices.get(currentRow);
    let newCursor = {
        start: currentStart - 1,
        end: currentStart - 1,
        row: currentRow
    };
    let afterSelection = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    };
    setIntervalText(currentSelection, " ");
    shiftText(afterSelection, -selectionLength);
    setSelection(newCursor);
    lineEndIndices.set(currentRow, endOfLine - selectionLength);
}
function insertBlankLineBelow() {
    let row = currentSelection.row;
    // shift every row below down by 1
    if (row < documentLastRow) {
        let everythingBelow = {
            firstRow: row + 1,
            lastRow: documentLastRow
        };
        shiftBlockDown(everythingBelow, 1);
    }
    documentLastRow = documentLastRow + 1;
}
function insertLineBreakBeforeSelection() {
    // shift everything below current line down by 1
    insertBlankLineBelow();
    // move selection text and rest of line to line below
    let restOfLine = {
        row: currentSelection.row,
        start: currentSelection.start,
        end: lineEndIndices.get(currentSelection.row)
    };
    moveText(restOfLine, currentSelection.row + 1, 0);
    // move selection (highlighting + variable) to start of new line
    let newSelection = {
        row: currentSelection.row + 1,
        start: 0,
        end: currentSelection.end - currentSelection.start
    };
    setSelection(newSelection);
    console.log(currentSelection);
}
function commandMode(key) {
    if (commandMap.has(key)) {
        return commandMap.get(key)();
    }
}
// handles user input when in insert mode
function insertMode(key) {
    // if key is not a letter or number, it should have an entry in the insertMap
    if (insertMap.has(key)) {
        insertMap.get(key)();
    }
    else {
        insertAtSelection(key);
    }
}
function insertAtSelection(key) {
}
function put(newNode, currentNode, relativePosition) {
    if (relativePosition === "last child") {
        currentNode.content.push(newNode);
        newNode.parent = currentNode;
    }
}
let lineEndIndices = new Map();
lineEndIndices.set(0, 0);
function insertBeforeSelection(key) {
    let currentRow = currentSelection.row;
    let endOfLine = lineEndIndices.get(currentRow);
    let afterSelection = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    };
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
function insertSpace() {
    insertBeforeSelection(" ");
}
let shiftMap = new Map();
// make a new blank node of type nodeType
function makeNew(nodeType) {
    if (nodeType == "word") {
        return {
            kind: "word",
            content: [],
            length: 0
        };
    }
    else if (nodeType == "definition") {
        return {
            kind: "definition",
            name: makeNew("word"),
            arguments: [],
            body: [],
            numberOfRows: 1
        };
    }
    else if (nodeType == "module") {
        return {
            kind: "module",
            contents: [],
            numberOfRows: 0
        };
    }
}
/*
let newModule = empty module
current selection = newModule
current view = newModule
mode = command
ui is totally blank
key = "f"

let newDef = empty def
ui = "define _" on first row (underscore indicates highlight), rest is blank
mode = insert
view = newModule
selection = newDef.name

module layout:
module has a start row and end row
when we add a def to a module, the def starts at (module.endRow + 2)
module.endRow = module.endRow + 2 + def.numberOfRows
*/
// if selection is type module,
// add a new blank function definition to the end of the current module
// select the (blank) function name
function addNewFunctionToModule() {
    if (selectedNode.kind == "module") {
        // tree: add blank function def to end of module
        let blankDef = makeNew("definition");
        addDefToModule(blankDef, selectedNode);
        currentMode = "insert";
        selectedNode = blankDef.name;
        // ui: add blank function def to end of module
        printExpression(blankDef);
    }
}
// only changes the tree, not the ui
function addDefToModule(newDef, currentModule) {
    currentModule.contents.push(newDef);
    newDef.firstRow = currentModule.numberOfRows + 2;
    currentModule.numberOfRows = currentModule.numberOfRows + 1 + newDef.numberOfRows;
}
function makeBlankWord(row, start) {
    let blankWord = {
        kind: "word",
        row: row,
        start: start,
        content: []
    };
    return blankWord;
}
// make a grid of divs with each one containing a space
// appends the grid to textBox div
function newDocument(textBox, width, height) {
    for (let row = 0; row < height; row++) {
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
function getDivAt(y, x) {
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
function shiftPositionRight(position, shift) {
    let newPosition = {
        y: position.row,
        x: position.x + shift
    };
    return newPosition;
}
function shiftIntervalRight(range, shift) {
    let row = range.row;
    let newRange = {
        row: row,
        start: range.start + shift,
        end: range.end + shift
    };
    return newRange;
}
function shiftIntervalDown(range, shift) {
    let newRange = {
        row: range.row + shift,
        start: range.start,
        end: range.end
    };
    return newRange;
}
function shiftInterval(range, rightShift, downShift) {
    let newRange = {
        row: range.row + downShift,
        start: range.start + rightShift,
        end: range.end + downShift
    };
    return newRange;
}
function shiftPositionDown(position, shift) {
    let newPosition = {
        y: position.row + shift,
        x: position.x
    };
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