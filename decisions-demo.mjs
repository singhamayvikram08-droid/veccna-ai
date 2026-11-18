import fs from "fs";
import { OpenRouter } from "@openrouter/sdk";

// Safely load API key from process environment or local .env
let apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
if (!apiKey && fs.existsSync(".env")) {
  const envFile = fs.readFileSync(".env", "utf-8");
  const match = envFile.match(/VITE_OPENROUTER_API_KEY=([^\r\n]+)/);
  if (match) apiKey = match[1].trim();
}

if (!apiKey) {
  console.error("❌ Error: OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY not found in environment or .env file.");
  process.exit(1);
}

const openrouter = new OpenRouter({
  apiKey: apiKey
});

// Load sample test image if present
let imageBase64 = "";
if (fs.existsSync("image.png")) {
  imageBase64 = (await fs.promises.readFile("image.png")).toString("base64");
}

console.log("⚡ Executing OpenRouter Decisions API...");

try {
  const decision = await openrouter.alpha.decisions.create({
    decisionsRequest: {
      model: "perplexity/pplx-decider-flash-v1.3:free",
      state: [
        "Listing: vintage red bicycle, light scratches on the frame",
        ...(imageBase64 ? [{ type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }] : [])
      ],
      questions: {
        matches_listing: {
          type: "noul",
          instructions: "Does the attached media show the listed item?",
          criteria: {
            true: "The listed item is shown",
            false: "Something else or nothing is shown"
          }
        },
        category: {
          type: "choice",
          instructions: "Which category fits this listing?",
          criteria: {
            bikes: "Complete bicycles",
            parts: "Components and accessories",
            apparel: "Clothing and gear"
          }
        },
        condition: {
          type: "score",
          instructions: "How worn is the item?",
          criteria: ["Like new", "Light wear", "Heavy wear"]
        }
      }
    }
  });

  console.log("✅ Decision Response Received:");
  console.log(JSON.stringify(decision, null, 2));

  const { matches_listing, category, condition } = decision.answers;
  if (matches_listing?.type === "noul" && category?.type === "choice" && condition?.type === "score") {
    console.log("Matches listing noul probability:", matches_listing.noul);
    console.log("Category choice:", category.choice);
    console.log("Category probabilities:", category.probabilities);
    console.log("Condition score:", condition.score);
  }
} catch (err) {
  console.error("OpenRouter Decision error:", err.message);
}
