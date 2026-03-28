import React from "react";
import Proraw from "./customization/Project.json";
import "./styles/main.css";


export function Pro() {
    return (
        <div className="pro">
            {Proraw.projects.map((project) => (
                <React.Fragment key={project.project_name}>
                    <div className="probox">
                        <img src={require(`${project.project_img}`)} alt="project" />
                        <div className="pro-content">
                            <div className="pro-title">{project.project_name}</div>
                            <div className="pro-about">{project.project_about}</div>
                            <div className="pro-bottom">
                                <span className="pro-tool">Tools: {project.project_tool}</span>
                                <span className="pro-link">
                                    <a target="_blank" href={project.project_link} rel="noreferrer">
                                        <i className="fa-brands fa-github"></i>
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>
                    <br />
                </React.Fragment>
            ))}
        </div>
    );
}

export default Pro;