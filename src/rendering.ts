import {color, setTextColorAt, setCharAt, clearDisplay, highlightAt, unhighlightAt } from "./lowlevel"
import {expression, letter, module, definition, word, defName, parameter, name, statement, application, } from "./tree"
import {documentHeight, documentWidth, defKeyWord } from "./main"


let colorTable : Map<string, color> = new Map();
colorTable.set("defName", "red");
colorTable.set("parameter", "blue");
colorTable.set("defKeyword", "green");

function getColor(key : string) : color {
    if (colorTable.has(key)) {
        return colorTable.get(key) ?? "black";
    }
    else {
        return "black";
    }
    
}

class displayChar {
    key: string;
    color: color;
    selected: boolean;

    constructor(key : string, color : color, selected : boolean) {
        this.key = key;
        this.color = color;
        this.selected = selected;
    }
}


// prints the first def child of mod
// doesn't highlight any children, even if they are selected
export function printModule(mod : module, selectedNode : expression) {
    if (mod.children.length == 0) {

    }
    else {
        printDef(mod.children[0], 0, selectedNode);
    }
}

function printDef(def : definition, row : number, selection : expression) {
    let header = displayDefHeader(def, selection);
    printLine(row, 0, header);
    printBody(def.body, row + 1, selection);
}

// print a list of statements, one on each line, with an indent
function printBody(body : statement[], startingRow : number, selection : expression) {
   for (let i = 0; i < body.length; i++) {
    let displayedLine = displayStatement(body[i], selection);
    printLine(startingRow + i, 4, displayedLine);
   }
}

function printLine(row : number, indent : number, chars : displayChar[]) {
    for (let i = 0; i < chars.length; i++) {
        setTextColorAt(row, i + indent, chars[i].color);
        setCharAt(row, i + indent, chars[i].key);
        if (chars[i].selected) {
            highlightAt(row, i + indent);
        }
    }
}



// functions from expression types to displayChar[]
// each display function checks if the inputted expression is selected
// if it is selected, the display function sets all of the outputed displayChars to selected
// otherwise, 


// ensures that if letter is the selection, it gets highlighted
function displayLetter(a : letter, color : color, selection : expression) : displayChar {
    return new displayChar(a.content, color, a === selection);
}

// todo: empty word should be displayed as a space (possibly selected)
function displayWord(myWord : word, selection : expression) : displayChar[] {
    let color = getColor(myWord.constructor.name);
    let selected = myWord === selection;

    if (myWord.content.length == 0) {
        return displayString(" ", color, selected);
    }
    else {
        return myWord.content.map(char => 
            displayLetter(char, color, selection)
        );
    }
}

function displayString(str : string, color : color, selected : boolean) {
    let stringList = Array.from(str);
    return stringList.map(char =>
        new displayChar(char, color, selected));
}

// displays application without enclosing parens
function displayApplication(ap : application, selection : expression) : displayChar[] {
    let space = displayString(" ", "black", false);
    let displayedLeft : displayChar[] = [];
    let displayedRight : displayChar[] = [];
    if (ap.left instanceof name && ap.right instanceof name) {
        displayedLeft = displayWord(ap.left, selection);
        displayedRight = displayWord(ap.right, selection);
    }
    else if (ap.left instanceof name && ap.right instanceof application) {
        displayedLeft = displayWord(ap.left, selection);
        displayedRight = displayApplicationWithParens(ap.right, selection);
    }
    else if (ap.left instanceof application && ap.right instanceof name) {
        displayedLeft = displayApplication(ap.left, selection);
        displayedRight = displayWord(ap.right, selection);
    }
    else if (ap.left instanceof application && ap.right instanceof application) {
        displayedLeft = displayApplication(ap.left, selection);
        displayedRight = displayApplicationWithParens(ap.right, selection);
    }
    let printed = displayedLeft.concat(space, displayedRight);

    if (ap === selection) {
        return selectList(printed);
    }
    else {
        return printed;
    }
}

// print application with enclosing parens
function displayApplicationWithParens(ap : application, selection: expression) : displayChar[] {
    let leftParens = displayString("(", "black", selection === ap);
    let inner = displayApplication(ap, selection);
    let rightParens = displayString(")", "black", selection === ap);
    return leftParens.concat(inner, rightParens);
}


function selectChar(char : displayChar) : displayChar {
    return new displayChar(char.key, char.color, true);
}
function selectList(chars : displayChar[]) : displayChar[] {
    return chars.map(selectChar);
}

function displayStatement(st : statement, selection : expression) : displayChar[] {
    let letKeyword = displayString(" = ", "black", false);
    //  st.name " = " st.value
    let displayedName = displayWord(st.name, selection);
    let displayedVal : displayChar[] = [];
    if (st.value instanceof name) {
        displayedVal = displayWord(st.value, selection);
    }
    else if (st.value instanceof application) {
        displayedVal = displayApplication(st.value, selection);
    }

    let unhighlighted = displayedName.concat(letKeyword, displayedVal);

    if (st === selection) {
        return selectList(unhighlighted);
    }
    else {
        return unhighlighted;
    }
}

function displayDefHeader(def : definition, selection : expression) : displayChar[] {
    let defKeyword = displayString("define ", "green", false);

    let name = displayWord(def.name, selection);
    let params = displayList(def.parameters, selection);

    let space = displayString(" ", "black", false);

    return defKeyword.concat(name, space, params);
}

// will display a list of params, separated by spaces
function displayList(params : parameter[], selection : expression) : displayChar[] {
    let space = displayString(" ", "black", false);

    // put a space before very param, except the first one
    if (params.length == 0) {
        return [];
    }
    else {
        let displayedParams = displayWord(params[0], selection);
        for (let i = 1; i < params.length; i++) {
            let displayedWord = displayWord(params[i], selection);
            displayedParams = displayedParams.concat(space, displayedWord);
        }
        return displayedParams;
    }
}
