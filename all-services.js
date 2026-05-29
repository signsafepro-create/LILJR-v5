/**
 * AI SUITE — ALL 10 SERVICES IN ONE FILE
 * Node.js | Drop into your backend | require() and use
 * 
 * Services: Chatbot, Marketing, Website, LeadGen, Notary, Social, Voice, Document, Referral, Agent
 * Every output is 100% unique per customer. No templates. No branding.
 */

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── CORE AI CALLER ───
async function ai(system, user, temp = 0.7, maxTok = 4000) {
  if (!GROQ_KEY) return { error: 'GROQ_API_KEY not set' };
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [
        { role: 'system', content: system }, { role: 'user', content: user }
      ], temperature: temp, max_tokens: maxTok })
    });
    const data = await res.json();

    // Handle Groq errors
    if (!res.ok) {
      return { error: `Groq HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}` };
    }
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return { error: `Groq invalid response: ${JSON.stringify(data).slice(0, 200)}` };
    }

    return { text: data.choices[0].message.content, usage: data.usage || {} };
  } catch (e) { return { error: e.message }; }
}

function parseAI(result, svc) {
  if (result.error) return { error: result.error };
  try {
    let text = result.text || '';

    // Extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      text = jsonBlockMatch[1].trim();
    }

    // Try to find JSON object/array in the text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(text);
    parsed._meta = { svc, t: Date.now() };
    return parsed;
  } catch (e) {
    return { raw: result.text, parse_error: true, parse_error_message: e.message, _meta: { svc } };
  }
}

// ─── 1. CHATBOT ───
async function buildChatbot(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are CHATBOT-ARCHITECT. Design a completely unique chatbot. Return JSON: system_prompt, welcome_message, faq[], tone, escalation_rules.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'chatbot');
}

function chatbotEmbed(projectId, theme = 'dark', base = 'https://your-domain.com') {
  return { embed: `<script src="${base}/embed.js" data-project="${projectId}" data-theme="${theme}"></script>`, instructions: 'Paste before </body>' };
}

// ─── 2. MARKETING ───
async function buildMarketing(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are VIRAL-STRATEGIST. Build a unique 30-day campaign. Return JSON: content_calendar[], hashtag_strategy, posting_schedule, viral_hooks, competitor_gaps.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'marketing');
}

async function genPost(platform, biz, loc, topic, tone = 'excited') {
  const r = await ai('You are a viral social media copywriter.', `Write a ${platform} post for ${biz} in ${loc}. Topic: ${topic}. Tone: ${tone}. Include hashtags.`, 0.9);
  return { post: r.text || '', platform, topic };
}

// ─── 3. WEBSITE ───
async function buildWebsite(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are DESIGN-ARCHITECT. Generate a completely unique website design. Return JSON: html_structure, css_variables, color_psychology, typography, sections[], cta_strategy.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'website');
}

async function genLanding(biz, loc, headline, cta) {
  const r = await ai('You are a senior frontend developer. Write clean, responsive HTML/CSS landing pages.', `Create a complete HTML landing page for ${biz} in ${loc}. Headline: ${headline}. CTA: ${cta}. Single file, embedded CSS, mobile responsive, dark theme option.`, 0.7, 4000);
  return { html: r.text || '', biz, loc };
}

// ─── 4. LEADGEN ───
async function buildLeadgen(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are LEAD-HUNTER. Build a unique B2B/B2C campaign. Return JSON: icp, sources[], email_scripts[], sms_scripts[], voice_scripts[], objection_handlers, scoring_model, follow_up_sequence.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'leadgen');
}

async function genColdEmail(biz, loc, target, offer, tone = 'professional') {
  const r = await ai('You are a B2B sales copywriter.', `Write a cold outreach email from ${biz} in ${loc} to ${target}. Offer: ${offer}. Tone: ${tone}.`, 0.8);
  return { email: r.text || '', target, tone };
}

async function genColdSMS(biz, loc, offer) {
  const r = await ai('You are an SMS marketing expert.', `Write an SMS for ${biz} in ${loc}. Offer: ${offer}. Under 160 chars.`, 0.9);
  return { sms: r.text || '', chars: (r.text || '').length };
}

// ─── 5. NOTARY ───
async function buildNotary(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are LEGAL-TECH-ARCHITECT. Design a notary platform workflow. Return JSON: onboarding_steps, document_templates[], booking_flow, pricing, compliance[], kyc_requirements.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'notary');
}

async function genLegalDoc(type, province, client, details) {
  const r = await ai('You are a Canadian legal document specialist.', `Generate a ${type} for ${province}. Client: ${client}. Details: ${details}.`, 0.5);
  return { document: r.text || '', type, province, client };
}

async function genNotaryChecklist(province) {
  const r = await ai('You are a Canadian legal compliance expert.', `Onboarding checklist for notary/commissioner in ${province}.`, 0.6);
  return { checklist: r.text || '', province };
}

// ─── 6. SOCIAL ───
async function buildSocial(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are SOCIAL-AUTOMATION-ENGINE. Build unique social automation. Return JSON: auto_responder_flows, comment_rules, dm_scripts[], story_strategy, reel_scripts[].`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'social');
}

async function genAutoreply(msg, biz, platform, tone = 'friendly') {
  const r = await ai('You are a community manager.', `Reply to this ${platform} message: '${msg}' for ${biz}. Tone: ${tone}.`, 0.8);
  return { reply: r.text || '', platform, original: msg };
}

async function genContentCalendar(biz, loc, platform, days = 30) {
  const r = await ai('You are a content strategist.', `Create a ${days}-day ${platform} calendar for ${biz} in ${loc}.`, 0.8, 4000);
  return { calendar: r.text || '', days, platform };
}

// ─── 7. VOICE ───
async function buildVoice(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are VOICE-AI-DESIGNER. Create a unique phone persona. Return JSON: persona_name, greeting_script, routing_logic, voicemail_script, triage_rules.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'voice');
}

async function genPhoneScript(biz, scenario, tone = 'warm') {
  const r = await ai('You are a voice UX designer.', `Phone script for ${biz}. Scenario: ${scenario}. Tone: ${tone}. Under 60 seconds.`, 0.7);
  const words = (r.text || '').split(/\s+/).length;
  return { script: r.text || '', scenario, tone, est_seconds: Math.round(words / 2.5) };
}

async function genVoicemail(biz, hours, callback = 'within 2 hours') {
  const r = await ai('You are a phone etiquette expert.', `Voicemail for ${biz}. Hours: ${hours}. Callback: ${callback}. Under 20 seconds.`, 0.6);
  return { greeting: r.text || '', biz, hours };
}

// ─── 8. DOCUMENT ───
async function buildDocument(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are DOCUMENT-AI-ENGINEER. Design document workflows. Return JSON: ocr_fields, extraction_rules, autofill_logic, summary_template.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'document');
}

async function analyzeDoc(text, industry = 'general') {
  const r = await ai('You are a document analysis AI.', `Extract and summarize. Industry: ${industry}.\n\n${text.slice(0, 4000)}`, 0.3);
  return { analysis: r.text || '', words: text.split(/\s+/).length, industry };
}

async function genDocSummary(text, length = 'short') {
  const r = await ai('You are a professional summarizer.', `Summarize in ${length} format:\n\n${text.slice(0, 4000)}`, 0.4);
  return { summary: r.text || '', length, original_words: text.split(/\s+/).length };
}

// ─── 9. REFERRAL ───
async function buildReferral(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are GROWTH-ENGINE-ARCHITECT. Build a unique referral program. Return JSON: reward_tiers[], viral_mechanics, gamification, partner_scripts[].`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'referral');
}

async function genReferralEmail(biz, referrer, reward, tone = 'excited') {
  const r = await ai('You are a referral marketing expert.', `Referral email from ${referrer} for ${biz}. Reward: ${reward}. Tone: ${tone}.`, 0.9);
  return { email: r.text || '', referrer, reward };
}

async function genQR(url) {
  try {
    const QRCode = require('qrcode');
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(url, (err, dataUrl) => {
        if (err) reject(err);
        else resolve({ qr_base64: dataUrl.split(',')[1], url });
      });
    });
  } catch (e) { return { error: e.message }; }
}

// ─── 10. AGENT ───
async function buildAgent(biz, loc, notes, aud = '', goals = '', comp = '') {
  const s = `You are AI-AGENT-ORCHESTRATOR. Design a unique autonomous agent. Return JSON: persona, skills[], tools[], decision_tree, quality_gates.`;
  const p = `BUSINESS: ${biz}\nLOCATION: ${loc}\nNOTES: ${notes}\nAUDIENCE: ${aud}\nGOALS: ${goals}\nCOMPETITORS: ${comp}\nReturn ONLY valid JSON.`;
  return parseAI(await ai(s, p, 0.8), 'agent');
}

async function runTask(task, context = '', format = 'text') {
  const r = await ai('You are an elite autonomous executor.', `Task: ${task}\nContext: ${context}\nFormat: ${format}`, 0.6, 4000);
  return { deliverable: r.text || '', task, format };
}

async function genCode(desc, lang = 'javascript', reqs = '') {
  const r = await ai(`You are a senior ${lang} developer.`, `Write ${lang} code for: ${desc}. Requirements: ${reqs}.`, 0.5, 4000);
  return { code: r.text || '', lang, task: desc };
}

// ─── GENERATE ALL 10 AT ONCE (sequential with delay to avoid rate limits) ───
async function generateAll(biz, loc, notes, aud = '', goals = '', comp = '') {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const results = {};
  const services = [
    { name: 'chatbot', fn: buildChatbot },
    { name: 'marketing', fn: buildMarketing },
    { name: 'website', fn: buildWebsite },
    { name: 'leadgen', fn: buildLeadgen },
    { name: 'notary', fn: buildNotary },
    { name: 'social', fn: buildSocial },
    { name: 'voice', fn: buildVoice },
    { name: 'document', fn: buildDocument },
    { name: 'referral', fn: buildReferral },
    { name: 'agent', fn: buildAgent }
  ];

  for (const svc of services) {
    try {
      results[svc.name] = await svc.fn(biz, loc, notes, aud, goals, comp);
    } catch (e) {
      results[svc.name] = { error: e.message };
    }
    await delay(2000); // 2 second delay between requests to stay under rate limit
  }

  return results;
}

// ─── EXPORTS ───
module.exports = {
  ai, parseAI, generateAll,
  buildChatbot, chatbotEmbed,
  buildMarketing, genPost,
  buildWebsite, genLanding,
  buildLeadgen, genColdEmail, genColdSMS,
  buildNotary, genLegalDoc, genNotaryChecklist,
  buildSocial, genAutoreply, genContentCalendar,
  buildVoice, genPhoneScript, genVoicemail,
  buildDocument, analyzeDoc, genDocSummary,
  buildReferral, genReferralEmail, genQR,
  buildAgent, runTask, genCode
};