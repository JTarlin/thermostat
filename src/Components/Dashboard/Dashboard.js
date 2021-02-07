//dependency imports
import {useState} from "react";
import Axios from "axios";

//constant urls for api calls
const registerURL = "https://api-staging.paritygo.com/sensors/api/thermostat/register/";

export default function Dashboard() {

    //state tracks the info of each housing unit
    const [units, setUnits] = useState(localStorage.getItem("units"));

    const register = ()=>{
        Axios.post(registerURL)
            .then(function (response) {
                if(units){
                    //if we have already set units then add new thermostat to registry
                    console.log("running the units branch of register")
                    let unitObj = units;
                    console.log(unitObj);
                    unitObj.unitArr.push({id: response.data.uid_hash, state: response.data.state});
                    setUnits(unitObj);
                    localStorage.setItem('units', JSON.stringify(unitObj));
                } else {
                    // we have not set units then this is the first thermostat
                    console.log("running the no units branch of register");
                    const newUnitObj = {unitArr: [{id: response.data.uid_hash, state: response.data.state}]};
                    setUnits(newUnitObj);
                    localStorage.setItem('units', JSON.stringify(newUnitObj));
                }
            })
            .catch(function (error) {
                alert(error);
            });
    }

    if(units){
        return (
            <div className="dashboard">
                <div className="units-list"></div>
                <div className="dash__register--big" onClick={register}>Register New Thermostat</div>
            </div>
        )
    } else {
        return (
            <div className="dashboard">
                You have no thermostats registered
                <div className="dash__register--small" onClick={register}>Register a Thermostat</div>
            </div>
        )
    }
}