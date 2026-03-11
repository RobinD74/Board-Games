import '../styles/Footer.css'

function Footer() {
	return (
		<footer className='bg-footer'>
			<div className='bg-fo-div'>
				Fait avec <span className='footer-heart'>❤️</span> par Robin — {new Date().getFullYear()}
			</div>
		</footer>
	)
}

export default Footer