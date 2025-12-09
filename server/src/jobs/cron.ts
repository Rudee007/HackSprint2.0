// cron.ts
import cron from "node-cron";
import SyncPatientsFromHospital from '../services/hospitalSync.service';
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log("Running hospital sync...");
    await new SyncPatientsFromHospital();
    console.log("Hospital sync done");
  } catch (error) {
    console.error("Error during hospital sync:", error);
  }
});
