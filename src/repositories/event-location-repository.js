import pkg from 'pg'
import jwt from 'jsonwebtoken';
import {token} from '../repositories/user-repository.js';
import config from '../configs/db-config.js';
const { Client } = pkg
const client = new Client(config);
await client.connect();
export default class EventLocationRepository {
    
    getAllAsync = async () => {
        try{
        const secretKey = "ClaveSecreta3000$";
        let validacionToken = token; 
        let payloadOriginal = null;
        payloadOriginal = await jwt.verify(validacionToken,secretKey);
        if(payloadOriginal != null){
        let sql = `SELECT el.id, l.* , el.name, el.full_address, el.max_capacity, el.latitude, el.longitude, u.*
        FROM public.event_locations el inner join locations l on l.id = el.id_location inner join users u on u.id = el.id_creator_user`;
        let result = await client.query(sql)
        const eventLocation = result.rows;
        return [eventLocation,200];
        }
        else{ 
            return ["Unauthorized",401]
        }
    }catch(e){
        console.log(e)
        return ["Unauthorized",401]
    }
    }
    getByIdAsync = async (id) => {
        
        try{
            const secretKey = "ClaveSecreta3000$";
        let payloadOriginal = null;
        payloadOriginal = await jwt.verify(token,secretKey);
        let sql = `SELECT *
        FROM public.event_locations WHERE id=$1`;
        const values = [id];
        let result = await client.query(sql, values);
        const eventLocation = result.rows; 
        if(eventLocation[0].id_creator_user == payloadOriginal.id){
            if(eventLocation != null){
                return [eventLocation,200];
            }else{
                return ["not found",404];
            }
        }
        else{
            return ["Unauthorized",401];
        }
        }catch(e){
            return ["Error",404];
            console.log(e);
        }
        
    }
    createAsync = async (body) => {
        try {
            const secretKey = "ClaveSecreta3000$";
            let validacionToken = token; 
            let payloadOriginal = null;
            payloadOriginal = await jwt.verify(validacionToken,secretKey);
            if(payloadOriginal != null){
                const sql1 = `SELECT id FROM public.event_locations ORDER BY id DESC limit 1;`;
                const result1 = await client.query(sql1);
                let obj = result1.rows[0];
                let id = obj.id + 1;
                let id_location = parseInt(body.id_location);
                let name = body.name;
                let full_address = body.full_address;
                let max_capacity = parseInt(body.max_capacity);
                let latitude = parseFloat(body.latitude);
                let longitude = parseFloat(body.longitude);
                if(name.length > 3 && full_address.length > 3){
                    if(max_capacity > 0){
                        const sql2 = `
                        select id from locations where id = $1`;
                        const values2 = [id];
                        const result2 = await client.query(sql2, values2);
                        if(result2 != null){
                            const sql = `
                            INSERT INTO event_locations
                            (id,id_location,name,full_address,max_capacity,latitude,longitude,id_creator_user)
                            VALUES
                            ($1,$2,$3,$4,$5,$6,$7,$8)`;
                            const values = [id, id_location,name,full_address,max_capacity,latitude,longitude,payloadOriginal.id];
                            const result = await client.query(sql, values);
                            return ["created", 200]; 
                        }
                        return ["El id_location es inexistente.",400]
                    }
                    else{
                        return ["El max_capacity es el número 0 (cero) o negativo.", 400];
                    }
                }
                else{
                    return ["El nombre  (name) o la dirección (full_address) están vacíos o tienen menos de tres (3) letras", 400];
                }
            }
            else{
                return ["Unauthorized", 401];
            }
        } 
        catch (error) {
          
            console.log(error);
            return ["Unauthorized", 401];
        }
    };
    putAsync = async (body) => {
        try {
            const secretKey = "ClaveSecreta3000$";
            let validacionToken = token; 
            let payloadOriginal = null;
            payloadOriginal = await jwt.verify(validacionToken,secretKey);
            if(payloadOriginal != null){
                let id = parseInt(body.id);
                let id_location = parseInt(body.id_location);
                let name = body.name;
                let full_address = body.full_address;
                let max_capacity = parseInt(body.max_capacity);
                let latitude = parseFloat(body.latitude);
                let longitude = parseFloat(body.longitude);
                if(name.length > 3 && full_address.length > 3){
                    if(max_capacity > 0){
                        const sql2 = `
                        select id from locations where id = $1`;
                        const values2 = [id];
                        const result2 = await client.query(sql2, values2);
                        if(result2 != null){
                            const sql = `
                            UPDATE event_locations
                            SET id_location = $2, name = $3,full_address = $4, max_capacity = $5, latitude = $6, longitude= $7 
                            WHERE id = $1`;
                            const values = [id, id_location,name,full_address,max_capacity,latitude,longitude];
                            const result = await client.query(sql, values);
                            return ["update", 200]; 
                        }
                        return ["El id_location es inexistente.",400]
                    }
                    else{
                        return ["El max_capacity es el número 0 (cero) o negativo.", 400];
                    }
                }
                else{
                    return ["El nombre  (name) o la dirección (full_address) están vacíos o tienen menos de tres (3) letras", 400];
                }
            }
            else{
                return ["Unauthorized", 401];
            }
        } 
        catch (error) {
          
            console.log(error);
            return ["Unauthorized", 401];
        }
    };
    deleteAsync = async (id) => {
        let resArray;
        try {
        const valuesID = [parseInt(id)];
        const secretKey = "ClaveSecreta3000$";
            let validacionToken = token; 
            let payloadOriginal = null;
            payloadOriginal = await jwt.verify(validacionToken,secretKey);
            let sql = `SELECT *
            FROM public.event_locations WHERE id=$1`;
            const values = [id];
            let result = await client.query(sql, values);
            
            const eventLocation = result.rows;        
            if(eventLocation[0].id_creator_user == payloadOriginal.id){
            if(payloadOriginal != null){
            let sql3 = `UPDATE events
            SET id_event_location = null
            WHERE id_event_location = $1`;
            let result3 = await client.query(sql3, valuesID);
    
          let sql2 = `DELETE FROM event_locations WHERE id=$1`;
          let result = await client.query(sql2, valuesID);
          resArray = ["Location de evento eliminada correctamente", 200];
            }
          else{
            resArray = ["Unauthorized", 400];
        }}
        else{
            resArray = ["Unauthorized", 400];
        }
        } catch (error) {
          resArray = ["Location de evento no encontrada", 404];
          console.log(error);
        
      };
      return resArray;
    }

}