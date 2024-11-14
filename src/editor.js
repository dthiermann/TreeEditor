// simple version of application:
// user is working in a single file / module
var _a;
var textBox = document.createElement("div");
document.body.appendChild(textBox);
textBox.classList.add("textBox");
// get the number of lines that the displayed node takes up from local storage
// use that number to determine how many lines the textbox should have
var storedSize = (_a = localStorage.getItem("displayed-node-size")) !== null && _a !== void 0 ? _a : "300";
var documentHeight = Math.max(300, parseInt(storedSize));
var documentWidth = 100;
// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);
var currentMode = "command";
var documentNode = {
    kind: "module",
    contents: [],
    numberOfRows: 0
};
var displayedNode = documentNode;
var selectedNode = documentNode;
document.addEventListener("keydown", handleInput);
// clear the display of all text and highlighting
function clearDisplay(documentHeight, documentWidth) {
    for (var row = 0; row < documentHeight; row++) {
        for (var x = 0; x < documentWidth; x++) {
            setCharAt(row, x, " ");
            unhighlightAt(row, x);
        }
    }
}
// this is the main entry point for the editor program
function handleInput(e) {
    e.preventDefault();
    var key = e.key;
    if (currentMode == "insert") {
        insertMode(key);
    }
    if (currentMode == "command") {
        commandMode(key);
        console.log("command mode input sensed");
    }
}
var commandMap = new Map();
commandMap.set("f", addNewFunctionToModule);
// make a table to handle input
// mode, key, --> some function
var insertMap = new Map();
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
var documentLastRow = 0;
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
    for (var i = x; i < str.length + x; i++) {
        setCharAt(row, i, str[i]);
    }
}
// print module to ui directly
function printModule(mod) {
}
// node --> print to ui at the location specified by node position attributes
function printDef(def) {
    var defKeyWord = "define ";
    printString(defKeyWord, def.firstRow, 0);
    printWord(def.name);
    // To Do: print arguments and body of definition
}
// print word node onto ui
function printWord(word) {
    for (var i = 0; i < word.content.length; i++) {
        printLetter(word.content[i]);
    }
}
// print letter to ui
function printLetter(letter) {
    setCharAt(letter.row, letter.x, letter.value);
}
var currentSelection = {
    row: 0,
    start: 0,
    end: 0
};
function shiftBlockDown(section, shift) {
    for (var i = section.lastRow; i >= section.firstRow; i--) {
        var line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        moveText(line, i + shift, 0);
    }
    for (var i = section.firstRow; i < section.firstRow + shift; i++) {
        var line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        setIntervalText(line, " ");
    }
}
// set every char in an interval to the same char: letter
function setIntervalText(range, letter) {
    for (var i = range.start; i <= range.end; i++) {
        setCharAt(range.row, i, letter);
    }
}
// copy the text from an interval into an array
// return that array
function copyTextToArray(range) {
    var text = [];
    for (var i = range.start; i <= range.end; i++) {
        text.push(getCharAt(range.row, i));
    }
    return text;
}
function copyArrayToPosition(textArray, newRow, newStart) {
    for (var i = 0; i < textArray.length; i++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}
// move the text in range to newStart
// this leaves whitespace in some or all of range
// this will overwrite preexisting text after newStart
function moveText(range, newRow, newStart) {
    var textArray = copyTextToArray(range);
    setIntervalText(range, " ");
    copyArrayToPosition(textArray, newRow, newStart);
}
function unhighlightInterval(range) {
    for (var i = range.start; i <= range.end; i++) {
        unhighlightAt(range.row, i);
    }
}
function highlightInterval(range) {
    for (var i = range.start; i <= range.end; i++) {
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
    var currentRow = currentSelection.row;
    var currentStart = currentSelection.start;
    var currentEnd = currentSelection.end;
    var selectionLength = currentEnd - currentStart + 1;
    var endOfLine = lineEndIndices.get(currentRow);
    var newCursor = {
        start: currentStart - 1,
        end: currentStart - 1,
        row: currentRow
    };
    var afterSelection = {
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
    var row = currentSelection.row;
    // shift every row below down by 1
    if (row < documentLastRow) {
        var everythingBelow = {
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
    var restOfLine = {
        row: currentSelection.row,
        start: currentSelection.start,
        end: lineEndIndices.get(currentSelection.row)
    };
    moveText(restOfLine, currentSelection.row + 1, 0);
    // move selection (highlighting + variable) to start of new line
    var newSelection = {
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
var lineEndIndices = new Map();
lineEndIndices.set(0, 0);
function insertBeforeSelection(key) {
    var currentRow = currentSelection.row;
    var endOfLine = lineEndIndices.get(currentRow);
    var afterSelection = {
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
var shiftMap = new Map();
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
    console.log("add new function");
    if (selectedNode.kind == "module") {
        // tree: add blank function def to end of module
        var blankDef = makeNew("definition");
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
    if (currentModule.numberOfRows == 0) {
        newDef.firstRow = 0;
        currentModule.numberOfRows = newDef.numberOfRows;
    }
    else {
        newDef.firstRow = currentModule.numberOfRows + 2;
        currentModule.numberOfRows = currentModule.numberOfRows + 1 + newDef.numberOfRows;
    }
}
function makeBlankWord(row, start) {
    var blankWord = {
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
    console.log(y);
    console.log(x);
    console.log(newChar);
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}
function shiftChar(row, col, rowShift, colShift) {
    var letter = getCharAt(row, col);
    setCharAt(row, col, " ");
    setCharAt(row + rowShift, col + colShift, letter);
}
function shiftPositionRight(position, shift) {
    var newPosition = {
        y: position.row,
        x: position.x + shift
    };
    return newPosition;
}
function shiftIntervalRight(range, shift) {
    var row = range.row;
    var newRange = {
        row: row,
        start: range.start + shift,
        end: range.end + shift
    };
    return newRange;
}
function shiftIntervalDown(range, shift) {
    var newRange = {
        row: range.row + shift,
        start: range.start,
        end: range.end
    };
    return newRange;
}
function shiftInterval(range, rightShift, downShift) {
    var newRange = {
        row: range.row + downShift,
        start: range.start + rightShift,
        end: range.end + downShift
    };
    return newRange;
}
function shiftPositionDown(position, shift) {
    var newPosition = {
        y: position.row + shift,
        x: position.x
    };
    return newPosition;
}
// highlight the rectangle at (y,x)
function highlightAt(row, x) {
    var position = getDivAt(row, x);
    position.setAttribute("id", "selection");
}
// remove highlighting from rectangle at (y,x)
function unhighlightAt(row, x) {
    var position = getDivAt(row, x);
    position.removeAttribute("id");
}
