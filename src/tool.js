import Contactraw from "./customization/Contact.json";

export function Path(props) {
    return (
		<p class="path"> 
			<span>&nbsp;<i class="fa-brands fa-apple">&nbsp;&nbsp;</i></span>
			<span>&nbsp;&nbsp;<i class="fa fa-folder-open">&nbsp;</i>{props.path}&nbsp;&nbsp;</span>
		</p>
    );
}

export function Code(props) {
    return (
        <p id="code">
            &nbsp;&gt; {props.command} <br/>
        </p>
    );
}

export function Contact() {
    return (
        <div class="contact">
            <p><i class="fa-solid fa-envelope"></i> Email: {Contactraw.email}</p>
            <p><i class="fa-solid fa-phone"></i> Phone: {Contactraw.phone}</p>
        </div>
    );
}
