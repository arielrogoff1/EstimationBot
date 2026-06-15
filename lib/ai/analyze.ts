import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ExtractedRoom {
  name: string;
  length: number | null;
  width: number | null;
  height: number | null;
  area: number | null;
  confidence: number;
}

export interface ExtractedWall {
  label: string;
  floor: string;
  type:
    | "EXTERIOR_WALL"
    | "INTERIOR_WALL"
    | "ROOF"
    | "ATTIC_FLOOR"
    | "CATHEDRAL_CEILING"
    | "CRAWL_SPACE"
    | "RIM_JOIST"
    | "FOUNDATION_WALL"
    | "GARAGE_WALL"
    | "FLOOR_ASSEMBLY";
  length: number | null;
  height: number | null;
  grossArea: number | null;
  windowArea: number;
  doorArea: number;
  netArea: number | null;
  confidence: number;
  notes: string;
}

export interface ExtractedScale {
  description: string;
  drawingUnits: string;
  realWorldUnits: string;
  scaleFactor: number;
  confidence: number;
}

export interface AnalysisResult {
  projectName: string;
  address: string;
  floors: Array<{
    name: string;
    rooms: ExtractedRoom[];
    walls: ExtractedWall[];
  }>;
  scale: ExtractedScale | null;
  buildingTotals: {
    estimatedLength: number | null;
    estimatedWidth: number | null;
    estimatedHeight: number | null;
    totalWallArea: number | null;
    totalRoofArea: number | null;
    totalFloorArea: number | null;
    volume: number | null;
  };
  notes: string[];
  overallConfidence: number;
  warningFlags: string[];
}

const SYSTEM_PROMPT = `You are an expert architectural plan analyzer for spray foam insulation contractors.
Your task is to analyze construction drawings and extract precise measurements.

Always return a valid JSON object matching the schema exactly. Do not include markdown code blocks.
For every measurement, include a confidence score between 0.0 and 1.0 where:
- 0.9-1.0: Dimension string clearly visible and readable
- 0.7-0.89: Scale detected, calculated from drawing
- 0.5-0.69: Estimated from context or partial information
- Below 0.5: Guess based on typical construction, flag for review

Extract:
1. All floors (Basement, First Floor, Second Floor, Attic, etc.)
2. Every insulation-relevant surface:
   - Exterior walls (with window and door deductions)
   - Roof / roof deck
   - Attic floors
   - Cathedral ceilings
   - Crawl spaces
   - Rim joists (in linear feet × height)
   - Foundation walls
   - Garage walls
3. Drawing scale
4. Any notes about wall construction (e.g., "2x6 framing", "R-21 specified")`;

const ANALYSIS_SCHEMA = {
  type: "object",
  required: [
    "projectName",
    "address",
    "floors",
    "scale",
    "buildingTotals",
    "notes",
    "overallConfidence",
    "warningFlags",
  ],
  properties: {
    projectName: { type: "string" },
    address: { type: "string" },
    floors: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "rooms", "walls"],
        properties: {
          name: { type: "string" },
          rooms: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "length", "width", "height", "area", "confidence"],
              properties: {
                name: { type: "string" },
                length: { type: ["number", "null"] },
                width: { type: ["number", "null"] },
                height: { type: ["number", "null"] },
                area: { type: ["number", "null"] },
                confidence: { type: "number" },
              },
            },
          },
          walls: {
            type: "array",
            items: {
              type: "object",
              required: [
                "label",
                "floor",
                "type",
                "length",
                "height",
                "grossArea",
                "windowArea",
                "doorArea",
                "netArea",
                "confidence",
                "notes",
              ],
              properties: {
                label: { type: "string" },
                floor: { type: "string" },
                type: { type: "string" },
                length: { type: ["number", "null"] },
                height: { type: ["number", "null"] },
                grossArea: { type: ["number", "null"] },
                windowArea: { type: "number" },
                doorArea: { type: "number" },
                netArea: { type: ["number", "null"] },
                confidence: { type: "number" },
                notes: { type: "string" },
              },
            },
          },
        },
      },
    },
    scale: {
      type: ["object", "null"],
      properties: {
        description: { type: "string" },
        drawingUnits: { type: "string" },
        realWorldUnits: { type: "string" },
        scaleFactor: { type: "number" },
        confidence: { type: "number" },
      },
    },
    buildingTotals: {
      type: "object",
      properties: {
        estimatedLength: { type: ["number", "null"] },
        estimatedWidth: { type: ["number", "null"] },
        estimatedHeight: { type: ["number", "null"] },
        totalWallArea: { type: ["number", "null"] },
        totalRoofArea: { type: ["number", "null"] },
        totalFloorArea: { type: ["number", "null"] },
        volume: { type: ["number", "null"] },
      },
    },
    notes: { type: "array", items: { type: "string" } },
    overallConfidence: { type: "number" },
    warningFlags: { type: "array", items: { type: "string" } },
  },
};

export async function analyzePlanImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  pageNumber: number,
  totalPages: number
): Promise<AnalysisResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyze this architectural plan (page ${pageNumber} of ${totalPages}).

Extract ALL insulation-relevant surfaces with their dimensions.

Focus on:
1. Every exterior wall run with length and ceiling height
2. Window and door areas to subtract from wall area
3. Roof deck area and pitch
4. Attic floor area (if accessible)
5. Cathedral ceiling areas
6. Crawl space floor area
7. Rim joist linear feet × height
8. Foundation wall dimensions
9. Garage walls if present

Return ONLY valid JSON matching the schema. No markdown.`,
          },
        ],
      },
    ],
    tools: [
      {
        name: "extract_plan_data",
        description: "Extract structured measurement data from the architectural plan",
        input_schema: ANALYSIS_SCHEMA as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "any" },
  });

  // Extract the tool use result
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "extract_plan_data") {
      return block.input as AnalysisResult;
    }
  }

  // Fallback: try to parse text response
  for (const block of response.content) {
    if (block.type === "text") {
      try {
        return JSON.parse(block.text) as AnalysisResult;
      } catch {
        // ignore
      }
    }
  }

  throw new Error("No structured data returned from AI analysis");
}

export async function analyzePlanUrl(
  imageUrl: string,
  pageNumber: number,
  totalPages: number
): Promise<AnalysisResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: `Analyze this architectural plan (page ${pageNumber} of ${totalPages}).

Extract ALL insulation-relevant surfaces with their dimensions.

Focus on:
1. Every exterior wall run with length and ceiling height
2. Window and door areas to subtract from wall area
3. Roof deck area and pitch
4. Attic floor area (if accessible)
5. Cathedral ceiling areas
6. Crawl space floor area
7. Rim joist linear feet × height
8. Foundation wall dimensions
9. Garage walls if present

Return ONLY valid JSON matching the schema. No markdown.`,
          },
        ],
      },
    ],
    tools: [
      {
        name: "extract_plan_data",
        description: "Extract structured measurement data from the architectural plan",
        input_schema: ANALYSIS_SCHEMA as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "any" },
  });

  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === "extract_plan_data") {
      return block.input as AnalysisResult;
    }
  }

  throw new Error("No structured data returned from AI analysis");
}
