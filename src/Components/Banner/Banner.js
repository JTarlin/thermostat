//styling imports
import "./Banner.scss";

//image imports
import logo from "../../Assets/parity.svg";

export default function Banner() {
    return (
        <header className="banner">
            <img src={logo} alt="parity logo" className="banner-logo" />
        </header>
    )
}