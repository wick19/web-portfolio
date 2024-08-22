import React from "react";
import Tesraw from "./customization/Thesis.json";
import "./styles/main.css";


export function Tes() {
    const journal = [];
    Tesraw.journal.map((paper) => {
        journal.push(
            <li><span>
                <b>{paper.description}</b><br/>
                <a href={paper.link} target="_blank"  rel="noreferrer">[Paper]</a>
            </span></li>
        );
    });

    return (
        
        <div class="tes-list">
			<p>Machine Learning-Based Path loss Models For the UAV Air-to-Air (A2A) Prediction</p>
			<ul>
				{journal}
			</ul>

		</div>
    );
}

export default Tes;