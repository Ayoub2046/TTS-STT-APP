import { env } from "../backend/src/config/env.js";
import { fetchApprovedRecords, pushToHuggingFace } from "../backend/src/services/huggingface.service.js";

async function main() {
  console.log("Fetching pairs...");
  const pairs = await fetchApprovedRecords();
  console.log(`Found ${pairs.length} pairs.`);

  console.log("Pushing to HuggingFace repo:", env.HF_DATASET_REPO);
  try {
    const res = await pushToHuggingFace({
      repoId: env.HF_DATASET_REPO,
      commitMessage: "Test push from DataHub script",
      pairs,
    });
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.error("ERROR:", err.message, err);
  }
}

main();
