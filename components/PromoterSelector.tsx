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
  onChange: (value: string) => void;
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

  // Handle promoter selection directly
  const handleSelectPromoter = (promoterId: string) => {
    onChange(promoterId);
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
          <Command>
            {loading ? (
              <div className="py-6 text-center">
                <Spinner className="mx-auto" />
              </div>
            ) : (
              <>
                <CommandGroup className="max-h-[250px] overflow-y-auto">
                  {filteredPromoters.map((promoter) => (
                    <CommandItem
                      key={promoter.id}
                      value={promoter.id}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full",
                        !promoter.is_active ? "opacity-70" : ""
                      )}
                    >
                      <span>
                        {promoter.name} {!promoter.is_active && " (Inaktiv)"}
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === promoter.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
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