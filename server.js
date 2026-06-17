const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const port = 3000;

// SSE: Map of userId → array of mobile SSE response objects
const mobileClients = new Map();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error(err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());
app.use(session({
    secret: 'medicine-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Try compiling on startup if source exists
if (fs.existsSync('check.cpp')) {
    try {
        console.log("Compiling check.cpp...");
        execSync('g++ check.cpp -o check');
        console.log("Compiled successfully.");
    } catch (err) {
        console.error("Compilation failed. Ensure g++ (MinGW installed/in Path).", err.message);
    }
}

// Medicine Schema
const MedicineSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    time: { type: String, required: true },
    dosage: { type: String, default: '1 pill' },
    instructions: { type: String, default: 'After Food' },
    shape: { type: String, default: 'pill' },
    category: { type: String, default: 'Tablets' },
    reminderSound: { type: String, default: 'chime' }
});
const Medicine = mongoose.model('Medicine', MedicineSchema);

// GET: Return all medicines for logged in user
app.get('/api/medicines', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
        const userMeds = await Medicine.find({ userId: req.session.userId }).sort({ time: 1 });
        res.json(userMeds);
    } catch (err) {
        res.status(500).json({ error: "Server error fetching medicines" });
    }
});

function timeToMinutes(t) {
    if (!t || t.length !== 5 || t[2] !== ':') return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// Helper function for medicine safety validations
function checkSafety(time, userMeds, editingId = null) {
    const otherMeds = userMeds.filter(m => m._id.toString() !== (editingId ? editingId.toString() : ''));

    // 1. Same time slot limit (max 3)
    const sameTimeMeds = otherMeds.filter(m => m.time === time);
    if (sameTimeMeds.length >= 3) {
        return { isUnsafe: true, error: "Maximum 3 medicines allowed for one time slot." };
    }

    // 2. 2-hour gap safety (120 minutes)
    for (let med of otherMeds) {
        if (med.time === time) continue; // Multiple medicines at same time slot allowed (max 3, handled above)
        const diff = Math.abs(timeToMinutes(time) - timeToMinutes(med.time));
        if (diff < 120) {
            return { isUnsafe: true, error: "Medicine timing is too close. Keep at least 2 hours gap." };
        }
    }

    return { isUnsafe: false };
}

// POST: Add new medicine if unsafe gap check passes
app.post('/api/medicines', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

        const { name, time, dosage, instructions, shape, category, reminderSound } = req.body;
        if (!name || !time) return res.status(400).json({ error: "Missing name or time" });

        const userMeds = await Medicine.find({ userId: req.session.userId });

        const { isUnsafe, error } = checkSafety(time, userMeds);

        if (isUnsafe) {
            return res.status(400).json({ error });
        }

        const newMed = new Medicine({ 
            userId: req.session.userId, 
            name, 
            time, 
            dosage: dosage || '1 pill', 
            instructions: instructions || 'After Food', 
            shape: shape || 'pill',
            category: category || 'Tablets',
            reminderSound: reminderSound || 'chime'
        });
        await newMed.save();
        res.status(201).json(newMed);
    } catch (err) {
        res.status(500).json({ error: "Server error adding medicine" });
    }
});

// PUT: Edit existing medicine
app.put('/api/medicines/:id', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

        const { name, time, dosage, instructions, shape, category, reminderSound } = req.body;
        const { id } = req.params;

        if (!name || !time) return res.status(400).json({ error: "Missing name or time" });

        const medToEdit = await Medicine.findOne({ _id: id, userId: req.session.userId });
        if (!medToEdit) return res.status(404).json({ error: "Medicine not found" });

        const userMeds = await Medicine.find({ userId: req.session.userId });

        const { isUnsafe, error } = checkSafety(time, userMeds, id);

        if (isUnsafe) {
            return res.status(400).json({ error });
        }

        medToEdit.name = name;
        medToEdit.time = time;
        medToEdit.dosage = dosage || '1 pill';
        medToEdit.instructions = instructions || 'After Food';
        medToEdit.shape = shape || 'pill';
        medToEdit.category = category || 'Tablets';
        medToEdit.reminderSound = reminderSound || 'chime';
        await medToEdit.save();

        res.json(medToEdit);
    } catch (err) {
        res.status(500).json({ error: "Server error updating medicine" });
    }
});

// DELETE: Remove existing medicine
app.delete('/api/medicines/:id', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
        const { id } = req.params;
        await Medicine.findOneAndDelete({ _id: id, userId: req.session.userId });
        res.json({ message: "Medicine deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error deleting medicine" });
    }
});

// --- Authentication Endpoints ---

app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        req.session.userId = user._id; // auto login after signup
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ error: "Server error during signup. " + err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Email not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

        req.session.userId = user._id;
        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).json({ error: "Email and new password are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Email not found" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Forgot Password error:", err);
        res.status(500).json({ error: "Server error during password reset" });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: "Logged out" });
});

app.get('/api/me', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (user) {
                res.json({ loggedIn: true, userId: req.session.userId, name: user.name });
            } else {
                res.json({ loggedIn: false });
            }
        } catch (err) {
            res.json({ loggedIn: false });
        }
    } else {
        res.json({ loggedIn: false });
    }
});

// --- Helper: Get local network IP ---
function getLocalNetworkIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// GET: Return the laptop's local network IP for QR code generation
app.get('/api/connection-url', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    const ip = getLocalNetworkIP();
    const url = `http://${ip}:${port}/?connectUser=${req.session.userId}`;
    res.json({ url, ip, port });
});

// GET: SSE stream for mobile devices to receive real-time push events
app.get('/api/notifications-channel', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial heartbeat
    res.write('data: {"type":"connected","message":"Mobile device connected to MedFlow"}\n\n');

    // Store this client
    if (!mobileClients.has(userId)) {
        mobileClients.set(userId, []);
    }
    mobileClients.get(userId).push(res);
    console.log(`[SSE] Mobile device connected for user: ${userId}. Total connections: ${mobileClients.get(userId).length}`);

    // Heartbeat every 25 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        res.write('data: {"type":"heartbeat"}\n\n');
    }, 25000);

    // Clean up on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        const clients = mobileClients.get(userId) || [];
        const index = clients.indexOf(res);
        if (index !== -1) clients.splice(index, 1);
        console.log(`[SSE] Mobile device disconnected for user: ${userId}`);
    });
});

// POST: Send push notification to connected mobile devices
app.post('/api/trigger-mobile-push', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { medicines, isTest } = req.body;
    const userId = req.session.userId.toString();
    const clients = mobileClients.get(userId) || [];

    if (clients.length === 0) {
        return res.status(200).json({ sent: 0, message: 'No mobile devices connected' });
    }

    const payload = JSON.stringify({
        type: 'MEDICINE_REMINDER',
        isTest: !!isTest,
        medicines: medicines || [],
        timestamp: new Date().toISOString()
    });

    let sent = 0;
    const toRemove = [];
    clients.forEach((client, idx) => {
        try {
            client.write(`data: ${payload}\n\n`);
            sent++;
        } catch (err) {
            console.warn('[SSE] Failed to send to a client, marking for removal');
            toRemove.push(idx);
        }
    });

    // Remove dead clients
    toRemove.reverse().forEach(idx => clients.splice(idx, 1));

    console.log(`[Push] Sent mobile notification to ${sent} device(s) for user: ${userId}`);
    res.json({ sent, total: clients.length });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Medicine Reminder server running at http://localhost:${port}`);
});
