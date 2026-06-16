import type { Session } from "@supabase/supabase-js";

export const DEMO_MODE = true;

export const DEMO_USER = {
  id: "demo-admin",
  email: "admin@mehayesod.co.il",
  name: "אריאל דייטש",
  role: "Admin",
};

export const DEMO_SESSION: Session = {
  access_token: "demo-token",
  token_type: "bearer",
  expires_in: 999999,
  refresh_token: "demo-refresh",
  user: {
    id: DEMO_USER.id,
    aud: "authenticated",
    role: "authenticated",
    email: DEMO_USER.email,
    created_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: { name: DEMO_USER.name },
  },
} as unknown as Session;
