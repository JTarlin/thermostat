//dependency imports
import {useState} from "react";
import Axios from "axios";

//component imports
import UnitList from "../UnitList/UnitList";

//constant urls for api calls
const registerURL = "https://api-staging.paritygo.com/sensors/api/thermostat/register/";

export default function Dashboard() {

    //state tracks the info of each housing unit
    const [units, setUnits] = useState(localStorage.getItem("units"));
    //state tracks currently selected housing unit/thermostat
    const [selectedUnit, setSelectedUnit] = useState(null);

    const register = ()=>{
        Axios.post(registerURL)
            .then(function (response) {
                if(units){
                    //if we have already set units then add new thermostat to registry
                    let newUnitArr = units.unitArr; //new reference to array so that state update causes re-render
                    newUnitArr.push({id: response.data.uid_hash, state: response.data.state});
                    const newUnitObj = {unitArr: newUnitArr};
                    setUnits(newUnitObj);
                    localStorage.setItem('units', JSON.stringify(newUnitObj));
                } else {
                    // we have not set units then this is the first thermostat
                    const newUnitObj = {unitArr: [{id: response.data.uid_hash, state: response.data.state}]};
                    setUnits(newUnitObj);
                    localStorage.setItem('units', JSON.stringify(newUnitObj));
                }
            })
            .catch(function (error) {
                alert(error);
            });
    }

    const select = (unit)=>{
        console.log(unit.id);
        // setSelectedUnit(unit);
    }

    if(units){
        return (
            <div className="dashboard">
                <div className="dash__register--big" onClick={register}>Register New Thermostat</div>
                <UnitList units={units.unitArr} key={units.unitArr} select={select}/>
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