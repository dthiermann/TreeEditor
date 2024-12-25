import { info } from "./main"

// what is the type system supposed to express
// abstract syntax tree: how are things labelled?
// what does interpreter need to know?
// which things are names that are defined elsewhere and need to be looked up
// which things are applications
// Example:
// a = f b
// the whole line is a let-expr
// a,f,b are names
// f b  is an application

export type letter = {
    kind: "letter";
    content: string;
    parent: word
}

export type word = defName | parameter | name

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
    body: letExpr[];
    parent: module;
}

export type application = {
    kind: "application";
    function: application | name;
    argument: application | name;
    parent: letExpr;
}

// when printed, will look like
// name = value
export type letExpr = {
    kind: "letExpr";
    name: name;
    value: application | name;
    parent: definition;
}

export class defNameClass {
    kind: string;
    content: letter[];
    parent: defClass;

    constructor(parent : defClass) {
        this.parent = parent;
        this.kind = "defName";
        this.content = [];
    }

}

export class letterClass {
    kind: string;
    content: string;
    parent: word;

    constructor(content : string, parent : word) {
        this.content = content;
        this.kind = "letter";
        this.parent = parent;

    }
}

export class parameterClass {
    kind: string;
    content: letterClass[];
    parent: definition;

    constructor(parent : definition) {
        this.kind = "parameter";
        this.content = [];
        this.parent = parent;
    }
}

export class defClass {
    kind: string;
    name: defNameClass;
    parameters: parameterClass[];
    body: statementClass[];
    parent: moduleClass;

    constructor(parent : moduleClass) {
        this.kind = "definition";
        this.name = new defNameClass(this);
        this.parameters = [];
        this.body = [];
        this.parent = parent;
    }
}

export class moduleClass {
    kind: string;
    children: defClass[];

    constructor() {
        this.kind = "module";
        this.children = [];
    }
}

export class statementClass {
    kind: string;
    name: nameClass;
    value?: applicationClass | nameClass;
    parent: defClass;

    constructor(parent : defClass) {
        this.parent = parent;
        this.kind = "statement";
        this.name = new nameClass(this);
    }
}
// let x = 

export class nameClass {
    kind: string;
    content: letterClass[];
    parent: statementClass | applicationClass;

    constructor(parent : applicationClass | statementClass) {
        this.kind = "name";
        this.content = [];
        this.parent = parent;
    }
}

// expr = word | application
// application = (expr, expr)
export type expr = nameClass | applicationClass;

export class applicationClass {
    kind: string;
    left: expr;
    right: expr;
    parent: applicationClass | statementClass;

    constructor(parent: applicationClass | statementClass) {
        this.kind = "application";
        this.left = new nameClass(this);
        this.right = new nameClass(this);
        this.parent = parent;
    }

}

export type name = {
    kind: "name";
    content: letter[];
    parent: application | letExpr;
}

export type module = {
    kind: "module";
    contents: definition[];
}

export type expression = letter | word | definition | application | module | letExpr;

// constructors for blank expressions
// (should probably turn each expression type into a class)

// make a new blank def name and set parent's name to it
function makeBlankDefName(parent : definition) : defName {
    let blankDefName : defName = {
        kind: "defName",
        content: [],
        parent: parent
    }
    parent.name = blankDefName;
    return blankDefName;
}

// create a new blank paramater, add it before the kth parameter, and return it,
function makeBlankParameter(index : number, parent : definition) : parameter {
    let blankParameter : parameter = {
        kind: "parameter",
        content: [],
        parent: parent
    }
    parent.parameters.splice(index, 0, blankParameter);
    return blankParameter;
}

function makeBlankName(parent : application | letExpr) {
    let blankName : name = {
        kind: "name",
        content: [],
        parent: parent,
    }
    return blankName;
}



// add letter to parent word before letter at index
// example:
// index = 2
// word = "help"
// word[2] = "l"
// adding k at index 2 means
// word = "heklp"
function addLetterBefore(key : string, index : number, parent : word) {
    let newLetter : letter = {
        kind: "letter",
        parent: parent,
        content: key
    }
    parent.content.splice(index, 0, newLetter);
    
}

// eventually, commandMap and insertMap will have type
// Map<string, info => info >
// or possibly
// Map<string, sel : expr --> expr >
// currently, code assumes Map<string, sel : expression -> info >
export let commandMap = new Map();

commandMap.set("f", addBlankDef);
commandMap.set("p", selectParent);
commandMap.set("j", selectLeftSibling);
commandMap.set("k", selectRightSibling);
commandMap.set("r", selectDefName);


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
insertMap.set(" ", insertSpace);
insertMap.set("Enter", doNothing);



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

// nam[e] --> na[m]
// he[a]p --> h[e]p
// [n] --> empty word, (selection is the empty word)
function backSpace(selection : letter | defName | parameter) : info {
    if (selection.kind === "letter") {
        // let i = index of selected letter in word
        let i = getIndexInList(selection);
        let newSelection = getLeftSibling(selection);
        // removing word[i] from word
        selection.parent.content.splice(i, 1);
        // if there are letters remaining in the word, the selection becomes the prev letter
        // otherwise, select the empty word
        if (selection.parent.content.length > 0) {
            return {mode: "insert", selection: newSelection};
        }
        else {
            return {mode: "insert", selection: selection.parent};
        }
    }
    else if (selection.kind === "defName") {
        makeBlankDefName(selection.parent);
        return {mode: "insert", selection: selection};
    }
    else if (selection.kind === "parameter") {
        // remove selection from parameter list or just make it blank?
        let leftSibling = getLeftSibling(selection);
        deleteNode(selection);
        return {mode: "insert", selection: leftSibling};
    }
    else {
        return {mode: "insert", selection: selection};
    }

}

// delete node and descendants from syntax tree
// two steps: removing ref to node as a child of parent
// and removing ref to node as a parent of its children
function deleteNode(node : expression) {
    if (node.kind === "defName") {
        // every def has to have a name, so removing a defname
        // will mean making the defName blank
        makeBlankDefName(node.parent);
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
        if (node.parent.parameters.length == 0) {
            let emptyParam : parameter = {
                kind: "parameter",
                content: [],
                parent: node.parent
            }
            node.parent.parameters.push(emptyParam);
            return emptyParam;
        }
        else {
            return node.parent.parameters[0];
        }
    
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


function selectRightSibling(selection : expression) : info {
    let rightSibling = getRightSibling(selection);
    return { mode: "command", selection: rightSibling};

}

function selectLeftSibling(selection : expression) : info {
    let leftSibling = getLeftSibling(selection);
    return { mode: "command", selection: leftSibling }
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

function doNothing(selection : expression) {
    return true;
}

// from def, select name
function selectDefName(def : definition): info {
    if (def.name === null) {
        return {mode: "command", selection: def};
    }
    else {
        return {mode: "command", selection: def.name};
    }
}

// def nam[e]
// press space
// def name []
function insertSpace(selection : letter) : info {
    if (selection.parent.kind === "defName") {
        return insertNewParamAtStart(selection);
    }
    else if (selection.parent.kind === "parameter") {
        return insertNewParamRight(selection);
    }
    else {
        return {mode: "insert", selection: selection};
    }

    
}

// assumes that selection is a letter in a parameter
function insertNewParamRight(selection: letter) : info {
    if (selection.parent.kind === "parameter") {
        let def = selection.parent.parent;
        let i = getIndexInList(selection.parent);
        let parameters = selection.parent.parent.parameters;
        let additionalParam: parameter = {
            kind: "parameter",
            content: [],
            parent: def
        };
        parameters.splice(i + 1, 0, additionalParam);
        return { mode: "insert", selection: additionalParam};
    }
    else {
        return { mode: "insert", selection: selection};
    }
}

// assumes that selection is at end of defName
// creates a new empty param at start of params and selects it
function insertNewParamAtStart(selection: letter) : info {
    if (selection.parent.kind === "defName") {
        let def = selection.parent.parent;
        let newParam: parameter = {
            kind: "parameter",
            content: [],
            parent: def
        };
        def.parameters.unshift(newParam);
        return { mode: "insert", selection: newParam };
    }
    else {
        return { mode: "insert", selection: selection};
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

// newState = transition oldState inputKey
// newUi = print newState
// type state = (tree, selection, mode)
// (oldTree, oldSelection, oldMode, key) -->(newTree, newSelection, newMode)
// 

// need to be able to write comments
// def main event
//   inputKey = getKey event
//   newState = transition oldState inputKey
//   newUi = print newState
// first get the editor to the point where you can write
// the above text in the above format

// def main even[t]
// want to hit enter to go to next line (indented)
function insertLineBelow(selection : expression) : expression {
    if (inDefHeader(selection)) {


    }
    
}

// checks if sel is a letter in defName or letter in parameter
// or is defname or parameter
// (letter and parent is defname)
function inDefHeader(sel : expression) {
    let isDefLetter = (sel.kind === "letter") && (sel.parent.kind === "defName");
    let isParamLetter = (sel.kind === "letter") && (sel.parent.kind === "parameter");
    let isDefName = sel.kind === "defName";
    let isParam = sel.kind === "parameter";
    return isDefLetter || isParamLetter || isDefName || isParam;
}

function insertLineAtIndexInBody(def : definition, index : number) {
    // create a new empty letExpr
    // insert new letExpr at start of body
    // select the new letExpr

}


// body of function
// list of statements / expressions
// a = f b
// want to be able to select a, f, b, f b, or the whole line
// let-expression
// name = a
// body = application f b

// so far, every line could be considered a let expression
// names are pointers to their defs
// could implement goto def, or create def for,

