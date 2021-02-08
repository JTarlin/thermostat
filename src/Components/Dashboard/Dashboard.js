//dependency imports
import {useState} from "react";
import Axios from "axios";

//component imports
import UnitList from "../UnitList/UnitList";
import UnitDisplay from "../UnitDisplay/UnitDisplay";

//constant urls for api calls
const apiURL = "https://api-staging.paritygo.com/sensors/api/thermostat/";

export default function Dashboard() {

    //state tracks the info of each housing unit, gets info from local browser storage
    const [units, setUnits] = useState(JSON.parse(localStorage.getItem("units")));
    //state tracks currently selected housing unit/thermostat
    const [selectedUnit, setSelectedUnit] = useState(null);
    //we want to automatically have one unit selected if there are units
    if(units && !selectedUnit) {
        setSelectedUnit(units.unitArr[0]);
    }

    //the function called when registering a new thermostat unit
    const register = ()=>{
        Axios.post(apiURL+"register/")
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

    //function called when a unit is selected off the sidebar
    const select = (unit)=>{
        setSelectedUnit(unit);
    }

    //toggle a unit on or off, heat or cool, auto, autoheat, autocool, standby, etc
    const toggleUnitState = (selectedUnit, newState)=>{
        let modifiedUnit = {id: selectedUnit.id, state: newState}; //create new object to store modified unit
        let modifiedUnitArray = units.unitArr;
        for(let i=0; i<modifiedUnitArray.length;i++) {
            if(modifiedUnitArray[i].id === selectedUnit.id) {
                modifiedUnitArray[i]=modifiedUnit;
                break;
            }
        }
        //set our state to reflect the new unit mode
        setSelectedUnit(modifiedUnit);
        setUnits({unitArr: modifiedUnitArray});
        //set the local stored values to reflect the new unit mode
        localStorage.setItem('units', JSON.stringify({unitArr: modifiedUnitArray}));
        //update the unit mode on the backend
        Axios.patch(apiURL+selectedUnit.id+"/", 
            {state: newState}
        )
    }

    //conditional render depending on whether there are any registered units or not
    if(units){
        return (
            <div className="dashboard">
                <div className="dash__register--big" onClick={register}>Register New Thermostat</div>
                <UnitList units={units.unitArr} key={units.unitArr} select={select}/>
                {selectedUnit && <UnitDisplay unit={selectedUnit} toggleUnitState={toggleUnitState} />}
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