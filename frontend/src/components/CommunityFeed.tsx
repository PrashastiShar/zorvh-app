import Image from 'next/image';
import { Heart, MessageSquare } from 'lucide-react';

const communityPosts = [
  { id: 1, user: '@cyber_chic', avatar: '/avatars/avatar-1.webp', imageUrl: '/ugc/ugc-1.webp', likes: 124, comments: 12, caption: 'Loving my new Neo-Glow jacket! ✨ #SynthThreads #FutureFashion' },
  { id: 2, user: '@tech_wear_fan', avatar: '/avatars/avatar-2.webp', imageUrl: '/ugc/ugc-2.webp', likes: 89, comments: 8, caption: 'Cybernetic Hoodie is so comfy. Perfect for late-night coding sessions. 💻 #GenZStyle' },
  { id: 3, user: '@digital_dreamer', avatar: '/avatars/avatar-3.webp', imageUrl: '/ugc/ugc-3.webp', likes: 201, comments: 25, caption: 'Quantum Knit Tee adapts to everything! So innovative. 🚀 #ImmersiveWear' },
  { id: 4, user: '@future_stylist', avatar: '/avatars/avatar-4.webp', imageUrl: '/ugc/ugc-4.webp', likes: 150, comments: 18, caption: 'Styling the latest from SynthThreads. Obsessed with the aesthetic. 💖 #FashionTech' },
];

const CommunityFeed = () => {
  return (
    <section className="w-full py-20 px-4 md:px-16 bg-futuristic-gray text-futuristic-light-gray">
      <h2 className="text-3xl sm:text-5xl font-display font-bold text-center mb-16
                     bg-clip-text text-transparent bg-gradient-to-r from-futuristic-gold to-futuristic-green
                     animate-fade-in-up">
        Join the #SynthThreads Community
      </h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {communityPosts.map((post) => (
          <div key={post.id} className="bg-futuristic-gray border border-futuristic-blue/20 rounded-xl overflow-hidden shadow-lg
                                       hover:shadow-futuristic-blue/40 transition-shadow duration-300 group">
            <div className="relative w-full h-64 overflow-hidden">
              <Image
                src={post.imageUrl}
                alt={`Community post by ${post.user}`}
                fill
                style={{ objectFit: 'cover' }}
                className="transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="flex items-center text-white text-sm">
                  <Image src={post.avatar} alt={post.user} width={32} height={32} className="rounded-full mr-2 border border-white/50" />
                  <span className="font-semibold">{post.user}</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm mb-3 text-futuristic-light-gray/90">{post.caption}</p>
              <div className="flex items-center text-sm text-futuristic-light-gray/70">
                <Heart size={16} className="mr-1 text-futuristic-pink" /> {post.likes}
                <MessageSquare size={16} className="ml-4 mr-1 text-futuristic-blue" /> {post.comments}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <button className="bg-futuristic-green text-futuristic-gray py-3 px-8 rounded-full text-lg font-semibold
                           hover:bg-futuristic-pink transition-colors duration-300">
          Share Your Style
        </button>
      </div>
    </section>
  );
};

export default CommunityFeed;