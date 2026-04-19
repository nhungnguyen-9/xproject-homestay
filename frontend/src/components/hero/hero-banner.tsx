export function HeroBanner() {
  return (
    <section className="w-full px-0 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl shadow-sm">
        <img
          src="images/HeroImage.png"
          alt="Nhà Cam Homestay"
          className="w-full h-full block"
          loading="eager"
          decoding="sync"
        />
      </div>
    </section>
  )
}
