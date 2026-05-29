const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
// SECURITY GATEKEEPER
const SECRET_KEY = "SIGNSAFE_PRO_KEY_2026"; // Change this to your own private key
app.use((req, res, next) => {
    const userKey = req.headers['x-api-key'];
    if (!userKey || userKey !== SECRET_KEY) {
        return res.status(403).json({ error: "Access Denied: Invalid or Missing API Key" });
    }
    next();
});


const money = require('./all-services');

// Audit Logger
const logAction = (service, data) => {
    const entry = `[${new Date().toISOString()}] SERVICE: ${service} | DATA: ${JSON.stringify(data)}\n`;
    fs.appendFileSync('./service-audit.log', entry);
};

// DAY 1 HARDENED ROUTE: WEBSITE DESIGN
app.post('/api/website/design', async (req, res) => {
    try {
        const { business_type, location, goals } = req.body;
        
        // 1. Validation Gate
        if (!business_type || !location) {
            return res.status(400).json({ error: "Missing required business parameters" });
        }

        // 2. Audit Trail
        logAction('WEBSITE_DESIGN', req.body);

        // 3. Execution
        const result = await money.designWebsite(business_type, location, goals);
        res.json({ status: 'success', data: result });
        
    } catch (err) {
        logAction('ERROR_WEBSITE_DESIGN', err.message);
        res.status(500).json({ error: "System processing fault", details: err.message });
    }
});

// DAY 10 HARDENED ROUTE: DOCUMENT ANALYSIS
app.post('/api/doc/analyze', async (req, res) => {
    try {
        const { document_id, analysis_type } = req.body;
        
        // 1. Validation Gate
        if (!document_id || !analysis_type) {
            return res.status(400).json({ error: "Missing document parameters" });
        }

        // 2. Audit Trail
        logAction('DOC_ANALYSIS', { document_id, analysis_type });

        // 3. Execution
        const result = await money.analyzeDocument(document_id, analysis_type);
        res.json({ status: 'success', summary: result.summary || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_DOC_ANALYSIS', err.message);
        res.status(500).json({ error: "Analysis fault", details: err.message });
    }
});

// DAY 10 HARDENED ROUTE: DOCUMENT ANALYSIS
app.post('/api/doc/analyze', async (req, res) => {
    try {
        const { document_id, analysis_type } = req.body;
        
        // 1. Validation Gate
        if (!document_id || !analysis_type) {
            return res.status(400).json({ error: "Missing document parameters" });
        }

        // 2. Audit Trail
        logAction('DOC_ANALYSIS', { document_id, analysis_type });

        // 3. Execution
        const result = await money.analyzeDocument(document_id, analysis_type);
        res.json({ status: 'success', summary: result.summary || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_DOC_ANALYSIS', err.message);
        res.status(500).json({ error: "Analysis fault", details: err.message });
    }
});

// DAY 9 HARDENED ROUTE: COLD SMS SEQUENCE
app.post('/api/sms/sequence', async (req, res) => {
    try {
        const { contact_list, message_body } = req.body;
        
        // 1. Validation Gate
        if (!contact_list || !message_body) {
            return res.status(400).json({ error: "Missing SMS parameters" });
        }

        // 2. Audit Trail
        logAction('SMS_SEQUENCE', req.body);

        // 3. Execution
        const result = await money.generateSMSSequence(contact_list, message_body);
        res.json({ status: 'success', sms_id: result.id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_SMS_SEQUENCE', err.message);
        res.status(500).json({ error: "SMS generation fault", details: err.message });
    }
});

// DAY 8 HARDENED ROUTE: COLD EMAIL SEQUENCE
app.post('/api/email/sequence', async (req, res) => {
    try {
        const { audience_segment, campaign_goal } = req.body;
        
        // 1. Validation Gate
        if (!audience_segment || !campaign_goal) {
            return res.status(400).json({ error: "Missing campaign parameters" });
        }

        // 2. Audit Trail
        logAction('EMAIL_SEQUENCE', req.body);

        // 3. Execution
        const result = await money.generateEmailSequence(audience_segment, campaign_goal);
        res.json({ status: 'success', sequence_id: result.id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_EMAIL_SEQUENCE', err.message);
        res.status(500).json({ error: "Sequence generation fault", details: err.message });
    }
});

// DAY 7 HARDENED ROUTE: LEAD GENERATION
app.post('/api/leadgen/build', async (req, res) => {
    try {
        const { industry, target_region, filters } = req.body;
        
        // 1. Validation Gate
        if (!industry || !target_region) {
            return res.status(400).json({ error: "Missing lead generation criteria" });
        }

        // 2. Audit Trail
        logAction('LEADGEN_BUILD', req.body);

        // 3. Execution
        const result = await money.buildLeadGen(industry, target_region, filters);
        res.json({ status: 'success', leads_found: result.count || 0 });
        
    } catch (err) {
        logAction('ERROR_LEADGEN_BUILD', err.message);
        res.status(500).json({ error: "Lead generation fault", details: err.message });
    }
});

// DAY 6 HARDENED ROUTE: CONTENT CALENDAR
app.post('/api/calendar/generate', async (req, res) => {
    try {
        const { start_date, duration_days, focus_topic } = req.body;
        
        // 1. Validation Gate
        if (!start_date || !duration_days) {
            return res.status(400).json({ error: "Missing scheduling parameters" });
        }

        // 2. Audit Trail
        logAction('CALENDAR_GEN', req.body);

        // 3. Execution
        const result = await money.generateCalendar(start_date, duration_days, focus_topic);
        res.json({ status: 'success', calendar_id: result.id || 'NEW_CAL' });
        
    } catch (err) {
        logAction('ERROR_CALENDAR_GEN', err.message);
        res.status(500).json({ error: "Scheduling fault", details: err.message });
    }
});

// DAY 10 HARDENED ROUTE: DOCUMENT ANALYSIS
app.post('/api/doc/analyze', async (req, res) => {
    try {
        const { document_id, analysis_type } = req.body;
        
        // 1. Validation Gate
        if (!document_id || !analysis_type) {
            return res.status(400).json({ error: "Missing document parameters" });
        }

        // 2. Audit Trail
        logAction('DOC_ANALYSIS', { document_id, analysis_type });

        // 3. Execution
        const result = await money.analyzeDocument(document_id, analysis_type);
        res.json({ status: 'success', summary: result.summary || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_DOC_ANALYSIS', err.message);
        res.status(500).json({ error: "Analysis fault", details: err.message });
    }
});

// DAY 10 HARDENED ROUTE: DOCUMENT ANALYSIS
app.post('/api/doc/analyze', async (req, res) => {
    try {
        const { document_id, analysis_type } = req.body;
        
        // 1. Validation Gate
        if (!document_id || !analysis_type) {
            return res.status(400).json({ error: "Missing document parameters" });
        }

        // 2. Audit Trail
        logAction('DOC_ANALYSIS', { document_id, analysis_type });

        // 3. Execution
        const result = await money.analyzeDocument(document_id, analysis_type);
        res.json({ status: 'success', summary: result.summary || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_DOC_ANALYSIS', err.message);
        res.status(500).json({ error: "Analysis fault", details: err.message });
    }
});

// DAY 9 HARDENED ROUTE: COLD SMS SEQUENCE
app.post('/api/sms/sequence', async (req, res) => {
    try {
        const { contact_list, message_body } = req.body;
        
        // 1. Validation Gate
        if (!contact_list || !message_body) {
            return res.status(400).json({ error: "Missing SMS parameters" });
        }

        // 2. Audit Trail
        logAction('SMS_SEQUENCE', req.body);

        // 3. Execution
        const result = await money.generateSMSSequence(contact_list, message_body);
        res.json({ status: 'success', sms_id: result.id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_SMS_SEQUENCE', err.message);
        res.status(500).json({ error: "SMS generation fault", details: err.message });
    }
});

// DAY 8 HARDENED ROUTE: COLD EMAIL SEQUENCE
app.post('/api/email/sequence', async (req, res) => {
    try {
        const { audience_segment, campaign_goal } = req.body;
        
        // 1. Validation Gate
        if (!audience_segment || !campaign_goal) {
            return res.status(400).json({ error: "Missing campaign parameters" });
        }

        // 2. Audit Trail
        logAction('EMAIL_SEQUENCE', req.body);

        // 3. Execution
        const result = await money.generateEmailSequence(audience_segment, campaign_goal);
        res.json({ status: 'success', sequence_id: result.id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_EMAIL_SEQUENCE', err.message);
        res.status(500).json({ error: "Sequence generation fault", details: err.message });
    }
});

// DAY 7 HARDENED ROUTE: LEAD GENERATION
app.post('/api/leadgen/build', async (req, res) => {
    try {
        const { industry, target_region, filters } = req.body;
        
        // 1. Validation Gate
        if (!industry || !target_region) {
            return res.status(400).json({ error: "Missing lead generation criteria" });
        }

        // 2. Audit Trail
        logAction('LEADGEN_BUILD', req.body);

        // 3. Execution
        const result = await money.buildLeadGen(industry, target_region, filters);
        res.json({ status: 'success', leads_found: result.count || 0 });
        
    } catch (err) {
        logAction('ERROR_LEADGEN_BUILD', err.message);
        res.status(500).json({ error: "Lead generation fault", details: err.message });
    }
});

// DAY 6 HARDENED ROUTE: CONTENT CALENDAR
app.post('/api/calendar/generate', async (req, res) => {
    try {
        const { start_date, duration_days, focus_topic } = req.body;
        
        // 1. Validation Gate
        if (!start_date || !duration_days) {
            return res.status(400).json({ error: "Missing scheduling parameters" });
        }

        // 2. Audit Trail
        logAction('CALENDAR_GEN', req.body);

        // 3. Execution
        const result = await money.generateCalendar(start_date, duration_days, focus_topic);
        res.json({ status: 'success', calendar_id: result.id || 'NEW_CAL' });
        
    } catch (err) {
        logAction('ERROR_CALENDAR_GEN', err.message);
        res.status(500).json({ error: "Scheduling fault", details: err.message });
    }
});

// DAY 5 HARDENED ROUTE: CONTENT POSTING
app.post('/api/social/post', async (req, res) => {
    try {
        const { campaign_id, scheduled_time } = req.body;
        
        // 1. Validation Gate
        if (!campaign_id) {
            return res.status(400).json({ error: "Missing campaign reference" });
        }

        // 2. Audit Trail
        logAction('CONTENT_POSTING', req.body);

        // 3. Execution
        const result = await money.postContent(campaign_id, scheduled_time);
        res.json({ status: 'success', post_id: result.post_id || 'QUEUED' });
        
    } catch (err) {
        logAction('ERROR_CONTENT_POSTING', err.message);
        res.status(500).json({ error: "Posting fault", details: err.message });
    }
});

// DAY 4 HARDENED ROUTE: SOCIAL MEDIA BUILD
app.post('/api/social/build', async (req, res) => {
    try {
        const { platform, content_topic, frequency } = req.body;
        
        // 1. Validation Gate
        if (!platform || !content_topic) {
            return res.status(400).json({ error: "Missing required social media parameters" });
        }

        // 2. Audit Trail
        logAction('SOCIAL_MEDIA_BUILD', req.body);

        // 3. Execution
        const result = await money.buildSocialMedia(req.body);
        res.json({ status: 'success', campaign_id: result.campaign_id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_SOCIAL_MEDIA_BUILD', err.message);
        res.status(500).json({ error: "System processing fault", details: err.message });
    }
});

// DAY 3 HARDENED ROUTE: CHATBOT BUILD
app.post('/api/chatbot/build', async (req, res) => {
    try {
        const { bot_name, industry, persona } = req.body;
        
        // 1. Validation Gate
        if (!bot_name || !industry) {
            return res.status(400).json({ error: "Missing required chatbot parameters" });
        }

        // 2. Audit Trail
        logAction('CHATBOT_BUILD', req.body);

        // 3. Execution
        const result = await money.buildChatbot(req.body);
        res.json({ status: 'success', bot_id: result.id || 'N/A' });
        
    } catch (err) {
        logAction('ERROR_CHATBOT_BUILD', err.message);
        res.status(500).json({ error: "System processing fault", details: err.message });
    }
});

// DAY 2 HARDENED ROUTE: LANDING PAGE GENERATION
app.post('/api/landing-page/generate', async (req, res) => {
    try {
        const { target_audience, offer_details } = req.body;
        
        // 1. Validation Gate
        if (!target_audience || !offer_details) {
            return res.status(400).json({ error: "Missing required landing page parameters" });
        }

        // 2. Audit Trail
        logAction('LANDING_PAGE_GEN', req.body);

        // 3. Execution (Assuming the function exists in all-services.js)
        const result = await money.generateLandingPage(target_audience, offer_details);
        res.json({ status: 'success', data: result });
        
    } catch (err) {
        logAction('ERROR_LANDING_PAGE_GEN', err.message);
        res.status(500).json({ error: "System processing fault", details: err.message });
    }
});

app.listen(PORT, () => console.log('🚀 SIGNSAFE PRO V5: DAY 1 HARDENED'));












