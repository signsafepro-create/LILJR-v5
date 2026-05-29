const express = require('express');
const router = express.Router();
const dominance = require('./dominance-engine');

// Health
router.get('/health', async (req, res) => {
  try { res.json({ status: 'alive', protocol: 'DOMINANCE', version: '1.0.0', engines: ['predictive_conversion','autonomous_campaign','competitive_intelligence','revenue_attribution','adaptive_learning'], classification: 'PREDICTIVE_MARKET_DOMINANCE' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 1. Predictive Conversion
router.post('/score-lead', async (req, res) => {
  try { const result = await dominance.scoreLead(req.body); res.json({ engine: 'predictive', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/score-batch', async (req, res) => {
  try { const result = await dominance.scoreLeadBatch(req.body.leads); res.json({ engine: 'predictive', leads_scored: req.body.leads?.length, result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/predict-revenue', async (req, res) => {
  try { const result = await dominance.predictRevenue(req.body.leads, req.body.avg_deal_size, req.body.close_rate); res.json({ engine: 'predictive', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Autonomous Campaign
router.post('/campaign/build', async (req, res) => {
  try { const result = await dominance.buildAutonomousCampaign(req.body.business_type, req.body.location, req.body.budget); res.json({ engine: 'autonomous', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/campaign/optimize', async (req, res) => {
  try { const result = await dominance.optimizeCampaign(req.body.campaign_id, req.body.metrics); res.json({ engine: 'autonomous', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Competitive Intelligence
router.post('/intel/analyze', async (req, res) => {
  try { const result = await dominance.analyzeCompetitor(req.body.competitor_url); res.json({ engine: 'intelligence', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/intel/gap', async (req, res) => {
  try { const result = await dominance.findMarketGaps(req.body.industry, req.body.location); res.json({ engine: 'intelligence', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Attribution Engine
router.post('/attribution/track', async (req, res) => {
  try { const result = await dominance.trackAttribution(req.body.touchpoints); res.json({ engine: 'attribution', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/attribution/report/:campaignId', async (req, res) => {
  try { const result = await dominance.getAttributionReport(req.params.campaignId); res.json({ engine: 'attribution', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Adaptive Learning
router.post('/learn/feedback', async (req, res) => {
  try { const result = await dominance.learnFromFeedback(req.body.campaign_id, req.body.outcome); res.json({ engine: 'learning', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/learn/model/:engineId', async (req, res) => {
  try { const result = await dominance.getModelState(req.params.engineId); res.json({ engine: 'learning', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Dashboard
router.get('/dashboard', async (req, res) => {
  try { const result = await dominance.getDashboard(); res.json({ engine: 'all', result }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
