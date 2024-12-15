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
// eventually, commandMap and insertMap will have type
// Map<string, info => info >
// or possibly
// Map<string, sel : expr --> expr >
// currently, code assumes Map<string, sel : expression -> info >
var commandMap = new Map();
commandMap.set("f", addBlankDef);
commandMap.set("p", selectParent);
commandMap.set("i", enterInsertMode);
commandMap.set("j", selectLeftSibling);
commandMap.set("k", selectRightSibling);
var insertMap = new Map();
insertMap.set("Backspace", backSpace);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set(" ", doNothing);
insertMap.set("Enter", doNothing);
insertMap.set(";", escapeInsertMode);
function enterInsertMode(selection) {
    return { mode: "insert", selection: selection };
}
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
// testfunctions();
function testfunctions() {
    var sample = [1, 2, 3];
    sample.splice(3, 0, 4);
    console.log(sample);
    sample.splice(4, 0, 5);
    console.log(sample);
    sample.splice(5, 0, 6);
    console.log(sample);
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
    // if key is not a letter or number, it should have an entry in insertMap
    if (insertMap.has(key)) {
        return insertMap.get(key)(selection);
    }
    else {
        return insertAtSelectionInTree(key, selection);
    }
}
// if selection is a letter, insert after the letter
// if selection is a word, delete the content of the word and replace it with key
function insertAtSelectionInTree(key, selection) {
    if (selection.kind === "letter") {
        return insertAtLetterInTree(key, selection);
    }
    if (selection.kind === "defName") {
        var newLetter = {
            kind: "letter",
            parent: selection,
            content: key,
        };
        selection.content = [newLetter];
    }
    if (selection.kind === "parameter") {
        var newLetter = {
            kind: "letter",
            parent: selection,
            content: key,
        };
        selection.content = [newLetter];
    }
    return { mode: "insert", selection: selection };
}
// no more empty cursors
// when key is a letter and selection is a letter
// we are adding key right after selection and before the rest of the word
function insertAtLetterInTree(key, selection) {
    var word = selection.parent;
    var i = getIndexInList(selection);
    var newLetter = {
        kind: "letter",
        parent: word,
        content: key
    };
    word.content.splice(i + 1, 0, newLetter);
    return { mode: "insert", selection: newLetter };
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
    // select the name
    return { mode: "insert", selection: blankName };
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
    if (mod.contents.length == 0) {
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
// if word is empty, should give it a space
function printListOfWords(words, row, x, selectedNode) {
    var position = x;
    words.forEach(function (word) {
        if (word === selectedNode) {
            printAndHighlightWord(word, row, position);
        }
        else {
            printWord(word, row, position, selectedNode);
        }
        var printingLength = Math.max(1, word.content.length);
        position = position + printingLength + 1;
    });
}
// prints word and highlights any selected letters
// empty words should be printed as " "
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
    if (word.content.length == 0) {
        highlightAt(row, x);
    }
    for (var i = 0; i < word.content.length; i++) {
        setCharAt(row, x + i, word.content[i].content);
        highlightAt(row, x + i);
    }
}
// define sum nam
// -->
// define sum na
function backSpace(selection) {
    // remove the selected letter from end of parent word
    selection.parent.content.pop();
    // if there are letters remaining in the word, the selection becomes the prev letter
    // otherwise, select the empty word
    if (selection.parent.content.length > 0) {
        return { mode: "insert", selection: getLeftSibling(selection) };
    }
    else {
        return { mode: "insert", selection: selection.parent };
    }
}
// for a node in a list, get its index
// every letter is in a word which has a list of letters
// every parameter is in a list of parameters
function getIndexInList(child) {
    if (child.kind === "letter") {
        return getLetterList(child).indexOf(child);
    }
    if (child.kind === "parameter") {
        return getParameterList(child).indexOf(child);
    }
    else {
        return -1;
    }
}
function getLetterList(child) {
    return child.parent.content;
}
function getParameterList(child) {
    return child.parent.parameters;
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
function addBlankNameToDef(def) {
    var blankName = {
        kind: "defName",
        content: [],
        parent: def
    };
    def.name = blankName;
    return blankName;
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
// if node has a rightSibling, return it,
// otherwise return original node
// not implemented for modules or defs yet
function getRightSibling(node) {
    if (node.kind === "defName") {
        return node.parent.parameters[0];
    }
    else if (node.kind === "parameter") {
        var i = getIndexInList(node);
        var parameters = node.parent.parameters;
        if (i < parameters.length - 1) {
            return node.parent.parameters[i + 1];
        }
        else {
            return node;
        }
    }
    else if (node.kind === "letter") {
        var i = getIndexInList(node);
        var letterList = node.parent.content;
        if (i < letterList.length - 1) {
            return letterList[i + 1];
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
function getLeftSibling(node) {
    var _a;
    if (node.kind === "defName") {
        return node;
    }
    else if (node.kind === "parameter") {
        var i = getIndexInList(node);
        var parameters = node.parent.parameters;
        if (i > 0) {
            return node.parent.parameters[i - 1];
        }
        else {
            return (_a = node.parent.name) !== null && _a !== void 0 ? _a : node;
        }
    }
    else if (node.kind === "letter") {
        var i = getIndexInList(node);
        var letterList = node.parent.content;
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
function selectRightSibling(selection) {
    var rightSibling = getRightSibling(selection);
    return { mode: "command", selection: rightSibling };
}
function selectLeftSibling(selection) {
    var leftSibling = getLeftSibling(selection);
    return { mode: "command", selection: leftSibling };
}
function insertBlankRightSibling(selection) {
    if (selection.kind === "defName") {
        // add new parameter to start of parameter list
    }
}
// to navigate using the current tree system
// you can go to parents, and children
// 
// natural = union zero (s natural)
// sum n zero = n
// sum n (s m) = s (sum n m)
// typing sum --> building a defName
// typing words after sum --> adding parameters
// typing = --> moving to the body of the def
// different ways of doing the same thing:
// writing definitions as universal statements that involve equality:
// doesn't necessarily make it clear that this is how sum is defined
// for all natural n, sum n zero = n
// for all natural n, m, sum n (s m) = s (sum n m)
// same as above, without explicitly declaring the parameters and their range
// (becomes pattern matching)
// sum n zero = n
// sum n (s m) = s (sum n m)
// explicitly a definition, with conditionals instead of patttern matching, 
// define sum n m
//   if (m = 0) n
//   if 
// it would be nice to represent these different forms with a single tree structure
// sum n zero = n
// sum n (s m) = s (sum n m)
// sum -- name of a function
// n, m   -- parameter or universally quantified variable (possibly restricted to natural numbers)
// zero -- name of a constant value
// s    -- name of a constructor :N -> N
// sum n zero = n
// equal (sum n zero) n
// for-all natural n (equal (sum n zero) n)
// for-all set parameter statement
// sum : N -> N -> N
// equal: N -> N -> bool
// or equal: N -> N -> statement
// select parent
// if module is selected, changes nothing
function selectParent(selection) {
    if (selection.kind === "module") {
        return { mode: "command", selection: selection };
    }
    else {
        return { mode: "command", selection: selection.parent };
    }
}
function addNewStatementToBody(selection) {
}
