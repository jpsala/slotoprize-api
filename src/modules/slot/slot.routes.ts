import formidableMiddleware from 'express-formidable'
import { checkToken } from '../meta/authMiddleware'
import { toggleLog } from './slot.services/events/events'

import * as slot from './slot.controller'
import { Router } from 'express'

const router = Router()
router.route('/auth').post(slot.authPost)
router.route('/with-token').get(slot.withTokenGet)
router.route('/symbols_in_db').get(slot.symbolsInDBGet)
router.route('/symbol').post(slot.symbolPost)
router.route('/symbol').delete(slot.symbolDelete)
router.route('/game_init').get(slot.gameInitGet)
router.route('/profile').post(checkToken, slot.profilePost)
router.route('/spin').get(checkToken, slot.spinGet)
router.route('/wallet').get(checkToken, slot.walletGet)
router.route('/get_login_data').get(checkToken, slot.loginDataGet)
router.route('/countries').get(checkToken, slot.countriesGet)
router.route('/purchase_tickets').get(checkToken, slot.purchaseTicketsGet)
router.route('/raffle_prize_data').get(checkToken, slot.rafflesPrizeDataGet)
router.route('/raffle').post(formidableMiddleware(), checkToken, slot.rafflePost)
router.route('/raffle').delete(checkToken, slot.raffleDelete)
router.route('/raffle_purchase').get(checkToken, slot.rafflePurchaseGet)
router.route('/raffle_purchase_history').get(checkToken, slot.rafflePurchaseHistoryGet)
router.route('/raffle_winners').get(checkToken, slot.raffleWinnersGet)
router.route('/prize_notified').post(checkToken, slot.prizeNotifiedPost)
router.route('/postman').get(slot.postmanGet)
router.route('/language_code').get(checkToken, slot.languageCodeGet)
router.route('/support_request').post(checkToken, slot.soportePost)
// router.route('/event').post(checkToken, slot.eventPost)
router.route('/events').get(checkToken, slot.eventsForCrudGet)
router.route('/event').post(formidableMiddleware(), checkToken, slot.eventPost)
router.route('/skins').get(checkToken, slot.skinsGet)
router.route('/eventsReload').post(checkToken, slot.eventsReloadPost)
router.route('/toggleLog').post(checkToken, (req, res) => { res.status(200).json({ logging: toggleLog() }) })
router.route('/daily_reward_claim').get(checkToken, slot.dailyRewardClaimGet)
router.route('/spin_data').get(checkToken, slot.spinDataGet)
router.route('/spin_data').post(checkToken, slot.spinDataPost)

router.route('/playersForFront').get(checkToken, slot.playersForFrontGet)
router.route('/support_request_for_crud').get(checkToken, slot.supportRequestForCrudGet)
router.route('/symbols_for_crud').get(slot.symbolsGet)
router.route('/raffles_for_crud').get(checkToken, slot.rafflesForCrudGet)
router.route('/playerForFront').get(checkToken, slot.playerForFrontGet)
router.route('/tombola_for_crud').get(checkToken, slot.tombolaForCrudGet)
router.route('/tombola_for_crud').post(checkToken, slot.tombolaForCrudPost)
router.route('/support_admin_for_crud').get(checkToken, slot.supportAdminForCrudGet)
router.route('/support_admin_for_crud').post(checkToken, slot.supportAdminForCrudPost)

router.route('/languages_for_crud').get(checkToken, slot.languagesForCrudGet)
router.route('/language_for_crud').post(formidableMiddleware(), checkToken, slot.languageForCrudPost)
router.route('/language_for_crud').delete(checkToken, slot.languageForCrudDelete)

router.route('/skins_for_crud').get(checkToken, slot.skinsForCrudGet)
router.route('/skin_for_crud').post(formidableMiddleware(), checkToken, slot.skinForCrudPost)
// router.route('/skin_for_crud').delete(checkToken, slot.skinForCrudDelete)

router.route('/countries_for_crud').get(checkToken, slot.countriesForCrudGet)
router.route('/country_for_crud').post(formidableMiddleware(), checkToken, slot.countriesForCrudPost)

export default router
