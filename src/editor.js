"use strict";
var container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");
var textBox = document.createElement("div");
container.appendChild(textBox);
textBox.classList.add("textBox");
var commandTable = document.createElement("div");
container.appendChild(commandTable);
commandTable.classList.add("commandTable");
var commandMap = new Map();
// every function in the command map has to be type
// selection --> info
commandMap.set("f", addBlankDef);
commandMap.set("p", selectParentOfLetter);
var insertMap = new Map();
// every function in insert map needs to be type
// selection --> { mode, selection} : info
insertMap.set("Backspace", backSpace);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set(" ", insertSpace);
insertMap.set("Enter", doNothing);
insertMap.set(";", escapeInsertMode);
// commandtable: has a row for mode
// has a row for each command
// for each (key, value) pair in command map
// add a row to command table: row.textContent = key + " " + value
function makeCommandTable() {
    var modeDisplay = document.createElement("div");
    commandTable.appendChild(modeDisplay);
    modeDisplay.classList.add("tableRow");
    modeDisplay.textContent = "mode:  command";
    commandMap.forEach(function (value, key) {
        var row = document.createElement("div");
        row.classList.add("tableRow");
        row.textContent = "".concat(key, "     ").concat(value.name);
        commandTable.appendChild(row);
    });
}
var insertTable = document.createElement("div");
insertTable.classList.add("commandTable");
function makeInsertTable() {
    insertMap.forEach(function (value, key) {
        var row = document.createElement("div");
        row.classList.add("tableRow");
        row.textContent = "".concat(key, "    ").concat(value.name);
        insertTable.appendChild(row);
    });
}
makeCommandTable();
makeInsertTable();
var documentHeight = 300;
var documentWidth = 80;
var colorTable = new Map();
colorTable.set("defName", "red");
colorTable.set("parameter", "blue");
colorTable.set("defKeyword", "green");
function getColor(key) {
    var _a;
    return (_a = colorTable.get(key)) !== null && _a !== void 0 ? _a : "black";
}
// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);
var defKeyWord = "define ";
var documentNode = {
    kind: "module",
    contents: [],
};
var displayedNode = documentNode;
var state = {
    mode: "command",
    selection: documentNode
};
document.addEventListener("keydown", main);
// clear the display of all text and highlighting
function clearDisplay(documentHeight, documentWidth) {
    for (var row = 0; row < documentHeight; row++) {
        for (var x = 0; x < documentWidth; x++) {
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
function main(e) {
    e.preventDefault();
    var key = e.key;
    // console.log(key);
    // update the mode and selection and tree:
    state = handleInput(key, state);
    // update the ui:
    printModule(documentNode, state.selection);
    updateTable(state.mode);
}
function updateTable(currentMode) {
    // remove current table from ui without getting rid of its info
    var currentTable = document.getElementsByClassName("commandTable")[0];
    container.removeChild(currentTable);
    if (currentMode === "insert") {
        container.appendChild(insertTable);
    }
    else if (currentMode === "command") {
        container.appendChild(commandTable);
    }
}
function handleInput(key, state) {
    var newState = state;
    if (state.mode == "insert") {
        newState = insertMode(key, state.selection);
    }
    if (state.mode == "command") {
        newState = commandMode(key, state.selection);
    }
    return newState;
}
function printExpression(expr) {
}
// print String to the ui directly
// requires string to fit in row
function printString(str, row, x, color) {
    for (var i = 0; i < str.length; i++) {
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, str[i]);
    }
}
function setTextColorAt(row, x, color) {
    var div = getDivAt(row, x);
    if (div !== null) {
        div.style.color = color;
    }
}
function copyArrayToPosition(textArray, newRow, newStart) {
    for (var i = 0; i < textArray.length; i++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}
function commandMode(key, selection) {
    if (commandMap.has(key)) {
        return commandMap.get(key)(selection);
    }
    else {
        return { mode: "command", selection: selection };
    }
}
// handles user input when in insert mode
function insertMode(key, selection) {
    // if key is not a letter or number, it should have an entry in the insertMap
    if (insertMap.has(key)) {
        return insertMap.get(key)(selection);
    }
    else {
        return insertAtSelectionInTree(key, selection);
    }
}
function insertAtSelectionInTree(key, selection) {
    if (selection.kind === "letter") {
        return insertAtCursorInTree(key, selection);
    }
    else {
        return { mode: "insert", selection: selection };
    }
}
// assuming selection is a single empty space (cursor)
function insertAtCursorInTree(key, cursor) {
    // decompose into steps:
    // at cursor location, set letter value to key
    // create a new cursor 
    cursor.content = key;
    // tree: add a new blank cursor to the right of selectedNode
    var parentWord = cursor.parent;
    var newCursor = addCursorToEndOfWord(parentWord);
    return { mode: "insert", selection: newCursor };
}
// adds cursor (blank space letter node) as last child of word
// returns the cursor
function addCursorToEndOfWord(parent) {
    var blankSpace = {
        kind: "letter",
        parent: parent,
        content: " ",
    };
    parent.content.push(blankSpace);
    return blankSpace;
}
function doNothing(selection) {
    return true;
}
var shiftMap = new Map();
// change from insert mode to command mode
function escapeInsertMode(selection) {
    return { mode: "command", selection: selection };
}
// mode = command
// text = define myfunction_
// -->
// mode = command
// define [myfunction]
function selectParentOfLetter(char) {
    // if char is just a blank cursor, we want to delete it
    var newSelection = char.parent;
    if (char.content == " ") {
        deleteNode(char);
    }
    return { mode: "command", selection: newSelection };
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
    if (rowChildren === null) {
        return "Out of bounds row index";
    }
    else {
        var charAtPosition = rowChildren[x].textContent;
        if (charAtPosition === null) {
            return "Out of bounds column index";
        }
        else {
            return charAtPosition;
        }
    }
}
// get div at (y,x) in grid
function getDivAt(y, x) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
        return null;
    }
    else {
        var divAtPosition = rowChildren[x];
        if (divAtPosition === null) {
            return null;
        }
        else {
            var divElement = divAtPosition;
            return divElement;
        }
    }
}
// set char at (y,x) to newChar
function setCharAt(y, x, newChar) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}
// highlight the rectangle at (y,x)
function highlightAt(row, x) {
    var position = getDivAt(row, x);
    if (position !== null) {
        position.setAttribute("id", "selection");
    }
}
// remove highlighting from rectangle at (y,x)
function unhighlightAt(row, x) {
    var position = getDivAt(row, x);
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
function addBlankDef(document) {
    // create a blank def, add that def to the document,
    var blankDef = addBlankDefToModule(document);
    // create a blank name, add that name to the def,
    var blankName = addBlankNameToDef(blankDef);
    // add a child cursor node to blankName
    var cursor = addCursorToEndOfWord(blankName);
    return { mode: "insert", selection: cursor };
}
function addBlankDefToModule(mod) {
    var blankDef = {
        kind: "definition",
        parent: mod,
        name: null,
        parameters: []
    };
    mod.contents.push(blankDef);
    return blankDef;
}
// prints the first def child of mod
// doesn't highlight any children, even if they are selected
function printModule(mod, selectedNode) {
    if (mod.contents[0] === null) {
    }
    else {
        printDef(mod.contents[0], selectedNode);
    }
}
// print def and check children to see if any are the selection
// if they are, highlights them,
function printDef(def, selectedNode) {
    clearDisplay(documentHeight, documentWidth);
    printString(defKeyWord, 0, 0, getColor("defKeyword"));
    var name = {
        kind: "defName",
        parent: def,
        content: [],
    };
    if (def.name != null) {
        name = def.name;
    }
    var nameList = [name];
    var parameters = def.parameters;
    var restOfLine = nameList.concat(parameters);
    printListOfWords(restOfLine, 0, defKeyWord.length, selectedNode);
}
// should print a list of words on one line, separating them by spaces
function printListOfWords(words, row, x, selectedNode) {
    var position = x;
    words.forEach(function (word) {
        if (word === selectedNode) {
            printAndHighlightWord(word, row, position);
        }
        else {
            printWord(word, row, position, selectedNode);
        }
        position = position + word.content.length + 1;
    });
}
// prints word and highlights any selected letters
function printWord(word, row, x, selectedNode) {
    var color = getColor(word.kind);
    for (var i = 0; i < word.content.length; i++) {
        if (word.content[i] === selectedNode) {
            highlightAt(row, x + i);
        }
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, word.content[i].content);
    }
}
// prints and highlights entire word
function printAndHighlightWord(word, row, x) {
    for (var i = 0; i < word.content.length; i++) {
        setCharAt(row, x + i, word.content[i].content);
        highlightAt(row, x + i);
    }
}
// define sum f_
// -->
// define sum _
function backSpace(cursor) {
    // if cursor has a left sibling, we want to get it
    var i = getIndexInList(cursor) - 1;
    var word = cursor.parent;
    var leftSibling = word.content[i];
    // delete the letter before cursor
    leftSibling.content = " ";
    // remove the old cursor node from the tree
    word.content.splice(i + 1, 1);
    // change the selection to left sibling
    return { mode: "insert", selection: leftSibling };
}
// for a node in a list, get its index
function getIndexInList(child) {
    var parent = child.parent;
    var index = 0;
    if (parent.kind === "definition") {
        return 0;
    }
    else {
        for (var i = 0; i < parent.content.length; i++) {
            if (parent.content[i] === child) {
                index = i;
            }
        }
        return index;
    }
}
function isAtEndOfWord(cursor) {
    var word = cursor.parent;
    var isLast = word.content.length === getIndexInList(cursor) + 1;
    return isLast;
}
function isNameOfSomeDef(myWord) {
    return myWord.kind === "defName";
}
// is cursor the last letter in a name of a definition
function isAtEndOfDefName(cursor) {
    var word = cursor.parent;
    return isNameOfSomeDef(word) && isAtEndOfWord(cursor);
}
// removes node from parent's list of children
// hopefully gets garbage collected
function deleteNode(node) {
    if (node.kind === "letter") {
        var i = getIndexInList(node);
        node.parent.content.splice(i, 1);
    }
    else if (node.kind === "defName") {
        var def = node.parent;
        // set defname to blank name
        var blankName = addBlankNameToDef(def);
        addCursorToEndOfWord(blankName);
    }
}
function addBlankNameToDef(def) {
    var blankName = {
        kind: "defName",
        content: [],
        parent: def
    };
    def.name = blankName;
    return blankName;
}
function insertSpace(cursor) {
    // if cursor is at end of definition name
    // delete cursor node
    // add a new argument to the front of argument list
    // make cursor node be the child of new argument
    if (isAtEndOfDefName(cursor) && cursor.parent.parent.kind === "definition") {
        var def = cursor.parent.parent;
        deleteNode(cursor);
        var newArg = {
            kind: "parameter",
            content: [],
            parent: def,
        };
        def.parameters.unshift(newArg);
        var newCursor = {
            kind: "letter",
            content: " ",
            parent: newArg,
        };
        newArg.content.push(newCursor);
        return { mode: "insert", selection: newCursor };
    }
    else if (isAtEndOfArg(cursor)) {
        // delete cursor node
        // insert a new blank argument to the right
        // add a cursor node child to this argument
        deleteNode(cursor);
        var args = cursor.parent;
    }
    return { mode: "insert", selection: cursor };
}
// checks to see if cursor is at the end of one of the arguments in definition
// Ex: define myfunc hello_ there --> true
function isAtEndOfArg(cursor) {
    var word = cursor.parent;
    return isArgOfSomeDef(word) && isAtEndOfWord(cursor);
}
// checks if myWord is one of the arguments of some function definition
function isArgOfSomeDef(myWord) {
    return (myWord.kind === "parameter");
}
// has right sibling
// has left sibling
// get right sibling
// get left sibling
// inserting nodes
// first you make the newNode or get a ref to it
// then you have an insert newNode relativePosition existingNode
// syntax highlighting
// words should store identifiers like "defname" "defarg" "defKeyWord"
// these will determine the text color
// for getting siblings of nodes, could keep a list [name, args, body]
// if the attributes are not ordered (like name, args, body),
// then it makes sense to not navigate like siblings
// instead have keys that directly select name, args, or body,
// define natural
//   zero or (s natural)
// basic tree motions
// select parent
// select left sibling
// select right sibling
// select first child
// create cursor node
// set cursor node to a specific value
// create empty word node
// delete node
// insert node in first child position
// insert node in last child position
// moving from defname to body:
// select parent (kind defname)
// select parent (def)
// select def.body : list statements
// create new blank statement
// insert blank statement as first child of def.body
// create newword node
// insert word node as first child of statement
// create new cursor node
// insert cursor node as first child of word
// composing actions
// (mode, selection, tree) + key --> (newMode, newSelection, newTree)
// but tree is actually modified in place
// actions depend on (mode, selectionType, key)
// so could have one table where the keys are (mode, selectionType, key)
// and the values are the action functions
// selectionTypes = letter, defname, defArg, defArgList, defBody, def, statement/expression,
// word = defname | defArg | ...
// could keep def children all in one list, to make it easier to implement sibling movement
// (mode, selection, selectionType) + key --> (newMode, newSelection)
// most commands : selection -> selection  (side effect: tree changes)
// mode switch commands:
// insert -> command (may also change the selection)
// command -> insert (may also change the selection)
// make types more specific?
// cursor type
// defname type
// defarg type
// defbody type
// define numbers
// define arithmetic functions
// choose some simple theorems
// write a program that can prove them
// TODO
// display command table
