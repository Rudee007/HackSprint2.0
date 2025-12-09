// hospitalSync.service.ts
import { fhirGet } from "./fhirClient";
import PatientModel from "../src/models/User"
import TherapistModel from "../src/models/Therapist";
import AppointmentModel from "../src/models/Appointment";

function mapFhirPatientToMongo(p: any) {
  return {
    externalId: p.id,
    name: p.name?.[0]?.text ?? "",
    phone: p.telecom?.find((t: any) => t.system === "phone")?.value ?? "",
    email: p.telecom?.find((t: any) => t.system === "email")?.value ?? "",
    gender: p.gender,
    birthDate: p.birthDate,
  };
}

export async function syncPatientsFromHospital() {
  const bundle = await fhirGet("Patient");
  const entries = bundle.entry ?? [];

  for (const e of entries) {
    const mapped = mapFhirPatientToMongo(e.resource);
    await PatientModel.updateOne(
      { externalId: mapped.externalId },
      { $set: mapped },
      { upsert: true }
    );
  }
}
