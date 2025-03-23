
import { commandMap, insertMap, insertAtSelectionInTree, doNothing} from "./tree"
import {expression, module, definition, letter, defName} from "./tree"
import { color , clearDisplay} from "./lowlevel"
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

export let documentNode = new module();

let currentMode : mode = "command";
let currentSelection : expression = documentNode;

document.addEventListener("keydown", keyboardInput);
window.addEventListener("load", getContent);


async function getContent() {
    console.log("hello");
    try {
        const response = await fetch('localhost:3000/content');
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
    }
    catch (error : any) {
        console.error(error.message);
    }
}

// handle all keyboard input
function keyboardInput(e : KeyboardEvent) {
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
        clearDisplay(documentHeight, documentWidth);
        printModule(documentNode, currentSelection);
        sendToServer(documentNode, currentSelection, currentMode);

    }

}

function sendToServer(node : expression, sel : expression, mode : mode) {
    // remove parent refs from node
    const newNode = removeParentRefs(node);

}


// everything is either a string or an object (and all of the objs are expressions?)
// if obj, remove parent attribute if there is one
//   then call removeParentNodes on all of the objects attributes
// if the attribute is a string --> return the string
function removeParentRefs(item : expression | expression[] | string) : any {
    if (typeof item === "string") {
        return item;
    }
    else if (Array.isArray(item)) {
        return item.map(removeParentRefs);
    }
    else {
        let newExpr : any = {};
        Object.entries(item).forEach(([key, value]) => {
            if (key != "parent") {
                newExpr[key] = removeParentRefs(value);
            }
        }
        );
        return newExpr;
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
    if (mode == "insert") {
        return insertMode(key, selection);
    }
    else if (mode == "command") {
        return commandMode(key, selection);
    }
    else {
        return selection;
    }
}

// action = insert key | someothercommand

function commandMode(key : string, selection : expression) : expression {
    let command = commandMap.get(key) ?? doNothing;
    // send command.name to server
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    const response = fetch("/", {
        method: "POST",
        body: command.name,
        headers: myHeaders,
        
    });

    return command(selection);
}

// handles user input when in insert mode
function insertMode(key : string, selection : expression) : expression {
    // if key is not a letter or number, it should have an entry in insertMap
    
    let insertCommand = insertMap.get(key);
    if (insertCommand) {
        // send insertCommand.name to server
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain");

        const response = fetch("/", {
            method: "POST",
            body: insertCommand.name,
            headers: myHeaders,
        });
        return insertCommand(selection);
    }
    else {
        // send "insertAtSelectionInTree key" to server
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain");

        const commandString = `insertAtSelectionInTree ${key}`;
        const response = fetch("/", {
            method: "POST",
            body: commandString,
            headers: myHeaders,
        })

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
