const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'src')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});