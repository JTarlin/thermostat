export default function UnitList(props) {
    console.log("unitlist re-render");
    const units = props.units;
    const select = props.select;

    const unitStack = units.map(unit=>{
        return (<div key={unit} onClick={()=>select(unit)}>{unit}</div>)
    });

    return (
        <div>
            {unitStack}
        </div>
    )
}