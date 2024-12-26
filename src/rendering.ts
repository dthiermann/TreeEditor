import {color, setTextColorAt, setCharAt, clearDisplay, highlightAt, unhighlightAt } from "./lowlevel"
import {expression, module, definition, word , defName } from "./tree"
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

// print String to the ui directly
// requires string to fit in row
function printString(str : string, row : number, x: number, color: color) {
    for (let i = 0; i < str.length; i++) {
        setTextColorAt(row, x + i, color);
        setCharAt(row, x + i, str[i]);
        
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
