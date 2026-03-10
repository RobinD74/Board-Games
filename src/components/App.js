import Banner from "./Banner"
import Footer from "./Footer"
import GamesList from "./GamesList"
import "../styles/Layout.css"

function App() {
    return (
        <div className="bg-layout-inner">
            <Banner />
            <GamesList />
            <Footer />
        </div>
    )
}

export default App