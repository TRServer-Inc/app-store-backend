const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GitHub API limitlerine takılmamak için doğrudan RAW linkten JSON'ları çeken mekanizma
async function getAppsFromGitHub() {
    try {
        // Doğrudan public repodaki RAW json dosyasını çekiyoruz
        const response = await fetch('https://raw.githubusercontent.com/TRServer-Inc/app-store-assets/main/apps/amongus.json');
        
        if (response.ok) {
            const appData = await response.json();
            return [appData]; // Sitede kart olarak basılması için dizi içinde döndürüyoruz
        } else {
            console.error('JSON dosyası çekilemedi, durum kodu:', response.status);
            return [];
        }
    } catch (error) {
        console.error('GitHub RAW veri çekme hatası:', error.message);
        return [];
    }
}

// Servis durum kontrolü
app.get('/', (req, res) => {
    res.json({ status: "aktif", message: "appvault backend servisi GitHub RAW altyapısıyla çalışıyor." });
});

// Uygulama listesini dönen endpoint
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

// İndirme sayacı
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
