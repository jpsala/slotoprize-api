import {Router} from 'express'
import slotRoutes from './modules/slot/slot.routes'
import portalRoutes from './modules/portal/portal.routes'


const router = Router()

router.use('/slot', slotRoutes)
router.use('/portal', portalRoutes)

export default router
