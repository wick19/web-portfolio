import App from "./App";
import "./styles/main.css";
import React, { Component } from 'react';
 
function Menu() {
    return (
        <div className="menu">
            <div className="buttons-flex">
                <div className="button bg-red"></div>
                <div className="button bg-yellow"></div>
                <div className="button bg-green"></div>
            </div>
            <div className="title">
                <h1>
                    <i className="fa fa-folder fa-lg">
                        <style> { "\
                            .fa-folder {\
                                color: #6094ee;\
                            }\
                        "}</style>
                    </i> 
                    &nbsp;root@Ritwik-Home-Page
                </h1>
            </div>
            <div className="buttons-flex2">
                &#8997;&#8984;1
            </div>
        </div>
    );
  }

class Container extends Component {
    constructor() {
        super();
        const value = localStorage.getItem('index');
        this.state = {Index: value == null ? 1 : Number(value)};
      }
 
    goPage(index) {
        const nextIndex = Number(index);
        this.setState(() => {
            localStorage.setItem('index', nextIndex);
            return {Index: nextIndex};
        });
    }


    render() {
        return (
            <div className="container">
                <Menu />
                <div className="nav">
                    <button className={Number(this.state.Index) === 1 ? 'active': null} onClick={() => this.goPage(1)}>
                        <span>~/Home</span>
                        <span className="left-command">
                            &#8984;1
                        </span>
                    </button>
                    <button className={Number(this.state.Index) === 2 ? 'active': null} onClick={() => this.goPage(2)}>
                        <span>~/Project</span>
                        <span className="left-command">
                            &#8984;2
                        </span>
                    </button> 
                    <button className={Number(this.state.Index) === 3 ? 'active': null} onClick={() => this.goPage(3)}>
                        <span>~/Thesis</span>
                        <span className="left-command">
                            &#8984;3
                        </span>
                    </button> 
                    <button className={Number(this.state.Index) === 4 ? 'active': null} onClick={() => this.goPage(4)}>
                        <span>~/Experience</span>
                        <span className="left-command">
                            &#8984;4
                        </span>
                    </button>
                    <button className={Number(this.state.Index) === 5 ? 'active': null} onClick={() => this.goPage(5)}>
                        <span>~/Certification</span>
                        <span className="left-command">
                            &#8984;5
                        </span>
                    </button>
                </div>
                <App index={this.state.Index}/>
            </div>
        );
    }
}


export default Container;