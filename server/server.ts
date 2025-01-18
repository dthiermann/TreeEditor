const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
import { Request, Response } from 'express';

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('/', (req : Request, res : Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// todo:
// when user edits display node, send updated display node to server as json
// figure out which http type this would be

// when page loads
// server sends saved tree to frontend
// frontend gets this tree and displays it