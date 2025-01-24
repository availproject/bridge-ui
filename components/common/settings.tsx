import React, { useState } from 'react';
import { ArrowLeft, Info, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const AdvancedSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoClaim, setAutoClaim] = useState(true);
  const [slippage, setSlippage] = useState('0.5');

  return (
    <>
      <Settings 
        className="hover:text-white hover:cursor-pointer" 
        onClick={() => setIsOpen(true)}
      />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#1A1C24] border-0 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ArrowLeft 
                className="text-gray-400 hover:text-white hover:cursor-pointer" 
                onClick={() => setIsOpen(false)}
              />
              <DialogTitle className="text-lg font-medium">Advanced Settings</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-8 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-white text-md text-opacity-70 font-ppmori">
                Automatically claim on destination chain
              </span>
              <Switch 
                className='data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600'
                checked={autoClaim}
                onCheckedChange={setAutoClaim}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedSettings;