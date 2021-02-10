import "./UnitList.scss";

export default function UnitList(props) {
    console.log("unitlist re-render");
    const units = props.units;
    const select = props.select;

    const unitStack = units.map(unit=>{
        return (<div key={unit.id} onClick={()=>select(unit)} className={"unitList__item"}>{unit.name}</div>)
    });

    return (
        <div className="unitList__box">
            {unitStack}
        </div>
    )
}