

import { commandMap, insertMap, insertAtSelectionInTree, expression, module, definition, doNothing } from "./tree"
import { color } from "./lowlevel"
import { printModule } from "./rendering"

let container = document.createElement("div");
document.body.appendChild(container);
container.classList.add("container");

export let textBox : HTMLElement = document.createElement("div");
container.appendChild(textBox);
textBox.classList.add("textBox");

let commandTable = document.createElement("div");
container.appendChild(commandTable);
commandTable.classList.add("commandTable");


export type info = {
    mode: mode;
    selection: expression
}

export type mode = "insert" | "command";

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


export let documentHeight = 300;
export let documentWidth = 80;


// fill the textbox with a grid of divs
newDocument(textBox, documentWidth, documentHeight);

export let defKeyWord = "define ";

export let documentNode : module = {
    kind: "module",
    children: [],
};

// state is the current mode + current selection
export let state : info = {
    mode: "command",
    selection: documentNode
}
let currentMode : mode = "command";
let currentSelection : expression = documentNode;

document.addEventListener("keydown", main);

// this is the main entry point for the editor program
function main(e : KeyboardEvent) {
    e.preventDefault();
    let key = e.key;
    // either key changes mode --> update table
    if (currentMode === "command" && key === "i") {
        currentMode = "insert";
        updateTable(currentMode);
    }
    else if (currentMode === "insert" && key === ";") {
        currentMode = "command";
        updateTable(currentMode);
    }
    else {
        // key changes tree and selection --> update textbox
        currentSelection = handleInput(key, currentSelection, currentMode);
        printModule(documentNode, currentSelection);

    }
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

function handleInput(key : string, selection : expression, mode : mode) : expression {
    let newSelection = selection;
    if (mode == "insert") {
        newSelection = insertMode(key, selection);
    }
    if (mode == "command") {
        newSelection = commandMode(key, selection);
    }
    return newSelection;
}


function commandMode(key : string, selection : expression) : expression {
    let command = commandMap.get(key) ?? doNothing;
    return command(selection);
}

// handles user input when in insert mode
function insertMode(key : string, selection : expression) : expression {
    // if key is not a letter or number, it should have an entry in insertMap
    
    let insertCommand = insertMap.get(key);
    if (insertCommand) {
        return insertCommand(selection);
    }
    else {
        return selection;
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
