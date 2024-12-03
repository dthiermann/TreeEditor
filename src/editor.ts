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
    content: string;
    parent: word
}

type word = {
    kind: "word";
    content: letter[];
    parent: expression;
}

type definition = {
    kind: "definition";
    name?: word;
    arguments: word[];
    body?: expression[];
    parent: expression;
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
        }
    }

}

// this is the main entry point for the editor program
function main(e : KeyboardEvent) {
    e.preventDefault();
    let key = e.key;
    // update the mode and selection and tree:
    state = handleInput(key, state);
    // update the ui:
    // TODO: print (displayedNode)
    printModule(documentNode, state.selection);
    // console.log(documentNode);
    
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
insertMap.set("Backspace", backSpace);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", insertSpace);
insertMap.set("Enter", doNothing);

insertMap.set(";", escapeInsertMode);





function printExpression(expr : expression) {
    
}

// print String to the ui directly
// requires string to fit in row
function printString(str : string, row : number, x: number) {
    for (let i = 0; i < str.length; i++) {
        setCharAt(row, x + i, str[i]);
    }
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
        return insertAtSelectionInTree(key, selection);
    }
}

// Right now the render part of this function only works for the following case:
// define _
// key = "a"
// --> define a_
// this function only edits the tree
function insertAtSelectionInTree(key : string, selectedNode : expression) : info {
    if (selectedNode.kind === "letter") {
        selectedNode.content = key;
        // tree: add a new blank cursor to the right of selectedNode
        let parentWord = selectedNode.parent;
        let blankSpace : letter = {
            kind: "letter",
            parent: parentWord,
            content: " ",
        }
        parentWord.content.push(blankSpace);
        

        return { mode: "insert", selection: blankSpace};
    }

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
function addBlankDef(document : module) : info {
    // create a blank def, add that def to the document,
    let blankDef : definition = {
        kind: "definition",
        parent: document,
        arguments: []
    }

    document.contents.push(blankDef);

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
        content: " "
    }

    blankDef.name.content.push(cursor);

    return {mode: "insert", selection: cursor }

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

    let restOfLine = [];
    printString(defKeyWord, 0, 0);

    let name : word = {
        kind: "word",
        parent: def,
        content: []
    }

    if (def.name != undefined) {
        name = def.name;
    }

    restOfLine = [name].concat(def.arguments);
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
    for (let i = 0; i < word.content.length; i ++) {
        if (word.content[i] === selectedNode) {
            highlightAt(row, x + i);
        }
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
    if (parent.kind === "definition" || parent.kind === "module") {
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
    if (myWord.parent.kind === "definition") {
        return myWord.parent.name === myWord;
    }
    else {
        return false;
    }
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
}


function insertSpace(cursor : letter) : info {
    // if cursor is at end of definition name
    // delete cursor node
    // add a new argument to the front of argument list
    // make cursor node be the child of new argument

    if (isAtEndOfDefName(cursor) && cursor.parent.parent.kind === "definition") {
        deleteNode(cursor);
        let def = cursor.parent.parent;
        let newArg : word = {
            kind: "word",
            content: [],
            parent: def
        }

        def.arguments.unshift(newArg);

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
    let possibleDef = myWord.parent;
    if (possibleDef.kind === "definition") {
        return (possibleDef.arguments.includes(myWord));
    }
    else {
        return false;
    }
}

// assertion: typing a character in insert mode and then hitting backspace should revert
// the tree back to the original state (and the ui)

// possible simpler directions for project:
// could make a basic text editor with backend and collaborating features
// could make a tree editor for text docs like typst/tex

// has right sibling
// has left sibling
// get right sibling
// get left sibling

// inserting nodes
// first you make the newNode or get a ref to it
// then you have an insert newNode relativePosition existingNode

// tree:
// optional attributes, vs non-optional (possibly null) vs 