const express = require('express');
const db = require('./database');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Phishing Detector Backend is running');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
