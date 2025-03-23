
export type word = defName | parameter | name | constant;


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
    content: definition[];

    constructor() {
        this.kind = "module";
        this.content = [];
    }
}

// statement of the form
// let name = value
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

// for a word that represents a value
// that is defined somewhere else
export class constant {
    content: letter[];
    parent: application | statement;

    constructor(parent : application | statement) {
        this.content = [];
        this.parent = parent;
    }
}

// name as in "let name = "
// name class is for a word that is being defined
// on that line
export class name {
    kind: string;
    content: letter[];
    parent: statement;

    constructor(parent : statement) {
        this.kind = "name";
        this.content = [];
        this.parent = parent;
    }
}

// expr = word | application
// application = (expr, expr)
export type expr = constant | application;

export class application {
    kind: string;
    left: constant | application;
    right: constant | application;
    parent: application | statement;

    constructor(parent: application | statement) {
        this.kind = "application";
        this.left = new constant(this);
        this.right = new constant(this);
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

// create a command type
// relativePosition is relative to selection
// relativePosition = parent | firstChild | leftSibling | rightSibling | lastChild
// insert (letter | otherNode) relativePosition
// delete selectedNode (and change selection to what)
// select relativePosition

// node = compound | word | letter
// compound has (parent : compound) (children: compound | word)
// word has (parent : compound) (children: letter)
// letter has (parent : word)

// deleting content of node is different from deleting a node
// the idea of empty nodes, you can have empty word nodes, and empty compound nodes
// means word node, compound 
// children stored in list
// the list could be empty
// word.children = ["w", "o", "r", "d"]
// no parent refs and just keep track of selection address?
// 

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
    else if (selection instanceof defName || selection instanceof name) {
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
// add key right after selection and before the rest of the word
function insertAtLetterInTree(key : string, selection : letter) : expression {
    const word = selection.parent;
    const i = getIndexInList(selection);
    const newLetter = new letter(key, word);
    word.content.splice(i+1, 0, newLetter);
    return newLetter;
}


function addBlankDef(document : module) : defName {
    const blankdef = new definition(document);
    document.content.push(blankdef);
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
        return deleteNode(selection);
    }
    if (selection instanceof defName) {
        selection.content = [];
        return selection;
    }
    if (selection instanceof parameter) {
        // remove selection from parameter list or just make it blank?
        return deleteNode(selection);
    }
    else {
        return selection;
    }

}

// for nodes that can be deleted, such as letters, parameters, statements, applications,
function deleteNode(selection : parameter | letter) : expression {
    const i = getIndexInList(selection);
    let parentList;
    if (selection instanceof parameter) {
        parentList = selection.parent.parameters;
    }
    else {
        // if selection : letter
        parentList = selection.parent.content;
    }
    const leftSibling = getLeftSibling(selection);
    parentList.splice(i, 1);
    return leftSibling;

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

// insert mode, selection is letter in name.
// ToDo: press space to create statement.value and jump to it
// statement.value : name | application
// for now, make statement.value a name and select it



function insertLineBelow(selection : expression) : expression {
    if (selection instanceof defName || selection instanceof parameter) {
        return insertLineAtIndexInBody(selection.parent, 0);
    }
    if (selection instanceof statement) {
        let i = getIndexInList(selection);
        return insertLineAtIndexInBody(selection.parent, i + 1);
    }
    else if (selection instanceof letter && selection.parent instanceof parameter) {
        return insertLineAtIndexInBody(selection.parent.parent, 0);
    }
    else if (selection instanceof letter && selection.parent instanceof defName) {
        return insertLineAtIndexInBody(selection.parent.parent, 0);
    }
    else {
        return selection;
    }
}

function insertLineAtIndexInBody(def : definition, index : number) : expression {
    let line = new statement(def);
    def.body.splice(index, 0, line);
    return line.name;

}

// TO DO
// adding a new line to body of def (insert mode)
// the new-selection will be the statement name
// typing will start adding to the statement name
// (insert mode, selection type = name, key type = letter)
// add key to name, and select key

// 
// when statement is selected and we are in insert mode
// typing a letter should 

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

// write very simple programs in it first
// factorial (s n) = product n (factorial n)
