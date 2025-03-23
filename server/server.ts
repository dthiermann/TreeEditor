const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
import { Request, Response } from 'express';

// actions:
// select left/right/parent/firstchild/lastchild
// insert key
// replace selected node with new node
// delete (current selection), select left sibling

type relativePosition = "left" | "right" | "parent" | "firstChild" | "lastChild";

type verb = "select" | "insert" | "delete";



// or action name is just name of function that performs that action

// wish that the type system had no distinction betweeen an empty node
// and a non-existent node
//


let actions = [];

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('/', (req : Request, res : Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.get('/content', (req : Request, res : Response) => {
  // build tree from list of actions and send it
})

app.post('/', (req : Request, res : Response) => {
  // get the new document tree json and store it in place of the old document tree
  document = req.body;
  res.status(200).json({ message: "Document updated"});
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// select parent/firstChild/leftSibling/rightSibling
// delete node
// insert emptyNode/letter firstChild/leftSibling/rightSibling
// should the insert commands select the new node?