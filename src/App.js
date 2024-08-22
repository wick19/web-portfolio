import React from "react";
import {Intro, Edu} from "./intro";
import Tes from "./tes";
import Exp from "./exp";
import Cert from "./certification";
import Pro from "./pro";
import {Path, Code, Contact} from "./tool";
import "./styles/main.css";

const paths = ['~\Home', '~\Project', '~\Thesis', '~\Experience', '~\Certification', '~\Project'];

function Intro_content(p) {
	return (
		<div id='app'> 
			<Path path={paths[p.index-1]}/>
			<Code command='About Me'/>
			<Intro />
			<Path path={paths[p.index-1]}/>
			<Code command='Education'/>
			<Edu />
			<Path path={paths[p.index-1]}/>
			<Code command='Contact Information'/>
			<Contact />
		</div>
	);
}

function Pro_content(p) {
	return (
		<div id='app'> 
			<Path path={paths[p.index-1]}/>
			<Code command='Project'/>
			<Pro />
			<Path path={paths[p.index-1]}/>
			<Code command='Contact Information'/>
			<Contact />
		</div>
	);
}

function Tes_content(p) {
	return (
		<div id='app'> 
			<Path path={paths[p.index-1]}/>
			<Code command='Research Journal'/>
			<Tes />
			<Path path={paths[p.index-1]}/>
			<Code command='Contact Information'/>
			<Contact />
		</div>
	);
}

function Exp_content(p) {
	return (
		<div id='app'> 
			<Path path={paths[p.index-1]}/>
			<Code command='Experience'/>
			<Exp />
			<Path path={paths[p.index-1]}/>
			<Code command='Contact Information'/>
			<Contact />
		</div>
	);
}

function Cert_content(p) {
	return (
		<div id='app'> 
			<Path path={paths[p.index-1]}/>
			<Code command='Accreditation'/>
			<Cert />
			<Path path={paths[p.index-1]}/>
			<Code command='Contact Information'/>
			<Contact />
		</div>
	);
}

function App(props) {
	if (props.index == 1) {
	  return <Intro_content  index={props.index}/>;
	}
	else if (props.index == 2) {
		return <Pro_content index={props.index}/>;
	}
	else if (props.index == 3) {
		return <Tes_content index={props.index}/>;
	}
	else if (props.index == 4) {
		return <Exp_content  index={props.index}/>;
	}
	else if (props.index == 5) {
		return <Cert_content  index={props.index}/>;
	}
	// TODO : Project
	else if (props.index == 6) {
		return <Intro_content  index={props.index}/>;
	}	
}

export default App;