

import { commandMap, insertMap, insertAtSelectionInTree, expression, module, definition } from "./tree"
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
    contents: [],
};

export let state : info = {
    mode: "command",
    selection: documentNode
}

document.addEventListener("keydown", main);

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


function commandMode(key : string, selection : expression) : info {
    if (commandMap.has(key)) {
        return commandMap.get(key)(selection);
    }
    else if (key === "i") {
        return { mode: "insert", selection };
    }
    else {
        return { mode: "command", selection };
    }
}

// handles user input when in insert mode
function insertMode(key : string, selection : expression) : info {
    // if key is not a letter or number, it should have an entry in insertMap
    if (insertMap.has(key)) {
        return insertMap.get(key)(selection);
    }
    else if (key === ";") {
        return {mode: "command", selection: selection };
    }
    else {
        return insertAtSelectionInTree(key, selection);
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
