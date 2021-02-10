import "./UnitList.scss";

export default function UnitList(props) {
    const units = props.units;
    const select = props.select;
    const selected = props.selectedUnit;

    const unitStack = units.map(unit=>{
        if(unit.id===selected.id){
            return (<div key={unit.id} onClick={()=>select(unit)} className={"unitList__item unitList__item--selected"}>{unit.name}</div>)
        } else {
            return (<div key={unit.id} onClick={()=>select(unit)} className={"unitList__item"}>{unit.name}</div>)
        }
        
    });

    return (
        <div className="unitList__box">
            {unitStack}
        </div>
    )
}