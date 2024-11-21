// simple version of application:
// user is working in a single file / module
var _a;
// TODO: add assertion that
// printing the current tree to the ui should match the current ui
// for testing purposes, make a ui that is a nested array grid
// TODO: for each document state, there is a different table of commands
// we want to make that table visible in the ui
// figure out what kind of position and size info is stored by different nodes
// possible views:
// -single file: list of function definitions
// -single function def: list of statements
// single file view: 
// def node stores the function starting line:
// the number of lines the function takes up can be calculated
// word node stores its start index, length can be calculated,
// row number can be calculated from parent
// application node stores its row number relative to the enclosing def
// assume application takes up at most 1 line
// each node can store all of its data, but then it has to update all of its data on each
// change to the tree
// or some data doesn't have to be stored but can be recalculated
// define _
// make a first " " child node of name
// set the selection to that child node
// then the rule for inserting is that the selected node
// is replaced by the key
// could have functions take in and return
// mode
// selectednode
// latest thought
// position info should only be stored when a node is actually displayed
// whenever the view changes, 
// user will only ever be editing a displayed node
// so whatever edit is being made 
var container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");
var textBox = document.createElement("div");
container.appendChild(textBox);
textBox.classList.add("textBox");
var commandTable = document.createElement("div");
container.appendChild(commandTable);
commandTable.classList.add("commandTable");
commandTable.textContent = "Commands";
// get the number of lines that the displayed node takes up from local storage
// use that number to determine how many lines the textbox should have
var storedSize = (_a = localStorage.getItem("displayed-node-size")) !== null && _a !== void 0 ? _a : "300";
var documentHeight = Math.max(300, parseInt(storedSize));
var documentWidth = 100;
// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);
var currentMode = "command";
var defKeyWord = "define ";
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
    }
}
var commandMap = new Map();
commandMap.set("f", addNewFunctionToModule);
// make a table to handle input
// mode, key, --> some function
var insertMap = new Map();
insertMap.set("Backspace", doNothing);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", doNothing);
insertMap.set("Enter", doNothing);
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
    var row = letter.parent.row;
    setCharAt(row, letter.x, letter.value);
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
// unhighlight the portion of the ui that node takes up
function unhighlightNode(node) {
    mapActionOverNode(unhighlightAt, node);
}
// highlight the portion of the ui that node takes up
function highlightNode(node) {
    mapActionOverNode(highlightAt, node);
}
// set selectedNode = newSelection
// unhighlight the selected portion of ui
// highlight the new selected node
function setSelection(newSelection) {
    unhighlightNode(selectedNode);
    selectedNode = newSelection;
    highlightNode(newSelection);
}
function shiftText(range, shift) {
    moveText(range, range.row, range.start + shift);
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
function doNothing() {
    return true;
}
var shiftMap = new Map();
// make a new blank node of type nodeType
function makeNew(nodeType) {
    if (nodeType == "word") {
        return makeNewWord();
    }
    else if (nodeType == "definition") {
        return makeNewDef();
    }
}
function makeNewDef() {
    var newNode = {
        kind: "definition",
        firstRow: 0,
        arguments: [],
        body: [],
        numberOfRows: 1,
        name: makeNewWord()
    };
    return newNode;
}
function makeNewWord() {
    var newWord = {
        kind: "word",
        content: [],
        row: 0,
        start: 0
    };
    return newWord;
}
// if selection is type module,
// add function to module
// display only that function
// change mode to insert
// select blank function name so user can start typing the name
function addNewFunctionToModule() {
    if (selectedNode.kind == "module") {
        // tree: add blank function def to  module
        var blankDef = makeNewDef();
        addDefToModule(blankDef, selectedNode);
        // ui: display the def
        printExpression(blankDef);
        currentMode = "insert";
        // add a " " node as the first letter of name
        blankDef.name.content[0] = {
            kind: "letter",
            parent: blankDef.name,
            x: defKeyWord.length,
            value: " "
        };
        // tree and ui: change the selection to this " " node
        // visible result: "define _" where the underscore is selected
        setSelection(blankDef.name.content[0]);
    }
}
// make the provided def be the last child of the module
function addDefToModule(newDef, currentModule) {
    // set child and parent references correctly
    currentModule.contents.push(newDef);
    newDef.parent = currentModule;
    // 
    if (currentModule.numberOfRows == 0) {
        newDef.firstRow = 0;
        currentModule.numberOfRows = newDef.numberOfRows;
    }
    else {
        newDef.firstRow = currentModule.numberOfRows + 2;
        currentModule.numberOfRows = currentModule.numberOfRows + 1 + newDef.numberOfRows;
    }
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
// takes in a function (row, x) --> perform some action
// apply it to all the positions occupied by a node
// TODO: implement for all types of expressions
// alternate implementation idea: action: div -> div  (pure function)
// for each position div in the node, set letterDiv = action letterDiv
function mapActionOverNode(action, node) {
    if (node.kind == "word") {
        var row = node.row;
        var end = node.start + node.content.length;
        for (var i = node.start; i < end; i++) {
            action(row, i);
        }
    }
    if (node.kind == "letter") {
        var row = node.parent.row;
        console.log("row: ", row);
        console.log("x: ", node.x);
        action(row, node.x);
    }
}
