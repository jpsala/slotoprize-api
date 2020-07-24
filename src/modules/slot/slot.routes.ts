import {Router} from 'express'

import {checkToken} from '../meta/authMiddleware'
import * as slot from './slot.controller'

const router = Router()
router.route('/auth').post(slot.authPos)
router.route('/with-token').get(slot.withTokenGet)
router.route('/symbols_in_db').get(slot.symbolsInDBGet)
router.route('/game_init').get(slot.gameInitGet)
router.route('/profile').post(checkToken, slot.profilePost)
router.route('/spin').get(checkToken, slot.spinGet)
router.route('/wallet').get(checkToken, slot.walletGet)
router.route('/countries').get(checkToken, slot.countriesGet)
router.route('/purchase_tickets').get(checkToken, slot.purchaseTicketsGet)
router.route('/raffle_prize_data').get(checkToken, slot.rafflesPrizeDataGet)
router.route('/raffle').post(checkToken, slot.rafflePost)
router.route('/raffle_purchase').get(checkToken, slot.rafflePurchaseGet)
router.route('/raffle_purchase_history').get(checkToken, slot.rafflePurchaseHistoryGet)
router.route('/raffle_winners').get(checkToken, slot.raffleWinnersGet)
router.route('/prize_notified').post(checkToken, slot.prizeNotifiedPost)
router.route('/postman').get(slot.postmanGet)
router.route('/language_code').get(checkToken, slot.languageCodeGet)
router.route('/support_request').post(checkToken, slot.soportePost)
router.route('/event').post(checkToken, slot.eventPost)
router.route('/daily_reward_claim').get(checkToken, slot.dailyRewardClaimGet)
router.route('/testSched').get(slot.testSchedGet)

export default router
