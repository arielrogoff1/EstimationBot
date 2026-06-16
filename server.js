require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const app  = express();
const port = process.env.PORT || 3000;

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_, file, cb) {
    const ok = ['application/pdf','image/png','image/jpeg','image/tiff','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.static('public'));
app.use(express.json());

// Ensure uploads dir exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const SYSTEM_PROMPT = `You are an expert spray foam insulation estimator with 20 years of experience reading architectural plans.
Analyze the provided building plan and extract every surface that needs spray foam insulation.

Return ONLY valid JSON — no explanation, no markdown, no code fences. Just raw JSON.

Use this exact schema:
{
  "project_name": "string — address or name detected from plan, or 'Unknown Project'",
  "scale": "string — drawing scale e.g. '1/4\" = 1\\'-0\"', or 'Not detected'",
  "floors": [
    {
      "name": "string — e.g. Basement, First Floor, Second Floor, Attic",
      "areas": [
        {
          "label": "string — descriptive name e.g. North Exterior Wall",
          "type": "exterior_wall | interior_wall | roof | attic_floor | rim_joist | crawl_space | garage_wall | foundation_wall",
          "length_ft": 0,
          "height_ft": 0,
          "window_area_sf": 0,
          "door_area_sf": 0,
          "net_area_sf": 0,
          "foam_type": "closed_cell | open_cell",
          "r_value": 0,
          "thickness_in": 0,
          "board_feet": 0,
          "confidence": 0
        }
      ]
    }
  ],
  "summary": {
    "total_net_area_sf": 0,
    "total_board_feet": 0,
    "closed_cell_bf": 0,
    "open_cell_bf": 0,
    "estimated_material_cost": 0,
    "estimated_sell_price": 0,
    "warning_flags": ["string"]
  }
}

Calculation rules:
- Closed cell R-value: 6.5 per inch. Open cell: 3.7 per inch.
- thickness_in = r_value / r_per_inch
- board_feet = net_area_sf × thickness_in
- Default R-values: exterior_wall → R-21 closed_cell, roof → R-38 closed_cell, attic_floor → R-49 open_cell, rim_joist → R-13 closed_cell, crawl_space → R-21 closed_cell, garage_wall → R-13 closed_cell
- net_area_sf = (length_ft × height_ft) - window_area_sf - door_area_sf
- Material cost: closed_cell @ $1.00/BF, open_cell @ $0.44/BF. Add 10% waste.
- estimated_sell_price = (material + labor) × 1.35 where labor = total_BF / 500 × 85
- confidence: 90-100 = clearly readable dimension, 70-89 = estimated from context, below 70 = guessed
- If a dimension is unclear, make a reasonable estimate based on context and set confidence low
- Always return valid JSON even if the plan is hard to read — use best estimates with low confidence scores`;

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    const buffer   = fs.readFileSync(filePath);
    const base64   = buffer.toString('base64');
    const isPDF    = req.file.mimetype === 'application/pdf';
    const isImage  = req.file.mimetype.startsWith('image/');

    let contentBlock;
    if (isPDF) {
      contentBlock = {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 }
      };
    } else if (isImage) {
      contentBlock = {
        type: 'image',
        source: { type: 'base64', media_type: req.file.mimetype, data: base64 }
      };
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: `Analyze this building plan and extract all spray foam insulation measurements. Return only the JSON object as described.`
          }
        ]
      }]
    });

    const raw = message.content[0].text.trim();

    // Strip any accidental code fences
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const result  = JSON.parse(jsonStr);

    res.json({ success: true, data: result, filename: req.file.originalname });

  } catch (err) {
    console.error('Analysis error:', err.message);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Claude returned invalid JSON — try again or use a clearer plan image.' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
});

app.listen(port, () => {
  console.log(`\n  Spray Foam Estimator running at http://localhost:${port}\n`);
});
