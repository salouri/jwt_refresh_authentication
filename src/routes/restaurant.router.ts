import express from 'express';
import * as restaurantController from 'controllers/restaurant.controller';
import { isAuthenticated } from 'middlewares/auth';

const router = express.Router();

router.use(isAuthenticated); // protect all routes below
router.get(
  '/get-nearby-restaurants/:latlng/:unit',
  restaurantController.getRestaurantsWithinDist
);
router.get('/get-all-restaurants', restaurantController.findAllRestaurants);
router.delete('/delete-restaurant/:id', restaurantController.deleteRestaurant);

export default router;
