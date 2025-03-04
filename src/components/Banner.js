import '../styles/Banner.css'
import logo from '../assets/'

function Banner() {
	return (
        <div>
            <img src={logo} alt='Jeux de sociétés' className='' />
            <h1 className=''>Les jeux de société</h1>
        </div>
    )
}

export default Banner