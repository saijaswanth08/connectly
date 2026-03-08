import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Base32 encode/decode ----
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let bits = 0, value = 0, output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.replace(/[^A-Z2-7]/gi, "").toUpperCase();
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

// ---- TOTP implementation ----
async function generateHOTP(secret: Uint8Array, counter: bigint): Promise<string> {
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setBigUint64(0, counter, false);

  const key = await crypto.subtle.importKey(
    "raw", secret, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));

  const offset = signature[signature.length - 1] & 0x0f;
  const code =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  return String(code % 1000000).padStart(6, "0");
}

async function verifyTOTP(secret: Uint8Array, token: string, window = 1): Promise<boolean> {
  const counter = BigInt(Math.floor(Date.now() / 30000));
  for (let i = -window; i <= window; i++) {
    const code = await generateHOTP(secret, counter + BigInt(i));
    if (code === token) return true;
  }
  return false;
}

function generateSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

function generateRecoveryCodes(count = 6): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0").toUpperCase()).join("");
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}`);
  }
  return codes;
}

function formatSecretDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join("-") || secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { action, ...params } = await req.json();

    // For login-verify, we don't require auth header (user is mid-login)
    if (action === "login-verify") {
      const { email, code } = params;
      if (!email || !code) {
        return new Response(JSON.stringify({ error: "Email and code required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up user by email
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: twoFa } = await supabaseAdmin
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .single();

      if (!twoFa) {
        return new Response(JSON.stringify({ error: "2FA not enabled" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check TOTP code
      const secret = base32Decode(twoFa.secret_key);
      const valid = await verifyTOTP(secret, code);

      if (valid) {
        return new Response(JSON.stringify({ valid: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check recovery codes
      const recoveryCodes: string[] = twoFa.recovery_codes || [];
      const recoveryIndex = recoveryCodes.indexOf(code);
      if (recoveryIndex >= 0) {
        // Remove used recovery code
        const updatedCodes = [...recoveryCodes];
        updatedCodes.splice(recoveryIndex, 1);
        await supabaseAdmin.from("user_2fa").update({ recovery_codes: updatedCodes }).eq("id", twoFa.id);
        return new Response(JSON.stringify({ valid: true, recovery_used: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ valid: false, error: "Invalid code" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For check-2fa, also no auth required
    if (action === "check-2fa") {
      const { email } = params;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ enabled: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: twoFa } = await supabaseAdmin
        .from("user_2fa")
        .select("enabled")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .single();

      return new Response(JSON.stringify({ enabled: !!twoFa }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "setup") {
      const secret = generateSecret();
      const issuer = "Connectly";
      const accountName = user.email || user.id;
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      // Store secret (not yet enabled)
      const { error: upsertError } = await supabaseAdmin
        .from("user_2fa")
        .upsert({
          user_id: user.id,
          secret_key: secret,
          enabled: false,
          recovery_codes: [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        return new Response(JSON.stringify({ error: upsertError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        otpauth_url: otpauthUrl,
        secret_display: formatSecretDisplay(secret),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify-setup") {
      const { code } = params;
      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "6-digit code required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: twoFa } = await supabaseAdmin
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!twoFa) {
        return new Response(JSON.stringify({ error: "Run setup first" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secret = base32Decode(twoFa.secret_key);
      const valid = await verifyTOTP(secret, code);

      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid code. Try again." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate recovery codes and enable
      const recoveryCodes = generateRecoveryCodes();
      await supabaseAdmin.from("user_2fa").update({
        enabled: true,
        recovery_codes: recoveryCodes,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, recovery_codes: recoveryCodes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disable") {
      const { code } = params;
      if (!code) {
        return new Response(JSON.stringify({ error: "Code required to disable 2FA" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: twoFa } = await supabaseAdmin
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .single();

      if (!twoFa) {
        return new Response(JSON.stringify({ error: "2FA is not enabled" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secret = base32Decode(twoFa.secret_key);
      const valid = await verifyTOTP(secret, code);

      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("user_2fa").delete().eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const { data: twoFa } = await supabaseAdmin
        .from("user_2fa")
        .select("enabled, created_at")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .single();

      return new Response(JSON.stringify({ enabled: !!twoFa, created_at: twoFa?.created_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
