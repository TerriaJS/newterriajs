Once you have TerriaMap up and running, you will want to make some changes to logos, labels, and colors to give your application a distinct appearance.

Here are some TerriaMap files you may want to tweak.

`wwwroot/index.html`

Change the `<title>` and the `<meta>` elements (e.g. `description`, `copyright`) to reflect your application.  You may also want to change the favicon.

`wwwroot/config.json`

Change the `appName`, `brandBarElements`, etc.  See [Client-side Config](client-side-config.md) for more information.

`lib/Styles/variables.scss`

Uncomment and tweak the SASS variables to set the main colors and fonts used throughout the application.  You will need to [rebuild TerriaMap](../getting-started.md#building-terriamap) after changing this file.

`lib/Views/global.scss`

**_(The following is no longer supported in version 8. Please discuss alternatives in [this issue](https://github.com/TerriaJS/terriajs/issues/5169))_** ~~In this file, you can override any of TerriaJS's CSS.  It contains some commented-out examples of some things you might like to change.  You can also use your browser's DOM inspector to look at elements in the TerriaJS UI and which CSS classes they use, and then override those classes as desired in this file.  You will need to [rebuild TerriaMap](../getting-started.md#building-terriamap) after changing this file.~~

`lib/Views/UserInterface.jsx`

This file creates the main user interface, using [React](https://facebook.github.io/react/).  In this file you can add extra menu items across the top of the screen, or add extra buttons to the navigation controls area on the right side of the screen.

For example, here's a version that includes an extra menu that links to terria.io, and adds the measure tool to the navigation area:

```javascript
import version from '../../version';

import StandardUserInterface from 'terriajs/lib/ReactViews/StandardUserInterface/StandardUserInterface.jsx';
import MenuItem from 'terriajs/lib/ReactViews/StandardUserInterface/customizable/MenuItem';
import RelatedMaps from './RelatedMaps';
import { Menu, Nav } from 'terriajs/lib/ReactViews/StandardUserInterface/customizable/Groups';
import MeasureTool from 'terriajs/lib/ReactViews/Map/Navigation/MeasureTool';

import './global.scss';

export default function UserInterface(props) {
    return (
        <StandardUserInterface {... props} version={version}>
            <Menu>
                <RelatedMaps viewState={props.viewState} />
                <MenuItem caption="About" href="about.html" key="about-link"/>
                <MenuItem caption="TerriaJS" href="http://terria.io" key="terria-link"/>
            </Menu>
            <Nav>
                <MeasureTool terria={props.viewState.terria} key="measure-tool"/>
            </Nav>
        </StandardUserInterface>
    );
}
```

You will need to [rebuild TerriaMap](../getting-started.md#building-terriamap) after changing this file.

`index.js`

It's not usually necessary to change this file, but it is the main entry point for TerriaMap, so you can add any extra initialization that your application needs here.  You will need to [rebuild TerriaMap](../getting-started.md#building-terriamap) after changing this file.
