import React from "react";
import Expraw from "./customization/Experience.json";
import "./styles/main.css";

export function Exp() {
    return (
        <>
            {Expraw.companies.map((company) => (
                <div className="edu" key={company.name}>
                    <span id="logo-block">
                        <img src={require(`${company.logo}`)} alt="company logo" />
                    </span>
                    <span className="text">
                        <p className="school">{company.name}</p>
                        <p className="pos">{company.position}</p>
                        <p className="dep">{company.position_time}</p>
                        <p className="time">{company.discription}</p>
                    </span>
                </div>
            ))}
        </>
    );
}

export default Exp;