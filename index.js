const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Webhook verification
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Receive messages
app.post('/webhook', (req, res) => {
  const body = req.body;
  
  console.log('Received webhook:', JSON.stringify(body, null, 2));
  
  if (body.object) {
    if (body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]) {
      
      const message = body.entry[0].changes[0].value.messages[0];
      console.log('Received message:', message.text.body);
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
