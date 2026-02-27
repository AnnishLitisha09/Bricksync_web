const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const sendEmail = require('./sendEmail');
let client;
let isReady = false;

const initWhatsApp = (forceReset = false) => {
    // Aggressive cleanup of lockfiles
    const sessionPath = path.resolve(process.cwd(), '.wwebjs_auth', 'session-bricksync_v2');

    if (fs.existsSync(sessionPath)) {
        if (forceReset) {
            console.log('🗑️ [WhatsApp] Force resetting session...');
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('✅ [WhatsApp] Session folder purged.');
            } catch (err) {
                console.warn('⚠️ [WhatsApp] Failed to purge session folder:', err.message);
            }
        } else {
            const filesToKill = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];
            filesToKill.forEach(file => {
                const filePath = path.join(sessionPath, file);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`🧹 [WhatsApp] Removed stale: ${file}`);
                    } catch (err) {
                        console.warn(`⚠️ [WhatsApp] Failed to remove ${file}:`, err.message);
                    }
                }
            });
        }
    }

    console.log('🚀 [WhatsApp] Initializing client...');
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "bricksync_v2"
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        puppeteer: {
            handleSIGINT: false,
            executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-software-rasterizer',
                '--disable-features=site-per-process',
                '--no-default-browser-check',
                '--disable-infobars',
                '--window-size=1280,720',
                '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            ],
        }
    });

    console.log('📡 [WhatsApp] Setting up event listeners...');

    client.on('qr', (qr) => {
        console.log('🔰 [WhatsApp] Scan this QR code to authenticate:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('✅ [WhatsApp] Client is ready!');
        isReady = true;
    });

    client.on('loading_screen', (percent, message) => {
        console.log('⏳ [WhatsApp] Loading:', percent, '%', message);
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ [WhatsApp] Authentication failure:', msg);
        isReady = false;

        // Immediate Email Notification
        sendEmail("bricksync001@gmail.com", "⚠️ WhatsApp Authentication Failure - Bricksync",
            `<p>WhatsApp client failed to authenticate at <b>${new Date().toLocaleString()}</b>.</p>
             <p>Message: <i>${msg}</i></p>
             <p>Action: The system will attempt to retry with a fresh QR code configuration in 10s.</p>`)
            .catch(err => console.error("Failed to send WhatsApp failure email:", err.message));

        // If auth fails, we likely need to clear session and retry to get a new QR code
        console.log('🔄 [WhatsApp] Retrying initialization with force reset due to auth failure...');
        setTimeout(() => initWhatsApp(true), 10000);
    });

    client.on('disconnected', async (reason) => {
        console.log('🔌 [WhatsApp] Client was logged out or disconnected:', reason);
        isReady = false;

        // Immediate Email Notification
        sendEmail("bricksync001@gmail.com", "🔌 WhatsApp Disconnected - Bricksync",
            `<p>WhatsApp client was logged out or disconnected at <b>${new Date().toLocaleString()}</b>.</p>
             <p>Reason: <i>${reason}</i></p>
             <p>Action: The system is re-initializing to generate a new QR code.</p>`)
            .catch(err => console.error("Failed to send WhatsApp disconnect email:", err.message));

        try {
            await client.destroy();
        } catch (e) {
            console.warn('⚠️ [WhatsApp] Error during client.destroy():', e.message);
        }
        // Re-initialize after a delay with force reset to ensure we get a new QR code
        console.log('🔄 [WhatsApp] Re-initializing for new QR code...');
        setTimeout(() => initWhatsApp(true), 5000);
    });

    console.log('🔄 [WhatsApp] Calling client.initialize()...');
    client.initialize().catch(err => {
        console.error('❌ [WhatsApp] Initialization error (catch block):', err.message);
        if (err.message.includes('ExecutionContext was destroyed') || err.message.includes('Protocol error')) {
            console.log('🔄 [WhatsApp] Protocol error detected. Attempting recovery in 10s...');
            setTimeout(() => initWhatsApp(false), 10000);
        }
    });
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
    if (!isReady) {
        console.error('⚠️ [WhatsApp] Client is not ready. Message not sent.');
        return false;
    }

    try {
        // Format phone number: remove non-digits, add @c.us suffix
        // Assuming Indian numbers (91) if 10 digits provided
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }

        const chatId = formattedNumber + '@c.us';
        await client.sendMessage(chatId, message);
        console.log(`📨 [WhatsApp] Message sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('❌ [WhatsApp] Error sending message:', error);
        return false;
    }
};

module.exports = {
    initWhatsApp,
    sendWhatsAppMessage,
    isClientReady: () => isReady
};
