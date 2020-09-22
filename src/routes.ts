import {Router} from 'express'
import slotRoutes from './modules/slot/slot.routes'


const router = Router()

router.use('/slot', slotRoutes)

export default router
