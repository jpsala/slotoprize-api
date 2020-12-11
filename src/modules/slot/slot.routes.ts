import { Router } from 'express'
import formidableMiddleware from 'express-formidable'
import { checkToken } from '../meta/authMiddleware'
import { checkTokenForBO } from '../meta/authMiddlewareBO'
import { checkDeviceId } from '../meta/checkDeviceIdMiddleware'
import { checkmaintenanceMode } from '../meta/maintenanceMiddleware'
import * as slot from './slot.controller'
import { toggleLog } from './slot.services/events/events'
const router = Router()


router.route('/game_init').get(checkDeviceId, checkmaintenanceMode, slot.gameInitGet)
router.route('/profile').post(checkDeviceId, checkToken, checkmaintenanceMode, slot.profilePost)
router.route('/spin').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.spinGet)
router.route('/countries').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.countriesGet)
router.route('/purchase_tickets').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.purchaseTicketsGet)
router.route('/raffle_prize_data').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.rafflesPrizeDataGet)
router.route('/raffle_purchase').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.rafflePurchaseGet)
router.route('/raffle_purchase_history').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.rafflePurchaseHistoryGet)
router.route('/prizes_winners').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.prizesWinnersGet)
router.route('/prize_notified').post(checkDeviceId, checkToken, checkmaintenanceMode, slot.prizeNotifiedPost)
router.route('/language_code').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.languageCodeGet)
router.route('/support_request').post(checkDeviceId, checkToken, checkmaintenanceMode, slot.soportePost)
router.route('/toggleLog').post(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, (req, res) => { res.status(200).json({ logging: toggleLog() }) })
router.route('/daily_reward_claim').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.dailyRewardClaimGet)
router.route('/daily_reward_info').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.dailyRewardInfoGet)
router.route('/all_events').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.allEvents)
// router.route('/ironsource').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.ironsource)
router.route('/atlas').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.atlasGet)
router.route('/slot-data').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.slotDataGet)
router.route('/reset-settings').post(checkDeviceId, checkToken, checkmaintenanceMode, slot.resetSettingsPost)
router.route('/iap').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.iapGet)
router.route('/sendmail').post(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.sendmail)
router.route('/localization').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.localization)
router.route('/legals').get(checkDeviceId, checkToken, checkmaintenanceMode, checkToken, slot.legalsGet)
router.route('/wallet').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.walletGet)
router.route('/card_collections').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.cardCollectionsCLGet)
router.route('/card_set_completed').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.cardSetClaimGet)
router.route('/card_trade').get(checkDeviceId, checkToken, checkmaintenanceMode, slot.cardTradeGet)

router.route('/appodeal').get(slot.appodeal)
router.route('/tapjoy').get(slot.tapjoy)

// Back Office
router.route('/auth').post(slot.authPost)
router.route('/with-token').get(slot.withTokenGet)
// router.route('/symbols_in_db').get(checkmaintenanceMode, slot.symbolsInDBGet)
router.route('/spin_data').get(checkTokenForBO, slot.spinDataGet)
router.route('/spin_data').post(checkTokenForBO, slot.spinDataPost)
router.route('/get_login_data').get(checkTokenForBO, slot.loginDataGet)
router.route('/wallet_for_crud').get(checkTokenForBO, slot.walletGet)
router.route('/raffle_purchase_history_for_crud').get(checkTokenForBO, slot.rafflePurchaseHistoryGet)
router.route('/event').post(checkTokenForBO, formidableMiddleware(), slot.eventPost)
router.route('/event').delete(checkTokenForBO, slot.eventDelete)
router.route('/events').get(checkTokenForBO, slot.eventsForCrudGet)
router.route('/skins').get(checkTokenForBO, slot.skinsGet)
router.route('/raffle').post(checkTokenForBO, formidableMiddleware(), slot.rafflePost)
router.route('/raffle').delete(checkTokenForBO, slot.raffleDelete)
router.route('/settings_for_localization_for_crud').post(checkTokenForBO, slot.settingsForLocalizationPost)
router.route('/max_allowed_birth_year_for_crud').post(checkTokenForBO, slot.maxAllowedBirthYearPost)
router.route('/symbol').post(checkTokenForBO, slot.symbolPost)
router.route('/symbol').delete(checkTokenForBO, slot.symbolDelete)
router.route('/Video_ads_view_count_for_crud').get(checkTokenForBO, slot.videoAdsViewCountForCrudGet)
router.route('/winners_for_crud').get(checkTokenForBO, slot.winnersForCrudGet)
router.route('/ads_settings_for_crud').get(checkTokenForBO, slot.adsSettingsForCrudGet)
router.route('/ads_settings_for_crud').post(checkTokenForBO, slot.adsSettingsForCrudPost)
router.route('/tickets_settings_for_crud').get(checkTokenForBO, slot.ticketsSettingsForCrudGet)
router.route('/tickets_settings_for_crud').post(checkTokenForBO, slot.ticketsSettingsForCrudPost)
router.route('/daily_reward_for_crud').get(checkTokenForBO, slot.dailyRewardGet)
router.route('/daily_reward_for_crud').post(checkTokenForBO, slot.dailyRewardPost)
router.route('/daily_reward_for_crud').delete(checkTokenForBO, slot.dailyRewardDelete)
router.route('/spin_settings_for_crud').get(checkTokenForBO, slot.spinSettingsForCrudGet)
router.route('/spin_settings_for_crud').post(checkTokenForBO, slot.spinSettingsForCrudPost)
router.route('/toggle_ban_for_crud').get(checkTokenForBO, slot.toggleBanForCrudPost)
router.route('/support_request_for_crud').get(checkTokenForBO, slot.supportRequestForCrudGet)
router.route('/symbols_for_crud').get(slot.symbolsGet)
router.route('/raffles_for_crud').get(checkTokenForBO, slot.rafflesForCrudGet)
router.route('/change_winners_status_for_crud').post(checkTokenForBO, slot.changeWinnersStatusForCrudPost)
router.route('/tombola_for_crud').get(checkTokenForBO, slot.tombolaForCrudGet)
router.route('/tombola_for_crud').post(checkTokenForBO, slot.tombolaForCrudPost)
router.route('/win_lose_for_tombola_crud').post(checkTokenForBO, slot.winLoseForTombolaCrudPost)
router.route('/support_admin_for_crud').get(checkTokenForBO, slot.supportAdminForCrudGet)
router.route('/support_admin_for_crud').post(checkTokenForBO, slot.supportAdminForCrudPost)
router.route('/languages_for_crud').get(checkTokenForBO, slot.languagesForCrudGet)
router.route('/language_for_crud').post(formidableMiddleware(), checkTokenForBO, slot.languageForCrudPost)
router.route('/language_for_crud').delete(checkTokenForBO, slot.languageForCrudToggleDelete)
router.route('/skins_for_crud').get(checkTokenForBO, slot.skinsForCrudGet)
router.route('/skin_for_crud').post(formidableMiddleware(), checkTokenForBO, slot.skinForCrudPost)
router.route('/skin_for_crud').delete(checkTokenForBO, slot.skinForCrudDelete)
router.route('/misc_settings_for_crud').get(checkTokenForBO, slot.miscSettingsForCrudGet)
router.route('/misc_settings_for_crud').post(checkTokenForBO, slot.miscSettingsForCrudPost)
router.route('/countries_for_crud').get(checkTokenForBO, slot.countriesForCrudGet)
router.route('/country_for_crud').post(formidableMiddleware(), checkTokenForBO, slot.countriesForCrudPost)
router.route('/localizations_for_crud').get(checkTokenForBO, slot.localizationsForCrudGet)
router.route('/localizations_for_crud').post(checkTokenForBO, slot.localizationsForCrudPost)
router.route('/localizations_update_for_crud').post(checkTokenForBO, slot.updateLocalizationJSONPost)
router.route('/language_default_for_crud').post(checkTokenForBO, slot.languageDefaultForCrudPost)
router.route('/legals_for_crud').get(checkTokenForBO, slot.legalsForCrudGet)
router.route('/legals_for_crud').post(checkTokenForBO, slot.legalsForCrudPost)
router.route('/playersForFront').get(checkTokenForBO, slot.playersForFrontGet)
router.route('/playerForFront').get(checkTokenForBO, slot.playerForFrontGet)
router.route('/cards_for_crud').get(checkTokenForBO, slot.cardsForFrontGet)
router.route('/cards_for_crud_chest').post(checkTokenForBO, slot.cardsChestForFrontPost)
router.route('/card_sets_for_crud').get(checkTokenForBO, slot.cardSetsForFrontGet)
router.route('/card_sets_for_crud').post(checkTokenForBO, slot.cardSetForFrontPost)
router.route('/card_set_for_crud').delete(checkTokenForBO, slot.cardSetForFrontDelete)
router.route('/card_for_crud').post(checkTokenForBO, formidableMiddleware({
  multiples: true, // req.files to be arrays of files
}), slot.cardForFrontPost)
router.route('/card_for_crud').delete(checkTokenForBO, slot.cardForFrontDelete)
router.route('/card_drop_rate_table').get(checkTokenForBO, slot.cardDropRateTableGet)
router.route('/card_drop_rate_table').post(checkTokenForBO, slot.cardDropRateTablePost)
router.route('/generate_atlas_front').get(checkTokenForBO, slot.generateAtlasGet)

export default router
