'use client'

import React from 'react'
import { 
  Coins, 
  Gem, 
  Car, 
  Home, 
  Banknote, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  Wallet,
  Sparkles
} from 'lucide-react'

export default function FloatingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(8deg); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-8deg); }
        }
        @keyframes float-slow-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(4deg); }
        }
        .animate-float-slow-1 { animation: float-slow-1 7s ease-in-out infinite; }
        .animate-float-slow-2 { animation: float-slow-2 9s ease-in-out infinite; }
        .animate-float-slow-3 { animation: float-slow-3 8s ease-in-out infinite; }
      `}</style>
      
      {/* Coins Icon - Top Left */}
      <div className="absolute top-10 left-4 opacity-[0.08] animate-float-slow-1 text-emerald-600">
        <Coins className="w-12 h-12" />
      </div>
      
      {/* Gem Icon - Top Right */}
      <div className="absolute top-32 right-6 opacity-[0.07] animate-float-slow-2 text-amber-500">
        <Gem className="w-10 h-10" />
      </div>
      
      {/* Car Icon - Left Middle */}
      <div className="absolute top-1/3 left-10 opacity-[0.08] animate-float-slow-3 text-blue-500">
        <Car className="w-12 h-12" />
      </div>
      
      {/* Home Icon - Right Middle */}
      <div className="absolute top-1/2 right-8 opacity-[0.06] animate-float-slow-1 text-indigo-500">
        <Home className="w-14 h-14" />
      </div>
      
      {/* Banknote Icon - Bottom Left */}
      <div className="absolute bottom-40 left-8 opacity-[0.07] animate-float-slow-2 text-emerald-600">
        <Banknote className="w-12 h-12" />
      </div>
      
      {/* Sparkles Icon - Bottom Right */}
      <div className="absolute bottom-24 right-12 opacity-[0.08] animate-float-slow-3 text-amber-500">
        <Sparkles className="w-10 h-10" />
      </div>
      
      {/* Shopping Bag Icon - Top Center-ish */}
      <div className="absolute top-24 left-[45%] opacity-[0.06] animate-float-slow-2 text-rose-500">
        <ShoppingBag className="w-9 h-9" />
      </div>
      
      {/* Credit Card Icon - Bottom Center-ish */}
      <div className="absolute bottom-1/3 left-1/3 opacity-[0.07] animate-float-slow-1 text-purple-500">
        <CreditCard className="w-11 h-11" />
      </div>

      {/* Wallet Icon - Mid-Right */}
      <div className="absolute top-2/3 right-12 opacity-[0.07] animate-float-slow-3 text-emerald-500">
        <Wallet className="w-11 h-11" />
      </div>

      {/* Trending Up Icon - Bottom Left-ish */}
      <div className="absolute bottom-12 left-6 opacity-[0.07] animate-float-slow-2 text-teal-500">
        <TrendingUp className="w-9 h-9" />
      </div>
    </div>
  )
}
