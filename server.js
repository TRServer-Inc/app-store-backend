const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// şimdilik boş uygulama listesi
const apps = [];

// servis durum kontrolü
app.get('/', (req, res) => {
    res.json({ status: "aktif", message: "appvault backend servisi çalışıyor. henüz uygulama yüklenmedi." });
});

app.get('/api/apps', (req, res) => {
    res.json(apps);
});

// ios otf plist generator (ileride ipa eklediğinde direkt çalışacak)
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

app.listen(PORT, () => {
    console.log(`backend ${PORT} portunda hazır bekliyor.`);
});
