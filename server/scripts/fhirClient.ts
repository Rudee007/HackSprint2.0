// fhirClient.ts
import axios from "axios";

const FHIR_BASE_URL = process.env.FHIR_BASE_URL;          // e.g. https://hospital.example.com/fhir
const FHIR_CLIENT_ID = process.env.FHIR_CLIENT_ID;
const FHIR_CLIENT_SECRET = process.env.FHIR_CLIENT_SECRET;

async function getAccessToken() {
  // SMART-on-FHIR / OAuth2 client-credentials style
  const resp = await axios.post(process.env.FHIR_TOKEN_URL!, {
    client_id: FHIR_CLIENT_ID,
    client_secret: FHIR_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  return resp.data.access_token;
}

export async function fhirGet(resourceType: string, params: Record<string, string> = {}) {
  const token = await getAccessToken();

  const resp = await axios.get(`${FHIR_BASE_URL}/${resourceType}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  return resp.data;      // FHIR Bundle JSON
}
