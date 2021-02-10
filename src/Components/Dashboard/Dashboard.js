//dependency imports
import {useState} from "react";
import Axios from "axios";

//component imports
import UnitList from "../UnitList/UnitList";
import UnitDisplay from "../UnitDisplay/UnitDisplay";

//styling import
import "./Dashboard.scss";

//constant urls for api calls
const apiURL = "https://api-staging.paritygo.com/sensors/api/thermostat/";

export default function Dashboard() {

    console.log("dashboard re-render");

    const storedUnits = JSON.parse(localStorage.getItem("units"));
    let unitArray;
    if(storedUnits) {
        unitArray = storedUnits.unitArr;
    } else {unitArray = null;}

    //state tracks the info of each housing unit, gets info from local browser storage
    const [units, setUnits] = useState(unitArray);
    //state tracks currently selected housing unit/thermostat
    const [selectedUnit, setSelectedUnit] = useState();
    //we want to automatically have one unit selected if there are units
    if(!selectedUnit && units) {
        //resetting selected 
        setSelectedUnit(units[0]);
    }

    //the function called when registering a new thermostat unit
    const register = ()=>{
        Axios.post(apiURL+"register/")
            .then(function (response) {
                if(units){
                    //if we have already set units then add new thermostat to registry
                    const newID = response.data.uid_hash;
                    let newUnitArr = units; //new reference to array so that state update causes re-render
                    let newNameNum = units.length+1;
                    console.log("when registering a new unit, the units array is", units);
                    newUnitArr.push({id: newID, name: "Unit "+(newNameNum)}); //all the dashboard needs to know is the uid hash
                    setUnits(newUnitArr);
                    setSelectedUnit({id: newID, name: "Unit "+(newNameNum)});
                    localStorage.setItem('units', JSON.stringify({unitArr: newUnitArr}));
                    //update the advanced info in storage
                    let infoData = JSON.parse(localStorage.getItem('unitInfo'));
                    infoData[newID]={state:"off", setTemp:25}; //default values
                    localStorage.setItem('unitInfo', JSON.stringify(infoData));
                } else {
                    // we have not set units then this is the first thermostat
                    const newID = response.data.uid_hash;
                    setUnits([{id: newID, name: "Unit 1"}]); //units is simply an array of thermostat unit ids held in state
                    setSelectedUnit({id: newID, name: "Unit 1"});
                    localStorage.setItem('units', JSON.stringify({unitArr: [{id: newID, name: "Unit 1"}]}));
                    const newUnitObj = {[newID]: {state:"off", setTemp:25}}; //we also store more advanced data in localstorage
                    localStorage.setItem('unitInfo', JSON.stringify(newUnitObj));
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
    const toggleUnitState = (unitToChange, newState)=>{
        console.log(unitToChange.setTemp + "SHARK :)");
        let modifiedUnit = {id: unitToChange.id, state: newState, setTemp: unitToChange.setTemp}; //create new object to store modified unit
        let modifiedUnitArray = units.unitArr;
        for(let i=0; i<modifiedUnitArray.length;i++) {
            if(modifiedUnitArray[i].id === unitToChange.id) {
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
        Axios.patch(apiURL+unitToChange.id+"/", 
            {state: newState}
        )
    }

    //conditional render depending on whether there are any registered units or not
    if(units){
        return (
            <div className="dashboard">
                <div className="sidebar">

                <div className="dash__registerMore" onClick={register}>Register New Thermostat</div>
                <UnitList units={units} key={units} select={select}/>
                </div>
                {selectedUnit && <UnitDisplay unit={selectedUnit} />}
            </div>
        )
    } else {
        return (
            <div className="dashboard">
                You have no thermostats registered
                <div className="dash__registerFirst" onClick={register}>Register a Thermostat</div>
            </div>
        )
    }
}