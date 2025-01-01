'use client'

import React, { useState } from 'react';
import { HiOutlineSwitchVertical } from 'react-icons/hi';
import { useCommonStore } from '@/stores/common';
import useEthWallet from '@/hooks/common/useEthWallet';

const ChainSwapBtn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setFromChain, setToChain, fromChain, toChain } = useCommonStore();
  const { validateandSwitchChain } = useEthWallet();

  const handleSwitch = async () => {
    setIsLoading(true);
    try {
      setFromChain(toChain);
      setToChain(fromChain);
      await validateandSwitchChain(toChain);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <HiOutlineSwitchVertical
        onClick={handleSwitch}
        className={`h-12 w-12 md:bg-[#3A3E4A] transform transition-transform duration-1000 hover:p-2.5 p-3 rounded-xl mx-auto cursor-pointer relative z-10 ${
          isLoading ? 'animate-spin opacity-50' : ''
        }`}
      />
    </div>
  );
};

export default ChainSwapBtn;