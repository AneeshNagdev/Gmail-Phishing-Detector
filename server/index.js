const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Phishing Detector Backend is running');
});

app.post('/scan', (req, res) => {
    const { sender_domain, reply_to_domain, link_domains, risk_score, risk_level, flags } = req.body;

    // Privacy Guard: strictly reject request if it contains sensitive fields
    // This ensures we never accidentally log PII even if the frontend sends it
    if (req.body.body || req.body.subject || req.body.recipient) {
        console.warn('Blocked request containing PII');
        return res.status(400).json({ error: 'Privacy violation: content not allowed' });
    }

    if (!sender_domain || risk_score === undefined || !risk_level) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `INSERT INTO scans (sender_domain, reply_to_domain, link_domains, risk_score, risk_level, flags) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [
        sender_domain,
        reply_to_domain || null,
        JSON.stringify(link_domains || []),
        risk_score,
        risk_level,
        JSON.stringify(flags || [])
    ];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error inserting scan:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({
            message: 'Scan saved successfully',
            id: this.lastID
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
