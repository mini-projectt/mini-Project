const express = require("express");
const { authenticate } = require("../middleware/auth");
const { classifyIntent } = require("../services/nlpService");

const router = express.Router();

const SEARCH_CATEGORY_RULES = [
  {
    category: "Electrical",
    terms: [
      "generator",
      "electrical",
      "inverter",
      "flood light",
      "light tower",
    ],
  },
  {
    category: "Power Tools",
    terms: [
      "tool",
      "tools",
      "drill",
      "grinder",
      "hammer",
      "impact",
      "compressor",
      "repair",
      "maintenance",
    ],
  },
  {
    category: "Pumps",
    terms: [
      "pump",
      "pumps",
      "submersible",
      "centrifugal",
      "irrigation",
      "dewatering",
    ],
  },
  {
    category: "Cleaning Equipment",
    terms: [
      "clean",
      "cleaning",
      "washer",
      "vacuum",
      "scrubber",
      "pressure washer",
    ],
  },
  {
    category: "Construction",
    terms: ["construction", "cement", "mixer", "ladder", "tile", "laser level"],
  },
  {
    category: "Clothing",
    terms: ["clothing", "suit", "sherwani", "lehenga", "wedding"],
  },
];

const SEARCH_KEYWORDS = [
  "generator",
  "drill",
  "grinder",
  "hammer",
  "compressor",
  "welding",
  "pump",
  "washer",
  "vacuum",
  "scrubber",
  "ladder",
  "mixer",
  "suit",
  "sherwani",
  "lehenga",
  "tool",
];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeMessage(message) {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(normalizedText, term) {
  const escaped = escapeRegex(term.toLowerCase());
  const pattern = term.includes(" ")
    ? new RegExp(`\\b${escaped}\\b`, "i")
    : new RegExp(`\\b${escaped}s?\\b`, "i");
  return pattern.test(normalizedText);
}

function detectCategory(normalizedText) {
  for (const rule of SEARCH_CATEGORY_RULES) {
    if (rule.terms.some((term) => hasTerm(normalizedText, term))) {
      return rule.category;
    }
  }
  return null;
}

function detectKeyword(normalizedText) {
  for (const keyword of SEARCH_KEYWORDS) {
    if (hasTerm(normalizedText, keyword)) {
      return keyword;
    }
  }
  return null;
}

function buildItemsRedirect(message) {
  const normalized = normalizeMessage(message || "");
  const category = detectCategory(normalized);
  const keyword = detectKeyword(normalized);
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }
  if (keyword) {
    params.set("search", keyword);
  }
  params.set("available", "true");

  const query = params.toString();
  return query ? `/items?${query}` : "/items";
}

function buildRentRedirect(message) {
  const normalized = normalizeMessage(message || "");
  const keyword = detectKeyword(normalized);

  if (!keyword) {
    return "/rent";
  }

  const params = new URLSearchParams({
    search: keyword,
    available: "true",
  });

  return `/rent?${params.toString()}`;
}

const intentResponseMap = {
  RENT_SEARCH: {
    response: "Searching for rentals...",
    redirect: "/items",
  },
  RENT_ITEM: {
    response: "Taking you to booking...",
    redirect: "/rent",
  },
  RETURN_ITEM: {
    response: "Opening return process...",
    redirect: "/return",
  },
  REPORT_DAMAGE: {
    response: "Opening damage report...",
    redirect: "/report",
  },
  CHECK_STATUS: {
    response: "Checking your rental status...",
    redirect: "/status",
  },
};

router.post("/chat", authenticate, async (req, res) => {
  const startedAt = Date.now();

  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({
        error: "message is required",
      });
    }

    const result = await classifyIntent(message);

    if (result.fallback) {
      return res.json({
        intent: result.intent || "UNKNOWN",
        confidence: result.confidence || 0,
        entities: result.entities || { duration: null, location: null },
        response:
          "I didn't understand. Try: rent a camera, return item, report damage",
        redirect: null,
        latency: Date.now() - startedAt,
      });
    }

    const mapped = intentResponseMap[result.intent] || {
      response:
        "I didn't understand. Try: rent a camera, return item, report damage",
      redirect: null,
    };

    let redirect = mapped.redirect || null;
    if (result.intent === "RENT_SEARCH") {
      redirect = buildItemsRedirect(message);
    }
    if (result.intent === "RENT_ITEM") {
      redirect = buildRentRedirect(message);
    }

    return res.json({
      intent: result.intent || "UNKNOWN",
      confidence: result.confidence || 0,
      entities: result.entities || { duration: null, location: null },
      response: mapped.response,
      redirect,
      latency: Date.now() - startedAt,
    });
  } catch (error) {
    return res.json({
      intent: "UNKNOWN",
      confidence: 0,
      entities: { duration: null, location: null },
      response:
        "I didn't understand. Try: rent a camera, return item, report damage",
      redirect: null,
      latency: Date.now() - startedAt,
    });
  }
});

module.exports = router;
