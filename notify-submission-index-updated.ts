// supabase/functions/notify-submission/index.ts
//
// Handles two kinds of email notifications via Resend:
//   1. type: "status_update"  -> emails the AUTHOR when admin changes their submission's status
//   2. (default / no type)    -> emails the ADMIN when a new submission comes in
//
// Deploy this via Supabase Dashboard -> Edge Functions -> Deploy a new function ->
// Via Editor -> name it exactly "notify-submission" -> paste this file's contents -> Deploy.
// (If the function already exists from before, just replace its code with this version.)
//
// Requires the RESEND_API_KEY secret to already be set (Edge Functions -> Secrets).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Fallback admin address used if the request doesn't supply one.
const ADMIN_EMAIL = "kjsss@kasu.edu.ng";

// Now sending from your own verified domain instead of Resend's sandbox
// address — this is the whole point of the domain verification work.
const FROM_EMAIL = "KJSSS Journal <noreply@sociology-kasu.com.ng>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY secret is not set. Add it in Supabase -> Edge Functions -> Secrets."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errText}`);
  }

  return res.json();
}

const STATUS_LABELS: Record<string, string> = {
  pending: "received and pending review",
  in_review: "now under review",
  accepted: "accepted for publication",
  rejected: "not accepted",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, record, adminEmail } = await req.json();

    if (!record) {
      throw new Error("Missing 'record' in request body");
    }

    if (type === "status_update") {
      if (!record.email) {
        throw new Error("Submission record has no author email to notify.");
      }

      const label = STATUS_LABELS[record.status] || record.status;

      let extraNote = "";
      if (record.status === "accepted") {
        extraNote =
          "<p>Congratulations! Our editorial team will be in touch with next steps for publication.</p>";
      } else if (record.status === "rejected") {
        extraNote =
          "<p>Thank you for submitting your work to us. We encourage you to consider KJSSS for future submissions.</p>";
      } else if (record.status === "in_review") {
        extraNote =
          "<p>Your manuscript is now being reviewed by our editorial team. We'll notify you again once a decision is made.</p>";
      }

      const html = `
        <p>Dear ${record.author_name || "Author"},</p>
        <p>Your manuscript submission <strong>"${record.title}"</strong> to the
        KASU Journal of Sociology &amp; Social Sciences (KJSSS) is now
        <strong>${label}</strong>.</p>
        ${extraNote}
        <p>— KJSSS Editorial Team<br>Department of Sociology, Kaduna State University</p>
      `;

      await sendEmail(
        record.email,
        `Your KJSSS submission is ${label}`,
        html
      );
    } else {
      const notifyTo = adminEmail || ADMIN_EMAIL;

      const html = `
        <p>A new manuscript has been submitted to KJSSS.</p>
        <ul>
          <li><strong>Title:</strong> ${record.title}</li>
          <li><strong>Author:</strong> ${record.author_name}</li>
          <li><strong>Email:</strong> ${record.email}</li>
          <li><strong>Research Area:</strong> ${record.research_area || "—"}</li>
        </ul>
        <p>Log in to the admin dashboard to review it.</p>
      `;

      await sendEmail(notifyTo, `New KJSSS submission: ${record.title}`, html);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("notify-submission error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
