import { Router } from 'express'
import formidableMiddleware from 'express-formidable'
import { checkToken } from '../meta/authMiddleware'
import { checkmaintenanceMode } from '../meta/maintenanceMiddleware'
import * as slot from './slot.controller'
import { toggleLog } from './slot.services/events/events'


const router = Router()
router.route('/auth').post(checkmaintenanceMode, slot.authPost)
router.route('/with-token').get(checkmaintenanceMode, slot.withTokenGet)
router.route('/symbols_in_db').get(checkmaintenanceMode, slot.symbolsInDBGet)
router.route('/symbol').post(checkmaintenanceMode, slot.symbolPost)
router.route('/symbol').delete(checkmaintenanceMode, slot.symbolDelete)
router.route('/game_init').get(checkmaintenanceMode, slot.gameInitGet)
router.route('/profile').post(checkmaintenanceMode, checkToken, slot.profilePost)
router.route('/spin').get(checkmaintenanceMode, checkToken, slot.spinGet)
router.route('/wallet').get(checkmaintenanceMode, checkToken, slot.walletGet)
router.route('/get_login_data').get(checkmaintenanceMode, checkToken, slot.loginDataGet)
router.route('/countries').get(checkmaintenanceMode, checkToken, slot.countriesGet)
router.route('/purchase_tickets').get(checkmaintenanceMode, checkToken, slot.purchaseTicketsGet)
router.route('/raffle_prize_data').get(checkmaintenanceMode, checkToken, slot.rafflesPrizeDataGet)
router.route('/raffle').post(checkmaintenanceMode, formidableMiddleware(), checkToken, slot.rafflePost)
router.route('/raffle').delete(checkmaintenanceMode, checkToken, slot.raffleDelete)
router.route('/Video_ads_view_count_for_crud').get(checkmaintenanceMode, checkToken, slot.videoAdsViewCountForCrudGet)
router.route('/winners_for_crud').get(checkmaintenanceMode, checkToken, slot.winnersForCrudGet)
router.route('/raffle_purchase').get(checkmaintenanceMode, checkToken, slot.rafflePurchaseGet)
router.route('/raffle_purchase_history').get(checkmaintenanceMode, checkToken, slot.rafflePurchaseHistoryGet)
router.route('/prizes_winners').get(checkmaintenanceMode, checkToken, slot.prizesWinnersGet)
router.route('/prize_notified').post(checkmaintenanceMode, checkToken, slot.prizeNotifiedPost)
router.route('/postman').get(checkmaintenanceMode, slot.postmanGet)
router.route('/language_code').get(checkmaintenanceMode, checkToken, slot.languageCodeGet)
router.route('/support_request').post(checkmaintenanceMode, checkToken, slot.soportePost)
// router.route('/event').post(checkmaintenanceMode, checkToken, slot.eventPost)
router.route('/ads_settings_for_crud').get(checkmaintenanceMode, checkToken, slot.adsSettingsForCrudGet)
router.route('/ads_settings_for_crud').post(checkmaintenanceMode, checkToken, slot.adsSettingsForCrudPost)
router.route('/tickets_settings_for_crud').get(checkmaintenanceMode, checkToken, slot.ticketsSettingsForCrudGet)
router.route('/tickets_settings_for_crud').post(checkmaintenanceMode, checkToken, slot.ticketsSettingsForCrudPost)
router.route('/events').get(checkmaintenanceMode, checkToken, slot.eventsForCrudGet)
router.route('/event').post(checkmaintenanceMode, formidableMiddleware(), checkToken, slot.eventPost)
router.route('/event').delete(checkmaintenanceMode, checkToken, slot.eventDelete)
router.route('/skins').get(checkmaintenanceMode, checkToken, slot.skinsGet)
router.route('/eventsReload').post(checkmaintenanceMode, checkToken, slot.eventsReloadPost)
router.route('/toggleLog').post(checkmaintenanceMode, checkToken, (req, res) => { res.status(200).json({ logging: toggleLog() }) })
router.route('/daily_reward_claim').get(checkmaintenanceMode, checkToken, slot.dailyRewardClaimGet)
router.route('/daily_reward_info').get(checkmaintenanceMode, checkToken, slot.dailyRewardInfoGet)
router.route('/daily_reward_for_crud').get(checkmaintenanceMode, checkToken, slot.dailyRewardGet)
router.route('/daily_reward_for_crud').post(checkmaintenanceMode, checkToken, slot.dailyRewardPost)
router.route('/daily_reward_for_crud').delete(checkmaintenanceMode, checkToken, slot.dailyRewardDelete)
router.route('/spin_settings_for_crud').get(checkmaintenanceMode, checkToken, slot.spinSettingsForCrudGet)
router.route('/spin_settings_for_crud').post(checkmaintenanceMode, checkToken, slot.spinSettingsForCrudPost)
router.route('/spin_data').get(checkmaintenanceMode, checkToken, slot.spinDataGet)
router.route('/spin_data').post(checkmaintenanceMode, checkToken, slot.spinDataPost)
router.route('/all_events').get(checkmaintenanceMode, checkToken, slot.allEvents)

router.route('/max_allowed_birth_year').post(checkmaintenanceMode, checkToken, slot.maxAllowedBirthYearPost)
router.route('/playersForFront').get(checkmaintenanceMode, checkToken, slot.playersForFrontGet)
router.route('/toggle_ban_for_crud').get(checkmaintenanceMode, checkToken, slot.toggleBanForCrudPost)
router.route('/support_request_for_crud').get(checkmaintenanceMode, checkToken, slot.supportRequestForCrudGet)
router.route('/symbols_for_crud').get(checkmaintenanceMode, slot.symbolsGet)
router.route('/raffles_for_crud').get(checkmaintenanceMode, checkToken, slot.rafflesForCrudGet)
router.route('/change_winners_status_for_crud').post(checkmaintenanceMode, checkToken, slot.changeWinnersStatusForCrudPost)
router.route('/playerForFront').get(checkmaintenanceMode, checkToken, slot.playerForFrontGet)
router.route('/tombola_for_crud').get(checkmaintenanceMode, checkToken, slot.tombolaForCrudGet)
router.route('/tombola_for_crud').post(checkmaintenanceMode, checkToken, slot.tombolaForCrudPost)
router.route('/win_lose_for_tombola_crud').post(checkmaintenanceMode, checkToken, slot.winLoseForTombolaCrudPost)
router.route('/support_admin_for_crud').get(checkmaintenanceMode, checkToken, slot.supportAdminForCrudGet)
router.route('/support_admin_for_crud').post(checkmaintenanceMode, checkToken, slot.supportAdminForCrudPost)

router.route('/languages_for_crud').get(checkmaintenanceMode, checkToken, slot.languagesForCrudGet)
router.route('/language_for_crud').post(checkmaintenanceMode, formidableMiddleware(), checkToken, slot.languageForCrudPost)
router.route('/language_for_crud').delete(checkmaintenanceMode, checkToken, slot.languageForCrudToggleDelete)

router.route('/skins_for_crud').get(checkmaintenanceMode, checkToken, slot.skinsForCrudGet)
router.route('/skin_for_crud').post(checkmaintenanceMode, formidableMiddleware(), checkToken, slot.skinForCrudPost)
router.route('/skin_for_crud').delete(checkmaintenanceMode, checkToken, slot.skinForCrudDelete)

router.route('/misc_settings_for_crud').get(checkmaintenanceMode, checkToken, slot.miscSettingsForCrudGet)
router.route('/misc_settings_for_crud').post(checkmaintenanceMode, checkToken, slot.miscSettingsForCrudPost)

router.route('/countries_for_crud').get(checkmaintenanceMode, checkToken, slot.countriesForCrudGet)
router.route('/country_for_crud').post(checkmaintenanceMode, formidableMiddleware(), checkToken, slot.countriesForCrudPost)

router.route('/testRegSpinsUSer39').get(checkmaintenanceMode, slot.testRegSpinsUSer39)
router.route('/ironsource').get(checkmaintenanceMode, slot.ironsource)
router.route('/appodeal').get(checkmaintenanceMode, slot.appodeal)
router.route('/tapjoy').get(checkmaintenanceMode, slot.tapjoy)
router.route('/atlas').get(checkmaintenanceMode, slot.atlasGet)
router.route('/slot-data').get(checkmaintenanceMode, slot.slotDataGet)
router.route('/reset-settings').post(checkmaintenanceMode, slot.resetSettingsPost)
router.route('/iap').get(checkmaintenanceMode, checkToken, slot.iapGet)
router.route('/sendmail').post(checkmaintenanceMode, checkToken, slot.sendmail)
router.route('/localizations_for_crud').get(checkmaintenanceMode, checkToken, slot.localizationsForCrudGet)
router.route('/localizations_for_crud').post(checkmaintenanceMode, checkToken, slot.localizationsForCrudPost)
router.route('/language_default_for_crud').post(checkmaintenanceMode, checkToken, slot.languageDefaultForCrudPost)
export default router
