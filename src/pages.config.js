/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AITraining from './pages/AITraining';
import Analytics from './pages/Analytics';
import ContentLibrary from './pages/ContentLibrary';
import CreateContent from './pages/CreateContent';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Templates from './pages/Templates';
import Trends from './pages/Trends';
import Campaigns from './pages/Campaigns';
import Schedule from './pages/Schedule';
import Automation from './pages/Automation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AITraining": AITraining,
    "Analytics": Analytics,
    "ContentLibrary": ContentLibrary,
    "CreateContent": CreateContent,
    "Home": Home,
    "Pricing": Pricing,
    "Settings": Settings,
    "Templates": Templates,
    "Trends": Trends,
    "Campaigns": Campaigns,
    "Schedule": Schedule,
    "Automation": Automation,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};