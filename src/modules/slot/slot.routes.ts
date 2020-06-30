import {Router} from 'express'

import {checkToken} from './authMiddleware'
import * as slot from './slot.controller'

const router = Router()
router.route('/auth').post(slot.auth)
router.route('/with-token').get(slot.withToken)
router.route('/symbols_in_db').get(slot.symbolsInDB)
router.route('/profile').get(checkToken, slot.getProfile).post(checkToken, slot.postProfile)
router.route('/game_init').get(slot.gameInit)
router.route('/spin').get(checkToken, slot.spin)
router.route('/wallet').get(checkToken, slot.getWallet)
router.route('/countries').get(checkToken, slot.getCountries)
router.route('/purchase_tickets').get(checkToken, slot.purchaseTickets)
router.route('/postman').get(slot.postman)

export default router
