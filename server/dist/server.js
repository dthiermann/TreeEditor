"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
let document = {};
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});
app.get('/content', (req, res) => {
    // send document tree as json
    res.json(document);
});
app.post('/', (req, res) => {
    // get the new document tree json and store it in place of the old document tree
    document = req.body;
    res.status(200).json({ message: "Document updated" });
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
// todo:
// when user edits display node, send updated display node to server as json
// figure out which http type this would be
// when page loads
// server sends saved tree to frontend
// frontend gets this tree and displays it
//# sourceMappingURL=server.js.map