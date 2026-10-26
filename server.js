const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GitHub API cache mekanizması (sınır takılmasın diye 1 dakika hafızada tutar)
let appsCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000;

async function getAppsFromGitHub() {
    const now = Date.now();
    if (appsCache.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
        return appsCache;
    }

    const owner = 'TRServer-Inc';
    const repo = 'app-store-assets';
    const path = 'apps';

    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        const files = response.data;
        const apps = [];

        for (const file of files) {
            if (file.name.endsWith('.json')) {
                const rawResponse = await axios.get(file.download_url);
                apps.push(rawResponse.data);
            }
        }

        appsCache = apps;
        lastFetchTime = now;
        return apps;
    } catch (error) {
        console.error('GitHub\'dan uygulamalar çekilirken hata oluştu:', error.message);
        return appsCache; // Hata durumunda son cache'i döndür ki patlamasın
    }
}

// Servis durum kontrolü
app.get('/', (req, res) => {
    res.json({ status: "aktif", message: "appvault backend servisi GitHub dinamik JSON altyapısıyla çalışıyor." });
});

// Uygulama listesini GitHub reposundaki apps klasöründen dinamik dönen endpoint
app.get('/api/apps', async (req, res) => {
    const apps = await getAppsFromGitHub();
    res.json(apps);
});

// iOS OTA (Over-The-Air) Plist Manifest Üreteci
app.get('/manifest', (req, res) => {
    const { title, bundleId, version, ipa } = req.query;

    if (!title || !bundleId || !ipa) {
        return res.status(400).send('eksik parametreler');
    }

    const plistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${decodeURIComponent(ipa)}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${bundleId}</string>
                <key>bundle-version</key>
                <string>${version || '1.0.0'}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${decodeURIComponent(title)}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    res.set('Content-Type', 'text/xml');
    res.send(plistXml);
});

// İndirme sayacı (artık GitHub JSON'larından çalıştığı için geçici bellekte tutulur)
app.post('/api/download/:id', async (req, res) => {
    const apps = await getAppsFromGitHub();
    const appItem = apps.find(a => a.id === req.params.id);
    if (appItem) {
        appItem.downloads = (appItem.downloads || 0) + 1;
        return res.json({ success: true, downloads: appItem.downloads });
    }
    res.status(404).json({ success: false, message: 'uygulama bulunamadı' });
});

app.listen(PORT, () => {
    console.log(`backend ${PORT} portunda hazır bekliyor.`);
});
