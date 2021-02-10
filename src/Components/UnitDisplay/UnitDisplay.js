//dependency imports
import Axios from "axios";
import {useEffect, useState} from "react";

//styling imports
import "./UnitDisplay.scss";

//api url for sensors
const sensorURL = "http://api-staging.paritygo.com/sensors/api/sensors/";
const thermostatURL = "https://api-staging.paritygo.com/sensors/api/thermostat/";

export default function UnitDisplay(props) {
    const unitID = props.unit.id;
    const unitName = props.unit.name;
    //the unit being displayed is held in state
    const [currentUnit, setCurrentUnit] = useState({id: unitID, desiredTemp: 25, state: "off"});
    const [desiredTemp, setDesiredTemp] = useState(25);
    //we will often want to save the current unit's state to local storage to persist data
    //input state of type {id: string, state: string, desiredTemp: number}
    const storeUnitState = (unitState)=>{
        let storageSnapshot = JSON.parse(localStorage.getItem("unitInfo"));
        if(storageSnapshot){
            //store the state and desiredTemp values into the storage snapshot
            storageSnapshot[unitState.id] = {state: unitState.state, setTemp: unitState.desiredTemp};
        }
        // return the storageSnapshot to localstorage
        localStorage.setItem('unitInfo', JSON.stringify(storageSnapshot));
    }

    //use state to hold the responses from api calls
    const [tempData, setTempData] = useState(null);
    const [outdoorData, setOutdoorData] = useState(null);
    const [currentTemp, setCurrentTemp] = useState(null);
    const [currentOutdoor, setCurrentOutdoor] = useState(null);
    //track data for individual units
    const [activeTracker, setActiveTracker] = useState(null); //tracks sensor data on indoor and outdoor temp

    //gets the time that it is right now (from system time)
    const getCurrentTimestamp = ()=>{
        const d = new Date();
        const timestamp = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+"T"+d.getHours()+":"+d.getMinutes()
        return timestamp;
    }

    //gets the time from 20 minutes ago
    const getPastTimestamp = (minsAgo)=>{
        const now = new Date();
        const currentTime = now.getTime();
        const oldTime = currentTime-minsAgo*60*1000; //twenty minutes prior
        const d = new Date(oldTime);
        const timestamp = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+"T"+d.getHours()+":"+d.getMinutes();
        return timestamp;
    }

    //uses current and past time to find 3-4 data points on a given sensor
    const getData = (sensorSlug, timeSpan)=>{
        const getString = sensorURL+sensorSlug+"/?begin="+getPastTimestamp(timeSpan)+"&end="+getCurrentTimestamp();
        Axios.get(getString) //use data destructuring to get data from the promise object
            .then(function(response){
                const pastPoints = response.data.data_points;
                let measureSum = 0;
                const nPoints = pastPoints.length;
                //average measurements to receive "current reading"
                for(let i=0; i<nPoints; i++) {
                    measureSum+=Number(pastPoints[i].value);
                }
                const currentReading = measureSum / nPoints;
                if(sensorSlug==="temperature-1"){
                    setTempData(pastPoints);
                    setCurrentTemp(currentReading);
                } else if(sensorSlug==="outdoor-1"){
                    setOutdoorData(pastPoints);
                    setCurrentOutdoor(currentReading);
                }
            })
            .catch(function(error){
                alert(error)
            });
    }

    const toggleActive = ()=>{
        if(currentUnit.state==="off") {
            //if we were turned off, set mode to auto by default (determine which auto type in the autocheck fn)
            autoCheck(unitID, currentUnit.desiredTemp);
        }
        else {
            setCurrentUnit({...currentUnit, state: "off"});
            storeUnitState({id: currentUnit.id, desiredTemp: currentUnit.desiredTemp, state: "off"});
        }
    }

    const autoCheck = (id, setTemp)=>{
        setDesiredTemp(setTemp);
        // if its hot, cool
        if(currentTemp>setTemp){
            //we won't cool if it's less than 0 C outside
            if(currentOutdoor>0){
                setCurrentUnit({id: id, desiredTemp:setTemp, state: "auto_cool"});
                storeUnitState({id: id, state: "auto_cool", desiredTemp: setTemp});
                //update the unit mode on the backend
                Axios.patch(thermostatURL+id+"/", 
                    {state: "auto_cool"}
                );
            } else {
                setCurrentUnit({id: id, desiredTemp:setTemp, state: "Auto_standby"});
                storeUnitState({id: id, state: "Auto_standby", desiredTemp: setTemp});
                //update the unit mode on the backend
                Axios.patch(thermostatURL+id+"/", 
                    {state: "Auto_standby"}
                );
            }
        } else if (currentTemp<setTemp){ //if its cold, heat
            setCurrentUnit({id: id, desiredTemp:setTemp, state: "auto_heat"});
            storeUnitState({id: id, state: "auto_heat", desiredTemp: setTemp});
            //update the unit mode on the backend
            Axios.patch(thermostatURL+id+"/", 
                {state: "auto_heat"}
            );
        } else { //if its exactly what we want, stand by
            setCurrentUnit({id: id, desiredTemp:setTemp, state: "Auto_standby"});
            storeUnitState({id: id, state: "Auto_standby", desiredTemp: setTemp});
            //update the unit mode on the backend
            Axios.patch(thermostatURL+id+"/", 
                {state: "Auto_standby"}
            );
        }
    }

    const setTemperature = (amount)=>{
        // let modifiedSetTemp = currentUnit.desiredTemp+amount;
        let modifiedSetTemp = desiredTemp+amount;
        //because we only set desired temp in auto mode
        autoCheck(unitID, modifiedSetTemp);
    }

    //when a new unit is loaded reset the data grabber and ensure the correct data is held in state
    useEffect(()=> {
        //on new unit clear the data gathering of the old unit
        if(activeTracker) {clearTimeout(activeTracker)}; //if there is an active tracker when we switch units, clear it
        //grab a first data point for each measurement
        getData("temperature-1", 15);
        getData("outdoor-1", 15);
        //get data from localstorage 
        const unitInfo = JSON.parse(localStorage.getItem("unitInfo"));

        //if we switch to a new unit, we load that unit's data from storage if any

        if(unitInfo && unitInfo[unitID] && unitInfo[unitID].state && unitInfo[unitID].setTemp){
            //if there is data about this unit stored locally, retrieve it!
            let storedUnitData = {id: unitID, state: unitInfo[unitID].state, desiredTemp: unitInfo[unitID].setTemp};
            let tempObject = storedUnitData;
            setCurrentUnit(tempObject);
        } else {
            //there was no stored data, setting current unit to default settings
            storeUnitState({id: unitID, desiredTemp: 25, state: "off"});
            setCurrentUnit({id: unitID, desiredTemp: 25, state: "off"});
        }
        
        //set the desired temp
        if(unitInfo){
            if(unitInfo[unitID]){
                setDesiredTemp(unitInfo[unitID].setTemp);
            }
        }

        //run autoCheck on new display load to ensure it updates properly for changed temperatures
        if(currentUnit.id===unitID && currentUnit.state.includes("u", 1)){ //checks if we're in an auto mode
            autoCheck(unitID, desiredTemp);
        }
    }, [unitID])

    //refresh the data regularly to check if temperature has changed (every 5000mS)
    useEffect(()=>{
        //clear any excess trackers so that only one is active at a time
        clearTimeout(activeTracker);
        //set up new tracker for current unit
        setActiveTracker(setTimeout(()=>{
            getData("temperature-1", 15);
            getData("outdoor-1", 15);
        }, 5000)); //5000 is 5 seconds, an acceptable refresh rate for sensors that update every 5 minutes
    }, [unitID, currentTemp, currentOutdoor, tempData, outdoorData])

    //if current temperature changes, update auto-mode to match
    useEffect(()=>{
        if(currentUnit.state.includes("u", 1)){
            autoCheck(unitID, desiredTemp);
        }
    }, [currentTemp])

    return(
        <div className="unitDisplay">
            <div className="unitDisplay__title">{unitName}</div>
            <div className={`unitDisplay__currentState unitDisplay__currentState--${currentUnit.state}`}>
                {currentUnit.state==="cool"&& "Cooling"}
                {currentUnit.state==="heat"&& "Heating"}
                {currentUnit.state.includes('_s',4)&& "Auto - Standby"}
                {currentUnit.state.includes('_c',4)&& "Auto - Cooling"}
                {currentUnit.state.includes('_h',4)&& "Auto - Heating"}
                {currentUnit.state.includes('f',1)&& "Off"}

            </div>
            <div className="unitDisplay__content">
                <div onClick={()=>{toggleActive()}}>
                    {currentUnit.state==="off" && "Turn On"}
                    {currentUnit.state!=="off" && "Turn Off"}
                </div>

                {currentUnit.state!=="off" &&
                <div>
                    {/* if we're in auto mode, render a temperature picker */}
                    {currentUnit.state.includes("u", 1) && 
                    <div>
                        Current Desired Temperature: <br />
                        <div onClick={()=>{setTemperature(0.25)}}>+</div>
                        {desiredTemp}
                        <div onClick={()=>{setTemperature(-0.25)}}>-</div>
                    </div>}
                    
                    <div onClick={()=>{
                        // toggleUnitState(unit, "heat");
                        setCurrentUnit({...currentUnit, state: "heat"});
                        storeUnitState({...currentUnit, state: "heat"});
                        //update the unit mode on the backend
                        Axios.patch(thermostatURL+unitID+"/", 
                            {state: "heat"}
                        );
                    }}>Heat</div>
                    <div onClick={()=>{
                        if(currentOutdoor>0){
                            setCurrentUnit({...currentUnit, state: "cool"});
                            storeUnitState({...currentUnit, state: "cool"});
                            //update the unit mode on the backend
                            Axios.patch(thermostatURL+unitID+"/", 
                                {state: "cool"}
                            );
                        } else (
                            alert("Cannot cool unit while temperatures are at or below 0 °C")
                        )
                        
                    }}>Cool</div>
                    <div onClick={()=>{
                        autoCheck(unitID, currentUnit.desiredTemp);
                    }}>Auto</div>
                </div>}
                Indoor Temperature: {currentTemp&&currentTemp.toFixed(1)}<br/>
                Outdoor Temperature: {currentOutdoor&&currentOutdoor.toFixed(1)}
            </div>
        </div>
    )
    
}