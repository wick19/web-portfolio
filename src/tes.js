import React from "react";
import Tesraw from "./customization/Thesis.json";
import "./styles/main.css";


export function Tes() {
    return (
        <div className="tes-list">
            <p>Machine Learning-Based Path loss Models For the UAV Air-to-Air (A2A) Prediction</p>
            <ul>
                {Tesraw.journal.map((paper) => (
                    <li key={paper.link}>
                        <span>
                            <b>{paper.description}</b><br />
                            <a href={paper.link} target="_blank" rel="noreferrer">[Paper]</a>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Tes;