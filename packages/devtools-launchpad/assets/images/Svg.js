const React = require("react");
const InlineSVG = require("svg-inline-react");

const svg = {
  rocket: require("./rocket.svg"),
};

module.exports = function(name, props) {
  // eslint-disable-line
  if (!svg[name]) {
    throw new Error("Unknown SVG: " + name);
  }
  let className = name;
  if (props && props.className) {
    className = `${name} ${props.className}`;
  }
  if (name === "subSettings") {
    className = "";
  }
  props = Object.assign({}, props, { className, src: svg[name] });
  return React.createElement(InlineSVG, props);
};
