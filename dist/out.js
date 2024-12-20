"use strict";
(() => {
  // src/tree.ts
  var commandMap = /* @__PURE__ */ new Map();
  commandMap.set("f", addBlankDef);
  commandMap.set("p", selectParent);
  commandMap.set("i", enterInsertMode);
  commandMap.set("j", selectLeftSibling);
  commandMap.set("k", selectRightSibling);
  commandMap.set("r", selectDefName);
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
  insertMap.set("Enter", doNothing);
  insertMap.set(";", escapeInsertMode);
  function insertAtSelectionInTree(key, selection) {
    if (selection.kind === "letter") {
      return insertAtLetterInTree(key, selection);
    }
    if (selection.kind === "defName") {
      let newLetter = {
        kind: "letter",
        parent: selection,
        content: key
      };
      selection.content = [newLetter];
      selection = newLetter;
    }
    if (selection.kind === "parameter") {
      let newLetter = {
        kind: "letter",
        parent: selection,
        content: key
      };
      selection.content = [newLetter];
      selection = newLetter;
    }
    return { mode: "insert", selection };
  }
  function insertAtLetterInTree(key, selection) {
    let word = selection.parent;
    let i = getIndexInList(selection);
    let newLetter = {
      kind: "letter",
      parent: word,
      content: key
    };
    word.content.splice(i + 1, 0, newLetter);
    return { mode: "insert", selection: newLetter };
  }
  function addBlankDef(document2) {
    let blankDef = addBlankDefToModule(document2);
    let blankName = addBlankNameToDef(blankDef);
    return { mode: "insert", selection: blankName };
  }
  function addBlankDefToModule(mod) {
    let blankDef = {
      kind: "definition",
      parent: mod,
      name: null,
      parameters: []
    };
    mod.contents.push(blankDef);
    return blankDef;
  }
  function backSpace(selection) {
    if (selection.kind === "letter") {
      let i = getIndexInList(selection);
      let newSelection = getLeftSibling(selection);
      selection.parent.content.splice(i, 1);
      if (selection.parent.content.length > 0) {
        return { mode: "insert", selection: newSelection };
      } else {
        return { mode: "insert", selection: selection.parent };
      }
    } else if (selection.kind === "defName") {
    }
  }
  function getIndexInList(child) {
    if (child.kind === "letter") {
      return getLetterList(child).indexOf(child);
    }
    if (child.kind === "parameter") {
      return getParameterList(child).indexOf(child);
    } else {
      return -1;
    }
  }
  function getLetterList(child) {
    return child.parent.content;
  }
  function getParameterList(child) {
    return child.parent.parameters;
  }
  function addBlankNameToDef(def) {
    let blankName = {
      kind: "defName",
      content: [],
      parent: def
    };
    def.name = blankName;
    return blankName;
  }
  function getRightSibling(node) {
    if (node.kind === "defName") {
      if (node.parent.parameters.length == 0) {
        let emptyParam = {
          kind: "parameter",
          content: [],
          parent: node.parent
        };
        node.parent.parameters.push(emptyParam);
        return emptyParam;
      } else {
        return node.parent.parameters[0];
      }
    } else if (node.kind === "parameter") {
      let i = getIndexInList(node);
      let parameters = node.parent.parameters;
      if (i < parameters.length - 1) {
        return node.parent.parameters[i + 1];
      } else {
        return node;
      }
    } else if (node.kind === "letter") {
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
    if (node.kind === "defName") {
      return node;
    } else if (node.kind === "parameter") {
      let i = getIndexInList(node);
      let parameters = node.parent.parameters;
      if (i > 0) {
        return node.parent.parameters[i - 1];
      } else {
        return node.parent.name ?? node;
      }
    } else if (node.kind === "letter") {
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
  function escapeInsertMode(selection) {
    return { mode: "command", selection };
  }
  function selectRightSibling(selection) {
    let rightSibling = getRightSibling(selection);
    return { mode: "command", selection: rightSibling };
  }
  function selectLeftSibling(selection) {
    let leftSibling = getLeftSibling(selection);
    return { mode: "command", selection: leftSibling };
  }
  function selectParent(selection) {
    if (selection.kind === "module") {
      return { mode: "command", selection };
    } else {
      return { mode: "command", selection: selection.parent };
    }
  }
  function enterInsertMode(selection) {
    return { mode: "insert", selection };
  }
  function doNothing(selection) {
    return true;
  }
  function selectDefName(def) {
    if (def.name === null) {
      return { mode: "command", selection: def };
    } else {
      return { mode: "command", selection: def.name };
    }
  }
  function insertSpace(selection) {
    if (selection.parent.kind === "defName") {
      let def = selection.parent.parent;
      let newParam = {
        kind: "parameter",
        content: [],
        parent: def
      };
      def.parameters.unshift(newParam);
      return { mode: "insert", selection: newParam };
    } else if (selection.parent.kind === "parameter") {
      let def = selection.parent.parent;
      let i = getIndexInList(selection.parent);
      let parameters = selection.parent.parent.parameters;
      let additionalParam = {
        kind: "parameter",
        content: [],
        parent: def
      };
      parameters.splice(i + 1, 0, additionalParam);
      return { mode: "insert", selection: additionalParam };
    } else {
      return { mode: "insert", selection };
    }
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
    return colorTable.get(key) ?? "black";
  }
  function printString(str, row, x, color2) {
    for (let i = 0; i < str.length; i++) {
      setTextColorAt(row, x + i, color2);
      setCharAt(row, x + i, str[i]);
    }
  }
  function printModule(mod, selectedNode) {
    if (mod.contents.length == 0) {
    } else {
      printDef(mod.contents[0], selectedNode);
    }
  }
  function printDef(def, selectedNode) {
    clearDisplay(documentHeight, documentWidth);
    printString(defKeyWord, 0, 0, getColor("defKeyword"));
    let name = {
      kind: "defName",
      parent: def,
      content: []
    };
    if (def.name != null) {
      name = def.name;
    }
    let nameList = [name];
    let parameters = def.parameters;
    let restOfLine = nameList.concat(parameters);
    printListOfWords(restOfLine, 0, defKeyWord.length, selectedNode);
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
    let color2 = getColor(word.kind);
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
  var documentNode = {
    kind: "module",
    contents: []
  };
  var state = {
    mode: "command",
    selection: documentNode
  };
  document.addEventListener("keydown", main);
  function main(e) {
    e.preventDefault();
    let key = e.key;
    state = handleInput(key, state);
    printModule(documentNode, state.selection);
    updateTable(state.mode);
  }
  function updateTable(currentMode) {
    let currentTable = document.getElementsByClassName("commandTable")[0];
    container.removeChild(currentTable);
    if (currentMode === "insert") {
      container.appendChild(insertTable);
    } else if (currentMode === "command") {
      container.appendChild(commandTable);
    }
  }
  function handleInput(key, state2) {
    let newState = state2;
    if (state2.mode == "insert") {
      newState = insertMode(key, state2.selection);
    }
    if (state2.mode == "command") {
      newState = commandMode(key, state2.selection);
    }
    return newState;
  }
  function commandMode(key, selection) {
    if (commandMap.has(key)) {
      return commandMap.get(key)(selection);
    } else {
      return { mode: "command", selection };
    }
  }
  function insertMode(key, selection) {
    if (insertMap.has(key)) {
      return insertMap.get(key)(selection);
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
