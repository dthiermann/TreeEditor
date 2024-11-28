"use strict";
var _a;
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
        }
    }
}
// this is the main entry point for the editor program
function main(e) {
    e.preventDefault();
    var key = e.key;
    // update the mode and selection and tree:
    state = handleInput(key, state);
    // update the ui:
    // TODO: print (displayedNode)
    printModule(documentNode, state.selection);
    console.log(documentNode);
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
insertMap.set("Space", doNothing);
insertMap.set("Enter", doNothing);
insertMap.set(";", escapeInsertMode);
function printExpression(expr) {
}
// print String to the ui directly
// requires string to fit in row
function printString(str, row, x) {
    for (var i = 0; i < str.length; i++) {
        setCharAt(row, x + i, str[i]);
    }
}
function copyArrayToPosition(textArray, newRow, newStart) {
    for (var i = 0; i < textArray.length; i++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}
// set selectedNode = newSelection
// unhighlight the selected portion of ui
// highlight the new selected node
function setSelection(oldSelection, newSelection) {
    return newSelection;
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
// Right now the render part of this function only works for the following case:
// define _
// key = "a"
// --> define a_
// this function only edits the tree
function insertAtSelectionInTree(key, selectedNode) {
    if (selectedNode.kind === "letter") {
        selectedNode.value = key;
        // tree: add a new blank cursor to the right of selectedNode
        var parentWord = selectedNode.parent;
        var blankSpace = {
            kind: "letter",
            parent: parentWord,
            value: " ",
        };
        parentWord.content.push(blankSpace);
        return { mode: "insert", selection: blankSpace };
    }
    return { mode: "insert", selection: selectedNode };
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
function selectParentOfLetter(cursor) {
    if (cursor.parent === null) {
        return { mode: "command", selection: cursor };
    }
    else {
        var newSelection = setSelection(cursor, cursor.parent);
        return { mode: "command", selection: newSelection };
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
function addBlankDef(document) {
    // create a blank def, add that def to the document,
    var blankDef = {
        kind: "definition",
        parent: document,
    };
    document.contents.push(blankDef);
    var blankName = {
        kind: "word",
        parent: blankDef,
        content: [],
    };
    blankDef.name = blankName;
    // add a child cursor node to def.name
    var cursor = {
        kind: "letter",
        parent: blankDef.name,
        value: " "
    };
    blankDef.name.content.push(cursor);
    return { mode: "insert", selection: cursor };
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
    var restOfLine = [];
    printString(defKeyWord, 0, 0);
    // need to fix defs of types in order to eliminate undefined
    // if something is initialized without certain fields
    // we want those to get a default null value specific to that type
    var name = {
        kind: "word",
        parent: def,
        content: []
    };
    var args = [];
    if (def.name !== undefined) {
        name = def.name;
    }
    if (def.arguments !== undefined) {
        args = def.arguments;
    }
    restOfLine = [name].concat(args);
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
    for (var i = 0; i < word.content.length; i++) {
        if (word.content[i] === selectedNode) {
            highlightAt(row, x + i);
        }
        setCharAt(row, x + i, word.content[i].value);
    }
}
// prints and highlights entire word
function printAndHighlightWord(word, row, x) {
    for (var i = 0; i < word.content.length; i++) {
        setCharAt(row, x + i, word.content[i].value);
        highlightAt(row, x + i);
    }
}
// define sum f_
// -->
// define sum _
function backSpace(cursor) {
    // if cursor has a left sibling, we want to get it
    var i = getLeftSiblingIndex(cursor);
    var word = cursor.parent;
    var leftSibling = word.content[i];
    // delete the letter before cursor
    leftSibling.value = " ";
    // remove the old cursor node from the tree
    word.content.splice(i + 1, 1);
    // change the selection to left sibling
    return { mode: "insert", selection: leftSibling };
}
// for a letter in a word, get the index of the letter to the left
function getLeftSiblingIndex(cursor) {
    var parent = cursor.parent;
    var leftSiblingIndex = 0;
    for (var i = 0; i < parent.content.length; i++) {
        if (parent.content[i] === cursor) {
            leftSiblingIndex = i - 1;
        }
    }
    return leftSiblingIndex;
}
function insertSpace(selectedNode) {
    return { mode: "insert", selection: selectedNode };
}
// getting weird behavior
// time to write some tests
// either the functions that edit the tree are off (making the tree wrong)
// or the function that prints the tree is off
// what is happening that is going wrong?
// f,h,backspace,h,
// def.name.content should = ["h", " "]
// instead def.name.content = ["h", " ", " "]
