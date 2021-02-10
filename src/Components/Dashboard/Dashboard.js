//dependency imports
import {useState} from "react";
import Axios from "axios";

//component imports
import UnitList from "../UnitList/UnitList";
import UnitDisplay from "../UnitDisplay/UnitDisplay";

//styling import
import "./Dashboard.scss";

//image imports
import hamburger from "../../Assets/list.svg";

//constant urls for api calls
const apiURL = "https://api-staging.paritygo.com/sensors/api/thermostat/";

export default function Dashboard() {
    const storedUnits = JSON.parse(localStorage.getItem("units"));
    let unitArray;
    if(storedUnits) {
        unitArray = storedUnits.unitArr;
    } else {unitArray = null;}

    //on mobile view we can hide and show the sidebar by clicking a button
    const [sidebar, setSidebar] = useState(false);
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

    //conditional render depending on whether there are any registered units or not
    if(units){
        return (
            <div className="dashboard">
                <img src={hamburger} onClick={()=>{setSidebar(!sidebar)}}className={`sidebar__showButton sidebar__showButton--${sidebar}`} />
                <div className={`sidebar sidebar--${sidebar}`}>
                    <div className="dash__registerMore" onClick={register}>Register New Thermostat</div>
                    <UnitList units={units} key={units} selectedUnit={selectedUnit} select={select}/>
                </div>
                {selectedUnit && <UnitDisplay unit={selectedUnit} />}
            </div>
        )
    } else {
        return (
            <div className="emptyboard">
                <div className="emptyboard__message">You have no thermostats registered. Click the "Register Thermostat" button to get started.</div>
                <div className="dash__registerFirst" onClick={register}>Register Thermostat</div>
            </div>
        )
    }
}