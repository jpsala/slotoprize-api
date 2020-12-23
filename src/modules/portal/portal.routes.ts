import { Router } from 'express'
import * as portalController from './portal.controller'
const router = Router()

router.route('/auth').post(portalController.auth)
router.route('/auth-with-token').post(portalController.withTokenGet)

export default router
