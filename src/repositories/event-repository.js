import pkg from "pg";
const { Client } = pkg;
import config from "../configs/db-config.js";
import jwt from "jsonwebtoken";
import { token } from "../repositories/user-repository.js";

export default class EventRepository {
  async searchAsync(params) {
    const client = new Client(config);
    await client.connect();

    try {
      let query = `SELECT e.*, ec.name AS category, t.name AS tag FROM events e 
                        INNER JOIN event_categories ec ON e.id_event_category = ec.id 
                        INNER JOIN event_tags et ON e.id = et.id_event 
                        INNER JOIN tags t ON t.id = et.id_tag`;
      const values = [];
      const conditions = [];

      if (params.name) {
        conditions.push(`e.name ILIKE $${values.length + 1}`);
        values.push(`%${params.name}%`);
      }

      if (params.category) {
        conditions.push(`ec.name ILIKE $${values.length + 1}`);
        values.push(`%${params.category}%`);
      }

      if (params.startdate) {
        conditions.push(`DATE(e.start_date) = $${values.length + 1}`);
        values.push(params.startdate);
      }
      if (params.tag) {
        conditions.push(`t.name ILIKE $${values.length + 1}`);
        values.push(`%${params.tag}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
      query += ` ORDER BY e.id ASC`;

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error(error);
    } finally {
      await client.end();
    }
  }

  async addEnrollmentOfUser(id) {
    const client = new Client(config);
    await client.connect();
    const secretKey = "ClaveSecreta3000$";
    let validToken = token;
    let decodedPayload = null;
    let responseArray;
    try {
      decodedPayload = await jwt.verify(validToken, secretKey);
      if (decodedPayload) {
        let maxAssistanceQuery = `SELECT max_assistance FROM events WHERE id = $1`;
        let currentAssistanceQuery = `SELECT COUNT(id_user) AS assistance FROM event_enrollments WHERE id_event = $1`;
        let currentTimeQuery = `SELECT CAST(EXTRACT(epoch FROM CURRENT_TIMESTAMP) AS INTEGER) AS datenum`;
        let eventStartDateQuery = `SELECT CAST(EXTRACT(epoch FROM start_date) AS INTEGER) AS datenum FROM events WHERE id = $1`;
        let enrollmentStatusQuery = `SELECT enabled_for_enrollment FROM events WHERE id = $1`;
        let enrollmentCheckQuery = `SELECT id_event FROM event_enrollments WHERE id_event = $1`;

        const values = [id];
        const maxAssistanceResult = await client.query(maxAssistanceQuery, values);
        const currentAssistanceResult = await client.query(currentAssistanceQuery, values);
        const currentTimeResult = await client.query(currentTimeQuery);
        const eventStartDateResult = await client.query(eventStartDateQuery, values);
        const enrollmentStatusResult = await client.query(enrollmentStatusQuery, values);
        const enrollmentCheckResult = await client.query(enrollmentCheckQuery, values);

        if (
          maxAssistanceResult.rows[0].max_assistance - currentAssistanceResult.rows[0].assistance >= 0 &&
          currentTimeResult.rows[0].datenum - eventStartDateResult.rows[0].datenum <= 0 &&
          enrollmentStatusResult.rows[0].enabled_for_enrollment &&
          !enrollmentCheckResult.oid
        ) {
          let insertEnrollmentQuery = `INSERT INTO event_enrollments (id_event, id_user, description, registration_date_time, attended, observations, rating) 
                                       VALUES ($1, $2, 'Registered for ' || (SELECT name FROM events WHERE id = $1), NOW()::timestamp, false, '', 0)`;
          const enrollmentValues = [id, decodedPayload.id];
          await client.query(insertEnrollmentQuery, enrollmentValues);
          responseArray = ["Created", 201];
        } else {
          responseArray = ["Bad Request", 400];
        }
      } else {
        responseArray = ["Unauthorized", 401];
      }
    } catch (error) {
      responseArray = ["Not Found", 404];
      console.error(error);
    } finally {
      await client.end();
    }
    return responseArray;
  }

  async getByIdAsync(id) {
    const client = new Client(config);
    await client.connect();

    try {
      let query = `
                SELECT 
                    e.id, e.name, e.description, e.id_event_category, 
                    e.id_event_location, e.start_date, e.duration_in_minutes, 
                    e.price, e.enabled_for_enrollment, e.max_assistance, 
                    e.id_creator_user,
                    el.id AS event_location_id, el.id_location, el.name AS location_name, 
                    el.full_address, el.max_capacity, el.latitude AS location_latitude, 
                    el.longitude AS location_longitude,
                    l.id AS location_id, l.name AS location_name, l.id_province, 
                    l.latitude AS province_latitude, l.longitude AS province_longitude,
                    p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                    u.id AS creator_user_id, u.first_name AS creator_first_name, 
                    u.last_name AS creator_last_name, u.username AS creator_username, 
                    u.password AS creator_password,
                    ec.id AS event_category_id, ec.name AS event_category_name, 
                    ec.display_order AS event_category_display_order
                FROM 
                    events e
                INNER JOIN 
                    event_locations el ON e.id_event_location = el.id
                INNER JOIN 
                    locations l ON el.id_location = l.id
                INNER JOIN 
                    provinces p ON l.id_province = p.id
                INNER JOIN 
                    users u ON e.id_creator_user = u.id
                INNER JOIN 
                    event_categories ec ON e.id_event_category = ec.id
                WHERE 
                    e.id = $1`;

      const values = [id];
      const result = await client.query(query, values);
      const eventData = result.rows[0];

      if (!eventData) {
        return null;
      }

      const event = {
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        id_event_category: eventData.id_event_category,
        id_event_location: eventData.id_event_location,
        start_date: eventData.start_date,
        duration_in_minutes: eventData.duration_in_minutes,
        price: eventData.price,
        enabled_for_enrollment: eventData.enabled_for_enrollment,
        max_assistance: eventData.max_assistance,
        creator_user: {
          id: eventData.creator_user_id,
          first_name: eventData.creator_first_name,
          last_name: eventData.creator_last_name,
          username: eventData.creator_username,
          password: eventData.creator_password,
        },
        event_location: {
          id: eventData.event_location_id,
          id_location: eventData.id_location,
          name: eventData.location_name,
          full_address: eventData.full_address,
          max_capacity: eventData.max_capacity,
          latitude: eventData.location_latitude,
          longitude: eventData.location_longitude,
          location: {
            id: eventData.location_id,
            name: eventData.location_name,
            id_province: eventData.id_province,
            latitude: eventData.province_latitude,
            longitude: eventData.province_longitude,
            province: {
              id: eventData.province_id,
              name: eventData.province_name,
              full_name: eventData.province_full_name,
            },
          },
        },
        event_category: {
          id: eventData.event_category_id,
          name: eventData.event_category_name,
          display_order: eventData.event_category_display_order,
        },
      };

      return event;
    } finally {
      await client.end();
    }
  }

  searchEnrollments = async (eventId, params) => {
    const client = new Client(config);
    await client.connect();

    try {
      let sql = `
                SELECT 
                    e.id, e.id_event, e.id_user, e.description, 
                    e.registration_date_time, e.attended, e.observations, e.rating,
                    u.id AS user_id, u.first_name, u.last_name, u.username, u.password
                FROM 
                    event_enrollments AS e
                INNER JOIN 
                    users AS u ON e.id_user = u.id
                INNER JOIN 
                    events AS ev ON e.id_event = ev.id
                WHERE 
                    ev.id = $1`;

      const values = [eventId];

      if (params != null) {
        if (params.first_name !== undefined) {
          sql += ` AND u.first_name ILIKE $${values.length + 1}`;
          values.push(`%${params.first_name}%`);
        }
        if (params.username !== undefined) {
          sql += ` AND u.username ILIKE $${values.length + 1}`;
          values.push(`%${params.username}%`);
        }
        if (params.attended !== undefined) {
          sql += ` AND e.attended = $${values.length + 1}`;
          values.push(params.attended);
        }
        if (params.rating !== undefined) {
          sql += ` AND e.rating >= $${values.length + 1}`;
          values.push(params.rating);
        }
      }
    } catch (e) {
      console.log(e);
    }
    createAsync = async (body) => {
      const client = new Client(config);
      await client.connect();
      try {
        const secretKey = "ClaveSecreta3000$";
        let validacionToken = token;
        let payloadOriginal = null;
        payloadOriginal = await jwt.verify(validacionToken, secretKey);
        if (payloadOriginal != null) {
          const {
            name,
            description,
            id_event_category,
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enabled_for_enrollment,
            max_assistance,
            id_creator_user,
          } = body;

          const collection = enrollments.map((enrollment) => ({
            id: enrollment.id,
            id_event: enrollment.id_event,
            id_user: enrollment.id_user,
            user: {
              id: enrollment.user_id,
              first_name: enrollment.first_name,
              last_name: enrollment.last_name,
              username: enrollment.username,
              password: enrollment.password,
            },
            description: enrollment.description,
            registration_date_time: enrollment.registration_date_time,
            attended: enrollment.attended,
            observations: enrollment.observations,
            rating: enrollment.rating,
          }));

          const pagination = {
            limit: 0,
            offset: 0,
            nextPage: "",
            total: collection.length,
          };

          return { collection, pagination };
        }
        console.log(e);
      } finally {
        await client.end();
      }
    };

    createAsync = async (body) => {
      const client = new Client(config);
      await client.connect();
      try {
        const {
          name,
          description,
          id_event_category,
          id_event_location,
          start_date,
          duration_in_minutes,
          price,
          enabled_for_enrollment,
          max_assistance,
          id_creator_user,
        } = body;

        if (
          !name ||
          !description ||
          name.length < 3 ||
          description.length < 3
        ) {
          return ["Name and description must have at least 3 characters", 400];
        }

        if (max_assistance <= 0) {
          return ["max_assistance must be greater than 0", 400];
        }
        const sql10 = `SELECT id FROM public.events ORDER BY id DESC limit 1;`;
        const result10 = await client.query(sql10);
        let obj1 = result1.rows[0];
        const id1 = obj.id + 1;

        const max_capacity = await this.getMaxCapacity(id_event_location);

        if (max_assistance > max_capacity) {
          return [
            `max_assistance (${max_assistance}) cannot be greater than max_capacity (${max_capacity})`,
            400,
          ];
        }

        if (price < 0 || duration_in_minutes < 0) {
          return [
            "Price and duration_in_minutes must be greater than or equal to 0",
            400,
          ];
        }

        const sql1 = `SELECT id FROM public.users ORDER BY id DESC limit 1;`;
        const result1 = await client.query(sql1);
        let obj = result1.rows[0];
        const id = obj.id + 1;

        const query = `
                INSERT INTO events (name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user,id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)`;

        const values = [
          name,
          description,
          id_event_category,
          id_event_location,
          start_date,
          duration_in_minutes,
          price,
          enabled_for_enrollment,
          max_assistance,
          id_creator_user,
          id,
        ];
        const result = await client.query(query, values);

        return ["created", 201];
      } catch (error) {
        console.error("Error creating event:", error);
        return [error.message, 500];
      } finally {
        await client.end();
        return ["created", 201];
        /*}else{
            return ["Unauthorized",401]
        }
        } catch (error) {
            console.error("Error creating event:", error);
            return [error.message, 500];
        } finally {
            await client.end();
        }*/
      }
    };

    getMaxCapacity = async (id_event_location) => {
      const client = new Client(config);
      await client.connect();
      try {
        const query = `
                SELECT max_capacity
                FROM event_locations
                WHERE id = $1`;

        const values = [id_event_location];
        const result = await client.query(query, values);

        if (result.rows.length > 0) {
          return result.rows[0].max_capacity;
        } else {
          throw new Error(
            `Event location with ID ${id_event_location} not found`
          );
        }
      } catch (error) {
        console.error("Error getting max capacity:", error);
        throw error;
      } finally {
        await client.end();
      }
    };

    updateAsync = async (id, body) => {
      const client = new Client(config);
      await client.connect();
      try {
        const {
          name,
          description,
          id_event_category,
          id_event_location,
          start_date,
          duration_in_minutes,
          price,
          enabled_for_enrollment,
          max_assistance,
          id_creator_user,
        } = body;
        updateAsync = async (id, body) => {
          const client = new Client(config);
          await client.connect();
          try {
            const secretKey = "ClaveSecreta3000$";
            let validacionToken = token;
            let payloadOriginal = null;
            payloadOriginal = await jwt.verify(validacionToken, secretKey);
            if (payloadOriginal != null) {
              const {
                name,
                description,
                id_event_category,
                id_event_location,
                start_date,
                duration_in_minutes,
                price,
                enabled_for_enrollment,
                max_assistance,
                id_creator_user,
              } = body;

              if (
                !name ||
                !description ||
                name.length < 3 ||
                description.length < 3
              ) {
                return [
                  "Name and description must have at least 3 characters",
                  400,
                ];
              }

              if (max_assistance <= 0) {
                return ["max_assistance must be greater than 0", 400];
              }

              const max_capacity = await this.getMaxCapacity(id_event_location);

              if (max_assistance > max_capacity) {
                return [
                  `max_assistance (${max_assistance}) cannot be greater than max_capacity (${max_capacity})`,
                  400,
                ];
              }

              if (price < 0 || duration_in_minutes < 0) {
                return [
                  "Price and duration_in_minutes must be greater than or equal to 0",
                  400,
                ];
              }

              const query = `
                UPDATE events
                SET name = $1,
                    description = $2,
                    id_event_category = $3,
                    id_event_location = $4,
                    start_date = $5,
                    duration_in_minutes = $6,
                    price = $7,
                    enabled_for_enrollment = $8,
                    max_assistance = $9,
                    id_creator_user = $10
                WHERE id = $11`;

              const values = [
                name,
                description,
                id_event_category,
                id_event_location,
                start_date,
                duration_in_minutes,
                price,
                enabled_for_enrollment,
                max_assistance,
                id_creator_user,
                id,
              ];
              const result = await client.query(query, values);

              if (result.rowCount === 0) {
                throw new Error(`Event with ID ${id} not found`);
              }

              return ["updated", 200];
            } else {
              return ["Unauthorized", 401];
            }
          } catch (error) {
            console.error("Error updating event:", error);
            return [error.message, 400];
          } finally {
            await client.end();
          }
        };
      } catch (e) {
        console.log(e);
      }

      deleteEvent = async (id) => {
        const client = new Client(config);
        await client.connect();

        try {
          const secretKey = "ClaveSecreta3000$";
          let validacionToken = token;
          let payloadOriginal = null;
          payloadOriginal = await jwt.verify(validacionToken, secretKey);
          if (payloadOriginal != null) {
            let sql2 = `SELECT * from events WHERE id=$1`;
            const values = [id];
            let result1 = await client.query(sql2, values);

            const deleteQuery = `
                DELETE FROM events
                WHERE id = $1`;

            const deleteValues = [id];

            if (Object.keys(result1).length !== 0) {
              const result = await client.query(deleteQuery, deleteValues);
              return { message: "Event deleted successfully", status: 200 };
            } else {
              throw { message: `Event with ID ${id} not found`, status: 404 };
            }
          } else {
            return ["Unauthorized", 401];
          }
        } catch (error) {
          console.error("Error deleting event:", error);
          throw {
            message: error.message || "Internal server error",
            status: error.status || 500,
          };
        } finally {
          await client.end();
        }
      };
    };

    ratingEnrollments = async (eventId, eventRating, bodyDesc) => {
      const client = new Client(config);
      await client.connect();

      try {
        let sql = `
                INSERT INTO event_enrollments (id_event, id_user, description, registration_date_time, attended, observations, rating) 
                VALUES ($1, 1, 'Registered for ' || (SELECT name FROM events WHERE events.id = $1), NOW()::timestamp, false, $2, $3)`;
        const values = [eventId, bodyDesc, eventRating];

        const result = await client.query(sql, values);
      } finally {
        await client.end();
      }
    };
  };
}
