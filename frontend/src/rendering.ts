import { color, highlightAt, setCharAt, setTextColorAt } from "./lowlevel";
import { application, definition, expression, letter, module, name, parameter, statement, word } from "./tree";


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
    if (mod.content.length == 0) {

    }
    else {
        printDef(mod.content[0], 0, selectedNode);
    }
}

function printDef(def : definition, row : number, selection : expression) {
    let displayed = displayDef(def, selection);
    printBlock(0, displayed);
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

function printBlock(startingRow : number, block : displayChar[][]) {
    for (let i = 0; i < block.length; i++) {
        printLine(startingRow + i, 0, block[i]);
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

// empty word should be displayed as a space (possibly selected)
function displayWord(myWord : word, selection : expression) : displayChar[] {
    const color = getColor(myWord.constructor.name);
    const selected = myWord === selection;
    // use displayLetter on each letter of word to create the displayedword
    // this will highlight any letters if they are the selection

    // want empty word to be displayed as a space:
    if (myWord.content.length == 0) {
        return [new displayChar(" ", color, selected)];
    }

    if (selected) {
        return myWord.content.map(letter =>
            new displayChar(letter.content, color, true)
        );
    }
    else {
        return myWord.content.map(letter =>
            displayLetter(letter, color, selection)
        );
    }
}

function displayString(str : string, color : color, selected : boolean) {
    const stringList = Array.from(str);
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
    const printed = displayedLeft.concat(space, displayedRight);

    if (ap === selection) {
        return selectList(printed);
    }
    else {
        return printed;
    }
}

// print application with enclosing parens
function displayApplicationWithParens(ap : application, selection: expression) : displayChar[] {
    const leftParens = displayString("(", "black", selection === ap);
    const inner = displayApplication(ap, selection);
    const rightParens = displayString(")", "black", selection === ap);
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
    const defKeyword = displayString("define ", "green", false);

    const name = displayWord(def.name, selection);
    const params = displayList(def.parameters, selection);

    const space = displayString(" ", "black", false);

    return defKeyword.concat(name, space, params);
}

function displayDef(def : definition, selection : expression) : displayChar[][] {
    let display = [];
    
    display.push(displayDefHeader(def, selection));
    for (const st of def.body) {
        const isSelected = st === selection;
        const space = new displayChar(" ", "black", isSelected);
        const indent = new Array(4).fill(space);
        const line = indent.concat(displayStatement(st, selection))
        display.push(line);
    }

    if (def === selection) {
        return highlightBlock(display);
        
    }
    else {
        return display;
    }
}

// will display a list of params, separated by spaces
function displayList(params : parameter[], selection : expression) : displayChar[] {
    const space = displayString(" ", "black", false);

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

function highlightLine(line : displayChar[]) : displayChar[] {
    return line.map(selectChar);
}

function highlightBlock(block : displayChar[][]) : displayChar[][] {
    return block.map(highlightLine);
}

