// get-nearby-restaurants/:latlng/:unit
import type { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import Restaurant from '../models/restaurant.model';

export const getRestaurantsWithinDist = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { distance, latlng, unit } = req.params;
      const [lat, lng] = latlng.split(',');

      const earthRadius = unit && unit === 'mi' ? 3963.2 : 6378.1; //unit = 'mi' or 'km'
      const radius: number = Number(distance) / earthRadius;

      if (!lat || !lng) {
        return next(
          new AppError(
            'Please, provide latitude and longitude in the format lat,lng',
            400
          )
        );
      }
      //Geospacial Query
      const restaurants = await Restaurant.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
      });

      res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: restaurants,
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }
);

// get-all-restaurants
export const findAllRestaurants = catchAsync(async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find();
    // no error handling here because we want to return an empty array if no restaurants are found
    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      data: restaurants,
    });
  } catch (error: any) {
    throw new AppError(error.message, 500);
  }
});

// delete-restaurant/:id
export const deleteRestaurant = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const restaurant = await Restaurant.findByIdAndDelete(id);
      if (!restaurant)
        return next(new AppError('No restaurant found with that ID', 404));

      res.status(200).json({
        status: 'success',
        data: restaurant,
      });
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }
);
