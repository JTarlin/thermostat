export default function UnitDisplay(props) {
    const unit = props.unit;

    return(
        <div>
            {unit.id} <br/>
            Current Mode: <br/>
            {unit.state}
        </div>
    )
    
}