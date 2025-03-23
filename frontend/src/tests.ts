import { removeParentRefs } from "./main";
import { expression, module, definition, defName, parameter } from "./tree";
// need to build a sample syntax tree
// need to be able to print trees--by adapting the display functions from rendering.ts to print to console

// sample tree to create:
// module: myCode
// define myfunction param1 param2 param3:
//       let x someValue

// could write a parser to help with testing

let myCode = new module();
let myDef = new definition(myCode);
let myDefName = new defName(myDef, "myfunction");
let param1 = new parameter(myDef, "param1");
let param2 = new parameter(myDef, "param2");
let param3 = new parameter(myDef, "param3");




function testfunctions() {

    
}

