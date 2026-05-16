const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const LOCAL_VENV_PYTHON = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (fs.existsSync(LOCAL_VENV_PYTHON) ? LOCAL_VENV_PYTHON : "python3");
const NLP_SCRIPT = path.join(__dirname, "../nlp/nlp_service.py");

function fallbackResult() {
  return {
    intent: "UNKNOWN",
    confidence: 0,
    entities: {
      duration: null,
      location: null,
    },
    fallback: true,
  };
}

function classifyIntent(userQuery) {
  return new Promise((resolve) => {
    try {
      const child = spawn(PYTHON_BIN, [NLP_SCRIPT], {
        cwd: path.join(__dirname, ".."),
        env: process.env,
      });

      let stdout = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.on("error", () => {
        resolve(fallbackResult());
      });

      child.on("close", (code) => {
        if (code !== 0) {
          resolve(fallbackResult());
          return;
        }

        try {
          const parsed = JSON.parse(stdout || "{}");
          resolve({
            intent: parsed.intent || "UNKNOWN",
            confidence: Number(parsed.confidence) || 0,
            entities: parsed.entities || { duration: null, location: null },
            fallback: Boolean(parsed.fallback),
          });
        } catch (error) {
          resolve(fallbackResult());
        }
      });

      child.stdin.write((userQuery || "").toString());
      child.stdin.end();
    } catch (error) {
      resolve(fallbackResult());
    }
  });
}

module.exports = {
  classifyIntent,
};
