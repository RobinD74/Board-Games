import { Routes, Route } from "react-router-dom"
import Banner from "./Banner"
import Footer from "./Footer"
import GamesList from "./GamesList"
import GameDetail from "./GameDetail"
import "../styles/Layout.css"

function App() {
    return (
        <div className="bg-layout-inner">
            <Banner />
            <Routes>
                <Route path="/" element={<GamesList />} />
                <Route path="/game/:id" element={<GameDetail />} />
            </Routes>
            <Footer />
        </div>
    )
}

export default App