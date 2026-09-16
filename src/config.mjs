import "dotenv/config";
export const config={
  apiKey:process.env.FIREBASE_API_KEY||"",
  projectId:process.env.FIREBASE_PROJECT_ID||"",
  get ready(){return Boolean(this.apiKey&&this.projectId&&!this.apiKey.includes("ovdje"))}
};
