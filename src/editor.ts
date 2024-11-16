// simple version of application:
// user is working in a single file / module

// TODO: add assertion that
// printing the current tree to the ui should match the current ui
// for testing purposes, make a ui that is a nested array grid

// TODO: for each document state, there is a different table of commands
// we want to make that table visible in the ui

// figure out what kind of position and size info is stored by different nodes
// possible views:
// -single file: list of function definitions
// -single function def: list of statements

// single file view: the entire syntax tree is displayed
// so it makes sense for every node to have position info
// sufficient to store position info relative to the current function

// def node stores the function starting line:
// the number of lines the function takes up can be calculated

// word node stores its start index, length can be calculated,
// row number can be calculated from parent

// application node stores its row number relative to the enclosing def
// assume application takes up at most 1 line





let container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");

let textBox = document.createElement("div");
container.appendChild(textBox);
textBox.classList.add("textBox");

let commandTable = document.createElement("div");
container.appendChild(commandTable);
commandTable.classList.add("commandTable");
commandTable.textContent = "Commands";

// get the number of lines that the displayed node takes up from local storage
// use that number to determine how many lines the textbox should have
let storedSize = localStorage.getItem("displayed-node-size") ?? "300";
let documentHeight = Math.max(300, parseInt(storedSize));
let documentWidth = 100;

// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);

let currentMode = "command";

let documentNode : expression = {
    kind: "module",
    contents: [],
    numberOfRows: 0
};

let displayedNode = documentNode;
let selectedNode : expression = documentNode;


document.addEventListener("keydown", handleInput);

// clear the display of all text and highlighting
function clearDisplay(documentHeight, documentWidth) {
    for (let row = 0; row < documentHeight; row ++) {
        for (let x = 0; x < documentWidth; x ++) {
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

insertMap.set("Backspace", doNothing);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", doNothing);
insertMap.set("Enter", doNothing);


let documentLastRow = 0;

type mode = "insert" | "command";

type state = {
    selection: expression;
    mode: mode;
}

type letter = {
    value: string;
    previous?: letter;
    next?: letter,
    parent?: word
    row?: number,
    x?: number
}

type word = {
    kind: "word";
    content: letter[];
    parent: expression;
    row?: number;
    start?: number;
}

type expression = word | application | definition | module;

// the statements of the program are applications
type application = {
    kind: "application";
    row: number;
    parent: expression;
    operator: expression;
    arguments: expression[];
}

type definition = {
    kind: "definition";
    name: word;
    arguments: word[];
    body: expression[];
    firstRow?: number;
    parent: expression;
}

type module = {
    kind: "module";
    contents: definition[];
    numberOfRows: number;
}



function printExpression(expr : expression) {
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
function printString(str : string, row : number, x: number) {
    for (let i = x; i < str.length + x; i++) {
        setCharAt(row, i, str[i]);
    }
}
// print module to ui directly
function printModule(mod : module) {

}
// node --> print to ui at the location specified by node position attributes
function printDef(def : definition) {
    let defKeyWord = "define ";
    printString(defKeyWord, def.firstRow, 0);
    printWord(def.name);
    // To Do: print arguments and body of definition
}

// print word node onto ui
function printWord(word : word) {
    for (let i = 0; i < word.content.length; i++) {
        printLetter(word.content[i]);
    }
}

// print letter to ui
function printLetter(letter : letter) {
    setCharAt(letter.row, letter.x, letter.value);
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

type Block = {
    firstRow: number;
    lastRow: number;
}

let currentSelection = {
    row: 0,
    start: 0,
    end: 0
}

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

// unhighlight the portion of the ui that node takes up
function unhighlightNode(node : expression) {
    mapActionOverNode(unhighlightAt, node);
}

// highlight the portion of the ui that node takes up
function highlightNode(node : expression) {
    mapActionOverNode(highlightAt, node);
}

// set selectedNode = newSelection
// unhighlight the selected portion of ui
// highlight the new selected node
function setSelection(newSelection : expression) {
    unhighlightNode(selectedNode);
    selectedNode = newSelection;

    highlightNode(newSelection);
}

function shiftText(range : Interval, shift) {
    moveText(range, range.row, range.start + shift);
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
lineEndIndices.set(0,0);

function doNothing() {
    return true;
}


let shiftMap = new Map();


// make a new blank node of type nodeType
function makeNew(nodeType) {
    if (nodeType == "word") {
        return {
            kind: "word",
            content: [],
            length: 0
        }
    }
    else if (nodeType == "definition") {
        return {
            kind: "definition",
            name: makeNew("word"),
            arguments: [],
            body: [],
            numberOfRows: 1
        }
    }
    else if (nodeType == "module") {
        return {
            kind: "module",
            contents: [],
            numberOfRows: 0
        }
    }
}

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

        // tree and ui: change the selection to new function name
        // visible result: "define _" where the underscore is selected
        setSelection(blankDef.name);


    }
    
}

// only changes the tree, not the ui
function addDefToModule(newDef : definition, currentModule : module) {
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


// make a grid of divs with each one containing a space
// appends the grid to textBox div
function newDocument(textBox, width, height) {
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
function getCharAt(y : number, x : number) {
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

// takes in a function (row, x) --> perform some action
// apply it to all the positions occupied by a node
// TODO: implement for all types of expressions
// alternate implementation idea: action: div -> div  (pure function)
// for each position div in the node, set letterDiv = action letterDiv
function mapActionOverNode(action, node) {
    if (node.kind == "word") {
        let row = node.row;
        let end = node.start + node.length;
        for (let i = node.start; i < end; i++) {
            action(row, i);
        }
    }
}