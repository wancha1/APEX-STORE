import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

// Setup Rate Limiters to enforce anti-malicious DDoS / rate-limiting boundaries
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // limit each IP to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // Limit admin login attempts strictly to protect against brute-force attacks
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Configure Multer in-memory storage for safe stream-based file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
  },
});

app.use(express.json());
app.use(cookieParser());

// Helmet security headers tailored for the AI Studio preview environment
app.use(helmet({
  frameguard: false, // Disables X-Frame-Options: SAMEORIGIN to allow preview within standard iframe sandboxes
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
      connectSrc: [
        "'self'", 
        "https://*.supabase.co", 
        "wss://*.supabase.co",
        "https://*.googleapis.com", 
        "https://*.firebaseio.com",
        "https://*.run.app",
        "wss://*.run.app"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://*.supabase.co", 
        "https://*.unsplash.com", 
        "https://*.google.com",
        "https://*.githubusercontent.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      frameAncestors: ["'self'", "https://*.google.com", "https://*.run.app", "https://ai.studio", "https://*.studio"],
    },
  },
}));

// Cross-Origin Resource Sharing (CORS) security configuration favoring strict origin match & cookie credentials
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        // Enforce strict protection for write endpoints and APIs
        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
          return res.status(403).json({ error: 'CORS policy violation: Untrusted origin or cross-site tamper attempt rejected.' });
        }
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid origin header.' });
    }
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Apply API middleware rate limiter
app.use('/api', apiLimiter);

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
const JWT_SECRET = process.env.JWT_SECRET || 'apex-secure-secret-token-key-2026';

let serverSupabaseInstance: ReturnType<typeof createClient> | null = null;
function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // Prefer service_role key to bypass RLS for administrative mutations on the backend, otherwise fallback to anon key safely
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!serverSupabaseInstance) {
    serverSupabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return serverSupabaseInstance;
}

// Security Middleware to verify Super Admin Roles in incoming network transactions using secure httpOnly cookies
function adminAuthMiddleware(req: any, res: any, next: any) {
  try {
    // 1. Recover the jwt token from the secure httpOnly cookie
    const token = req.cookies.apex_admin_token;
    if (!token) {
      return res.status(401).json({ error: 'Access denied. Administrative session cookie is missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded && decoded.role === 'super_admin') {
      req.adminUser = decoded;

      // 2. CSRF Double-Submit Token check for write operations
      // Non-idempotent HTTP verbs (POST, PUT, DELETE, PATCH) are checked
      if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        const csrfTokenHeader = req.headers['x-csrf-token'];
        if (!csrfTokenHeader || csrfTokenHeader !== decoded.csrfToken) {
          return res.status(403).json({ error: 'CSRF token validation failed. Mutating operation blocked.' });
        }
      }

      return next();
    }

    return res.status(403).json({ error: 'Forbidden. Invalid access role.' });
  } catch (err) {
    return res.status(401).json({ error: 'Access denied. Invalid or expired administrative session.' });
  }
}

// 1. Secure Admin Login API to verify credentials strictly using environment profiles
app.post('/api/admin/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required credentials.' });
    }

    const secureAdminEmail = process.env.ADMIN_EMAIL;
    const secureAdminPassword = process.env.ADMIN_PASSWORD;

    if (!secureAdminEmail || !secureAdminPassword) {
      console.error("[Auth System Error]: ADMIN_EMAIL and ADMIN_PASSWORD are not configured in environment variables!");
      return res.status(503).json({ error: 'Administrative authentication is offline. Staff credentials must be configured under secrets.' });
    }

    const emailMatch = email.toLowerCase().trim() === secureAdminEmail.toLowerCase().trim();
    
    // Check if the ADMIN_PASSWORD environment variable holds a secure bcrypt hash or direct plaintext string
    let passwordMatch = false;
    if (secureAdminPassword.startsWith('$2a$') || secureAdminPassword.startsWith('$2b$') || secureAdminPassword.startsWith('$2y$')) {
      passwordMatch = bcrypt.compareSync(password, secureAdminPassword);
    } else {
      passwordMatch = password === secureAdminPassword;
    }

    if (emailMatch && passwordMatch) {
      // 1. Generate unique CSRF Token for Double-Submit Pattern
      const csrfToken = crypto.randomBytes(24).toString('hex');

      // 2. Sign secure administrative JWT session token containing CSRF identifier
      const token = jwt.sign(
        { email: secureAdminEmail.toLowerCase().trim(), role: 'super_admin', csrfToken },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // 3. Bake the secure httpOnly cookie with maximum safety parameters
      // Note: 'sameSite: none' with 'secure: true' is chosen here to support flawless AI Studio sandbox previews in embedded frames,
      // which would otherwise reject SameSite=Lax/Strict inside third-party contexts.
      res.cookie('apex_admin_token', token, {
        httpOnly: true,
        secure: true, 
        sameSite: 'none',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/'
      });

      return res.json({
        success: true,
        csrfToken,
        user: {
          uid: 'supa-admin-id',
          email: secureAdminEmail.toLowerCase().trim(),
          displayName: 'Supa Admin',
          role: 'super_admin'
        }
      });
    }

    return res.status(401).json({ error: 'Incorrect staff or master credentials.' });
  } catch (error) {
    console.error('[Admin Auth Error]:', error);
    return res.status(500).json({ error: 'Internal administrative auth error.' });
  }
});

// 2. Verified Active Session Token Handshake with Sliding Window Session Renewal
app.get('/api/admin/me', adminAuthMiddleware, (req: any, res) => {
  try {
    // Implement token renewal sliding window strategy to refresh the cookie duration recursively on activity
    const newCsrfToken = crypto.randomBytes(24).toString('hex');
    const renewedToken = jwt.sign(
      { email: req.adminUser.email, role: 'super_admin', csrfToken: newCsrfToken },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('apex_admin_token', renewedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: '/'
    });

    return res.json({
      success: true,
      csrfToken: newCsrfToken,
      user: {
        uid: 'supa-admin-id',
        email: req.adminUser.email,
        displayName: 'Supa Admin',
        role: 'super_admin'
      }
    });
  } catch (error) {
    console.error('[Session Check Error]:', error);
    return res.status(500).json({ error: 'Session handshake processing error.' });
  }
});

// 2b. Secure Session Logout Clear Cookie route
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('apex_admin_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  return res.json({ success: true, message: 'Logged out successfully, cookie sessions neutralized.' });
});

// 3. Protected Product Upsert Endpoint (supports single or bulk batch array upserts)
app.post('/api/admin/products', adminAuthMiddleware, async (req: any, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Invalid product payload.' });
    }

    const isArray = Array.isArray(payload);
    if (!isArray && !payload.id) {
      return res.status(400).json({ error: 'Invalid product layout. ID is required.' });
    }
    if (isArray && payload.some((p: any) => !p.id)) {
      return res.status(400).json({ error: 'Invalid payload batch. All products must contain a valid ID.' });
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase database is not configured on the server.' });
    }

    const { error } = await supabase
      .from('products')
      .upsert(payload);

    if (error) {
      return res.status(500).json({ error: `Database save failed: ${error.message}` });
    }

    return res.json({ success: true, message: 'Product records upserted successfully.' });
  } catch (error: any) {
    console.error('[Admin Product Save Error]:', error);
    return res.status(500).json({ error: 'Internal server error saving product data.' });
  }
});

// 4. Protected Product Delete Endpoint
app.delete('/api/admin/products/:id', adminAuthMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required for deletion.' });
    }
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase database is not configured on the server.' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: `Database delete failed: ${error.message}` });
    }

    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('[Admin Product Delete Error]:', error);
    return res.status(500).json({ error: 'Internal server error deleting product.' });
  }
});

// 5. Protected Sheets Sync Configuration Endpoint
app.post('/api/admin/sheet-configs', adminAuthMiddleware, async (req: any, res) => {
  try {
    const config = req.body;
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase database is not configured.' });
    }

    const { error } = await supabase
      .from('sheet_configs')
      .upsert(config);

    if (error) {
      return res.status(500).json({ error: `Database save failed: ${error.message}` });
    }

    return res.json({ success: true, message: 'Google Sheets configuration saved successfully.' });
  } catch (error: any) {
    console.error('[Admin Sheet Config Save Error]:', error);
    return res.status(500).json({ error: 'Internal server error saving sheet config.' });
  }
});

// 6. Protected Sheets Sync Audit Log Writer Endpoint
app.post('/api/admin/sheet-sync-logs', adminAuthMiddleware, async (req: any, res) => {
  try {
    const log = req.body;
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase database is not configured.' });
    }

    const { error } = await supabase
      .from('sheet_sync_logs')
      .insert(log);

    if (error) {
      return res.status(500).json({ error: `Database write failed: ${error.message}` });
    }

    return res.json({ success: true, message: 'Sync log written successfully.' });
  } catch (error: any) {
    console.error('[Admin Log Write Error]:', error);
    return res.status(500).json({ error: 'Internal server error writing audit logs.' });
  }
});

// 7. Protected Media File Upload Endpoint with strict JWT proxying
app.post('/api/admin/upload', adminAuthMiddleware, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided for upload.' });
    }
    const supabase = getServerSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase storage service is not configured on the server.' });
    }

    const file = req.file;
    const cleanName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `products/${cleanName}`;

    const { data, error } = await supabase.storage
      .from('product-media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return res.status(500).json({ error: `Storage upload failed: ${error.message}` });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-media')
      .getPublicUrl(filePath);

    return res.json({
      success: true,
      file: {
        name: file.originalname,
        url: publicUrl,
        size: `${(file.size / 1024).toFixed(1)} KB`
      }
    });

  } catch (error: any) {
    console.error('[Admin Upload Error]:', error);
    return res.status(500).json({ error: error.message || 'Administrative media upload error.' });
  }
});

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
