import { Router } from 'express';
import ProvinceService from '../services/province-service.js'

const router = Router();
const svc = new ProvinceService();


router.get('', async(req, res) => {
    const resArray = await svc.getAllAsync();
    res.status(resArray[1]).send(resArray[0]);
});

router.get('/:id', async(req, res) => {
    
    const id = req.params.id;
    const resArray = await svc.getByIdAsync(id);
    res.status(resArray[1]).send(resArray[0]);
    
});

router.post('', async(req, res) => {
    const body = req.body;
    const resArray = await svc.createAsync(body);
    res.status(resArray[1]).send(resArray[0]);
});

router.delete('/:id', async(req, res) => {
    const id = req.params.id;
    const resArray = await svc.deleateAsync(id);
    res.status(resArray[1]).send(resArray[0]);
});

router.put('', async(req, res) => {
    const body = req.body;
    const resArray = await svc.putAsync(body);
    res.status(resArray[1]).send(resArray[0]);
});

export default router;