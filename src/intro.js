import React from "react";
import head from "./img/pp.jpeg";
import "./styles/main.css";
import Introraw from './customization/Introduction.json'
import Eduraw from './customization/Education.json'


export function ReadIntro() {
    return (
        <span className="text blcok-long">
            {Introraw.intro}
            <p>
                <a target="_blank" href={Introraw.github} rel="noreferrer"><i className="fa-brands fa-github"></i></a>
                <a target="_blank" href={Introraw.linkedin} rel="noreferrer"><i className="fa-brands fa-linkedin"></i></a>
            </p>
        </span>
    );
}

export function Intro() {
    return (
        <div className="intro">
            <span id="blcok">
                <img src={head} alt="Portrait" />
            </span>
            <ReadIntro />
        </div>
    );
}

export function Edu() {
    return (
        <>
            {Eduraw.schools.map((school) => (
                <div className="edu" key={school.name}>
                    <span id="logo-block">
                        <img src={require(`${school.logo}`)} alt="school" />
                    </span>
                    <span className="text">
                        <p className="school">{school.name}</p>
                        <p className="dep">{school.degree}</p>
                        <p className="loc">{school.location}</p>
                        <p className="time">{school.time}</p>
                    </span>
                </div>
            ))}
        </>
    );
}