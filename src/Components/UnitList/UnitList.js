export default function UnitList(props) {
    const units = props.units;
    const select = props.select;

    const unitStack = units.map(unit=>{
        return (<div key={unit.id} onClick={()=>select(unit)}>{unit.id}</div>)
    });

    return (
        <div>
            {unitStack}
        </div>
    )
}