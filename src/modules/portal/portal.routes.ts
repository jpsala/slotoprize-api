import { Router } from 'express'
import * as portalController from './portal.controller'
const router = Router()

router.route('/auth').post(portalController.auth)
router.route('/auth-with-token').post(portalController.withTokenGet)
router.route('/google_login').post(portalController.googleLoginPost)
router.route('/sign_up').post(portalController.signUpPost)
export default router
