let container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");

let textBox : HTMLElement = document.createElement("div");
container.appendChild(textBox);
textBox.classList.add("textBox");

let commandTable = document.createElement("div");
container.appendChild(commandTable);
commandTable.classList.add("commandTable");


// eventually, commandMap and insertMap will have type
// Map<string, info => info >
// or possibly
// Map<string, sel : expr --> expr >
// currently, code assumes Map<string, sel : expression -> info >
let commandMap = new Map();

commandMap.set("f", addBlankDef);
commandMap.set("p", selectParentOfLetter);
commandMap.set("i", enterInsertMode);
commandMap.set("j", selectLeftSibling);
commandMap.set("k", selectRightSibling);


let insertMap = new Map();

insertMap.set("Backspace", backSpace);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set(" ", insertSpace);
insertMap.set("Enter", doNothing);

insertMap.set(";", escapeInsertMode);

function enterInsertMode(selection : expression) : info {
    return {mode: "insert", selection: selection};
}


// for each (key, value) pair in command map
// add a row to command table: row.textContent = key + " " + value
function makeCommandTable() {
    let modeDisplay = document.createElement("div");
    commandTable.appendChild(modeDisplay);
    modeDisplay.classList.add("tableRow");
    modeDisplay.textContent = "mode:  command";

    commandMap.forEach((value, key) => {
        let row = document.createElement("div");
        row.classList.add("tableRow");
        row.textContent = `${key}     ${value.name}`;
        commandTable.appendChild(row);

    })
}

let insertTable = document.createElement("div");
insertTable.classList.add("commandTable");


function makeInsertTable() {
    insertMap.forEach((value, key) => {
        let row = document.createElement("div");
        row.classList.add("tableRow");
        row.textContent = `${key}    ${value.name}`;
        insertTable.appendChild(row);
    })
}

makeCommandTable();
makeInsertTable();

let documentHeight = 300;
let documentWidth = 80;

type nodeType = "defName" | "parameter" | "defKeyword";
type color = "red" | "blue" | "green" | "black";

let colorTable : Map<nodeType, color> = new Map();
colorTable.set("defName", "red");
colorTable.set("parameter", "blue");
colorTable.set("defKeyword", "green");

function getColor(key : nodeType) : color {
    return colorTable.get(key) ?? "black";
}

type info = {
    mode: mode;
    selection: expression
}

type mode = "insert" | "command";

type letter = {
    kind: "letter";
    content: string;
    parent: word
}

type word = defName | parameter

type defName = {
    kind: "defName";
    content: letter[];
    parent: definition;
}

type parameter = {
    kind: "parameter";
    content: letter[];
    parent: definition;
}
type definition = {
    kind: "definition";
    name: defName | null;
    parameters: parameter[];
    body?: expression[];
    parent: module;
}

type module = {
    kind: "module";
    contents: definition[];
}

// expression could be a generic type that takes children's type as input
// letter = expression string
// word = expression letter
// def = expression (word, word[], expression[])

// every type of node has a parent (except root) and a list of children
// default null values for each type
// could create a cursor type
// 
type expression = letter | word | definition | module;


// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);

let defKeyWord = "define ";

let documentNode : module = {
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
            setTextColorAt(row, x, "black");
        }
    }

}

testUIfunctions();

function testUIfunctions() {
    console.log(commandMap.get("f").name);
}
// this is the main entry point for the editor program
function main(e : KeyboardEvent) {
    e.preventDefault();
    let key = e.key;
    // console.log(key);
    // update the mode and selection and tree:
    state = handleInput(key, state);
    // update the ui:
    printModule(documentNode, state.selection);
    updateTable(state.mode);
}

function updateTable(currentMode : mode) {
    // remove current table from ui without getting rid of its info
    let currentTable = document.getElementsByClassName("commandTable")[0];
    container.removeChild(currentTable);
    
    if (currentMode === "insert") {
        container.appendChild(insertTable);
    }
    else if (currentMode === "command") {
        container.appendChild(commandTable);
    }
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





function printExpression(expr : expression) {
    
}

// print String to the ui directly
// requires string to fit in row
function printString(str : string, row : number, x: number, color: color) {
    for (let i = 0; i < str.length; i++) {
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, str[i]);
        
    }
}

function setTextColorAt(row : number, x: number, color : color) {
    let div = getDivAt(row, x);
    if (div !== null) {
        div.style.color = color;
    }
    
}

function copyArrayToPosition(textArray : string[], newRow : number, newStart : number) {
    for (let i = 0; i < textArray.length; i ++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
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
        return insertAtSelectionInTree(key, selection);
    }
}

function insertAtSelectionInTree(key : string, selection : expression) : info {
    if (selection.kind === "letter") {
        return insertAtCursorInTree(key, selection);
    }
    else {
        return {mode: "insert", selection: selection};
    }

}

// assuming selection is a single empty space (cursor)
function insertAtCursorInTree(key : string, cursor : letter) : info {
    // decompose into steps:
    // at cursor location, set letter value to key
    // create a new cursor 
    cursor.content = key;

    // tree: add a new blank cursor to the right of selectedNode
    let parentWord = cursor.parent;

    let newCursor = addCursorToEndOfWord(parentWord);
    
    return { mode: "insert", selection: newCursor };
}

// adds cursor (blank space letter node) as last child of word
// returns the cursor
function addCursorToEndOfWord(parent : word) {
    let blankSpace : letter = {
        kind: "letter",
        parent: parent,
        content: " ",
    }
    parent.content.push(blankSpace);
    return blankSpace;
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
function selectParentOfLetter(char : letter) : info {
    // if char is just a blank cursor, we want to delete it
    let newSelection = char.parent
    if (char.content == " ") {
        deleteNode(char);
    }
    return { mode: "command", selection: newSelection };
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
function getDivAt(y : number, x : number) : HTMLElement | null {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
        return null;
    }
    else {
        let divAtPosition = rowChildren[x];
        if (divAtPosition === null) {
            return null;
        }
        else {
            let divElement = divAtPosition as HTMLElement;
            return divElement;
        }
    }
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
    if (position !== null) {
        position.setAttribute("id", "selection");
    }
    
}

// remove highlighting from rectangle at (y,x)
function unhighlightAt(row : number, x : number) {
    let position = getDivAt(row, x);
    if (position !== null) {
        position.removeAttribute("id");
    }
    
}


// add blank def to document
// document is selected
// create a blank def, add that def to the document,
// add a child cursor node to def.name
// de-select document node
// mark that cursor node as being selected (in some way)
function addBlankDef(document : module) : info {

    // create a blank def, add that def to the document,
    let blankDef = addBlankDefToModule(document);
    
    // create a blank name, add that name to the def,
    let blankName = addBlankNameToDef(blankDef);

    // add a child cursor node to blankName
    let cursor = addCursorToEndOfWord(blankName);

    return {mode: "insert", selection: cursor };

}

function addBlankDefToModule(mod : module) : definition {
    let blankDef : definition = {
        kind: "definition",
        parent: mod,
        name: null,
        parameters: []
    }
    mod.contents.push(blankDef);
    return blankDef;
}

// prints the first def child of mod
// doesn't highlight any children, even if they are selected
function printModule(mod : module, selectedNode : expression) {
    if (mod.contents[0] === null) {

    }
    else {
        printDef(mod.contents[0], selectedNode);
    }
}

// print def and check children to see if any are the selection
// if they are, highlights them,
function printDef(def : definition, selectedNode : expression) {
    clearDisplay(documentHeight, documentWidth);

    printString(defKeyWord, 0, 0, getColor("defKeyword"));

    let name : defName = {
        kind: "defName",
        parent: def,
        content: [],
    }

    if (def.name != null) {
        name = def.name;
    }

    let nameList : word[] = [name];
    let parameters = def.parameters as word[];

    let restOfLine = nameList.concat(parameters);
   
    printListOfWords(restOfLine, 0, defKeyWord.length, selectedNode);

}

// should print a list of words on one line, separating them by spaces
function printListOfWords(words : word[], row: number, x: number, selectedNode : expression) {
    let position = x;
    words.forEach(word => {
        if (word === selectedNode) {
            printAndHighlightWord(word, row, position);
        }
        else {
            printWord(word, row, position, selectedNode);
        }
        position = position + word.content.length + 1;
    })
}



// prints word and highlights any selected letters
function printWord(word : word, row : number, x : number, selectedNode : expression) {
    let color = getColor(word.kind);
    for (let i = 0; i < word.content.length; i ++) {
        if (word.content[i] === selectedNode) {
            highlightAt(row, x + i);
        }
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, word.content[i].content);
    }
    
}


// prints and highlights entire word
function printAndHighlightWord(word : word, row : number, x : number) {
    for (let i = 0; i < word.content.length; i ++) {
        setCharAt(row, x + i, word.content[i].content);
        highlightAt(row, x + i);
    }
}

// define sum f_
// -->
// define sum _
function backSpace(cursor : letter) : info {
    // if cursor has a left sibling, we want to get it
    let i = getIndexInList(cursor) - 1;
    let word = cursor.parent;
    let leftSibling = word.content[i];

    // delete the letter before cursor
    leftSibling.content = " ";

    // remove the old cursor node from the tree
    word.content.splice(i + 1, 1);

    // change the selection to left sibling
    return {mode : "insert", selection : leftSibling};
}

// for a node in a list, get its index
function getIndexInList(child : letter | word) : number {
    let parent = child.parent;
    let index = 0;
    if (parent.kind === "definition") {
        return 0;
    }
    else {
        for (let i = 0; i < parent.content.length; i++) {
            if (parent.content[i] === child) {
                index = i;
            }
        }
        return index;
    }
    
}

function isAtEndOfWord(cursor : letter) : boolean {
    let word = cursor.parent;
    let isLast = word.content.length === getIndexInList(cursor) + 1;
    return isLast;
}

function isNameOfSomeDef(myWord : word) : boolean {
    return myWord.kind === "defName";
}

// is cursor the last letter in a name of a definition
function isAtEndOfDefName(cursor : letter) : boolean {
    let word = cursor.parent;
    return isNameOfSomeDef(word) && isAtEndOfWord(cursor);
}

// removes node from parent's list of children
// hopefully gets garbage collected
function deleteNode(node : expression) {
    if (node.kind === "letter") {
        let i = getIndexInList(node);
        node.parent.content.splice(i, 1);

    }
    else if (node.kind === "defName") {
        let def = node.parent;
        // set defname to blank name
        let blankName = addBlankNameToDef(def);
        addCursorToEndOfWord(blankName);

    }
}

function addBlankNameToDef(def : definition) : defName {
    let blankName : defName = {
        kind: "defName",
        content: [],
        parent: def
    }
    def.name = blankName;
    return blankName;
}

function insertSpace(cursor : letter) : info {
    // if cursor is at end of definition name
    // delete cursor node
    // add a new argument to the front of argument list
    // make cursor node be the child of new argument

    if (isAtEndOfDefName(cursor) && cursor.parent.kind === "defName") {
        let def = cursor.parent.parent;
        deleteNode(cursor);
        let newArg : parameter = {
            kind: "parameter",
            content: [],
            parent: def,
        }

        def.parameters.unshift(newArg);

        let newCursor : letter = {
            kind: "letter",
            content: " ",
            parent: newArg,
        }

        newArg.content.push(newCursor);

        return { mode: "insert", selection: newCursor};

    }
    else if (isAtEndOfArg(cursor)) {
        // delete cursor node
        // insert a new blank argument to the right
        // add a cursor node child to this argument
        deleteNode(cursor);
        let args = cursor.parent;
        
        

    }
    return { mode: "insert", selection: cursor};
}

// checks to see if cursor is at the end of one of the arguments in definition
// Ex: define myfunc hello_ there --> true
function isAtEndOfArg(cursor : letter) : boolean {
    let word = cursor.parent;
    return isArgOfSomeDef(word) && isAtEndOfWord(cursor);
}

// checks if myWord is one of the arguments of some function definition
function isArgOfSomeDef(myWord : word) : boolean {
    return (myWord.kind === "parameter")
}


// if node has a rightSibling, return it,
// otherwise return original node
// not implemented for modules or defs yet
function getRightSibling(node : expression) : expression {
    if (node.kind === "defName") {
        return node.parent.parameters[0];
    }
    else if (node.kind === "parameter") {
        let i = getIndexInList(node);
        let parameters = node.parent.parameters;
        if (i < parameters.length - 1) {
            return node.parent.parameters[i + 1];
        }
        else {
            return node;
        }
    }
    else if (node.kind === "letter") {
        let i = getIndexInList(node);
        let letterList = node.parent.content;
        if (i < letterList.length - 1) {
            return letterList[i+1];
        }
        else {
            return node;
        }
    }
    else {
        return node;
    }
}

// get Left Sibling if node has one
function getLeftSibling(node : expression) : expression {
    if (node.kind === "defName") {
        return node;
    }
    else if (node.kind === "parameter") {
        let i = getIndexInList(node);
        let parameters = node.parent.parameters;
        if (i > 0) {
            return node.parent.parameters[i - 1];
        }
        else {
            return node.parent.name ?? node;
        }
    }
    else if (node.kind === "letter") {
        let i = getIndexInList(node);
        let letterList = node.parent.content;
        if (i > 0) {
            return letterList[i - 1];
        }
        else {
            return node;
        }
    }
    else {
        return node;
    }
}

function selectRightSibling(selection : expression) : info {
    let rightSibling = getRightSibling(selection);
    return { mode: "command", selection: rightSibling};

}

function selectLeftSibling(selection : expression) : info {
    let leftSibling = getLeftSibling(selection);
    return { mode: "command", selection: leftSibling }
}


function insertBlankRightSibling(selection : expression)  {

}