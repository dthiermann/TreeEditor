var textBox = document.createElement("div");
textBox.classList.add("textBox");
document.body.appendChild(textBox);
document.addEventListener("keydown", handleInput);
var documentWidth = 100;
var documentHeight = 150;
newDocument(documentWidth, documentHeight);
var documentLastRow = 0;
var currentMode = "insert";
var currentSelection = {
    row: 0,
    start: 0,
    end: 0
};
function shiftBlockDown(section, shift) {
    for (var i = section.lastRow; i >= section.firstRow; i--) {
        var line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        moveText(line, i + shift, 0);
    }
    for (var i = section.firstRow; i < section.firstRow + shift; i++) {
        var line = {
            row: i,
            start: 0,
            end: documentWidth
        };
        setIntervalText(line, " ");
    }
}
// set every char in an interval to the same char: letter
function setIntervalText(range, letter) {
    for (var i = range.start; i <= range.end; i++) {
        setCharAt(range.row, i, letter);
    }
}
// copy the text from an interval into an array
// return that array
function copyTextToArray(range) {
    var text = [];
    for (var i = range.start; i <= range.end; i++) {
        text.push(getCharAt(range.row, i));
    }
    return text;
}
function copyArrayToPosition(textArray, newRow, newStart) {
    for (var i = 0; i < textArray.length; i++) {
        setCharAt(newRow, newStart + i, textArray[i]);
    }
}
// move the text in range to newStart
// this leaves whitespace in some or all of range
// this will overwrite preexisting text after newStart
function moveText(range, newRow, newStart) {
    var textArray = copyTextToArray(range);
    setIntervalText(range, " ");
    copyArrayToPosition(textArray, newRow, newStart);
}
function unhighlightInterval(range) {
    for (var i = range.start; i <= range.end; i++) {
        unhighlightAt(range.row, i);
    }
}
function highlightInterval(range) {
    for (var i = range.start; i <= range.end; i++) {
        highlightAt(range.row, i);
    }
}
// updates currentSelection variable
// updates highlighting
// does not move any text
function setSelection(newRange) {
    unhighlightInterval(currentSelection);
    currentSelection = newRange;
    highlightInterval(newRange);
}
function shiftText(range, shift) {
    moveText(range, range.row, range.start + shift);
}
function deleteSelection() {
    var currentRow = currentSelection.row;
    var currentStart = currentSelection.start;
    var currentEnd = currentSelection.end;
    var selectionLength = currentEnd - currentStart + 1;
    var endOfLine = lineEndIndices.get(currentRow);
    var newCursor = {
        start: currentStart - 1,
        end: currentStart - 1,
        row: currentRow
    };
    var afterSelection = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    };
    setIntervalText(currentSelection, " ");
    shiftText(afterSelection, -selectionLength);
    setSelection(newCursor);
    lineEndIndices.set(currentRow, endOfLine - selectionLength);
}
function insertBlankLineBelow() {
    var row = currentSelection.row;
    // shift every row below down by 1
    if (row < documentLastRow) {
        var everythingBelow = {
            firstRow: row + 1,
            lastRow: documentLastRow
        };
        shiftBlockDown(everythingBelow, 1);
    }
    documentLastRow = documentLastRow + 1;
}
function insertLineBreakBeforeSelection() {
    // shift everything below current line down by 1
    insertBlankLineBelow();
    // move selection text and rest of line to line below
    var restOfLine = {
        row: currentSelection.row,
        start: currentSelection.start,
        end: lineEndIndices.get(currentSelection.row)
    };
    moveText(restOfLine, currentSelection.row + 1, 0);
    // move selection (highlighting + variable) to start of new line
    var newSelection = {
        row: currentSelection.row + 1,
        start: 0,
        end: currentSelection.end - currentSelection.start
    };
    setSelection(newSelection);
    console.log(currentSelection);
}
function handleInput(e) {
    e.preventDefault();
    var key = e.key;
    if (currentMode == "insert") {
        insertMode(key);
    }
    if (currentMode == "command") {
        commandMode(key);
    }
}
function commandMode(key) {
    if (commandMap.has(key)) {
        commandMap.get(key)();
    }
}
function insertMode(key) {
    if (insertMap.has(key)) {
        insertMap.get(key)();
    }
    else {
        insertBeforeSelection(key);
    }
}
var lineEndIndices = new Map();
lineEndIndices.set(0, 0);
function insertBeforeSelection(key) {
    var currentRow = currentSelection.row;
    var endOfLine = lineEndIndices.get(currentRow);
    var afterSelection = {
        row: currentRow,
        start: currentSelection.end + 1,
        end: endOfLine
    };
    // shift everything after the selection to the right by 1
    shiftText(afterSelection, 1);
    // shift selection to the right by 1
    setSelection(shiftIntervalRight(currentSelection, 1));
    // insert key right before the start of new selection
    setCharAt(currentRow, currentSelection.start - 1, key);
    lineEndIndices.set(currentRow, endOfLine + 1);
}
function doNothing() {
    return true;
}
// make a table to handle input
// mode, key, --> some function
var insertMap = new Map();
insertMap.set("Backspace", deleteSelection);
insertMap.set("Tab", doNothing);
insertMap.set("Control", doNothing);
insertMap.set("Alt", doNothing);
insertMap.set("Meta", doNothing);
insertMap.set("ArrowUp", doNothing);
insertMap.set("ArrowLeft", doNothing);
insertMap.set("ArrowRight", doNothing);
insertMap.set("ArrowDown", doNothing);
insertMap.set("Space", insertSpace);
insertMap.set("Enter", insertLineBreakBeforeSelection);
function insertSpace() {
    insertBeforeSelection(" ");
}
var shiftMap = new Map();
var commandMap = new Map();
// make a grid of divs with each one containing a space
// appends the grid to textBox div
function newDocument(width, height) {
    for (var row = 0; row < height; row++) {
        var rowDiv = document.createElement("div");
        rowDiv.classList.add("row");
        for (var col = 0; col < width; col++) {
            var letterDiv = document.createElement("div");
            letterDiv.classList.add("item");
            letterDiv.textContent = " ";
            rowDiv.appendChild(letterDiv);
        }
        textBox.appendChild(rowDiv);
    }
    highlightAt(0, 0);
}
// get char at (y,x) in grid
function getCharAt(y, x) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    return rowChildren[x].textContent;
}
// get div at (y,x) in grid
function getDivAt(y, x) {
    var rows = textBox.children;
    var rowChildren = rows[y].children;
    return rowChildren[x];
}
// set char at (y,x) to newChar
function setCharAt(y, x, newChar) {
    var rows = textBox.childNodes;
    var rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
}
function shiftChar(row, col, rowShift, colShift) {
    var letter = getCharAt(row, col);
    setCharAt(row, col, " ");
    setCharAt(row + rowShift, col + colShift, letter);
}
function shiftPositionRight(position, shift) {
    var newPosition = {
        y: position.row,
        x: position.x + shift
    };
    return newPosition;
}
function shiftIntervalRight(range, shift) {
    var row = range.row;
    var newRange = {
        row: row,
        start: range.start + shift,
        end: range.end + shift
    };
    return newRange;
}
function shiftIntervalDown(range, shift) {
    var newRange = {
        row: range.row + shift,
        start: range.start,
        end: range.end
    };
    return newRange;
}
function shiftInterval(range, rightShift, downShift) {
    var newRange = {
        row: range.row + downShift,
        start: range.start + rightShift,
        end: range.end + downShift
    };
    return newRange;
}
function shiftPositionDown(position, shift) {
    var newPosition = {
        y: position.row + shift,
        x: position.x
    };
    return newPosition;
}
// highlight the rectangle at (y,x)
function highlightAt(row, x) {
    var position = getDivAt(row, x);
    position.setAttribute("id", "selection");
}
// remove highlighting from rectangle at (y,x)
function unhighlightAt(row, x) {
    var position = getDivAt(row, x);
    position.removeAttribute("id");
}
