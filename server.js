const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Among Us verisini içeren ilk uygulamamız
const apps = [
    {
        id: "among-us",
        name: "Among Us",
        description: "Uzay gemisinde katili bulma ve hayatta kalma oyunu.",
        version: "2026.9.19",
        bundleId: "com.innersloth.amongus",
        platform: "ios", // iOS Direct Install için
        ipaUrl: "https://github.com/TRServer-Inc/app-store-assets/releases/download/Among-Us-iOS-v1.0.0/com.innersloth.amongus-2026.19.0-Decrypted.ipa", // İleride ipa atacağın raw link
        iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi7_jKzycbNB-CJExXK0L2VYTdTsI_qOOsNoEKbUm2Xw&s=10",
        downloads: 0
    },
    {
        id: "among-us-win",
        name: "Among Us (PC)",
        description: "Windows masaüstü sürümü.",
        version: "2026.3.8",
        platform: "windows", // Windows için
        downloadUrl: "https://github.com/TRServer-Inc/app-store-assets/releases/download/Among-Us-Windows-v1.0.0/Among.Us.Windows.rar", // İleride exe/zip atacağın link
        iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi7_jKzycbNB-CJExXK0L2VYTdTsI_qOOsNoEKbUm2Xw&s=10",
        downloads: 0
    }
];

// Servis durum kontrolü
app.get('/', (req, res) => {
    res.json({ status: "aktif", message: "appvault backend servisi çalışıyor. Among Us eklendi." });
});

// Uygulama listesini dönen endpoint
app.get('/api/apps', (req, res) => {
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
app.post('/api/download/:id', (req, res) => {
    const appItem = apps.find(a => a.id === req.params.id);
    if (appItem) {
        appItem.downloads += 1;
        return res.json({ success: true, downloads: appItem.downloads });
    }
    res.status(404).json({ success: false, message: 'uygulama bulunamadı' });
});

app.listen(PORT, () => {
    console.log(`backend ${PORT} portunda hazır bekliyor.`);
});
