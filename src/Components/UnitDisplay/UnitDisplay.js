//dependency imports
import Axios from "axios";
import {useEffect, useState} from "react";

//api url for sensors
const sensorURL = "http://api-staging.paritygo.com/sensors/api/sensors/";

export default function UnitDisplay(props) {
    const unitID = props.unitID;
    console.log("re-render the unitdisplay for unit ", unitID);
    //the unit being displayed is held in state
    const [currentUnit, setCurrentUnit] = useState({id: unitID, desiredTemp: 25, state: "off"});

    if(currentUnit){console.log("the currentUnit for ", unitID, " is ", currentUnit)};

    //we will often want to save the current unit's state to local storage to persist data
    //input state of type {id: string, state: string, desiredTemp: number}
    const storeUnitState = (unitState)=>{
        console.log("storeUnitState called");
        let storageSnapshot = JSON.parse(localStorage.getItem("unitInfo"));
        if(storageSnapshot){
            console.log("storage snapshot exists");
            //store the state and desiredTemp values into the storage snapshot
            storageSnapshot[unitState.id] = {state: unitState.state, setTemp: unitState.desiredTemp};
        } else {
            console.log("storage snapshot does not exist, here's what we get: ", storageSnapshot);
            console.log("heres the unparsed stored unitInfo: ", localStorage.getItem("unitInfo"));
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
        console.log("toggle active running:", currentUnit);
        if(currentUnit.state==="off") {
            //if we were turned off, set mode to auto by default (determine which auto type in the autocheck fn)
            autoCheck();
        }
        else {
            console.log("setting mode to off");
            setCurrentUnit({...currentUnit, state: "off"});
            storeUnitState({id: currentUnit.id, desiredTemp: currentUnit.desiredTemp, state: "off"});
        }
    }

    const autoCheck = ()=>{
        console.log("at the start of autocheck the state is this:", currentUnit);
        // if its hot, cool
        if(currentTemp>currentUnit.desiredTemp){
            //we won't cool if it's less than 0 C outside
            if(currentOutdoor>0){
                console.log("autocheck setting mode to auto_cool");
                setCurrentUnit({...currentUnit, state: "auto_cool"});
                storeUnitState({id: currentUnit.id, state: "auto_cool", desiredTemp: currentUnit.desiredTemp});
                setTimeout(()=>{console.log("autocheck set currentUnit to: ", currentUnit)}, 1000);
            } else {
                console.log("autocheck setting mode to auto_standby");
                setCurrentUnit({...currentUnit, state: "Auto_standby"});
                storeUnitState({id: currentUnit.id, state: "Auto_standby", desiredTemp: currentUnit.desiredTemp});
                setTimeout(()=>{console.log("autocheck set currentUnit to: ", currentUnit)}, 1000);
            }
        } else if (currentTemp<currentUnit.desiredTemp){ //if its cold, heat
            console.log("autocheck setting mode to auto_heat");
            setCurrentUnit({...currentUnit, state: "auto_heat"});
            storeUnitState({id: currentUnit.id, state: "auto_heat", desiredTemp: currentUnit.desiredTemp});
            setTimeout(()=>{console.log("autocheck set currentUnit to: ", currentUnit)}, 1000);
        } else { //if its exactly what we want, stand by
            console.log("autocheck setting mode to auto_standby");
            setCurrentUnit({...currentUnit, state: "Auto_standby"});
            storeUnitState({id: currentUnit.id, state: "Auto_standby", desiredTemp: currentUnit.desiredTemp});
            setTimeout(()=>{console.log("autocheck set currentUnit to: ", currentUnit)}, 1000);
        }
    }

    //when a new unit is loaded reset the data grabber
    useEffect(()=> {
        console.log("the changed unitID is registered, useEffect is running");
        console.log("useEffect sees the current unit state as ", currentUnit, " (before changes)");
        if(activeTracker) {clearInterval(activeTracker)}; //if there is an active tracker when we switch units, clear it
        //grab a first data point for each measurement
        getData("temperature-1", 15);
        getData("outdoor-1", 15);
        //set up new tracker for current unit
        setActiveTracker(setInterval(()=>{
            getData("temperature-1", 15);
            getData("outdoor-1", 15);
        }, 60000)); //60000 is 1 minute, an acceptable refresh rate for sensors that update every 5 minutes

        //if we switch to a new unit, we load that unit's data from storage if any
        if(currentUnit.id!==unitID){
            //now load stored data into the state
            const storedUnitInfo = JSON.parse(localStorage.getItem("unitInfo"));
            let storedUnitData;
            if(storedUnitInfo && storedUnitInfo[unitID] && storedUnitInfo[unitID].state && storedUnitInfo[unitID].setTemp){
                //if there is data about this unit stored locally, retrieve it!
                storedUnitData = {id: unitID, state: storedUnitInfo[unitID].state, desiredTemp: storedUnitInfo[unitID].setTemp};
                setCurrentUnit(storedUnitData);
            } else {
                //there was no stored data, setting current unit to default settings
                storeUnitState({id: unitID, desiredTemp: 25, state: "off"});
                setCurrentUnit({id: unitID, desiredTemp: 25, state: "off"});
            }
        } else {
            //this is the initial component render and there was no stored data, setting current unit to default settings
            storeUnitState({id: unitID, desiredTemp: 25, state: "off"});
            setCurrentUnit({id: unitID, desiredTemp: 25, state: "off"});
        }
    }, [unitID])

    return(
        <div>
            {currentUnit.id} <br/>
            {currentUnit.state} <br/>
            <div onClick={()=>{toggleActive()}}>
                {currentUnit.state==="off" && "Turn On"}
                {currentUnit.state!=="off" && "Turn Off"}
            </div>
            {currentUnit.state!=="off" &&
            <div>
                <div>
                    Current Desired Temperature: <br />
                    <div onClick={()=>{console.log("increasing temp by 1")}}>+</div>
                    {currentUnit.desiredTemp}
                    <div onClick={()=>{console.log("decreasing temp by 1")}}>-</div>
                </div>
                <div onClick={()=>{
                    // toggleUnitState(unit, "heat");
                    setCurrentUnit({...currentUnit, state: "heat"});
                    console.log("set current unit state to heating");
                }}>Heat</div>
                <div onClick={()=>{
                    setCurrentUnit({...currentUnit, state: "cool"});
                    console.log("set current unit state to cool");
                }}>Cool</div>
                <div onClick={()=>{
                    console.log("set current unit state to auto");
                    setCurrentUnit({...currentUnit, state: "Auto_standby"});
                    autoCheck();
                }}>Auto</div>
            </div>}
            Indoor Temperature: {currentTemp}<br/>
            Outdoor Temperature: {currentOutdoor}
        </div>
    )
    
}