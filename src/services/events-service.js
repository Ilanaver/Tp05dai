import EventRepository from '../repositories/event-repository.js';

export default class EventService {
    
    async buscarEventos(params) {
        const repo = new EventRepository();
        const eventos = await repo.searchAsync(params);
        return eventos.length > 0 ? [eventos, 200] : ["No se encuentran eventos", 404];
    }

    async obtenerEventoPorId(id) {
        const repo = new EventRepository();
        const evento = await repo.getByIdAsync(id);
        return evento ? [evento, 200] : ["Evento no encontrado", 404];
    }

    async buscarInscripciones(eventId, params) {
        const repo = new EventRepository();
        const inscripciones = await repo.searchEnrollments(eventId, params);
        return inscripciones.length > 0 ? [inscripciones, 200] : ["Participante no encontrado", 404];
    }

    async crearEvento(datos) {
        const repo = new EventRepository();
        return await repo.createAsync(datos);
    }

    async actualizarEvento(datos) {
        const repo = new EventRepository();
        if (datos.id) {
            return await repo.updateAsync(datos.id, datos);
        } else {
            return ["Id missing", 404];
        }
    }

    async eliminarEvento(id) {
        const repo = new EventRepository();
        try {
            return await repo.deleteEvent(id);
        } catch (error) {
            throw error;
        }
    }

    async agregarInscripcionDeUsuario(id) {
        const repo = new EventRepository();
        return await repo.addEnrollmentOfUser(id);
    }

    async calificarInscripcion(eventId, calificacion, descripcion) {
        const repo = new EventRepository();
        const inscripcion = await repo.ratingEnrollments(eventId, calificacion, descripcion);
        return inscripcion ? [inscripcion, 200] : ["id es inexistente", 404];
    }
}
