const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const PHONE_NUMBER_ID = '830701940119775';
const ACCESS_TOKEN = 'EAAaTcuN4LEBPpSQZCmhd68IFtiQZBlAnuAy8tDDyp42VZAJcRSJD0tWiKTH8oGG4YylidPRZAgbkWwfi';
const WEBHOOK_VERIFY_TOKEN = 'gyan_ai_2024';

const db = new sqlite3.Database('./whatsapp.db');
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT, message TEXT, response TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach(entry => {
            const changes = entry.changes[0];
            if (changes?.field === 'messages') {
                const messages = changes.value?.messages;
                if (messages) {
                    messages.forEach(message => processMessage(message));
                }
            }
        });
    }
    res.sendStatus(200);
});

async function processMessage(message) {
    const phone = message.from;
    const text = message.text?.body;
    if (!text) return;
    
    console.log(`Message from ${phone}: ${text}`);
    
    let response = 'WhatsApp Business API working!';
    if (text.toLowerCase() === 'test') {
        response = 'Bot working perfectly with database!';
    }
    
    db.run("INSERT INTO messages (phone, message, response) VALUES (?, ?, ?)", [phone, text, response]);
    
    await axios.post(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: 'whatsapp',
        to: phone,
        text: { body: response }
    }, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
    });
    
    console.log('Response sent');
}

app.listen(3000, () => console.log('WhatsApp bot running on port 3000'));