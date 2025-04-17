import { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePromoters } from '@/hooks/usePromoters';
import { Promoter } from '@/lib/api/promoters';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddPromoterDialog from './AddPromoterDialog';

interface PromoterSelectorProps {
  value: string;
  onChange: (promoter: Promoter | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeInactive?: boolean;
}

export default function PromoterSelector({
  value,
  onChange,
  placeholder = "Promoter auswählen",
  className,
  disabled = false,
  includeInactive = false
}: PromoterSelectorProps) {
  const [open, setOpen] = useState(false);
  const { promoters, loading, addPromoter, refreshPromoters } = usePromoters();
  
  // Debug: Log props and promoters
  useEffect(() => {
    console.log('PromoterSelector props:', { value, disabled, includeInactive });
    console.log('All promoters:', promoters);
  }, [value, disabled, includeInactive, promoters]);
  
  // Filter promoters based on active status
  const filteredPromoters = promoters
    .filter(p => includeInactive || p.is_active);
    
  // Debug: Log filtered promoters
  useEffect(() => {
    console.log('Filtered promoters:', filteredPromoters);
  }, [filteredPromoters]);

  // Handle adding a new promoter
  const handleAddPromoter = async (name: string, photoFile: File | null) => {
    await addPromoter(name, photoFile);
    await refreshPromoters();
  };
  
  // Debug: Log when dropdown opens/closes
  useEffect(() => {
    console.log('Dropdown open state:', open);
  }, [open]);

  // Handle promoter selection - find the object and pass it back
  const handleSelectPromoter = (promoterId: string) => {
    const foundPromoter = promoters.find(p => p.id === promoterId);
    onChange(foundPromoter || null); // Pass the object or null
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            onClick={() => console.log('Dropdown trigger clicked, disabled:', disabled)}
          >
            {value ? (
              promoters.find((promoter) => promoter.id === value)?.name
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 overflow-hidden">
          <Command className="p-0">
            {loading ? (
              <div className="py-6 text-center">
                <Spinner className="mx-auto" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {/* Empty content, no message shown */}
                </CommandEmpty>
                {/* Add max-height and overflow for scrolling */}
                <CommandGroup className="max-h-[250px] overflow-y-auto p-1">
                  {filteredPromoters.map((promoter) => (
                    <div 
                      key={promoter.id}
                      className={cn(
                        "flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        "text-foreground",
                        !promoter.is_active ? "opacity-70" : ""
                      )}
                      onClick={() => handleSelectPromoter(promoter.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === promoter.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {promoter.name} {!promoter.is_active && " (Inaktiv)"}
                    </div>
                  ))}
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Promoter Dialog can remain if triggered by an external button, 
          but it's not needed for the dropdown itself */}
       {/* 
      {showAddDialog && (
        <AddPromoterDialog 
          // Remove props as the component usage is commented out
          // open={showAddDialog}
          // onOpenChange={setShowAddDialog}
          // onAddPromoter={handleAddPromoter} 
        />
      )}
      */}
    </div>
  );
} 