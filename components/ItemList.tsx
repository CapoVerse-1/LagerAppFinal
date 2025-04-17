import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreVertical, Edit, Trash, EyeOff, Flame, History, Pin, Loader2, ArrowUpFromLine, ArrowDownToLine, Package, ListChecks, Link2Off } from 'lucide-react'
import Image from "next/image"
import EditItemDialog from './EditItemDialog'
import BurnItemDialog from './BurnItemDialog'
import ItemHistoryDialog from './ItemHistoryDialog'
import TakeOutDialog from './TakeOutDialog'
import ReturnDialog from './ReturnDialog'
import RestockQuantityDialog from './RestockQuantityDialog'
import { useUser } from '../contexts/UserContext'
import { usePinned } from '../hooks/usePinned'
import { useItems, ItemWithSizeCount } from '@/hooks/useItems'
import { useToast } from '@/hooks/use-toast'
import { fetchAllItemSizesForBrand, fetchItemSizes, ItemSize } from '@/lib/api/items'
import { useTransactions } from '@/hooks/useTransactions'
import { Promoter } from '@/lib/api/promoters'
import { recordTakeOut, recordReturn, recordBurn } from '@/lib/api/transactions'
import PromoterSelector from './PromoterSelector'
import { supabase } from '@/lib/supabase'
import DeleteConfirmDialog from './DeleteConfirmDialog'

interface ItemListProps {
  brandId: string;
  selectedItem: ItemWithSizeCount | null;
  setSelectedItem: (item: ItemWithSizeCount | null) => void;
  promoters: Promoter[];
  setPromoters: (promoters: Promoter[]) => void;
  promoterItems: any[];
  setPromoterItems: (items: any[]) => void;
}

export default function ItemList({ 
  brandId, 
  selectedItem, 
  setSelectedItem, 
  promoters, 
  setPromoters, 
  promoterItems, 
  setPromoterItems
}: ItemListProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const { 
    items, 
    loading, 
    error, 
    toggleActive, 
    removeItem,
    refreshItems,
    stopSharingItem
  } = useItems(brandId);
  
  const [editingItem, setEditingItem] = useState<ItemWithSizeCount | null>(null)
  const [burningItem, setBurningItem] = useState<ItemWithSizeCount | null>(null)
  const [takingOutItem, setTakingOutItem] = useState<ItemWithSizeCount | null>(null)
  const [returningItem, setReturningItem] = useState<ItemWithSizeCount | null>(null)
  const [restockingItem, setRestockingItem] = useState<ItemWithSizeCount | null>(null)
  const [itemChanges, setItemChanges] = useState<Record<string, any>>({})
  const [showDropdown, setShowDropdown] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<ItemWithSizeCount | null>(null)
  const [itemSizes, setItemSizes] = useState<Record<string, ItemSize[]>>({})
  const [loadingSizes, setLoadingSizes] = useState(false)
  const [sizesError, setSizesError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mass editing state
  const [isMassEditMode, setIsMassEditMode] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<{[key: string]: { sizeId: string; quantity: number }}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the usePinned hook for sorting and pinning functionality
  const { sortedItems, togglePin, isPinned } = usePinned(items.map(item => ({
    ...item,
    id: item.id,
    isActive: item.is_active
  })), 'item');

  // Fetch all item sizes for the brand at once
  const loadSizes = useCallback(async () => {
    if (!brandId || !items.length) return;
    
    try {
      setLoadingSizes(true);
      setSizesError(null);
      
      const allSizes = await fetchAllItemSizesForBrand(brandId);
      
      // Organize sizes by item ID
      const sizesByItem: Record<string, ItemSize[]> = {};
      allSizes.forEach(size => {
        if (!sizesByItem[size.item_id]) {
          sizesByItem[size.item_id] = [];
        }
        sizesByItem[size.item_id].push(size);
      });
      
      setItemSizes(sizesByItem);
    } catch (error) {
      console.error("Error fetching item sizes:", error);
      setSizesError(error instanceof Error ? error.message : "Failed to load item sizes");
      toast({
        title: "Error",
        description: "Failed to load item sizes.",
        variant: "destructive",
      });
    } finally {
      setLoadingSizes(false);
    }
  }, [brandId, items.length, toast]);
  
  // Load sizes when items change
  useEffect(() => {
    if (brandId && items.length > 0) {
      loadSizes();
    }
  }, [brandId, items.length, loadSizes]);

  // Replace the problematic useEffect with a function that's called only when the toggle button is clicked
  const toggleMassEditMode = useCallback(() => {
    const newMode = !isMassEditMode;
    
    if (!newMode) {
      // Reset state when turning off mass edit mode
      setSelectedPromoter(null);
      setSelectedAction(null);
      setItemQuantities({});
    } else if (items.length > 0 && Object.keys(itemSizes).length > 0) {
      // Initialize state when turning on mass edit mode
      const newItemQuantities: {[key: string]: { sizeId: string; quantity: number }} = {};
      
      items.forEach(item => {
        const sizes = itemSizes[item.id] || [];
        if (sizes.length === 1) {
          newItemQuantities[item.id] = {
            quantity: 0,
            sizeId: sizes[0].id
          };
        }
      });
      
      if (Object.keys(newItemQuantities).length > 0) {
        setItemQuantities(newItemQuantities);
      }
    }
    
    // Set the mode last
    setIsMassEditMode(newMode);
  }, [isMassEditMode, items, itemSizes]);

  const handleEdit = (item: ItemWithSizeCount) => {
    setEditingItem(item)
  }

  const handleDeleteClick = (item: ItemWithSizeCount) => {
    setItemToDelete(item);
    setShowDeleteConfirmDialog(true);
  }

  const handleDelete = async (id: string) => {
    try {
      await removeItem(id);
      toast({
        title: "Erfolg",
        description: "Artikel wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Fehler beim Löschen des Artikels.",
        variant: "destructive",
      });
    }
    setShowDeleteConfirmDialog(false);
    setItemToDelete(null);
  }

  const handleToggleInactive = async (id: string) => {
    try {
      await toggleActive(id);
      toast({
        title: "Success",
        description: "Item status updated.",
      });
    } catch (error) {
      console.error("Error toggling item status:", error);
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  }

  const handleTogglePin = (id: string) => {
    togglePin(id);
  }

  const handleBurn = (item: ItemWithSizeCount) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    setBurningItem(item);
  }

  const handleTakeOut = (item: ItemWithSizeCount) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    setTakingOutItem(item);
  }

  const handleReturn = (item: ItemWithSizeCount) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    setReturningItem(item);
  }

  const handleRestock = (item: ItemWithSizeCount) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    setRestockingItem(item);
  }

  const handleQuantityChange = (item: ItemWithSizeCount, action: string) => {
    if (!item || !item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    // This is now handled by the specific dialog components
    switch (action) {
      case 'take-out':
        handleTakeOut(item);
        break;
      case 'return':
        handleReturn(item);
        break;
      case 'burn':
        handleBurn(item);
        break;
      case 'restock':
        handleRestock(item);
        break;
      default:
        break;
    }
  }

  const handleShowHistory = (item: ItemWithSizeCount) => {
    if (!item.id) {
      toast({
        title: "Error",
        description: "Invalid item.",
        variant: "destructive",
      });
      return;
    }
    setSelectedItemForHistory(item);
    setShowHistoryDialog(true);
  }

  const handleTransactionSuccess = () => {
    // Prevent multiple refreshes in quick succession
    if (isRefreshing) {
      console.log('ItemList - Refresh already in progress, skipping');
      return;
    }

    console.log('ItemList - handleTransactionSuccess called');
    console.log('ItemList - Before refreshItems');
    
    setIsRefreshing(true);
    refreshItems()
      .then(() => {
        console.log('ItemList - After refreshItems');
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('ItemList - Error refreshing items:', error);
        setIsRefreshing(false);
      });
  };

  // Handle quantity change for an item in mass edit mode
  const handleMassEditQuantityChange = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity
      }
    }));
  };

  // Handle size change for an item in mass edit mode
  const handleMassEditSizeChange = (itemId: string, sizeId: string) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        sizeId
      }
    }));
  };

  // Handle mass edit confirmation
  const handleMassEditConfirm = async () => {
    if (!selectedAction || !selectedPromoter?.id || !currentUser?.id) { 
      toast({
        title: "Error",
        description: "Please select an action, a promoter, and ensure you are logged in.",
        variant: "destructive",
      });
      return;
    }

    const promoterId = selectedPromoter.id; 
    const employeeId = currentUser.id;

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const itemIdInLoop in itemQuantities) {
        const { sizeId, quantity } = itemQuantities[itemIdInLoop];
        if (quantity <= 0) continue; // Skip items with 0 quantity

        try {
          switch (selectedAction) {
            case 'take-out':
              await recordTakeOut({
                itemId: itemIdInLoop,
                itemSizeId: sizeId,
                quantity,
                promoterId: promoterId,
                employeeId: employeeId,
                notes: `Mass edit operation`
              });
              break;
            case 'return':
              await recordReturn({
                itemId: itemIdInLoop,
                itemSizeId: sizeId,
                quantity,
                promoterId: promoterId,
                employeeId: employeeId,
                notes: `Mass edit operation`
              });
              break;
            case 'burn':
              await recordBurn({
                itemId: itemIdInLoop,
                itemSizeId: sizeId,
                quantity,
                promoterId: promoterId,
                employeeId: employeeId,
                notes: `Mass edit operation`
              });
              break;
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing item ${itemIdInLoop}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Success",
        description: `Successfully processed ${successCount} items. ${errorCount} items encountered errors.`,
      });

      // Reset state
      setItemQuantities({});
      handleTransactionSuccess();
    } catch (error) {
      console.error("Error in mass edit:", error);
      toast({
        title: "Error",
        description: "Failed to process some items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemWithSizeCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading || loadingSizes) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading items...</span>
      </div>
    );
  }

  if (error || sizesError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h3 className="font-semibold">Error loading items</h3>
        <p>{error?.message || sizesError}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isMassEditMode ? "default" : "outline"}
            onClick={toggleMassEditMode}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Massenbearbeitung
          </Button>
        </div>
        {isMassEditMode && (
          <div className="flex items-center gap-2">
            <Select value={selectedAction || ""} onValueChange={(value: any) => setSelectedAction(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Aktion wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="take-out" className="text-red-500">Take Out</SelectItem>
                <SelectItem value="return" className="text-green-500">Return</SelectItem>
                <SelectItem value="burn">Burn</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-[200px]">
              <PromoterSelector
                value={selectedPromoter?.id || ''}
                onChange={(promoter) => {
                  console.log("[ItemList] PromoterSelector onChange received promoter:", promoter);
                  setSelectedPromoter(promoter);
                  console.log("[ItemList] setSelectedPromoter called."); 
                }}
                placeholder="Promoter wählen"
                includeInactive={selectedAction === 'return'}
              />
            </div>
            <Button
              onClick={handleMassEditConfirm}
              disabled={isSubmitting || !selectedAction || !selectedPromoter || Object.values(itemQuantities).every(q => q.quantity <= 0)}
              className={`
                ${selectedAction === 'take-out' ? 'border-2 border-red-500 bg-transparent hover:bg-transparent hover:border-red-600 text-red-500 hover:text-red-600' : ''}
                ${selectedAction === 'return' ? 'border-2 border-green-500 bg-transparent hover:bg-transparent hover:border-green-600 text-green-500 hover:text-green-600' : ''}
                ${!selectedAction ? '' : ''}
              `}
            >
              {isSubmitting ? 'Wird verarbeitet...' : 'Bestätigen'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {sortedItems.map((item) => (
          <Card key={item.id} className={`overflow-hidden ${!item.isActive ? 'opacity-60' : ''} transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary`}>
            <CardContent className="p-0">
              <div className="relative">
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <Image 
                      src={item.image_url} 
                      alt={item.name} 
                      width={160} 
                      height={160} 
                      className="object-contain h-full w-full transition-transform duration-300 hover:scale-110"
                    />
                  ) : (
                    <div className="text-gray-400 text-xl">No Image</div>
                  )}
                  {isPinned(item.id) && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                      <Pin size={16} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500 truncate">ID: {item.product_id}</p>
                    </div>
                    {!isMassEditMode && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {item.is_shared_instance && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopSharingItem(item.id); 
                            }}
                            title="Stop sharing this item in this brand"
                          >
                            <Link2Off size={16} />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="bottom" alignOffset={-5} sideOffset={5}>
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="mr-2" size={16} />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleInactive(item.id)}>
                              <EyeOff className="mr-2" size={16} />
                              {item.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePin(item.id)}>
                              <Pin className="mr-2" size={16} />
                              {isPinned(item.id) ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowHistory(item)}>
                              <History className="mr-2" size={16} />
                              History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(item);
                            }}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Löschen</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Original:</p>
                      <p>{item.quantities?.originalQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Available:</p>
                      <p>{item.quantities?.availableQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">In Circulation:</p>
                      <p>{item.quantities?.inCirculation || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total:</p>
                      <p>{item.quantities?.totalQuantity || 0}</p>
                    </div>
                  </div>
                  
                  {isMassEditMode ? (
                    <div className="mt-4 space-y-2">
                      {(itemSizes[item.id]?.length || 0) > 1 ? (
                        <Select 
                          value={itemQuantities[item.id]?.sizeId || ""} 
                          onValueChange={(value) => handleMassEditSizeChange(item.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Größe wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {(itemSizes[item.id] || []).map((size) => (
                              <SelectItem key={size.id} value={size.id}>
                                {size.size} ({selectedAction === 'take-out' ? 
                                  `Verfügbar: ${size.available_quantity}` : 
                                  `Im Umlauf: ${size.in_circulation}`})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {itemSizes[item.id]?.[0]?.size || 'Einheitsgröße'}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={(() => {
                            const size = itemSizes[item.id]?.find(s => s.id === itemQuantities[item.id]?.sizeId);
                            if (!size) return 0;
                            return selectedAction === 'take-out' ? size.available_quantity :
                                   selectedAction === 'return' || selectedAction === 'burn' ? size.in_circulation : 0;
                          })()}
                          value={itemQuantities[item.id]?.quantity || ''}
                          onChange={(e) => handleMassEditQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          placeholder="Menge"
                          disabled={!selectedAction || !selectedPromoter || !itemQuantities[item.id]?.sizeId ||
                                  (selectedAction === 'take-out' && 
                                   (itemSizes[item.id]?.find(s => s.id === itemQuantities[item.id]?.sizeId)?.available_quantity || 0) <= 0) ||
                                  ((selectedAction === 'return' || selectedAction === 'burn') && 
                                   (itemSizes[item.id]?.find(s => s.id === itemQuantities[item.id]?.sizeId)?.in_circulation || 0) <= 0)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuantityChange(item, 'take-out')}
                        disabled={!item.isActive || (item.quantities?.availableQuantity || 0) <= 0}
                        className="border-2 border-red-500 bg-transparent hover:bg-transparent hover:border-red-600 text-red-500 hover:text-red-600"
                      >
                        <ArrowUpFromLine className="mr-1" size={14} />
                        Take Out
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuantityChange(item, 'return')}
                        disabled={!item.isActive || (item.quantities?.inCirculation || 0) <= 0}
                        className="border-2 border-green-500 bg-transparent hover:bg-transparent hover:border-green-600 text-green-500 hover:text-green-600"
                      >
                        <ArrowDownToLine className="mr-1" size={14} />
                        Return
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuantityChange(item, 'burn')}
                        disabled={!item.isActive || (item.quantities?.inCirculation || 0) <= 0}
                      >
                        <Flame className="mr-1" size={14} />
                        Burn
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuantityChange(item, 'restock')}
                        disabled={!item.isActive}
                      >
                        <Package className="mr-1" size={14} />
                        Restock
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <EditItemDialog 
          item={editingItem} 
          setEditingItem={setEditingItem} 
          brandId={brandId}
        />
      )}

      {/* Burn Dialog */}
      {burningItem && (
        <BurnItemDialog 
          item={burningItem} 
          setBurningItem={setBurningItem} 
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* Take Out Dialog */}
      {takingOutItem && (
        <TakeOutDialog 
          item={takingOutItem} 
          setTakingOutItem={setTakingOutItem} 
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* Return Dialog */}
      {returningItem && (
        <ReturnDialog 
          item={returningItem} 
          setReturningItem={setReturningItem} 
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* Restock Dialog */}
      {restockingItem && (
        <RestockQuantityDialog 
          item={restockingItem} 
          showDialog={!!restockingItem} 
          setShowDialog={(show) => !show && setRestockingItem(null)} 
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* History Dialog */}
      {showHistoryDialog && selectedItemForHistory && (
        <ItemHistoryDialog 
          item={selectedItemForHistory} 
          setShowHistoryDialog={setShowHistoryDialog}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="col-span-full flex justify-center items-center p-8">
          <Loader2 className="animate-spin mr-2" />
          <span>Loading items...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedItems.length === 0 && (
        <div className="col-span-full text-center p-8 text-gray-500">
          No items found for this brand. Add some items to get started.
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="col-span-full text-center p-8 text-red-500">
          Error loading items: {error ? String(error) : "Unknown error"}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={() => itemToDelete && handleDelete(itemToDelete.id)}
        title="Artikel löschen"
        description="Sind Sie sicher, dass Sie diesen Artikel löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        itemName={itemToDelete?.name}
        isDeleting={isDeleting}
      />
    </>
  )
}

