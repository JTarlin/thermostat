//dependency imports
import Axios from "axios";
import {useEffect, useState} from "react";

//api url for sensors
const sensorURL = "http://api-staging.paritygo.com/sensors/api/sensors/";

export default function UnitDisplay(props) {
    //get the basic unit info from props
    const unit = props.unit;

    //use state to hold the responses from api calls
    const [tempData, setTempData] = useState(null);
    const [outdoorData, setOutdoorData] = useState(null);
    const [currentTemp, setCurrentTemp] = useState(null);
    const [currentOutdoor, setCurrentOutdoor] = useState(null);
    const [activeTracker, setActiveTracker] = useState(null);

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

    //when a new unit is loaded reset the data grabber
    useEffect(()=> {
        if(activeTracker) {clearInterval(activeTracker)}; //if there is an active tracker when we switch units, clear it
        //grab a first data point for each measurement
        getData("temperature-1", 15);
        getData("outdoor-1", 15);
        //set up new tracker for current unit
        setActiveTracker(setInterval(()=>{
            getData("temperature-1", 15);
            getData("outdoor-1", 15);
        }, 3000)); //60000 is 1 minute, an acceptable refresh rate for sensors that update every 5 minutes
    }, [unit.id])

    return(
        <div>
            {unit.id} <br/>
            {unit.state}
            {currentTemp}
            {currentOutdoor}
        </div>
    )
    
}