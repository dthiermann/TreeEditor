let container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");

let textBox : HTMLElement = document.createElement("div");
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

type info = {
    mode: mode;
    selection: expression
}

type mode = "insert" | "command";

type letter = {
    kind: "letter";
    value: string;
    parent: word
}

type word = {
    kind: "word";
    content: letter[];
    parent: expression;
}

type application = {
    kind: "application";
    row: number;
    parent: expression;
    operator: expression;
    arguments: expression[];
}

type definition = {
    kind: "definition";
    name?: word;
    arguments?: word[];
    body?: expression[];
    parent?: expression;
}

type module = {
    kind: "module";
    contents: definition[];
}

type expression = letter | word | application | definition | module;


// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);

let defKeyWord = "define ";

let documentNode : expression = {
    kind: "module",
    contents: [],
};

let displayedNode = documentNode;

let state : info = {
    mode: "command",
    selection: documentNode
}



document.addEventListener("keydown", main);

// clear the display of all text and highlighting
function clearDisplay(documentHeight : number, documentWidth : number) {
    for (let row = 0; row < documentHeight; row ++) {
        for (let x = 0; x < documentWidth; x ++) {
            setCharAt(row, x, " ");
            unhighlightAt(row, x);
        }
    }

}

// this is the main entry point for the editor program
function main(e : KeyboardEvent) {
    e.preventDefault();
    let key = e.key;
    state = handleInput(key, state);
    console.log(documentNode);
    
}

function handleInput(key : string, state : info) : info {
    let newState = state;
    if (state.mode == "insert") {
        newState = insertMode(key, state.selection);
    }
    if (state.mode == "command") {
        newState = commandMode(key, state.selection);
    }
    return newState;
}

let commandMap = new Map();

// every function in the command map has to be type
// selection --> info
commandMap.set("f", addBlankDef);
commandMap.set("p", selectParentOfLetter);


let insertMap = new Map();
// every function in insert map needs to be type
// selection --> { mode, selection} : info
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

insertMap.set(";", escapeInsertMode);





function printExpression(expr : expression) {
    
}

// print String to the ui directly
// requires string to fit in row
function printString(str : string, row : number, x: number) {
    for (let i = x; i < str.length + x; i++) {
        setCharAt(row, i, str[i]);
    }
}

// print module to ui directly
function printModule(mod : module) {

}


function copyArrayToPosition(textArray : string[], newRow : number, newStart : number) {
    for (let i = 0; i < textArray.length; i ++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}



// set selectedNode = newSelection
// unhighlight the selected portion of ui
// highlight the new selected node
function setSelection(oldSelection: expression, newSelection : expression) : expression {
    return newSelection;
}

function commandMode(key : string, selection : expression) : info {
    if (commandMap.has(key)) {
        return commandMap.get(key)(selection);
    }
    else {
        return { mode: "command", selection };
    }
    
}

// handles user input when in insert mode
function insertMode(key : string, selection : expression) : info {
    // if key is not a letter or number, it should have an entry in the insertMap
    if (insertMap.has(key)) {
        return insertMap.get(key)(selection);
    }
    else {
        return insertAtSelection(key, selection);
    }
}

// inserting a node

// set value of cursor node to key
// make a new cursor node to the right of the old selection
// make this the new selection
// re render
function insertAtSelection(key : string, selectedNode : expression) : info {
    return { mode: "insert", selection: selectedNode };
}


function doNothing(selection : expression) {
    return true;
}


let shiftMap = new Map();


// change from insert mode to command mode
function escapeInsertMode(selection : expression) : info {
    return { mode: "command", selection: selection };
}

// mode = command
// text = define myfunction_
// -->
// mode = command
// define [myfunction]
function selectParentOfLetter(cursor : letter) : info {
    if (cursor.parent === null) {
        return { mode: "command", selection: cursor};
    }
    else {
        let newSelection = setSelection(cursor, cursor.parent);
        return { mode: "command", selection: newSelection };
    }
}
  

// make a grid of divs with each one containing a space
// appends the grid to textBox div
function newDocument(textBox : HTMLElement, width : number, height : number) {
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
function getCharAt(y : number, x : number) : string {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
        return "Out of bounds row index";
    }
    else {
        let charAtPosition = rowChildren[x].textContent;
        if (charAtPosition === null) {
            return "Out of bounds column index";
        }
        else {
            return charAtPosition;
        }
    }

}

// get div at (y,x) in grid
function getDivAt(y : number, x : number) {
    let rows = textBox.children;
    let rowChildren = rows[y].children;
    return rowChildren[x];
}

// set char at (y,x) to newChar
function setCharAt(y : number, x : number, newChar : string) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}

// highlight the rectangle at (y,x)
function highlightAt(row : number, x : number) {
    let position = getDivAt(row, x);
    position.setAttribute("id", "selection");
}

// remove highlighting from rectangle at (y,x)
function unhighlightAt(row : number, x : number) {
    let position = getDivAt(row, x);
    position.removeAttribute("id");
}


// START: code from here down will assume that the types do not store position info

// add blank def to document
// this version assumes that no position info is stored in the tree
// document is selected
// create a blank def, add that def to the document,
// add a child cursor node to def.name
// de-select document node
// mark that cursor node as being selected (in some way)
// render the blank def:
// print "define " to (0,0)
// highlight (0, defKeyWord.length)
function addBlankDef(document : module) {
    // create a blank def, add that def to the document,
    let blankDef : definition = {
        kind: "definition",
        parent: document,
    }

    let blankName : word = {
        kind: "word",
        parent: blankDef,
        content: [],
    }

    blankDef.name = blankName;

    // add a child cursor node to def.name
    let cursor : letter = {
        kind: "letter",
        parent: blankDef.name,
        value: " "
    }

    blankDef.name.content.push(cursor);

    // TODO: de-select document node
    // mark that cursor node as being selected (in some way)

    // render the blank def:
    // print "define " to (0,0)
    // highlight (0, defKeyWord.length)
    printString(defKeyWord, 0, 0);
    highlightAt(0, defKeyWord.length);

}