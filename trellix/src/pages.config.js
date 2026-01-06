import Home from './pages/Home';
import Board from './pages/Board';
import Assistant from './pages/Assistant';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "Board": Board,
    "Assistant": Assistant,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
