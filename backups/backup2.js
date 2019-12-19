import React from "react"; //imports react app data
import ReactDOM from "react-dom"; //connects to react dom
import mapboxgl from "mapbox-gl"; //loads mapbox gl
import geoJsonData from "./us_states_shapes.json"; //loads states shapefiles
import electionData from "./presElectionResults.json"; //loads election 76 data
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy"; //loadash is a utility library that is often used for manipulating and sorting data
import Select from "@material-ui/core/Select";
import { MenuItem } from "@material-ui/core";
mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA";
//mapbox token for acccessing API
const options = [
  {
    name: "party",
    description: "Winning Party",
    property: "party",
    stops: [
      [0, "#e00e0e"],
      [1, "#0732de"]
    ]
  }
];
//so this sets the options: 0 being red, 1 being blue

class Application extends React.Component {
  map;

  constructor(props) {
    super(props);
    this.state = {
      active: options[0],
      offset: {
        x: 0,
        y: 0
      },
      activeState: null,
      activeYear: 0
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate() {
    this.setFill();
  }
  //this below mounts the map and picks default centering
  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/streets-v9",
      center: [-97, 41],
      zoom: 4
    });
    this.map.on("load", () => {
      //this is the master function that loads the map and decides how to style the layers
      //below combines the two datasets, connecting election results with the shape
      const mergeData = () => {
        geoJsonData.features.forEach(feature => {
          const electionResults = electionData.filter(result => {
            return result.state === feature.properties.name;
          });

          if (electionResults) {
            const sortedResults = sortBy(
              electionResults,
              "candidatevotes"
            ).reverse(); //so here we are reversing the array and that defaults to low to high, using the .reverse we can make it so higher is first

            const winner = sortedResults[0];
            if (winner) {
              feature.properties.party = winner.party === "republican" ? 0 : 1;
            } //this bit selects our winner, if they are republican they are assigned 0, if not 1
          }
        });
      };

      mergeData(); //calls our merged dataset

      console.log(geoJsonData); //consolelogging the shapefile data

      this.map.addSource("stateName", {
        type: "geojson",
        data: geoJsonData
      }); //loading geojson data

      this.map.addLayer({
        id: "stateName",
        type: "fill",
        source: "stateName",
        paint: {
          "fill-opacity": 0.6
        }
      }); // this is where I can style the fill layer.

      this.setFill();
    });
    //the below changes the activeState to the state under the mouse
    this.map.on("mousemove", "stateName", e => {
      const state = e.features[0].properties.name;

      this.setState({ offset: { x: e.point.x, y: e.point.y } });

      if (state !== this.state.activeState) {
        this.setState({ activeState: state });
      }
    });
  }

  setFill() {
    const { property, stops } = this.state.active;

    this.map.setPaintProperty("stateName", "fill-color", {
      property,
      stops
    });
  }

  handleClick() {}

  handleChange(e) {
    this.setState({ activeYear: e.target.value });
  }

  render() {
    const {
      name,
      description,
      stops /*property this is for the toggle switch I commented out below*/
    } = this.state.active;

    const years = uniqBy(electionData, "year").map(result => {
      return result.year;
    });

    const activeStateResults = electionData.filter(result => {
      return result.state === this.state.activeState;
    });
    const renderLegendKeys = (stop, i) => {
      return (
        <div key={i} className="txt-s">
          <span
            className="mr6 round-full w12 h12 inline-block align-middle"
            style={{ backgroundColor: stop[1] }}
          />
          <span>{`${stop[0].toLocaleString()}`}</span>
        </div> //the above needs to have a "if 0 republican else democrat sort of thing somewhere"
      );
    };

    // const renderOptions = (option, i) => {
    //   return (
    //     <label key={i} className="toggle-container">
    //       <input
    //         onChange={() => this.setState({ active: options[i] })}
    //         checked={option.property === property}
    //         name="toggle"
    //         type="radio"
    //       />
    //       <div className="toggle txt-s py3 toggle--active-white">
    //         {option.name}
    //       </div>
    //     </label>
    //   );
    // };

    const x = this.state.offset.x;
    //below we have the select button in the top right that doesnt work yet, that should grab the year,
    //the legend is below, needs work as well,
    //then there is the active state thingy, this details the state results when you glide over it with your mouse
    return (
      <div>
        <Select
          labelId="demo-simple-select-helper-label"
          id="demo-simple-select-helper"
          value={this.state.activeYear}
          onChange={this.handleChange}
          className="material-select"
        >
          {years.map(year => {
            return <MenuItem value={year}>{year}</MenuItem>;
          })}
        </Select>
        <div
          ref={el => (this.mapContainer = el)}
          className="absolute top right left bottom"
        />

        <div className="bg-white absolute bottom right mr12 mb24 py12 px12 shadow-darken10 round z1 wmax180">
          <div className="mb6">
            <h2 className="txt-bold txt-s block">{name}</h2>
            <p className="txt-s color-gray">{description}</p>
          </div>
          {stops.map(renderLegendKeys)}
        </div>
        <div
          className="active-state-details"
          style={{
            transform: `translate3d(${x - 140}px, ${this.state.offset.y +
              20}px, 0px)`
          }}
        >
          {activeStateResults.map(result => {
            return (
              <h1>
                {result.party} {result.candidate} {result.candidatevotes}{" "}
                {((result.candidatevotes / result.totalvotes) * 100).toFixed(2)}
                {"%"}
              </h1>
            );
          })}
        </div>
      </div>
    );
  }
}
//the below is the run code that makes this load in the DOM with React
ReactDOM.render(<Application />, document.getElementById("app"));
