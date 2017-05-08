const React = require("react");

require("./Sidebar.css");
const { DOM: dom } = React;
const classnames = require("classnames");
const Svg = require("./shared/Svg")

const Sidebar = React.createClass({
  propTypes: {
    supportsFirefox: React.PropTypes.bool.isRequired,
    supportsChrome: React.PropTypes.bool.isRequired,
    title: React.PropTypes.string.isRequired,
    selectedPane: React.PropTypes.string.isRequired,
    onSideBarItemClick: React.PropTypes.func.isRequired
  },

  displayName: "Sidebar",

  renderItem(title) {
    return dom.li(
      {
        className: classnames({
          selected: title == this.props.selectedPane
        }),
        key: title,
        tabIndex: 0,
        role: "button",
        onClick: () => this.props.onSideBarItemClick(title),
        onKeyDown: e => {
          if (e.keyCode === 13) {
            this.props.onSideBarItemClick(title);
          }
        }
      },
      dom.a({}, title)
    );
  },

  render() {
    let connections = [];

    if (this.props.supportsFirefox) {
      connections.push("Firefox");
    }

    if (this.props.supportsChrome) {
      connections.push("Chrome", "Node");
    }

    return dom.aside(
      {
        className: "sidebar",
      },
      dom.div({},
        dom.h1({}, this.props.title),
        Svg("rocket")
        ),
      dom.ul({}, connections.map(title => this.renderItem(title))),
      dom.div(
        {
          className: "settings-section"
        },
        dom.ul({},this.renderItem("Settings"))
      )
    )
  }
});

module.exports = Sidebar;
