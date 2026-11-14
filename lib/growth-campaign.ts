import campaign from "../content/growth-campaign.json";
export const GROWTH_CAMPAIGN_ID = campaign.id;
export function isGrowthPage(path: string) { return campaign.targetPaths.includes(path); }
