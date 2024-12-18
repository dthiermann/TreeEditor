import { info } from "./main"

export type letter = {
    kind: "letter";
    content: string;
    parent: word
}

export type word = defName | parameter

export type defName = {
    kind: "defName";
    content: letter[];
    parent: definition;
}

export type parameter = {
    kind: "parameter";
    content: letter[];
    parent: definition;
}
export type definition = {
    kind: "definition";
    name: defName | null;
    parameters: parameter[];
    body?: expression[];
    parent: module;
}


export type module = {
    kind: "module";
    contents: definition[];
}

export type expression = letter | word | definition | module;

// eventually, commandMap and insertMap will have type
// Map<string, info => info >
// or possibly
// Map<string, sel : expr --> expr >
// currently, code assumes Map<string, sel : expression -> info >
export let commandMap = new Map();

commandMap.set("f", addBlankDef);
commandMap.set("p", selectParent);
commandMap.set("i", enterInsertMode);
commandMap.set("j", selectLeftSibling);
commandMap.set("k", selectRightSibling);


export let insertMap = new Map();

insertMap.set("Backspace", backSpace);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt" , doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set(" ", doNothing);
insertMap.set("Enter", doNothing);

insertMap.set(";", escapeInsertMode);


let shiftMap = new Map();
// if selection is a letter, insert after the letter
// if selection is a word, delete the content of the word and replace it with key
export function insertAtSelectionInTree(key : string, selection : expression) : info {
    if (selection.kind === "letter") {
        return insertAtLetterInTree(key, selection);
    }
    if (selection.kind === "defName") {
        let newLetter : letter = {
            kind: "letter",
            parent: selection,
            content: key,
        }
        selection.content = [newLetter];
        selection = newLetter;
        
    }
    if (selection.kind === "parameter") {
        let newLetter : letter = {
            kind: "letter",
            parent: selection,
            content: key,
        }
        selection.content = [newLetter];
        selection = newLetter;
    }
    return {mode: "insert", selection: selection};

}

// no more empty cursors
// when key is a letter and selection is a letter
// we are adding key right after selection and before the rest of the word
function insertAtLetterInTree(key : string, selection : letter) : info {
    let word = selection.parent;
    let i = getIndexInList(selection);
    let newLetter : letter = {
        kind: "letter",
        parent: word,
        content: key
    }
    word.content.splice(i+1, 0, newLetter);
    return {mode: "insert", selection: newLetter};
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

    // select the name
    return {mode: "insert", selection: blankName };

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

// define sum nam
// -->
// define sum na
function backSpace(selection : letter) : info {

    // remove the selected letter from end of parent word
    selection.parent.content.pop();
    // if there are letters remaining in the word, the selection becomes the prev letter
    // otherwise, select the empty word
    if (selection.parent.content.length > 0) {
        return {mode: "insert", selection: getLeftSibling(selection)};
    }
    else {
        return {mode: "insert", selection: selection.parent};
    }
    
}

// for a node in a list, get its index
// every letter is in a word which has a list of letters
// every parameter is in a list of parameters
function getIndexInList(child : letter | parameter) : number {
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



function getLetterList(child: letter) : letter[] {
    return child.parent.content;
}

function getParameterList(child: parameter) : parameter[] {
    return child.parent.parameters;
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

// change from insert mode to command mode
function escapeInsertMode(selection : expression) : info {
    return { mode: "command", selection: selection };
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
    if (selection.kind === "defName") {
        // add new parameter to start of parameter list


    }
}

// select parent
// if module is selected, changes nothing
function selectParent(selection : expression) : info {
    if (selection.kind === "module") {
        return {mode: "command", selection: selection};
    }
    else {
        return {mode: "command", selection: selection.parent};
    }
}

// add new statement to the beginning of def body
function addNewStatementToBody(selection : expression) {
    
}


function enterInsertMode(selection : expression) : info {
    return {mode: "insert", selection: selection};
}


function doNothing(selection : expression) {
    return true;
}
