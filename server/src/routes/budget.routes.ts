import { Router } from 'express'
import budgetController from '../controllers/budget.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', budgetController.getAll)
router.post('/', budgetController.create)
router.put('/:id', budgetController.update)
router.delete('/:id', budgetController.delete)

export default router
