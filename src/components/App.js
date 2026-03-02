import GameItem from "./GameItem"
import Banner from "./Banner"
import Footer from "./Footer"
import "../styles/Layout.css"

function App() {
    return(
        <div className="bg-layout-inner">
            <Banner />
            <Footer />
        </div>
    )
}

export default App