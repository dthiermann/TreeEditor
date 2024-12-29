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

function printExpression(expr : expression, row : number, x : number, color : color, selection : expression) {
    if (expr instanceof defName) {

        
    }
}
// print String to the ui directly
// requires string to fit in row
function printString(str : string, row : number, x: number, color: color) {
    for (let i = 0; i < str.length; i++) {
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, str[i]);
        
    }
}

function printAndHighlightString(str : string, row : number, x: number, color : color) {
    for (let i = 0; i < str.length; i++) {
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, str[i]);
        highlightAt(row, x + i);
        
    }
}


function copyArrayToPosition(textArray : string[], newRow : number, newStart : number) {
    for (let i = 0; i < textArray.length; i ++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}


// prints the first def child of mod
// doesn't highlight any children, even if they are selected
export function printModule(mod : module, selectedNode : expression) {
    if (mod.children.length == 0) {

    }
    else if (mod.children[0] === selectedNode) {
        printAndHighlightDef(mod.children[0]);
    }
    else {
        printDef(mod.children[0], selectedNode);
    }
}


// print def and check children to see if any are the selection
// if they are, highlights them,
function printDef(def : definition, selectedNode : expression) {
    clearDisplay(documentHeight, documentWidth);

    printString(defKeyWord, 0, 0, getColor("defKeyword"));

    let name = def.name;

    let nameList : word[] = [name];
    let parameters = def.parameters as word[];

    let restOfLine = nameList.concat(parameters);
   
    printListOfWords(restOfLine, 0, defKeyWord.length, selectedNode);

}
// printing a def
// defKeyWord + name + params
// indent --> body
function printAndHighlightDef(def : definition) {
    clearDisplay(documentHeight, documentWidth);
    printAndHighlightString(defKeyWord, 0, 0, getColor("defKeyword"));

    let name = def.name;

    let nameList : word[] = [name];
    let parameters = def.parameters as word[];

    let restOfLine = nameList.concat(parameters);
   
    printAndHighlightListOfWords(restOfLine, 0, defKeyWord.length);
}

function printAndHighlightListOfWords(words : word[], row: number, x: number) {
    let position = x;
    words.forEach(word => {
        printAndHighlightWord(word, row, position);
        highlightAt(row, position + 1);
        let printingLength = Math.max(1, word.content.length);
        position = position + printingLength + 1;
    })
}

// should print a list of words on one line, separating them by spaces
// if word is empty, should give it a space
function printListOfWords(words : word[], row: number, x: number, selectedNode : expression) {
    let position = x;
    words.forEach(word => {
        if (word === selectedNode) {
            printAndHighlightWord(word, row, position);
        }
        else {
            printWord(word, row, position, selectedNode);
        }

        let printingLength = Math.max(1, word.content.length);
        position = position + printingLength + 1;
    })
}



// prints word and highlights any selected letters
// empty words should be printed as " "
function printWord(word : word, row : number, x : number, selectedNode : expression) {
    let color = getColor(word.constructor.name);
    for (let i = 0; i < word.content.length; i ++) {
        if (word.content[i] === selectedNode) {
            highlightAt(row, x + i);
        }
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, word.content[i].content);
    }
    
}

// prints and highlights entire word
function printAndHighlightWord(word : word, row : number, x : number) {
    if (word.content.length == 0) {
        highlightAt(row, x);
    }
    for (let i = 0; i < word.content.length; i ++) {
        setCharAt(row, x + i, word.content[i].content);
        highlightAt(row, x + i);
    }
}

// print a list of statements, one on each line, with an indent
function printBody(body : statement[], indent : number, startingRow : number, selection : expression) {
    for (let i = 0; i < body.length; i++) {
        printLine(body[i], indent, startingRow + i, selection );
    }
}




type stringOrWord = string | defName | name | parameter;

// function that takes in a list of (string | word)
// and prints them one after the other, highlighting the words if they are the selected node
// alternatively, first convert string or word to a printobject with color, highlighted?, string attributes
function printInARow(words : stringOrWord[], row : number, x : number, selection : expression) {
    let start = 0;
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (typeof word === "string") {
            printString(word, row, start, "black");
            start = start + word.length;
        }
        else {
            printWord(word, row, start, selection);
            start = start + word.content.length;
        }
        
    }
}


function printApplication(ap : application) {
    let leftName = ap.left instanceof name;
    let rightName = ap.right instanceof name;
    if (leftName && rightName) {
        [ap.left, " ", ap.right];
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

// functions from expression types to displayChar[]
// each display function checks if the inputted expression is selected
// if it is selected, the display function sets all of the outputed displayChars to selected
// otherwise, 


// ensures that if letter is the selection, it gets highlighted
function displayLetter(a : letter, color : color, selection : expression) : displayChar {
    return new displayChar(a.content, color, a === selection);
}

function displayWord(myWord : word, selection : expression) : displayChar[] {
    let color = getColor(myWord.constructor.name);
    let selected = myWord === selection;

    if (selected) {
        return myWord.content.map(letter => 
            new displayChar(letter.content, color, true)
        )
    }
    else {
        return myWord.content.map(letter =>
            displayLetter(letter, color, selection)
        )
    }
}

function displayString(str : string, selected : boolean) {
    let stringList = Array.from(str);
    return stringList.map(char =>
        new displayChar(char, "black", selected));
}

// displays application without enclosing parens
function displayApplication(ap : application, selection : expression) : displayChar[] {
    let space = displayString(" ", false);
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
    let leftParens = displayString("(", selection === ap);
    let inner = displayApplication(ap, selection);
    let rightParens = displayString(")", selection === ap);
    return leftParens.concat(inner, rightParens);
}


function selectChar(char : displayChar) : displayChar {
    return new displayChar(char.key, char.color, true);
}
function selectList(chars : displayChar[]) : displayChar[] {
    return chars.map(selectChar);
}

