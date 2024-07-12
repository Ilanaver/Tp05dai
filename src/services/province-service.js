import ProvinceRepository from '../repositories/province-repository.js';
export default class ProvinceService{
    getAllAsync = async () => {
        const repo = new ProvinceRepository();
        const arrayProvincias= await repo.getAllAsync();
        let resArray
        if(arrayProvincias != ''){
            resArray = [arrayProvincias, 200];
        }
        else{
            resArray = ["No se encuentran provincias", 404]
        }
        return resArray;
     
    }
    getByIdAsync = async (id) =>{
        const repo = new ProvinceRepository();
        const arrayProvincias= await repo.getByIdAsync(id);
        let resArray;
        if (arrayProvincias != '') {
            
            resArray = [arrayProvincias,200];;
        } else {
            resArray = ["Provincia no encontrada",404];
        }
        return resArray;
    }
    createAsync = async (body) => {
        const repo = new ProvinceRepository();
        let resArray = repo.createAsync(body);
        return resArray;
    }
    putAsync= async (body) => 
    {
        const repo = new ProvinceRepository(); 
        let resArray = repo.putAsync(body)
        return resArray;
    }
    deleateAsync = async (id) => {
        const repo = new ProvinceRepository();
        let resArray = repo.deleateAsync(id);
        return resArray
        
    }
       
}