import * as React from 'react';
import { render } from "react-dom";

import EditorDemo from './EditorDemo';

const App:React.FC = ()=> <EditorDemo />

render(<App />, document.getElementById("main"));
