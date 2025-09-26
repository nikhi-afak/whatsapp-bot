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
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
  
  const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message }
      })
    });
    
    const result = await response.json();
    console.log('Message sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Receive and respond to messages
app.post('/webhook', async (req, res) => {
  const body = req.body;
  
  console.log('Received webhook:', JSON.stringify(body, null, 2));
  
  if (body.object === 'whatsapp_business_account') {
    body.entry.forEach(async (entry) => {
      const changes = entry.changes;
      changes.forEach(async (change) => {
        if (change.value.messages) {
          const messages = change.value.messages;
          messages.forEach(async (message) => {
            const from = message.from;
            const messageText = message.text?.body;
            
            console.log(`Received message from ${from}: ${messageText}`);
            
            // Auto-respond to the message
            if (messageText) {
              const responseMessage = `Hello! I received your message: "${messageText}". This is an automated response from Gyan AI Bot.`;
              await sendWhatsAppMessage(from, responseMessage);
            }
          });
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404).send('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
