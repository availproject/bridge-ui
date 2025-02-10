import React, { useState } from 'react';
import { ArrowLeft, Info, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const AdvancedSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoClaim, setAutoClaim] = useState(false);

  return (
    <>
      <Settings 
        className="hover:text-white hover:cursor-pointer" 
        onClick={() => setIsOpen(true)}
      />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#1A1C24] border-0 text-white w-1/3 [&>div[role=dialog]]:backdrop-blur-sm">
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
          <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex justify-between items-center opacity-50">
            <span className="text-white text-md text-opacity-70 font-ppmori">
              Automatically claim on destination <br />
              chain wherever possible
            </span>
            <Switch
              className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
              checked={autoClaim}
              onCheckedChange={setAutoClaim}
              disabled
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black border-none text-white px-2 py-1 rounded">
          <p>Coming soon 👀</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedSettings;