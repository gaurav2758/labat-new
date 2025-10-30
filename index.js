import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ==== CONFIGURATION ====
const VERIFY_TOKEN = "labat_verify";           // make up any secret word
const WHATSAPP_TOKEN = "EAAOHnePhqZBMBP26eawQyQermJ4k7DuZAFdewZC5WbyyCZA6UtpZAPdybaWj7EZAuSrhGZC9PkOZBpa49b7ZCQ0tua05ogPF2cWjdkhuvf0pvkfIrbZAkzq4BNLpZClk6fmmP4sWzK9YUOLZB1rUCN5TTddzlqBQKDdNRPlulVyz3n9qeIP9YoHHRHkNmruNcNGS1sfo8yuncuZCwU017aBYsZAJD0zZBxmKnNLDZCRJy0mTjOHfwVeEhtswnTCS7k6OPaIgjxGa8lrQnrADFicbYwUyXHFwOvEVJt2Bz4AlWwZDZD";    // from Meta Developer Console
const PHONE_NUMBER_ID = "853325284530838";// from Meta
// ========================

// ✅ Webhook verification (Meta calls this once)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Handle messages
app.post("/webhook", async (req, res) => {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (msg) {
    const from = msg.from;
    const text = msg.text?.body?.toLowerCase();
    const interactive = msg.interactive;

    // 1️⃣ If user says hi
    if (text === "hi" || text === "hello") {
      await sendCategoryMenu(from);
    }

    // 2️⃣ If user chooses from list
    else if (interactive?.list_reply) {
      const id = interactive.list_reply.id;

      if (id === "cat_audiometers") await sendAudiometerOptions(from);
      else if (id === "cat_tympanometers")
        await sendMessage(from, "We offer a full range of Tympanometers. Our team will reach you soon.");
      else if (id === "cat_evoked")
        await sendMessage(from, "Evoked Potential Systems for AEP testing — want a brochure?");
      else if (id === "cat_vestibular")
        await sendMessage(from, "Vestibular Study Systems help diagnose balance disorders.");
    }

    // 3️⃣ If user chooses a button
    else if (interactive?.button_reply) {
      const id = interactive.button_reply.id;
      if (id === "screening_audiometer")
        await sendMessage(from, "You selected *Screening Audiometer*. We’ll send you product details shortly.");
      else if (id === "diagnostic_audiometer")
        await sendMessage(from, "You selected *Diagnostic Audiometer*. Our sales team will contact you soon.");
    }

    else {
      await sendMessage(from, "Please type *Hi* to start the menu again.");
    }
  }
  res.sendStatus(200);
});

// === Helper functions ===
async function sendCategoryMenu(to) {
  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: "👋 Welcome to *Labat Asia*!\nPlease choose a product category:"
      },
      action: {
        button: "Select Category",
        sections: [
          {
            title: "Our Products",
            rows: [
              { id: "cat_audiometers", title: "Audiometers" },
              { id: "cat_tympanometers", title: "Tympanometers" },
              { id: "cat_evoked", title: "Evoked Potential Systems" },
              { id: "cat_vestibular", title: "Vestibular Studies" }
            ]
          }
        ]
      }
    }
  });
}

async function sendAudiometerOptions(to) {
  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "Please choose the type of Audiometer:" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "screening_audiometer", title: "Screening Audiometer" } },
          { type: "reply", reply: { id: "diagnostic_audiometer", title: "Diagnostic Audiometer" } }
        ]
      }
    }
  });
}

async function sendMessage(to, text) {
  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  });
}

async function sendRequest(body) {
  await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

// Root endpoint (optional)
app.get("/", (_, res) => res.send("✅ Labat WhatsApp Bot running"));
app.listen(3000, () => console.log("🚀 Bot started on port 3000"));
