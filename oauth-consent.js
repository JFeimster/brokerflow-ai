import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const status = document.querySelector("#status");
const loginSection = document.querySelector("#login");
const consentSection = document.querySelector("#consent");
const errorBox = document.querySelector("#error");
const authorizationId = new URL(location.href).searchParams.get("authorization_id");

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  status.hidden = true;
}

if (!authorizationId || !/^[\w-]{16,200}$/.test(authorizationId)) {
  showError("This authorization request is missing or invalid. Return to the application and start again.");
} else {
  try {
    const configResponse = await fetch("/api/console/config", { cache: "no-store" });
    if (!configResponse.ok) throw new Error("BrokerFlow sign-in is temporarily unavailable.");
    const config = await configResponse.json();
    if (!config.configured || config.mode !== "live") throw new Error("BrokerFlow authentication is not configured for this deployment.");

    const supabase = createClient(config.supabase_url, config.publishable_key, {
      auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
    });
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      status.hidden = true;
      loginSection.hidden = false;
      document.querySelector("#login-form").addEventListener("submit", async event => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        errorBox.hidden = true;
        try {
          const email = new FormData(event.currentTarget).get("email");
          const redirectTo = `${location.origin}${location.pathname}${location.search}`;
          const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
          if (error) throw error;
          status.textContent = "Check your email for a sign-in link. This page will return to the same authorization request after you sign in.";
          status.hidden = false;
          loginSection.hidden = true;
        } catch {
          showError("Unable to send a sign-in link. Check the email and your account access, then try again.");
          button.disabled = false;
        }
      });
    } else {
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (error || !data) throw error || new Error("Authorization details could not be loaded.");
      if (!("authorization_id" in data)) {
        location.assign(data.redirect_url);
      } else {
        const details = data;
        document.querySelector("#client").textContent = details.client?.name || "Unknown application";
        document.querySelector("#client-id").textContent = details.client?.id || "Not provided";
        document.querySelector("#redirect").textContent = details.redirect_uri || "Not provided";
        document.querySelector("#scopes").textContent = details.scope || "No scopes listed";
        status.hidden = true;
        consentSection.hidden = false;
        const decide = async action => {
          for (const button of consentSection.querySelectorAll("button")) button.disabled = true;
          try {
            const response = action === "approve"
              ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
              : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
            if (response.error || !response.data?.redirect_url) throw response.error || new Error("Authorization response is incomplete.");
            location.assign(response.data.redirect_url);
          } catch {
            showError("The authorization could not be completed. Return to the requesting application and try again.");
          }
        };
        document.querySelector("#approve").addEventListener("click", () => decide("approve"));
        document.querySelector("#deny").addEventListener("click", () => decide("deny"));
      }
    }
  } catch {
    showError("The authorization request could not be verified. Return to the application and start again.");
  }
}
