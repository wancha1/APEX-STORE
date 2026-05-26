import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash on startup if GEMINI_API_KEY is not configured
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// System Instruction detailing the showroom and products in Lira, Uganda
const SYSTEM_INSTRUCTION = `
You are Evelyn, the Senior Elite Technology Concierge at 'Apex Devices & Electronics', the premier showroom for high-performance and luxury technology products in Northern Uganda, located conveniently on Obote Avenue, Lira City.

Your personality is highly professional, warm, tech-savvy, and deeply helpful. You guide developers, business owners, sound engineers, schools, clinics, and churches in Uganda to select and customize their premium hardware setups.

Catalog Overview of Apex Devices:
1. 'Apex TitanBook Pro 16' (Laptop) - Base Price: 6,800,000 UGX (~$1,800 USD). Flagship mobile workstation with Core Ultra 9 processor and RTX 4060 GPU.
2. 'Apex Studio Station Pro V4' (Workstation) - Base Price: 10,500,000 UGX (~$2,760 USD). Elite desktop for CAD design, civil engineering simulations, large database servers with Ryzen 9 and liquid cooling.
3. 'Apex ProAudio Club & Church Rig' (Audio System) - Base Price: 4,500,000 UGX (~$1,180 USD). 3,200W active high-power sound rigs with Mixer options, calibrated for Lira houses of worship, halls and centers.
4. 'Apex SmartOffice Enterprise Network Suite' (Networking) - Base Price: 3,200,000 UGX (~$840 USD). Heavy-duty business storage NAS (8TB) and multi-AP mesh router kits. Excellent for schools, clinics, and hotels.
5. 'Apex Helios Elite Gaming & Virtualization Studio' (Desktop Rig) - Base Price: 14,000,000 UGX (~$3,680 USD). Peerless i9-14900K and liquid-cooled RTX 4080 Super workstation for high-end rendering and simulations.

Delivery Context in Lira, Uganda:
- Detail our immediate door-to-door delivery anywhere across Lira, including Kakoge, Junior Quarters, Teso Bar, Blue Corner, Ojwina, Railway, Boroboro Mission, and Ireda Estate, or secure showroom pickup at Obote Avenue.
- Remind users that because of Lira power grid variations, we strongly recommend our premium APC UPS battery backup accessory options for our desktops, servers, and sound units!

Your goals:
- Actively help users identify the correct option based on their needs, answering technical questions cleanly.
- Keep your answers highly scannable, using list items and bold points. Avoid technical slop or larping.
- Recommend corresponding options from the catalog.
- Keep responses compact, elegant, and focused.
`;

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid message structure' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Graceful fallback when API key is missing
      const userMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';
      let reply = "Hello! Welcome to the Apex Devices & Electronics showroom. I am Evelyn, your premium assistant.\n\n";
      let suggestedProducts: string[] = [];

      if (userMessage.includes('laptop') || userMessage.includes('titanbook') || userMessage.includes('travel')) {
        reply += "I'd highly recommend the **Apex TitanBook Pro 16**! It packs a Core Ultra 9 and custom RTX 4060 graphics, which is superb for portable design and computational workloads. Delivery is available across Lira, including Junior Quarters and Kakoge.";
        suggestedProducts = ['titanbook-pro'];
      } else if (userMessage.includes('sound') || userMessage.includes('audio') || userMessage.includes('church') || userMessage.includes('club')) {
        reply += "We recommend the **Apex ProAudio Club & Church Rig**. It delivers a combined 3,200W peak output with dual 12\" premium cabinets and high-end mixers. We can deliver and set this up for your venue anywhere in Lira!";
        suggestedProducts = ['pro-sound'];
      } else if (userMessage.includes('network') || userMessage.includes('wifi') || userMessage.includes('router') || userMessage.includes('storage')) {
        reply += "Our **Apex SmartOffice Enterprise Network Suite** is peerless, bundling a quad-core gateway controller with an 8TB secure redundant NAS. It's particularly useful for local business administration.";
        suggestedProducts = ['networking-pack'];
      } else if (userMessage.includes('gaming') || userMessage.includes('beast') || userMessage.includes('ultimate') || userMessage.includes('helios')) {
        reply += "You should take a look at the custom **Apex Helios Elite** liquid-cooled desktop. Carrying an i9-14900K and an RTX 4080 Super, it is the absolute peak of processing power!";
        suggestedProducts = ['cyber-rig'];
      } else {
        reply += "How can I help you customize your hardware today? We specialize in customizable workstations, gaming rigs, professional systems, and enterprise networking, right here in Lira, Uganda. Select any product to begin customization!";
      }

      return res.json({
        text: reply + "\n\n*(Note: Evelyn is currently running in fallback guide mode. Configure GEMINI_API_KEY under Secrets to enable full AI-reasoning capability!)*",
        suggestedProducts
      });
    }

    // Format chat history for Gemini chat API or simple history prompting
    // To make it incredibly robust, we will convert the custom message structure to content parts
    const chatHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const currentMessage = messages[messages.length - 1].text;

    // Call generateContent with systemInstruction and model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: currentMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I apologize, but I could not formulate a response. Please let me know how I can help with our Apex showroom items!";

    // Detect keywords to suggest highlighting specific products dynamically
    const replyLower = replyText.toLowerCase();
    const suggestedProducts: string[] = [];
    if (replyLower.includes('titanbook')) suggestedProducts.push('titanbook-pro');
    if (replyLower.includes('studio station') || replyLower.includes('v4')) suggestedProducts.push('studio-station');
    if (replyLower.includes('proaudio') || replyLower.includes('church') || replyLower.includes('sound rig') || replyLower.includes('audio')) suggestedProducts.push('pro-sound');
    if (replyLower.includes('smartoffice') || replyLower.includes('network') || replyLower.includes('gateway') || replyLower.includes('nas')) suggestedProducts.push('networking-pack');
    if (replyLower.includes('helios') || replyLower.includes('gaming') || replyLower.includes('cyber')) suggestedProducts.push('cyber-rig');

    return res.json({
      text: replyText,
      suggestedProducts
    });

  } catch (error: any) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Evelyn is experiencing high frequency. Please try again in a few seconds.' });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Showroom Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
