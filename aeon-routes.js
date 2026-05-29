const express = require("express");
const router = express.Router();
const AeonProtocol = require("./aeon-protocol");
const aeon = new AeonProtocol();

router.get("/health", (req, res) => {
  res.json({ status: "alive", protocol: "AEON", version: aeon.version, engines: aeon.engines, classification: aeon.classification });
});

router.post("/simulation/spawn", (req, res) => { res.json(aeon.simulationSpawn(req.body)); });
router.post("/simulation/evolve", (req, res) => { res.json(aeon.simulationEvolve(req.body)); });
router.post("/swarm/spawn", (req, res) => { res.json(aeon.swarmSpawn(req.body)); });
router.post("/swarm/orchestrate", (req, res) => { res.json(aeon.swarmOrchestrate(req.body)); });
router.post("/ma/discover", (req, res) => { res.json(aeon.maDiscover(req.body)); });
router.post("/ma/structure", (req, res) => { res.json(aeon.maStructure(req.body)); });
router.post("/distortion/field", (req, res) => { res.json(aeon.distortionField(req.body)); });
router.post("/distortion/virality", (req, res) => { res.json(aeon.distortionVirality(req.body)); });
router.post("/hive/awaken", (req, res) => { res.json(aeon.hiveAwaken(req.body)); });
router.post("/hive/query", (req, res) => { res.json(aeon.hiveQuery(req.body)); });
router.post("/temporal/scan", (req, res) => { res.json(aeon.temporalScan(req.body)); });
router.post("/temporal/wave", (req, res) => { res.json(aeon.temporalWave(req.body)); });
router.post("/spawn/entity", (req, res) => { res.json(aeon.spawnEntity(req.body)); });
router.post("/spawn/nurture", (req, res) => { res.json(aeon.spawnNurture(req.body)); });
router.post("/run", (req, res) => { res.json(aeon.runAll(req.body)); });

module.exports = router;
