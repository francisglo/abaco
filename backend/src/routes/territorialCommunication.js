import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getEvents,
  createEvent,
  updateEventAttendance,
  getActivities,
  createActivity,
  updateActivity,
  getVolunteers,
  createVolunteer,
  assignVolunteer,
  recordVolunteerHours,
  getFieldReports,
  submitFieldReport,
  reviewFieldReport,
  getTerritorialStats
} from '../controllers/territorialCommunicationController.js';

const router = express.Router();

router.use(authenticate);

// Eventos
router.get('/events', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), validate('pagination'), getEvents);
router.post('/events', authorize('admin', 'manager', 'operator'), validate('createEvent'), createEvent);
router.put('/events/:eventId/attendance', authorize('admin', 'manager', 'operator'), validate('updateEventAttendance'), updateEventAttendance);

// Actividades
router.get('/activities', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getActivities);
router.post('/activities', authorize('admin', 'manager', 'operator'), validate('createActivity'), createActivity);
router.put('/activities/:activityId', authorize('admin', 'manager', 'operator'), validate('updateActivity'), updateActivity);

// Voluntarios
router.get('/volunteers', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), validate('pagination'), getVolunteers);
router.post('/volunteers', authorize('admin', 'manager', 'operator'), validate('createVolunteer'), createVolunteer);
router.post('/volunteers/:volunteerId/assign', authorize('admin', 'manager', 'operator'), validate('assignVolunteer'), assignVolunteer);
router.post('/volunteer-assignments/:assignmentId/hours', authorize('admin', 'manager', 'operator'), validate('recordVolunteerHours'), recordVolunteerHours);

// Reportes de campo
router.get('/field-reports', authorize('admin', 'manager', 'operator', 'auditor'), validate('pagination'), getFieldReports);
router.post('/field-reports', authorize('admin', 'manager', 'operator'), validate('submitFieldReport'), submitFieldReport);
router.put('/field-reports/:reportId/review', authorize('admin', 'manager', 'auditor'), validate('reviewFieldReport'), reviewFieldReport);

// Estadísticas
router.get('/stats/:zoneId', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTerritorialStats);
router.get('/stats', authorize('admin', 'manager', 'operator', 'auditor', 'viewer'), getTerritorialStats);

export default router;
