import React from "react";
import Certraw from "./customization/Certification.json";
import "./styles/main.css";

export function Cert() {
    const result = [];
    Certraw.Certifications.map((Certification) => {
        result.push(
            <div>
                <p><a href={"https://www.hackerrank.com/certificates/d6cc8996eda7"} target="_blank" rel="noreferrer">{Certification.entry1}</a>
                <a href={"https://www.hackerrank.com/certificates/0aaa58019fb5"} target="_blank" rel="noreferrer">{Certification.entry2}</a>
                <a href={"https://www.hackerrank.com/certificates/cb01d714138b"} target="_blank" rel="noreferrer">{Certification.entry3}</a>
                <a href={"https://drive.google.com/file/d/1xDQA2_KqiG9qkTOc_TSkAwqNdbnxfw3c/view?usp=sharing"} target="_blank" rel="noreferrer">{Certification.entry4}</a>
                <a href={"https://drive.google.com/file/d/1EQfJNSdV5l8oy_c4D7mTaoMJUTFBxIBN/view"} target="_blank" rel="noreferrer">{Certification.entry5}</a>
                <a href={"https://drive.google.com/file/d/12GyUSoWjIYm7wmaXNtxkd0vm2sLPK0a0/view"} target="_blank" rel="noreferrer">{Certification.entry6}</a>
                <a href={"https://drive.google.com/file/d/1Y_AxUA4C6wo4NPjEmZitF80NeB4tu3st/view"} target="_blank" rel="noreferrer">{Certification.entry7}</a></p>
            </div>
            
        );
    });

    return (
        <div class="tes-list">
        {result}
        </div>
    );
}

export default Cert;