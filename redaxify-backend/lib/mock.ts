// When true, every function that would normally call an Azure/Stripe cloud
// API short-circuits and returns canned data instead, so the app can run
// fully offline against only the local Docker services.
export const MOCK_EXTERNAL_SERVICES = process.env.MOCK_EXTERNAL_SERVICES === "true";
