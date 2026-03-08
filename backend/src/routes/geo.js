import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
	getGeoFeatures,
	getNearbyGeoFeatures,
	getGeoSyncStatus,
	getGeoModelCollection,
	exportGeoShapefile,
	exportGeoBinaryModel,
	exportGeoBinaryTile,
	exportGeoGltfModel,
	exportGeoGlbModel,
	exportGeoTileset3D
} from '../controllers/geoController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'manager', 'operator', 'auditor', 'viewer'));

router.get('/features', getGeoFeatures);
router.get('/nearby', getNearbyGeoFeatures);
router.get('/sync-status', getGeoSyncStatus);
router.get('/models', getGeoModelCollection);
router.get('/export/shapefile', exportGeoShapefile);
router.get('/export/binary', exportGeoBinaryModel);
router.get('/export/binary-tile', exportGeoBinaryTile);
router.get('/export/3d/model.gltf', exportGeoGltfModel);
router.get('/export/3d/model.glb', exportGeoGlbModel);
router.get('/export/3d/tileset.json', exportGeoTileset3D);

export default router;
