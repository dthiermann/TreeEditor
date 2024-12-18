import { textBox } from "./main"

export type color = "red" | "blue" | "green" | "black";

// clear the display of all text and highlighting
export function clearDisplay(documentHeight : number, documentWidth : number) {
    for (let row = 0; row < documentHeight; row ++) {
        for (let x = 0; x < documentWidth; x ++) {
            setCharAt(row, x, " ");
            unhighlightAt(row, x);
            setTextColorAt(row, x, "black");
        }
    }

}

export function setTextColorAt(row : number, x: number, color : color) {
    let div = getDivAt(row, x);
    if (div !== null) {
        div.style.color = color;
    }
    
}

// get char at (y,x) in grid
export function getCharAt(y : number, x : number) : string {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
        return "Out of bounds row index";
    }
    else {
        let charAtPosition = rowChildren[x].textContent;
        if (charAtPosition === null) {
            return "Out of bounds column index";
        }
        else {
            return charAtPosition;
        }
    }

}

// get div at (y,x) in grid
function getDivAt(y : number, x : number) : HTMLElement | null {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
        return null;
    }
    else {
        let divAtPosition = rowChildren[x];
        if (divAtPosition === null) {
            return null;
        }
        else {
            let divElement = divAtPosition as HTMLElement;
            return divElement;
        }
    }
}

// set char at (y,x) to newChar
export function setCharAt(y : number, x : number, newChar : string) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}

// highlight the rectangle at (y,x)
export function highlightAt(row : number, x : number) {
    let position = getDivAt(row, x);
    if (position !== null) {
        position.setAttribute("id", "selection");
    }
    
}

// remove highlighting from rectangle at (y,x)
export function unhighlightAt(row : number, x : number) {
    let position = getDivAt(row, x);
    if (position !== null) {
        position.removeAttribute("id");
    }
    
}
