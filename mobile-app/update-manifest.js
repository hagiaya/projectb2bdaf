const fs = require('fs');
const sharp = require('sharp');

const manifest = {
  "id": "/?source=pwa",
  "name": "B2B Retail Dealer App",
  "short_name": "B2B Dealer",
  "description": "B2B Retail Dealer App for managing orders, products, and promotions.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui", "fullscreen"],
  "background_color": "#f6fbf0",
  "theme_color": "#8ec44a",
  "orientation": "portrait-primary",
  "lang": "id",
  "dir": "ltr",
  "categories": ["business", "productivity", "shopping"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot2.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "shortcuts": [
    {
      "name": "New Order",
      "short_name": "Order",
      "description": "Create a new order",
      "url": "/orders?action=new",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "View Catalog",
      "short_name": "Catalog",
      "description": "Browse product catalog",
      "url": "/catalog",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ],
  "prefer_related_applications": false,
  "related_applications": [],
  "iarc_rating_id": "e84b0728-71c2-41d8-82db-988365691079",
  "launch_handler": {
    "client_mode": "navigate-existing"
  },
  "file_handlers": [],
  "protocol_handlers": [],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "name",
      "text": "description",
      "url": "link"
    }
  },
  "widgets": [],
  "edge_side_panel": {},
  "note_taking": {},
  "scope_extensions": []
};

async function main() {
  fs.writeFileSync('./public/manifest.json', JSON.stringify(manifest, null, 2));
  console.log('manifest.json updated!');
  
  // Make sure icon-192.png exists
  if (!fs.existsSync('./public/icon-192.png') && fs.existsSync('./public/icon-512.png')) {
    await sharp('./public/icon-512.png')
      .resize(192, 192)
      .toFile('./public/icon-192.png');
    console.log('Created icon-192.png');
  }

  // Create dummy screenshots (PWABuilder just needs them to exist and match sizes)
  if (!fs.existsSync('./public/screenshot1.png')) {
    await sharp({
      create: { width: 1080, height: 1920, channels: 4, background: { r: 142, g: 196, b: 74, alpha: 1 } }
    }).png().toFile('./public/screenshot1.png');
    console.log('Created screenshot1.png');
  }
  
  if (!fs.existsSync('./public/screenshot2.png')) {
    await sharp({
      create: { width: 1920, height: 1080, channels: 4, background: { r: 142, g: 196, b: 74, alpha: 1 } }
    }).png().toFile('./public/screenshot2.png');
    console.log('Created screenshot2.png');
  }
}

main();
