import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();
const venueController = new VenueController();

// All venue routes require authentication and ORGANIZER or ADMIN role
router.use(authenticate);
router.use(authorize('ORGANIZER', 'ADMIN'));

// GET /api/venues - List all venues for the organizer
router.get('/', venueController.getAll.bind(venueController));

// GET /api/venues/search - Search venues
router.get('/search', venueController.search.bind(venueController));

// GET /api/venues/:id - Get venue by ID
router.get('/:id', venueController.getById.bind(venueController));

// POST /api/venues - Create a new venue
router.post('/', venueController.create.bind(venueController));

// PUT /api/venues/:id - Update venue
router.put('/:id', venueController.update.bind(venueController));

// DELETE /api/venues/:id - Delete venue
router.delete('/:id', venueController.delete.bind(venueController));

export default router;
