const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const Item = require("../models/Item");

const router = express.Router();
const localVenvPython = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (fs.existsSync(localVenvPython) ? localVenvPython : "python3");
const CHATBOT_SCRIPT = path.join(__dirname, "../nlp_chatbot/chatbot.py");

function parseBudgetQuery(text) {
  const normalized = text.toLowerCase();
  const budgetMatch = normalized.match(
    /(?:under|below|less than|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i,
  );

  if (!budgetMatch) {
    return null;
  }

  const maxPrice = Number(budgetMatch[1]);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    return null;
  }

  let domain = "item";
  if (/tool|tools|drill|grinder|hammer/i.test(normalized)) {
    domain = "tool";
  } else if (/camera|dslr|photography/i.test(normalized)) {
    domain = "camera";
  } else if (/pump|water pump/i.test(normalized)) {
    domain = "pump";
  }

  return { maxPrice, domain };
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function buildItemFilterFromQuery(text) {
  const normalized = normalizeText(text);

  const hasToolTerms =
    /tool|tools|drill|grinder|hammer|repair|heavy duty|heavy-duty|construction|fix|maintenance/i.test(
      normalized,
    );
  const hasCleaningTerms = /clean|cleaning|washer|pressure/i.test(normalized);
  const hasPumpTerms = /pump|water pump|irrigation/i.test(normalized);

  const clauses = [];

  if (hasToolTerms) {
    clauses.push(
      { category: { $regex: /power tools|construction|cleaning equipment/i } },
      { name: { $regex: /drill|grinder|hammer|ladder|mixer/i } },
      {
        description: {
          $regex: /drill|grinder|hammer|ladder|mixer|repair|construction/i,
        },
      },
    );
  }

  if (hasCleaningTerms) {
    clauses.push(
      { category: { $regex: /cleaning equipment|construction/i } },
      { name: { $regex: /washer|cleaning|pressure|ladder/i } },
      { description: { $regex: /washer|cleaning|pressure|ladder/i } },
    );
  }

  if (hasPumpTerms) {
    clauses.push(
      { category: { $regex: /pumps/i } },
      { name: { $regex: /pump/i } },
      { description: { $regex: /pump|water/i } },
    );
  }

  if (clauses.length === 0) {
    return null;
  }

  return {
    available: true,
    $or: clauses,
  };
}

async function getBudgetItems(parsedQuery) {
  if (!parsedQuery) {
    return [];
  }

  const { maxPrice, domain } = parsedQuery;
  const filter = {
    available: true,
    pricePerDay: { $lte: maxPrice },
  };

  if (domain === "tool") {
    filter.$or = [
      { category: { $regex: /power tools|construction|cleaning equipment/i } },
      { name: { $regex: /tool|drill|grinder|hammer/i } },
      { description: { $regex: /tool|drill|grinder|hammer/i } },
    ];
  } else if (domain === "camera") {
    filter.$or = [
      { category: { $regex: /camera|photography/i } },
      { name: { $regex: /camera|dslr/i } },
      { description: { $regex: /camera|dslr/i } },
    ];
  } else if (domain === "pump") {
    filter.$or = [
      { category: { $regex: /pump/i } },
      { name: { $regex: /pump/i } },
      { description: { $regex: /pump/i } },
    ];
  }

  const items = await Item.find(filter)
    .sort({ pricePerDay: 1 })
    .limit(6)
    .select("name category pricePerDay available imageUrl");

  return items.map((item) => ({
    _id: item._id,
    name: item.name,
    category: item.category,
    pricePerDay: item.pricePerDay,
    available: item.available,
    imageUrl: item.imageUrl,
  }));
}

async function getMatchedItems(text, intent) {
  const budgetItems = await getBudgetItems(parseBudgetQuery(text));
  if (budgetItems.length > 0) {
    return budgetItems;
  }

  const searchIntent =
    /SEARCH_ITEM|RECOMMENDATION|RENT_ITEM|PRICE_INQUIRY|AVAILABILITY/.test(
      intent || "",
    );

  if (!searchIntent) {
    return [];
  }

  const filter = buildItemFilterFromQuery(text);
  if (!filter) {
    return [];
  }

  const items = await Item.find(filter)
    .sort({ pricePerDay: 1 })
    .limit(6)
    .select("name category pricePerDay available imageUrl");

  return items.map((item) => ({
    _id: item._id,
    name: item.name,
    category: item.category,
    pricePerDay: item.pricePerDay,
    available: item.available,
    imageUrl: item.imageUrl,
  }));
}

function runInference(query) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [CHATBOT_SCRIPT, query], {
      cwd: path.join(__dirname, ".."),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `Chatbot inference failed with code ${code}. ${stderr || stdout}`,
          ),
        );
      }

      try {
        const parsed = JSON.parse(stdout);
        if (!parsed.ok) {
          return reject(new Error(parsed.error || "Inference returned error"));
        }
        return resolve(parsed.result);
      } catch (err) {
        return reject(new Error(`Invalid chatbot output: ${stdout}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

router.post("/query", async (req, res) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({
        message: "text is required",
      });
    }

    const result = await runInference(text);
    const matchedItems = await getMatchedItems(text, result.intent);

    if (matchedItems.length > 0) {
      const suffix =
        matchedItems.length === 1
          ? "I found 1 matching item for your request."
          : `I found ${matchedItems.length} matching items for your request.`;
      result.response = `${result.response} ${suffix}`;
    }

    return res.json({
      ok: true,
      ...result,
      matchedItems,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Chatbot query failed",
      error: error.message,
    });
  }
});

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    model: "TF-IDF + MultinomialNB",
    localOnly: true,
  });
});

module.exports = router;
