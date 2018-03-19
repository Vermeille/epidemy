const React = require('react');
const ReactDOM = require('react-dom');

const Status = {
    Healthy: 0,
    Vaxxed: 1,
    Contaminated: 2,
    Dead: 3,
};

function bestRect(x) {
    let res = {};
    res.rows = Math.ceil(Math.sqrt(x) / 2);
    res.cols = Math.floor(x / res.rows);
    res.rest = x - res.cols * res.rows;
    return res;
}

function makeGrid(x) {
    let rect = bestRect(x);
    let grid = new Array(rect.rows);
    for (let r = 0; r < rect.rows; ++r) {
        let line = new Array(rect.cols);
        for (let c = 0; c < rect.cols; ++c) {
            line[c] = Status.Healthy;
        }
        grid[r] = line;
    }

    if (rect.rest) {
        grid.push(new Array(rect.rest).fill(Status.Healthy));
    }

    return grid;
}

function neighbors(x, i, j) {
    let n = [];
    for (let y = 0; y < 9; ++y) {
        let v = x[i - 1 + Math.floor(y / 3)];
        v = v ? v[j - 1 + Math.floor(y % 3)] : undefined;
        if (v !== undefined) {
            n.push(v);
        }
    }
    return n;
}

function cloneGrid(grid) {
    return makeGrid(
        (grid.length - 1) * grid[0].length + grid[grid.length - 1].length,
    );
}

function update(grid, probs) {
    let ng = cloneGrid(grid);
    for (let i = 0; i < grid.length; ++i) {
        for (let j = 0; j < grid[i].length; ++j) {
            switch (grid[i][j]) {
                case Status.Healthy:
                    let ns = neighbors(grid, i, j);
                    let conts = ns.filter(x => x == Status.Contaminated).length;
                    let isCont = 1 - Math.pow(1 - probs.contamination, conts);
                    ng[i][j] =
                        Math.random() < isCont
                            ? Status.Contaminated
                            : Status.Healthy;
                    break;
                case Status.Contaminated:
                    ng[i][j] =
                        Math.random() < probs.remission
                            ? Status.Vaxxed
                            : Status.Contaminated;
                    ng[i][j] =
                        Math.random() < probs.death
                            ? Status.Dead
                            : Status.Contaminated;
                    break;
                default:
                    ng[i][j] = grid[i][j];
                    break;
            }
        }
    }
    return ng;
}

function initGrid(probs) {
    let g = makeGrid(probs.population);
    for (let i = 0; i < g.length; ++i) {
        for (let j = 0; j < g[i].length; ++j) {
            if (Math.random() < probs.contaminated) {
                g[i][j] = Status.Contaminated;
            } else if (Math.random() < probs.vaxxed) {
                g[i][j] = Status.Vaxxed;
            }
        }
    }
    return g;
}

const InitParams = props => (
    <div>
        <label>
            Population size:
            <input
                type="range"
                min={1}
                max={4000}
                value={props.population}
                onChange={e => props.onPopulationChange(e.target.value)}
            />
            {props.population}
        </label>
        <br />
        <label>
            Initial contamination ratio:
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={props.contaminated}
                onChange={e => props.onContaminatedChange(e.target.value)}
            />
            ({props.contaminated * 100}%)
        </label>
        <br />
        <label>
            Contamination probability:
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={props.contamination}
                onChange={e => props.onContaminationChange(e.target.value)}
            />
            ({props.contamination * 100}%)
        </label>
        <br />
        <label>
            Remission probability:
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={props.remission}
                onChange={e => props.onRemissionChange(e.target.value)}
            />
            ({props.remission * 100}%)
        </label>
        <br />
        <label>
            Death probability:
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={props.death}
                onChange={e => props.onDeathChange(e.target.value)}
            />
            ({props.death * 100}%)
        </label>
        <br />
        <label>
            Vaccination ratio:
            <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={props.vaxxed}
                onChange={e => props.onVaxxedChange(e.target.value)}
            />
            ({props.vaxxed * 100}%)
        </label>
        <br />
        <button onClick={props.onSubmit}>Go</button>
    </div>
);

const Person = ({health}) => {
    if (health == Status.Healthy) {
        return (
            <img
                src="http://mzayat.com/images/person-clip-art-person-clip-art-510_598.png"
                height="16"
                width="16"
            />
        );
    } else if (health === Status.Contaminated) {
        return (
            <img
                src="http://mzayat.com/images/nice-person-clipart-fuschia-person-clip-art-person-clip-art-255_299.png"
                height="16"
                width="16"
            />
        );
    } else if (health === Status.Vaxxed) {
        return (
            <img
                src="http://clipart-library.com/data_images/175608.png"
                height="16"
                width="16"
            />
        );
    } else if (health === Status.Dead) {
        return (
            <img
                src="http://cliparting.com/wp-content/uploads/2016/05/Blue-cross-clip-art-clipart-image-1.jpeg"
                height="16"
                width="16"
            />
        );
    }
    return health;
};

const Grid = ({grid}) => (
    <div>
        {grid.map(line => <div>{line.map(x => <Person health={x} />)}</div>)}
    </div>
);

class Init extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contaminated: 0.05,
            vaxxed: 0.7,
            population: 1000,
            contamination: 0.95,
            remission: 0,
            death: 0.1,
            day: 0,
        };
        this.state.grid = initGrid(this.state);

        this.regen = this.regen.bind(this);
        this.update = this.update.bind(this);
    }

    regen() {
        window.clearInterval(this.interval);
        this.setState({grid: initGrid(this.state), day: 0});
    }

    update() {
        this.interval = window.setInterval(() => {
            this.setState({
                grid: update(this.state.grid, this.state),
                day: this.state.day + 1,
            });
        }, 1000);
    }

    render() {
        return (
            <div>
                <div style={{float: 'right'}}>
                    <InitParams
                        population={this.state.population}
                        onPopulationChange={e =>
                            this.setState({population: e}, this.regen)
                        }
                        contaminated={this.state.contaminated}
                        onContaminatedChange={e =>
                            this.setState({contaminated: e}, this.regen)
                        }
                        contamination={this.state.contamination}
                        onContaminationChange={e =>
                            this.setState({contamination: e}, this.regen)
                        }
                        vaxxed={this.state.vaxxed}
                        onVaxxedChange={e =>
                            this.setState({vaxxed: e}, this.regen)
                        }
                        remission={this.state.remission}
                        onRemissionChange={e =>
                            this.setState({remission: e}, this.regen)
                        }
                        death={this.state.death}
                        onDeathChange={e =>
                            this.setState({death: e}, this.regen)
                        }
                        onSubmit={this.update}
                    />
                    <Person health={Status.Healthy} />Healthy<br/>
                    <Person health={Status.Contaminated} />Contaminated<br/>
                    <Person health={Status.Vaxxed} />Vaccinated<br/>
                    <Person health={Status.Dead} />Dead<br/>
                    <div>
                        Each day:
                        <lu>
                            <li>
                                A healthy person might get contaminated by its
                                neighbors
                            </li><li>
                                A contaminated person might either recover or die
                            </li><li>
                                Vaccinated persons are not affected
                            </li>
                        </lu>
                    </div>
                </div>
                <h1>Day {this.state.day}</h1>
                <Grid grid={this.state.grid} />
            </div>
        );
    }
}

ReactDOM.render(<Init />, document.getElementById('main'));
