
import express from 'express';
import * as Auth from 'middlewares/auth';

const router = express.Router();

router.use(Auth.isAuthorized);

export default router;