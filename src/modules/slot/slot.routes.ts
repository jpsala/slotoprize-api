import {Router} from 'express'

import {checkToken} from './authMiddleware'
import * as slot from './slot.controller'

const router = Router()
router.route('/auth').post(slot.authPos)
router.route('/with-token').get(slot.withTokenGet)
router.route('/symbols_in_db').get(slot.symbolsInDBGet)
router.route('/profile').get(checkToken, slot.profileGet).post(checkToken, slot.profilePost)
router.route('/game_init').get(slot.gameInitGet)
router.route('/spin').get(checkToken, slot.spinGet)
router.route('/wallet').get(checkToken, slot.walletGet)
router.route('/countries').get(checkToken, slot.countriesGet)
router.route('/purchase_tickets').get(checkToken, slot.purchaseTicketsGet)
router.route('/raffles').get(checkToken, slot.rafflesGet)
router.route('/raffle').post(checkToken, slot.rafflePost)
router.route('/raffle_purchase').get(checkToken, slot.rafflePurchaseGet)
router.route('/raffle_purchase_history').get(checkToken, slot.getRafflePurchaseHistoryGet)
router.route('/postman').get(slot.postmanGet)
router.route('/testSched').get(slot.testSchedGet)

export default router
