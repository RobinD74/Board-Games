import '../styles/Banner.css'
import right_dice from '../assets/right_dice.png'
import left_dice from '../assets/left_dice.png'

function Banner() {
	return (
        <div className='bg-banner'>
            <img src={left_dice} alt='Dé' className='bg-dice' />
            <h1 className=''>Les jeux de société</h1>
            <img src={right_dice} alt='Dé' className='bg-dice' />
        </div>
    )
}

export default Banner