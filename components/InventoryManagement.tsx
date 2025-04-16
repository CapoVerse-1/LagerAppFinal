"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileDown, FileUp, Package, History, Plus } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import * as XLSX from 'xlsx'
import { useInventoryData, PromoterItem } from '../hooks/useInventoryData'
import styles from '../styles/inventory.module.css'
import BrandView from './BrandView'
import PromoterView from './PromoterView'
import SearchBar from './SearchBar'
import ImportDialog from './ImportDialog'
import ExportDialog from './ExportDialog'
import RestockSearchDialog from './RestockSearchDialog'
import RestockQuantityDialog from './RestockQuantityDialog'
import { ProfileMenu } from './ProfileMenu'
import AddBrandDialog from './AddBrandDialog'
import type { Employee } from '../types'
import { PinProvider } from '../contexts/PinContext'
import { useToast } from '@/hooks/use-toast'
import { recordRestock } from '@/lib/api/transactions'
import { fetchPromoterInventory } from '@/lib/api/transactions'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUser } from '@/contexts/UserContext'
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useBrands } from '@/hooks/useBrands'
import { usePromoters } from '@/hooks/usePromoters'
import { Promoter } from '@/lib/api/promoters'
import { Item } from '@/lib/api/items'

export default function InventoryManagement() {
  const {
    brands, setBrands,
    items, setItems,
    promoters, setPromoters,
    promoterItems, setPromoterItems,
    selectedBrand, setSelectedBrand,
    selectedPromoter, setSelectedPromoter,
    selectedItem, setSelectedItem,
    viewMode, setViewMode
  } = useInventoryData()

  const { toast } = useToast();
  const { currentUser } = useUser();
  useCurrentUser();
  const searchParams = useSearchParams();
  const { brands: fetchedBrands } = useBrands();
  const { promoters: fetchedPromoters } = usePromoters();

  const [importedData, setImportedData] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRestockSearchDialog, setShowRestockSearchDialog] = useState(false)
  const [showRestockQuantityDialog, setShowRestockQuantityDialog] = useState(false)
  const [selectedRestockItem, setSelectedRestockItem] = useState<Item | null>(null)
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false)

  const excelFileInputRef = useRef(null)

  // Handle URL parameters
  useEffect(() => {
    if (!searchParams) return;

    const brandId = searchParams.get('brandId');
    const itemId = searchParams.get('itemId');
    const promoterId = searchParams.get('promoterId');

    console.log('URL parameters:', { brandId, itemId, promoterId });

    // Handle brand selection
    if (brandId && fetchedBrands.length > 0) {
      const brand = fetchedBrands.find(b => b.id === brandId);
      if (brand) {
        console.log('Setting selected brand:', brand);
        setSelectedBrand(brand);
        setViewMode('brands');
      }
    }

    // Handle item selection - Let ItemList handle this based on brandId

    // Handle promoter selection
    if (promoterId && fetchedPromoters.length > 0) {
      const promoter = fetchedPromoters.find(p => p.id === promoterId);
      if (promoter) {
        console.log('Setting selected promoter:', promoter.name);
        setSelectedPromoter(promoter);
        setViewMode('promoters');
      }
    }
  }, [searchParams, fetchedBrands, fetchedPromoters, setSelectedBrand, setSelectedItem, setSelectedPromoter, setViewMode]);

  // Fetch Promoter Inventory Data
  useEffect(() => {
    const loadPromoterInventories = async () => {
      console.log("Attempting to fetch promoter inventories...");
      if (!promoters || promoters.length === 0) {
          console.log("Promoters list is empty, cannot fetch inventories.");
          setPromoterItems([]);
          return;
      }
      try {
        // Fetch inventory for each promoter and add promoter_id
        const inventoriesPromises = promoters.map(async (promoter) => {
          const inventory = await fetchPromoterInventory(promoter.id);
          // Map the results to include promoter_id and correct property names
          return inventory.map(invItem => ({
            promoter_id: promoter.id, // Add promoter ID
            item_id: invItem.itemId,     // Map to snake_case
            item_size_id: invItem.itemSizeId, // Map to snake_case
            quantity: invItem.quantity
          }));
        });
        
        const inventoriesPerPromoter = await Promise.all(inventoriesPromises);
        const allPromoterItems: PromoterItem[] = inventoriesPerPromoter.flat(); 

        console.log("Fetched promoter inventories:", allPromoterItems.length, "items total");
        setPromoterItems(allPromoterItems);
      } catch (error) {
        console.error("Error fetching promoter inventories:", error);
        toast({
          title: "Error",
          description: "Failed to load promoter inventory data.",
          variant: "destructive",
        });
        setPromoterItems([]); 
      }
    };

    loadPromoterInventories();
  }, [promoters, setPromoterItems, toast]);

  const handleRestockSearch = (searchTerm: string) => {
    setShowRestockSearchDialog(true)
  }

  const handleRestockSelect = (item: Item) => {
    setSelectedRestockItem(item)
    setShowRestockSearchDialog(false)
    setShowRestockQuantityDialog(true)
  }

  const handleRestockConfirm = async (itemSizeId: string, quantity: number, handledBy: string) => {
    if (!selectedRestockItem) {
       toast({ title: "Error", description: "No item selected for restock.", variant: "destructive" });
       return;
    }
    if (!itemSizeId) {
       toast({ title: "Error", description: "No size selected for restock.", variant: "destructive" });
       return;
    }
    try {
      await recordRestock({ 
         itemId: selectedRestockItem.id,
         itemSizeId: itemSizeId,
         quantity: quantity, 
         employeeId: handledBy
      });
      toast({
        title: "Lagerbestand aufgefüllt",
        description: `${quantity} Einheiten von ${selectedRestockItem.name} wurden hinzugefügt.`,
      })
      setShowRestockQuantityDialog(false)
      setSelectedRestockItem(null);
    } catch (error) {
      console.error("Error restocking item:", error)
      toast({
        title: "Fehler",
        description: "Beim Auffüllen des Lagerbestands ist ein Fehler aufgetreten.",
        variant: "destructive",
      })
    }
  }

  return (
      <div className={`container mx-auto p-4 ${styles.container}`}>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-4">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="hidden font-bold sm:inline-block">
                  JTI Inventory Management
                </span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  href="/inventory"
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    usePathname() === "/inventory" ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  Inventory
                </Link>
                <Link
                  href="/transactions"
                  className={cn(
                    "transition-colors hover:text-foreground/80 flex items-center",
                    usePathname() === "/transactions" ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <History className="mr-1 h-4 w-4" />
                  Transaktionen
                </Link>
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="flex items-center space-x-2">
                <ExportDialog />
                <ImportDialog />
              </div>
              <ProfileMenu />
            </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2 md:w-1/3">
            <Button
              variant={viewMode === 'brands' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('brands')
                setSelectedPromoter(null)
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              Marken & Artikel
            </Button>
            <Button
              variant={viewMode === 'promoters' ? 'default' : 'outline'}
              onClick={() => {
                setViewMode('promoters')
                setSelectedBrand(null)
              }}
            >
              <History className="mr-2 h-4 w-4" />
              Promotoren
            </Button>
          </div>
          
          <div className="flex justify-center md:w-1/3">
            <SearchBar />
          </div>
          
          <div className="flex justify-end md:w-1/3">
          </div>
        </div>

        {viewMode === 'brands' ? (
          <BrandView
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            promoters={promoters}
            setPromoters={setPromoters}
            promoterItems={promoterItems}
            setPromoterItems={setPromoterItems}
          />
        ) : (
          <PromoterView
            promoterItems={promoterItems}
            setPromoterItems={setPromoterItems}
            selectedPromoter={selectedPromoter}
            setSelectedPromoter={setSelectedPromoter}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            items={items}
            setItems={setItems}
          />
        )}

        {showConfirmDialog && (
          <ExportDialog
            onClose={() => setShowConfirmDialog(false)}
          />
        )}

        {showRestockSearchDialog && (
          <RestockSearchDialog
            onClose={() => setShowRestockSearchDialog(false)}
            onSelect={handleRestockSelect}
            items={items}
          />
        )}

        {showRestockQuantityDialog && selectedRestockItem && (
          <RestockQuantityDialog
            item={selectedRestockItem}
            showDialog={showRestockQuantityDialog}
            setShowDialog={setShowRestockQuantityDialog}
            onConfirm={handleRestockConfirm}
            onClose={() => {
                setShowRestockQuantityDialog(false);
                setSelectedRestockItem(null);
            }}
          />
        )}

        {showAddBrandDialog && (
          <AddBrandDialog
            showDialog={showAddBrandDialog}
            setShowDialog={setShowAddBrandDialog}
          />
        )}
      </div>
  )
}

