
export type word = defName | parameter | name;

export class defName {
    content: letter[];
    parent: definition;

    // creates an empty defName and adds it to parent
    constructor(parent : definition) {
        this.parent = parent;
        parent.name = this;
        this.content = [];

    }

}

export class letter {
    kind: string;
    content: string;
    parent: word;

    constructor(content : string, parent : word) {
        this.content = content;
        this.kind = "letter";
        this.parent = parent;

    }
}

export class parameter {
    kind: string;
    content: letter[];
    parent: definition;

    constructor(parent : definition) {
        this.kind = "parameter";
        this.content = [];
        this.parent = parent;
    }
}

export class definition {
    kind: string;
    name: defName;
    parameters: parameter[];
    body: statement[];
    parent: module;

    constructor(parent : module) {
        this.kind = "definition";
        this.name = new defName(this);
        this.parameters = [];
        this.body = [];
        this.parent = parent;
    }
}

export class module {
    kind: string;
    children: definition[];

    constructor() {
        this.kind = "module";
        this.children = [];
    }
}

export class statement {
    kind: string;
    name: name;
    value?: application | name;
    parent: definition;

    constructor(parent : definition) {
        this.parent = parent;
        this.kind = "statement";
        this.name = new name(this);
    }
}


export class name {
    kind: string;
    content: letter[];
    parent: statement | application;

    constructor(parent : application | statement) {
        this.kind = "name";
        this.content = [];
        this.parent = parent;
    }
}

// expr = word | application
// application = (expr, expr)
export type expr = name | application;

export class application {
    kind: string;
    left: name | application;
    right: name | application;
    parent: application | statement;

    constructor(parent: application | statement) {
        this.kind = "application";
        this.left = new name(this);
        this.right = new name(this);
        this.parent = parent;
    }

}

export type expression = letter | word | definition | application | module | statement;


// add letter to parent word before letter at index
// example:
// index = 2
// word = "help"
// word[2] = "l"
// adding k at index 2 means
// word = "heklp"
function addLetterBefore(key : string, index : number, parent : word) {
    let newLetter = new letter(key, parent);
    parent.content.splice(index, 0, newLetter);
}

// eventually, commandMap and insertMap will have type
// Map<string, info => info >
// or possibly
// Map<string, sel : expr --> expr >
// currently, code assumes Map<string, sel : expression -> info >
export let commandMap : Map<string, (sel : expression) => expression> = new Map();

commandMap.set("f", addNewChild);
commandMap.set("p", selectParent);
commandMap.set("j", getLeftSibling);
commandMap.set("k", getRightSibling);
commandMap.set("r", selectFirstChild);


export let insertMap : Map<string, (sel : expression) => expression> = new Map();

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
insertMap.set("Enter", insertLineBelow);



let shiftMap = new Map();
// if selection is a letter, insert after the letter
// if selection is a word, delete the content of the word and replace it with key
export function insertAtSelectionInTree(key : string, selection : expression) : expression {
    if (selection instanceof letter) {
        return insertAtLetterInTree(key, selection);
    }
    else if (selection instanceof defName) {
        let newLetter = new letter(key, selection);
        selection.content = [newLetter];
        selection = newLetter;
        
    }
    else if (selection instanceof parameter) {
        let newLetter = new letter(key, selection);
        selection.content = [newLetter];
        selection = newLetter;
    }
    return selection;

}

// when key is a letter and selection is a letter
// we are adding key right after selection and before the rest of the word
function insertAtLetterInTree(key : string, selection : letter) : expression {
    let word = selection.parent;
    let i = getIndexInList(selection);
    let newLetter = new letter(key, word);
    word.content.splice(i+1, 0, newLetter);
    return newLetter;
}


function addBlankDef(document : module) : defName {
    let blankdef = new definition(document);
    document.children.push(blankdef);
    return blankdef.name;
}

function addNewChild(selection : expression) : expression {
    if (selection instanceof module) {
        return addBlankDef(selection);
    }
    else {
        return selection;
    }
}


// nam[e] --> na[m]
// he[a]p --> h[e]p
// [n] --> empty word, (selection is the empty word)
function backSpace(selection : expression) : expression {
    if (selection instanceof letter) {
        // let i = index of selected letter in word
        let i = getIndexInList(selection);
        let newSelection = getLeftSibling(selection);
        // removing word[i] from word
        selection.parent.content.splice(i, 1);
        // if there are letters remaining in the word, the selection becomes the prev letter
        // otherwise, select the empty word
        if (selection.parent.content.length > 0) {
            return newSelection;
        }
        else {
            return selection.parent;
        }
    }
    if (selection instanceof defName) {
        selection.content = [];
        return selection;
    }
    if (selection instanceof parameter) {
        // remove selection from parameter list or just make it blank?
        let leftSibling = getLeftSibling(selection);
        deleteNode(selection);
        return leftSibling;
    }
    else {
        return selection;
    }

}

// delete node and descendants from syntax tree
// two steps: removing ref to node as a child of parent
// and removing ref to node as a parent of its children
function deleteNode(node : expression) {
    if (node instanceof defName) {
        // every def has to have a name, so removing a defname
        // will mean making the defName blank
        node.content = [];
    }
}

// for a node in a list, get its index
// every letter is in a word which has a list of letters
// every parameter is in a list of parameters
function getIndexInList(child : letter | parameter | statement) : number {
    if (child instanceof letter) {
        return child.parent.content.indexOf(child);
    }
    if (child instanceof parameter) {
        return child.parent.parameters.indexOf(child);
    }
    if (child instanceof statement) {
        return child.parent.body.indexOf(child);
    }
    else {
        return -1;
    }
}

// if node has a rightSibling, return it,
// otherwise return original node
// not implemented for modules or defs yet
function getRightSibling(node : expression) : expression {
    if (node instanceof defName) {
        if (node.parent.parameters.length == 0) {
            return node;
        }
        else {
            return node.parent.parameters[0];
        }
    
    }
    else if (node instanceof parameter) {
        let i = getIndexInList(node);
        let parameters = node.parent.parameters;
        if (i < parameters.length - 1) {
            return node.parent.parameters[i + 1];
        }
        else {
            return node;
        }
    }
    else if (node instanceof letter) {
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
    if (node instanceof defName) {
        return node;
    }
    else if (node instanceof parameter) {
        let i = getIndexInList(node);
        let parameters = node.parent.parameters;
        if (i > 0) {
            return node.parent.parameters[i - 1];
        }
        else {
            return node.parent.name ?? node;
        }
    }
    else if (node instanceof letter) {
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


// select parent
// if module is selected, changes nothing
function selectParent(selection : expression) : expression {
    if (selection instanceof module) {
        return selection;
    }
    else {
        return selection.parent;
    }
}

export function doNothing(selection : expression) : expression {
    return selection;
}


function selectFirstChild(selection : expression) : expression {
    if (selection instanceof definition) {
        return selection.name;
    }
    else {
        return selection;
    }
}

// def nam[e]
// press space
// def name []
function insertSpaceAfterLetter(selection : letter) : expression {
    if (selection.parent instanceof defName) {
        return insertNewParamAtStart(selection);
    }
    else if (selection.parent instanceof parameter) {
        return insertNewParamRight(selection);
    }
    else {
        return selection;
    }
}

function insertSpace(selection : expression) : expression {
    if (selection instanceof letter) {
        return insertSpaceAfterLetter(selection);
    }
    else {
        return selection;
    }
}

// assumes that selection is a letter in a parameter
function insertNewParamRight(selection: letter) : expression {
    if (selection.parent instanceof parameter) {
        let def = selection.parent.parent;
        let i = getIndexInList(selection.parent);
        let parameters = selection.parent.parent.parameters;
        let additionalParam = new parameter(def);
        parameters.splice(i + 1, 0, additionalParam);
        return additionalParam;
    }
    else {
        return selection;
    }
}

// assumes that selection is at end of defName
// creates a new empty param at start of params and selects it
function insertNewParamAtStart(selection: letter) : expression {
    if (selection.parent instanceof defName) {
        let def = selection.parent.parent;
        let newParam = new parameter(def);
        def.parameters.unshift(newParam);
        return newParam;
    }
    else {
        return selection;
    }
}

// most actions dont change the mode, but they change the tree and the selection
// then there are commands that switch between modes

// programming language / editor that should support defining an abstract interface
// and automatically being able to quickly switch between implementations

// start writing the code for the editor in the editor in my own language
// this will make it clear when new features are needed
// then can write code that transpiles to js to build the editor

// need a backend to start saving the work


// need to be able to write comments
// def main event
//   inputKey = getKey event
//   newState = transition oldState inputKey
//   newUi = print newState
// first get the editor to the point where you can write
// the above text in the above format

// if selection is in the header line of def,
// want to be able to hit enter to add a new line to the start of body
// and start editing

function insertLineBelow(selection : expression) : expression {
    if (selection instanceof defName || selection instanceof parameter) {
        return insertLineAtIndexInBody(selection.parent, 0);
    }
    if (selection instanceof statement) {
        let i = getIndexInList(selection);
        return insertLineAtIndexInBody(selection.parent, i + 1);
    }
    else {
        return selection;
    }
}

function insertLineAtIndexInBody(def : definition, index : number) : expression {
    let line = new statement(def);
    def.body.splice(index, 0, line);
    return line;

}

// TO DO
// adding a new line to body of def
// print body of def

// changing selection
// left sibling, right sibling, parent, firstchild
// if can't go further in some direction, want to stay on current selection

// inserting nodes:
// insert sibling to the right
// insert sibling to the left
// insert child node at end of children
// insert child node at beginning of children


// delete selected node

// simple standardized tree structure for def
// def.children = [name, arguments, body]
// arguments.children = [arg1, arg2 ... ] <-- can insert and delete
// body.children = [line1, line2, ...] <--- can insert and delete


// goal: insert new line at start of body
// 
