"use strict";
(() => {
  // src/tree.ts
  var defName = class {
    content;
    parent;
    // creates an empty defName and adds it to parent
    constructor(parent) {
      this.parent = parent;
      parent.name = this;
      this.content = [];
    }
  };
  var letter = class {
    kind;
    content;
    parent;
    constructor(content, parent) {
      this.content = content;
      this.kind = "letter";
      this.parent = parent;
    }
  };
  var parameter = class {
    kind;
    content;
    parent;
    constructor(parent) {
      this.kind = "parameter";
      this.content = [];
      this.parent = parent;
    }
  };
  var definition = class {
    kind;
    name;
    parameters;
    body;
    parent;
    constructor(parent) {
      this.kind = "definition";
      this.name = new defName(this);
      this.parameters = [];
      this.body = [];
      this.parent = parent;
    }
  };
  var module = class {
    kind;
    children;
    constructor() {
      this.kind = "module";
      this.children = [];
    }
  };
  var statement = class {
    kind;
    name;
    value;
    parent;
    constructor(parent) {
      this.parent = parent;
      this.kind = "statement";
      this.name = new name(this);
    }
  };
  var name = class {
    kind;
    content;
    parent;
    constructor(parent) {
      this.kind = "name";
      this.content = [];
      this.parent = parent;
    }
  };
  var commandMap = /* @__PURE__ */ new Map();
  commandMap.set("f", addNewChild);
  commandMap.set("p", selectParent);
  commandMap.set("j", getLeftSibling);
  commandMap.set("k", getRightSibling);
  commandMap.set("r", selectFirstChild);
  var insertMap = /* @__PURE__ */ new Map();
  insertMap.set("Backspace", backSpace);
  insertMap.set("Tab", doNothing);
  insertMap.set("Control", doNothing);
  insertMap.set("Alt", doNothing);
  insertMap.set("Meta", doNothing);
  insertMap.set("ArrowUp", doNothing);
  insertMap.set("ArrowLeft", doNothing);
  insertMap.set("ArrowRight", doNothing);
  insertMap.set("ArrowDown", doNothing);
  insertMap.set(" ", insertSpace);
  insertMap.set("Enter", insertLineBelow);
  function insertAtSelectionInTree(key, selection) {
    if (selection instanceof letter) {
      return insertAtLetterInTree(key, selection);
    } else if (selection instanceof defName) {
      let newLetter = new letter(key, selection);
      selection.content = [newLetter];
      selection = newLetter;
    } else if (selection instanceof parameter) {
      let newLetter = new letter(key, selection);
      selection.content = [newLetter];
      selection = newLetter;
    }
    return selection;
  }
  function insertAtLetterInTree(key, selection) {
    let word = selection.parent;
    let i = getIndexInList(selection);
    let newLetter = new letter(key, word);
    word.content.splice(i + 1, 0, newLetter);
    return newLetter;
  }
  function addBlankDef(document2) {
    let blankdef = new definition(document2);
    document2.children.push(blankdef);
    return blankdef.name;
  }
  function addNewChild(selection) {
    if (selection instanceof module) {
      return addBlankDef(selection);
    } else {
      return selection;
    }
  }
  function backSpace(selection) {
    if (selection instanceof letter) {
      let i = getIndexInList(selection);
      let newSelection = getLeftSibling(selection);
      selection.parent.content.splice(i, 1);
      if (selection.parent.content.length > 0) {
        return newSelection;
      } else {
        return selection.parent;
      }
    }
    if (selection instanceof defName) {
      selection.content = [];
      return selection;
    }
    if (selection instanceof parameter) {
      let leftSibling = getLeftSibling(selection);
      deleteNode(selection);
      return leftSibling;
    } else {
      return selection;
    }
  }
  function deleteNode(node) {
    if (node instanceof defName) {
      node.content = [];
    }
  }
  function getIndexInList(child) {
    if (child instanceof letter) {
      return child.parent.content.indexOf(child);
    }
    if (child instanceof parameter) {
      return child.parent.parameters.indexOf(child);
    }
    if (child instanceof statement) {
      return child.parent.body.indexOf(child);
    } else {
      return -1;
    }
  }
  function getRightSibling(node) {
    if (node instanceof defName) {
      if (node.parent.parameters.length == 0) {
        return node;
      } else {
        return node.parent.parameters[0];
      }
    } else if (node instanceof parameter) {
      let i = getIndexInList(node);
      let parameters = node.parent.parameters;
      if (i < parameters.length - 1) {
        return node.parent.parameters[i + 1];
      } else {
        return node;
      }
    } else if (node instanceof letter) {
      let i = getIndexInList(node);
      let letterList = node.parent.content;
      if (i < letterList.length - 1) {
        return letterList[i + 1];
      } else {
        return node;
      }
    } else {
      return node;
    }
  }
  function getLeftSibling(node) {
    if (node instanceof defName) {
      return node;
    } else if (node instanceof parameter) {
      let i = getIndexInList(node);
      let parameters = node.parent.parameters;
      if (i > 0) {
        return node.parent.parameters[i - 1];
      } else {
        return node.parent.name ?? node;
      }
    } else if (node instanceof letter) {
      let i = getIndexInList(node);
      let letterList = node.parent.content;
      if (i > 0) {
        return letterList[i - 1];
      } else {
        return node;
      }
    } else {
      return node;
    }
  }
  function selectParent(selection) {
    if (selection instanceof module) {
      return selection;
    } else {
      return selection.parent;
    }
  }
  function doNothing(selection) {
    return selection;
  }
  function selectFirstChild(selection) {
    if (selection instanceof definition) {
      return selection.name;
    } else {
      return selection;
    }
  }
  function insertSpaceAfterLetter(selection) {
    if (selection.parent instanceof defName) {
      return insertNewParamAtStart(selection);
    } else if (selection.parent instanceof parameter) {
      return insertNewParamRight(selection);
    } else {
      return selection;
    }
  }
  function insertSpace(selection) {
    if (selection instanceof letter) {
      return insertSpaceAfterLetter(selection);
    } else {
      return selection;
    }
  }
  function insertNewParamRight(selection) {
    if (selection.parent instanceof parameter) {
      let def = selection.parent.parent;
      let i = getIndexInList(selection.parent);
      let parameters = selection.parent.parent.parameters;
      let additionalParam = new parameter(def);
      parameters.splice(i + 1, 0, additionalParam);
      return additionalParam;
    } else {
      return selection;
    }
  }
  function insertNewParamAtStart(selection) {
    if (selection.parent instanceof defName) {
      let def = selection.parent.parent;
      let newParam = new parameter(def);
      def.parameters.unshift(newParam);
      return newParam;
    } else {
      return selection;
    }
  }
  function insertLineBelow(selection) {
    if (selection instanceof defName || selection instanceof parameter) {
      return insertLineAtIndexInBody(selection.parent, 0);
    }
    if (selection instanceof statement) {
      let i = getIndexInList(selection);
      return insertLineAtIndexInBody(selection.parent, i + 1);
    } else {
      return selection;
    }
  }
  function insertLineAtIndexInBody(def, index) {
    let line = new statement(def);
    def.body.splice(index, 0, line);
    return line;
  }

  // src/lowlevel.ts
  function clearDisplay(documentHeight2, documentWidth2) {
    for (let row = 0; row < documentHeight2; row++) {
      for (let x = 0; x < documentWidth2; x++) {
        setCharAt(row, x, " ");
        unhighlightAt(row, x);
        setTextColorAt(row, x, "black");
      }
    }
  }
  function setTextColorAt(row, x, color2) {
    let div = getDivAt(row, x);
    if (div !== null) {
      div.style.color = color2;
    }
  }
  function getDivAt(y, x) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    if (rowChildren === null) {
      return null;
    } else {
      let divAtPosition = rowChildren[x];
      if (divAtPosition === null) {
        return null;
      } else {
        let divElement = divAtPosition;
        return divElement;
      }
    }
  }
  function setCharAt(y, x, newChar) {
    let rows = textBox.childNodes;
    let rowChildren = rows[y].childNodes;
    rowChildren[x].textContent = newChar;
  }
  function highlightAt(row, x) {
    let position = getDivAt(row, x);
    if (position !== null) {
      position.setAttribute("id", "selection");
    }
  }
  function unhighlightAt(row, x) {
    let position = getDivAt(row, x);
    if (position !== null) {
      position.removeAttribute("id");
    }
  }

  // src/rendering.ts
  var colorTable = /* @__PURE__ */ new Map();
  colorTable.set("defName", "red");
  colorTable.set("parameter", "blue");
  colorTable.set("defKeyword", "green");
  function getColor(key) {
    if (colorTable.has(key)) {
      return colorTable.get(key) ?? "black";
    } else {
      return "black";
    }
  }
  function printString(str, row, x, color2) {
    for (let i = 0; i < str.length; i++) {
      setTextColorAt(row, x + i, color2);
      setCharAt(row, x + i, str[i]);
    }
  }
  function printAndHighlightString(str, row, x, color2) {
    for (let i = 0; i < str.length; i++) {
      setTextColorAt(row, x + i, color2);
      setCharAt(row, x + i, str[i]);
      highlightAt(row, x + i);
    }
  }
  function printModule(mod, selectedNode) {
    if (mod.children.length == 0) {
    } else if (mod.children[0] === selectedNode) {
      printAndHighlightDef(mod.children[0]);
    } else {
      printDef(mod.children[0], selectedNode);
    }
  }
  function printDef(def, selectedNode) {
    clearDisplay(documentHeight, documentWidth);
    printString(defKeyWord, 0, 0, getColor("defKeyword"));
    let name2 = def.name;
    let nameList = [name2];
    let parameters = def.parameters;
    let restOfLine = nameList.concat(parameters);
    printListOfWords(restOfLine, 0, defKeyWord.length, selectedNode);
  }
  function printAndHighlightDef(def) {
    clearDisplay(documentHeight, documentWidth);
    printAndHighlightString(defKeyWord, 0, 0, getColor("defKeyword"));
    let name2 = def.name;
    let nameList = [name2];
    let parameters = def.parameters;
    let restOfLine = nameList.concat(parameters);
    printAndHighlightListOfWords(restOfLine, 0, defKeyWord.length);
  }
  function printAndHighlightListOfWords(words, row, x) {
    let position = x;
    words.forEach((word) => {
      printAndHighlightWord(word, row, position);
      highlightAt(row, position + 1);
      let printingLength = Math.max(1, word.content.length);
      position = position + printingLength + 1;
    });
  }
  function printListOfWords(words, row, x, selectedNode) {
    let position = x;
    words.forEach((word) => {
      if (word === selectedNode) {
        printAndHighlightWord(word, row, position);
      } else {
        printWord(word, row, position, selectedNode);
      }
      let printingLength = Math.max(1, word.content.length);
      position = position + printingLength + 1;
    });
  }
  function printWord(word, row, x, selectedNode) {
    let color2 = getColor(word.constructor.name);
    for (let i = 0; i < word.content.length; i++) {
      if (word.content[i] === selectedNode) {
        highlightAt(row, x + i);
      }
      setTextColorAt(row, x + i, color2);
      setCharAt(row, x + i, word.content[i].content);
    }
  }
  function printAndHighlightWord(word, row, x) {
    if (word.content.length == 0) {
      highlightAt(row, x);
    }
    for (let i = 0; i < word.content.length; i++) {
      setCharAt(row, x + i, word.content[i].content);
      highlightAt(row, x + i);
    }
  }

  // src/main.ts
  var container = document.createElement("div");
  document.body.appendChild(container);
  container.classList.add("container");
  var textBox = document.createElement("div");
  container.appendChild(textBox);
  textBox.classList.add("textBox");
  var commandTable = document.createElement("div");
  container.appendChild(commandTable);
  commandTable.classList.add("commandTable");
  function makeCommandTable() {
    let modeDisplay = document.createElement("div");
    commandTable.appendChild(modeDisplay);
    modeDisplay.classList.add("tableRow");
    modeDisplay.textContent = "mode:  command";
    commandMap.forEach((value, key) => {
      let row = document.createElement("div");
      row.classList.add("tableRow");
      row.textContent = `${key}     ${value.name}`;
      commandTable.appendChild(row);
    });
  }
  var insertTable = document.createElement("div");
  insertTable.classList.add("commandTable");
  function makeInsertTable() {
    insertMap.forEach((value, key) => {
      let row = document.createElement("div");
      row.classList.add("tableRow");
      row.textContent = `${key}    ${value.name}`;
      insertTable.appendChild(row);
    });
  }
  makeCommandTable();
  makeInsertTable();
  var documentHeight = 300;
  var documentWidth = 80;
  newDocument(textBox, documentWidth, documentHeight);
  var defKeyWord = "define ";
  var documentNode = new module();
  var currentMode = "command";
  var currentSelection = documentNode;
  document.addEventListener("keydown", main);
  function main(e) {
    e.preventDefault();
    let key = e.key;
    if (currentMode === "command" && key === "i") {
      currentMode = "insert";
      updateTable(currentMode);
    } else if (currentMode === "insert" && key === ";") {
      currentMode = "command";
      updateTable(currentMode);
    } else {
      currentSelection = handleInput(key, currentSelection, currentMode);
      printModule(documentNode, currentSelection);
    }
  }
  function updateTable(currentMode2) {
    let currentTable = document.getElementsByClassName("commandTable")[0];
    container.removeChild(currentTable);
    if (currentMode2 === "insert") {
      container.appendChild(insertTable);
    } else if (currentMode2 === "command") {
      container.appendChild(commandTable);
    }
  }
  function handleInput(key, selection, mode) {
    if (mode == "insert") {
      return insertMode(key, selection);
    } else if (mode == "command") {
      return commandMode(key, selection);
    } else {
      return selection;
    }
  }
  function commandMode(key, selection) {
    let command = commandMap.get(key) ?? doNothing;
    return command(selection);
  }
  function insertMode(key, selection) {
    let insertCommand = insertMap.get(key);
    if (insertCommand) {
      return insertCommand(selection);
    } else {
      return insertAtSelectionInTree(key, selection);
    }
  }
  function newDocument(textBox2, width, height) {
    for (let row = 0; row < height; row++) {
      let rowDiv = document.createElement("div");
      rowDiv.classList.add("row");
      for (let col = 0; col < width; col++) {
        let letterDiv = document.createElement("div");
        letterDiv.classList.add("item");
        letterDiv.textContent = " ";
        rowDiv.appendChild(letterDiv);
      }
      textBox2.appendChild(rowDiv);
    }
  }
})();
