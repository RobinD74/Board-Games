import '../styles/Banner.css'
import right_dice from '../assets/right_dice.png'
import left_dice from '../assets/left_dice.png'

function Banner() {
    return (
        <header className='bg-banner'>
            <div className='bg-banner-row'>
                <img src={left_dice} alt='Dé' className='bg-dice' />
                <h1>Les Jeux de Société</h1>
                <img src={right_dice} alt='Dé' className='bg-dice' />
            </div>
            <hr className='bg-banner-separator' />
        </header>
    )
}

export default Banner