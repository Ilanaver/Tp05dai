import { Router } from 'express';
import EventService from '../services/events-service.js';

const router = Router();
const eventService = new EventService();

router.get('/', async (req, res) => {
    const queryParams = req.query;
    const response = await eventService.buscarEventos(queryParams);
    res.status(response[1]).send(response[0]);
});

router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    const response = await eventService.obtenerEventoPorId(eventId);
    res.status(response[1]).send(response[0]);
});

router.get('/:id/inscripcion', async (req, res) => {
    const eventId = req.params.id;
    const queryParams = req.query;
    const response = await eventService.buscarInscripciones(eventId, queryParams);
    res.status(response[1]).send(response[0]);
});

router.post('/:id/inscripcion', async (req, res) => {
    const eventId = req.params.id;
    const response = await eventService.agregarInscripcionDeUsuario(eventId);
    res.status(response[1]).send(response[0]);
});

router.post('/', async (req, res) => {
    const eventData = req.body;
    const response = await eventService.crearEvento(eventData);
    res.status(response[1]).send(response[0]);
});

router.put('/', async (req, res) => {
    try {
        const eventData = req.body;
        const response = await eventService.actualizarEvento(eventData);
        res.status(response[1]).send(response[0]);
    } catch (error) {
        console.error("Error en el controlador de eventos:", error);
        res.status(500).send("Error interno del servidor");
    }
});

router.delete('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const result = await eventService.eliminarEvento(eventId);
        if (result === 0) {
            return res.status(404).json({ error: "Evento no encontrado o no pertenece al usuario autenticado" });
        }
        res.status(200).json({ message: "Evento eliminado exitosamente" });
    } catch (error) {
        console.error("Error eliminando el evento:", error);
        res.status(500).send("Error interno del servidor");
    }
});

router.patch('/:id/inscripcion/:rating', async (req, res) => {
    const observaciones = req.body.observations;
    const eventId = req.params.id;
    const rating = req.params.rating;
    const response = await eventService.calificarInscripcion(eventId, rating, observaciones);
    res.status(response[1]).send(response[0]);
});

export default router;
