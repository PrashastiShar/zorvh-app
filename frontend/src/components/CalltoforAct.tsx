const CallToAction = () => {
  return (
    <section className="w-full py-20 px-4 md:px-16 bg-gradient-to-r from-futuristic-pink to-futuristic-purple
                        text-white text-center rounded-xl my-24 shadow-2xl animate-[glow_2s_ease-in-out_infinite_alternate]">
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-3xl sm:text-5xl font-display font-bold mb-6">
          Ready to Elevate Your Wardrobe?
        </h2>
        <p className="text-lg sm:text-xl mb-10 opacity-90">
          Join the SynthThreads revolution. Explore exclusive drops and limited editions that define tomorrow's fashion.
        </p>
        <button className="bg-futuristic-gold text-futuristic-gray py-3 px-10 rounded-full text-xl font-bold
                           hover:scale-105 transition-transform duration-300 ease-out
                           shadow-lg hover:shadow-futuristic-gold/60">
          Explore Collections
        </button>
      </div>
    </section>
  );
};

export default CallToAction;