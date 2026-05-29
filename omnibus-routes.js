const express = require("express");
const router = express.Router();
const OmnibusProtocol = require("./omnibus-protocol");
const omnibus = new OmnibusProtocol();

router.get("/health", (req, res) => {
  res.json({ status: "alive", protocol: "OMNIBUS", version: omnibus.version, engines: omnibus.engines, classification: omnibus.classification });
});

router.post("/genesis", (req, res) => { res.json(omnibus.genesis(req.body)); });
router.post("/genesis/validate", (req, res) => { res.json(omnibus.genesisValidate(req.body)); });
router.post("/clone", (req, res) => { res.json(omnibus.clone(req.body)); });
router.post("/pollinate", (req, res) => { res.json(omnibus.pollinate(req.body)); });
router.post("/neuro/map", (req, res) => { res.json(omnibus.neuroMap(req.body)); });
router.post("/neuro/script", (req, res) => { res.json(omnibus.neuroScript(req.body)); });
router.post("/mesh/build", (req, res) => { res.json(omnibus.meshBuild(req.body)); });
router.post("/mesh/transaction", (req, res) => { res.json(omnibus.meshTransaction(req.body)); });
router.post("/temporal/map", (req, res) => { res.json(omnibus.temporalMap(req.body)); });
router.post("/temporal/trigger", (req, res) => { res.json(omnibus.temporalTrigger(req.body)); });
router.post("/run", (req, res) => { res.json(omnibus.runAll(req.body)); });

module.exports = router;
