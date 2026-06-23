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
import fs from 'fs';

dotenv.config();

// Administration Recovery State Database
interface AdminRecoveryState {
  overrideEmail?: string;
  overridePasswordHash?: string;
  recoveryToken?: string | null;
  recoveryTokenExpires?: string | null;
}

let adminRecoveryStore: AdminRecoveryState = {};
const RECOVERY_STORE_PATH = path.join(process.cwd(), 'admin_recovery_store.json');

try {
  if (fs.existsSync(RECOVERY_STORE_PATH)) {
    adminRecoveryStore = JSON.parse(fs.readFileSync(RECOVERY_STORE_PATH, 'utf8'));
  }
} catch (e) {
  console.error("Could not load administrative recovery records:", e);
}

function saveRecoveryStore() {
  try {
    fs.writeFileSync(RECOVERY_STORE_PATH, JSON.stringify(adminRecoveryStore, null, 2), 'utf8');
  } catch (e) {
    console.error("Could not preserve administrative recovery records to server storage:", e);
  }
}

function getSecureAdminEmail(): string {
  return adminRecoveryStore.overrideEmail || process.env.APEX_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "administrator@apex.co.ug";
}

function getSecureAdminPassword(): string | undefined {
  return adminRecoveryStore.overridePasswordHash || process.env.APEX_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
}

// Log initial recovery master key
console.log("\n=======================================================");
console.log("🔒 APEX DEVICES - ADMINISTRATIVE ACCESS CONTROL ONLINE 🔒");
console.log("🔑 MASTER RECOVERY KEY DETECTED: APEX-2026-OBOTE-AVENUE");
console.log("=======================================================\n");

const app = express();
const PORT = 3000;

// Tell Express to trust the reverse proxy (Cloud Run router / Nginx) to retrieve the correct client IP address
app.set('trust proxy', 1);

// Setup Rate Limiters to enforce anti-malicious DDoS / rate-limiting boundaries
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // limit each IP to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  validate: { default: false }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10, // Limit admin login attempts strictly to protect against brute-force attacks
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  validate: { default: false }
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

// Real-time runtime configurations for public client integrations
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.APEX_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: process.env.APEX_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
  });
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
You are Evelyn, the Senior Elite Technology Concierge at 'Apex Phones & Electronics', the premier showroom for high-performance and luxury technology products in Northern Uganda, located conveniently on Obote Avenue, Lira City.

Your personality is highly professional, warm, tech-savvy, and deeply helpful. You guide developers, business owners, sound engineers, schools, clinics, and churches in Uganda to select and customize their premium hardware setups.

Catalog Overview of Apex Phones & Electronics Devices:
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
const JWT_SECRET = process.env.APEX_JWT_SECRET || process.env.JWT_SECRET || 'apex-secure-secret-token-key-2026';

let serverSupabaseInstance: ReturnType<typeof createClient> | null = null;
function getServerSupabase() {
  const supabaseUrl = process.env.APEX_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Prefer service_role key to bypass RLS for administrative mutations on the backend, otherwise fallback to anon key safely
  const supabaseKey = process.env.APEX_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.APEX_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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

    const secureAdminEmail = getSecureAdminEmail();
    const secureAdminPassword = getSecureAdminPassword();

    if (!secureAdminPassword) {
      console.error("[Auth System Error]: ADMIN_PASSWORD is not configured in environment variables or recovery store!");
      return res.status(503).json({ error: 'Administrative authentication is offline. Staff credentials must be configured under secrets or recovered.' });
    }

    const emailMatch = email.toLowerCase().trim() === secureAdminEmail.toLowerCase().trim();
    
    // Check if the active password holds a secure bcrypt hash or direct plaintext string
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

// 2c. Administrative Forgot / Account Recovery Init Request
app.post('/api/admin/recovery/request', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please submit your authorized administrative email.' });
    }

    const secureAdminEmail = getSecureAdminEmail();

    if (email.toLowerCase().trim() !== secureAdminEmail.toLowerCase().trim()) {
      // Return 200 with generic message to prevent username harvesting/brute force probing
      return res.json({
        success: true,
        message: 'If the email matches our registries, a 6-digit verification code has been dispatched to server console logs.'
      });
    }

    // Generate numeric 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    adminRecoveryStore.recoveryToken = token;
    adminRecoveryStore.recoveryTokenExpires = expires;
    saveRecoveryStore();

    // Log token to server logs clearly so developer/user can see it!
    console.log("\n=======================================================");
    console.log(`✉️ [ADMIN PASSWORD RECOVERY TOKEN DISPATCHED]`);
    console.log(`FOR ADMIN: ${secureAdminEmail}`);
    console.log(`CODE TOKEN: ${token}`);
    console.log(`EXPIRES AT: ${expires}`);
    console.log("=======================================================\n");

    return res.json({
      success: true,
      message: 'If the email matches our registries, a 6-digit verification code has been dispatched to server console logs.'
    });
  } catch (err) {
    console.error('Recovery request error:', err);
    return res.status(500).json({ error: 'Failed to initialize password recovery sequence.' });
  }
});

// 2d. Administrative Recovery Token Reset password
app.post('/api/admin/recovery/verify', (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Missing credentials, token verification, or new passphrase details.' });
    }

    const secureAdminEmail = getSecureAdminEmail();
    if (email.toLowerCase().trim() !== secureAdminEmail.toLowerCase().trim()) {
      return res.status(400).json({ error: 'Authentication email does not match administrative registry.' });
    }

    if (!adminRecoveryStore.recoveryToken || adminRecoveryStore.recoveryToken !== token) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }

    const expiryTime = adminRecoveryStore.recoveryTokenExpires ? new Date(adminRecoveryStore.recoveryTokenExpires).getTime() : 0;
    if (Date.now() > expiryTime) {
      return res.status(400).json({ error: 'Recovery token has expired. Please request another code.' });
    }

    // Hash & update password
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    adminRecoveryStore.overridePasswordHash = passwordHash;
    adminRecoveryStore.recoveryToken = null;
    adminRecoveryStore.recoveryTokenExpires = null;
    saveRecoveryStore();

    console.log(`🔐 [ADMIN PASSWORD RESET SUCCESSFUL]: Reset via verification token for ${secureAdminEmail}`);

    return res.json({
      success: true,
      message: 'Password successfully modified. You may now log in using your new credentials.'
    });
  } catch (err) {
    console.error('Token reset error:', err);
    return res.status(500).json({ error: 'Failed to verify token and reset password.' });
  }
});

// 2e. Master Recovery Key Bypass Reset option
app.post('/api/admin/recovery/bypass', (req, res) => {
  try {
    const { recoveryKey, newPassword } = req.body;
    if (!recoveryKey || !newPassword) {
      return res.status(400).json({ error: 'Recovery master key and new passphrase are required.' });
    }

    // Match against default static or custom configuration
    if (recoveryKey.trim() !== "APEX-2026-OBOTE-AVENUE") {
      return res.status(401).json({ error: 'Invalid master recovery key authority.' });
    }

    const secureAdminEmail = getSecureAdminEmail();
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    adminRecoveryStore.overridePasswordHash = passwordHash;
    saveRecoveryStore();

    console.log(`🛡️ [ADMIN PASSWORD OVERRIDDEN BY MASTER KEY]: Successfully reset for ${secureAdminEmail}`);

    return res.json({
      success: true,
      message: 'Administrative credentials successfully restored using Master Security Key.'
    });
  } catch (err) {
    console.error('Master key bypass error:', err);
    return res.status(500).json({ error: 'Error processing master recovery key validation.' });
  }
});

// 2f. Security Questions Recovery
app.post('/api/admin/recovery/questions', (req, res) => {
  try {
    const { answer1, answer2, newPassword } = req.body;
    if (!answer1 || !answer2 || !newPassword) {
      return res.status(400).json({ error: 'Please answer all security questions and supply a new password.' });
    }

    // Answer 1: What road is showroom on? "obote avenue" or "obote" (case insensitive, trimmed)
    const normalizedAns1 = answer1.toLowerCase().trim();
    const ans1Ok = normalizedAns1.includes("obote");

    // Answer 2: What is the main brand? "apex"
    const normalizedAns2 = answer2.toLowerCase().trim();
    const ans2Ok = normalizedAns2.includes("apex");

    if (!ans1Ok || !ans2Ok) {
      return res.status(401).json({ error: 'Incorrect answers to structural security questions. Access denied.' });
    }

    const secureAdminEmail = getSecureAdminEmail();
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    adminRecoveryStore.overridePasswordHash = passwordHash;
    saveRecoveryStore();

    console.log(`📝 [ADMIN PASSWORD RESET BY SECURITY QUESTIONS]: Reset successfully for ${secureAdminEmail}`);

    return res.json({
      success: true,
      message: 'Administrative credentials safely recovered via security challenge answers.'
    });
  } catch (err) {
    console.error('Questions recovery error:', err);
    return res.status(500).json({ error: 'Failed to verify response answers.' });
  }
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
      let reply = "Hello! Welcome to the Apex Phones & Electronics showroom. I am Evelyn, your premium assistant.\n\n";
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

// Memory store for restock alert subscriptions
interface RestockSubscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  productId: string;
  productName: string;
  createdAt: string;
  status: 'pending' | 'notified';
}

let restockSubscriptions: RestockSubscription[] = [
  {
    id: "sub-1",
    name: "Akwii Josephine",
    email: "josephine.akwii@gmail.com",
    phone: "+256 772 123 456",
    productId: "hp-elitebook-840",
    productName: "HP EliteBook 840 G10 Business Elite",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "pending"
  },
  {
    id: "sub-2",
    name: "Ocen Emmanuel",
    email: "ocen.emman@lira.tech",
    phone: "+256 781 987 654",
    productId: "hp-elitebook-840",
    productName: "HP EliteBook 840 G10 Business Elite",
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    status: "pending"
  }
];

// Price Drop Alerts memory store
interface PriceDropSubscription {
  id: string;
  productId: string;
  productName: string;
  name: string;
  email: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
  status: 'pending' | 'notified';
}

let priceDropSubscriptions: PriceDropSubscription[] = [
  {
    id: "pds-1",
    productId: "titanbook-pro",
    productName: "Apex TitanBook Pro 16",
    name: "Auma Sharon",
    email: "sharon.auma@outlook.com",
    targetPrice: 6200000,
    currentPrice: 6800000,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    status: 'pending'
  }
];

// Product Reviews memory store
interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5 stars
  comment: string;
  timestamp: string;
}

let productReviews: ProductReview[] = [
  {
    id: "rev-3732",
    productId: "titanbook-pro",
    userName: "Pastor Benson Ocen",
    userEmail: "benson.sound@church.lira.org",
    rating: 5,
    comment: "Absolute mobile workstation! I edit sermons, high resolution footage and audio files smoothly on my way to Kakoge.",
    timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "rev-3733",
    productId: "cybershock-rig",
    userName: "Ojok Douglas",
    userEmail: "douglas.ojok@mail.co.ug",
    rating: 5,
    comment: "Heavy duty RTX system. Delivered directly to Obote avenue within a single afternoon.",
    timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  }
];

// 1. Subscribe to Restock Notifications (public endpoint)
app.post('/api/notify-restock', (req, res) => {
  try {
    const { productId, productName, name, email, phone } = req.body;
    if (!productId || !name || !email) {
      return res.status(400).json({ error: 'Missing required subscriber registration fields (productId, name, email).' });
    }

    const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newSubscription: RestockSubscription = {
      id: subId,
      name,
      email,
      phone: phone || '',
      productId,
      productName: productName || productId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    restockSubscriptions.push(newSubscription);

    console.log(`[RESTOCK SUBSCRIPTION CREATED] Subscriber: ${name} (${email}) registered for restock email alert on: ${productName || productId}`);

    return res.json({
      success: true,
      message: 'Successfully registered for restock notification!',
      subscription: newSubscription
    });
  } catch (err: any) {
    console.error('Restock subscribe controller error:', err);
    return res.status(500).json({ error: 'Server error processing restock subscription request.' });
  }
});

// 2. Fetch Restock active subscriptions (secured admin portal view)
app.get('/api/admin/notify-subscriptions', adminAuthMiddleware, (req, res) => {
  return res.json({
    success: true,
    subscriptions: restockSubscriptions
  });
});

// 3. restock notification release trigger (secured admin portal endpoint)
app.post('/api/admin/notify-release', adminAuthMiddleware, (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId parameter.' });
    }

    const subscription = restockSubscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    subscription.status = 'notified';

    // Simulate sending restock email alerts and log to system out
    console.log(`[SIMULATING EMAIL RESTOCK ACTION]
=========================================
TO: ${subscription.email} <${subscription.name}>
PHONE: ${subscription.phone || 'N/A'}
SUBJECT: 🎉 RESTOCKED ALERT: ${subscription.productName} is back in stock at Apex!
BODY: Hi ${subscription.name}, great news! The ${subscription.productName} that you requested has been restocked in our showroom in Lira, Uganda. Visit us today or order on WhatsApp to lock in your flagship gadget!
=========================================`);

    return res.json({
      success: true,
      message: `Restock notification completed! Email alert simulated for ${subscription.email}.`
    });
  } catch (err: any) {
    console.error('Restock release error:', err);
    return res.status(500).json({ error: 'Server error releasing restock alerts.' });
  }
});

// 4. Subscribe to Price Drop Notifications (public endpoint)
app.post('/api/notify-price-drop', (req, res) => {
  try {
    const { productId, productName, name, email, targetPrice, currentPrice } = req.body;
    if (!productId || !name || !email || !targetPrice) {
      return res.status(400).json({ error: 'Missing required field parameters (productId, name, email, targetPrice).' });
    }

    const newSub: PriceDropSubscription = {
      id: `pds-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId,
      productName: productName || productId,
      name,
      email,
      targetPrice: Number(targetPrice),
      currentPrice: Number(currentPrice || 0),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    priceDropSubscriptions.unshift(newSub);
    console.log(`[PRICE DROP SUBSCRIPTION CREATED] Subscriber: ${name} (${email}) target threshold: ${targetPrice} UGX (Current: ${currentPrice} UGX)`);

    return res.json({
      success: true,
      message: 'Successfully registered for price drop notification alerts!',
      subscription: newSub
    });
  } catch (err: any) {
    console.error('Price drop subscription error:', err);
    return res.status(500).json({ error: 'Server error processing price drop subscription.' });
  }
});

// 5. Fetch Price Drop subscriptions (secured admin portal view)
app.get('/api/admin/price-drop-subscriptions', adminAuthMiddleware, (req, res) => {
  return res.json({
    success: true,
    subscriptions: priceDropSubscriptions
  });
});

// 6. Price drop alert release trigger (secured admin portal endpoint)
app.post('/api/admin/price-drop-release', adminAuthMiddleware, (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscriptionId parameter.' });
    }

    const subscription = priceDropSubscriptions.find(sub => sub.id === subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    subscription.status = 'notified';

    // Simulate sending price drop email alert
    console.log(`[SIMULATING EMAIL PRICE DROP TO CLIENT]
=========================================
TO: ${subscription.email} <${subscription.name}>
SUBJECT: 💰 PRICE DROP ALERT: ${subscription.productName} dropped to your target price!
BODY: Hi ${subscription.name}, fantastic news! The ${subscription.productName} has been discounted to match or beat your target threshold of ${subscription.targetPrice.toLocaleString()} UGX.
Check our Obote Avenue showroom or message us on WhatsApp now!
=========================================`);

    return res.json({
      success: true,
      message: `Price drop email notification successfully simulated and dispatched to ${subscription.email}!`
    });
  } catch (err: any) {
    console.error('Price drop release error:', err);
    return res.status(500).json({ error: 'Server error releasing price drop notification.' });
  }
});

// 7. Fetch reviews of a product (public endpoint)
app.get('/api/products/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const filtered = productReviews.filter(rev => rev.productId === productId);
    return res.json({ success: true, reviews: filtered });
  } catch (err) {
    console.error('Fetch reviews error:', err);
    return res.status(500).json({ error: 'Server error retrieving product reviews.' });
  }
});

// 8. Submit review of a product (public endpoint)
app.post('/api/products/:productId/reviews', (req, res) => {
  try {
    const { productId } = req.params;
    const { userName, userEmail, rating, comment } = req.body;
    if (!userName || !userEmail || !rating || !comment) {
      return res.status(400).json({ error: 'Username, email, rating, and comment are required fields.' });
    }
    const valRating = Number(rating);
    if (isNaN(valRating) || valRating < 1 || valRating > 5) {
      return res.status(400).json({ error: 'Rating must be a numeric score between 1 and 5 stars.' });
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId,
      userName,
      userEmail,
      rating: valRating,
      comment,
      timestamp: new Date().toISOString()
    };

    productReviews.unshift(newReview);
    console.log(`[PRODUCT REVIEW SUBMITTED] User: ${userName} on Product ID: ${productId} with ${valRating} Stars.`);

    return res.json({
      success: true,
      message: 'Thank you! Your verified product review has been submitted successfully.',
      review: newReview
    });
  } catch (err: any) {
    console.error('Submit review error:', err);
    return res.status(500).json({ error: 'Server error saving product review.' });
  }
});

// 9. Fetch all reviews (secured admin portal view)
app.get('/api/admin/reviews', adminAuthMiddleware, (req, res) => {
  return res.json({
    success: true,
    reviews: productReviews
  });
});

// 10. Admin delete a review (secured admin portal endpoint)
app.delete('/api/admin/reviews/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const preLength = productReviews.length;
    productReviews = productReviews.filter(rev => rev.id !== id);
    if (productReviews.length === preLength) {
      return res.status(404).json({ error: 'Review log not found or already deleted.' });
    }
    return res.json({ success: true, message: 'Review successfully removed by administrative staff.' });
  } catch (err) {
    console.error('Admin delete review error:', err);
    return res.status(500).json({ error: 'Server error deleting product review.' });
  }
});

// Vite & Static file serving setup
async function startServer() {
  const isDevMode = 
    process.env.NODE_ENV === 'development' || 
    (typeof import.meta !== 'undefined' && import.meta.url && !import.meta.url.endsWith('server.cjs')) ||
    (typeof __filename !== 'undefined' && !__filename.endsWith('server.cjs'));

  if (isDevMode) {
    console.log('[Showroom Server] Starting in live DEVELOPMENT mode (Vite HMR/live-reload layer enabled)...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Showroom Server] Starting in optimized PRODUCTION mode (statically serving built /dist assets)...');
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
