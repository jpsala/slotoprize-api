import slotRoutes from './modules/slot/slot.routes'
import {Router} from 'express'


const router = Router()

router.use('/slot', slotRoutes)

export default router
