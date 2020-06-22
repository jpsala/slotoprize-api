import {Router} from 'express'

import {checkToken} from './authMiddleware'
import * as slot from './slot.controller'

const router = Router()
router.route('/profile').get(checkToken, slot.getProfile)
router.route('/profile').post(checkToken, slot.postProfile)
router.route('/game_init').get(slot.gameInit)
router.route('/spin').get(checkToken, slot.spin)

export default router
